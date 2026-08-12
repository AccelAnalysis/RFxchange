import type {
  AmacsRegistryRecord,
  AmacsReleaseMetadata,
} from "../amacs/model.ts";
import type { GeographyBounds } from "../geography/model.ts";
import type {
  GeocodeProvenance,
  StructuredPostalAddress,
} from "../organization-location/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type RfxId = Brand<string, "RfxId">;
export const RFX_AGGREGATE_SCHEMA_VERSION = 1 as const;
export const RFX_CREATION_SOURCE_SCHEMA_VERSION = 1 as const;
export const RFX_PACKAGE_SCHEMA_VERSION = 1 as const;
export const RFX_AMACS_RELEASE_VERSION = "0.5.0" as const;
export const RFX_AMACS_SOURCE_COMMIT =
  "da7879f2609271b067ae6d02875e9388a02c4fe5" as const;

export interface RfxCreationSource {
  readonly kind: "blank";
  readonly schemaVersion: typeof RFX_CREATION_SOURCE_SCHEMA_VERSION;
}

export interface RequestFamilySnapshot {
  readonly amacsReleaseVersion: typeof RFX_AMACS_RELEASE_VERSION;
  readonly amacsSourceCommit: typeof RFX_AMACS_SOURCE_COMMIT;
  readonly requestFamilyId: string;
  readonly labelSnapshot: string;
  readonly purposeSnapshot: string;
  readonly lifecycleSnapshot: readonly string[];
  readonly defaultEndpointSnapshot: string;
  readonly supportsAwardSnapshot: boolean;
  readonly defaultResponseTemplateIdSnapshot: string;
  readonly defaultDecisionTemplateIdSnapshot: string;
  readonly defaultGovernanceProfileIdSnapshot: string;
  readonly allowedGovernanceProfileIdsSnapshot: readonly string[];
  readonly recommendedRequirementBundleIdsSnapshot: readonly string[];
  readonly selectedAt: string;
}

export type RfxPackageModuleState = "not-started" | "in-progress" | "complete";
export type RfxPackageModuleKey =
  | "need"
  | "scope-outputs"
  | "timing"
  | "performance-location"
  | "value-term"
  | "requirements";
export type RfxPackageModuleStatus = Readonly<
  Record<RfxPackageModuleKey, RfxPackageModuleState>
>;

export type SolutionPosture =
  | "solution-open"
  | "outcome-constrained"
  | "approach-constrained"
  | "specified-solution";

export interface MarketNeed {
  readonly sourceStatement: string;
  readonly observedCondition: string;
  readonly desiredOutcome: string;
  readonly affectedContext: string;
  readonly successMeasures: readonly string[];
  readonly knownFacts: readonly string[];
  readonly assumptions: readonly string[];
  readonly constraints: readonly string[];
  readonly solutionPosture: SolutionPosture;
  readonly proposedApproaches: readonly string[];
  readonly prohibitedApproaches: readonly string[];
  readonly unresolvedQuestions: readonly string[];
  readonly interpretationRecordIds: readonly string[];
}

export interface RfxQuantity {
  readonly amount: number;
  readonly unit: string;
}

export interface RequestedOutput {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly quantity: RfxQuantity | null;
  readonly dueDate: string | null;
}

export interface RfxTiming {
  readonly anticipatedStartDate: string | null;
  readonly anticipatedCompletionDate: string | null;
  readonly responseDeadline: string | null;
}

export interface RfxGeocodeProvenanceSnapshot {
  readonly provider: string;
  readonly providerReference: string;
  readonly benchmark: string;
  readonly retrievedAt: string;
}

export interface RfxGeographicPoint {
  readonly longitude: number;
  readonly latitude: number;
}

export type PerformanceLocationItem =
  | Readonly<{
      mode: "issuer-primary-location" | "organization-location";
      organizationLocationId: string;
      localityId: string;
      point: RfxGeographicPoint;
      geocodeProvenance: RfxGeocodeProvenanceSnapshot;
    }>
  | Readonly<{
      mode: "exact-address";
      normalizedAddress: string;
      localityId: string;
      point: RfxGeographicPoint;
      geocodeProvenance: RfxGeocodeProvenanceSnapshot;
    }>
  | Readonly<{
      mode: "locality";
      localityId: string;
      localityLabel: string;
      localityBounds: GeographyBounds;
    }>;

