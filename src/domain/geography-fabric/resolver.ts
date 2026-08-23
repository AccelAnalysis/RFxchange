import type {
  CanonicalGeography,
  GeographyDatasetSource,
  GeographyFabricCommand,
  GeographyFabricEvent,
  GeographyPoint,
  GeographyReference,
  GeographyVersion,
  LocationGeographyMembership,
  LocationGeographyProfile,
  PhysicalGeographyHierarchy,
} from "./model.ts";

export interface ResolvedGeographyEntry {
  readonly geography: CanonicalGeography;
  readonly version: GeographyVersion;
  readonly reference: GeographyReference;
}

export interface AcceptedPointGeographyResolution {
  readonly acceptedPoint: GeographyPoint;
  readonly acceptedPointFingerprint: string;
  readonly datasetSources: readonly GeographyDatasetSource[];
  readonly entries: readonly ResolvedGeographyEntry[];
  readonly hierarchy: PhysicalGeographyHierarchy;
  readonly overlays: readonly GeographyReference[];
  readonly resolver: string;
  readonly benchmark: string | null;
  readonly vintage: string | null;
  readonly resolvedAt: string;
}

export interface AcceptedPointGeographyResolver {
  resolveAcceptedPoint(point: GeographyPoint): Promise<AcceptedPointGeographyResolution>;
}

export interface LocationProfileMaterializationPacket {
  readonly datasetSources: readonly GeographyDatasetSource[];
  readonly geographies: readonly CanonicalGeography[];
  readonly versions: readonly GeographyVersion[];
  readonly profile: LocationGeographyProfile;
  readonly memberships: readonly LocationGeographyMembership[];
  readonly command: GeographyFabricCommand;
  readonly event: GeographyFabricEvent;
}
