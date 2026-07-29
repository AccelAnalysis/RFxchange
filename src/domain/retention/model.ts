import type { OrganizationId } from "../organizations/model";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type RetentionPolicyId = Brand<string, "RetentionPolicyId">;
export type RetentionAssignmentId = Brand<string, "RetentionAssignmentId">;
export type RetentionRecordId = Brand<string, "RetentionRecordId">;
export type RetentionPolicyKey = Brand<string, "RetentionPolicyKey">;
export type RetentionPolicyVersion = Brand<string, "RetentionPolicyVersion">;
export type RetentionTimestamp = Brand<string, "RetentionTimestamp">;

export const RETENTION_PRESERVATION_REASONS = [
  "legal",
  "financial",
  "security",
  "audit",
  "dispute",
  "compliance",
] as const;

export type RetentionPreservationReason = (typeof RETENTION_PRESERVATION_REASONS)[number];
export type RetentionRequirement = "preserve-required" | "retention-not-required";
export type RetentionOperation = "delete" | "moderation-remove";

export interface RetentionPolicyClassification {
  readonly id: RetentionPolicyId;
  readonly policyKey: RetentionPolicyKey;
  readonly version: RetentionPolicyVersion;
  readonly requirement: RetentionRequirement;
  readonly reasons: readonly RetentionPreservationReason[];
  readonly createdAt: RetentionTimestamp;
}

export type RetentionRecordScope =
  | {
      readonly kind: "organization";
      readonly organizationId: OrganizationId;
    }
  | {
      readonly kind: "platform";
    };

export interface RetentionRecordReference {
  readonly recordType: string;
  readonly recordId: RetentionRecordId;
  readonly scope: RetentionRecordScope;
}

export interface RecordRetentionAssignment {
  readonly id: RetentionAssignmentId;
  readonly record: RetentionRecordReference;
  readonly policyId: RetentionPolicyId;
  readonly policyKey: RetentionPolicyKey;
  readonly policyVersion: RetentionPolicyVersion;
  readonly classifiedAt: RetentionTimestamp;
}

export interface CreateRetentionPolicyInput {
  readonly id: string;
  readonly policyKey: string;
  readonly version: string;
  readonly requirement: RetentionRequirement;
  readonly reasons?: readonly RetentionPreservationReason[];
  readonly now: string;
}

export interface CreateRecordRetentionAssignmentInput {
  readonly id: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly scope: RetentionRecordScope;
  readonly now: string;
}

export type RetentionDispositionDecision =
  | {
      readonly kind: "preserve";
      readonly operation: RetentionOperation;
      readonly reasons: readonly RetentionPreservationReason[];
      readonly policyId: RetentionPolicyId;
      readonly policyVersion: RetentionPolicyVersion;
    }
  | {
      readonly kind: "not-retention-blocked";
      readonly operation: RetentionOperation;
      readonly policyId: RetentionPolicyId;
      readonly policyVersion: RetentionPolicyVersion;
      readonly note: "Retention classification alone does not authorize deletion or moderation.";
    };

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }
  return normalized;
}

function timestamp(value: string): RetentionTimestamp {
  const normalized = requiredValue(value, "Retention timestamp");
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) {
    throw new Error("Retention timestamp must be a valid ISO-compatible date-time value.");
  }
  return new Date(parsed).toISOString() as RetentionTimestamp;
}

function stableIdentifier(value: string, field: string): string {
  const normalized = requiredValue(value, field);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(normalized)) {
    throw new Error(`${field} must be a stable machine-readable identifier.`);
  }
  return normalized;
}

export function retentionPolicyId(value: string): RetentionPolicyId {
  return stableIdentifier(value, "Retention policy id") as RetentionPolicyId;
}

export function retentionAssignmentId(value: string): RetentionAssignmentId {
  return stableIdentifier(value, "Retention assignment id") as RetentionAssignmentId;
}

export function retentionRecordId(value: string): RetentionRecordId {
  return stableIdentifier(value, "Retention record id") as RetentionRecordId;
}

export function retentionPolicyKey(value: string): RetentionPolicyKey {
  return stableIdentifier(value, "Retention policy key") as RetentionPolicyKey;
}