export type PerformanceLocation =
  | PerformanceLocationItem
  | Readonly<{
      mode: "multiple";
      locations: readonly PerformanceLocationItem[];
    }>;

export type EstimatedValue =
  | Readonly<{ mode: "exact"; currency: string; amountMinor: number }>
  | Readonly<{
      mode: "range";
      currency: string;
      minimumMinor: number;
      maximumMinor: number;
    }>
  | Readonly<{ mode: "not-disclosed" }>;

export interface StructuredDuration {
  readonly value: number;
  readonly unit: "days" | "weeks" | "months" | "years";
}

export type EngagementTerm =
  | Readonly<{
      mode: "fixed";
      duration: StructuredDuration;
      note: string | null;
    }>
  | Readonly<{
      mode: "fixed-with-options";
      baseDuration: StructuredDuration;
      optionCount: number;
      optionDuration: StructuredDuration;
      note: string | null;
    }>
  | Readonly<{
      mode: "ongoing";
      reviewPeriod: StructuredDuration | null;
      note: string | null;
    }>
  | Readonly<{
      mode: "milestone-based";
      expectedStart: string | null;
      expectedCompletion: string | null;
      note: string | null;
    }>;

export type RfxFoundationRequirementKind =
  | "deliverable"
  | "quantity"
  | "schedule"
  | "credential"
  | "insurance"
  | "evidence"
  | "other";

export interface RfxFoundationRequirement {
  readonly id: string;
  readonly kind: RfxFoundationRequirementKind;
  readonly title: string;
  readonly description: string;
  readonly mandatory: boolean;
  readonly quantity: RfxQuantity | null;
  readonly dueDate: string | null;
  readonly evidenceDescription: string | null;
}

export interface RfxPackage {
  readonly schemaVersion: typeof RFX_PACKAGE_SCHEMA_VERSION;
  readonly title: string;
  readonly marketNeed: MarketNeed;
  readonly scope: string;
  readonly requestedOutputs: readonly RequestedOutput[];
  readonly timing: RfxTiming;
  readonly performanceLocation: PerformanceLocation | null;
  readonly estimatedValue: EstimatedValue;
  readonly engagementTerm: EngagementTerm;
  readonly requirements: readonly RfxFoundationRequirement[];
  readonly moduleStatus: RfxPackageModuleStatus;
}

export type RfxSinglePerformanceLocationSelection =
  | Readonly<{
      mode:
        "issuer-primary-location" | "organization-location" | "exact-address";
      organizationLocationId: string;
    }>
  | Readonly<{ mode: "locality"; localityId: string }>;

export type RfxPerformanceLocationSelection =
  | RfxSinglePerformanceLocationSelection
  | Readonly<{
      mode: "multiple";
      locations: readonly RfxSinglePerformanceLocationSelection[];
    }>;

export interface RfxPackageInput {
  readonly title: unknown;
  readonly marketNeed: unknown;
  readonly scope: unknown;
  readonly requestedOutputs: unknown;
  readonly timing: unknown;
  readonly performanceLocation: RfxPerformanceLocationSelection | null;
  readonly estimatedValue: unknown;
  readonly engagementTerm: unknown;
  readonly requirements: unknown;
}

