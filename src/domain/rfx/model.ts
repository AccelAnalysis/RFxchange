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
export const RFX_DEFINITION_SCHEMA_VERSION = 1 as const;
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

export type RfxDefinitionModuleState = "not-started" | "in-progress" | "complete";
export type RfxDefinitionModuleStatus = Readonly<{
  requirements: RfxDefinitionModuleState;
  responseStructure: RfxDefinitionModuleState;
  evaluationDefinition: RfxDefinitionModuleState;
}>;

export interface AmacsDefinitionSnapshot {
  readonly kind:
    | "requirement-type"
    | "capability"
    | "response-template"
    | "response-section"
    | "decision-template"
    | "decision-factor";
  readonly id: string;
  readonly labelSnapshot: string;
  readonly definitionSnapshot: string;
  readonly amacsReleaseVersion: typeof RFX_AMACS_RELEASE_VERSION;
  readonly amacsSourceCommit: typeof RFX_AMACS_SOURCE_COMMIT;
}

export type RfxRequirementLevel = "required" | "preferred" | "informational";
export type RfxDecisionTreatment =
  | "gate_only"
  | "scored_only"
  | "gate_and_scored_depth"
  | "informational_only";
export type RfxSatisfyingParty =
  | "lead-organization"
  | "any-accepted-team-member"
  | "combined-response-team";

export type RfxRequirementQualifier =
  | Readonly<{ kind: "text"; label: string; value: string }>
  | Readonly<{
      kind: "quantity";
      label: string;
      amount: number;
      unit: string;
    }>
  | Readonly<{ kind: "boolean"; label: string; requiredValue: boolean }>
  | Readonly<{
      kind: "geography";
      label: string;
      localityIds: readonly string[];
    }>;

export interface RfxRequirementDefinition {
  readonly id: string;
  readonly requirementType: AmacsDefinitionSnapshot;
  readonly requirementTypeCode: string;
  readonly allowedDecisionTreatments: readonly RfxDecisionTreatment[];
  readonly teamCoverageAllowed: boolean;
  readonly capability: AmacsDefinitionSnapshot | null;
  readonly capabilityBreadcrumb: string | null;
  readonly title: string;
  readonly description: string;
  readonly level: RfxRequirementLevel;
  readonly decisionTreatment: RfxDecisionTreatment;
  readonly satisfyingParty: RfxSatisfyingParty;
  readonly qualifiers: readonly RfxRequirementQualifier[];
  readonly evidenceRequirementIds: readonly string[];
  readonly linkedFoundationRequirementIds: readonly string[];
  readonly linkedResponseSectionIds: readonly string[];
  readonly linkedEvaluationFactorIds: readonly string[];
}

export type RfxResponseSectionFormat =
  | "narrative"
  | "structured-answer"
  | "attachment"
  | "pricing"
  | "acknowledgment";

export interface RfxResponseSectionDefinition {
  readonly id: string;
  readonly sourceSection: AmacsDefinitionSnapshot | null;
  readonly title: string;
  readonly instructions: string;
  readonly format: RfxResponseSectionFormat;
  readonly required: boolean;
  readonly order: number;
  readonly characterLimit: number | null;
  readonly itemLimit: number | null;
  readonly attachmentsAllowed: boolean;
  readonly linkedRequirementIds: readonly string[];
}

export interface RfxResponseStructure {
  readonly sourceTemplate: AmacsDefinitionSnapshot | null;
  readonly sections: readonly RfxResponseSectionDefinition[];
}

export type RfxEvaluationFactorTreatment =
  | "required-condition"
  | "scored-factor"
  | "required-and-scored"
  | "informational-only";

