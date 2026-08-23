type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type CanonicalGeographyId = Brand<string, "CanonicalGeographyId">;
export type GeographyVersionId = Brand<string, "GeographyVersionId">;
export type GeographyDatasetSourceId = Brand<string, "GeographyDatasetSourceId">;
export type LocationGeographyProfileId = Brand<string, "LocationGeographyProfileId">;
export type LocationGeographyMembershipId = Brand<string, "LocationGeographyMembershipId">;
export type GeographicScopeId = Brand<string, "GeographicScopeId">;
export type GeographicScopeMemberId = Brand<string, "GeographicScopeMemberId">;
export type GeographyFabricCommandId = Brand<string, "GeographyFabricCommandId">;
export type GeographyFabricEventId = Brand<string, "GeographyFabricEventId">;
export type GeographyMetricSnapshotId = Brand<string, "GeographyMetricSnapshotId">;

export const PHYSICAL_GEOGRAPHY_TYPES = [
  "country",
  "state",
  "county-equivalent",
  "place",
  "census-tract",
  "block-group",
  "census-block",
] as const;
export type PhysicalGeographyType = (typeof PHYSICAL_GEOGRAPHY_TYPES)[number];

export const OVERLAY_GEOGRAPHY_TYPES = [
  "region-market",
  "county-subdivision",
  "msa",
  "csa",
  "planning-region",
  "zip-zcta",
  "congressional-district",
  "state-legislative-upper",
  "state-legislative-lower",
  "school-district-unified",
  "school-district-elementary",
  "school-district-secondary",
  "urban-area",
  "opportunity-zone",
  "enterprise-zone",
  "hubzone",
  "foreign-trade-zone",
  "economic-development-district",
  "redevelopment-zone",
  "industrial-development-zone",
  "tax-increment-financing-zone",
  "custom-economic-development-zone",
] as const;
export type OverlayGeographyType = (typeof OVERLAY_GEOGRAPHY_TYPES)[number];
export type CanonicalGeographyType = PhysicalGeographyType | OverlayGeographyType;

export const ECONOMIC_DEVELOPMENT_GEOGRAPHY_TYPES = [
  "opportunity-zone",
  "enterprise-zone",
  "hubzone",
  "foreign-trade-zone",
  "economic-development-district",
  "redevelopment-zone",
  "industrial-development-zone",
  "tax-increment-financing-zone",
  "custom-economic-development-zone",
] as const satisfies readonly OverlayGeographyType[];

export const PARTICIPANT_SAFE_LOCATION_OVERLAY_TYPES = [
  "region-market",
  "msa",
  "csa",
  "planning-region",
] as const satisfies readonly OverlayGeographyType[];

export const GEOGRAPHY_SOURCE_SYSTEMS = [
  "census-geocoder",
  "census-tigerweb",
  "rfxchange-market",
  "federal-program",
  "state-program",
  "local-program",
  "planning-authority",
  "postal-authority",
  "manual-governed",
] as const;
export type GeographySourceSystem = (typeof GEOGRAPHY_SOURCE_SYSTEMS)[number];

export const GEOGRAPHY_MEMBERSHIP_ROLES = [
  "physical",
  "overlay",
  "market",
  "economic-development-zone",
] as const;
export type GeographyMembershipRole = (typeof GEOGRAPHY_MEMBERSHIP_ROLES)[number];

export const GEOGRAPHY_DERIVATIONS = [
  "address",
  "accepted-coordinate",
  "spatial-boundary",
  "declared",
  "governed-import",
  "source-record",
] as const;
export type GeographyDerivation = (typeof GEOGRAPHY_DERIVATIONS)[number];

export const GEOGRAPHIC_SCOPE_KINDS = [
  "organization-service-area",
  "resource-service-area",
  "rfx-performance-area",
  "intended-audience-area",
  "capability-service-area",
  "past-performance-area",
  "intelligence-analysis-area",
] as const;
export type GeographicScopeKind = (typeof GEOGRAPHIC_SCOPE_KINDS)[number];

export const GEOGRAPHIC_SCOPE_MODES = [
  "geographies",
  "address",
  "point",
  "radius",
  "polygon",
  "statewide",
  "nationwide",
  "remote",
] as const;
export type GeographicScopeMode = (typeof GEOGRAPHIC_SCOPE_MODES)[number];

export const GEOGRAPHIC_SCOPE_SUBJECT_KINDS = [
  "organization",
  "resource",
  "rfx",
  "capability-claim",
  "past-performance",
  "intelligence-analysis",
] as const;
export type GeographicScopeSubjectKind = (typeof GEOGRAPHIC_SCOPE_SUBJECT_KINDS)[number];

export const GEOGRAPHY_PROJECTION_AUDIENCES = [
  "private",
  "network",
  "public",
  "analytics",
] as const;
export type GeographyProjectionAudience = (typeof GEOGRAPHY_PROJECTION_AUDIENCES)[number];

export const GEOGRAPHY_METRIC_RECORD_TYPES = [
  "organization",
  "resource",
  "rfx",
  "capability",
  "past-performance",
] as const;
export type GeographyMetricRecordType = (typeof GEOGRAPHY_METRIC_RECORD_TYPES)[number];

export const GEOGRAPHY_METRIC_COVERAGE = [
  "rfxchange-exchange-only",
  "external-authoritative-dataset",
] as const;
export type GeographyMetricCoverage = (typeof GEOGRAPHY_METRIC_COVERAGE)[number];

export const GEOGRAPHY_FABRIC_COMMAND_ACTIONS = [
  "materialize-location-profile",
  "save-geographic-scope",
  "capture-metric-snapshot",
] as const;
export type GeographyFabricCommandAction = (typeof GEOGRAPHY_FABRIC_COMMAND_ACTIONS)[number];

export const GEOGRAPHY_FABRIC_EVENT_KINDS = [
  "location-profile-materialized",
  "geographic-scope-saved",
  "metric-snapshot-captured",
] as const;
export type GeographyFabricEventKind = (typeof GEOGRAPHY_FABRIC_EVENT_KINDS)[number];

export type LocationVisibility = "exact" | "approximate" | "locality-only";
export type GeographicScopeVisibility = "private" | "network" | "public";

export interface GeographyPoint {
  readonly longitude: number;
  readonly latitude: number;
}