export interface RfxAggregate {
  readonly id: RfxId;
  readonly schemaVersion: typeof RFX_AGGREGATE_SCHEMA_VERSION;
  readonly issuerOrganizationId: OrganizationId;
  readonly lifecycleState: "draft";
  readonly version: number;
  readonly requestFamily: RequestFamilySnapshot;
  readonly package: RfxPackage | null;
  readonly creationSource: RfxCreationSource;
  readonly createdByUserId: UserId;
  readonly createdByMembershipId: OrganizationMembershipId;
  readonly updatedByUserId: UserId;
  readonly updatedByMembershipId: OrganizationMembershipId;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type RfxEventKind =
  "rfx-draft-created" | "rfx-request-family-changed" | "rfx-package-saved";

export interface RfxEvent {
  readonly id: string;
  readonly rfxId: RfxId;
  readonly issuerOrganizationId: OrganizationId;
  readonly kind: RfxEventKind;
  readonly aggregateVersion: number;
  readonly actorUserId: UserId;
  readonly actorMembershipId: OrganizationMembershipId;
  readonly commandId: string;
  readonly requestFamily: RequestFamilySnapshot;
  readonly priorRequestFamily: RequestFamilySnapshot | null;
  readonly package: RfxPackage | null;
  readonly priorPackage: RfxPackage | null;
  readonly occurredAt: string;
}

export interface RfxCommandReceipt {
  readonly id: string;
  readonly issuerOrganizationId: OrganizationId;
  readonly rfxId: RfxId;
  readonly action: "create-draft" | "change-request-family" | "save-package";
  readonly requestFingerprint: string;
  readonly resultingVersion: number;
  readonly recordedAt: string;
}

function required(value: unknown, label: string, maximum = 512): string {
  if (typeof value !== "string") throw new Error(`${label} is invalid.`);
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > maximum)
    throw new Error(`${label} is invalid.`);
  return normalized;
}

function stable(value: unknown, label: string): string {
  const normalized = required(value, label, 191);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new Error(`${label} is malformed.`);
  }
  return normalized;
}

function timestamp(value: string, label: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} is invalid.`);
  return new Date(parsed).toISOString();
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${label} is invalid.`);
  return value as Record<string, unknown>;
}

function optionalText(value: unknown, label: string, maximum = 2_000): string {
  if (value == null || value === "") return "";
  if (typeof value !== "string") throw new Error(`${label} is invalid.`);
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length > maximum) throw new Error(`${label} is invalid.`);
  return normalized;
}

function textArray(
  value: unknown,
  label: string,
  maximumItems = 24,
): readonly string[] {
  if (value == null) return Object.freeze([]);
  if (!Array.isArray(value) || value.length > maximumItems)
    throw new Error(`${label} is invalid.`);
  return Object.freeze(value.map((item) => required(item, label, 1_000)));
}

function nullableDate(value: unknown, label: string): string | null {
  if (value == null || value === "") return null;
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
  ) {
    throw new Error(`${label} is invalid.`);
  }
  return value;
}

function safeInteger(
  value: unknown,
  label: string,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < minimum ||
    (value as number) > maximum
  )
    throw new Error(`${label} is invalid.`);
  return value as number;
}

function quantity(value: unknown, label: string): RfxQuantity | null {
  if (value == null) return null;
  const source = record(value, label);
  const amount = typeof source.amount === "number" ? source.amount : Number.NaN;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000)
    throw new Error(`${label} amount is invalid.`);
  return Object.freeze({
    amount,
    unit: required(source.unit, `${label} unit`, 80),
  });
}

function duration(value: unknown, label: string): StructuredDuration {
  const source = record(value, label);
  const unit = source.unit;
  if (
    !(["days", "weeks", "months", "years"] as const).includes(
      unit as StructuredDuration["unit"],
    )
  )
    throw new Error(`${label} unit is invalid.`);
  return Object.freeze({
    value: safeInteger(source.value, `${label} value`, 1, 10_000),
    unit: unit as StructuredDuration["unit"],
  });
}

function normalizedAddress(address: StructuredPostalAddress): string {
  return [
    address.addressLine1,
    address.addressLine2,
    address.locality,
    address.regionCode,
    address.postalCode,
    address.countryCode,
  ]
    .filter(Boolean)
    .join(", ");
}

