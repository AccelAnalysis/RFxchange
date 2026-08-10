import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";

export const MARKET_PROFILE_VISIBILITIES = ["private", "network", "public"] as const;
export type MarketProfileVisibility = (typeof MARKET_PROFILE_VISIBILITIES)[number];

export const CAPABILITY_ENTITY_SCOPES = [
  "reporting_entity", "legal_entity", "operating_segment", "subsidiary", "brand", "unknown",
] as const;
export type CapabilityEntityScope = (typeof CAPABILITY_ENTITY_SCOPES)[number];

export const DELIVERY_ROLES = ["prime", "subcontractor", "supplier", "referral_partner"] as const;
export type DeliveryRole = (typeof DELIVERY_ROLES)[number];

export const CAPABILITY_ASSERTION_STATUSES = [
  "self_reported", "evidence_submitted", "verified", "suspended",
] as const;
export type CapabilityAssertionStatus = (typeof CAPABILITY_ASSERTION_STATUSES)[number];

export interface StructuredCapabilityCapacity {
  readonly value: number;
  readonly unitId: string;
  readonly period: "one_time" | "day" | "week" | "month" | "year";
  readonly note: string | null;
}

export type CapabilityClaimSource =
  | Readonly<{ kind: "manual" | "legacy_migration" }>
  | Readonly<{
      kind: "interpretation";
      interpretationRecordId: string;
      interpretationCandidateId: string;
      candidateUpdatedAt: string;
    }>;

export interface OrganizationCapabilityClaim {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly capabilityId: string;
  readonly amacsReleaseVersion: string;
  readonly labelSnapshot: string;
  readonly definitionSnapshot: string;
  readonly domainId: string;
  readonly domainLabelSnapshot: string;
  readonly familyId: string;
  readonly familyLabelSnapshot: string;
  readonly entityScope: CapabilityEntityScope;
  readonly marketRoleIds: readonly string[];
  readonly deliveryRoles: readonly DeliveryRole[];
  readonly serviceGeographyIds: readonly string[];
  readonly specialties: readonly string[];
  readonly capacity: StructuredCapabilityCapacity | null;
  readonly evidenceIds: readonly string[];
  readonly assertionStatus: CapabilityAssertionStatus;
  readonly visibility: MarketProfileVisibility;
  readonly source: CapabilityClaimSource;
  readonly assertedByUserId: UserId;
  readonly assertedByMembershipId: OrganizationMembershipId;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PublicOrganizationCapabilityClaim {
  readonly id: string;
  readonly capabilityId: string;
  readonly amacsReleaseVersion: string;
  readonly label: string;
  readonly definition: string;
  readonly domainLabel: string;
  readonly familyLabel: string;
  readonly specialties: readonly string[];
  readonly assertionStatus: "self_reported" | "evidence_submitted" | "verified";
  readonly provenanceLabel: "Organization claimed";
}

export interface IndustryDescriptor {
  readonly id: string;
  readonly label: string;
  readonly visibility: MarketProfileVisibility;
}

export interface NaicsDescriptor {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly version: string;
  readonly source: "participant_selected" | "authorized_import";
  readonly provenance: string;
  readonly visibility: MarketProfileVisibility;
}

export interface OrganizationIndustryProfile {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly revision: number;
  readonly industries: readonly IndustryDescriptor[];
  readonly naics: readonly NaicsDescriptor[];
  readonly updatedByUserId: UserId;
  readonly updatedByMembershipId: OrganizationMembershipId;
  readonly updatedAt: string;
}

export const PAST_PERFORMANCE_CONFIRMATION_STATES = [
  "self_reported", "counterparty_confirmed", "independently_verified",
] as const;
export type PastPerformanceConfirmationState =
  (typeof PAST_PERFORMANCE_CONFIRMATION_STATES)[number];

export interface OrganizationPastPerformance {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly title: string;
  readonly summary: string;
  readonly customerOrSector: string | null;
  readonly role: string;
  readonly startedOn: string | null;
  readonly endedOn: string | null;
  readonly contractType: string | null;
  readonly value: Readonly<{
    currency: string;
    exactMinorUnits: number | null;
    minimumMinorUnits: number | null;
    maximumMinorUnits: number | null;
    disclosed: boolean;
  }>;
  readonly location: string | null;
  readonly outputs: readonly string[];
  readonly outcomesClaimed: readonly string[];
  readonly supportingCapabilityClaimIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly confirmationState: PastPerformanceConfirmationState;
  readonly visibility: MarketProfileVisibility;
  readonly authoredByUserId: UserId;
  readonly authoredByMembershipId: OrganizationMembershipId;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OrganizationMarketPreferences {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly deliveryRoleInterests: readonly DeliveryRole[];
  readonly teamPreferences: readonly string[];
  readonly referralPreferences: readonly string[];
  readonly resourceNeeds: readonly string[];
  readonly contactPreference: "organization_contact" | "member_contact" | "structured_intake";
  readonly intakeNotes: string | null;
  readonly visibility: MarketProfileVisibility;
  readonly updatedByUserId: UserId;
  readonly updatedByMembershipId: OrganizationMembershipId;
  readonly updatedAt: string;
}

export interface OrganizationProvisionalTerm {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly proposedLabel: string;
  readonly proposedDefinition: string;
  readonly exampleWork: string;
  readonly suggestedDomainId: string | null;
  readonly status: "submitted";
  readonly sourceContext: "organization_profile";
  readonly submittedByUserId: UserId;
  readonly submittedByMembershipId: OrganizationMembershipId;
  readonly submittedAt: string;
}

export type OrganizationMarketProfileEventKind =
  | "capability-claimed"
  | "industry-context-updated"
  | "past-performance-added"
  | "preferences-updated"
  | "provisional-term-submitted";

export interface OrganizationMarketProfileEvent {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly actorUserId: UserId;
  readonly actorMembershipId: OrganizationMembershipId;
  readonly kind: OrganizationMarketProfileEventKind;
  readonly subjectId: string;
  readonly commandId: string;
  readonly occurredAt: string;
}

export interface OrganizationMarketProfileCommandReceipt {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly action: OrganizationMarketProfileEventKind;
  readonly resultId: string;
  readonly requestFingerprint: string;
  readonly actorUserId: UserId;
  readonly recordedAt: string;
}

function text(value: string, label: string, maximum: number, minimum = 1): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new Error(`${label} must contain ${minimum}-${maximum} characters.`);
  }
  return normalized;
}

