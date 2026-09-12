import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PublicDataReview } from "@/src/components/communications/PublicDataReview";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { OperationalWorkspace, ParticipantShell } from "@/src/components/participant/ParticipantWorkspace";
import { getRequestDictionary } from "@/src/i18n/server";
export default async function Page() {
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Forganization-profile%2Fpublic-data");
  if (access.kind === "access-resolution-required") redirect(participantEntryDestination(access));
  if (access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  const { dictionary } = await getRequestDictionary();
  return <ParticipantShell activeItem="account"><OperationalWorkspace ariaLabel={dictionary.interface.services.data.title}><PublicDataReview organizationId={String(access.membership.organizationId)}/></OperationalWorkspace></ParticipantShell>;
}