export function performanceLocationFromConfirmed(
  input: Readonly<{
    mode: "issuer-primary-location" | "organization-location" | "exact-address";
    organizationLocationId: string;
    geographyId: string;
    coordinate: readonly [number, number];
    physicalAddress: StructuredPostalAddress;
    provenance: GeocodeProvenance;
  }>,
): PerformanceLocationItem {
  const point = Object.freeze({
    longitude: input.coordinate[0],
    latitude: input.coordinate[1],
  });
  if (
    !Number.isFinite(point.longitude) ||
    point.longitude < -180 ||
    point.longitude > 180 ||
    !Number.isFinite(point.latitude) ||
    point.latitude < -90 ||
    point.latitude > 90
  )
    throw new Error("Performance location point is invalid.");
  const geocodeProvenance = Object.freeze({
    provider: required(input.provenance.provider, "Geocode provider"),
    providerReference: required(
      input.provenance.providerReference,
      "Geocode reference",
    ),
    benchmark: required(input.provenance.benchmark, "Geocode benchmark"),
    retrievedAt: timestamp(
      input.provenance.retrievedAt,
      "Geocode retrieval time",
    ),
  });
  return input.mode === "exact-address"
    ? Object.freeze({
        mode: input.mode,
        normalizedAddress: normalizedAddress(input.physicalAddress),
        localityId: input.geographyId,
        point,
        geocodeProvenance,
      })
    : Object.freeze({
        mode: input.mode,
        organizationLocationId: stable(
          input.organizationLocationId,
          "Organization location id",
        ),
        localityId: input.geographyId,
        point,
        geocodeProvenance,
      });
}

export function performanceLocationFromLocality(
  input: Readonly<{
    localityId: string;
    localityLabel: string;
    bounds: GeographyBounds;
  }>,
): PerformanceLocationItem {
  const { west, south, east, north } = input.bounds;
  if (
    ![west, south, east, north].every(Number.isFinite) ||
    west < -180 ||
    east > 180 ||
    south < -90 ||
    north > 90 ||
    west >= east ||
    south >= north
  )
    throw new Error("Performance locality bounds are invalid.");
  return Object.freeze({
    mode: "locality",
    localityId: input.localityId,
    localityLabel: required(input.localityLabel, "Locality label"),
    localityBounds: Object.freeze({ west, south, east, north }),
  });
}

