import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { FoundingAcquisitionContinuation } from "@/src/components/acquisition/FoundingAcquisitionContinuation";
import {
  appendFoundingAcquisitionIntent,
  resolveFoundingAcquisitionIntent,
} from "@/src/infrastructure/acquisition/founding-intent";
import { OrientationJourneyClient } from "@/src/components/orientation/OrientationJourneyClient";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import {
  createServerOrientationJourneyService,
  resolveAuthorizedOrientationScope,
} from "@/src/infrastructure/orientation/runtime";

interface OrientationPageProps {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

export default async function OrientationPage({ searchParams }: OrientationPageProps) {
  const params = searchParams ? await searchParams : {};
  const acquisitionIntent = resolveFoundingAcquisitionIntent(params.acquisition);
  const orientationUrl = acquisitionIntent
    ? appendFoundingAcquisitionIntent("/orientation")
    : "/orientation";
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") {
    redirect(`/signin?returnTo=${encodeURIComponent(orientationUrl)}`);
  }
  if (access.kind === "access-resolution-required") {
    redirect(participantEntryDestination(access));
  }
  if (access.kind === "activation-required") {
    redirect(participantEntryDestination(
      access,
      acquisitionIntent ? "/acquisition/founding" : "/join",
    ));
  }
  if (access.kind === "wrong-organization") {
    const destination = access.state.controlledPlatformUrl ?? "/join";
    redirect(acquisitionIntent ? appendFoundingAcquisitionIntent(destination) : destination);
  }
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState === "open-platform") {
    redirect(acquisitionIntent ? appendFoundingAcquisitionIntent("/exchange") : "/exchange");
  }

  const [projection, scope] = await Promise.all([
    loadAuthorizedParticipantMapProjection(access),
    resolveAuthorizedOrientationScope(access),
  ]);
  if (!projection || !scope) redirect("/join");
  const journey = await createServerOrientationJourneyService().get(scope);
  return (
    <>
      {acquisitionIntent ? <FoundingAcquisitionContinuation /> : null}
      <OrientationJourneyClient
        model={projection.model}
        marker={projection.homeMarker}
        initialJourney={journey}
      />
    </>
  );
}
