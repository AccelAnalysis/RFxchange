import { buildLocationProfileMaterialization } from "../geography-fabric/location-profile-materialization.ts";
import type { AcceptedPointGeographyResolution } from "../../domain/geography-fabric/resolver.ts";
import {
  createProviderCanonicalComparison,
  createProviderSeedPromotionCandidate,
  type ProviderCanonicalComparison,
  type ProviderCanonicalComparisonOutcome,
} from "../../domain/provider-seeding/promotion.ts";
import {
  createProviderSeedSourceRecord,
  deterministicProviderPromotionFingerprint,
  providerCanonicalComparisonFingerprint,
  providerCanonicalSearchFingerprint,
  providerGeographyProfileFingerprint,
  providerSeedSourceRecordFingerprint,
  type ProviderCanonicalSearchSnapshot,
  type ProviderSeedSourceRecord,
} from "../../domain/provider-seeding/promotion-runtime.ts";

export type HamptonRoadsPromotionReviewStatus =
  | "ready-for-canonical-search"
  | "identity-review-required"
  | "needs-geography-resolution"
  | "blocked";

export interface HamptonRoadsMigrationRecord {
  readonly seedKey: string;
  readonly displayName: string;
  readonly providerClass: string;
  readonly participationPolicy: string;
  readonly providerType: string;
  readonly resourceCategory: string;
  readonly serviceName: string;
  readonly serviceSummary: string;
  readonly website: string | null;
  readonly aliases: readonly string[];
  readonly serviceAreaLabels: readonly string[];
  readonly primarySourceId: string;
  readonly intendedClaimState: string;
  readonly disposition: string;
  readonly heldOutReason: string | null;
  readonly location: Readonly<{
    readonly locationKey: string;
    readonly label: string;
    readonly address1: string;
    readonly address2: string | null;
    readonly city: string;
    readonly state: string;
    readonly postalCode: string;
    readonly census: Readonly<{
      readonly benchmark: string;
      readonly matchedAddress: string | null;
      readonly latitude: number;
      readonly longitude: number;
      readonly geocodedAt: string;
    }> | null;
  }> | null;
}

export interface HamptonRoadsMigrationPlan {
  readonly schemaVersion: number;
  readonly marketKey: string;
  readonly donorRepository: string;
  readonly donorCommit: string;
  readonly geocodeProvider: string;
  readonly geocodeBenchmark: string;
  readonly geocodePolicy: string;
  readonly sourceCounts: Readonly<Record<string, number>>;
  readonly dispositionCounts: Readonly<Record<string, number>>;
  readonly records: readonly HamptonRoadsMigrationRecord[];
}

export interface HamptonRoadsResolvedGeographyLocation {
  readonly status: "ready_for_profile_materialization";
  readonly locationKey: string;
  readonly seedKeys: readonly string[];
  readonly acceptedPoint: AcceptedPointGeographyResolution["acceptedPoint"];
  readonly acceptedPointFingerprint: string;
  readonly sourceGeocodedAt: string;
  readonly resolver: string;
  readonly benchmark: string;
  readonly vintage: string;
  readonly resolvedAt: string;
  readonly hierarchy: AcceptedPointGeographyResolution["hierarchy"];
  readonly overlays: AcceptedPointGeographyResolution["overlays"];
  readonly datasetSources: AcceptedPointGeographyResolution["datasetSources"];
  readonly entries: AcceptedPointGeographyResolution["entries"];
}

export interface HamptonRoadsUnresolvedGeographyLocation {
  readonly status: "needs_geography_resolution";
  readonly locationKey: string;
  readonly seedKeys: readonly string[];
  readonly acceptedPoint: AcceptedPointGeographyResolution["acceptedPoint"];
  readonly acceptedPointFingerprint: string;
  readonly sourceGeocodedAt: string;
  readonly error: string;
}

