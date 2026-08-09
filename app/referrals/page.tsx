import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ReferralWorkspace } from "@/src/components/referrals/ReferralWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import { loadAuthorizedNetworkDiscovery } from "@/src/infrastructure/network-discovery/runtime";
import { createServerReferralNetworkService } from "@/src/infrastructure/referrals/runtime";

interface ReferralPageProps { readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>; }

export default async function ReferralsPage({ searchParams }: ReferralPageProps) {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({ sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Freferrals");
  if (access.kind === "access-resolution-required") redirect(participantEntryDestination(access));
  if (access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect("/orientation");
  const mapProjection = await loadAuthorizedParticipantMapProjection(access) ?? redirect("/join");
  const params: Readonly<Record<string, string | string[] | undefined>> = searchParams ? await searchParams : {};
  const [referrals, discovery] = await Promise.all([
    createServerReferralNetworkService().snapshot({ context: access.context, organizationId: String(access.membership.organizationId), membershipId: String(access.membership.id) }),
    loadAuthorizedNetworkDiscovery({ access, mapProjection }),
  ]);
  const requested = params.referral;
  const requestedReferralId = typeof requested === "string" ? requested : Array.isArray(requested) ? requested[0] : null;
  const organizations = discovery.available
    ? discovery.projection.organizations.map((organization) => Object.freeze({
        organizationId: String(organization.organizationId),
        displayName: organization.profile.displayName,
        marker: Object.freeze({ id: organization.marker.id, coordinate: organization.marker.coordinate, accessibleLocationLabel: organization.marker.accessibleLocationLabel }),
      }))
    : [];
  return <ReferralWorkspace model={mapProjection.model} homeMarker={mapProjection.homeMarker} initialReferrals={referrals} organizations={organizations} requestedReferralId={requestedReferralId} />;
}
