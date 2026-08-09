import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { ServerSessionError } from "@/src/application/auth/server-session";
import type { ActivationJourneyState } from "@/src/application/onboarding/activation-journey";
import {
  parseAcquisitionContextToken,
} from "@/src/application/acquisition/acquisition-context";
import { accessJourneyId } from "@/src/domain/lifecycle/model";
import type { BoundAcquisitionContext } from "@/src/domain/acquisition/model";
import {
  activationJourneyIdForUser,
  updateActivationJourneyContext,
} from "@/src/domain/onboarding/model";
import {
  acquisitionCookieOptions,
  createServerAcquisitionContextService,
  RFXCHANGE_ACQUISITION_COOKIE_NAME,
} from "@/src/infrastructure/acquisition/runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
import { FirestoreActivationJourneyContextRepository } from "@/src/infrastructure/firestore/activation-journey";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { createServerActivationJourneyService } from "@/src/infrastructure/onboarding/runtime";
import { ServerTimingCollector } from "@/src/infrastructure/observability/server-timing";

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

function acquisitionState(context: BoundAcquisitionContext): NonNullable<ActivationJourneyState["acquisitionContext"]> {
  return Object.freeze({
    id: context.id,
    kind: context.intent.kind,
    subjectReference: context.intent.subjectReference,
    sourceChannel: context.source.channel,
    status: "preserved" as const,
  });
}

export async function GET() {
  const csrfToken = randomUUID();
  const response = NextResponse.json({ csrfToken });
  response.cookies.set(ACTIVATION_CSRF_COOKIE, csrfToken, csrfCookieOptions());
  return response;
}

export async function POST(request: NextRequest) {
  const timing = new ServerTimingCollector();
  try {
    const body = await timing.measure(
      "request-json",
      () => request.json() as Promise<Readonly<{
        idToken?: string;
        csrfToken?: string;
        requestedName?: string;
        provisionalOrganizationName?: string;
        organizationRelationship?: string;
      }>>,
    );
    const expectedCsrf = request.cookies.get(ACTIVATION_CSRF_COOKIE)?.value ?? "";
    if (!body.csrfToken || !expectedCsrf || body.csrfToken !== expectedCsrf) {
      return timing.apply(NextResponse.json({ error: "CSRF verification failed." }, { status: 403 }));
    }
    const idToken = body.idToken?.trim() ?? "";
    if (!idToken) {
      return timing.apply(NextResponse.json({ error: "Firebase ID token is required." }, { status: 400 }));
    }

    const issued = await timing.measure(
      "session-cookie",
      () => createServerAuthenticationBoundary().issueSessionCookie({
        idToken,
        csrfVerified: true,
        requestedName: body.requestedName?.trim() || undefined,
        now: new Date().toISOString(),
      }),
      "verify Firebase token + issue RFxchange session",
    );

    // Authentication/session establishment is independent from participant activation. Returning
    // users sign in with email and password only. An authenticated account without an activation
    // context receives state=null and begins organization setup on /join.
    const db = getServerFirestore();
    const contexts = new FirestoreActivationJourneyContextRepository(db);
    const existingContext = await timing.measure(
      "firestore-context",
      () => contexts.getByUserId(issued.context.user.id),
      "activation context lookup",
    );
    const provisionalOrganizationName = body.provisionalOrganizationName?.trim() || "";
    let state: ActivationJourneyState | null = null;
    let acquisitionStatus: "none" | "bound" | "rejected" = "none";
    let boundAcquisition: BoundAcquisitionContext | null = null;
    let acquisitionAttached = false;
    const acquisitionCookie = request.cookies.get(RFXCHANGE_ACQUISITION_COOKIE_NAME)?.value;
    if (acquisitionCookie) {
      const token = parseAcquisitionContextToken(acquisitionCookie);
      if (!token) {
        acquisitionStatus = "rejected";
      } else {
        try {
          boundAcquisition = await timing.measure(
            "acquisition-bind",
            () => createServerAcquisitionContextService().bind({
              token,
              userId: issued.context.user.id,
              accessJourneyId: accessJourneyId(activationJourneyIdForUser(issued.context.user.id)),
            }),
          );
          acquisitionStatus = "bound";
        } catch {
          // Acquisition context is navigation metadata, never a reason to deny legitimate sign-in.
          acquisitionStatus = "rejected";
        }
      }
    }

    if (existingContext || provisionalOrganizationName) {
      const activation = createServerActivationJourneyService();
      // bootstrap() already returns the canonical activation state. Reuse it instead of hydrating
      // the same graph a second time during the same sign-in request.
      state = await timing.measure(
        "activation-state",
        () => activation.bootstrap(issued.context, provisionalOrganizationName),
        "bootstrap/resume activation once",
      );

      if (body.organizationRelationship?.trim()) {
        const current = await contexts.getByUserId(issued.context.user.id);
        if (current) {
          await contexts.save(updateActivationJourneyContext(current, {
            organizationRelationship: body.organizationRelationship,
            now: new Date().toISOString(),
          }));
        }
      }
      if (boundAcquisition) {
        const current = await contexts.getByUserId(issued.context.user.id);
        if (current) {
          await contexts.save(updateActivationJourneyContext(current, {
            acquisitionContext: boundAcquisition,
            now: new Date().toISOString(),
          }));
          acquisitionAttached = true;
          state = Object.freeze({ ...state, acquisitionContext: acquisitionState(boundAcquisition) });
        }
      }
    }

    const response = NextResponse.json({ state, acquisitionStatus });
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
    if (acquisitionCookie && (acquisitionAttached || acquisitionStatus === "rejected")) {
      response.cookies.set(RFXCHANGE_ACQUISITION_COOKIE_NAME, "", {
        ...acquisitionCookieOptions(),
        maxAge: 0,
      });
    }
    return timing.apply(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session exchange failed.";
    return timing.apply(NextResponse.json({ error: message }, { status: sessionErrorStatus(error) }));
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
  response.cookies.set(RFXCHANGE_ACQUISITION_COOKIE_NAME, "", {
    ...acquisitionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