export interface RfxEvaluationFactor {
  readonly id: string;
  readonly sourceFactor: AmacsDefinitionSnapshot | null;
  readonly sourceMethod: "gate" | "scored" | "narrative" | "formula" | null;
  readonly title: string;
  readonly description: string;
  readonly treatment: RfxEvaluationFactorTreatment;
  readonly weightBasisPoints: number | null;
  readonly order: number;
  readonly linkedRequirementIds: readonly string[];
  readonly linkedResponseSectionIds: readonly string[];
  readonly linkedEvidenceRequirementIds: readonly string[];
}

export interface RfxEvaluationDefinition {
  readonly sourceTemplate: AmacsDefinitionSnapshot | null;
  readonly weightingRequired: boolean;
  readonly factors: readonly RfxEvaluationFactor[];
}

export interface RfxDefinition {
  readonly schemaVersion: typeof RFX_DEFINITION_SCHEMA_VERSION;
  readonly requirements: readonly RfxRequirementDefinition[];
  readonly responseStructure: RfxResponseStructure;
  readonly evaluationDefinition: RfxEvaluationDefinition;
  readonly interpretationRecordIds: readonly string[];
  readonly moduleStatus: RfxDefinitionModuleStatus;
}

export interface RfxDefinitionInput {
  readonly requirements: unknown;
  readonly responseStructure: unknown;
  readonly evaluationDefinition: unknown;
  readonly interpretationRecordIds: unknown;
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
  readonly lifecycleState: "draft" | "published";
  readonly version: number;
  readonly requestFamily: RequestFamilySnapshot;
  readonly package: RfxPackage | null;
  readonly definition: RfxDefinition | null;
  readonly creationSource: RfxCreationSource;
  readonly createdByUserId: UserId;
  readonly createdByMembershipId: OrganizationMembershipId;
  readonly updatedByUserId: UserId;
  readonly updatedByMembershipId: OrganizationMembershipId;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type RfxEventKind =
  | "rfx-draft-created"
  | "rfx-request-family-changed"
  | "rfx-package-saved"
  | "rfx-definition-saved"
  | "rfx-published";

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
  readonly definition: RfxDefinition | null;
  readonly priorDefinition: RfxDefinition | null;
  readonly occurredAt: string;
}

export interface RfxCommandReceipt {
  readonly id: string;
  readonly issuerOrganizationId: OrganizationId;
  readonly rfxId: RfxId;
  readonly action:
    | "create-draft"
    | "change-request-family"
    | "save-package"
    | "save-definition"
    | "publish";
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

function uniqueStableList(
  value: unknown,
  label: string,
  maximumItems = 100,
): readonly string[] {
  if (value == null) return Object.freeze([]);
  if (!Array.isArray(value) || value.length > maximumItems)
    throw new Error(`${label} is invalid.`);
  const normalized = value.map((item) => stable(item, label));
  if (new Set(normalized).size !== normalized.length)
    throw new Error(`${label} contains duplicates.`);
  return Object.freeze(normalized);
}

function nullableSafeInteger(
  value: unknown,
  label: string,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER,
): number | null {
  if (value == null || value === "") return null;
  return safeInteger(value, label, minimum, maximum);
}

function definitionSnapshot(
  value: unknown,
  kind: AmacsDefinitionSnapshot["kind"],
  label: string,
): AmacsDefinitionSnapshot {
  const source = record(value, label);
  if (
    source.kind !== kind ||
    source.amacsReleaseVersion !== RFX_AMACS_RELEASE_VERSION ||
    source.amacsSourceCommit !== RFX_AMACS_SOURCE_COMMIT
  )
    throw new Error(`${label} provenance is invalid.`);
  return Object.freeze({
    kind,
    id: stable(source.id, `${label} id`),
    labelSnapshot: required(source.labelSnapshot, `${label} label`, 300),
    definitionSnapshot: required(
      source.definitionSnapshot,
      `${label} definition`,
      2_000,
    ),
    amacsReleaseVersion: RFX_AMACS_RELEASE_VERSION,
    amacsSourceCommit: RFX_AMACS_SOURCE_COMMIT,
  });
}

function optionalDefinitionSnapshot(
  value: unknown,
  kind: AmacsDefinitionSnapshot["kind"],
  label: string,
): AmacsDefinitionSnapshot | null {
  return value == null ? null : definitionSnapshot(value, kind, label);
}

function requirementQualifier(
  value: unknown,
  index: number,
): RfxRequirementQualifier {
  const source = record(value, `Requirement qualifier ${index + 1}`);
  const label = required(
    source.label,
    `Requirement qualifier ${index + 1} label`,
    160,
  );
  if (source.kind === "text")
    return Object.freeze({
      kind: "text",
      label,
      value: required(
        source.value,
        `Requirement qualifier ${index + 1} value`,
        1_000,
      ),
    });
  if (source.kind === "quantity") {
    const amount = typeof source.amount === "number" ? source.amount : Number.NaN;
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000)
      throw new Error(`Requirement qualifier ${index + 1} amount is invalid.`);
    return Object.freeze({
      kind: "quantity",
      label,
      amount,
      unit: required(
        source.unit,
        `Requirement qualifier ${index + 1} unit`,
        80,
      ),
    });
  }
  if (source.kind === "boolean") {
    if (typeof source.requiredValue !== "boolean")
      throw new Error(`Requirement qualifier ${index + 1} value is invalid.`);
    return Object.freeze({
      kind: "boolean",
      label,
      requiredValue: source.requiredValue,
    });
  }
  if (source.kind === "geography")
    return Object.freeze({
      kind: "geography",
      label,
      localityIds: uniqueStableList(
        source.localityIds,
        `Requirement qualifier ${index + 1} locality`,
        16,
      ),
    });
  throw new Error(`Requirement qualifier ${index + 1} kind is invalid.`);
}

