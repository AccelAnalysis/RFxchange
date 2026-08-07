import type { AuthoritativeGeoJsonGeometry } from "../../domain/geography/boundary.ts";
import type { GeographyDefinition } from "../../domain/geography/model.ts";
import type { AccessRestrictionRepository } from "../../domain/lifecycle/repository.ts";
import {
  projectPublicOrganizationLocation,
  type ConfirmedOrganizationLocationRepository,
  type OrganizationServiceGeographyRepository,
} from "../../domain/organization-location/index.ts";
import {
  projectPublicOrganizationMarker,
  type OrganizationMarkerActivation,
} from "../../domain/organization-markers/model.ts";
import {
  hydrateEssentialOrganizationProfile,
  projectPublicEssentialOrganizationProfile,
  type OrganizationCapability,
  type OrganizationProfileCompletionRepository,
  type PublicEssentialOrganizationProfile,
} from "../../domain/organization-profile/index.ts";
import { organizationId, type OrganizationId } from "../../domain/organizations/model.ts";
import type { OrganizationProfileRepository } from "../../domain/organizations/repository.ts";

export const NETWORK_DISCOVERY_PAGE_SIZE = 24;
export const NETWORK_DISCOVERY_MAX_CANDIDATES = 250;

export type NetworkDiscoveryMatchKind =
  | "browse"
  | "capability"
  | "organization-name";

export interface NetworkDiscoveryQuery {
  readonly capability: string;
  readonly baseGeographyId: string;
  readonly serviceGeographyId: string | null;
  readonly page: number;
}

export interface NetworkDiscoveryMarker {
  readonly id: string;
  readonly coordinate: readonly [number, number];
  readonly label: string;
  readonly accessibleLocationLabel: string;
}

export interface NetworkDiscoveryOrganization {
  readonly organizationId: OrganizationId;
  readonly profile: PublicEssentialOrganizationProfile;
  readonly baseGeographyId: string;
  readonly serviceGeographyIds: readonly string[];
  readonly marker: NetworkDiscoveryMarker;
  readonly match: Readonly<{
    readonly kind: NetworkDiscoveryMatchKind;
    readonly score: number;
    readonly matchedCapabilityIds: readonly string[];
    readonly matchedCapabilityNames: readonly string[];
  }>;
}

export interface NetworkDiscoveryProjection {
  readonly query: NetworkDiscoveryQuery;
  readonly organizations: readonly NetworkDiscoveryOrganization[];
  readonly totalMatched: number;
  readonly page: number;
  readonly pageCount: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

export interface NetworkDiscoveryCandidateSource {
  listByBaseGeographyId(
    geographyId: GeographyDefinition["id"],
    limit: number,
  ): Promise<readonly OrganizationMarkerActivation[]>;
}

export interface NetworkDiscoveryDependencies {
  readonly candidates: NetworkDiscoveryCandidateSource;
  readonly profiles: OrganizationProfileRepository;
  readonly completions: OrganizationProfileCompletionRepository;
  readonly locations: ConfirmedOrganizationLocationRepository;
  readonly serviceGeographies: OrganizationServiceGeographyRepository;
  readonly restrictions: AccessRestrictionRepository;
}

function normalizeSearchText(value: string | null | undefined, maximum = 120): string {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maximum);
}

function normalizePage(value: number | string | null | undefined): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(Math.floor(parsed), 100);
}

export function createNetworkDiscoveryQuery(input: Readonly<{
  capability?: string | null;
  baseGeographyId: string;
  serviceGeographyId?: string | null;
  allowedServiceGeographyIds: readonly string[];
  page?: number | string | null;
}>): NetworkDiscoveryQuery {
  const baseGeographyId = input.baseGeographyId.trim();
  if (!baseGeographyId) throw new Error("Network discovery requires a canonical base geography.");
  const requestedServiceGeographyId = normalizeSearchText(input.serviceGeographyId, 191);
  const serviceGeographyId = requestedServiceGeographyId &&
    input.allowedServiceGeographyIds.includes(requestedServiceGeographyId)
    ? requestedServiceGeographyId
    : null;
  return Object.freeze({
    capability: normalizeSearchText(input.capability),
    baseGeographyId,
    serviceGeographyId,
    page: normalizePage(input.page),
  });
}

function normalizedTerms(value: string): readonly string[] {
  return Object.freeze([
    ...new Set(
      value
        .toLocaleLowerCase("en-US")
        .split(/[^a-z0-9]+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2),
    ),
  ]);
}

function capabilityCorpus(capability: OrganizationCapability): string {
  return [
    capability.name,
    capability.description,
    capability.category.replaceAll("-", " "),
    capability.otherCategory ?? "",
    capability.kind.replaceAll("-", " "),
  ].join(" ").toLocaleLowerCase("en-US");
}