function optionalText(value: string | null | undefined, label: string, maximum: number): string | null {
  return value?.trim() ? text(value, label, maximum) : null;
}

function stableId(value: string, label: string): string {
  const normalized = text(value, label, 191);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(normalized)) {
    throw new Error(`${label} must be a stable identifier.`);
  }
  return normalized;
}

function oneOf<T extends string>(value: string, values: readonly T[], label: string): T {
  if (!values.includes(value as T)) throw new Error(`Unsupported ${label}: ${value}.`);
  return value as T;
}

function list(values: readonly string[], label: string, maximum: number, itemMaximum = 160): readonly string[] {
  if (values.length > maximum) throw new Error(`${label} supports at most ${maximum} values.`);
  return Object.freeze([...new Set(values.map((value) => text(value, label, itemMaximum)))]);
}

function timestamp(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new Error("Timestamp must be ISO compatible.");
  return new Date(parsed).toISOString();
}

function date(value: string | null | undefined, label: string): string | null {
  if (!value?.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))) {
    throw new Error(`${label} must be an ISO date.`);
  }
  return value;
}

export function createOrganizationCapabilityClaim(input: Readonly<{
  id: string;
  organizationId: OrganizationId;
  capability: Readonly<{ conceptId: string; preferredLabel: string; definition: string; domainId: string; domainLabel: string; familyId: string; familyLabel: string; releaseVersion: string }>;
  entityScope: string;
  marketRoleIds: readonly string[];
  deliveryRoles: readonly string[];
  serviceGeographyIds: readonly string[];
  specialties: readonly string[];
  capacity?: Readonly<{ value: number; unitId: string; period: string; note?: string | null }> | null;
  evidenceIds?: readonly string[];
  visibility: string;
  source: CapabilityClaimSource;
  userId: UserId;
  membershipId: OrganizationMembershipId;
  now: string;
}>): OrganizationCapabilityClaim {
  if (input.capacity && (!Number.isFinite(input.capacity.value) || input.capacity.value <= 0)) {
    throw new Error("Capability capacity must be a positive number.");
  }
  const capacity = input.capacity ? Object.freeze({
    value: input.capacity.value,
    unitId: stableId(input.capacity.unitId, "Capacity unit"),
    period: oneOf(input.capacity.period, ["one_time", "day", "week", "month", "year"] as const, "capacity period"),
    note: optionalText(input.capacity.note, "Capacity note", 300),
  }) : null;
  const now = timestamp(input.now);
  return Object.freeze({
    id: stableId(input.id, "Capability claim id"),
    organizationId: input.organizationId,
    capabilityId: stableId(input.capability.conceptId, "AMACS capability id"),
    amacsReleaseVersion: text(input.capability.releaseVersion, "AMACS release", 40),
    labelSnapshot: text(input.capability.preferredLabel, "Capability label", 300),
    definitionSnapshot: text(input.capability.definition, "Capability definition", 2_000),
    domainId: stableId(input.capability.domainId, "AMACS domain id"),
    domainLabelSnapshot: text(input.capability.domainLabel, "Domain label", 300),
    familyId: stableId(input.capability.familyId, "AMACS family id"),
    familyLabelSnapshot: text(input.capability.familyLabel, "Family label", 300),
    entityScope: oneOf(input.entityScope, CAPABILITY_ENTITY_SCOPES, "entity scope"),
    marketRoleIds: list(input.marketRoleIds, "Market role", 18, 191),
    deliveryRoles: list(input.deliveryRoles, "Delivery role", 4, 40).map((value) => oneOf(value, DELIVERY_ROLES, "delivery role")),
    serviceGeographyIds: list(input.serviceGeographyIds, "Service geography", 100, 191),
    specialties: list(input.specialties, "Specialty", 20, 160),
    capacity,
    evidenceIds: list(input.evidenceIds ?? [], "Evidence reference", 30, 191),
    assertionStatus: "self_reported" as const,
    visibility: oneOf(input.visibility, MARKET_PROFILE_VISIBILITIES, "visibility"),
    source: Object.freeze({ ...input.source }),
    assertedByUserId: input.userId,
    assertedByMembershipId: input.membershipId,
    createdAt: now,
    updatedAt: now,
  });
}

