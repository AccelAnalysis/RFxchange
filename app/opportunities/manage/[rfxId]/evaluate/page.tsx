import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { RfxIssuerEvaluationWorkspace } from "@/src/components/rfx/RfxIssuerEvaluationWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerRfxCycleService } from "@/src/infrastructure/rfx/rfx-cycle-runtime";

export const dynamic = "force-dynamic";

export default async function RfxIssuerEvaluationPage({ params }: Readonly<{ params: Promise<{ rfxId: string }> }>) {
  const { rfxId } = await params;
  const currentHref = `/opportunities/manage/${encodeURIComponent(rfxId)}/evaluate`;
  const access = await resolveParticipantRoute({
    sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") redirect(`/signin?returnTo=${encodeURIComponent(currentHref)}`);
  if (access.kind === "access-resolution-required" || access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect(access.state.controlledPlatformUrl ?? "/join");

  const workspace = await createServerRfxCycleService().issuerWorkspace({
    context: access.context,
    organizationId: access.membership.organizationId,
    membershipId: access.membership.id,
    userId: access.context.user.id,
  }, rfxId);

  return <RfxIssuerEvaluationWorkspace
    initialWorkspace={workspace}
    viewerMembershipId={String(access.membership.id)}
    returnHref="/opportunities/manage"
  />;
}
