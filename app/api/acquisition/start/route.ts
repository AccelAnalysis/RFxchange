import { NextRequest, NextResponse } from "next/server";

import { serializeAcquisitionContextToken } from "@/src/application/acquisition/acquisition-context";
import { serializeOpaqueOpportunityCandidate } from "@/src/application/acquisition/opaque-opportunity-candidate";
import { accessJourneyId } from "@/src/domain/lifecycle/model";
import { activationJourneyIdForUser } from "@/src/domain/onboarding/model";
import {
  acquisitionCookieOptions,
  createServerAcquisitionContextService,
  resolveOpportunityPublicationAudience,
  RFXCHANGE_ACQUISITION_COOKIE_NAME,
} from "@/src/infrastructure/acquisition/runtime";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { FirestoreActivationJourneyContextRepository } from "@/src/infrastructure/firestore/activation-journey";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";

function setAcquisitionCookie(response: NextResponse, value: string): NextResponse {
  response.cookies.set(
    RFXCHANGE_ACQUISITION_COOKIE_NAME,
    value,
    acquisitionCookieOptions(),
  );
  return response;
}

function withPersistentAcquisitionCookie(
  response: NextResponse,
  token: Parameters<typeof serializeAcquisitionContextToken>[0],
): NextResponse {
  return setAcquisitionCookie(response, serializeAcquisitionContextToken(token));
}

function withOpaqueCandidateCookie(
  response: NextResponse,
  reference: string,
): NextResponse {
  return setAcquisitionCookie(response, serializeOpaqueOpportunityCandidate(reference));
}

async function persistAndBindCandidate(
  request: NextRequest,
  reference: string,
  userId: string,
): Promise<Readonly<{
  token: Awaited<ReturnType<ReturnType<typeof createServerAcquisitionContextService>["issueOpaqueOpportunityCandidate"]>>;
  attached: boolean;
}>> {
  const service = createServerAcquisitionContextService();
  const token = await service.issueOpaqueOpportunityCandidate({
    reference,
    referrer: request.headers.get("referer"),
  });
  const bound = await service.bind({
    token,
    userId,
    accessJourneyId: accessJourneyId(activationJourneyIdForUser(userId)),
  });
  const contexts = new FirestoreActivationJourneyContextRepository(getServerFirestore());
  const attached = await contexts.attachAcquisitionContext(userId, bound);
  return Object.freeze({ token, attached });
}

function authenticatedDestination(
  access: Awaited<ReturnType<typeof resolveParticipantRoute>>,
  reference: string,
): string {
  if (access.kind === "activation-required" || access.kind === "access-resolution-required") {
    return participantEntryDestination(access);
  }
  if (access.kind === "wrong-organization") {
    return access.state.controlledPlatformUrl ?? "/join";
  }
  if (access.kind === "restricted") {
    return `/join?access=${encodeURIComponent(access.restrictionState)}`;
  }
  return `/opportunities/${encodeURIComponent(reference)}`;
}

function signInResponse(request: NextRequest, reference: string) {
  const returnTo = `/opportunities/${encodeURIComponent(reference)}`;
  return NextResponse.redirect(
    new URL(`/signin?returnTo=${encodeURIComponent(returnTo)}`, request.url),
    303,
  );
}

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("opportunityReference")?.trim() ?? "";
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(reference)) {
      throw new Error("Opportunity reference is invalid.");
    }

    const sessionCookie = request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
      // Opaque candidate only: no protected lookup and no persistent write before authentication.
      return withOpaqueCandidateCookie(signInResponse(request, reference), reference);
    }

    const access = await resolveParticipantRoute({ sessionCookie });
    if (access.kind === "unauthenticated") {
      return withOpaqueCandidateCookie(signInResponse(request, reference), reference);
    }

    if (access.kind === "authorized") {
      const audience = await resolveOpportunityPublicationAudience(reference);
      if (audience !== "authenticated-participants") {
        throw new Error("Authenticated-participant opportunity is unavailable.");
      }
    }

    const userId = "context" in access ? access.context.user.id : null;
    const persisted = userId
      ? await persistAndBindCandidate(request, reference, userId)
      : null;
    const response = NextResponse.redirect(
      new URL(authenticatedDestination(access, reference), request.url),
      303,
    );
    return persisted && !persisted.attached
      ? withPersistentAcquisitionCookie(response, persisted.token)
      : response;
  } catch {
    return NextResponse.json(
      { error: "This authenticated opportunity is unavailable." },
      { status: 404 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const reference = typeof form.get("opportunityReference") === "string"
      ? String(form.get("opportunityReference"))
      : "";
    const issued = await createServerAcquisitionContextService().issuePublicOpportunity({
      reference,
      referrer: request.headers.get("referer"),
    });
    return withPersistentAcquisitionCookie(
      NextResponse.redirect(new URL("/join?entry=opportunity", request.url), 303),
      issued.token,
    );
  } catch {
    return NextResponse.json({ error: "This public opportunity is unavailable." }, { status: 404 });
  }
}