export interface HamptonRoadsGeographyEnrichmentManifest {
  readonly schemaVersion: number;
  readonly marketKey: string;
  readonly sourcePlanSchemaVersion: number;
  readonly productionWrites: false;
  readonly locations: readonly (
    | HamptonRoadsResolvedGeographyLocation
    | HamptonRoadsUnresolvedGeographyLocation
  )[];
}

export interface HamptonRoadsPromotionReviewItem {
  readonly seedKey: string;
  readonly displayName: string;
  readonly disposition: string;
  readonly status: HamptonRoadsPromotionReviewStatus;
  readonly requiredNextAction: string;
  readonly sourceRecord: ProviderSeedSourceRecord | null;
  readonly geographyResolution: AcceptedPointGeographyResolution | null;
  readonly geographyResolutionFingerprint: string | null;
  readonly promotionEligible: false;
}

export interface HamptonRoadsPromotionReviewManifest {
  readonly schemaVersion: 1;
  readonly marketKey: "hampton-roads-va";
  readonly generatedAt: string;
  readonly productionWrites: false;
  readonly approvalsInferred: false;
  readonly sourcePlanFingerprint: string;
  readonly geographyManifestFingerprint: string;
  readonly counts: Readonly<{
    readonly sourceCandidates: number;
    readonly readyForCanonicalSearch: number;
    readonly identityReviewRequired: number;
    readonly needsGeographyResolution: number;
    readonly blocked: number;
  }>;
  readonly items: readonly HamptonRoadsPromotionReviewItem[];
}

export interface HamptonRoadsPromotionComparisonPacket {
  readonly schemaVersion: 1;
  readonly marketKey: "hampton-roads-va";
  readonly status: "comparison-ready";
  readonly productionWrites: false;
  readonly approvalCreated: false;
  readonly sourceRecord: ProviderSeedSourceRecord;
  readonly geography: ReturnType<typeof buildLocationProfileMaterialization>;
  readonly candidate: ReturnType<typeof createProviderSeedPromotionCandidate>;
  readonly canonicalSearch: ProviderCanonicalSearchSnapshot;
  readonly comparison: ProviderCanonicalComparison;
}

function iso(value: string, label: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new Error(`${label} must be ISO-compatible.`);
  return new Date(parsed).toISOString();
}

function stablePlanEvidence(plan: HamptonRoadsMigrationPlan): unknown {
  return {
    schemaVersion: plan.schemaVersion,
    marketKey: plan.marketKey,
    donorRepository: plan.donorRepository,
    donorCommit: plan.donorCommit,
    geocodeProvider: plan.geocodeProvider,
    geocodeBenchmark: plan.geocodeBenchmark,
    geocodePolicy: plan.geocodePolicy,
    sourceCounts: plan.sourceCounts,
    dispositionCounts: plan.dispositionCounts,
    records: plan.records,
  };
}

function resolvedGeography(
  value: HamptonRoadsResolvedGeographyLocation,
): AcceptedPointGeographyResolution {
  return Object.freeze({
    acceptedPoint: value.acceptedPoint,
    acceptedPointFingerprint: value.acceptedPointFingerprint,
    datasetSources: value.datasetSources,
    entries: value.entries,
    hierarchy: value.hierarchy,
    overlays: value.overlays,
    resolver: value.resolver,
    benchmark: value.benchmark,
    vintage: value.vintage,
    resolvedAt: value.resolvedAt,
  });
}

function geographyEvidenceFingerprint(
  value: AcceptedPointGeographyResolution,
): string {
  return deterministicProviderPromotionFingerprint({
    acceptedPoint: value.acceptedPoint,
    acceptedPointFingerprint: value.acceptedPointFingerprint,
    datasetSources: value.datasetSources,
    entries: value.entries,
    hierarchy: value.hierarchy,
    overlays: value.overlays,
    resolver: value.resolver,
    benchmark: value.benchmark,
    vintage: value.vintage,
    resolvedAt: value.resolvedAt,
  });
}

