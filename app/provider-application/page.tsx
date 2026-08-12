import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ProviderApplicationWorkspace } from "@/src/components/resource-providers/ProviderApplicationWorkspace";
import { OperationalWorkspace, ParticipantShell } from "@/src/components/participant/ParticipantWorkspace";
import { ResourceProviderFoundationError } from "@/src/application/resource-providers/provider-foundation";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerResourceProviderFoundationService } from "@/src/infrastructure/resource-providers/runtime";

export default async function ProviderApplicationPage() {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({ sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fprovider-application");
  if (access.kind === "access-resolution-required") redirect(participantEntryDestination(access));
  if (access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect(access.state.controlledPlatformUrl ?? "/join");
  const providerFoundation = createServerResourceProviderFoundationService();
  let initialSnapshot: Awaited<ReturnType<typeof providerFoundation.participantSnapshot>> | null = null;
  try {
    initialSnapshot = await providerFoundation.participantSnapshot({ context: access.context, organizationId: String(access.membership.organizationId), membershipId: String(access.membership.id) });
  } catch (error) {
    if (!(error instanceof ResourceProviderFoundationError) || error.code !== "forbidden") throw error;
  }
  if (!initialSnapshot) {
    return <ParticipantShell activeItem="Account"><OperationalWorkspace ariaLabel="Resource Provider permission required"><section style={{ margin: "clamp(1rem, 5vw, 4rem) auto", maxWidth: 720, padding: "clamp(1rem, 4vw, 2rem)", background: "#fffdf8", border: "1px solid #d8d3c8", borderRadius: 16 }}><p style={{ textTransform: "uppercase", letterSpacing: ".1em", color: "#577068" }}>Organization permission</p><h1>Resource Provider access is unavailable.</h1><p>A current organization manager with the <strong>resource.manage</strong> permission can request or maintain Resource Provider status. Your membership remains active, but it does not authorize this operation.</p></section></OperationalWorkspace></ParticipantShell>;
  }
  return <ProviderApplicationWorkspace initialSnapshot={initialSnapshot} />;
}
