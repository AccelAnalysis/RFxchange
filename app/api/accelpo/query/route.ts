import { NextRequest, NextResponse } from "next/server";

import { ServerSessionError } from "@/src/application/auth/server-session";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { isApplicationRequestOrigin } from "@/src/infrastructure/http/application-request-origin";
import { createServerAccelPoQueryProjection } from "@/src/accelpo/cp04/server-runtime";
import type { QueryProjectionInput } from "@/apps/accelpo/src/query-projection/contracts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_QUERY_BODY_BYTES = 65_536;

function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function queryBody(value: unknown): Readonly<{
  readonly organizationId: string | null;
  readonly query: QueryProjectionInput;
}> | null {
  if (!isRecord(value) || !isRecord(value.query)) return null;
  const organizationId = value.organizationId;
  if (organizationId !== undefined && organizationId !== null && typeof organizationId !== "string") {
    return null;
  }
  return Object.freeze({
    organizationId: organizationId?.trim() || null,
    query: value.query as unknown as QueryProjectionInput,
  });
}

function sessionRejection(error: unknown): boolean {
  return error instanceof ServerSessionError && [
    "credential-required",
    "credential-invalid",
    "credential-revoked",
    "account-disabled",
  ].includes(error.code);
}

async function authenticate(request: NextRequest) {
  const boundary = createServerAuthenticationBoundary();
  const now = new Date().toISOString();
  const token = bearerToken(request);
  if (token) return boundary.authenticateIdToken({ idToken: token, now });
  const sessionCookie = request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value?.trim();
  if (!sessionCookie) throw new ServerSessionError("credential-required", "Authentication is required.");
  return boundary.authenticateSessionCookie({ sessionCookie, now });
}

function statusFor(code: string): number {
  switch (code) {
    case "unauthenticated": return 401;
    case "forbidden": return 403;
    case "not-found": return 404;
    case "validation-failure": return 400;
    case "unavailable-service": return 503;
    default: return 503;
  }
}

export async function POST(request: NextRequest) {
  if (!isApplicationRequestOrigin(request, "purchasing")) {
    return NextResponse.json(
      { error: "A trusted AccelPO application origin is required." },
      { status: 403 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_QUERY_BODY_BYTES) {
    return NextResponse.json({ error: "The query request is too large." }, { status: 413 });
  }

  try {
    const body = queryBody(await request.json());
    if (!body) {
      return NextResponse.json(
        { outcome: "failure", projection: "unknown", code: "validation-failure", message: "The request could not be understood." },
        { status: 400, headers: { "cache-control": "no-store" } },
      );
    }
    const context = await authenticate(request);
    const result = await createServerAccelPoQueryProjection(context).read({
      requestedOrganizationId: body.organizationId,
      query: body.query,
    });
    return NextResponse.json(result, {
      status: result.outcome === "failure" ? statusFor(result.code) : 200,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ServerSessionError) {
      return NextResponse.json(
        { outcome: "failure", projection: "unknown", code: sessionRejection(error) ? "unauthenticated" : "unavailable-service", message: sessionRejection(error) ? "Sign in to view this information." : "This information is temporarily unavailable. Try again." },
        { status: sessionRejection(error) ? 401 : 503, headers: { "cache-control": "no-store" } },
      );
    }
    return NextResponse.json(
      { outcome: "failure", projection: "unknown", code: "unavailable-service", message: "This information is temporarily unavailable. Try again." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
