import type { AdminPermissionGrant } from "../admin-authorization/grants.ts";
import type { PlatformAdministratorAuthorityContext } from "../admin-authorization/model.ts";
import type { GeographyId } from "../geography/model.ts";
import type { AccessJourneyId } from "../lifecycle/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type {
  OrganizationResolutionRecord,
} from "../organization-resolution/model.ts";
import type { StoredAssetId } from "../storage/model.ts";
import type { UserId } from "../users/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type OrganizationAuthorityClaimId = Brand<string, "OrganizationAuthorityClaimId">;
export type OrganizationAuthorityClaimEventId = Brand<string, "OrganizationAuthorityClaimEventId">;
export type OrganizationAuthorityDecisionId = Brand<string, "OrganizationAuthorityDecisionId">;
export type OrganizationAuthorityTimestamp = Brand<string, "OrganizationAuthorityTimestamp">;

export const ORGANIZATION_AUTHORITY_EVIDENCE_KINDS = [
  "domain-email",
  "existing-administrator-invitation",
  "administrative-review",
  "organization-document",
  "authoritative-record",
] as const;
export type OrganizationAuthorityEvidenceKind =
  (typeof ORGANIZATION_AUTHORITY_EVIDENCE_KINDS)[number];

export const ORGANIZATION_AUTHORITY_CLAIM_STATUSES = [
  "submitted",
  "evidence-requested",
  "existing-administrator-notified",
  "evidence-compared",
  "conflict",
  "approved",
  "denied",
] as const;
export type OrganizationAuthorityClaimStatus =
  (typeof ORGANIZATION_AUTHORITY_CLAIM_STATUSES)[number];

export interface OrganizationAuthorityEvidence {
  readonly id: string;
  readonly kind: OrganizationAuthorityEvidenceKind;
  readonly reference: string;
  readonly storedAssetId: StoredAssetId | null;
  readonly status: "pending" | "verified" | "rejected";
  readonly verifiedBy: "system" | "existing-administrator" | "platform-administrator" | null;
  readonly submittedAt: OrganizationAuthorityTimestamp;
  readonly verifiedAt: OrganizationAuthorityTimestamp | null;
}

export interface OrganizationAuthorityClaim {
  readonly id: OrganizationAuthorityClaimId;
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly resolutionId: OrganizationResolutionRecord["id"];
  readonly accessJourneyId: AccessJourneyId;
  readonly geographyId: GeographyId;
  readonly status: OrganizationAuthorityClaimStatus;
  readonly evidence: readonly OrganizationAuthorityEvidence[];
  readonly conflictingClaimIds: readonly OrganizationAuthorityClaimId[];
  readonly existingAdministratorNotification:
    | "not-required"
    | "pending"
    | "sent";
  readonly authorityEstablished: boolean;
  readonly verificationState: "not-evaluated";
  readonly membershipId: string | null;
  readonly createdAt: OrganizationAuthorityTimestamp;
  readonly updatedAt: OrganizationAuthorityTimestamp;
}

export interface OrganizationAuthorityClaimEvent {
  readonly id: OrganizationAuthorityClaimEventId;
  readonly claimId: OrganizationAuthorityClaimId;
  readonly organizationId: OrganizationId;
  readonly actor:
    | Readonly<{ readonly kind: "participant"; readonly id: UserId }>
    | Readonly<{ readonly kind: "system"; readonly id: string }>
    | Readonly<{ readonly kind: "existing-administrator"; readonly id: UserId }>
    | Readonly<{ readonly kind: "platform-administrator"; readonly id: string }>;
  readonly fromStatus: OrganizationAuthorityClaimStatus | null;
  readonly toStatus: OrganizationAuthorityClaimStatus;
  readonly action: string;
  readonly reason: string;
  readonly evidenceReferences: readonly string[];
  readonly occurredAt: OrganizationAuthorityTimestamp;
}