export function projectOrganizationCapabilityClaim(
  claim: OrganizationCapabilityClaim,
  audience: "network" | "public",
): PublicOrganizationCapabilityClaim | null {
  if (claim.assertionStatus === "suspended" || claim.visibility === "private") return null;
  if (audience === "public" && claim.visibility !== "public") return null;
  return Object.freeze({
    id: claim.id,
    capabilityId: claim.capabilityId,
    amacsReleaseVersion: claim.amacsReleaseVersion,
    label: claim.labelSnapshot,
    definition: claim.definitionSnapshot,
    domainLabel: claim.domainLabelSnapshot,
    familyLabel: claim.familyLabelSnapshot,
    specialties: claim.specialties,
    assertionStatus: claim.assertionStatus,
    provenanceLabel: "Organization claimed" as const,
  });
}

export function createIndustryProfile(input: Readonly<{
  organizationId: OrganizationId;
  revision: number;
  industries: readonly Readonly<{ id: string; label: string; visibility: string }>[];
  naics: readonly Readonly<{ id: string; code: string; title: string; version: string; source: string; provenance: string; visibility: string }>[];
  userId: UserId;
  membershipId: OrganizationMembershipId;
  now: string;
}>): OrganizationIndustryProfile {
  if (!Number.isSafeInteger(input.revision) || input.revision < 1) throw new Error("Industry profile revision must be a positive integer.");
  if (input.industries.length > 20 || input.naics.length > 60) throw new Error("Industry context exceeds supported limits.");
  return Object.freeze({
    id: String(input.organizationId), organizationId: input.organizationId, revision: input.revision,
    industries: Object.freeze(input.industries.map((item) => Object.freeze({
      id: stableId(item.id, "Industry id"), label: text(item.label, "Industry label", 160),
      visibility: oneOf(item.visibility, MARKET_PROFILE_VISIBILITIES, "industry visibility"),
    }))),
    naics: Object.freeze(input.naics.map((item) => {
      const code = item.code.replace(/\D/g, "");
      if (!/^\d{2,6}$/.test(code)) throw new Error("NAICS code must contain 2-6 digits.");
      return Object.freeze({
        id: stableId(item.id, "NAICS descriptor id"), code, title: text(item.title, "NAICS title", 240),
        version: text(item.version, "NAICS version", 40),
        source: oneOf(item.source, ["participant_selected", "authorized_import"] as const, "NAICS source"),
        provenance: text(item.provenance, "NAICS provenance", 300),
        visibility: oneOf(item.visibility, MARKET_PROFILE_VISIBILITIES, "NAICS visibility"),
      });
    })),
    updatedByUserId: input.userId, updatedByMembershipId: input.membershipId, updatedAt: timestamp(input.now),
  });
}