function normalizeEstimatedValue(value: unknown): EstimatedValue {
  const source = record(value, "Estimated value");
  if (source.mode === "not-disclosed")
    return Object.freeze({ mode: "not-disclosed" });
  if (source.mode !== "exact" && source.mode !== "range")
    throw new Error("Estimated value mode is invalid.");
  const currency = required(source.currency, "Currency", 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Currency is invalid.");
  if (source.mode === "exact")
    return Object.freeze({
      mode: "exact",
      currency,
      amountMinor: safeInteger(source.amountMinor, "Estimated value"),
    });
  const minimumMinor = safeInteger(
    source.minimumMinor,
    "Estimated value minimum",
  );
  const maximumMinor = safeInteger(
    source.maximumMinor,
    "Estimated value maximum",
  );
  if (minimumMinor > maximumMinor)
    throw new Error("Estimated value range is invalid.");
  return Object.freeze({ mode: "range", currency, minimumMinor, maximumMinor });
}

function normalizeEngagementTerm(value: unknown): EngagementTerm {
  const source = record(value, "Engagement term");
  const note = optionalText(source.note, "Engagement term note", 1_000) || null;
  if (source.mode === "fixed")
    return Object.freeze({
      mode: "fixed",
      duration: duration(source.duration, "Engagement duration"),
      note,
    });
  if (source.mode === "fixed-with-options")
    return Object.freeze({
      mode: "fixed-with-options",
      baseDuration: duration(source.baseDuration, "Base duration"),
      optionCount: safeInteger(source.optionCount, "Option count", 1, 100),
      optionDuration: duration(source.optionDuration, "Option duration"),
      note,
    });
  if (source.mode === "ongoing")
    return Object.freeze({
      mode: "ongoing",
      reviewPeriod:
        source.reviewPeriod == null
          ? null
          : duration(source.reviewPeriod, "Review period"),
      note,
    });
  if (source.mode === "milestone-based")
    return Object.freeze({
      mode: "milestone-based",
      expectedStart: nullableDate(source.expectedStart, "Expected start"),
      expectedCompletion: nullableDate(
        source.expectedCompletion,
        "Expected completion",
      ),
      note,
    });
  throw new Error("Engagement term mode is invalid.");
}

function moduleState(
  values: readonly unknown[],
  complete: boolean,
): RfxPackageModuleState {
  if (complete) return "complete";
  return values.some((value) =>
    Array.isArray(value) ? value.length > 0 : value != null && value !== "",
  )
    ? "in-progress"
    : "not-started";
}

export function normalizeRfxPackage(
  input: Omit<RfxPackageInput, "performanceLocation"> &
    Readonly<{ performanceLocation: PerformanceLocation | null }>,
): RfxPackage {
  const need = record(input.marketNeed, "Market need");
  const posture = need.solutionPosture;
  if (
    !(
      [
        "solution-open",
        "outcome-constrained",
        "approach-constrained",
        "specified-solution",
      ] as const
    ).includes(posture as SolutionPosture)
  )
    throw new Error("Solution posture is invalid.");
  const marketNeed: MarketNeed = Object.freeze({
    sourceStatement: optionalText(
      need.sourceStatement,
      "Source statement",
      4_000,
    ),
    observedCondition: optionalText(
      need.observedCondition,
      "Observed condition",
      4_000,
    ),
    desiredOutcome: optionalText(need.desiredOutcome, "Desired outcome", 4_000),
    affectedContext: optionalText(
      need.affectedContext,
      "Affected context",
      2_000,
    ),
    successMeasures: textArray(need.successMeasures, "Success measure"),
    knownFacts: textArray(need.knownFacts, "Known fact"),
    assumptions: textArray(need.assumptions, "Assumption"),
    constraints: textArray(need.constraints, "Constraint"),
    solutionPosture: posture as SolutionPosture,
    proposedApproaches: textArray(need.proposedApproaches, "Proposed approach"),
    prohibitedApproaches: textArray(
      need.prohibitedApproaches,
      "Prohibited approach",
    ),
    unresolvedQuestions: textArray(
      need.unresolvedQuestions,
      "Unresolved question",
    ),
    interpretationRecordIds: Object.freeze(
      textArray(need.interpretationRecordIds, "Interpretation record", 12).map(
        (id) => stable(id, "Interpretation record"),
      ),
    ),
  });
  if (
    Array.isArray(input.requestedOutputs) &&
    input.requestedOutputs.length > 50
  )
    throw new Error("Requested outputs are invalid.");
  const requestedOutputs = !Array.isArray(input.requestedOutputs)
    ? (() => {
        throw new Error("Requested outputs are invalid.");
      })()
    : Object.freeze(
        input.requestedOutputs.map((item) => {
          const output = record(item, "Requested output");
          return Object.freeze({
            id: stable(String(output.id ?? ""), "Requested output id"),
            title: required(output.title, "Requested output title", 300),
            description: optionalText(
              output.description,
              "Requested output description",
              2_000,
            ),
            quantity: quantity(output.quantity, "Requested output quantity"),
            dueDate: nullableDate(output.dueDate, "Requested output due date"),
          });
        }),
      );
  const timingSource = record(input.timing, "Timing");
  const timing = Object.freeze({
    anticipatedStartDate: nullableDate(
      timingSource.anticipatedStartDate,
      "Anticipated start date",
    ),
    anticipatedCompletionDate: nullableDate(
      timingSource.anticipatedCompletionDate,
      "Anticipated completion date",
    ),
    responseDeadline: nullableDate(
      timingSource.responseDeadline,
      "Response deadline",
    ),
  });
  if (
    timing.anticipatedStartDate &&
    timing.anticipatedCompletionDate &&
    timing.anticipatedStartDate > timing.anticipatedCompletionDate
  )
    throw new Error("Timing range is invalid.");
  if (Array.isArray(input.requirements) && input.requirements.length > 100)
    throw new Error("Requirements are invalid.");
  const requirements = !Array.isArray(input.requirements)
    ? (() => {
        throw new Error("Requirements are invalid.");
      })()
    : Object.freeze(
        input.requirements.map((item) => {
          const requirement = record(item, "Requirement");
          const kind = requirement.kind;
          if (
            !(
              [
                "deliverable",
                "quantity",
                "schedule",
                "credential",
                "insurance",
                "evidence",
                "other",
              ] as const
            ).includes(kind as RfxFoundationRequirementKind)
          )
            throw new Error("Requirement kind is invalid.");
          return Object.freeze({
            id: stable(String(requirement.id ?? ""), "Requirement id"),
            kind: kind as RfxFoundationRequirementKind,
            title: required(requirement.title, "Requirement title", 300),
            description: optionalText(
              requirement.description,
              "Requirement description",
              2_000,
            ),
            mandatory: requirement.mandatory === true,
            quantity: quantity(requirement.quantity, "Requirement quantity"),
            dueDate: nullableDate(requirement.dueDate, "Requirement due date"),
            evidenceDescription:
              optionalText(
                requirement.evidenceDescription,
                "Requirement evidence",
                1_000,
              ) || null,
          });
        }),
      );
  const title = optionalText(input.title, "RFx title", 300);
  const scope = optionalText(input.scope, "Scope", 8_000);
  const estimatedValue = normalizeEstimatedValue(input.estimatedValue);
  const engagementTerm = normalizeEngagementTerm(input.engagementTerm);
  const moduleStatus: RfxPackageModuleStatus = Object.freeze({
    need: moduleState(
      [
        marketNeed.sourceStatement,
        marketNeed.observedCondition,
        marketNeed.desiredOutcome,
        marketNeed.affectedContext,
      ],
      Boolean(
        title &&
        marketNeed.sourceStatement &&
        marketNeed.observedCondition &&
        marketNeed.desiredOutcome &&
        marketNeed.affectedContext,
      ),
    ),
    "scope-outputs": moduleState(
      [scope, requestedOutputs],
      Boolean(scope && requestedOutputs.length),
    ),
    timing: moduleState(
      Object.values(timing),
      Boolean(
        timing.anticipatedStartDate ||
        timing.anticipatedCompletionDate ||
        timing.responseDeadline,
      ),
    ),
    "performance-location": moduleState(
      [input.performanceLocation],
      input.performanceLocation !== null,
    ),
    "value-term": "complete",
    requirements: moduleState([requirements], requirements.length > 0),
  });
  return Object.freeze({
    schemaVersion: RFX_PACKAGE_SCHEMA_VERSION,
    title,
    marketNeed,
    scope,
    requestedOutputs,
    timing,
    performanceLocation: input.performanceLocation,
    estimatedValue,
    engagementTerm,
    requirements,
    moduleStatus,
  });
}

export function saveRfxPackage(
  input: Readonly<{
    aggregate: RfxAggregate;
    expectedVersion: number;
    package: RfxPackage;
    actorUserId: UserId;
    actorMembershipId: OrganizationMembershipId;
    now: string;
  }>,
): RfxAggregate {
  if (input.aggregate.lifecycleState !== "draft")
    throw new Error("Only a draft RFx can be edited.");
  if (
    !Number.isInteger(input.expectedVersion) ||
    input.expectedVersion !== input.aggregate.version
  )
    throw new Error(
      `RFx changed; current version is ${input.aggregate.version}.`,
    );
  return Object.freeze({
    ...input.aggregate,
    package: input.package,
    version: input.aggregate.version + 1,
    updatedByUserId: input.actorUserId,
    updatedByMembershipId: input.actorMembershipId,
    updatedAt: timestamp(input.now, "RFx update time"),
  });
}

function stringList(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.length === 0)
    throw new Error(`${label} is invalid.`);
  return Object.freeze(value.map((item) => stable(item, label)));
}

