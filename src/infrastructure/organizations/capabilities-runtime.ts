import type { CapabilitiesQuery } from "../../application/organizations/capabilities-exchange.ts";
import {
  createCapabilitiesExchangeProjection,
  externalCapabilitySource,
  type CapabilitiesExchangeProjection,
} from "../../application/organizations/capabilities-exchange.ts";
import { capabilitiesLocaleCatalog } from "../../application/organizations/capabilities-locale.ts";
import type { ParticipantRouteResolution } from "../auth/participant-route-runtime.ts";
import type { AuthenticatedMapProjection } from "../geography/participant-map-runtime.ts";
import { loadImmutableAmacsCatalog } from "../amacs/runtime.ts";
import { createServerFirestoreFoundationRepositories } from "../firestore/runtime.ts";
import { loadAuthorizedMarketProfile } from "../market-profile/runtime.ts";
import { loadAuthorizedNetworkDiscovery } from "../network-discovery/runtime.ts";
import type { Locale } from "../../i18n/config.ts";

type AuthorizedParticipant = Extract<ParticipantRouteResolution, { readonly kind: "authorized" }>;

const PINNED_AMACS_VERSION = "0.5.0";
const PINNED_AMACS_SOURCE = "da7879f2609271b067ae6d02875e9388a02c4fe5";

export interface AuthorizedCapabilitiesRuntime {
  readonly projection: CapabilitiesExchangeProjection;
  readonly serviceAreaOptions: readonly Readonly<{ id: string; label: string }>[];
}

export async function loadAuthorizedCapabilitiesExchange(input: Readonly<{
  access: AuthorizedParticipant;
  mapProjection: AuthenticatedMapProjection;
  query: CapabilitiesQuery;
  locale: Locale;
}>): Promise<AuthorizedCapabilitiesRuntime> {
  const catalogPromise = loadImmutableAmacsCatalog();
  const networkPromise = loadAuthorizedNetworkDiscovery({
    access: input.access,
    mapProjection: input.mapProjection,
    capability: input.query.search,
    serviceGeographyId: input.query.serviceGeographyId,
    page: input.query.page,
    focusedOrganizationId: input.query.selectedOrganizationId,
  });
  const [owner, network, authorization, catalog] = await Promise.all([
    loadAuthorizedMarketProfile(input.access),
    networkPromise,
    createServerFirestoreFoundationRepositories().organizationAuthorization.getByMembershipId(input.access.membership.id),
    catalogPromise,
  ]);
  const [release, domains, searchPage] = await Promise.all([
    catalog.getRelease(),
    catalog.listDomains(),
    catalog.searchCapabilities({
      query: input.query.amacsSearch,
      domainId: input.query.amacsDomainId,
      page: 1,
      pageSize: input.query.amacsSearch || input.query.amacsDomainId ? 12 : 1,
    }),
  ]);
  if (release.version !== PINNED_AMACS_VERSION || release.sourceCommit !== PINNED_AMACS_SOURCE) {
    throw new Error("Capabilities requires the pinned immutable AMACS 0.5.0 release.");
  }
  const viewerOrganizationId = String(input.access.membership.organizationId);
  const authorizationMatches = authorization
    && String(authorization.userId) === String(input.access.context.user.id)
    && String(authorization.organizationId) === viewerOrganizationId
    && String(authorization.membershipId) === String(input.access.membership.id);
  const canManageProfile = Boolean(
    authorizationMatches && authorization.permissions.includes("organization.profile.manage"),
  );
  const external = network.available
    ? network.projection.organizations
        .filter((organization) => String(organization.organizationId) !== viewerOrganizationId)
        .map(externalCapabilitySource)
    : [];
  const ownSource = Object.freeze({
    organizationId: viewerOrganizationId,
    organizationName: input.mapProjection.homeMarker.label,
    locality: input.mapProjection.model.selectedGeography.name,
    markerId: input.mapProjection.homeMarker.id,
    coordinate: input.mapProjection.homeMarker.coordinate,
    ownOrganization: true,
    claims: owner.snapshot.claims,
    serviceGeographyIds: owner.serviceGeographyIds,
  });
  const copy = capabilitiesLocaleCatalog(input.locale);
  return Object.freeze({
    projection: createCapabilitiesExchangeProjection({
      locale: input.locale,
      geographyId: String(input.mapProjection.model.selectedGeography.id),
      geographyLabel: input.mapProjection.model.selectedGeography.name,
      query: input.query,
      viewerOrganizationId,
      canManageProfile,
      sources: Object.freeze([ownSource, ...external]),
      canonicalCapabilities: owner.catalog.capabilities,
      amacs: Object.freeze({
        release,
        domains,
        query: input.query.amacsSearch,
        domainId: input.query.amacsDomainId,
        results: input.query.amacsSearch || input.query.amacsDomainId ? searchPage.results : Object.freeze([]),
      }),
      cardCopy: copy.card,
    }),
    serviceAreaOptions: network.available
      ? Object.freeze(network.serviceAreaOptions.map((option) => Object.freeze({ id: option.id, label: option.name })))
      : Object.freeze([]),
  });
}
