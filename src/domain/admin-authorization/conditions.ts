import {
  requireCataloguedAdminPermission,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
  type PlatformAdministratorId,
} from "./model.ts";
import {
  authorizeScopedAdministrativeAction,
  type AdminPermissionGrant,
  type ScopedAdministrativeActionRequirement,
  type ScopedAdministrativeAuthorizationDecision,
} from "./grants.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type AdminSensitiveActionPolicyTimestamp = Brand<string, "AdminSensitiveActionPolicyTimestamp">;
export type AdminEvidenceReference = Brand<string, "AdminEvidenceReference">;

export const ADMIN_SENSITIVE_CONDITION_KINDS = [
  "justification",
  "evidence",
  "recent-reauthentication",
  "secondary-approval",
] as const;
export type AdminSensitiveConditionKind = (typeof ADMIN_SENSITIVE_CONDITION_KINDS)[number];

export type AdminSensitiveConditionRequirement =
  | Readonly<{
      readonly kind: "justification";
      readonly minimumCharacters: number;
    }>
  | Readonly<{
      readonly kind: "evidence";
      readonly minimumReferences: number;
    }>
  | Readonly<{
      readonly kind: "recent-reauthentication";
      readonly maximumAgeSeconds: number;
    }>
  | Readonly<{
      readonly kind: "secondary-approval";
      readonly maximumAgeSeconds: number;
    }>;

export interface AdminSensitiveActionPolicy {
  readonly permission: AdminPermissionKey;
  readonly requiredConditions: readonly AdminSensitiveConditionRequirement[];
  readonly createdAt: AdminSensitiveActionPolicyTimestamp;
  readonly updatedAt: AdminSensitiveActionPolicyTimestamp;
}