export function rfxId(value: string): RfxId {
  return stable(value, "RFx id") as RfxId;
}

export function requestFamilySnapshotFromAmacs(
  input: Readonly<{
    release: AmacsReleaseMetadata;
    record: AmacsRegistryRecord;
    selectedAt: string;
  }>,
): RequestFamilySnapshot {
  if (
    input.release.version !== RFX_AMACS_RELEASE_VERSION ||
    input.release.sourceCommit !== RFX_AMACS_SOURCE_COMMIT
  ) {
    throw new Error("The governed AMACS release is unavailable.");
  }
  if (input.record.status !== "active") {
    throw new Error("The selected request type is unavailable.");
  }
  if (typeof input.record.supports_award !== "boolean") {
    throw new Error("The selected request type is malformed.");
  }
  return Object.freeze({
    amacsReleaseVersion: RFX_AMACS_RELEASE_VERSION,
    amacsSourceCommit: RFX_AMACS_SOURCE_COMMIT,
    requestFamilyId: stable(
      input.record.request_family_id,
      "Request family id",
    ),
    labelSnapshot: required(
      input.record.preferred_label,
      "Request family label",
    ),
    purposeSnapshot: required(
      input.record.purpose,
      "Request family purpose",
      1_200,
    ),
    lifecycleSnapshot: stringList(
      input.record.lifecycle,
      "Request family lifecycle",
    ),
    defaultEndpointSnapshot: stable(
      input.record.default_endpoint,
      "Default endpoint",
    ),
    supportsAwardSnapshot: input.record.supports_award,
    defaultResponseTemplateIdSnapshot: stable(
      input.record.default_response_template_id,
      "Response template id",
    ),
    defaultDecisionTemplateIdSnapshot: stable(
      input.record.default_decision_template_id,
      "Decision template id",
    ),
    defaultGovernanceProfileIdSnapshot: stable(
      input.record.default_governance_profile_id,
      "Governance profile id",
    ),
    allowedGovernanceProfileIdsSnapshot: stringList(
      input.record.allowed_governance_profile_ids,
      "Allowed governance profile id",
    ),
    recommendedRequirementBundleIdsSnapshot: stringList(
      input.record.recommended_requirement_bundle_ids,
      "Requirement bundle id",
    ),
    selectedAt: timestamp(input.selectedAt, "Request family selection time"),
  });
}

