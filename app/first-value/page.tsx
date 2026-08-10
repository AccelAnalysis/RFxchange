import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { FirstValueChoiceClient } from "@/src/components/first-value/FirstValueChoiceClient";
import { FIRST_VALUE_DESTINATIONS, FIRST_VALUE_INTENTS } from "@/src/domain/first-value/model";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  ParticipantRouteDependencyUnavailableError,
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import {
  createServerFirstValueAndOpenReleaseService,
  openReleaseScopeFromAccess,
} from "@/src/infrastructure/activation-release/runtime";
import { createServerOrientationJourneyService, resolveAuthorizedOrientationScope } from "@/src/infrastructure/orientation/runtime";

export default async function FirstValuePage() {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Ffirst-value");
  if (access.kind === "access-resolution-required") redirect(participantEntryDestination(access));
  if (access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState === "open-platform") redirect("/exchange");

  const scope = openReleaseScopeFromAccess(access);
  const orientationScope = await resolveAuthorizedOrientationScope(access);
  if (!orientationScope) {
    throw new ParticipantRouteDependencyUnavailableError(
      "workspace-state",
      new Error("Authorized first-value orientation scope is incomplete."),
    );
  }
  const orientation = await createServerOrientationJourneyService().get(orientationScope);
  if (!orientation || orientation.status !== "completed" || orientation.completedThroughStep !== 8) redirect("/orientation");

  const service = createServerFirstValueAndOpenReleaseService(access);
  const acquisitionKind = access.state.acquisitionContext?.kind ?? null;
  const recommendation = service.recommendation(acquisitionKind);
  const selection = await service.get(scope);
  return (
    <FirstValueChoiceClient
      destinations={FIRST_VALUE_INTENTS.map((intent) => FIRST_VALUE_DESTINATIONS[intent])}
      recommendation={recommendation}
      initialSelection={selection?.selectedIntent ?? recommendation}
      acquisitionContextLabel={access.state.acquisitionContext?.kind ?? null}
    />
  );
}