export interface GeographyDatasetSource {
  readonly id: GeographyDatasetSourceId;
  readonly sourceSystem: GeographySourceSystem;
  readonly name: string;
  readonly authority: string;
  readonly sourceUrl: string | null;
  readonly licenseOrUseBasis: string;
  readonly vintage: string;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
  readonly importedAt: string;
}

export interface CanonicalGeography {
  readonly id: CanonicalGeographyId;
  readonly type: CanonicalGeographyType;
  readonly name: string;
  readonly countryCode: string;
  readonly stateCode: string | null;
  readonly externalId: string;
  readonly sourceSystem: GeographySourceSystem;
  readonly economicDevelopmentZone: boolean;
  readonly currentVersionId: GeographyVersionId;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface GeographyVersion {
  readonly id: GeographyVersionId;
  readonly geographyId: CanonicalGeographyId;
  readonly datasetSourceId: GeographyDatasetSourceId;
  readonly sourceLayer: string | null;
  readonly vintage: string;
  readonly name: string;
  readonly parentVersionId: GeographyVersionId | null;
  readonly geometryReference: string | null;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
  readonly createdAt: string;
}

export interface GeographyReference {
  readonly geographyId: CanonicalGeographyId;
  readonly versionId: GeographyVersionId;
  readonly type: CanonicalGeographyType;
  readonly name: string;
  readonly externalId: string;
  readonly sourceSystem: GeographySourceSystem;
  readonly vintage: string;
  readonly parentVersionId: GeographyVersionId | null;
  readonly countryCode: string;
  readonly stateCode: string | null;
  readonly economicDevelopmentZone: boolean;
}

export interface PhysicalGeographyHierarchy {
  readonly country: GeographyReference;
  readonly state: GeographyReference | null;
  readonly countyEquivalent: GeographyReference | null;
  readonly place: GeographyReference | null;
  readonly censusTract: GeographyReference | null;
  readonly blockGroup: GeographyReference | null;
  readonly censusBlock: GeographyReference | null;
}

export interface LocationGeographyProfile {
  readonly id: LocationGeographyProfileId;
  readonly locationId: string;
  readonly organizationId: string | null;
  readonly operatingGeographyId: string | null;
  readonly profileVersion: number;
  readonly acceptedPoint: GeographyPoint;
  readonly acceptedPointFingerprint: string;
  readonly visibility: LocationVisibility;
  readonly hierarchy: PhysicalGeographyHierarchy;
  readonly overlays: readonly GeographyReference[];
  readonly membershipIds: readonly LocationGeographyMembershipId[];
  readonly resolver: string;
  readonly benchmark: string | null;
  readonly resolverVintage: string | null;
  readonly derivedFrom: "accepted-coordinate";
  readonly sourceLocationUpdatedAt: string;
  readonly resolvedAt: string;
  readonly updatedAt: string;
}

export interface LocationGeographyMembership {
  readonly id: LocationGeographyMembershipId;
  readonly locationId: string;
  readonly organizationId: string | null;
  readonly profileVersion: number;
  readonly geographyId: CanonicalGeographyId;
  readonly geographyVersionId: GeographyVersionId;
  readonly geographyType: CanonicalGeographyType;
  readonly role: GeographyMembershipRole;
  readonly derivation: GeographyDerivation;
  readonly confidence: number;
  readonly createdAt: string;
}

export interface GeographicScopeSubject {
  readonly kind: GeographicScopeSubjectKind;
  readonly id: string;
  readonly organizationId: string;
}

export interface GeographicScopeAddress {
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly locality: string;
  readonly regionCode: string;
  readonly postalCode: string | null;
  readonly countryCode: string;
}

export interface GeographicScope {
  readonly id: GeographicScopeId;
  readonly organizationId: string;
  readonly subject: GeographicScopeSubject;
  readonly kind: GeographicScopeKind;
  readonly mode: GeographicScopeMode;
  readonly label: string | null;
  readonly inclusionVersionIds: readonly GeographyVersionId[];
  readonly exclusionVersionIds: readonly GeographyVersionId[];
  readonly sourceLocationId: string | null;
  readonly address: GeographicScopeAddress | null;
  readonly point: GeographyPoint | null;
  readonly radiusMeters: number | null;
  readonly polygonAssetId: string | null;
  readonly remote: boolean;
  readonly visibility: GeographicScopeVisibility;
  readonly revision: number;
  readonly updatedByUserId: string;
  readonly updatedByMembershipId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface GeographicScopeMember {
  readonly id: GeographicScopeMemberId;
  readonly organizationId: string;
  readonly scopeId: GeographicScopeId;
  readonly scopeRevision: number;
  readonly geographyId: CanonicalGeographyId;
  readonly geographyVersionId: GeographyVersionId;
  readonly inclusion: "include" | "exclude";
  readonly createdAt: string;
}

export interface GeographyFabricCommand {
  readonly id: GeographyFabricCommandId;
  readonly action: GeographyFabricCommandAction;
  readonly organizationId: string | null;
  readonly subjectId: string;
  readonly requestFingerprint: string;
  readonly actorUserId: string | null;
  readonly actorMembershipId: string | null;
  readonly recordedAt: string;
}

export interface GeographyFabricEvent {
  readonly id: GeographyFabricEventId;
  readonly kind: GeographyFabricEventKind;
  readonly organizationId: string | null;
  readonly subjectId: string;
  readonly commandId: GeographyFabricCommandId;
  readonly occurredAt: string;
}

export interface GeographyMetricSnapshot {
  readonly id: GeographyMetricSnapshotId;
  readonly metricId: string;
  readonly geographyId: CanonicalGeographyId;
  readonly geographyVersionId: GeographyVersionId;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly recordType: GeographyMetricRecordType;
  readonly count: number;
  readonly organizationCount: number;
  readonly coverage: GeographyMetricCoverage;
  readonly sourceDatasetIds: readonly GeographyDatasetSourceId[];
  readonly minimumCellSize: number;
  readonly suppressed: boolean;
  readonly generatedAt: string;
}

export interface ProjectedLocationGeographyProfile {
  readonly locationId: string;
  readonly organizationId: string | null;
  readonly localityLabel: string;
  readonly operatingGeographyId: string | null;
  readonly visibleGeographies: readonly GeographyReference[];
  readonly point: GeographyPoint | null;
  readonly precision: LocationVisibility;
  readonly resolverVintage: string | null;
}

const SCOPE_SUBJECT_COMPATIBILITY: Readonly<
  Record<GeographicScopeKind, GeographicScopeSubjectKind>
> = Object.freeze({
  "organization-service-area": "organization",
  "resource-service-area": "resource",
  "rfx-performance-area": "rfx",
  "intended-audience-area": "rfx",
  "capability-service-area": "capability-claim",
  "past-performance-area": "past-performance",
  "intelligence-analysis-area": "intelligence-analysis",
});

const EVENT_KIND_BY_ACTION: Readonly<
  Record<GeographyFabricCommandAction, GeographyFabricEventKind>
> = Object.freeze({
  "materialize-location-profile": "location-profile-materialized",
  "save-geographic-scope": "geographic-scope-saved",
  "capture-metric-snapshot": "metric-snapshot-captured",
});

function normalized(value: string, label: string, maximum = 240): string {
  const result = value.trim().replace(/\s+/g, " ");
  if (!result || result.length > maximum) {
    throw new Error(`${label} must contain 1-${maximum} characters.`);
  }
  return result;
}

function optional(
  value: string | null | undefined,
  label: string,
  maximum = 500,
): string | null {
  return value?.trim() ? normalized(value, label, maximum) : null;
}

function stableId<T extends string>(value: string, label: string): T {
  const result = normalized(value, label, 240).toLowerCase();
  if (!/^[a-z0-9][a-z0-9._:-]{1,239}$/.test(result)) {
    throw new Error(`${label} must be a stable lowercase identifier.`);
  }
  return result as T;
}

function foreignId(value: string, label: string): string {
  const result = normalized(value, label, 191);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(result)) {
    throw new Error(`${label} must be a stable identifier.`);
  }
  return result;
}

function isoTimestamp(value: string, label = "Timestamp"): string {
  const parsed = Date.parse(normalized(value, label, 80));
  if (Number.isNaN(parsed)) throw new Error(`${label} must be ISO-compatible.`);
  return new Date(parsed).toISOString();
}

function isoDate(value: string | null | undefined, label: string): string | null {
  if (!value?.trim()) return null;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
    || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
  ) {
    throw new Error(`${label} must be an ISO date.`);
  }
  return value;
}

