import { NextRequest, NextResponse } from "next/server";

import { serializeAcquisitionContextToken } from "@/src/application/acquisition/acquisition-context";
import { accessJourneyId } from "@/src/domain/lifecycle/model";
import {
  activationJourneyIdForUser,
  updateActivationJourneyContext,
} from "@/src/domain/onboarding/model";
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

function withAcquisitionCookie(
  response: NextResponse,
  token: Parameters<typeof serializeAcquisitionContextToken>[0],
): NextResponse {
  response.cookies.set(
    RFXCHANGE_ACQUISITION_COOKIE_NAME,
    serializeAcquisitionContextToken(token),
    acquisitionCookieOptions(),
  );
  return response;
}

async function bindExistingActivation(
  token: Parameters<typeof serializeAcquisitionContextToken>[0],
  userId: string,
): Promise<boolean> {
  const contexts = new FirestoreActivationJourneyContextRepository(getServerFirestore());
  const current = await contexts.getByUserId(userId);
  if (!current) return false;

  const bound = await createServerAcquisitionContextService().bind({
    token,
    userId,
    accessJourneyId: accessJourneyId(activationJourneyIdForUser(userId)),
  });
  await contexts.save(updateActivationJourneyContext(current, {
    acquisitionContext: bound,
    now: new Date().toISOString(),
  }));
  return true;
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

async function opaqueCandidate(request: NextRequest, reference: string) {
  return createServerAcquisitionContextService().issueOpaqueOpportunityCandidate({
    reference,
    referrer: request.headers.get("referer"),
  });
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
      // Do not inspect protected publication state for an anonymous caller. Every syntactically
      // valid reference receives the same non-authorizing acquisition/sign-in response.
      return withAcquisitionCookie(
        signInResponse(request, reference),
        await opaqueCandidate(request, reference),
      );
    }

    const access = await resolveParticipantRoute({ sessionCookie });
    if (access.kind === "unauthenticated") {
      return withAcquisitionCookie(
        signInResponse(request, reference),
        await opaqueCandidate(request, reference),
      );
    }

    // Before current participant authorization, preserve the opaque candidate without asking
    // Firestore whether the protected reference exists. Resolution/activation therefore cannot
    // become an existence oracle. Actual opportunity authority is checked only for an authorized
    // participant and again by the opportunity/continuation route before payload disclosure.
    if (access.kind === "authorized") {
      const audience = await resolveOpportunityPublicationAudience(reference);
      if (audience !== "authenticated-participants") {
        throw new Error("Authenticated-participant opportunity is unavailable.");
      }
    }

    const token = await opaqueCandidate(request, reference);
    const userId = "context" in access ? access.context.user.id : null;
    const attached = userId ? await bindExistingActivation(token, userId) : false;
    const response = NextResponse.redirect(
      new URL(authenticatedDestination(access, reference), request.url),
      303,
    );
    return attached ? response : withAcquisitionCookie(response, token);
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
    return withAcquisitionCookie(
      NextResponse.redirect(new URL("/join?entry=opportunity", request.url), 303),
      issued.token,
    );
  } catch {
    return NextResponse.json({ error: "This public opportunity is unavailable." }, { status: 404 });
  }
}
