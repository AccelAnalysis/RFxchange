import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { RfxResponseCollaborationError } from "@/src/domain/rfx/collaboration";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";
import {
  createServerRfxResponseCollaborationService,
  type RfxCollaborationActor,
} from "@/src/infrastructure/rfx/rfx-response-collaboration-runtime";

export const runtime = "nodejs";

async function actor(): Promise<RfxCollaborationActor | NextResponse> {
  const access = await resolveParticipantRoute({
    sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind !== "authorized" || access.state.lifecycleState !== "open-platform") {
    return NextResponse.json(
      { error: "RFx collaboration is unavailable." },
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
  const status = error instanceof RfxResponseCollaborationError
    ? error.code === "forbidden" ? 403
      : error.code === "not-found" ? 404
        : error.code === "conflict" ? 409
          : error.code === "dependency-unavailable" ? 503
            : 400
    : 500;
  return apiProblem(request, {
    status,
    code: error instanceof RfxResponseCollaborationError ? error.code : "dependency-unavailable",
    participantMessage: status === 403
      ? "This response collaboration action has not been granted to the current organization."
      : status === 409
        ? "The shared response or collaboration assignment changed. Refresh and try again."
        : status === 404
          ? "The response collaboration record is unavailable."
          : status === 400
            ? "The collaboration action is incomplete or unsupported."
            : "RFx collaboration is temporarily unavailable.",
    cause: error,
  });
}

export async function GET(request: NextRequest) {
  try {
    const participant = await actor();
    if (participant instanceof NextResponse) return participant;
    const workspace = await createServerRfxResponseCollaborationService().workspace(participant, {
      reference: request.nextUrl.searchParams.get("reference") ?? "",
      leadOrganizationId: request.nextUrl.searchParams.get("lead"),
    });
    return NextResponse.json(workspace, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return problem(request, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
    if (Number(request.headers.get("content-length") ?? "0") > 262_144) {
      return NextResponse.json({ error: "RFx collaboration body is too large." }, { status: 413 });
    }
    const participant = await actor();
    if (participant instanceof NextResponse) return participant;
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? "");
    const service = createServerRfxResponseCollaborationService();

    if (action === "assign-section") {
      const assignment = await service.assign(participant, {
        reference: String(body.reference ?? ""),
        participationId: String(body.participationId ?? ""),
        sectionId: String(body.sectionId ?? ""),
        responsibilitySummary: String(body.responsibilitySummary ?? ""),
      });
      return NextResponse.json({ assignment }, { status: 201, headers: { "cache-control": "no-store" } });
    }
    if (action === "revoke-assignment") {
      const assignment = await service.revoke(participant, {
        assignmentId: String(body.assignmentId ?? ""),
        expectedVersion: Number(body.expectedVersion),
      });
      return NextResponse.json({ assignment }, { headers: { "cache-control": "no-store" } });
    }
    if (action === "save-contribution") {
      const response = await service.saveContributorItem(participant, {
        reference: String(body.reference ?? ""),
        leadOrganizationId: String(body.leadOrganizationId ?? ""),
        expectedVersion: Number(body.expectedVersion),
        item: body.item && typeof body.item === "object" && !Array.isArray(body.item)
          ? body.item as Parameters<typeof service.saveContributorItem>[1]["item"]
          : { sectionId: "" },
      });
      return NextResponse.json({ response }, { headers: { "cache-control": "no-store" } });
    }

    return NextResponse.json({ error: "Unsupported RFx collaboration action." }, { status: 400 });
  } catch (error) {
    return problem(request, error);
  }
}