function oneOf<T extends string>(value: string, values: readonly T[], label: string): T {
  if (!values.includes(value as T)) throw new Error(`Unsupported ${label}: ${value}.`);
  return value as T;
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function uniqueReferences(
  values: readonly GeographyReference[],
): readonly GeographyReference[] {
  const byVersion = new Map<GeographyVersionId, GeographyReference>();
  for (const reference of values) {
    const existing = byVersion.get(reference.versionId);
    if (existing && existing.geographyId !== reference.geographyId) {
      throw new Error("A geography version cannot identify two logical geographies.");
    }
    byVersion.set(reference.versionId, reference);
  }
  return Object.freeze([...byVersion.values()]);
}

function countryCode(value: string): string {
  const code = normalized(value, "Country code", 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) throw new Error("Country code must contain two letters.");
  return code;
}

function stateCode(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const code = normalized(value, "State code", 8).toUpperCase();
  if (!/^[A-Z0-9-]{2,8}$/.test(code)) throw new Error("State code is malformed.");
  return code;
}

export function canonicalGeographyId(value: string): CanonicalGeographyId {
  return stableId<CanonicalGeographyId>(value, "Canonical geography id");
}

export function geographyVersionId(value: string): GeographyVersionId {
  return stableId<GeographyVersionId>(value, "Geography version id");
}

export function geographyDatasetSourceId(value: string): GeographyDatasetSourceId {
  return stableId<GeographyDatasetSourceId>(value, "Geography dataset source id");
}

export function locationGeographyProfileId(value: string): LocationGeographyProfileId {
  return stableId<LocationGeographyProfileId>(value, "Location geography profile id");
}

export function geographicScopeId(value: string): GeographicScopeId {
  return stableId<GeographicScopeId>(value, "Geographic scope id");
}

export function geographyPoint(
  input: Readonly<{ longitude: number; latitude: number }>,
): GeographyPoint {
  if (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) {
    throw new Error("Longitude must be between -180 and 180.");
  }
  if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90) {
    throw new Error("Latitude must be between -90 and 90.");
  }
  return Object.freeze({ longitude: input.longitude, latitude: input.latitude });
}

export function acceptedPointFingerprint(point: GeographyPoint): string {
  return `${point.longitude.toFixed(7)},${point.latitude.toFixed(7)}`;
}

export function createGeographyDatasetSource(input: Readonly<{
  id: string;
  sourceSystem: string;
  name: string;
  authority: string;
  sourceUrl?: string | null;
  licenseOrUseBasis: string;
  vintage: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  importedAt: string;
}>): GeographyDatasetSource {
  const effectiveFrom = isoDate(input.effectiveFrom, "Dataset effective-from date");
  const effectiveTo = isoDate(input.effectiveTo, "Dataset effective-to date");
  if (effectiveFrom && effectiveTo && effectiveFrom > effectiveTo) {
    throw new Error("Dataset effective-to date cannot precede effective-from date.");
  }
  const sourceUrl = optional(input.sourceUrl, "Dataset source URL", 1_000);
  if (sourceUrl) {
    let parsed: URL;
    try {
      parsed = new URL(sourceUrl);
    } catch {
      throw new Error("Dataset source URL must be valid.");
    }
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error("Dataset source URL must use HTTP or HTTPS.");
    }
  }
  return Object.freeze({
    id: geographyDatasetSourceId(input.id),
    sourceSystem: oneOf(
      input.sourceSystem,
      GEOGRAPHY_SOURCE_SYSTEMS,
      "geography source system",
    ),
    name: normalized(input.name, "Dataset name"),
    authority: normalized(input.authority, "Dataset authority"),
    sourceUrl,
    licenseOrUseBasis: normalized(
      input.licenseOrUseBasis,
      "Dataset license or use basis",
      1_000,
    ),
    vintage: normalized(input.vintage, "Dataset vintage", 120),
    effectiveFrom,
    effectiveTo,
    importedAt: isoTimestamp(input.importedAt, "Dataset import timestamp"),
  });
}

