import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OpportunityTeamInvitationInbox } from "@/src/components/rfx/OpportunityTeamInvitationInbox";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerOpportunityTeamingService } from "@/src/infrastructure/rfx/opportunity-teaming-runtime";

export const dynamic = "force-dynamic";

export default async function OpportunityTeamInvitationInboxPage() {
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fopportunities%2Fteam-invitations");
  if (access.kind === "access-resolution-required" || access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect(access.state.controlledPlatformUrl ?? "/join");
  const invitations = await createServerOpportunityTeamingService().receivedInvitations({ context: access.context, organizationId: access.membership.organizationId, userId: access.context.user.id, membershipId: access.membership.id, acquisitionContext: access.state.acquisitionContext });
  return <OpportunityTeamInvitationInbox invitations={invitations} />;
}
