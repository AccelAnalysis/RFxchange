import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ResourceNetworkError } from "@/src/application/resource-network/resource-network";
import { ResourceNetworkWorkspace } from "@/src/components/resource-network/ResourceNetworkWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import { loadAuthorizedNetworkDiscovery } from "@/src/infrastructure/network-discovery/runtime";
import { createServerReferralNetworkService } from "@/src/infrastructure/referrals/runtime";
import { loadAuthorizedResourceDiscovery } from "@/src/infrastructure/resource-network/discovery-runtime";
import { createServerResourceNetworkService } from "@/src/infrastructure/resource-network/runtime";

interface Props { readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>; }
function first(value: string | string[] | undefined) { return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : ""; }

export default async function ResourcesPage({ searchParams }: Props) {
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fresources");
  if (access.kind === "access-resolution-required") redirect(participantEntryDestination(access));
  if (access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect("/orientation");
  const mapProjection = await loadAuthorizedParticipantMapProjection(access) ?? redirect("/join");
  const params = searchParams ? await searchParams : {};
  const query = first(params.q);
  const availability = first(params.availability);
  const network = await loadAuthorizedNetworkDiscovery({ access, mapProjection });
  const markers = network.available ? network.projection.organizations.map((organization) => Object.freeze({ organizationId: String(organization.organizationId), marker: Object.freeze({ id: organization.marker.id, coordinate: organization.marker.coordinate, accessibleLocationLabel: organization.marker.accessibleLocationLabel }) })) : [];
  const service = createServerResourceNetworkService();
  const resourceProjection = await loadAuthorizedResourceDiscovery({ access, mapProjection, query, availability: availability || null, markers });
  const referrals = await createServerReferralNetworkService().snapshot({ context: access.context, organizationId: String(access.membership.organizationId), membershipId: String(access.membership.id) });
  const requestReferrals = referrals.filter((referral) => referral.purpose === "provider-connection");
  const messageThreads = Object.fromEntries(await Promise.all(requestReferrals.map(async (referral) => [referral.id, await service.messages({ context: access.context, organizationId: String(access.membership.organizationId), membershipId: String(access.membership.id) }, referral.id)] as const)));
  let owner = null;
  try { owner = await service.ownerSnapshot({ context: access.context, organizationId: String(access.membership.organizationId), membershipId: String(access.membership.id) }); }
  catch (error) { if (!(error instanceof ResourceNetworkError) || error.code !== "forbidden") throw error; }
  const commandRecoveryScope = `${String(access.membership.organizationId)}:${String(access.membership.id)}`;
  return <ResourceNetworkWorkspace model={mapProjection.model} homeMarker={mapProjection.homeMarker} providers={resourceProjection.available ? resourceProjection.projection.providers : []} resources={resourceProjection.available ? resourceProjection.projection.resources : []} referrals={referrals} owner={owner} commandRecoveryScope={commandRecoveryScope} initialQuery={query} messageThreads={messageThreads} />;
}
