import { NextRequest, NextResponse } from "next/server";

import type { AuthenticatedServerContext } from "@/src/application/auth/server-session";
import { ActivationJourneyError } from "@/src/application/onboarding/activation-journey";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
} from "@/src/infrastructure/auth/firebase-server-session";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
import { createFirestoreGeographyRepositories } from "@/src/infrastructure/firestore/geography-repositories";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import {
  CensusTigerLocalityDirectory,
  type CensusLocalityCandidate,
} from "@/src/infrastructure/geography/census-tiger-locality-directory";
import { synchronizeActivationContextFromAuthority } from "@/src/infrastructure/onboarding/activation-context-sync";
import { createServerActivationJourneyService } from "@/src/infrastructure/onboarding/runtime";

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

async function authenticatedContext(request: NextRequest): Promise<AuthenticatedServerContext> {
  const sessionCookie = request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) throw new Error("RFxchange session is required.");
  return createServerAuthenticationBoundary().authenticateSessionCookie({
    sessionCookie,
    now: new Date().toISOString(),
  });
}

async function synchronizedState(
  service: ReturnType<typeof createServerActivationJourneyService>,
  context: AuthenticatedServerContext,
) {
  const state = await service.state(context);
  await synchronizeActivationContextFromAuthority(context, state);
  return state;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Activation request failed.";
  if (error instanceof ActivationJourneyError) {
    return NextResponse.json({ error: message, code: error.code }, { status: 409 });
  }
  if (/session|credential|authentication/i.test(message)) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  try {
    const context = await authenticatedContext(request);
    const service = createServerActivationJourneyService();
    const state = await synchronizedState(service, context);
    return NextResponse.json({ state });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await authenticatedContext(request);
    const service = createServerActivationJourneyService();
    const body = (await request.json()) as Readonly<Record<string, unknown>>;
    const action = typeof body.action === "string" ? body.action : "";

    switch (action) {
      case "accept-legal": {
        return NextResponse.json({ state: await service.acceptLegal(context) });
      }
      case "search-geographies": {
        const current = await synchronizedState(service, context);
        if (!current.legalAccepted) {
          return NextResponse.json(
            { error: "Accept the current participation policies before selecting a home locality." },
            { status: 409 },
          );
        }
        const query = typeof body.query === "string" ? body.query : "";
        const stateCode = typeof body.stateCode === "string" ? body.stateCode : "";
        const candidates = await cachedLocalitySuggestions(query, stateCode);
        return NextResponse.json({ candidates });
      }
      case "select-census-geography": {
        const current = await synchronizedState(service, context);
        if (!current.legalAccepted) {
          return NextResponse.json(
            { error: "Accept the current participation policies before selecting a home locality." },
            { status: 409 },
          );
        }
        const reference = typeof body.reference === "string" ? body.reference : "";
        const geography = await localityDirectory.resolve(reference);
        await createFirestoreGeographyRepositories(getServerFirestore()).definitions.save(geography);
        return NextResponse.json({ state: await service.selectGeography(context, String(geography.id)) });
      }
      case "select-geography": {
        const geographyId = typeof body.geographyId === "string" ? body.geographyId : "";
        return NextResponse.json({ state: await service.selectGeography(context, geographyId) });
      }
      case "acknowledge-orientation-position": {
        return NextResponse.json({ state: await service.acknowledgeOrientationPosition(context) });
      }
      case "search-organizations": {
        const displayName = typeof body.displayName === "string" ? body.displayName : "";
        const result = await service.searchOrganizations(context, {
          displayName,
          ...parseWebsiteIdentityFields(body),
          ...(typeof body.phone === "string" && body.phone.trim() ? { phone: body.phone } : {}),
        });
        return NextResponse.json({
          provisionalIdentity: result.provisionalIdentity,
          candidates: result.candidates,
          creationSafety: result.creationSafety,
        });
      }
      case "create-organization": {
        const current = await synchronizedState(service, context);
        if (!current.emailVerified) {
          return NextResponse.json(
            { error: "Verify your email before creating or claiming an organization.", code: "email-verification-required" },
            { status: 409 },
          );
        }
        const displayName = typeof body.displayName === "string" ? body.displayName : "";
        const reviewedCandidateOrganizationIds = Array.isArray(body.reviewedCandidateOrganizationIds)
          ? body.reviewedCandidateOrganizationIds.filter((value): value is string => typeof value === "string")
          : [];
        const state = await service.createOrganization(context, {
          displayName,
          reviewedCandidateOrganizationIds,
          ...parseWebsiteIdentityFields(body),
          ...(typeof body.phone === "string" && body.phone.trim() ? { phone: body.phone } : {}),
        });
        return NextResponse.json({ state });
      }
      case "select-existing-organization": {
        const current = await synchronizedState(service, context);
        if (!current.emailVerified) {
          return NextResponse.json(
            { error: "Verify your email before creating or claiming an organization.", code: "email-verification-required" },
            { status: 409 },
          );
        }
        const displayName = typeof body.displayName === "string" ? body.displayName : "";
        const organizationId = typeof body.organizationId === "string" ? body.organizationId : "";
        const state = await service.selectExistingOrganization(context, {
          displayName,
          organizationId,
          ...(typeof body.domainEmailReference === "string" && body.domainEmailReference.trim()
            ? { domainEmailReference: body.domainEmailReference }
            : {}),
        });
        return NextResponse.json({ state });
      }
      case "begin-location": {
        await synchronizedState(service, context);
        const result = await service.beginLocation(context, {
          addressLine1: typeof body.addressLine1 === "string" ? body.addressLine1 : "",
          ...(typeof body.addressLine2 === "string" && body.addressLine2.trim()
            ? { addressLine2: body.addressLine2 }
            : {}),
          locality: typeof body.locality === "string" ? body.locality : "",
          regionCode: typeof body.regionCode === "string" ? body.regionCode : "",
          postalCode: typeof body.postalCode === "string" ? body.postalCode : "",
          isHomeOrPrivate: body.isHomeOrPrivate === true,
          visibility: typeof body.visibility === "string" ? body.visibility : "locality-only",
        });
        return NextResponse.json({
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
        });
      }
      case "confirm-location": {
        await synchronizedState(service, context);
        const candidateId = typeof body.candidateId === "string" ? body.candidateId : "";
        return NextResponse.json({ state: await service.confirmLocation(context, candidateId) });
      }
      case "save-profile": {
        await synchronizedState(service, context);
        const state = await service.saveProfile(context, parseSaveProfileBody(body));
        return NextResponse.json({ state });
      }
      case "refresh": {
        return NextResponse.json({ state: await synchronizedState(service, context) });
      }
      default:
        return NextResponse.json({ error: "Unsupported activation action." }, { status: 400 });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