export function retentionPolicyVersion(value: string): RetentionPolicyVersion {
  return stableIdentifier(value, "Retention policy version") as RetentionPolicyVersion;
}

function normalizeReasons(
  requirement: RetentionRequirement,
  reasons: readonly RetentionPreservationReason[] | undefined,
): readonly RetentionPreservationReason[] {
  const normalized = Object.freeze([...(new Set(reasons ?? []))]);

  for (const reason of normalized) {
    if (!RETENTION_PRESERVATION_REASONS.includes(reason)) {
      throw new Error(`Unsupported retention preservation reason: ${reason}.`);
    }
  }

  if (requirement === "preserve-required" && normalized.length === 0) {
    throw new Error("Preserve-required retention policy must state at least one preservation reason.");
  }

  if (requirement === "retention-not-required" && normalized.length > 0) {
    throw new Error("Retention-not-required policy cannot carry preservation reasons.");
  }

  return normalized;
}

export function createRetentionPolicyClassification(
  input: CreateRetentionPolicyInput,
): RetentionPolicyClassification {
  if (input.requirement !== "preserve-required" && input.requirement !== "retention-not-required") {
    throw new Error(`Unsupported retention requirement: ${input.requirement}.`);
  }

  return Object.freeze({
    id: retentionPolicyId(input.id),
    policyKey: retentionPolicyKey(input.policyKey),
    version: retentionPolicyVersion(input.version),
    requirement: input.requirement,
    reasons: normalizeReasons(input.requirement, input.reasons),
    createdAt: timestamp(input.now),
  });
}

function normalizeScope(scope: RetentionRecordScope): RetentionRecordScope {
  if (scope.kind === "platform") {
    return Object.freeze({ kind: "platform" as const });
  }

  if (scope.kind === "organization") {
    if (!scope.organizationId) {
      throw new Error("Organization-scoped retained record requires organizationId.");
    }
    return Object.freeze({ kind: "organization" as const, organizationId: scope.organizationId });
  }

  throw new Error("Unsupported retention record scope.");
}

export function createRecordRetentionAssignment(
  policy: RetentionPolicyClassification,
  input: CreateRecordRetentionAssignmentInput,
): RecordRetentionAssignment {
  const recordType = stableIdentifier(input.recordType, "Retention record type");

  return Object.freeze({
    id: retentionAssignmentId(input.id),
    record: Object.freeze({
      recordType,
      recordId: retentionRecordId(input.recordId),
      scope: normalizeScope(input.scope),
    }),
    policyId: policy.id,
    policyKey: policy.policyKey,
    policyVersion: policy.version,
    classifiedAt: timestamp(input.now),
  });
}

function assertAssignmentMatchesPolicy(
  assignment: RecordRetentionAssignment,
  policy: RetentionPolicyClassification,
): void {
  if (
    assignment.policyId !== policy.id ||
    assignment.policyKey !== policy.policyKey ||
    assignment.policyVersion !== policy.version
  ) {
    throw new Error("Retention assignment does not match the supplied policy classification/version.");
  }
}

export function evaluateRetentionDisposition(
  assignment: RecordRetentionAssignment,
  policy: RetentionPolicyClassification,
  operation: RetentionOperation,
): RetentionDispositionDecision {
  assertAssignmentMatchesPolicy(assignment, policy);

  if (operation !== "delete" && operation !== "moderation-remove") {
    throw new Error(`Unsupported retention operation: ${operation}.`);
  }

  if (policy.requirement === "preserve-required") {
    return Object.freeze({
      kind: "preserve" as const,
      operation,
      reasons: policy.reasons,
      policyId: policy.id,
      policyVersion: policy.version,
    });
  }

  return Object.freeze({
    kind: "not-retention-blocked" as const,
    operation,
    policyId: policy.id,
    policyVersion: policy.version,
    note: "Retention classification alone does not authorize deletion or moderation." as const,
  });
}

export function assertRetentionAllowsDisposition(
  assignment: RecordRetentionAssignment,
  policy: RetentionPolicyClassification,
  operation: RetentionOperation,
): void {
  const decision = evaluateRetentionDisposition(assignment, policy, operation);
  if (decision.kind === "preserve") {
    throw new Error(
      `Retention policy requires preservation for ${operation}: ${decision.reasons.join(", ")}.`,
    );
  }
}
