import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ResourceNetworkError } from "@/src/application/resource-network/resource-network";
import {
  authorizedWorkspaceSelection,
  parseResourceNetworkWorkspaceQuery,
} from "@/src/application/resource-network/resource-network-workspace";
import { ResourceNetworkWorkspace } from "@/src/components/resource-network/ResourceNetworkWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { ParticipantRouteDependencyUnavailableError, RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import { loadAuthorizedNetworkDiscovery } from "@/src/infrastructure/network-discovery/runtime";
import { createServerReferralNetworkService } from "@/src/infrastructure/referrals/runtime";
import { loadAuthorizedResourceDiscovery } from "@/src/infrastructure/resource-network/discovery-runtime";
import { createServerResourceNetworkService } from "@/src/infrastructure/resource-network/runtime";

interface Props { readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>; }

export default async function ResourcesPage({ searchParams }: Props) {
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fresources");
  if (access.kind === "access-resolution-required") redirect(participantEntryDestination(access));
  if (access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect("/orientation");
  const mapProjection = await loadAuthorizedParticipantMapProjection(access);
  if (!mapProjection) throw new ParticipantRouteDependencyUnavailableError("workspace-state", new Error("Authorized Resource Network map projection is incomplete."));
  const params = searchParams ? await searchParams : {};
  const queryState = parseResourceNetworkWorkspaceQuery(params);
  const network = await loadAuthorizedNetworkDiscovery({ access, mapProjection });
  const markers = network.available ? network.projection.organizations.map((organization) => Object.freeze({ organizationId: String(organization.organizationId), marker: Object.freeze({ id: organization.marker.id, coordinate: organization.marker.coordinate, accessibleLocationLabel: organization.marker.accessibleLocationLabel }) })) : [];
  const service = createServerResourceNetworkService();
  const resourceProjection = await loadAuthorizedResourceDiscovery({ access, mapProjection, query: queryState.query, availability: queryState.availability === "all" ? null : queryState.availability, markers });
  const referrals = await createServerReferralNetworkService().snapshot({ context: access.context, organizationId: String(access.membership.organizationId), membershipId: String(access.membership.id) });
  const requestReferrals = referrals.filter((referral) => referral.purpose === "provider-connection");
  const providers = resourceProjection.available ? resourceProjection.projection.providers : [];
  const selectedProviderId = authorizedWorkspaceSelection(
    queryState.providerId,
    providers.map((provider) => String(provider.organizationId)),
  );
  const selectedRequestId = authorizedWorkspaceSelection(
    queryState.requestId,
    requestReferrals.map((referral) => referral.id),
  );
  const selectedMessages = selectedRequestId
    ? await service.messages({ context: access.context, organizationId: String(access.membership.organizationId), membershipId: String(access.membership.id) }, selectedRequestId)
    : [];
  let owner = null;
  try { owner = await service.ownerSnapshot({ context: access.context, organizationId: String(access.membership.organizationId), membershipId: String(access.membership.id) }); }
  catch (error) { if (!(error instanceof ResourceNetworkError) || error.code !== "forbidden") throw error; }
  const commandRecoveryScope = `${String(access.membership.organizationId)}:${String(access.membership.id)}`;
  return <ResourceNetworkWorkspace model={mapProjection.model} homeMarker={mapProjection.homeMarker} providers={providers} resources={resourceProjection.available ? resourceProjection.projection.resources : []} referrals={referrals} owner={owner} commandRecoveryScope={commandRecoveryScope} queryState={Object.freeze({ ...queryState, providerId: selectedProviderId, requestId: selectedRequestId })} selectedMessages={selectedMessages} />;
}
