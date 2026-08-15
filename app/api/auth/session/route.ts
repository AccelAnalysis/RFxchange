import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { ServerSessionError } from "@/src/application/auth/server-session";
import type { ActivationJourneyState } from "@/src/application/onboarding/activation-journey";
import {
  parseAcquisitionContextToken,
  type AcquisitionContextToken,
} from "@/src/application/acquisition/acquisition-context";
import { parseOpaqueOpportunityCandidate } from "@/src/application/acquisition/opaque-opportunity-candidate";
import { accessJourneyId } from "@/src/domain/lifecycle/model";
import {
  AcquisitionContextBindingError,
  type BoundAcquisitionContext,
} from "@/src/domain/acquisition/model";
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
import { apiProblem } from "@/src/infrastructure/http/api-problem";
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

function sessionErrorMessage(error: unknown): string {
  if (!(error instanceof ServerSessionError)) {
    return "Session exchange is temporarily unavailable. Retry the request.";
  }
  if (error.code === "authentication-backend-unavailable") {
    return "Sign-in is temporarily unavailable. Retry the request.";
  }
  if (error.code === "csrf-verification-required") return "Session verification could not be completed.";
  if (error.code === "credential-required") return "Session credentials are required.";
  return "Session credentials could not be accepted.";
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

function withBoundAcquisition(
  state: ActivationJourneyState,
  context: BoundAcquisitionContext,
): ActivationJourneyState {
  return Object.freeze({
    ...state,
    acquisitionContext: acquisitionState(context),
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

    const db = getServerFirestore();
    const contexts = new FirestoreActivationJourneyContextRepository(db);
    const existingContext = await timing.measure(
      "firestore-context",
      () => contexts.getByUserId(issued.context.user.id),
      "activation context lookup",
    );
    const provisionalOrganizationName = body.provisionalOrganizationName?.trim() || "";
    const canBootstrapActivation = Boolean(existingContext || provisionalOrganizationName);
    let state: ActivationJourneyState | null = null;
    let acquisitionStatus: "none" | "bound" | "rejected" | "unavailable" = "none";
    let boundAcquisition: BoundAcquisitionContext | null = null;
    let acquisitionAttached = false;
    const acquisitionCookie = request.cookies.get(RFXCHANGE_ACQUISITION_COOKIE_NAME)?.value;

    if (acquisitionCookie && canBootstrapActivation) {
      const persistentToken = parseAcquisitionContextToken(acquisitionCookie);
      const candidate = parseOpaqueOpportunityCandidate(acquisitionCookie);
      try {
        let token: AcquisitionContextToken | null = persistentToken;
        if (!token && candidate) {
          token = await createServerAcquisitionContextService().issueOpaqueOpportunityCandidate({
            reference: candidate.reference,
            referrer: request.headers.get("referer"),
          });
        }
        if (!token) {
          acquisitionStatus = "rejected";
        } else {
          boundAcquisition = await timing.measure(
            "acquisition-bind",
            () => createServerAcquisitionContextService().bind({
              token,
              userId: issued.context.user.id,
              accessJourneyId: accessJourneyId(activationJourneyIdForUser(issued.context.user.id)),
            }),
          );
          acquisitionStatus = "bound";
        }
      } catch (error) {
        acquisitionStatus = error instanceof AcquisitionContextBindingError
          ? "rejected"
          : "unavailable";
      }
    } else if (acquisitionCookie && !parseAcquisitionContextToken(acquisitionCookie) && !parseOpaqueOpportunityCandidate(acquisitionCookie)) {
      acquisitionStatus = "rejected";
    }

    if (canBootstrapActivation) {
      const activation = createServerActivationJourneyService();
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
        acquisitionAttached = await contexts.attachAcquisitionContext(
          issued.context.user.id,
          boundAcquisition,
        );
        if (acquisitionAttached) state = withBoundAcquisition(state, boundAcquisition);
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
    return timing.apply(apiProblem(request, {
      status: sessionErrorStatus(error),
      participantMessage: sessionErrorMessage(error),
      code: error instanceof ServerSessionError ? "session-unavailable" : "dependency-unavailable",
      cause: error,
    }));
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
