import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ReferralWorkspace } from "@/src/components/referrals/ReferralWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { ParticipantRouteDependencyUnavailableError, RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import { loadAuthorizedNetworkDiscovery } from "@/src/infrastructure/network-discovery/runtime";
import { createServerReferralNetworkService } from "@/src/infrastructure/referrals/runtime";

interface ReferralPageProps { readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>; }

function firstSearchParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

function referralCounterpartyOrganizationId(
  referral: Awaited<ReturnType<ReturnType<typeof createServerReferralNetworkService>["snapshot"]>>[number],
): string | null {
  return referral.role === "sender"
    ? referral.recipientOrganizationId ? String(referral.recipientOrganizationId) : null
    : String(referral.senderOrganizationId);
}

export default async function ReferralsPage({ searchParams }: ReferralPageProps) {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({ sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Freferrals");
  if (access.kind === "access-resolution-required") redirect(participantEntryDestination(access));
  if (access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect(access.state.controlledPlatformUrl ?? "/join");
  const mapProjection = await loadAuthorizedParticipantMapProjection(access);
  if (!mapProjection) throw new ParticipantRouteDependencyUnavailableError("workspace-state", new Error("Authorized referral map projection is incomplete."));
  const params: Readonly<Record<string, string | string[] | undefined>> = searchParams ? await searchParams : {};
  const managementIntent = firstSearchParam(params.intent) === "manage";
  const requestedOrganization = params.organization;
  const requestedOrganizationId = typeof requestedOrganization === "string"
    ? requestedOrganization
    : Array.isArray(requestedOrganization)
      ? requestedOrganization[0]
      : null;
  const requested = params.referral;
  const requestedReferralId = typeof requested === "string" ? requested : Array.isArray(requested) ? requested[0] : null;
  const referralsPromise = createServerReferralNetworkService().snapshot({ context: access.context, organizationId: String(access.membership.organizationId), membershipId: String(access.membership.id) });
  const focusedOrganizationIdPromise = requestedReferralId
    ? referralsPromise.then((referrals) => {
        const requestedReferral = referrals.find((referral) => referral.id === requestedReferralId);
        return requestedReferral
          ? referralCounterpartyOrganizationId(requestedReferral)
          : requestedOrganizationId;
      })
    : requestedOrganizationId
      ? Promise.resolve(requestedOrganizationId)
      : referralsPromise.then((referrals) => referrals[0]
          ? referralCounterpartyOrganizationId(referrals[0])
          : null);
  const discoveryPromise = focusedOrganizationIdPromise.then((focusedOrganizationId) =>
    loadAuthorizedNetworkDiscovery({ access, mapProjection, focusedOrganizationId }),
  );
  const [referrals, discovery] = await Promise.all([referralsPromise, discoveryPromise]);
  const authorizedRequestedReferralId = requestedReferralId && referrals.some((referral) => referral.id === requestedReferralId)
    ? requestedReferralId
    : null;
  const organizations = discovery.available
    ? discovery.projection.organizations.map((organization) => Object.freeze({
        organizationId: String(organization.organizationId),
        displayName: organization.profile.displayName,
        marker: Object.freeze({ id: organization.marker.id, coordinate: organization.marker.coordinate, accessibleLocationLabel: organization.marker.accessibleLocationLabel }),
      }))
    : [];
  const authorizedRequestedOrganizationId = requestedOrganizationId && organizations.some(
    (organization) => organization.organizationId === requestedOrganizationId,
  )
    ? requestedOrganizationId
    : null;
  const commandRecoveryScope = `${String(access.membership.organizationId)}:${String(access.membership.id)}`;
  return <ReferralWorkspace
    key={authorizedRequestedReferralId ?? authorizedRequestedOrganizationId ?? "default"}
    model={mapProjection.model}
    homeMarker={mapProjection.homeMarker}
    spatialScope={{ participantId: String(access.context.user.id), membershipId: String(access.membership.id), organizationId: String(access.membership.organizationId), geographyId: String(mapProjection.model.selectedGeography.id) }}
    initialReferrals={referrals}
    organizations={organizations}
    commandRecoveryScope={commandRecoveryScope}
    requestedReferralId={authorizedRequestedReferralId}
    requestedOrganizationId={authorizedRequestedOrganizationId}
    preferOrganizationSelection={Boolean(authorizedRequestedOrganizationId && !authorizedRequestedReferralId)}
    legacyBareLensIntent={!managementIntent && !requestedReferralId && !requestedOrganizationId}
  />;
}