export interface OrganizationAuthorityDecision {
  readonly id: OrganizationAuthorityDecisionId;
  readonly claimId: OrganizationAuthorityClaimId;
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly outcome: "approved" | "denied";
  readonly decisionMaker: "system" | "existing-administrator" | "platform-administrator";
  readonly decisionMakerId: string;
  readonly reason: string;
  readonly comparedEvidenceReferences: readonly string[];
  readonly conflictingClaimIds: readonly OrganizationAuthorityClaimId[];
  readonly verificationState: "not-evaluated";
  readonly decidedAt: OrganizationAuthorityTimestamp;
}

export const ORGANIZATION_CLAIMS_CONSOLE_CATEGORIES = [
  "seeded",
  "unclaimed",
  "claimed",
  "active",
  "incomplete",
  "verification-pending",
  "verified",
  "provider",
  "issuer",
  "duplicate",
  "restricted",
  "suspended",
  "terminated",
  "geography",
] as const;
export type OrganizationClaimsConsoleCategory =
  (typeof ORGANIZATION_CLAIMS_CONSOLE_CATEGORIES)[number];

export interface OrganizationClaimsConsoleRecord {
  readonly organizationId: OrganizationId;
  readonly displayName: string;
  readonly geographyId: GeographyId;
  readonly origin: "seeded" | "participant-created" | "organization-confirmed";
  readonly claimState: "unclaimed" | "pending" | "conflict" | "claimed" | "denied";
  readonly activationState: "incomplete" | "active";
  readonly verificationState: "not-evaluated" | "pending" | "verified";
  readonly roles: readonly ("provider" | "issuer")[];
  readonly integrityState: "normal" | "duplicate";
  readonly restrictionState: "none" | "restricted" | "suspended" | "terminated";
  readonly claimId: OrganizationAuthorityClaimId | null;
}

export interface OrganizationClaimsAdminContext {
  readonly authority: PlatformAdministratorAuthorityContext;
  readonly grants: readonly AdminPermissionGrant[];
  readonly now: string;
  readonly satisfiedConditionKeys?: readonly string[];
}

function required(value: string, label: string, maximum = 512): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximum) throw new Error(`${label} cannot exceed ${maximum} characters.`);
  return normalized;
}

