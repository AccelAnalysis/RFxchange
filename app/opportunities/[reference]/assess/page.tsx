import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OpportunityAssessmentWorkspace } from "@/src/components/rfx/OpportunityAssessmentWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerOpportunityPursuitService } from "@/src/infrastructure/rfx/opportunity-pursuit-runtime";

export const dynamic = "force-dynamic";

export default async function OpportunityAssessmentPage({ params }: Readonly<{ params: Promise<{ reference: string }> }>) {
  const { reference } = await params;
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect(`/signin?returnTo=${encodeURIComponent(`/opportunities/${reference}/assess`)}`);
  if (access.kind === "access-resolution-required" || access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect(access.state.controlledPlatformUrl ?? "/join");
  const workspace = await createServerOpportunityPursuitService().workspace({ context: access.context, organizationId: access.membership.organizationId, userId: access.context.user.id, membershipId: access.membership.id }, reference);
  return <OpportunityAssessmentWorkspace workspace={workspace} />;
}
