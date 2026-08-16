import { createHash } from "node:crypto";

import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { OrganizationCapabilityClaim } from "../market-profile/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";
import type { EngagementTerm, EstimatedValue } from "./model.ts";
import type { ResponderOpportunityProjection, RfxPublicationSnapshot } from "./publication.ts";

export const OPPORTUNITY_FIT_POLICY_VERSION = 1 as const;

export type OpportunityAttribution = "discovered" | "potential-match" | "invited";
export type RequirementFitState = "aligned" | "missing" | "unconfirmed" | "not-applicable";
export type GeographyFitState = "aligned" | "outside-confirmed-area" | "needs-confirmation" | "not-applicable";
export type PursuitDecision = "watch" | "pursue" | "decline";
export type PursuitAssessmentState = "not-reviewed" | "acceptable" | "concern" | "blocking" | "needs-confirmation";
export type OpportunityGapKind = "missing-capability" | "unconfirmed-capability" | "requirement-review" | "evidence-confirmation";
export type OpportunityGapStatus = "open" | "acknowledged" | "resolved-by-current-profile" | "deferred";
export type ParticipantGapStatus = Exclude<OpportunityGapStatus, "resolved-by-current-profile">;

export interface RequirementFitObservation {
  readonly reference: string;
  readonly title: string;
  readonly description: string;
  readonly level: string;
  readonly capabilityLabel: string | null;
  readonly capabilityDefinition: string | null;
  readonly state: RequirementFitState;
  readonly alignedOrganizationCapabilities: readonly string[];
  readonly teamCoverageAllowed: boolean;
  readonly evidenceRequired: boolean;
}

export interface OpportunityGap {
  readonly reference: string;
  readonly observationReference: string;
  readonly kind: OpportunityGapKind;
  readonly title: string;
  readonly capabilityLabel: string | null;
  readonly explanationInputDigest: string;
  readonly status: OpportunityGapStatus;
}

export interface OpportunityGapAssessment {
  readonly reference: string;
  readonly observationReference: string;
  readonly kind: OpportunityGapKind;
  readonly title: string;
  readonly capabilityLabel: string | null;
  readonly openedExplanationInputDigest: string;
  readonly reviewedExplanationInputDigest: string;
  readonly reviewedFitSnapshotId: string;
  readonly status: OpportunityGapStatus;
}

export interface MatchExplanation {
  readonly policyVersion: typeof OPPORTUNITY_FIT_POLICY_VERSION;
  readonly inputDigest: string;
  readonly organizationId: OrganizationId;
  readonly opportunityReference: string;
  readonly opportunityProjectionVersion: number;
  readonly opportunityProjectionDigest: string;
  readonly organizationCapabilityInputDigest: string;
  readonly attribution: readonly OpportunityAttribution[];
  readonly requirementObservations: readonly RequirementFitObservation[];
  readonly gaps: readonly OpportunityGap[];
  readonly geographyObservation: GeographyFitState;
  readonly publishedFacts: Readonly<{
    deadline: string;
    estimatedValue: EstimatedValue;
    engagementTerm: EngagementTerm;
    locationSummary: string;
  }>;
  readonly calculatedAt: string;
}

export interface PursuitAssessmentDimension {
  readonly state: PursuitAssessmentState;
  readonly note: string;
}

export interface PursuitAssessment {
  readonly fit: PursuitAssessmentDimension;
  readonly eligibility: PursuitAssessmentDimension;
  readonly capacity: PursuitAssessmentDimension;
  readonly economics: PursuitAssessmentDimension;
  readonly geography: PursuitAssessmentDimension;
  readonly gaps: PursuitAssessmentDimension;
}

export interface OpportunityPursuit {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly opportunityReference: string;
  readonly decision: PursuitDecision;
  readonly assessment: PursuitAssessment;
  readonly gapAssessments: readonly OpportunityGapAssessment[];
  readonly reviewedFitSnapshotId: string;
  readonly reviewedProjectionVersion: number;
  readonly reviewedProjectionDigest: string;
  readonly reviewedCapabilityInputDigest: string;
  readonly fitPolicyVersion: typeof OPPORTUNITY_FIT_POLICY_VERSION;
  readonly version: number;
  readonly createdByUserId: UserId;
  readonly createdByMembershipId: OrganizationMembershipId;
  readonly updatedByUserId: UserId;
  readonly updatedByMembershipId: OrganizationMembershipId;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OpportunityFitSnapshot {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly opportunityReference: string;
  readonly explanation: MatchExplanation;
  readonly recordedAt: string;
}

export interface OpportunityPursuitCommandReceipt {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly action: "pursuit.save";
  readonly requestFingerprint: string;
  readonly pursuitId: string;
  readonly resultingVersion: number;
  readonly resultingPursuit: OpportunityPursuit;
  readonly recordedAt: string;
}

export interface OpportunityPursuitEvent {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly actorUserId: UserId;
  readonly actorMembershipId: OrganizationMembershipId;
  readonly kind: "pursuit-created" | "pursuit-updated";
  readonly pursuitId: string;
  readonly pursuitVersion: number;
  readonly decision: PursuitDecision;
  readonly commandId: string;
  readonly occurredAt: string;
}

export interface OpportunityPursuitBundle {
  readonly record: OpportunityPursuit;
  readonly expectedVersion: number | null;
  readonly expectedFitSnapshotId: string;
  readonly actingUserWatchId: string;
  readonly command: OpportunityPursuitCommandReceipt;
  readonly event: OpportunityPursuitEvent;
  readonly audit: OrganizationActionAuditEvent;
}

export class OpportunityPursuitRepositoryError extends Error {
  readonly code: "conflict" | "dependency-unavailable";

