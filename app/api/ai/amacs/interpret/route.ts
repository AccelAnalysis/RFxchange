import { NextRequest, NextResponse } from "next/server";

import { InterpretationGatewayError } from "@/src/application/ai-interpretation/gateway";
import type { AmacsInterpretationPurpose } from "@/src/domain/amacs/contracts";
import type { InterpretationSourceInput } from "@/src/domain/ai-interpretation/model";
import { createServerAiAmacsInterpretationGateway } from "@/src/infrastructure/ai-interpretation/runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";

export const runtime = "nodejs";

function responseFor(error: unknown) {
  if (error instanceof InterpretationGatewayError) {
    const status = error.code === "forbidden" ? 403 : error.code === "not-found" ? 404 : error.code === "disabled" || error.code === "unavailable" ? 503 : error.code === "provider" ? 502 : 409;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  return NextResponse.json({ error: "AI interpretation could not be completed." }, { status: 500 });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 131_072) return NextResponse.json({ error: "Interpretation request is too large." }, { status: 413 });
  const body = await request.json().catch(() => null) as null | Readonly<{ organizationId?: unknown; purpose?: unknown; subjectRef?: unknown; sources?: unknown }>;
  if (!body || typeof body.organizationId !== "string" || typeof body.purpose !== "string" || !Array.isArray(body.sources)) return NextResponse.json({ error: "Organization, purpose, and sources are required." }, { status: 400 });
  const access = await resolveParticipantRoute({ sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value, requestedOrganizationId: body.organizationId });
  if (access.kind === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (access.kind !== "authorized") return NextResponse.json({ error: "Current participant authority is required." }, { status: 403 });
  try {
    const result = await (await createServerAiAmacsInterpretationGateway()).interpret({ context: access.context, organizationId: body.organizationId, membershipId: String(access.membership.id), purpose: body.purpose as AmacsInterpretationPurpose, ...(typeof body.subjectRef === "string" ? { subjectRef: body.subjectRef } : {}), sources: body.sources as readonly InterpretationSourceInput[] });
    return NextResponse.json(result, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) { return responseFor(error); }
}