export function createRfxDraft(
  input: Readonly<{
    id: string;
    issuerOrganizationId: OrganizationId;
    requestFamily: RequestFamilySnapshot;
    actorUserId: UserId;
    actorMembershipId: OrganizationMembershipId;
    now: string;
  }>,
): RfxAggregate {
  const now = timestamp(input.now, "RFx creation time");
  return Object.freeze({
    id: rfxId(input.id),
    schemaVersion: RFX_AGGREGATE_SCHEMA_VERSION,
    issuerOrganizationId: input.issuerOrganizationId,
    lifecycleState: "draft",
    version: 1,
    requestFamily: input.requestFamily,
    package: null,
    creationSource: Object.freeze({
      kind: "blank",
      schemaVersion: RFX_CREATION_SOURCE_SCHEMA_VERSION,
    }),
    createdByUserId: input.actorUserId,
    createdByMembershipId: input.actorMembershipId,
    updatedByUserId: input.actorUserId,
    updatedByMembershipId: input.actorMembershipId,
    createdAt: now,
    updatedAt: now,
  });
}

export function changeRfxRequestFamily(
  input: Readonly<{
    aggregate: RfxAggregate;
    expectedVersion: number;
    requestFamily: RequestFamilySnapshot;
    actorUserId: UserId;
    actorMembershipId: OrganizationMembershipId;
    now: string;
  }>,
): RfxAggregate {
  if (input.aggregate.lifecycleState !== "draft")
    throw new Error("Only a draft RFx can change request type.");
  if (
    !Number.isInteger(input.expectedVersion) ||
    input.expectedVersion !== input.aggregate.version
  ) {
    throw new Error(
      `RFx changed; current version is ${input.aggregate.version}.`,
    );
  }
  if (
    input.requestFamily.requestFamilyId ===
    input.aggregate.requestFamily.requestFamilyId
  ) {
    throw new Error("Choose a different request type.");
  }
  return Object.freeze({
    ...input.aggregate,
    package: input.aggregate.package ?? null,
    version: input.aggregate.version + 1,
    requestFamily: input.requestFamily,
    updatedByUserId: input.actorUserId,
    updatedByMembershipId: input.actorMembershipId,
    updatedAt: timestamp(input.now, "RFx update time"),
  });
}
