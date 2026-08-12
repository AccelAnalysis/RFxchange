import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { OpportunityPursuitError } from "@/src/application/rfx/opportunity-pursuit-service";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";
import { createServerOpportunityPursuitService } from "@/src/infrastructure/rfx/opportunity-pursuit-runtime";

export const runtime = "nodejs";

async function scope() {
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind !== "authorized" || access.state.lifecycleState !== "open-platform") return NextResponse.json({ error: "Opportunity pursuit is unavailable." }, { status: access.kind === "unauthenticated" ? 401 : 403 });
  return Object.freeze({ context: access.context, organizationId: access.membership.organizationId, userId: access.context.user.id, membershipId: access.membership.id });
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  try { return Boolean(origin && (origin === request.nextUrl.origin || (host && new URL(origin).host === host))); } catch { return false; }
}

function problem(request: NextRequest, error: unknown) {
  const status = error instanceof OpportunityPursuitError
    ? error.code === "forbidden" ? 403 : error.code === "not-found" ? 404 : error.code === "conflict" ? 409 : error.code === "dependency-unavailable" ? 503 : 400
    : 500;
  return apiProblem(request, { status, code: error instanceof OpportunityPursuitError ? error.code : "dependency-unavailable", participantMessage: status === 409 ? "The opportunity or organization fit changed. Review the current facts and try again." : status === 403 ? "Pursuit management is unavailable for this organization membership." : status === 404 ? "The requested opportunity is unavailable." : status === 400 ? "The pursuit request contains unsupported information." : "Pursuit management is temporarily unavailable.", cause: error });
}

export async function GET(request: NextRequest) {
  try {
    const participant = await scope();
    if (participant instanceof NextResponse) return participant;
    const result = await createServerOpportunityPursuitService().workspace(participant, request.nextUrl.searchParams.get("reference") ?? "");
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return problem(request, error); }
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
    if (Number(request.headers.get("content-length") ?? "0") > 65_536) return NextResponse.json({ error: "Pursuit request body is too large." }, { status: 413 });
    const participant = await scope();
    if (participant instanceof NextResponse) return participant;
    const body = await request.json() as Record<string, unknown>;
    const result = await createServerOpportunityPursuitService().save(participant, {
      commandId: String(body.commandId ?? ""), reference: String(body.reference ?? ""),
      expectedVersion: body.expectedVersion === null || body.expectedVersion === undefined ? null : Number(body.expectedVersion),
      expectedFitSnapshotId: String(body.expectedFitSnapshotId ?? ""), decision: String(body.decision ?? ""),
      assessment: body.assessment && typeof body.assessment === "object" && !Array.isArray(body.assessment) ? body.assessment as never : {},
      gapResolutions: body.gapResolutions && typeof body.gapResolutions === "object" && !Array.isArray(body.gapResolutions) ? body.gapResolutions as Record<string, string> : {},
    });
    return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
  } catch (error) { return problem(request, error); }
}