function timestamp(value: string): OrganizationAuthorityTimestamp {
  const parsed = Date.parse(required(value, "Organization authority timestamp", 64));
  if (!Number.isFinite(parsed)) throw new Error("Organization authority timestamp must be valid.");
  return new Date(parsed).toISOString() as OrganizationAuthorityTimestamp;
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

export function organizationAuthorityClaimId(value: string): OrganizationAuthorityClaimId {
  return required(value, "Organization authority claim id", 192) as OrganizationAuthorityClaimId;
}

export function createOrganizationAuthorityEvidence(input: Readonly<{
  id: string;
  kind: string;
  reference: string;
  storedAssetId?: StoredAssetId | null;
  status?: "pending" | "verified" | "rejected";
  verifiedBy?: OrganizationAuthorityEvidence["verifiedBy"];
  submittedAt: string;
  verifiedAt?: string | null;
}>): OrganizationAuthorityEvidence {
  if (!ORGANIZATION_AUTHORITY_EVIDENCE_KINDS.includes(input.kind as OrganizationAuthorityEvidenceKind)) {
    throw new Error(`Unsupported organization authority evidence kind: ${input.kind}.`);
  }
  const kind = input.kind as OrganizationAuthorityEvidenceKind;
  const status = input.status ?? "pending";
  const storedAssetId = input.storedAssetId ?? null;
  if (kind === "organization-document" && !storedAssetId) {
    throw new Error("Organization document authority evidence requires a private stored asset.");
  }
  if (kind !== "organization-document" && storedAssetId) {
    throw new Error("Only organization document evidence may reference a stored asset.");
  }
  const verifiedAt = input.verifiedAt ? timestamp(input.verifiedAt) : null;
  const verifiedBy = input.verifiedBy ?? null;
  if ((status === "verified") !== Boolean(verifiedAt && verifiedBy)) {
    throw new Error("Verified authority evidence requires verifier and verification time.");
  }
  return Object.freeze({
    id: required(input.id, "Organization authority evidence id", 192),
    kind,
    reference: required(input.reference, "Organization authority evidence reference", 512),
    storedAssetId,
    status,
    verifiedBy,
    submittedAt: timestamp(input.submittedAt),
    verifiedAt,
  });
}

export function createOrganizationAuthorityClaim(input: Readonly<{
  id: string;
  resolution: OrganizationResolutionRecord;
  geographyId: GeographyId;
  evidence?: readonly OrganizationAuthorityEvidence[];
  conflictingClaimIds?: readonly string[];
  now: string;
}>): OrganizationAuthorityClaim {
  if (
    input.resolution.relationshipState !== "authority-pending" ||
    input.resolution.verificationState !== "not-evaluated"
  ) {
    throw new Error("Organization authority requires a pending, unverified resolution.");
  }
  const conflicts = unique((input.conflictingClaimIds ?? []).map(organizationAuthorityClaimId));
  return Object.freeze({
    id: organizationAuthorityClaimId(input.id),
    organizationId: input.resolution.organizationId,
    userId: input.resolution.userId,
    resolutionId: input.resolution.id,
    accessJourneyId: input.resolution.accessJourneyId,
    geographyId: input.geographyId,
    status: conflicts.length > 0 ? "conflict" as const : "submitted" as const,
    evidence: Object.freeze([...(input.evidence ?? [])]),
    conflictingClaimIds: conflicts,
    existingAdministratorNotification: conflicts.length > 0 ? "pending" as const : "not-required" as const,
    authorityEstablished: false,
    verificationState: "not-evaluated" as const,
    membershipId: null,
    createdAt: timestamp(input.now),
    updatedAt: timestamp(input.now),
  });
}

export function createOrganizationAuthorityClaimSubmittedEvent(input: Readonly<{
  id: string;
  claim: OrganizationAuthorityClaim;
  reason: string;
  now: string;
}>): OrganizationAuthorityClaimEvent {
  return Object.freeze({
    id: required(input.id, "Organization authority claim event id", 192) as OrganizationAuthorityClaimEventId,
    claimId: input.claim.id,
    organizationId: input.claim.organizationId,
    actor: Object.freeze({ kind: "participant" as const, id: input.claim.userId }),
    fromStatus: null,
    toStatus: input.claim.status,
    action: "organization.authority-claim.submitted",
    reason: required(input.reason, "Organization authority claim reason", 1000),
    evidenceReferences: unique(input.claim.evidence.map((item) => item.reference)),
    occurredAt: timestamp(input.now),
  });
}

const ALLOWED_TRANSITIONS: Readonly<Record<OrganizationAuthorityClaimStatus, readonly OrganizationAuthorityClaimStatus[]>> =
  Object.freeze({
    submitted: Object.freeze(["evidence-requested", "evidence-compared", "conflict", "approved", "denied"] as const),
    "evidence-requested": Object.freeze(["existing-administrator-notified", "evidence-compared", "conflict", "denied"] as const),
    "existing-administrator-notified": Object.freeze(["evidence-compared", "conflict", "denied"] as const),
    "evidence-compared": Object.freeze(["conflict", "approved", "denied"] as const),
    conflict: Object.freeze(["existing-administrator-notified", "evidence-compared", "approved", "denied"] as const),
    approved: Object.freeze([] as const),
    denied: Object.freeze([] as const),
  });

export function transitionOrganizationAuthorityClaim(input: Readonly<{
  claim: OrganizationAuthorityClaim;
  eventId: string;
  actor: OrganizationAuthorityClaimEvent["actor"];
  toStatus: OrganizationAuthorityClaimStatus;
  action: string;
  reason: string;
  evidence?: readonly OrganizationAuthorityEvidence[];
  evidenceReferences?: readonly string[];
  membershipId?: string | null;
  now: string;
}>): Readonly<{ claim: OrganizationAuthorityClaim; event: OrganizationAuthorityClaimEvent }> {
  if (!ALLOWED_TRANSITIONS[input.claim.status].includes(input.toStatus)) {
    throw new Error(`Invalid authority claim transition: ${input.claim.status} -> ${input.toStatus}.`);
  }
  const evidence = Object.freeze(input.evidence ? [...input.evidence] : [...input.claim.evidence]);
  const membershipId = input.membershipId?.trim() || null;
  if (input.toStatus === "approved" && (!membershipId || !evidence.some((item) => item.status === "verified"))) {
    throw new Error("Authority approval requires verified evidence and an assigned membership.");
  }
  const occurredAt = timestamp(input.now);
  const claim = Object.freeze({
    ...input.claim,
    status: input.toStatus,
    evidence,
    existingAdministratorNotification:
      input.toStatus === "existing-administrator-notified"
        ? "sent" as const
        : input.claim.existingAdministratorNotification,
    authorityEstablished: input.toStatus === "approved",
    membershipId: input.toStatus === "approved" ? membershipId : input.claim.membershipId,
    updatedAt: occurredAt,
  });
  const event: OrganizationAuthorityClaimEvent = Object.freeze({
    id: required(input.eventId, "Organization authority claim event id", 192) as OrganizationAuthorityClaimEventId,
    claimId: claim.id,
    organizationId: claim.organizationId,
    actor: Object.freeze(input.actor),
    fromStatus: input.claim.status,
    toStatus: input.toStatus,
    action: required(input.action, "Organization authority claim action", 128),
    reason: required(input.reason, "Organization authority claim reason", 1000),
    evidenceReferences: unique(input.evidenceReferences ?? evidence.map((item) => item.reference)),
    occurredAt,
  });
  return Object.freeze({ claim, event });
}

export function createOrganizationAuthorityDecision(input: Readonly<{
  id: string;
  claim: OrganizationAuthorityClaim;
  outcome: "approved" | "denied";
  decisionMaker: OrganizationAuthorityDecision["decisionMaker"];
  decisionMakerId: string;
  reason: string;
  now: string;
}>): OrganizationAuthorityDecision {
  if (input.claim.status !== input.outcome) {
    throw new Error("Authority decision outcome must match the terminal claim state.");
  }
  return Object.freeze({
    id: required(input.id, "Organization authority decision id", 192) as OrganizationAuthorityDecisionId,
    claimId: input.claim.id,
    organizationId: input.claim.organizationId,
    userId: input.claim.userId,
    outcome: input.outcome,
    decisionMaker: input.decisionMaker,
    decisionMakerId: required(input.decisionMakerId, "Authority decision maker id", 192),
    reason: required(input.reason, "Authority decision reason", 1000),
    comparedEvidenceReferences: unique(
      input.claim.evidence.filter((evidence) => evidence.status === "verified").map((evidence) => evidence.reference),
    ),
    conflictingClaimIds: input.claim.conflictingClaimIds,
    verificationState: "not-evaluated" as const,
    decidedAt: timestamp(input.now),
  });
}

export function matchesOrganizationClaimsConsoleCategory(
  record: OrganizationClaimsConsoleRecord,
  category: OrganizationClaimsConsoleCategory,
  geographyId?: GeographyId,
): boolean {
  switch (category) {
    case "seeded": return record.origin === "seeded";
    case "unclaimed": return record.claimState === "unclaimed";
    case "claimed": return record.claimState === "claimed";
    case "active": return record.activationState === "active";
    case "incomplete": return record.activationState === "incomplete";
    case "verification-pending": return record.verificationState === "pending";
    case "verified": return record.verificationState === "verified";
    case "provider": return record.roles.includes("provider");
    case "issuer": return record.roles.includes("issuer");
    case "duplicate": return record.integrityState === "duplicate";
    case "restricted": return record.restrictionState === "restricted";
    case "suspended": return record.restrictionState === "suspended";
    case "terminated": return record.restrictionState === "terminated";
    case "geography": return Boolean(geographyId) && record.geographyId === geographyId;
  }
}
