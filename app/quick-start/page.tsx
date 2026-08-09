import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { QuickStartWorkspace } from "@/src/components/network-education/QuickStartWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerNetworkEducationService, isOfficialResourceProvider } from "@/src/infrastructure/network-education/runtime";

export default async function QuickStartPage() {
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fquick-start");
  if (access.kind === "access-resolution-required") redirect(participantEntryDestination(access));
  if (access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect("/orientation");
  const organizationId = String(access.membership.organizationId);
  const initialSnapshot = await createServerNetworkEducationService().snapshot(
    { context: access.context, organizationId, membershipId: String(access.membership.id) },
    await isOfficialResourceProvider(organizationId),
  );
  return <QuickStartWorkspace initialSnapshot={initialSnapshot} />;
}
