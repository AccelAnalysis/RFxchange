import { NextRequest, NextResponse } from "next/server";

import {
  AccelPoCommandError,
} from "@/src/application/accelpo/command-port";
import { ServerSessionError } from "@/src/application/auth/server-session";
import { isApplicationRequestOrigin } from "@/src/infrastructure/http/application-request-origin";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerAccelPoCommandPort } from "@/src/infrastructure/accelpo/command-port-runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";

export const runtime = "nodejs";

const MAX_COMMAND_BODY_BYTES = 262_144;

function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() || null;
}

async function authenticate(request: NextRequest) {
  const boundary = createServerAuthenticationBoundary();
  const now = new Date().toISOString();
  const token = bearerToken(request);
  if (token) {
    return boundary.authenticateIdToken({ idToken: token, now });
  }
  const sessionCookie = request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    throw new AccelPoCommandError("unauthenticated", "Authentication is required.");
  }
  return boundary.authenticateSessionCookie({ sessionCookie, now });
}

function statusFor(error: AccelPoCommandError | ServerSessionError): number {
  if (error instanceof ServerSessionError) {
    return error.code === "authentication-backend-unavailable" ? 503 : 401;
  }
  switch (error.code) {
    case "unauthenticated": return 401;
    case "forbidden": return 403;
    case "not-found": return 404;
    case "version-conflict":
    case "duplicate-request": return 409;
    case "validation-failure": return 400;
    case "unavailable-service": return 503;
  }
}

function codeFor(error: AccelPoCommandError | ServerSessionError): string {
  if (error instanceof ServerSessionError) {
    return error.code === "authentication-backend-unavailable"
      ? "service-unavailable"
      : "authentication-required";
  }
  return `command-${error.code}`;
}

function participantMessage(error: AccelPoCommandError | ServerSessionError): string {
  if (error instanceof ServerSessionError) {
    return error.code === "authentication-backend-unavailable"
      ? "Account access is temporarily unavailable. Retry the request."
      : "Authentication is required to continue.";
  }
  return error.message;
}

function problem(request: NextRequest, error: unknown) {
  const typed = error instanceof AccelPoCommandError || error instanceof ServerSessionError
    ? error
    : new AccelPoCommandError(
        "unavailable-service",
        "The action could not be completed. Retry the request.",
      );
  const details = typed instanceof AccelPoCommandError ? typed.details : null;
  return apiProblem(request, {
    status: statusFor(typed),
    participantMessage: participantMessage(typed),
    code: codeFor(typed),
    ...(details ? { details } : {}),
    cause: error,
  });
}

export async function POST(request: NextRequest) {
  if (!isApplicationRequestOrigin(request, "purchasing")) {
    return NextResponse.json({ error: "A trusted AccelPO application origin is required." }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_COMMAND_BODY_BYTES) {
    return NextResponse.json({ error: "The action request is too large." }, { status: 413 });
  }
  try {
    const body = await request.json();
    const context = await authenticate(request);
    const result = await createServerAccelPoCommandPort().execute(body, context);
    return NextResponse.json(result, {
      status: result.replayed ? 200 : 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return problem(request, error);
  }
}
