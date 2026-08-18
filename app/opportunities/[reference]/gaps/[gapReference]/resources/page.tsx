import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerOpportunityTeamingService } from "@/src/infrastructure/rfx/opportunity-teaming-runtime";

export const dynamic = "force-dynamic";

export default async function OpportunityGapResourcesPage({ params }: Readonly<{ params: Promise<{ reference: string; gapReference: string }> }>) {
  const { reference, gapReference } = await params;
  const currentHref = `/opportunities/${encodeURIComponent(reference)}/gaps/${encodeURIComponent(gapReference)}/resources`;
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect(`/signin?returnTo=${encodeURIComponent(currentHref)}`);
  if (access.kind === "access-resolution-required" || access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect(access.state.controlledPlatformUrl ?? "/join");
  const service = createServerOpportunityTeamingService();
  const context = await service.gapContext({ context: access.context, organizationId: access.membership.organizationId, userId: access.context.user.id, membershipId: access.membership.id, acquisitionContext: access.state.acquisitionContext }, reference, gapReference);
  redirect(service.resourceHref(context));
}
