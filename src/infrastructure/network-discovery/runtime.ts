import type { Firestore } from "firebase-admin/firestore";

import {
  createNetworkDiscoveryQuery,
  NetworkDiscoveryService,
  type NetworkDiscoveryCandidateSource,
  type NetworkDiscoveryProjection,
} from "../../application/network-discovery/network-discovery.ts";
import { evaluateGeographyParticipation } from "../../domain/geography/policy.ts";
import type { OrganizationMarkerActivation } from "../../domain/organization-markers/model.ts";
import { organizationId, type OrganizationId } from "../../domain/organizations/model.ts";
import type { ParticipantRouteResolution } from "../auth/participant-route-runtime.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { createFirestoreEssentialOrganizationProfileRepositories } from "../firestore/organization-profile.ts";
import { FirestoreOrganizationMarketProfileRepository } from "../firestore/market-profile.ts";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "../firestore/runtime.ts";
import { firestoreCollectionName } from "../firestore/schema.ts";
import { getFirestoreRecordById, listFirestoreRecords } from "../firestore/support.ts";
import type { AuthenticatedMapProjection } from "../geography/participant-map-runtime.ts";

export interface NetworkServiceAreaOption {
  readonly id: string;
  readonly name: string;
}

export type AuthenticatedNetworkDiscovery =
  | Readonly<{
      readonly available: false;
      readonly reason: "open-required" | "geography-not-permitted";
    }>
  | Readonly<{
      readonly available: true;
      readonly projection: NetworkDiscoveryProjection;
      readonly serviceAreaOptions: readonly NetworkServiceAreaOption[];
    }>;

type AuthorizedParticipant = Extract<ParticipantRouteResolution, { readonly kind: "authorized" }>;

class FirestoreNetworkDiscoveryCandidateSource implements NetworkDiscoveryCandidateSource {
  constructor(private readonly db: Firestore) {}

  getByOrganizationId(
    organizationId: Parameters<NetworkDiscoveryCandidateSource["getByOrganizationId"]>[0],
  ): Promise<OrganizationMarkerActivation | null> {
    return getFirestoreRecordById<OrganizationMarkerActivation>(
      this.db,
      "organizationMarkerActivations",
      organizationId,
    );
  }

  listByBaseGeographyId(
    geographyId: Parameters<NetworkDiscoveryCandidateSource["listByBaseGeographyId"]>[0],
    limit: number,
  ): Promise<readonly OrganizationMarkerActivation[]> {
    return listFirestoreRecords<OrganizationMarkerActivation>(
      this.db
        .collection(firestoreCollectionName("organizationMarkerActivations"))
        .where("geographyId", "==", geographyId)
        .limit(Math.max(1, limit)),
      "organizationMarkerActivations",
    );
  }
}

function serviceAreaOptions(
  mapProjection: AuthenticatedMapProjection,
): readonly NetworkServiceAreaOption[] {
  const unique = new Map<string, NetworkServiceAreaOption>();
  for (const feature of mapProjection.model.features) {
    if (feature.geography.releaseState === "restricted") continue;
    unique.set(String(feature.geography.id), Object.freeze({
      id: String(feature.geography.id),
      name: feature.geography.name,
    }));
  }
  return Object.freeze(
    [...unique.values()].sort((left, right) => left.name.localeCompare(right.name)),
  );
}

export async function loadAuthorizedNetworkDiscovery(input: Readonly<{
  access: AuthorizedParticipant;
  mapProjection: AuthenticatedMapProjection;
  capability?: string | null;
  serviceGeographyId?: string | null;
  page?: string | number | null;
  focusedOrganizationId?: string | null;
}>): Promise<AuthenticatedNetworkDiscovery> {
  if (input.access.state.lifecycleState !== "open-platform") {
    return Object.freeze({
      available: false as const,
      reason: "open-required" as const,
    });
  }

  const db = getServerFirestore();
  const geographyRepositories = createFirestoreGeographyRepositories(db);
  const geography = input.mapProjection.model.selectedGeography;
  const authorizations = await geographyRepositories.authorizations.listByUserAndGeography(
    input.access.context.user.id,
    geography.id,
  );
  const decision = evaluateGeographyParticipation(
    geography,
    input.access.context.user.id,
    "network-participation",
    authorizations,
    new Date().toISOString(),
  );
  if (!decision.allowed) {
    return Object.freeze({
      available: false as const,
      reason: "geography-not-permitted" as const,
    });
  }

  const selectedFeature = input.mapProjection.model.features.find(
    (feature) => feature.role === "selected",
  );
  if (!selectedFeature) {
    throw new Error("Authorized Network discovery requires the selected authoritative boundary.");
  }

  const options = serviceAreaOptions(input.mapProjection);
  const query = createNetworkDiscoveryQuery({
    capability: input.capability,
    baseGeographyId: String(geography.id),
    serviceGeographyId: input.serviceGeographyId,
    allowedServiceGeographyIds: options.map((option) => option.id),
    page: input.page,
  });
  const foundation = createServerFirestoreFoundationRepositories(db);
  const locations = createFirestoreOrganizationLocationRepositories(db);
  const profiles = createFirestoreEssentialOrganizationProfileRepositories(db);
  const marketProfiles = new FirestoreOrganizationMarketProfileRepository(db);
  const service = new NetworkDiscoveryService({
    candidates: new FirestoreNetworkDiscoveryCandidateSource(db),
    profiles: foundation.organizations.profiles,
    completions: profiles.completions,
    locations: locations.locations,
    serviceGeographies: locations.serviceGeographies,
    restrictions: foundation.lifecycle.restrictions,
    capabilityClaims: marketProfiles.claims,
  });
  let focusOrganizationId: OrganizationId | null = null;
  try {
    focusOrganizationId = input.focusedOrganizationId
      ? organizationId(input.focusedOrganizationId)
      : null;
  } catch {
    // Browser continuity is non-authorizing. Invalid or stale identifiers fail closed.
  }
  const projection = await service.search({
    viewerOrganizationId: input.mapProjection.organizationId,
    selectedGeography: geography,
    selectedGeographyGeometry: selectedFeature.boundary.geometry,
    query,
    focusOrganizationId,
  });

  return Object.freeze({
    available: true as const,
    projection,
    serviceAreaOptions: options,
  });
}