export function createCanonicalGeography(input: Readonly<{
  id: string;
  type: string;
  name: string;
  countryCode?: string;
  stateCode?: string | null;
  externalId: string;
  sourceSystem: string;
  currentVersionId: string;
  now: string;
  existing?: CanonicalGeography | null;
}>): CanonicalGeography {
  const id = canonicalGeographyId(input.id);
  const type = oneOf(
    input.type,
    [...PHYSICAL_GEOGRAPHY_TYPES, ...OVERLAY_GEOGRAPHY_TYPES],
    "canonical geography type",
  );
  const sourceSystem = oneOf(
    input.sourceSystem,
    GEOGRAPHY_SOURCE_SYSTEMS,
    "geography source system",
  );
  const externalId = normalized(input.externalId, "Geography external id", 240);
  if (
    input.existing
    && (
      input.existing.id !== id
      || input.existing.type !== type
      || input.existing.sourceSystem !== sourceSystem
      || input.existing.externalId !== externalId
    )
  ) {
    throw new Error("Canonical geography logical identity cannot be reassigned.");
  }
  const now = isoTimestamp(input.now);
  return Object.freeze({
    id,
    type,
    name: normalized(input.name, "Geography name", 300),
    countryCode: countryCode(input.countryCode ?? "US"),
    stateCode: stateCode(input.stateCode),
    externalId,
    sourceSystem,
    economicDevelopmentZone: (
      ECONOMIC_DEVELOPMENT_GEOGRAPHY_TYPES as readonly string[]
    ).includes(type),
    currentVersionId: geographyVersionId(input.currentVersionId),
    createdAt: input.existing?.createdAt ?? now,
    updatedAt: now,
  });
}

export function createGeographyVersion(input: Readonly<{
  id: string;
  geographyId: string;
  datasetSourceId: string;
  sourceLayer?: string | null;
  vintage: string;
  name: string;
  parentVersionId?: string | null;
  geometryReference?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
  now: string;
}>): GeographyVersion {
  const effectiveFrom = isoDate(input.effectiveFrom, "Geography effective-from date");
  const effectiveTo = isoDate(input.effectiveTo, "Geography effective-to date");
  if (effectiveFrom && effectiveTo && effectiveFrom > effectiveTo) {
    throw new Error("Geography effective-to date cannot precede effective-from date.");
  }
  const id = geographyVersionId(input.id);
  const parentVersionId = input.parentVersionId
    ? geographyVersionId(input.parentVersionId)
    : null;
  if (parentVersionId === id) throw new Error("Geography version cannot be its own parent.");
  return Object.freeze({
    id,
    geographyId: canonicalGeographyId(input.geographyId),
    datasetSourceId: geographyDatasetSourceId(input.datasetSourceId),
    sourceLayer: optional(input.sourceLayer, "Geography source layer"),
    vintage: normalized(input.vintage, "Geography vintage", 120),
    name: normalized(input.name, "Geography version name", 300),
    parentVersionId,
    geometryReference: optional(
      input.geometryReference,
      "Geography geometry reference",
      1_000,
    ),
    effectiveFrom,
    effectiveTo,
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
    createdAt: isoTimestamp(input.now),
  });
}

