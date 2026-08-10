import { NextRequest, NextResponse } from "next/server";

import { InterpretationGatewayError } from "@/src/application/ai-interpretation/gateway";
import type { InterpretationDispositionInput } from "@/src/domain/ai-interpretation/model";
import { createServerAiAmacsInterpretationGateway } from "@/src/infrastructure/ai-interpretation/runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 16_384) return NextResponse.json({ error: "Disposition request is too large." }, { status: 413 });
  const body = await request.json().catch(() => null) as null | Readonly<{ organizationId?: unknown; recordId?: unknown; candidateId?: unknown; expectedUpdatedAt?: unknown; decision?: unknown }>;
  if (!body || typeof body.organizationId !== "string" || typeof body.recordId !== "string" || !body.decision || typeof body.decision !== "object") return NextResponse.json({ error: "Organization, record, and decision are required." }, { status: 400 });
  try {
    const access = await resolveParticipantRoute({ sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value, requestedOrganizationId: body.organizationId });
    if (access.kind === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (access.kind !== "authorized") return NextResponse.json({ error: "Current participant authority is required." }, { status: 403 });
    const result = await (await createServerAiAmacsInterpretationGateway()).disposition({ context: access.context, organizationId: body.organizationId, membershipId: String(access.membership.id), recordId: body.recordId, ...(typeof body.candidateId === "string" ? { candidateId: body.candidateId } : {}), ...(typeof body.expectedUpdatedAt === "string" ? { expectedUpdatedAt: body.expectedUpdatedAt } : {}), decision: body.decision as InterpretationDispositionInput });
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof InterpretationGatewayError) {
      const status = error.code === "forbidden" ? 403 : error.code === "not-found" ? 404 : error.code === "invalid" ? 400 : 409;
      const participantMessage = status === 403
        ? "Interpretation access is unavailable for this organization."
        : status === 404
          ? "The interpretation record is unavailable."
          : status === 400
            ? "The interpretation decision contains unsupported information."
          : "The interpretation decision could not be recorded in its current state.";
      return apiProblem(request, { status, participantMessage, code: error.code, cause: error });
    }
    return apiProblem(request, {
      status: 500,
      participantMessage: "The interpretation decision is temporarily unavailable. Retry the request later.",
      code: "dependency-unavailable",
      cause: error,
    });
  }
}
