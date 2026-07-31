import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { ServerSessionError } from "@/src/application/auth/server-session";
import { updateActivationJourneyContext } from "@/src/domain/onboarding/model";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
import { FirestoreActivationJourneyContextRepository } from "@/src/infrastructure/firestore/activation-journey";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { createServerActivationJourneyService } from "@/src/infrastructure/onboarding/runtime";

const ACTIVATION_CSRF_COOKIE = "rfx_activation_csrf";

function csrfCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 10 * 60,
  };
}

function sessionErrorStatus(error: unknown): number {
  if (!(error instanceof ServerSessionError)) return 500;
  if (error.code === "authentication-backend-unavailable") return 503;
  if (error.code === "csrf-verification-required") return 403;
  if (error.code === "credential-required") return 400;
  return 401;
}

export async function GET() {
  const csrfToken = randomUUID();
  const response = NextResponse.json({ csrfToken });
  response.cookies.set(ACTIVATION_CSRF_COOKIE, csrfToken, csrfCookieOptions());
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Readonly<{
      idToken?: string;
      csrfToken?: string;
      requestedName?: string;
      provisionalOrganizationName?: string;
      organizationRelationship?: string;
    }>;
    const expectedCsrf = request.cookies.get(ACTIVATION_CSRF_COOKIE)?.value ?? "";
    if (!body.csrfToken || !expectedCsrf || body.csrfToken !== expectedCsrf) {
      return NextResponse.json({ error: "CSRF verification failed." }, { status: 403 });
    }
    const idToken = body.idToken?.trim() ?? "";
    if (!idToken) {
      return NextResponse.json({ error: "Firebase ID token is required." }, { status: 400 });
    }

    const issued = await createServerAuthenticationBoundary().issueSessionCookie({
      idToken,
      csrfVerified: true,
      requestedName: body.requestedName?.trim() || undefined,
      now: new Date().toISOString(),
    });

    // Authentication/session establishment is independent of participant activation. A legitimate
    // platform administrator may have no participant organization context. Existing participant
    // journeys resume automatically; /join creates a new activation journey only when it supplies
    // organization context.
    const contexts = new FirestoreActivationJourneyContextRepository(getServerFirestore());
    const existingContext = await contexts.getByUserId(issued.context.user.id);
    const provisionalOrganizationName =
      body.provisionalOrganizationName?.trim() || body.requestedName?.trim() || "";
    let state = null;

    if (existingContext || provisionalOrganizationName) {
      const activation = createServerActivationJourneyService();
      await activation.bootstrap(issued.context, provisionalOrganizationName);

      if (body.organizationRelationship?.trim()) {
        const current = await contexts.getByUserId(issued.context.user.id);
        if (current) {
          await contexts.save(updateActivationJourneyContext(current, {
            organizationRelationship: body.organizationRelationship,
            now: new Date().toISOString(),
          }));
        }
      }
      state = await activation.state(issued.context);
    }

    const response = NextResponse.json({ state });
    response.cookies.set(RFXCHANGE_SESSION_COOKIE_NAME, issued.cookie.value, {
      httpOnly: issued.cookie.httpOnly,
      secure: issued.cookie.secure,
      sameSite: issued.cookie.sameSite,
      path: issued.cookie.path,
      maxAge: issued.cookie.maxAgeSeconds,
    });
    response.cookies.set(ACTIVATION_CSRF_COOKIE, "", {
      ...csrfCookieOptions(),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session exchange failed.";
    return NextResponse.json({ error: message }, { status: sessionErrorStatus(error) });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ signedOut: true });
  response.cookies.set(RFXCHANGE_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
