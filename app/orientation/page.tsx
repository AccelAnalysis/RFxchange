import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OrientationJourneyClient } from "@/src/components/orientation/OrientationJourneyClient";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import {
  createServerOrientationJourneyService,
  resolveAuthorizedOrientationScope,
} from "@/src/infrastructure/orientation/runtime";

export default async function OrientationPage() {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Forientation");
  if (access.kind === "activation-required") redirect("/join");
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);

  const [projection, scope] = await Promise.all([
    loadAuthorizedParticipantMapProjection(access),
    resolveAuthorizedOrientationScope(access),
  ]);
  if (!projection || !scope) redirect("/join");
  const journey = await createServerOrientationJourneyService().get(scope);
  return <OrientationJourneyClient model={projection.model} marker={projection.homeMarker} initialJourney={journey} />;
}
