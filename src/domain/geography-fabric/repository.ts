import type {
  CanonicalGeography,
  CanonicalGeographyId,
  GeographicScope,
  GeographicScopeId,
  GeographicScopeMember,
  GeographyDatasetSource,
  GeographyDatasetSourceId,
  GeographyFabricCommand,
  GeographyFabricCommandId,
  GeographyFabricEvent,
  GeographyMetricSnapshot,
  GeographyVersion,
  GeographyVersionId,
  LocationGeographyMembership,
  LocationGeographyProfile,
  LocationGeographyProfileId,
} from "./model.ts";

export interface CanonicalGeographyRepository {
  getById(id: CanonicalGeographyId): Promise<CanonicalGeography | null>;
  getVersionById(id: GeographyVersionId): Promise<GeographyVersion | null>;
  getDatasetSourceById(id: GeographyDatasetSourceId): Promise<GeographyDatasetSource | null>;
}

export interface LocationGeographyProfileRepository {
  getById(id: LocationGeographyProfileId): Promise<LocationGeographyProfile | null>;
}

export interface GeographicScopeRepository {
  getById(id: GeographicScopeId): Promise<GeographicScope | null>;
}

export interface GeographyFabricCommandRepository {
  getById(id: GeographyFabricCommandId): Promise<GeographyFabricCommand | null>;
}

export interface GeographyMetricSnapshotRepository {
  listByGeographyVersion(id: GeographyVersionId): Promise<readonly GeographyMetricSnapshot[]>;
}

export interface GeographyFabricUnitOfWork {
  materializeLocationProfile(input: Readonly<{
    datasetSources: readonly GeographyDatasetSource[];
    geographies: readonly CanonicalGeography[];
    versions: readonly GeographyVersion[];
    profile: LocationGeographyProfile;
    memberships: readonly LocationGeographyMembership[];
    command: GeographyFabricCommand;
    event: GeographyFabricEvent;
  }>): Promise<void>;
  saveScope(input: Readonly<{
    scope: GeographicScope;
    members: readonly GeographicScopeMember[];
    command: GeographyFabricCommand;
    event: GeographyFabricEvent;
  }>): Promise<void>;
  saveMetricSnapshot(input: Readonly<{
    snapshot: GeographyMetricSnapshot;
    command: GeographyFabricCommand;
    event: GeographyFabricEvent;
  }>): Promise<void>;
}

export interface GeographyFabricRepositories {
  readonly catalog: CanonicalGeographyRepository;
  readonly profiles: LocationGeographyProfileRepository;
  readonly scopes: GeographicScopeRepository;
  readonly commands: GeographyFabricCommandRepository;
  readonly metrics: GeographyMetricSnapshotRepository;
  readonly unitOfWork: GeographyFabricUnitOfWork;
}