export function createPastPerformance(input: Readonly<{
  id: string; organizationId: OrganizationId; title: string; summary: string; customerOrSector?: string | null;
  role: string; startedOn?: string | null; endedOn?: string | null; contractType?: string | null;
  value?: Partial<OrganizationPastPerformance["value"]>; location?: string | null; outputs: readonly string[];
  outcomesClaimed: readonly string[]; supportingCapabilityClaimIds?: readonly string[]; evidenceIds?: readonly string[];
  visibility: string; userId: UserId; membershipId: OrganizationMembershipId; now: string;
}>): OrganizationPastPerformance {
  const startedOn = date(input.startedOn, "Project start");
  const endedOn = date(input.endedOn, "Project end");
  if (startedOn && endedOn && startedOn > endedOn) throw new Error("Project end cannot precede project start.");
  const value = input.value ?? {};
  const exact = value.exactMinorUnits ?? null;
  const minimum = value.minimumMinorUnits ?? null;
  const maximum = value.maximumMinorUnits ?? null;
  for (const amount of [exact, minimum, maximum]) {
    if (amount !== null && (!Number.isSafeInteger(amount) || amount < 0)) throw new Error("Project values must use non-negative integer minor units.");
  }
  if (minimum !== null && maximum !== null && minimum > maximum) throw new Error("Project value minimum cannot exceed maximum.");
  const now = timestamp(input.now);
  return Object.freeze({
    id: stableId(input.id, "Past performance id"), organizationId: input.organizationId,
    title: text(input.title, "Project title", 180), summary: text(input.summary, "Project summary", 2_000, 20),
    customerOrSector: optionalText(input.customerOrSector, "Customer or sector", 240), role: text(input.role, "Organization role", 160),
    startedOn, endedOn, contractType: optionalText(input.contractType, "Contract type", 120),
    value: Object.freeze({ currency: text(value.currency ?? "USD", "Currency", 3).toUpperCase(), exactMinorUnits: exact, minimumMinorUnits: minimum, maximumMinorUnits: maximum, disclosed: value.disclosed === true }),
    location: optionalText(input.location, "Project location", 240), outputs: list(input.outputs, "Project output", 20, 300),
    outcomesClaimed: list(input.outcomesClaimed, "Claimed outcome", 20, 300),
    supportingCapabilityClaimIds: list(input.supportingCapabilityClaimIds ?? [], "Supporting capability", 30, 191),
    evidenceIds: list(input.evidenceIds ?? [], "Evidence reference", 30, 191),
    confirmationState: "self_reported" as const,
    visibility: oneOf(input.visibility, MARKET_PROFILE_VISIBILITIES, "visibility"),
    authoredByUserId: input.userId, authoredByMembershipId: input.membershipId, createdAt: now, updatedAt: now,
  });
}

export function createMarketPreferences(input: Readonly<{
  organizationId: OrganizationId; deliveryRoleInterests: readonly string[]; teamPreferences: readonly string[];
  referralPreferences: readonly string[]; resourceNeeds: readonly string[]; contactPreference: string;
  intakeNotes?: string | null; visibility: string; userId: UserId; membershipId: OrganizationMembershipId; now: string;
}>): OrganizationMarketPreferences {
  return Object.freeze({
    id: String(input.organizationId), organizationId: input.organizationId,
    deliveryRoleInterests: list(input.deliveryRoleInterests, "Delivery role", 4, 40).map((value) => oneOf(value, DELIVERY_ROLES, "delivery role")),
    teamPreferences: list(input.teamPreferences, "Team preference", 20, 300),
    referralPreferences: list(input.referralPreferences, "Referral preference", 20, 300),
    resourceNeeds: list(input.resourceNeeds, "Resource need", 20, 300),
    contactPreference: oneOf(input.contactPreference, ["organization_contact", "member_contact", "structured_intake"] as const, "contact preference"),
    intakeNotes: optionalText(input.intakeNotes, "Intake note", 600),
    visibility: oneOf(input.visibility, MARKET_PROFILE_VISIBILITIES, "visibility"),
    updatedByUserId: input.userId, updatedByMembershipId: input.membershipId, updatedAt: timestamp(input.now),
  });
}

export function createProvisionalTerm(input: Readonly<{
  id: string; organizationId: OrganizationId; proposedLabel: string; proposedDefinition: string;
  exampleWork: string; suggestedDomainId?: string | null; userId: UserId; membershipId: OrganizationMembershipId; now: string;
}>): OrganizationProvisionalTerm {
  return Object.freeze({
    id: stableId(input.id, "Provisional term id"), organizationId: input.organizationId,
    proposedLabel: text(input.proposedLabel, "Provisional label", 300),
    proposedDefinition: text(input.proposedDefinition, "Provisional definition", 1_200, 20),
    exampleWork: text(input.exampleWork, "Example work", 1_200, 10),
    suggestedDomainId: input.suggestedDomainId?.trim() ? stableId(input.suggestedDomainId, "Suggested domain") : null,
    status: "submitted" as const, sourceContext: "organization_profile" as const,
    submittedByUserId: input.userId, submittedByMembershipId: input.membershipId, submittedAt: timestamp(input.now),
  });
}