function metadataFingerprint(
  metadata: Readonly<Record<string, string | number | boolean | null>>,
): string {
  return JSON.stringify(
    Object.entries(metadata).sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function assertSameImmutableGeographyVersion(
  existing: GeographyVersion,
  expected: GeographyVersion,
): void {
  const scalarFields = [
    "id",
    "geographyId",
    "datasetSourceId",
    "sourceLayer",
    "vintage",
    "name",
    "parentVersionId",
    "geometryReference",
    "effectiveFrom",
    "effectiveTo",
  ] as const;
  if (
    scalarFields.some((field) => existing[field] !== expected[field])
    || metadataFingerprint(existing.metadata) !== metadataFingerprint(expected.metadata)
  ) {
    throw new Error("Geography version conflicts with the existing immutable record.");
  }
}

export function assertGeographicScopeImmutableIdentity(
  existing: GeographicScope,
  expected: GeographicScope,
): void {
  if (
    existing.id !== expected.id
    || existing.organizationId !== expected.organizationId
    || existing.kind !== expected.kind
    || existing.subject.kind !== expected.subject.kind
    || existing.subject.id !== expected.subject.id
    || existing.subject.organizationId !== expected.subject.organizationId
  ) {
    throw new Error("Geographic scope identity, subject, and purpose cannot be reassigned.");
  }
}

export function geographyReference(input: Readonly<{
  geography: CanonicalGeography;
  version: GeographyVersion;
}>): GeographyReference {
  if (input.version.geographyId !== input.geography.id) {
    throw new Error("Geography reference version belongs to a different logical geography.");
  }
  return Object.freeze({
    geographyId: input.geography.id,
    versionId: input.version.id,
    type: input.geography.type,
    name: input.geography.name,
    externalId: input.geography.externalId,
    sourceSystem: input.geography.sourceSystem,
    vintage: input.version.vintage,
    parentVersionId: input.version.parentVersionId,
    countryCode: input.geography.countryCode,
    stateCode: input.geography.stateCode,
    economicDevelopmentZone: input.geography.economicDevelopmentZone,
  });
}

function validateHierarchy(
  hierarchy: PhysicalGeographyHierarchy,
): PhysicalGeographyHierarchy {
  const expected: ReadonlyArray<
    readonly [GeographyReference | null, PhysicalGeographyType]
  > = [
    [hierarchy.country, "country"],
    [hierarchy.state, "state"],
    [hierarchy.countyEquivalent, "county-equivalent"],
    [hierarchy.place, "place"],
    [hierarchy.censusTract, "census-tract"],
    [hierarchy.blockGroup, "block-group"],
    [hierarchy.censusBlock, "census-block"],
  ];
  for (const [reference, type] of expected) {
    if (reference && reference.type !== type) {
      throw new Error(`Physical hierarchy ${type} has the wrong geography type.`);
    }
  }

  const requireParent = (
    child: GeographyReference | null,
    parent: GeographyReference | null,
    label: string,
  ) => {
    if (!child) return;
    if (!parent || child.parentVersionId !== parent.versionId) {
      throw new Error(`${label} does not belong to the supplied physical hierarchy parent.`);
    }
  };
  if (hierarchy.country.parentVersionId !== null) {
    throw new Error("Physical hierarchy country cannot declare a parent geography version.");
  }
  requireParent(hierarchy.state, hierarchy.country, "State");
  requireParent(
    hierarchy.countyEquivalent,
    hierarchy.state ?? hierarchy.country,
    "County or county-equivalent",
  );
  requireParent(hierarchy.place, hierarchy.countyEquivalent, "Place");
  requireParent(hierarchy.censusTract, hierarchy.countyEquivalent, "Census tract");
  requireParent(hierarchy.blockGroup, hierarchy.censusTract, "Block group");
  requireParent(hierarchy.censusBlock, hierarchy.blockGroup, "Census block");

  if (hierarchy.censusTract && !hierarchy.countyEquivalent) {
    throw new Error("Census tract containment requires a county or county-equivalent.");
  }
  if (hierarchy.blockGroup && !hierarchy.censusTract) {
    throw new Error("Block-group containment requires a census tract.");
  }
  if (hierarchy.censusBlock && !hierarchy.blockGroup) {
    throw new Error("Census-block containment requires a block group.");
  }
  const references = expected
    .map(([reference]) => reference)
    .filter((reference): reference is GeographyReference => Boolean(reference));
  if (references.some((reference) => reference.countryCode !== hierarchy.country.countryCode)) {
    throw new Error("Every physical geography must belong to the hierarchy country.");
  }
  const expectedStateCode = hierarchy.state?.stateCode;
  if (
    expectedStateCode
    && references.some(
      (reference) => reference.stateCode && reference.stateCode !== expectedStateCode,
    )
  ) {
    throw new Error("Every state-qualified physical geography must belong to the hierarchy state.");
  }
  return Object.freeze({ ...hierarchy });
}

function membershipRole(reference: GeographyReference): GeographyMembershipRole {
  if ((PHYSICAL_GEOGRAPHY_TYPES as readonly string[]).includes(reference.type)) {
    return "physical";
  }
  if (reference.type === "region-market") return "market";
  if (reference.economicDevelopmentZone) return "economic-development-zone";
  return "overlay";
}

export function createLocationGeographyMembership(input: Readonly<{
  locationId: string;
  organizationId?: string | null;
  profileVersion: number;
  reference: GeographyReference;
  derivation: string;
  confidence?: number;
  now: string;
}>): LocationGeographyMembership {
  const locationId = foreignId(input.locationId, "Location id");
  if (!Number.isSafeInteger(input.profileVersion) || input.profileVersion < 1) {
    throw new Error("Location geography profile version must be a positive integer.");
  }
  const confidence = input.confidence ?? 1;
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error("Geography membership confidence must be between 0 and 1.");
  }
  return Object.freeze({
    id: stableId<LocationGeographyMembershipId>(
      `${locationId}:${input.profileVersion}:${input.reference.versionId}`,
      "Location geography membership id",
    ),
    locationId,
    organizationId: input.organizationId?.trim()
      ? foreignId(input.organizationId, "Organization id")
      : null,
    profileVersion: input.profileVersion,
    geographyId: input.reference.geographyId,
    geographyVersionId: input.reference.versionId,
    geographyType: input.reference.type,
    role: membershipRole(input.reference),
    derivation: oneOf(
      input.derivation,
      GEOGRAPHY_DERIVATIONS,
      "geography derivation",
    ),
    confidence,
    createdAt: isoTimestamp(input.now),
  });
}

export function createLocationGeographyProfile(input: Readonly<{
  locationId: string;
  organizationId?: string | null;
  operatingGeographyId?: string | null;
  profileVersion: number;
  acceptedPoint: GeographyPoint;
  visibility: LocationVisibility;
  hierarchy: PhysicalGeographyHierarchy;
  overlays?: readonly GeographyReference[];
  memberships: readonly LocationGeographyMembership[];
  resolver: string;
  benchmark?: string | null;
  resolverVintage?: string | null;
  sourceLocationUpdatedAt: string;
  resolvedAt: string;
  existing?: LocationGeographyProfile | null;
}>): LocationGeographyProfile {
  if (!Number.isSafeInteger(input.profileVersion) || input.profileVersion < 1) {
    throw new Error("Location geography profile version must be a positive integer.");
  }
  if (input.existing && input.profileVersion !== input.existing.profileVersion + 1) {
    throw new Error("Location geography profile version must increment the existing profile by one.");
  }
  const locationId = foreignId(input.locationId, "Location id");
  const organizationId = input.organizationId?.trim()
    ? foreignId(input.organizationId, "Organization id")
    : null;
  if (input.existing && input.existing.locationId !== locationId) {
    throw new Error("Location geography profile cannot be reassigned to another location.");
  }
  const hierarchy = validateHierarchy(input.hierarchy);
  const overlays = uniqueReferences(input.overlays ?? []);
  if (
    overlays.some((reference) =>
      (PHYSICAL_GEOGRAPHY_TYPES as readonly string[]).includes(reference.type),
    )
  ) {
    throw new Error("Physical containment geographies cannot be stored as overlays.");
  }

  const expectedReferences = uniqueReferences(
    [
      hierarchy.country,
      hierarchy.state,
      hierarchy.countyEquivalent,
      hierarchy.place,
      hierarchy.censusTract,
      hierarchy.blockGroup,
      hierarchy.censusBlock,
      ...overlays,
    ].filter((reference): reference is GeographyReference => Boolean(reference)),
  );
  const expectedByVersion = new Map(
    expectedReferences.map((reference) => [reference.versionId, reference]),
  );
  const membershipByVersion = new Map<GeographyVersionId, LocationGeographyMembership>();
  for (const membership of input.memberships) {
    if (
      membership.locationId !== locationId
      || membership.profileVersion !== input.profileVersion
    ) {
      throw new Error("Location geography membership does not match the profile identity and revision.");
    }
    if (membership.organizationId !== organizationId) {
      throw new Error("Location geography membership organization does not match the profile.");
    }
    if (membershipByVersion.has(membership.geographyVersionId)) {
      throw new Error("Location geography profile cannot repeat a geography-version membership.");
    }
    const reference = expectedByVersion.get(membership.geographyVersionId);
    if (
      !reference
      || reference.geographyId !== membership.geographyId
      || reference.type !== membership.geographyType
      || membership.role !== membershipRole(reference)
    ) {
      throw new Error("Location geography membership does not match the materialized reference.");
    }
    membershipByVersion.set(membership.geographyVersionId, membership);
  }
  if (membershipByVersion.size !== expectedReferences.length) {
    throw new Error(
      "Location geography memberships must materialize the complete hierarchy and overlays.",
    );
  }

  const acceptedPoint = geographyPoint(input.acceptedPoint);
  const resolvedAt = isoTimestamp(input.resolvedAt, "Geography resolution timestamp");
  return Object.freeze({
    id: locationGeographyProfileId(locationId),
    locationId,
    organizationId,
    operatingGeographyId: input.operatingGeographyId?.trim()
      ? foreignId(input.operatingGeographyId, "Operating geography id")
      : null,
    profileVersion: input.profileVersion,
    acceptedPoint,
    acceptedPointFingerprint: acceptedPointFingerprint(acceptedPoint),
    visibility: oneOf(
      input.visibility,
      ["exact", "approximate", "locality-only"] as const,
      "location visibility",
    ),
    hierarchy,
    overlays,
    membershipIds: Object.freeze(
      [...membershipByVersion.values()].map((membership) => membership.id),
    ),
    resolver: normalized(input.resolver, "Geography resolver", 240),
    benchmark: optional(input.benchmark, "Geography resolver benchmark", 160),
    resolverVintage: optional(
      input.resolverVintage,
      "Geography resolver vintage",
      160,
    ),
    derivedFrom: "accepted-coordinate",
    sourceLocationUpdatedAt: isoTimestamp(
      input.sourceLocationUpdatedAt,
      "Source location update timestamp",
    ),
    resolvedAt,
    updatedAt: resolvedAt,
  });
}

function validateScopeShape(input: Readonly<{
  mode: GeographicScopeMode;
  inclusionVersionIds: readonly GeographyVersionId[];
  exclusionVersionIds: readonly GeographyVersionId[];
  sourceLocationId: string | null;
  address: GeographicScopeAddress | null;
  point: GeographyPoint | null;
  radiusMeters: number | null;
  polygonAssetId: string | null;
  remote: boolean;
}>): void {
  const anyGeographies =
    input.inclusionVersionIds.length > 0 || input.exclusionVersionIds.length > 0;
  const hasAddress = input.address !== null;
  const hasPoint = input.point !== null;
  const hasRadius = input.radiusMeters !== null;
  const hasPolygon = input.polygonAssetId !== null;

  if (input.mode === "geographies") {
    if (!anyGeographies) {
      throw new Error("Geography scope requires at least one included or excluded geography.");
    }
    if (hasAddress || hasPoint || hasRadius || hasPolygon || input.remote) {
      throw new Error(
        "Geography-set scope cannot also declare address, point, radius, polygon, or remote fields.",
      );
    }
  }
  if (input.mode === "address") {
    if (!hasAddress) throw new Error("Address scope requires a structured address.");
    if (hasPoint || hasRadius || hasPolygon || input.remote) {
      throw new Error("Address scope cannot also declare point, radius, polygon, or remote fields.");
    }
  }
  if (input.mode === "point") {
    if (!hasPoint) throw new Error("Point scope requires a point.");
    if (hasAddress || hasRadius || hasPolygon || input.remote) {
      throw new Error("Point scope cannot also declare address, radius, polygon, or remote fields.");
    }
  }
  if (input.mode === "radius") {
    if (!hasPoint || input.radiusMeters === null || input.radiusMeters <= 0) {
      throw new Error("Radius scope requires a point and positive radius.");
    }
    if (hasAddress || hasPolygon || input.remote) {
      throw new Error("Radius scope cannot also declare address, polygon, or remote fields.");
    }
  }
  if (input.mode === "polygon") {
    if (!hasPolygon) throw new Error("Polygon scope requires a governed polygon asset.");
    if (hasAddress || hasPoint || hasRadius || input.remote) {
      throw new Error("Polygon scope cannot also declare address, point, radius, or remote fields.");
    }
  }
  if (input.mode === "statewide" || input.mode === "nationwide") {
    if (
      input.inclusionVersionIds.length !== 1
      || hasAddress
      || hasPoint
      || hasRadius
      || hasPolygon
      || input.remote
    ) {
      throw new Error(
        `${input.mode} scope requires exactly one included canonical geography and no geometry fields.`,
      );
    }
  }
  if (input.mode === "remote") {
    if (
      !input.remote
      || anyGeographies
      || input.sourceLocationId
      || hasAddress
      || hasPoint
      || hasRadius
      || hasPolygon
    ) {
      throw new Error(
        "Remote scope cannot imply a physical point, boundary, source location, or geography membership.",
      );
    }
  }
}

export function createGeographicScope(input: Readonly<{
  id: string;
  subject: GeographicScopeSubject;
  kind: string;
  mode: string;
  label?: string | null;
  inclusionVersionIds?: readonly string[];
  exclusionVersionIds?: readonly string[];
  sourceLocationId?: string | null;
  address?: GeographicScopeAddress | null;
  point?: GeographyPoint | null;
  radiusMeters?: number | null;
  polygonAssetId?: string | null;
  visibility: GeographicScopeVisibility;
  revision: number;
  updatedByUserId: string;
  updatedByMembershipId: string;
  now: string;
  existing?: GeographicScope | null;
}>): GeographicScope {
  if (!Number.isSafeInteger(input.revision) || input.revision < 1) {
    throw new Error("Scope revision must be a positive integer.");
  }
  if (input.existing && input.revision !== input.existing.revision + 1) {
    throw new Error("Scope revision must increment by one.");
  }
  const id = geographicScopeId(input.id);
  const mode = oneOf(input.mode, GEOGRAPHIC_SCOPE_MODES, "geographic scope mode");
  const kind = oneOf(input.kind, GEOGRAPHIC_SCOPE_KINDS, "geographic scope kind");
  const subjectKind = oneOf(
    input.subject.kind,
    GEOGRAPHIC_SCOPE_SUBJECT_KINDS,
    "geographic scope subject kind",
  );
  if (SCOPE_SUBJECT_COMPATIBILITY[kind] !== subjectKind) {
    throw new Error(`${kind} cannot be attached to subject kind ${subjectKind}.`);
  }
  const organizationId = foreignId(
    input.subject.organizationId,
    "Geographic scope organization id",
  );
  const subjectId = foreignId(input.subject.id, "Geographic scope subject id");
  if (
    input.existing
    && (
      input.existing.id !== id
      || input.existing.kind !== kind
      || input.existing.subject.kind !== subjectKind
      || input.existing.subject.id !== subjectId
      || input.existing.organizationId !== organizationId
    )
  ) {
    throw new Error("Geographic scope identity, subject, and purpose cannot be reassigned.");
  }

  const inclusionVersionIds = unique(
    (input.inclusionVersionIds ?? []).map(geographyVersionId),
  );
  const exclusionVersionIds = unique(
    (input.exclusionVersionIds ?? []).map(geographyVersionId),
  );
  if (inclusionVersionIds.some((value) => exclusionVersionIds.includes(value))) {
    throw new Error("A geography version cannot be both included and excluded.");
  }

  const address = input.address
    ? Object.freeze({
        addressLine1: normalized(input.address.addressLine1, "Scope address line 1"),
        addressLine2: optional(input.address.addressLine2, "Scope address line 2"),
        locality: normalized(input.address.locality, "Scope locality", 120),
        regionCode: normalized(input.address.regionCode, "Scope region code", 8).toUpperCase(),
        postalCode: optional(input.address.postalCode, "Scope postal code", 16),
        countryCode: countryCode(input.address.countryCode),
      })
    : null;
  const point = input.point ? geographyPoint(input.point) : null;
  const radiusMeters = input.radiusMeters ?? null;
  if (radiusMeters !== null && (!Number.isFinite(radiusMeters) || radiusMeters <= 0)) {
    throw new Error("Scope radius must be a positive finite number.");
  }
  const polygonAssetId = input.polygonAssetId?.trim()
    ? foreignId(input.polygonAssetId, "Scope polygon asset id")
    : null;
  const sourceLocationId = input.sourceLocationId?.trim()
    ? foreignId(input.sourceLocationId, "Scope source location id")
    : null;
  const remote = mode === "remote";
  validateScopeShape({
    mode,
    inclusionVersionIds,
    exclusionVersionIds,
    sourceLocationId,
    address,
    point,
    radiusMeters,
    polygonAssetId,
    remote,
  });

  const now = isoTimestamp(input.now);
  return Object.freeze({
    id,
    organizationId,
    subject: Object.freeze({
      kind: subjectKind,
      id: subjectId,
      organizationId,
    }),
    kind,
    mode,
    label: optional(input.label, "Geographic scope label", 300),
    inclusionVersionIds,
    exclusionVersionIds,
    sourceLocationId,
    address,
    point,
    radiusMeters,
    polygonAssetId,
    remote,
    visibility: oneOf(
      input.visibility,
      ["private", "network", "public"] as const,
      "geographic scope visibility",
    ),
    revision: input.revision,
    updatedByUserId: foreignId(input.updatedByUserId, "Scope updater user id"),
    updatedByMembershipId: foreignId(
      input.updatedByMembershipId,
      "Scope updater membership id",
    ),
    createdAt: input.existing?.createdAt ?? now,
    updatedAt: now,
  });
}

export function createGeographicScopeMembers(
  scope: GeographicScope,
  references: readonly GeographyReference[],
  now: string,
): readonly GeographicScopeMember[] {
  const uniqueReferenceValues = uniqueReferences(references);
  const referenceByVersion = new Map(
    uniqueReferenceValues.map((reference) => [reference.versionId, reference]),
  );
  const includedReferences = scope.inclusionVersionIds.map((id) => referenceByVersion.get(id));
  if (
    scope.mode === "statewide"
    && (includedReferences.length !== 1 || includedReferences[0]?.type !== "state")
  ) {
    throw new Error("Statewide scope must include exactly one state geography version.");
  }
  if (
    scope.mode === "nationwide"
    && (includedReferences.length !== 1 || includedReferences[0]?.type !== "country")
  ) {
    throw new Error("Nationwide scope must include exactly one country geography version.");
  }

  const entries: GeographicScopeMember[] = [];
  for (const [inclusion, versionIds] of [
    ["include", scope.inclusionVersionIds],
    ["exclude", scope.exclusionVersionIds],
  ] as const) {
    for (const versionId of versionIds) {
      const reference = referenceByVersion.get(versionId);
      if (!reference) {
        throw new Error(`Scope member geography version is unavailable: ${versionId}.`);
      }
      entries.push(
        Object.freeze({
          id: stableId<GeographicScopeMemberId>(
            `${scope.id}:${scope.revision}:${inclusion}:${versionId}`,
            "Geographic scope member id",
          ),
          organizationId: scope.organizationId,
          scopeId: scope.id,
          scopeRevision: scope.revision,
          geographyId: reference.geographyId,
          geographyVersionId: reference.versionId,
          inclusion,
          createdAt: isoTimestamp(now),
        }),
      );
    }
  }
  return Object.freeze(entries);
}

function localityLabel(profile: LocationGeographyProfile): string {
  const local =
    profile.hierarchy.place
    ?? profile.hierarchy.countyEquivalent
    ?? profile.hierarchy.state
    ?? profile.hierarchy.country;
  return local.stateCode && local.type !== "state"
    ? `${local.name}, ${local.stateCode}`
    : local.name;
}

export function projectLocationGeographyProfile(
  profile: LocationGeographyProfile,
  audience: GeographyProjectionAudience,
): ProjectedLocationGeographyProfile {
  const hierarchy = profile.hierarchy;
  const participantPhysical = [
    hierarchy.country,
    hierarchy.state,
    hierarchy.countyEquivalent,
    hierarchy.place,
  ].filter((reference): reference is GeographyReference => Boolean(reference));
  const privatePhysical = [
    hierarchy.country,
    hierarchy.state,
    hierarchy.countyEquivalent,
    hierarchy.place,
    hierarchy.censusTract,
    hierarchy.blockGroup,
    hierarchy.censusBlock,
  ].filter((reference): reference is GeographyReference => Boolean(reference));
  const safeOverlays = profile.overlays.filter((reference) =>
    (PARTICIPANT_SAFE_LOCATION_OVERLAY_TYPES as readonly string[]).includes(reference.type),
  );
  const visibleGeographies = audience === "private"
    ? [...privatePhysical, ...profile.overlays]
    : [...participantPhysical, ...safeOverlays];
  const point = audience === "private"
    ? profile.acceptedPoint
    : audience !== "analytics" && profile.visibility === "exact"
      ? profile.acceptedPoint
      : null;
  return Object.freeze({
    locationId: profile.locationId,
    organizationId: profile.organizationId,
    localityLabel: localityLabel(profile),
    operatingGeographyId: profile.operatingGeographyId,
    visibleGeographies: uniqueReferences(visibleGeographies),
    point,
    precision: profile.visibility,
    resolverVintage: profile.resolverVintage,
  });
}

export function createGeographyMetricSnapshot(input: Readonly<{
  id: string;
  metricId: string;
  geographyId: string;
  geographyVersionId: string;
  periodStart: string;
  periodEnd: string;
  recordType: string;
  count: number;
  organizationCount: number;
  coverage?: string;
  sourceDatasetIds?: readonly string[];
  minimumCellSize?: number;
  generatedAt: string;
}>): GeographyMetricSnapshot {
  if (!Number.isSafeInteger(input.count) || input.count < 0) {
    throw new Error("Metric count must be a non-negative integer.");
  }
  if (!Number.isSafeInteger(input.organizationCount) || input.organizationCount < 0) {
    throw new Error("Metric organization count must be a non-negative integer.");
  }
  if (input.organizationCount > input.count) {
    throw new Error("Metric organization count cannot exceed total record count.");
  }
  const minimumCellSize = input.minimumCellSize ?? 5;
  if (!Number.isSafeInteger(minimumCellSize) || minimumCellSize < 2) {
    throw new Error("Minimum analytical cell size must be an integer of at least two.");
  }
  const periodStart = isoTimestamp(input.periodStart, "Metric period start");
  const periodEnd = isoTimestamp(input.periodEnd, "Metric period end");
  if (periodEnd <= periodStart) throw new Error("Metric period end must follow period start.");
  const coverage = oneOf(
    input.coverage ?? "rfxchange-exchange-only",
    GEOGRAPHY_METRIC_COVERAGE,
    "geography metric coverage",
  );
  const sourceDatasetIds = unique(
    (input.sourceDatasetIds ?? []).map(geographyDatasetSourceId),
  );
  if (coverage === "external-authoritative-dataset" && sourceDatasetIds.length === 0) {
    throw new Error(
      "External-authoritative geography metrics require at least one source dataset.",
    );
  }
  return Object.freeze({
    id: stableId<GeographyMetricSnapshotId>(input.id, "Geography metric snapshot id"),
    metricId: stableId<string>(input.metricId, "Geography metric id"),
    geographyId: canonicalGeographyId(input.geographyId),
    geographyVersionId: geographyVersionId(input.geographyVersionId),
    periodStart,
    periodEnd,
    recordType: oneOf(
      input.recordType,
      GEOGRAPHY_METRIC_RECORD_TYPES,
      "geography metric record type",
    ),
    count: input.count,
    organizationCount: input.organizationCount,
    coverage,
    sourceDatasetIds,
    minimumCellSize,
    suppressed: input.organizationCount < minimumCellSize,
    generatedAt: isoTimestamp(input.generatedAt, "Metric generation timestamp"),
  });
}

export function projectGeographyMetricSnapshot(
  snapshot: GeographyMetricSnapshot,
): Readonly<
  Omit<GeographyMetricSnapshot, "count" | "organizationCount"> & {
    readonly count: number | null;
    readonly organizationCount: number | null;
  }
> {
  return Object.freeze({
    ...snapshot,
    count: snapshot.suppressed ? null : snapshot.count,
    organizationCount: snapshot.suppressed ? null : snapshot.organizationCount,
  });
}

export function createGeographyFabricCommand(input: Readonly<{
  id: string;
  action: string;
  organizationId?: string | null;
  subjectId: string;
  requestFingerprint: string;
  actorUserId?: string | null;
  actorMembershipId?: string | null;
  recordedAt: string;
}>): GeographyFabricCommand {
  const actorUserId = input.actorUserId?.trim()
    ? foreignId(input.actorUserId, "Geography Fabric actor user id")
    : null;
  const actorMembershipId = input.actorMembershipId?.trim()
    ? foreignId(input.actorMembershipId, "Geography Fabric actor membership id")
    : null;
  if ((actorUserId === null) !== (actorMembershipId === null)) {
    throw new Error("Geography Fabric actor user and membership must be supplied together.");
  }
  return Object.freeze({
    id: stableId<GeographyFabricCommandId>(input.id, "Geography Fabric command id"),
    action: oneOf(
      input.action,
      GEOGRAPHY_FABRIC_COMMAND_ACTIONS,
      "Geography Fabric command action",
    ),
    organizationId: input.organizationId?.trim()
      ? foreignId(input.organizationId, "Geography Fabric command organization id")
      : null,
    subjectId: foreignId(input.subjectId, "Geography Fabric command subject id"),
    requestFingerprint: normalized(
      input.requestFingerprint,
      "Geography Fabric request fingerprint",
      500,
    ),
    actorUserId,
    actorMembershipId,
    recordedAt: isoTimestamp(input.recordedAt, "Geography Fabric command timestamp"),
  });
}

export function createGeographyFabricEvent(input: Readonly<{
  id: string;
  kind: string;
  organizationId?: string | null;
  subjectId: string;
  command: GeographyFabricCommand;
  occurredAt: string;
}>): GeographyFabricEvent {
  const kind = oneOf(
    input.kind,
    GEOGRAPHY_FABRIC_EVENT_KINDS,
    "Geography Fabric event kind",
  );
  if (EVENT_KIND_BY_ACTION[input.command.action] !== kind) {
    throw new Error("Geography Fabric event kind does not match its command action.");
  }
  const organizationId = input.organizationId?.trim()
    ? foreignId(input.organizationId, "Geography Fabric event organization id")
    : null;
  if (organizationId !== input.command.organizationId) {
    throw new Error("Geography Fabric event organization must match its command.");
  }
  const subjectId = foreignId(input.subjectId, "Geography Fabric event subject id");
  if (subjectId !== input.command.subjectId) {
    throw new Error("Geography Fabric event subject must match its command.");
  }
  return Object.freeze({
    id: stableId<GeographyFabricEventId>(input.id, "Geography Fabric event id"),
    kind,
    organizationId,
    subjectId,
    commandId: input.command.id,
    occurredAt: isoTimestamp(input.occurredAt, "Geography Fabric event timestamp"),
  });
}