function sourceRecord(
  plan: HamptonRoadsMigrationPlan,
  record: HamptonRoadsMigrationRecord,
  sourcePlanFingerprint: string,
  preparedAt: string,
): ProviderSeedSourceRecord | null {
  const location = record.location;
  const census = location?.census;
  if (!location || !census) return null;
  return createProviderSeedSourceRecord({
    marketKey: plan.marketKey,
    seedKey: record.seedKey,
    displayName: record.displayName,
    providerClass: record.providerClass,
    participationPolicy: record.participationPolicy,
    providerType: record.providerType,
    resourceCategory: record.resourceCategory,
    serviceName: record.serviceName,
    serviceSummary: record.serviceSummary,
    website: record.website,
    aliases: record.aliases,
    serviceAreaLabels: record.serviceAreaLabels,
    primarySourceId: record.primarySourceId,
    intendedClaimState: record.intendedClaimState,
    location: {
      locationKey: location.locationKey,
      label: location.label,
      address: {
        addressLine1: location.address1,
        addressLine2: location.address2,
        locality: location.city,
        regionCode: location.state,
        postalCode: location.postalCode || null,
        countryCode: "US",
        matchedAddress: census.matchedAddress,
      },
      acceptedPoint: {
        longitude: census.longitude,
        latitude: census.latitude,
      },
      benchmark: census.benchmark,
      geocodedAt: census.geocodedAt,
    },
    sourcePlanFingerprint,
    donorRepository: plan.donorRepository,
    donorCommit: plan.donorCommit,
    preparedAt,
  });
}

function statusFor(
  record: HamptonRoadsMigrationRecord,
  source: ProviderSeedSourceRecord | null,
  geography:
    | HamptonRoadsResolvedGeographyLocation
    | HamptonRoadsUnresolvedGeographyLocation
    | null,
): Readonly<{
  status: HamptonRoadsPromotionReviewStatus;
  requiredNextAction: string;
}> {
  if (
    record.disposition === "ready_for_canonical_comparison"
    && source
    && geography?.status === "ready_for_profile_materialization"
  ) {
    return Object.freeze({
      status: "ready-for-canonical-search",
      requiredNextAction: "Run current canonical Organization search and record an administrator comparison decision.",
    });
  }
  if (
    record.disposition === "needs_identity_review"
    && source
    && geography?.status === "ready_for_profile_materialization"
  ) {
    return Object.freeze({
      status: "identity-review-required",
      requiredNextAction: "Resolve classification/canonical identity through the dedicated identity-review path before promotion.",
    });
  }
  if (
    (record.disposition === "ready_for_canonical_comparison"
      || record.disposition === "needs_identity_review")
    && source
  ) {
    return Object.freeze({
      status: "needs-geography-resolution",
      requiredNextAction: "Resolve the accepted location through the Geography Fabric before canonical comparison.",
    });
  }
  return Object.freeze({
    status: "blocked",
    requiredNextAction: record.disposition === "held_out"
      ? `Remain held out: ${record.heldOutReason ?? "governed hold"}.`
      : `Resolve source disposition ${record.disposition} before promotion.`,
  });
}

