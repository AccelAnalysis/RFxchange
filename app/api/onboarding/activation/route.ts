import { NextRequest, NextResponse } from "next/server";

import { ServerSessionError, type AuthenticatedServerContext } from "@/src/application/auth/server-session";
import {
  ActivationJourneyError,
  ActivationRequestValidationError,
} from "@/src/application/onboarding/activation-journey";
import { OrganizationResolutionError } from "@/src/application/organization-resolution/organization-resolution";
import { isCurrentActivationLegalAcceptance } from "@/src/domain/onboarding/model";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
} from "@/src/infrastructure/auth/firebase-server-session";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
import { FirebaseAccountSecurityService } from "@/src/infrastructure/auth/firebase-account-security";
import { getServerFirebaseAuth } from "@/src/infrastructure/auth/firebase-server";
import { FirestoreActivationJourneyContextRepository } from "@/src/infrastructure/firestore/activation-journey";
import { createFirestoreGeographyRepositories } from "@/src/infrastructure/firestore/geography-repositories";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";
import {
  CensusTigerLocalityError,
  CensusTigerLocalityDirectory,
  type CensusLocalityCandidate,
} from "@/src/infrastructure/geography/census-tiger-locality-directory";
import {
  synchronizeActivationContextFromActiveMembership,
  synchronizeActivationContextFromAuthority,
} from "@/src/infrastructure/onboarding/activation-context-sync";
import { createServerActivationJourneyService } from "@/src/infrastructure/onboarding/runtime";
import { ServerTimingCollector } from "@/src/infrastructure/observability/server-timing";

import {
  parseSaveProfileBody,
  parseWebsiteIdentityFields,
} from "./request-boundary";

const localityDirectory = new CensusTigerLocalityDirectory();
const localitySuggestionCache = new Map<string, Readonly<{ expiresAt: number; candidates: readonly CensusLocalityCandidate[] }>>();
const LOCALITY_CACHE_TTL_MS = 5 * 60 * 1000;
const LOCALITY_CACHE_MAX_ENTRIES = 250;

async function cachedLocalitySuggestions(query: string, stateCode: string) {
  const key = `${stateCode.trim().toUpperCase()}:${query.trim().toLocaleLowerCase()}`;
  const cached = localitySuggestionCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.candidates;
  const candidates = await localityDirectory.search({ query, stateCode });
  if (localitySuggestionCache.size >= LOCALITY_CACHE_MAX_ENTRIES) {
    const oldestKey = localitySuggestionCache.keys().next().value as string | undefined;
    if (oldestKey) localitySuggestionCache.delete(oldestKey);
  }
  localitySuggestionCache.set(key, Object.freeze({
    expiresAt: Date.now() + LOCALITY_CACHE_TTL_MS,
    candidates,
  }));
  return candidates;
}

async function authenticatedContext(
  request: NextRequest,
  timing: ServerTimingCollector,
): Promise<AuthenticatedServerContext> {
  const sessionCookie = request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) throw new ServerSessionError("credential-required", "RFxchange session is required.");
  return timing.measure(
    "auth",
    () => createServerAuthenticationBoundary().authenticateSessionCookie({
      sessionCookie,
      now: new Date().toISOString(),
    }),
    "verify RFxchange session",
  );
}

async function synchronizedState(
  service: ReturnType<typeof createServerActivationJourneyService>,
  context: AuthenticatedServerContext,
  timing: ServerTimingCollector,
) {
  const state = await timing.measure(
    "activation-state",
    () => service.state(context),
    "full activation state for explicit refresh",
  );
  await synchronizeActivationContextFromAuthority(context, state);
  return state;
}

async function legalAccepted(
  context: AuthenticatedServerContext,
  timing: ServerTimingCollector,
): Promise<boolean> {
  const activation = await timing.measure(
    "firestore-precondition",
    () => new FirestoreActivationJourneyContextRepository(getServerFirestore()).getByUserId(context.user.id),
    "legal acceptance context",
  );
  return Boolean(activation && isCurrentActivationLegalAcceptance(activation.legalAcceptance));
}

async function verifiedEmail(
  context: AuthenticatedServerContext,
  timing: ServerTimingCollector,
): Promise<boolean> {
  const account = await timing.measure(
    "account-security",
    () => new FirebaseAccountSecurityService(getServerFirebaseAuth()).inspect(context.authentication.subject),
    "email verification precondition",
  );
  return account.emailVerified;
}