export interface CreateAdminSensitiveActionPolicyInput {
  readonly permission: string;
  readonly requiredConditions: readonly Readonly<{
    readonly kind: string;
    readonly minimumCharacters?: number;
    readonly minimumReferences?: number;
    readonly maximumAgeSeconds?: number;
  }>[];
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface AdminSecondaryApprovalEvidence {
  readonly approverAdministratorId: PlatformAdministratorId;
  readonly permission: AdminPermissionKey;
  readonly scopeValue: string;
  readonly approvedAt: AdminSensitiveActionPolicyTimestamp;
}

export interface SensitiveActionEvidenceInput {
  readonly justification?: string | null;
  readonly evidenceReferences?: readonly string[];
  readonly reauthenticatedAt?: string | null;
  readonly secondaryApprovals?: readonly Readonly<{
    readonly approverAdministratorId: string;
    readonly permission: string;
    readonly scopeValue: string;
    readonly approvedAt: string;
  }>[];
}

export interface SensitiveActionEvaluationInput {
  readonly now: string;
  readonly satisfiedGrantConditionKeys?: readonly string[];
  readonly evidence?: SensitiveActionEvidenceInput;
}

export type SensitiveActionConditionFailureReason =
  | "justification-required"
  | "evidence-required"
  | "reauthentication-required"
  | "reauthentication-stale"
  | "secondary-approval-required";

export type ConditionalScopedAdministrativeAuthorizationDecision =
  | Readonly<{
      readonly kind: "allow";
      readonly authorization: Extract<ScopedAdministrativeAuthorizationDecision, { kind: "allow" }>;
      readonly satisfiedConditions: readonly AdminSensitiveConditionKind[];
    }>
  | Readonly<{
      readonly kind: "deny";
      readonly phase: "authorization";
      readonly authorization: Extract<ScopedAdministrativeAuthorizationDecision, { kind: "deny" }>;
    }>
  | Readonly<{
      readonly kind: "deny";
      readonly phase: "conditions";
      readonly permission: AdminPermissionKey;
      readonly scopeValue: string;
      readonly reason: SensitiveActionConditionFailureReason;
      readonly satisfiedConditions: readonly AdminSensitiveConditionKind[];
    }>;

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function timestamp(value: string, field: string): AdminSensitiveActionPolicyTimestamp {
  const normalized = requiredValue(value, field);
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString() as AdminSensitiveActionPolicyTimestamp;
}

function positiveInteger(value: number | undefined, field: string): number {
  if (!Number.isInteger(value) || (value ?? 0) <= 0) throw new Error(`${field} must be a positive integer.`);
  return value as number;
}

function conditionRequirement(
  input: CreateAdminSensitiveActionPolicyInput["requiredConditions"][number],
): AdminSensitiveConditionRequirement {
  if (input.kind === "justification") {
    return Object.freeze({
      kind: "justification" as const,
      minimumCharacters: positiveInteger(input.minimumCharacters ?? 1, "Minimum justification characters"),
    });
  }
  if (input.kind === "evidence") {
    return Object.freeze({
      kind: "evidence" as const,
      minimumReferences: positiveInteger(input.minimumReferences ?? 1, "Minimum evidence references"),
    });
  }
  if (input.kind === "recent-reauthentication") {
    return Object.freeze({
      kind: "recent-reauthentication" as const,
      maximumAgeSeconds: positiveInteger(input.maximumAgeSeconds, "Maximum reauthentication age seconds"),
    });
  }
  if (input.kind === "secondary-approval") {
    return Object.freeze({
      kind: "secondary-approval" as const,
      maximumAgeSeconds: positiveInteger(input.maximumAgeSeconds, "Maximum secondary approval age seconds"),
    });
  }
  throw new Error(`Unsupported sensitive administrative condition: ${input.kind}.`);
}

export function createAdminSensitiveActionPolicy(
  input: CreateAdminSensitiveActionPolicyInput,
): AdminSensitiveActionPolicy {
  if (input.requiredConditions.length === 0) {
    throw new Error("Sensitive administrative action policy requires at least one condition.");
  }
  const createdAt = timestamp(input.createdAt, "Sensitive action policy creation timestamp");
  const updatedAt = timestamp(input.updatedAt ?? input.createdAt, "Sensitive action policy update timestamp");
  if (Date.parse(updatedAt) < Date.parse(createdAt)) {
    throw new Error("Sensitive action policy update cannot precede creation.");
  }

  const conditions = input.requiredConditions.map(conditionRequirement);
  const kinds = conditions.map((condition) => condition.kind);
  if (new Set(kinds).size !== kinds.length) {
    throw new Error("Sensitive administrative action policy cannot repeat a condition kind.");
  }

  return Object.freeze({
    permission: requireCataloguedAdminPermission(input.permission),
    requiredConditions: Object.freeze(conditions),
    createdAt,
    updatedAt,
  });
}

function uniqueEvidenceReferences(values: readonly string[] = []): readonly AdminEvidenceReference[] {
  return Object.freeze(
    [...new Set(values.map((value) => requiredValue(value, "Sensitive action evidence reference") as AdminEvidenceReference))],
  );
}

function parseApprovals(
  values: SensitiveActionEvidenceInput["secondaryApprovals"] = [],
): readonly AdminSecondaryApprovalEvidence[] {
  return Object.freeze(
    values.map((value) =>
      Object.freeze({
        approverAdministratorId: requiredValue(
          value.approverAdministratorId,
          "Secondary approver administrator id",
        ) as PlatformAdministratorId,
        permission: requireCataloguedAdminPermission(value.permission),
        scopeValue: requiredValue(value.scopeValue, "Secondary approval scope"),
        approvedAt: timestamp(value.approvedAt, "Secondary approval timestamp"),
      }),
    ),
  );
}

function ageSeconds(now: string, prior: string): number | null {
  const nowMs = Date.parse(now);
  const priorMs = Date.parse(prior);
  if (Number.isNaN(nowMs) || Number.isNaN(priorMs)) return null;
  const age = (nowMs - priorMs) / 1000;
  if (age < 0) return null;
  return age;
}

function conditionDenied(
  permission: AdminPermissionKey,
  scopeValue: string,
  reason: SensitiveActionConditionFailureReason,
  satisfiedConditions: readonly AdminSensitiveConditionKind[],
): ConditionalScopedAdministrativeAuthorizationDecision {
  return Object.freeze({
    kind: "deny" as const,
    phase: "conditions" as const,
    permission,
    scopeValue,
    reason,
    satisfiedConditions: Object.freeze([...satisfiedConditions]),
  });
}

export function authorizeConditionalScopedAdministrativeAction(
  context: PlatformAdministratorAuthorityContext,
  grants: readonly AdminPermissionGrant[],
  requirement: ScopedAdministrativeActionRequirement,
  policy: AdminSensitiveActionPolicy | null,
  evaluation: SensitiveActionEvaluationInput,
): ConditionalScopedAdministrativeAuthorizationDecision {
  const authorization = authorizeScopedAdministrativeAction(context, grants, requirement, {
    now: evaluation.now,
    satisfiedConditionKeys: evaluation.satisfiedGrantConditionKeys,
  });
  if (authorization.kind === "deny") {
    return Object.freeze({ kind: "deny" as const, phase: "authorization" as const, authorization });
  }

  if (!policy) {
    return Object.freeze({
      kind: "allow" as const,
      authorization,
      satisfiedConditions: Object.freeze([]),
    });
  }
  if (policy.permission !== requirement.permission) {
    throw new Error("Sensitive action policy permission does not match the authorized action permission.");
  }

  const evaluatedNow = timestamp(evaluation.now, "Sensitive action evaluation timestamp");
  const evidence = evaluation.evidence ?? {};
  const references = uniqueEvidenceReferences(evidence.evidenceReferences);
  const approvals = parseApprovals(evidence.secondaryApprovals);
  const satisfied: AdminSensitiveConditionKind[] = [];

  for (const condition of policy.requiredConditions) {
    if (condition.kind === "justification") {
      const justification = evidence.justification?.trim() ?? "";
      if (justification.length < condition.minimumCharacters) {
        return conditionDenied(policy.permission, requirement.scope.value, "justification-required", satisfied);
      }
      satisfied.push(condition.kind);
      continue;
    }

    if (condition.kind === "evidence") {
      if (references.length < condition.minimumReferences) {
        return conditionDenied(policy.permission, requirement.scope.value, "evidence-required", satisfied);
      }
      satisfied.push(condition.kind);
      continue;
    }

    if (condition.kind === "recent-reauthentication") {
      if (!evidence.reauthenticatedAt) {
        return conditionDenied(policy.permission, requirement.scope.value, "reauthentication-required", satisfied);
      }
      const reauthenticatedAt = timestamp(evidence.reauthenticatedAt, "Reauthentication timestamp");
      const age = ageSeconds(evaluatedNow, reauthenticatedAt);
      if (age === null || age > condition.maximumAgeSeconds) {
        return conditionDenied(policy.permission, requirement.scope.value, "reauthentication-stale", satisfied);
      }
      satisfied.push(condition.kind);
      continue;
    }

    const matchingApproval = approvals.find((approval) => {
      if (approval.approverAdministratorId === context.administratorId) return false;
      if (approval.permission !== requirement.permission) return false;
      if (approval.scopeValue !== requirement.scope.value) return false;
      const age = ageSeconds(evaluatedNow, approval.approvedAt);
      return age !== null && age <= condition.maximumAgeSeconds;
    });
    if (!matchingApproval) {
      return conditionDenied(policy.permission, requirement.scope.value, "secondary-approval-required", satisfied);
    }
    satisfied.push(condition.kind);
  }

  return Object.freeze({
    kind: "allow" as const,
    authorization,
    satisfiedConditions: Object.freeze([...satisfied]),
  });
}