function definitionModuleState(
  count: number,
  complete: boolean,
): RfxDefinitionModuleState {
  if (complete) return "complete";
  return count > 0 ? "in-progress" : "not-started";
}

export function normalizeRfxDefinition(
  input: RfxDefinitionInput,
  foundationRequirementIds: readonly string[],
): RfxDefinition {
  if (!Array.isArray(input.requirements) || input.requirements.length > 100)
    throw new Error("RFx requirements are invalid.");
  const foundationIds = new Set(foundationRequirementIds);
  const baseRequirements = input.requirements.map((item, index) => {
    const source = record(item, `RFx requirement ${index + 1}`);
    const requirementType = definitionSnapshot(
      source.requirementType,
      "requirement-type",
      `RFx requirement ${index + 1} type`,
    );
    const requirementTypeCode = required(
      source.requirementTypeCode,
      `RFx requirement ${index + 1} type code`,
      80,
    ).toUpperCase();
    const allowedDecisionTreatments = uniqueStableList(
      source.allowedDecisionTreatments,
      `RFx requirement ${index + 1} allowed treatment`,
      4,
    ) as readonly RfxDecisionTreatment[];
    const decisionTreatment = source.decisionTreatment as RfxDecisionTreatment;
    if (
      !(
        [
          "gate_only",
          "scored_only",
          "gate_and_scored_depth",
          "informational_only",
        ] as const
      ).includes(decisionTreatment) ||
      !allowedDecisionTreatments.includes(decisionTreatment)
    )
      throw new Error(`RFx requirement ${index + 1} treatment is invalid.`);
    const level = source.level as RfxRequirementLevel;
    if (!("required preferred informational".split(" ") as string[]).includes(level))
      throw new Error(`RFx requirement ${index + 1} level is invalid.`);
    const satisfyingParty = source.satisfyingParty as RfxSatisfyingParty;
    if (
      !(
        [
          "lead-organization",
          "any-accepted-team-member",
          "combined-response-team",
        ] as const
      ).includes(satisfyingParty)
    )
      throw new Error(`RFx requirement ${index + 1} satisfying party is invalid.`);
    const teamCoverageAllowed = source.teamCoverageAllowed === true;
    if (satisfyingParty !== "lead-organization" && !teamCoverageAllowed)
      throw new Error(`RFx requirement ${index + 1} requires the lead organization.`);
    const capability = optionalDefinitionSnapshot(
      source.capability,
      "capability",
      `RFx requirement ${index + 1} capability`,
    );
    if ((requirementTypeCode === "CAPABILITY") !== Boolean(capability))
      throw new Error(`RFx requirement ${index + 1} capability is invalid.`);
    if (!Array.isArray(source.qualifiers) || source.qualifiers.length > 24)
      throw new Error(`RFx requirement ${index + 1} qualifiers are invalid.`);
    const linkedFoundationRequirementIds = uniqueStableList(
      source.linkedFoundationRequirementIds,
      `RFx requirement ${index + 1} foundation link`,
      20,
    );
    if (linkedFoundationRequirementIds.some((id) => !foundationIds.has(id)))
      throw new Error(`RFx requirement ${index + 1} foundation link is unavailable.`);
    return Object.freeze({
      id: stable(source.id, `RFx requirement ${index + 1} id`),
      requirementType,
      requirementTypeCode,
      allowedDecisionTreatments,
      teamCoverageAllowed,
      capability,
      capabilityBreadcrumb:
        optionalText(
          source.capabilityBreadcrumb,
          `RFx requirement ${index + 1} capability breadcrumb`,
          500,
        ) || null,
      title: required(source.title, `RFx requirement ${index + 1} title`, 300),
      description: optionalText(
        source.description,
        `RFx requirement ${index + 1} description`,
        2_000,
      ),
      level,
      decisionTreatment,
      satisfyingParty,
      qualifiers: Object.freeze(
        source.qualifiers.map((qualifier, qualifierIndex) =>
          requirementQualifier(qualifier, qualifierIndex),
        ),
      ),
      evidenceRequirementIds: uniqueStableList(
        source.evidenceRequirementIds,
        `RFx requirement ${index + 1} evidence link`,
        20,
      ),
      linkedFoundationRequirementIds,
    });
  });
  const requirementIds = baseRequirements.map((item) => item.id);
  if (new Set(requirementIds).size !== requirementIds.length)
    throw new Error("RFx requirement identities must be unique.");
  const requirementById = new Map(baseRequirements.map((item) => [item.id, item]));
  for (const requirement of baseRequirements) {
    for (const evidenceId of requirement.evidenceRequirementIds) {
      const evidence = requirementById.get(evidenceId);
      if (!evidence || evidence.requirementTypeCode !== "EVIDENCE" || evidenceId === requirement.id)
        throw new Error(`Evidence link for ${requirement.id} is invalid.`);
    }
  }

  const responseSource = record(input.responseStructure, "Response structure");
  const sourceTemplate = optionalDefinitionSnapshot(
    responseSource.sourceTemplate,
    "response-template",
    "Response template",
  );
  if (!Array.isArray(responseSource.sections) || responseSource.sections.length > 50)
    throw new Error("Response sections are invalid.");
  const sections = Object.freeze(
    responseSource.sections.map((item, index) => {
      const source = record(item, `Response section ${index + 1}`);
      const format = source.format as RfxResponseSectionFormat;
      if (
        !(
          [
            "narrative",
            "structured-answer",
            "attachment",
            "pricing",
            "acknowledgment",
          ] as const
        ).includes(format)
      )
        throw new Error(`Response section ${index + 1} format is invalid.`);
      const linkedRequirementIds = uniqueStableList(
        source.linkedRequirementIds,
        `Response section ${index + 1} requirement link`,
        100,
      );
      if (linkedRequirementIds.some((id) => !requirementById.has(id)))
        throw new Error(`Response section ${index + 1} has an unavailable requirement link.`);
      return Object.freeze({
        id: stable(source.id, `Response section ${index + 1} id`),
        sourceSection: optionalDefinitionSnapshot(
          source.sourceSection,
          "response-section",
          `Response section ${index + 1} source`,
        ),
        title: required(source.title, `Response section ${index + 1} title`, 300),
        instructions: optionalText(
          source.instructions,
          `Response section ${index + 1} instructions`,
          4_000,
        ),
        format,
        required: source.required === true,
        order: index,
        characterLimit: nullableSafeInteger(
          source.characterLimit,
          `Response section ${index + 1} character limit`,
          1,
          1_000_000,
        ),
        itemLimit: nullableSafeInteger(
          source.itemLimit,
          `Response section ${index + 1} item limit`,
          1,
          10_000,
        ),
        attachmentsAllowed: source.attachmentsAllowed === true,
        linkedRequirementIds,
      });
    }),
  );
  if (new Set(sections.map((item) => item.id)).size !== sections.length)
    throw new Error("Response section identities must be unique.");
  const sectionById = new Map(sections.map((item) => [item.id, item]));

  const evaluationSource = record(
    input.evaluationDefinition,
    "Evaluation definition",
  );
  const evaluationTemplate = optionalDefinitionSnapshot(
    evaluationSource.sourceTemplate,
    "decision-template",
    "Decision template",
  );
  const weightingRequired = evaluationSource.weightingRequired === true;
  if (!Array.isArray(evaluationSource.factors) || evaluationSource.factors.length > 50)
    throw new Error("Evaluation factors are invalid.");
  const factors = Object.freeze(
    evaluationSource.factors.map((item, index) => {
      const source = record(item, `Evaluation factor ${index + 1}`);
      const treatment = source.treatment as RfxEvaluationFactorTreatment;
      if (
        !(
          [
            "required-condition",
            "scored-factor",
            "required-and-scored",
            "informational-only",
          ] as const
        ).includes(treatment)
      )
        throw new Error(`Evaluation factor ${index + 1} treatment is invalid.`);
      const sourceMethod = source.sourceMethod as RfxEvaluationFactor["sourceMethod"];
      if (
        sourceMethod !== null &&
        !("gate scored narrative formula".split(" ") as string[]).includes(sourceMethod)
      )
        throw new Error(`Evaluation factor ${index + 1} source method is invalid.`);
      if (
        (sourceMethod === "gate" && treatment !== "required-condition") ||
        (sourceMethod === "scored" &&
          treatment !== "scored-factor" &&
          treatment !== "required-and-scored") ||
        (sourceMethod === "narrative" && treatment !== "informational-only")
      )
        throw new Error(`Evaluation factor ${index + 1} treatment conflicts with AMACS.`);
      const scored = treatment === "scored-factor" || treatment === "required-and-scored";
      const weightBasisPoints = nullableSafeInteger(
        source.weightBasisPoints,
        `Evaluation factor ${index + 1} weight`,
        0,
        10_000,
      );
      if ((!scored && weightBasisPoints !== null) || (scored && weightingRequired && weightBasisPoints === null))
        throw new Error(`Evaluation factor ${index + 1} weight is invalid.`);
      const linkedRequirementIds = uniqueStableList(
        source.linkedRequirementIds,
        `Evaluation factor ${index + 1} requirement link`,
        100,
      );
      const linkedResponseSectionIds = uniqueStableList(
        source.linkedResponseSectionIds,
        `Evaluation factor ${index + 1} response link`,
        50,
      );
      const linkedEvidenceRequirementIds = uniqueStableList(
        source.linkedEvidenceRequirementIds,
        `Evaluation factor ${index + 1} evidence link`,
        50,
      );
      if (
        linkedRequirementIds.some((id) => !requirementById.has(id)) ||
        linkedResponseSectionIds.some((id) => !sectionById.has(id)) ||
        linkedEvidenceRequirementIds.some(
          (id) => requirementById.get(id)?.requirementTypeCode !== "EVIDENCE",
        )
      )
        throw new Error(`Evaluation factor ${index + 1} has an unavailable link.`);
      return Object.freeze({
        id: stable(source.id, `Evaluation factor ${index + 1} id`),
        sourceFactor: optionalDefinitionSnapshot(
          source.sourceFactor,
          "decision-factor",
          `Evaluation factor ${index + 1} source`,
        ),
        sourceMethod,
        title: required(source.title, `Evaluation factor ${index + 1} title`, 300),
        description: optionalText(
          source.description,
          `Evaluation factor ${index + 1} description`,
          2_000,
        ),
        treatment,
        weightBasisPoints,
        order: index,
        linkedRequirementIds,
        linkedResponseSectionIds,
        linkedEvidenceRequirementIds,
      });
    }),
  );
  if (new Set(factors.map((item) => item.id)).size !== factors.length)
    throw new Error("Evaluation factor identities must be unique.");

  const requirements = Object.freeze(
    baseRequirements.map((requirement) =>
      Object.freeze({
        ...requirement,
        linkedResponseSectionIds: Object.freeze(
          sections
            .filter((section) => section.linkedRequirementIds.includes(requirement.id))
            .map((section) => section.id),
        ),
        linkedEvaluationFactorIds: Object.freeze(
          factors
            .filter((factor) => factor.linkedRequirementIds.includes(requirement.id))
            .map((factor) => factor.id),
        ),
      }),
    ),
  );
  const requiredRequirements = requirements.filter((item) => item.level === "required");
  const requiredDecisionLinksComplete = requiredRequirements.every((item) => {
    const linked = factors.filter((factor) =>
      factor.linkedRequirementIds.includes(item.id),
    );
    if (
      item.decisionTreatment === "gate_only" ||
      item.decisionTreatment === "gate_and_scored_depth"
    )
      return linked.some(
        (factor) =>
          factor.treatment === "required-condition" ||
          factor.treatment === "required-and-scored",
      );
    if (item.decisionTreatment === "scored_only")
      return linked.some(
        (factor) =>
          factor.treatment === "scored-factor" ||
          factor.treatment === "required-and-scored",
      );
    return linked.length > 0;
  });
  const responseComplete =
    sections.length > 0 &&
    requiredRequirements.every(
      (item) => item.linkedResponseSectionIds.length > 0 || item.evidenceRequirementIds.length > 0,
    );
  const scoredWeightTotal = factors.reduce(
    (total, factor) => total + (factor.weightBasisPoints ?? 0),
    0,
  );
  const evaluationComplete =
    factors.length > 0 &&
    requiredDecisionLinksComplete &&
    (!weightingRequired || scoredWeightTotal === 10_000);
  return Object.freeze({
    schemaVersion: RFX_DEFINITION_SCHEMA_VERSION,
    requirements,
    responseStructure: Object.freeze({ sourceTemplate, sections }),
    evaluationDefinition: Object.freeze({
      sourceTemplate: evaluationTemplate,
      weightingRequired,
      factors,
    }),
    interpretationRecordIds: uniqueStableList(
      input.interpretationRecordIds,
      "Definition interpretation record",
      12,
    ),
    moduleStatus: Object.freeze({
      requirements: definitionModuleState(
        requirements.length,
        requirements.length > 0,
      ),
      responseStructure: definitionModuleState(sections.length, responseComplete),
      evaluationDefinition: definitionModuleState(factors.length, evaluationComplete),
    }),
  });
}

export function saveRfxDefinition(
  input: Readonly<{
    aggregate: RfxAggregate;
    expectedVersion: number;
    definition: RfxDefinition;
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
    throw new Error(`RFx changed; current version is ${input.aggregate.version}.`);
  return Object.freeze({
    ...input.aggregate,
    definition: input.definition,
    version: input.aggregate.version + 1,
    updatedByUserId: input.actorUserId,
    updatedByMembershipId: input.actorMembershipId,
    updatedAt: timestamp(input.now, "RFx update time"),
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
    definition: null,
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
