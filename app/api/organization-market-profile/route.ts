import { NextRequest, NextResponse } from "next/server";

import { MarketProfileError } from "@/src/application/market-profile/market-profile";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerMarketProfileService } from "@/src/infrastructure/market-profile/runtime";

export const runtime = "nodejs";

type RequestBody = Readonly<{
  organizationId?: unknown;
  commandId?: unknown;
  action?: unknown;
  input?: unknown;
}>;

function responseFor(error: unknown) {
  if (error instanceof MarketProfileError) {
    const status = error.code === "forbidden" ? 403 : error.code === "not-found" ? 404 : error.code === "invalid" ? 400 : 409;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  return NextResponse.json({ error: error instanceof Error ? error.message : "Market profile could not be saved." }, { status: 409 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 131_072) return NextResponse.json({ error: "Market profile request is too large." }, { status: 413 });
  const body = await request.json().catch(() => null) as RequestBody | null;
  if (!body || typeof body.organizationId !== "string" || typeof body.commandId !== "string" || typeof body.action !== "string" || !isRecord(body.input)) {
    return NextResponse.json({ error: "Organization, command, action, and input are required." }, { status: 400 });
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(body.commandId)) {
    return NextResponse.json({ error: "Command identity is malformed." }, { status: 400 });
  }
  const access = await resolveParticipantRoute({
    sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    requestedOrganizationId: body.organizationId,
  });
  if (access.kind === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (access.kind !== "authorized") return NextResponse.json({ error: "Current participant authority is required." }, { status: 403 });
  const scope = { context: access.context, organizationId: body.organizationId, membershipId: String(access.membership.id), commandId: body.commandId };
  try {
    const service = await createServerMarketProfileService();
    const result = body.action === "claim-capability"
      ? await service.claimCapability(scope, body.input as Parameters<typeof service.claimCapability>[1])
      : body.action === "update-industry"
        ? await service.updateIndustry(scope, body.input as Parameters<typeof service.updateIndustry>[1])
        : body.action === "add-past-performance"
          ? await service.addPastPerformance(scope, body.input as Parameters<typeof service.addPastPerformance>[1])
          : body.action === "update-preferences"
            ? await service.updatePreferences(scope, body.input as Parameters<typeof service.updatePreferences>[1])
            : body.action === "submit-provisional-term"
              ? await service.submitProvisionalTerm(scope, body.input as Parameters<typeof service.submitProvisionalTerm>[1])
              : null;
    if (!result) return NextResponse.json({ error: "Unsupported market profile action." }, { status: 400 });
    return NextResponse.json(result, { status: result.replayed ? 200 : 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    return responseFor(error);
  }
}
