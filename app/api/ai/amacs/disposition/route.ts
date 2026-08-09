import { NextRequest, NextResponse } from "next/server";

import { InterpretationGatewayError } from "@/src/application/ai-interpretation/gateway";
import type { InterpretationDispositionInput } from "@/src/domain/ai-interpretation/model";
import { createServerAiAmacsInterpretationGateway } from "@/src/infrastructure/ai-interpretation/runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 16_384) return NextResponse.json({ error: "Disposition request is too large." }, { status: 413 });
  const body = await request.json().catch(() => null) as null | Readonly<{ organizationId?: unknown; recordId?: unknown; candidateId?: unknown; expectedUpdatedAt?: unknown; decision?: unknown }>;
  if (!body || typeof body.organizationId !== "string" || typeof body.recordId !== "string" || !body.decision || typeof body.decision !== "object") return NextResponse.json({ error: "Organization, record, and decision are required." }, { status: 400 });
  const access = await resolveParticipantRoute({ sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value, requestedOrganizationId: body.organizationId });
  if (access.kind === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (access.kind !== "authorized") return NextResponse.json({ error: "Current participant authority is required." }, { status: 403 });
  try {
    const record = await (await createServerAiAmacsInterpretationGateway()).disposition({ context: access.context, organizationId: body.organizationId, membershipId: String(access.membership.id), recordId: body.recordId, ...(typeof body.candidateId === "string" ? { candidateId: body.candidateId } : {}), ...(typeof body.expectedUpdatedAt === "string" ? { expectedUpdatedAt: body.expectedUpdatedAt } : {}), decision: body.decision as InterpretationDispositionInput });
    return NextResponse.json({ record, authoritativeEffect: "none" }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof InterpretationGatewayError) {
      const status = error.code === "forbidden" ? 403 : error.code === "not-found" ? 404 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    return NextResponse.json({ error: "Interpretation disposition could not be recorded." }, { status: 500 });
  }
}