export function buildHamptonRoadsPromotionReviewManifest(input: Readonly<{
  plan: HamptonRoadsMigrationPlan;
  geographyManifest: HamptonRoadsGeographyEnrichmentManifest;
  generatedAt: string;
}>): HamptonRoadsPromotionReviewManifest {
  const generatedAt = iso(input.generatedAt, "Promotion review generation timestamp");
  if (
    input.plan.marketKey !== "hampton-roads-va"
    || input.geographyManifest.marketKey !== "hampton-roads-va"
    || input.geographyManifest.productionWrites !== false
  ) {
    throw new Error("Unexpected Hampton Roads promotion review source identity.");
  }
  if (input.geographyManifest.sourcePlanSchemaVersion !== input.plan.schemaVersion) {
    throw new Error("Geography enrichment was produced from a different migration-plan schema.");
  }
  const sourcePlanFingerprint = deterministicProviderPromotionFingerprint(
    stablePlanEvidence(input.plan),
  );
  const geographyManifestFingerprint = deterministicProviderPromotionFingerprint({
    schemaVersion: input.geographyManifest.schemaVersion,
    marketKey: input.geographyManifest.marketKey,
    sourcePlanSchemaVersion: input.geographyManifest.sourcePlanSchemaVersion,
    locations: input.geographyManifest.locations,
  });
  const geographyByLocation = new Map(
    input.geographyManifest.locations.map((location) => [location.locationKey, location]),
  );
  const seenSeeds = new Set<string>();
  const items = input.plan.records
    .map((record): HamptonRoadsPromotionReviewItem => {
      if (seenSeeds.has(record.seedKey)) {
        throw new Error(`Duplicate Hampton Roads promotion seed ${record.seedKey}.`);
      }
      seenSeeds.add(record.seedKey);
      const source = sourceRecord(
        input.plan,
        record,
        sourcePlanFingerprint,
        generatedAt,
      );
      const geography = source
        ? geographyByLocation.get(source.location.locationKey) ?? null
        : null;
      if (
        source
        && geography
        && !geography.seedKeys.includes(record.seedKey)
      ) {
        throw new Error(`Geography enrichment ${geography.locationKey} does not bind seed ${record.seedKey}.`);
      }
      if (
        source
        && geography
        && geography.acceptedPointFingerprint
          !== source.location.acceptedPointFingerprint
      ) {
        throw new Error(`Geography enrichment moved accepted point for ${record.seedKey}.`);
      }
      const review = statusFor(record, source, geography);
      const resolution = geography?.status === "ready_for_profile_materialization"
        ? resolvedGeography(geography)
        : null;
      return Object.freeze({
        seedKey: record.seedKey,
        displayName: record.displayName,
        disposition: record.disposition,
        status: review.status,
        requiredNextAction: review.requiredNextAction,
        sourceRecord: source,
        geographyResolution: resolution,
        geographyResolutionFingerprint: resolution
          ? geographyEvidenceFingerprint(resolution)
          : null,
        promotionEligible: false,
      });
    })
    .sort((left, right) => left.seedKey.localeCompare(right.seedKey));

  const count = (status: HamptonRoadsPromotionReviewStatus) =>
    items.filter((item) => item.status === status).length;
  return Object.freeze({
    schemaVersion: 1,
    marketKey: "hampton-roads-va",
    generatedAt,
    productionWrites: false,
    approvalsInferred: false,
    sourcePlanFingerprint,
    geographyManifestFingerprint,
    counts: Object.freeze({
      sourceCandidates: items.length,
      readyForCanonicalSearch: count("ready-for-canonical-search"),
      identityReviewRequired: count("identity-review-required"),
      needsGeographyResolution: count("needs-geography-resolution"),
      blocked: count("blocked"),
    }),
    items: Object.freeze(items),
  });
}

