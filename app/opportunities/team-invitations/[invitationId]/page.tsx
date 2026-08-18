import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OpportunityTeamingError } from "@/src/application/rfx/opportunity-teaming-service";
import { OpportunityAssessmentUnavailable } from "@/src/components/rfx/OpportunityAssessmentUnavailable";
import { OpportunityTeamInvitationReview } from "@/src/components/rfx/OpportunityTeamInvitationReview";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerOpportunityTeamingService } from "@/src/infrastructure/rfx/opportunity-teaming-runtime";

export const dynamic = "force-dynamic";

export default async function OpportunityTeamInvitationPage({ params }: Readonly<{ params: Promise<{ invitationId: string }> }>) {
  const { invitationId } = await params;
  const currentHref = `/opportunities/team-invitations/${encodeURIComponent(invitationId)}`;
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect(`/signin?returnTo=${encodeURIComponent(currentHref)}`);
  if (access.kind === "access-resolution-required" || access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect(access.state.controlledPlatformUrl ?? "/join");
  const service = createServerOpportunityTeamingService();
  let invitation: Awaited<ReturnType<typeof service.review>> | null = null;
  let teamingError: OpportunityTeamingError["code"] | null = null;
  try {
    invitation = await service.review({ context: access.context, organizationId: access.membership.organizationId, userId: access.context.user.id, membershipId: access.membership.id, acquisitionContext: access.state.acquisitionContext }, invitationId);
  } catch (error) {
    if (!(error instanceof OpportunityTeamingError)) throw error;
    teamingError = error.code;
  }
  if (teamingError) return <OpportunityAssessmentUnavailable errorCode={teamingError} returnHref="/opportunities" retryHref={currentHref} />;
  if (!invitation) throw new Error("Team invitation review completed without a result.");
  return <OpportunityTeamInvitationReview invitation={invitation} />;
}