function errorResponse(request: NextRequest, error: unknown) {
  if (error instanceof ActivationRequestValidationError) {
    return apiProblem(request, {
      status: 400,
      participantMessage: "The activation request contains an invalid value.",
      code: error.code,
      cause: error,
    });
  }
  if (error instanceof ActivationJourneyError) {
    return apiProblem(request, {
      status: 409,
      participantMessage: "Activation cannot continue until the current requirement is complete.",
      code: error.code,
      cause: error,
    });
  }
  if (error instanceof CensusTigerLocalityError) {
    const requestInvalid = error.code === "invalid-query" || error.code === "invalid-state";
    const notFound = error.code === "not-found";
    return apiProblem(request, {
      status: requestInvalid ? 400 : notFound ? 404 : 503,
      participantMessage: requestInvalid
        ? "The geography search contains an invalid value."
        : notFound
          ? "The selected geography is no longer available. Search again."
          : "Geography search is temporarily unavailable. Retry the request.",
      code: error.code,
      cause: error,
    });
  }
  if (error instanceof OrganizationResolutionError) {
    return apiProblem(request, {
      status: 409,
      participantMessage: "Organization resolution cannot continue from the current state. Review the latest candidates and retry.",
      code: error.code,
      cause: error,
    });
  }
  if (error instanceof ServerSessionError) {
    const dependencyUnavailable = error.code === "authentication-backend-unavailable";
    return apiProblem(request, {
      status: dependencyUnavailable ? 503 : 401,
      participantMessage: dependencyUnavailable
        ? "Activation is temporarily unavailable. Retry the request."
        : "Authentication is required to continue activation.",
      code: dependencyUnavailable ? "dependency-unavailable" : "authentication-required",
      cause: error,
    });
  }
  return apiProblem(request, {
    status: error instanceof SyntaxError ? 400 : 500,
    participantMessage: error instanceof SyntaxError
      ? "The activation request could not be read."
      : "Activation is temporarily unavailable. Retry the request.",
    code: error instanceof SyntaxError ? "request-invalid" : "dependency-unavailable",
    cause: error,
  });
}

export async function GET(request: NextRequest) {
  const timing = new ServerTimingCollector();
  try {
    const context = await authenticatedContext(request, timing);
    const service = createServerActivationJourneyService();
    const state = await synchronizedState(service, context, timing);
    return timing.apply(NextResponse.json({ state }));
  } catch (error) {
    return timing.apply(errorResponse(request, error));
  }
}

