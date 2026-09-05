import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { RfxCycleError } from "@/src/domain/rfx/cycle";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";
import { createServerRfxCycleService, type RfxCycleActor } from "@/src/infrastructure/rfx/rfx-cycle-runtime";

export const runtime = "nodejs";

async function actor(): Promise<RfxCycleActor | NextResponse> {
  const access = await resolveParticipantRoute({
    sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind !== "authorized" || access.state.lifecycleState !== "open-platform") {
    return NextResponse.json(
      { error: "RFx workspace is unavailable." },
      { status: access.kind === "unauthenticated" ? 401 : 403 },
    );
  }
  return Object.freeze({
    context: access.context,
    organizationId: access.membership.organizationId,
    membershipId: access.membership.id,
    userId: access.context.user.id,
  });
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  try {
    return Boolean(origin && (origin === request.nextUrl.origin || (host && new URL(origin).host === host)));
  } catch {
    return false;
  }
}

function problem(request: NextRequest, error: unknown) {
  const status = error instanceof RfxCycleError
    ? error.code === "forbidden" ? 403
      : error.code === "not-found" ? 404
        : error.code === "conflict" ? 409
          : error.code === "dependency-unavailable" ? 503
            : 400
    : 500;
  const participantMessage = status === 409
    ? "The RFx, response, or review changed. Refresh the current task and try again."
    : status === 403
      ? "This RFx action is not available for the current organization membership."
      : status === 404
        ? "The requested RFx record is unavailable."
        : status === 400
          ? "The RFx action contains unsupported or incomplete information."
          : "The RFx workflow is temporarily unavailable.";
  return apiProblem(request, {
    status,
    code: error instanceof RfxCycleError ? error.code : "dependency-unavailable",
    participantMessage,
    cause: error,
  });
}

export async function GET(request: NextRequest) {
  try {
    const participant = await actor();
    if (participant instanceof NextResponse) return participant;
    const service = createServerRfxCycleService();
    const mode = request.nextUrl.searchParams.get("mode") ?? "responder";
    if (mode === "issuer") {
      const rfxId = request.nextUrl.searchParams.get("rfxId") ?? "";
      const workspace = await service.issuerWorkspace(participant, rfxId);
      return NextResponse.json(workspace, { headers: { "cache-control": "private, no-store" } });
    }
    const reference = request.nextUrl.searchParams.get("reference") ?? "";
    const workspace = await service.responderWorkspace(participant, reference);
    return NextResponse.json(workspace, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return problem(request, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) {
      return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
    }
    if (Number(request.headers.get("content-length") ?? "0") > 524_288) {
      return NextResponse.json({ error: "RFx action body is too large." }, { status: 413 });
    }
    const participant = await actor();
    if (participant instanceof NextResponse) return participant;
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? "");
    const service = createServerRfxCycleService();

    if (action === "start-response") {
      const response = await service.startResponse(participant, String(body.reference ?? ""));
      return NextResponse.json({ response }, { status: 201, headers: { "cache-control": "no-store" } });
    }
    if (action === "save-response-item") {
      const result = await service.saveResponseItem(participant, {
        reference: String(body.reference ?? ""),
        expectedVersion: Number(body.expectedVersion),
        item: body.item && typeof body.item === "object" && !Array.isArray(body.item)
          ? body.item as Parameters<typeof service.saveResponseItem>[1]["item"]
          : { sectionId: "" },
        acknowledgedAddendumIds: Array.isArray(body.acknowledgedAddendumIds)
          ? body.acknowledgedAddendumIds.map(String)
          : undefined,
      });
      return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
    }
    if (action === "submit-response") {
      const result = await service.submit(participant, {
        reference: String(body.reference ?? ""),
        expectedVersion: Number(body.expectedVersion),
      });
      return NextResponse.json(result, { status: result.replayed ? 200 : 201, headers: { "cache-control": "no-store" } });
    }
    if (action === "ask-question") {
      const result = await service.askQuestion(participant, {
        commandId: String(body.commandId ?? ""),
        reference: String(body.reference ?? ""),
        question: String(body.question ?? ""),
      });
      return NextResponse.json(result, { status: result.replayed ? 200 : 201, headers: { "cache-control": "no-store" } });
    }
    if (action === "answer-question") {
      const question = await service.answerQuestion(participant, {
        questionId: String(body.questionId ?? ""),
        answer: String(body.answer ?? ""),
      });
      return NextResponse.json({ question }, { headers: { "cache-control": "no-store" } });
    }
    if (action === "issue-addendum") {
      const result = await service.issueAddendum(participant, {
        commandId: String(body.commandId ?? ""),
        rfxId: String(body.rfxId ?? ""),
        title: String(body.title ?? ""),
        body: String(body.body ?? ""),
        requiresAcknowledgment: body.requiresAcknowledgment === true,
      });
      return NextResponse.json(result, { status: result.replayed ? 200 : 201, headers: { "cache-control": "no-store" } });
    }
    if (action === "save-evaluation") {
      const evaluation = await service.saveEvaluationReview(participant, {
        responseId: String(body.responseId ?? ""),
        factorInputs: Array.isArray(body.factorInputs)
          ? body.factorInputs.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)).map((item) => ({
              factorId: String(item.factorId ?? ""),
              gate: typeof item.gate === "string" ? item.gate : undefined,
              scoreBasisPoints: item.scoreBasisPoints === null || item.scoreBasisPoints === undefined ? null : Number(item.scoreBasisPoints),
              note: typeof item.note === "string" ? item.note : "",
            }))
          : [],
        overallNote: String(body.overallNote ?? ""),
      });
      return NextResponse.json({ evaluation }, { headers: { "cache-control": "no-store" } });
    }
    if (action === "decide") {
      const decision = body.decision === "selected" ? "selected" : body.decision === "not-selected" ? "not-selected" : null;
      if (!decision) return NextResponse.json({ error: "A supported selection decision is required." }, { status: 400 });
      const result = await service.decide(participant, {
        responseId: String(body.responseId ?? ""),
        expectedVersion: Number(body.expectedVersion),
        decision,
        consensusNote: String(body.consensusNote ?? ""),
        connectionNote: String(body.connectionNote ?? ""),
      });
      return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
    }
    if (action === "update-outcome") {
      const status = body.status === "connected" || body.status === "executing" || body.status === "completed" ? body.status : null;
      if (!status) return NextResponse.json({ error: "A supported execution status is required." }, { status: 400 });
      const outcome = await service.updateOutcome(participant, {
        outcomeId: String(body.outcomeId ?? ""),
        expectedVersion: Number(body.expectedVersion),
        status,
        executionNote: String(body.executionNote ?? ""),
        outcomeSummary: String(body.outcomeSummary ?? ""),
        outcomeValue: String(body.outcomeValue ?? ""),
      });
      return NextResponse.json({ outcome }, { headers: { "cache-control": "no-store" } });
    }

    return NextResponse.json({ error: "Unsupported RFx action." }, { status: 400 });
  } catch (error) {
    return problem(request, error);
  }
}
