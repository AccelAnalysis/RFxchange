import { NextRequest, NextResponse } from "next/server";

import { ServerSessionError } from "../../application/auth/server-session.ts";
import { createServerAuthenticationBoundary } from "../../infrastructure/auth/firebase-session-runtime.ts";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "../../infrastructure/auth/firebase-server-session.ts";
import { loadServerIdentityProjection } from "./server-runtime.ts";

export const dynamic = "force-dynamic";

function sessionRejection(error: unknown): boolean {
  return error instanceof ServerSessionError && [
    "credential-required",
    "credential-invalid",
    "credential-revoked",
    "account-disabled",
  ].includes(error.code);
}

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value?.trim();
  if (!sessionCookie) {
    return NextResponse.json({ kind: "unauthenticated" }, { status: 401 });
  }

  let context;
  try {
    context = await createServerAuthenticationBoundary().authenticateSessionCookie({
      sessionCookie,
      now: new Date().toISOString(),
    });
  } catch (error) {
    if (sessionRejection(error)) {
      return NextResponse.json({ kind: "unauthenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Identity is temporarily unavailable." },
      { status: 503 },
    );
  }

  try {
    const projection = await loadServerIdentityProjection({
      context,
      requestedOrganizationId: request.nextUrl.searchParams.get("organizationId"),
    });
    const status = projection.kind === "ready"
      ? 200
      : projection.kind === "organization-selection-required"
        ? 200
        : 403;
    return NextResponse.json(projection, { status });
  } catch {
    return NextResponse.json(
      { error: "Organization access is temporarily unavailable." },
      { status: 503 },
    );
  }
}
