import {
  projectIntelligenceMobileExchange,
  type IntelligenceMobileExchangeProjection,
} from "../../application/intelligence/mobile-exchange-intelligence.ts";
import type { NetworkDiscoveryOrganization } from "../../application/network-discovery/network-discovery.ts";
import type { Locale } from "../../i18n/config.ts";
import type { ParticipantRouteResolution } from "../auth/participant-route-runtime.ts";
import type { AuthenticatedMapProjection } from "../geography/participant-map-runtime.ts";
import type { AuthenticatedNetworkDiscovery } from "../network-discovery/runtime.ts";

type AuthorizedParticipant = Extract<ParticipantRouteResolution, { readonly kind: "authorized" }>;

export interface AuthorizedIntelligenceMobileExchangeRuntime
  extends IntelligenceMobileExchangeProjection {
  readonly sourceDiscovery: AuthenticatedNetworkDiscovery;
  readonly focusedOrganization: NetworkDiscoveryOrganization | null;
  readonly authorizationBoundary: "authorized-participant-route-and-network-discovery";
}

function focusedOrganizationFrom(
  selectedOrganizationId: string | null,
  discovery: AuthenticatedNetworkDiscovery,
  focusedDiscovery: AuthenticatedNetworkDiscovery | null,
): NetworkDiscoveryOrganization | null {
  if (!selectedOrganizationId || !discovery.available) return null;
  const candidates = [
    ...discovery.projection.organizations,
    ...(focusedDiscovery?.available ? focusedDiscovery.projection.organizations : []),
  ];
  return candidates.find(
    (organization) => String(organization.organizationId) === selectedOrganizationId,
  ) ?? null;
}

/**
 * This is the server-only Stage 4 adapter boundary. Both the participant route and
 * Network discovery have already enforced membership, lifecycle and geography.
 * The shared projection then independently validates geography, layers and result/map identity.
 */
export function projectAuthorizedIntelligenceMobileExchange(input: Readonly<{
  access: AuthorizedParticipant;
  mapProjection: AuthenticatedMapProjection;
  discovery: AuthenticatedNetworkDiscovery;
  focusedDiscovery?: AuthenticatedNetworkDiscovery | null;
  selectedOrganizationId?: string | null;
  locale: Locale;
  projectedAt?: string;
}>): AuthorizedIntelligenceMobileExchangeRuntime {
  if (input.access.kind !== "authorized") {
    throw new Error("Intelligence runtime requires an authorized participant route.");
  }
  if (String(input.access.membership.organizationId) !== input.mapProjection.organizationId) {
    throw new Error("Intelligence runtime organization must match the authorized participant membership.");
  }
  const geographyId = String(input.mapProjection.model.selectedGeography.id);
  if (
    input.discovery.available
    && input.discovery.projection.query.baseGeographyId !== geographyId
  ) {
    throw new Error("Intelligence discovery geography must match the authorized map projection.");
  }
  if (
    input.focusedDiscovery?.available
    && input.focusedDiscovery.projection.query.baseGeographyId !== geographyId
  ) {
    throw new Error("Focused Intelligence discovery geography must match the authorized map projection.");
  }
  const selectedOrganizationId = input.selectedOrganizationId?.trim() || null;
  const focusedOrganization = focusedOrganizationFrom(
    selectedOrganizationId,
    input.discovery,
    input.focusedDiscovery ?? null,
  );
  const projection = projectIntelligenceMobileExchange({
    locale: input.locale,
    viewerUserId: String(input.access.context.user.id),
    viewerOrganizationId: input.mapProjection.organizationId,
    mapModel: input.mapProjection.model,
    discovery: input.discovery.available ? input.discovery.projection : null,
    unavailableReason: input.discovery.available ? null : input.discovery.reason,
    focusedOrganization,
    selectedOrganizationId: focusedOrganization ? selectedOrganizationId : null,
    projectedAt: input.projectedAt ?? new Date().toISOString(),
  });
  return Object.freeze({
    ...projection,
    sourceDiscovery: input.discovery,
    focusedOrganization,
    authorizationBoundary: "authorized-participant-route-and-network-discovery",
  });
}