  constructor(code: OpportunityPursuitRepositoryError["code"], message: string, options?: ErrorOptions) {
    super(message, options);
    this.code = code;
    this.name = "OpportunityPursuitRepositoryError";
  }
}

export interface OpportunityPursuitRepository {
  getProjection(reference: string): Promise<ResponderOpportunityProjection | null>;
  getPublicationSnapshotByReference(reference: string): Promise<RfxPublicationSnapshot | null>;
  listCapabilityClaims(organizationId: OrganizationId): Promise<readonly OrganizationCapabilityClaim[]>;
  getServiceGeographyIds(organizationId: OrganizationId): Promise<readonly string[]>;
  getPursuit(id: string): Promise<OpportunityPursuit | null>;
  getFitSnapshot(id: string): Promise<OpportunityFitSnapshot | null>;
  recordFit(snapshot: OpportunityFitSnapshot): Promise<"created" | "replayed">;
  getCommand(id: string): Promise<OpportunityPursuitCommandReceipt | null>;
  savePursuit(bundle: OpportunityPursuitBundle): Promise<"created" | "replayed">;
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function opaque(prefix: string, ...values: readonly string[]): string {
  return `${prefix}_${createHash("sha256").update(values.join(":"), "utf8").digest("hex").slice(0, 40)}`;
}

export function opportunityPursuitId(organizationId: string, reference: string): string {
  return opaque("opppursuit", organizationId, reference);
}

export function opportunityFitSnapshotId(input: Readonly<{
  organizationId: string;
  reference: string;
  projectionVersion: number;
  projectionDigest: string;
  capabilityInputDigest: string;
}>): string {
  return opaque("oppfit", input.organizationId, input.reference, String(input.projectionVersion), input.projectionDigest, input.capabilityInputDigest, String(OPPORTUNITY_FIT_POLICY_VERSION));
}

export function opportunityCapabilityInputDigest(claims: readonly OrganizationCapabilityClaim[], serviceGeographyIds: readonly string[]): string {
  return digest({
    claims: claims.map((claim) => ({
      id: claim.id,
      capabilityId: claim.capabilityId,
      release: claim.amacsReleaseVersion,
      status: claim.assertionStatus,
      source: claim.source.kind,
      geographies: [...claim.serviceGeographyIds].sort(),
      evidenceIds: [...claim.evidenceIds].sort(),
      updatedAt: claim.updatedAt,
    })).sort((left, right) => left.id.localeCompare(right.id)),
    serviceGeographyIds: [...new Set(serviceGeographyIds)].sort(),
  });
}

export function calculateOpportunityFit(input: Readonly<{
  organizationId: OrganizationId;
  projection: ResponderOpportunityProjection;
  claims: readonly OrganizationCapabilityClaim[];
  serviceGeographyIds: readonly string[];
  calculatedAt: string;
}>): MatchExplanation {
  const capabilityInputDigest = opportunityCapabilityInputDigest(input.claims, input.serviceGeographyIds);
  const explanationInputDigest = digest({ policyVersion: OPPORTUNITY_FIT_POLICY_VERSION, opportunityProjectionVersion: input.projection.aggregateVersion, opportunityProjectionDigest: input.projection.digest, organizationCapabilityInputDigest: capabilityInputDigest });
  const eligibleClaims = input.claims.filter((claim) => claim.assertionStatus !== "suspended" && claim.source.kind !== "legacy_migration");
  const observations = input.projection.payload.requirements.map((requirement, ordinal): RequirementFitObservation => {
    const index = input.projection.requirementIndex?.find((item) => item.ordinal === ordinal);
    const reference = opaque("fitreq", input.projection.reference, index?.requirementId ?? String(ordinal));
    if (!index?.capabilityId) return Object.freeze({
      reference, title: requirement.title, description: requirement.description, level: requirement.level,
      capabilityLabel: requirement.capabilityLabel, capabilityDefinition: requirement.capabilityDefinition,
      state: "not-applicable" as const, alignedOrganizationCapabilities: Object.freeze([]),
      teamCoverageAllowed: index?.teamCoverageAllowed ?? false, evidenceRequired: index?.evidenceRequired ?? requirement.evidence.length > 0,
    });
    const aligned = eligibleClaims.filter((claim) => claim.capabilityId === index.capabilityId && claim.amacsReleaseVersion === index.amacsReleaseVersion);
    const legacyPossible = input.claims.some((claim) => claim.capabilityId === index.capabilityId && claim.source.kind === "legacy_migration");
    return Object.freeze({
      reference, title: requirement.title, description: requirement.description, level: requirement.level,
      capabilityLabel: requirement.capabilityLabel, capabilityDefinition: requirement.capabilityDefinition,
      state: aligned.length ? "aligned" as const : legacyPossible ? "unconfirmed" as const : "missing" as const,
      alignedOrganizationCapabilities: Object.freeze(aligned.map((claim) => claim.labelSnapshot).sort()),
      teamCoverageAllowed: index.teamCoverageAllowed, evidenceRequired: index.evidenceRequired,
    });
  });
  const gaps: OpportunityGap[] = [];
  for (const observation of observations) {
    const shared = { observationReference: observation.reference, title: observation.title, capabilityLabel: observation.capabilityLabel, explanationInputDigest } as const;
    if (observation.state === "missing") gaps.push(Object.freeze({ reference: opaque("oppgap", observation.reference, "missing"), ...shared, kind: "missing-capability", status: "open" }));
    else if (observation.state === "unconfirmed") gaps.push(Object.freeze({ reference: opaque("oppgap", observation.reference, "unconfirmed"), ...shared, kind: "unconfirmed-capability", status: "open" }));
    else if (observation.state === "not-applicable") gaps.push(Object.freeze({ reference: opaque("oppgap", observation.reference, "review"), ...shared, kind: "requirement-review", status: "open" }));
    if (observation.evidenceRequired && observation.state === "aligned") gaps.push(Object.freeze({ reference: opaque("oppgap", observation.reference, "evidence"), ...shared, kind: "evidence-confirmation", status: "open" }));
  }
  const localityIds = input.projection.payload.localities.map((item) => item.id);
  const geographyObservation: GeographyFitState = !localityIds.length
    ? "not-applicable"
    : !input.serviceGeographyIds.length
      ? "needs-confirmation"
      : localityIds.some((id) => input.serviceGeographyIds.includes(id))
        ? "aligned"
        : "outside-confirmed-area";
  const potentialMatch = observations.some((item) => item.state === "aligned");
  return Object.freeze({
    policyVersion: OPPORTUNITY_FIT_POLICY_VERSION,
    inputDigest: explanationInputDigest,
    organizationId: input.organizationId,
    opportunityReference: input.projection.reference,
    opportunityProjectionVersion: input.projection.aggregateVersion,
    opportunityProjectionDigest: input.projection.digest,
    organizationCapabilityInputDigest: capabilityInputDigest,
    attribution: Object.freeze<OpportunityAttribution[]>(potentialMatch ? ["discovered", "potential-match"] : ["discovered"]),
    requirementObservations: Object.freeze(observations),
    gaps: Object.freeze(gaps),
    geographyObservation,
    publishedFacts: Object.freeze({
      deadline: input.projection.payload.timing.responseDeadline ?? "",
      estimatedValue: input.projection.payload.estimatedValue,
      engagementTerm: input.projection.payload.engagementTerm,
      locationSummary: input.projection.payload.localities.map((item) => item.label).join(", "),
    }),
    calculatedAt: new Date(input.calculatedAt).toISOString(),
  });
}

export function normalizePursuitAssessment(input: Partial<Record<keyof PursuitAssessment, Readonly<{ state?: string; note?: string }>>>): PursuitAssessment {
  const states = new Set<PursuitAssessmentState>(["not-reviewed", "acceptable", "concern", "blocking", "needs-confirmation"]);
  const dimension = (key: keyof PursuitAssessment): PursuitAssessmentDimension => {
    const value = input[key];
    const state = states.has(value?.state as PursuitAssessmentState) ? value!.state as PursuitAssessmentState : "not-reviewed";
    return Object.freeze({ state, note: (value?.note ?? "").slice(0, 600) });
  };
  return Object.freeze({ fit: dimension("fit"), eligibility: dimension("eligibility"), capacity: dimension("capacity"), economics: dimension("economics"), geography: dimension("geography"), gaps: dimension("gaps") });
}