export function compileHamptonRoadsPromotionComparison(input: Readonly<{
  item: HamptonRoadsPromotionReviewItem;
  canonicalSearch: ProviderCanonicalSearchSnapshot;
  outcome: Extract<
    ProviderCanonicalComparisonOutcome,
    "create-new-organization" | "attach-to-existing-organization"
  >;
  targetOrganizationId: string;
  reviewedByAdministratorId: string;
  authorityContextId: string;
  reviewedAt: string;
}>): HamptonRoadsPromotionComparisonPacket {
  const reviewedAt = iso(input.reviewedAt, "Promotion comparison review timestamp");
  if (
    input.item.status !== "ready-for-canonical-search"
    || !input.item.sourceRecord
    || !input.item.geographyResolution
    || !input.item.geographyResolutionFingerprint
  ) {
    throw new Error("Only a geography-ready ordinary comparison item can compile promotion evidence.");
  }
  if (input.canonicalSearch.candidateId !== input.item.sourceRecord.id) {
    throw new Error("Canonical search snapshot belongs to a different provider seed.");
  }
  const targetOrganizationId = input.targetOrganizationId.trim();
  if (!targetOrganizationId) throw new Error("Promotion comparison requires a target Organization id.");
  const selected = input.outcome === "attach-to-existing-organization"
    ? input.canonicalSearch.matches.find(
        (match) => match.organizationId === targetOrganizationId,
      )
    : null;
  if (input.outcome === "attach-to-existing-organization" && !selected) {
    throw new Error("Existing-Organization promotion requires the target in current search evidence.");
  }

  const locationId = `${targetOrganizationId}:provider-seed:${input.item.seedKey}:location`;
  const geography = buildLocationProfileMaterialization({
    locationId,
    organizationId: targetOrganizationId,
    acceptedPoint: input.item.sourceRecord.location.acceptedPoint,
    visibility: "approximate",
    profileVersion: 1,
    sourceLocationUpdatedAt: input.item.sourceRecord.preparedAt,
    resolution: input.item.geographyResolution,
    commandId: `${input.item.seedKey}:geography-materialization`,
    eventId: `${input.item.seedKey}:geography-materialized`,
    requestFingerprint: deterministicProviderPromotionFingerprint({
      seedKey: input.item.seedKey,
      targetOrganizationId,
      locationId,
      geographyResolutionFingerprint: input.item.geographyResolutionFingerprint,
    }),
  });
  const sourceRecordFingerprint = providerSeedSourceRecordFingerprint(
    input.item.sourceRecord,
  );
  const geographyProfileFingerprint = providerGeographyProfileFingerprint(geography);
  const candidate = createProviderSeedPromotionCandidate({
    marketKey: "hampton-roads-va",
    seedKey: input.item.seedKey,
    displayName: input.item.sourceRecord.displayName,
    providerClass: input.item.sourceRecord.providerClass,
    participationPolicy: input.item.sourceRecord.participationPolicy,
    providerType: input.item.sourceRecord.providerType,
    resourceCategory: input.item.sourceRecord.resourceCategory,
    serviceName: input.item.sourceRecord.serviceName,
    website: input.item.sourceRecord.website,
    aliases: input.item.sourceRecord.aliases,
    primarySourceId: input.item.sourceRecord.primarySourceId,
    disposition: "ready_for_canonical_comparison",
    acceptedLocationKey: input.item.sourceRecord.location.locationKey,
    acceptedPointFingerprint: input.item.sourceRecord.location.acceptedPointFingerprint,
    geographyEnrichmentStatus: "ready_for_profile_materialization",
    geographyProfileFingerprint,
    sourcePlanFingerprint: input.item.sourceRecord.sourcePlanFingerprint,
    sourceRecordFingerprint,
    donorRepository: input.item.sourceRecord.donorRepository,
    donorCommit: input.item.sourceRecord.donorCommit,
    preparedAt: reviewedAt,
  });
  const comparisonInput = {
    id: `${input.item.seedKey}:canonical-comparison`,
    candidate,
    canonicalSearchFingerprint: providerCanonicalSearchFingerprint(
      input.canonicalSearch,
    ),
    matches: input.canonicalSearch.matches,
    outcome: input.outcome,
    selectedOrganizationId: selected?.organizationId ?? null,
    rationale: input.outcome === "create-new-organization"
      ? "Current canonical Organization search was reviewed and no existing identity was selected."
      : "Current canonical Organization search was reviewed and the selected identity was confirmed.",
    reviewedByAdministratorId: input.reviewedByAdministratorId,
    authorityContextId: input.authorityContextId,
    reviewedAt,
  };
  const draft = createProviderCanonicalComparison({
    ...comparisonInput,
    comparisonFingerprint: "comparison-fingerprint-placeholder",
  });
  const comparison = createProviderCanonicalComparison({
    ...comparisonInput,
    comparisonFingerprint: providerCanonicalComparisonFingerprint(draft),
  });
  return Object.freeze({
    schemaVersion: 1,
    marketKey: "hampton-roads-va",
    status: "comparison-ready",
    productionWrites: false,
    approvalCreated: false,
    sourceRecord: input.item.sourceRecord,
    geography,
    candidate,
    canonicalSearch: input.canonicalSearch,
    comparison,
  });
}