function scoreProfile(
  displayName: string,
  capabilities: readonly OrganizationCapability[],
  capabilityQuery: string,
): Readonly<{
  kind: NetworkDiscoveryMatchKind;
  score: number;
  matchedCapabilityIds: readonly string[];
  matchedCapabilityNames: readonly string[];
}> {
  const terms = normalizedTerms(capabilityQuery);
  if (terms.length === 0) {
    return Object.freeze({
      kind: "browse" as const,
      score: 0,
      matchedCapabilityIds: Object.freeze([]),
      matchedCapabilityNames: Object.freeze([]),
    });
  }

  const query = capabilityQuery.toLocaleLowerCase("en-US");
  const matched: Array<{ capability: OrganizationCapability; score: number }> = [];
  for (const capability of capabilities) {
    const name = capability.name.toLocaleLowerCase("en-US");
    const corpus = capabilityCorpus(capability);
    let score = 0;
    if (name === query) score = 100;
    else if (name.includes(query)) score = 80;
    else if (terms.every((term) => name.includes(term))) score = 65;
    else if (terms.every((term) => corpus.includes(term))) score = 45;
    else if (terms.some((term) => name.includes(term))) score = 30;
    else if (terms.some((term) => corpus.includes(term))) score = 20;
    if (score > 0) matched.push({ capability, score });
  }

  if (matched.length > 0) {
    matched.sort((left, right) => right.score - left.score || left.capability.name.localeCompare(right.capability.name));
    return Object.freeze({
      kind: "capability" as const,
      score: matched[0]?.score ?? 0,
      matchedCapabilityIds: Object.freeze(matched.map(({ capability }) => String(capability.id))),
      matchedCapabilityNames: Object.freeze(matched.map(({ capability }) => capability.name)),
    });
  }

  const organizationName = displayName.toLocaleLowerCase("en-US");
  if (terms.every((term) => organizationName.includes(term))) {
    return Object.freeze({
      kind: "organization-name" as const,
      score: 10,
      matchedCapabilityIds: Object.freeze([]),
      matchedCapabilityNames: Object.freeze([]),
    });
  }

  return Object.freeze({
    kind: "browse" as const,
    score: -1,
    matchedCapabilityIds: Object.freeze([]),
    matchedCapabilityNames: Object.freeze([]),
  });
}

export class NetworkDiscoveryService {
  constructor(private readonly dependencies: NetworkDiscoveryDependencies) {}

  async search(input: Readonly<{
    viewerOrganizationId: string;
    selectedGeography: GeographyDefinition;
    selectedGeographyGeometry: AuthoritativeGeoJsonGeometry;
    query: NetworkDiscoveryQuery;
  }>): Promise<NetworkDiscoveryProjection> {
    const viewerOrganizationId = organizationId(input.viewerOrganizationId);
    if (input.query.baseGeographyId !== input.selectedGeography.id) {
      throw new Error("Network discovery base geography must equal the authorized selected geography.");
    }

    const activations = await this.dependencies.candidates.listByBaseGeographyId(
      input.selectedGeography.id,
      NETWORK_DISCOVERY_MAX_CANDIDATES,
    );

    const projected = await Promise.all(
      activations
        .filter((activation) => activation.status === "active")
        .filter((activation) => activation.organizationId !== viewerOrganizationId)
        .map(async (activation): Promise<NetworkDiscoveryOrganization | null> => {
          const organizationIdValue = activation.organizationId;
          const [rawProfile, completion, location, serviceGeographies, restriction] = await Promise.all([
            this.dependencies.profiles.getByOrganizationId(organizationIdValue),
            this.dependencies.completions.getByOrganizationId(organizationIdValue),
            this.dependencies.locations.getByOrganizationId(organizationIdValue),
            this.dependencies.serviceGeographies.getByOrganizationId(organizationIdValue),
            this.dependencies.restrictions.getForOrganization(organizationIdValue),
          ]);

          if (!rawProfile || !location || completion?.status !== "active") return null;
          if (restriction && restriction.state !== "none") return null;
          if (
            activation.geographyId !== input.selectedGeography.id ||
            location.geographyId !== input.selectedGeography.id
          ) {
            return null;
          }

          const serviceGeographyIds = Object.freeze(
            [...(serviceGeographies?.serviceGeographyIds ?? [])].map(String),
          );
          if (
            input.query.serviceGeographyId &&
            !serviceGeographyIds.includes(input.query.serviceGeographyId)
          ) {
            return null;
          }

          const profile = hydrateEssentialOrganizationProfile(rawProfile);
          const match = scoreProfile(
            profile.displayName,
            profile.capabilities,
            input.query.capability,
          );
          if (input.query.capability && match.score < 0) return null;

          const publicLocation = projectPublicOrganizationLocation(
            location,
            input.selectedGeography,
          );
          const publicProfile = projectPublicEssentialOrganizationProfile({
            profile,
            completion,
            location: publicLocation,
          });
          const marker = projectPublicOrganizationMarker({
            activation,
            location,
            geography: input.selectedGeography,
            geographyGeometry: input.selectedGeographyGeometry,
          });

          return Object.freeze({
            organizationId: organizationIdValue,
            profile: publicProfile,
            baseGeographyId: String(input.selectedGeography.id),
            serviceGeographyIds,
            marker: Object.freeze({
              id: marker.id,
              coordinate: marker.coordinate,
              label: publicProfile.displayName,
              accessibleLocationLabel: marker.accessibleLocationLabel,
            }),
            match,
          });
        }),
    );

    const organizations = projected
      .filter((candidate): candidate is NetworkDiscoveryOrganization => candidate !== null)
      .sort((left, right) =>
        right.match.score - left.match.score ||
        left.profile.displayName.localeCompare(right.profile.displayName),
      );
    const totalMatched = organizations.length;
    const pageCount = Math.max(1, Math.ceil(totalMatched / NETWORK_DISCOVERY_PAGE_SIZE));
    const page = Math.min(input.query.page, pageCount);
    const start = (page - 1) * NETWORK_DISCOVERY_PAGE_SIZE;
    const pageOrganizations = Object.freeze(
      organizations.slice(start, start + NETWORK_DISCOVERY_PAGE_SIZE),
    );

    return Object.freeze({
      query: Object.freeze({ ...input.query, page }),
      organizations: pageOrganizations,
      totalMatched,
      page,
      pageCount,
      hasPreviousPage: page > 1,
      hasNextPage: page < pageCount,
    });
  }
}