export async function POST(request: NextRequest) {
  const timing = new ServerTimingCollector();
  try {
    const context = await authenticatedContext(request, timing);
    const service = createServerActivationJourneyService();
    const body = (await request.json()) as Readonly<Record<string, unknown>>;
    const action = typeof body.action === "string" ? body.action : "";

    switch (action) {
      case "accept-legal": {
        const state = await timing.measure("activation-action", () => service.acceptLegal(context), action);
        return timing.apply(NextResponse.json({ state }));
      }
      case "search-geographies": {
        if (!await legalAccepted(context, timing)) {
          return timing.apply(NextResponse.json(
            { error: "Accept the current participation policies before selecting a home locality." },
            { status: 409 },
          ));
        }
        const query = typeof body.query === "string" ? body.query : "";
        const stateCode = typeof body.stateCode === "string" ? body.stateCode : "";
        const candidates = await timing.measure(
          "geography-directory",
          () => cachedLocalitySuggestions(query, stateCode),
          "Census locality suggestions",
        );
        return timing.apply(NextResponse.json({ candidates }));
      }
      case "select-census-geography": {
        if (!await legalAccepted(context, timing)) {
          return timing.apply(NextResponse.json(
            { error: "Accept the current participation policies before selecting a home locality." },
            { status: 409 },
          ));
        }
        const reference = typeof body.reference === "string" ? body.reference : "";
        const geography = await timing.measure(
          "geography-resolve",
          () => localityDirectory.resolve(reference),
          "resolve selected Census geography",
        );
        await timing.measure(
          "firestore-geography",
          () => createFirestoreGeographyRepositories(getServerFirestore()).definitions.save(geography),
          "persist selected geography definition",
        );
        const state = await timing.measure(
          "activation-action",
          () => service.selectGeography(context, String(geography.id)),
          action,
        );
        return timing.apply(NextResponse.json({ state }));
      }
      case "select-geography": {
        const geographyId = typeof body.geographyId === "string" ? body.geographyId : "";
        const state = await timing.measure(
          "activation-action",
          () => service.selectGeography(context, geographyId),
          action,
        );
        return timing.apply(NextResponse.json({ state }));
      }
      case "acknowledge-orientation-position": {
        const state = await timing.measure(
          "activation-action",
          () => service.acknowledgeOrientationPosition(context),
          action,
        );
        return timing.apply(NextResponse.json({ state }));
      }
      case "search-organizations": {
        const displayName = typeof body.displayName === "string" ? body.displayName : "";
        const result = await timing.measure(
          "organization-search",
          () => service.searchOrganizations(context, {
            displayName,
            ...parseWebsiteIdentityFields(body),
            ...(typeof body.phone === "string" && body.phone.trim() ? { phone: body.phone } : {}),
          }),
          action,
        );
        return timing.apply(NextResponse.json({
          provisionalIdentity: result.provisionalIdentity,
          candidates: result.candidates,
          creationSafety: result.creationSafety,
        }));
      }
      case "create-organization": {
        if (!await verifiedEmail(context, timing)) {
          return timing.apply(NextResponse.json(
            { error: "Verify your email before creating or claiming an organization.", code: "email-verification-required" },
            { status: 409 },
          ));
        }
        const displayName = typeof body.displayName === "string" ? body.displayName : "";
        const reviewedCandidateOrganizationIds = Array.isArray(body.reviewedCandidateOrganizationIds)
          ? body.reviewedCandidateOrganizationIds.filter((value): value is string => typeof value === "string")
          : [];
        const state = await timing.measure(
          "activation-action",
          () => service.createOrganization(context, {
            displayName,
            reviewedCandidateOrganizationIds,
            ...parseWebsiteIdentityFields(body),
            ...(typeof body.phone === "string" && body.phone.trim() ? { phone: body.phone } : {}),
          }),
          action,
        );
        return timing.apply(NextResponse.json({ state }));
      }
      case "select-existing-organization": {
        if (!await verifiedEmail(context, timing)) {
          return timing.apply(NextResponse.json(
            { error: "Verify your email before creating or claiming an organization.", code: "email-verification-required" },
            { status: 409 },
          ));
        }
        const displayName = typeof body.displayName === "string" ? body.displayName : "";
        const organizationId = typeof body.organizationId === "string" ? body.organizationId : "";
        const state = await timing.measure(
          "activation-action",
          () => service.selectExistingOrganization(context, {
            displayName,
            organizationId,
            ...(typeof body.domainEmailReference === "string" && body.domainEmailReference.trim()
              ? { domainEmailReference: body.domainEmailReference }
              : {}),
          }),
          action,
        );
        return timing.apply(NextResponse.json({ state }));
      }
      case "begin-location": {
        await synchronizeActivationContextFromActiveMembership(context);
        const result = await timing.measure(
          "geocoder",
          () => service.beginLocation(context, {
            addressLine1: typeof body.addressLine1 === "string" ? body.addressLine1 : "",
            ...(typeof body.addressLine2 === "string" && body.addressLine2.trim()
              ? { addressLine2: body.addressLine2 }
              : {}),
            locality: typeof body.locality === "string" ? body.locality : "",
            regionCode: typeof body.regionCode === "string" ? body.regionCode : "",
            postalCode: typeof body.postalCode === "string" ? body.postalCode : "",
            isHomeOrPrivate: body.isHomeOrPrivate === true,
            visibility: typeof body.visibility === "string" ? body.visibility : "locality-only",
          }),
          "location geocode + draft persistence",
        );
        return timing.apply(NextResponse.json({
          state: result.state,
          draft: {
            id: String(result.draft.id),
            candidates: result.draft.candidates.map((candidate) => ({
              id: candidate.id,
              coordinate: candidate.coordinate,
              matchedAddress: candidate.matchedAddress,
              quality: candidate.quality,
              provider: candidate.provenance.provider,
            })),
          },
        }));
      }
      case "confirm-location": {
        await synchronizeActivationContextFromActiveMembership(context);
        const candidateId = typeof body.candidateId === "string" ? body.candidateId : "";
        const state = await timing.measure(
          "activation-action",
          () => service.confirmLocation(context, candidateId),
          action,
        );
        return timing.apply(NextResponse.json({ state }));
      }
      case "save-profile": {
        await synchronizeActivationContextFromActiveMembership(context);
        const state = await timing.measure(
          "activation-action",
          () => service.saveProfile(context, parseSaveProfileBody(body)),
          action,
        );
        return timing.apply(NextResponse.json({ state }));
      }
      case "refresh": {
        const state = await synchronizedState(service, context, timing);
        return timing.apply(NextResponse.json({ state }));
      }
      default:
        return timing.apply(NextResponse.json({ error: "Unsupported activation action." }, { status: 400 }));
    }
  } catch (error) {
    return timing.apply(errorResponse(request, error));
  }
}
