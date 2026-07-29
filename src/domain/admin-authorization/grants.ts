import {
  requireCataloguedAdminPermission,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
  type PlatformAdministratorId,
} from "./model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type AdminPermissionGrantId = Brand<string, "AdminPermissionGrantId">;
export type AdminGrantTimestamp = Brand<string, "AdminGrantTimestamp">;
export type AdminScopeTargetId = Brand<string, "AdminScopeTargetId">;

export const ADMIN_SCOPE_KINDS = ["GLOBAL", "GEOGRAPHY", "ORGANIZATION", "CASE"] as const;
export type AdminScopeKind = (typeof ADMIN_SCOPE_KINDS)[number];

export type AdminGrantScope =
  | Readonly<{ readonly kind: "GLOBAL"; readonly value: "GLOBAL" }>
  | Readonly<{
      readonly kind: "GEOGRAPHY";
      readonly targetId: AdminScopeTargetId;
      readonly value: `GEOGRAPHY:${string}`;
    }>
  | Readonly<{
      readonly kind: "ORGANIZATION";
      readonly targetId: AdminScopeTargetId;
      readonly value: `ORGANIZATION:${string}`;
    }>
  | Readonly<{
      readonly kind: "CASE";
      readonly targetId: AdminScopeTargetId;
      readonly value: `CASE:${string}`;
    }>;

export interface AdminPermissionGrant {
  readonly id: AdminPermissionGrantId;
  readonly administratorId: PlatformAdministratorId;
  readonly permission: AdminPermissionKey;
  readonly scope: AdminGrantScope;
  readonly conditionKeys: readonly string[];
  readonly createdAt: AdminGrantTimestamp;
  readonly expiresAt?: AdminGrantTimestamp;
}

export interface CreateAdminPermissionGrantInput {
  readonly id: string;
  readonly administratorId: string;
  readonly permission: string;
  readonly scope: string;
  readonly conditionKeys?: readonly string[];
  readonly createdAt: string;
  readonly expiresAt?: string;
}

export interface ScopedAdministrativeActionRequirement {
  readonly permission: AdminPermissionKey;
  readonly access: "read" | "write";
  readonly scope: AdminGrantScope;
}

export interface CreateScopedAdministrativeActionRequirementInput {
  readonly permission: string;
  readonly access: "read" | "write";
  readonly scope: string;
}

export interface ScopedAdministrativeEvaluationInput {
  readonly now: string;
  readonly satisfiedConditionKeys?: readonly string[];
}

export type ScopedAdministrativeAuthorizationDecision =
  | Readonly<{
      readonly kind: "allow";
      readonly administratorId: PlatformAdministratorId;
      readonly permission: AdminPermissionKey;
      readonly access: "read" | "write";
      readonly scope: AdminGrantScope;
      readonly grantId: AdminPermissionGrantId;
    }>
  | Readonly<{
      readonly kind: "deny";
      readonly administratorId: PlatformAdministratorId;
      readonly permission: AdminPermissionKey;
      readonly access: "read" | "write";
      readonly scope: AdminGrantScope;
      readonly reason:
        | "role-context-missing"
        | "permission-not-granted"
        | "scoped-grant-not-found"
        | "grant-expired"
        | "scope-not-satisfied"
        | "conditions-not-satisfied";
    }>;

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }
  return normalized;
}

function adminGrantTimestamp(value: string): AdminGrantTimestamp {
  const normalized = requiredValue(value, "Admin grant timestamp");
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) {
    throw new Error("Admin grant timestamp must be a valid ISO-compatible date-time value.");
  }
  return new Date(parsed).toISOString() as AdminGrantTimestamp;
}

function scopeTargetId(value: string): AdminScopeTargetId {
  const normalized = requiredValue(value, "Administrative scope target id");
  if (normalized.includes(":")) {
    throw new Error("Administrative scope target id cannot contain a colon.");
  }
  return normalized as AdminScopeTargetId;
}

export function adminPermissionGrantId(value: string): AdminPermissionGrantId {
  return requiredValue(value, "Admin permission grant id") as AdminPermissionGrantId;
}

export function parseAdminGrantScope(value: string): AdminGrantScope {
  const normalized = requiredValue(value, "Administrative grant scope");
  if (normalized === "GLOBAL") {
    return Object.freeze({ kind: "GLOBAL" as const, value: "GLOBAL" as const });
  }

  const separator = normalized.indexOf(":");
  if (separator <= 0 || separator === normalized.length - 1) {
    throw new Error(
      "Administrative grant scope must be GLOBAL, GEOGRAPHY:<id>, ORGANIZATION:<id>, or CASE:<id>.",
    );
  }

  const rawKind = normalized.slice(0, separator);
  const rawTargetId = normalized.slice(separator + 1);
  if (rawKind !== "GEOGRAPHY" && rawKind !== "ORGANIZATION" && rawKind !== "CASE") {
    throw new Error(`Unsupported administrative grant scope kind: ${rawKind}.`);
  }

  const targetId = scopeTargetId(rawTargetId);
  return Object.freeze({
    kind: rawKind,
    targetId,
    value: `${rawKind}:${targetId}`,
  }) as AdminGrantScope;
}

function uniqueConditionKeys(values: readonly string[] = []): readonly string[] {
  return Object.freeze([
    ...new Set(values.map((value) => requiredValue(value, "Administrative grant condition key"))),
  ]);
}

export function createAdminPermissionGrant(
  input: CreateAdminPermissionGrantInput,
): AdminPermissionGrant {
  const createdAt = adminGrantTimestamp(input.createdAt);
  const expiresAt = input.expiresAt ? adminGrantTimestamp(input.expiresAt) : undefined;

  if (expiresAt && Date.parse(expiresAt) <= Date.parse(createdAt)) {
    throw new Error("Administrative permission grant expiry must be later than its creation time.");
  }

  const administratorId = requiredValue(
    input.administratorId,
    "Platform administrator id",
  ) as PlatformAdministratorId;

  return Object.freeze({
    id: adminPermissionGrantId(input.id),
    administratorId,
    permission: requireCataloguedAdminPermission(input.permission),
    scope: parseAdminGrantScope(input.scope),
    conditionKeys: uniqueConditionKeys(input.conditionKeys),
    createdAt,
    ...(expiresAt ? { expiresAt } : {}),
  });
}

export function createScopedAdministrativeActionRequirement(
  input: CreateScopedAdministrativeActionRequirementInput,
): ScopedAdministrativeActionRequirement {
  if (input.access !== "read" && input.access !== "write") {
    throw new Error(`Unsupported administrative access mode: ${input.access}.`);
  }

  return Object.freeze({
    permission: requireCataloguedAdminPermission(input.permission),
    access: input.access,
    scope: parseAdminGrantScope(input.scope),
  });
}

export function adminGrantScopeMatches(
  grantScope: AdminGrantScope,
  actionScope: AdminGrantScope,
): boolean {
  if (grantScope.kind === "GLOBAL") {
    return true;
  }
  return grantScope.value === actionScope.value;
}

export function isAdminPermissionGrantExpired(
  grant: AdminPermissionGrant,
  now: string,
): boolean {
  const evaluatedAt = adminGrantTimestamp(now);
  return grant.expiresAt !== undefined && Date.parse(evaluatedAt) >= Date.parse(grant.expiresAt);
}

function conditionsSatisfied(
  grant: AdminPermissionGrant,
  satisfiedConditionKeys: readonly string[],
): boolean {
  const satisfied = new Set(satisfiedConditionKeys);
  return grant.conditionKeys.every((key) => satisfied.has(key));
}

function deny(
  context: PlatformAdministratorAuthorityContext,
  requirement: ScopedAdministrativeActionRequirement,
  reason: Extract<ScopedAdministrativeAuthorizationDecision, { kind: "deny" }>["reason"],
): ScopedAdministrativeAuthorizationDecision {
  return Object.freeze({
    kind: "deny" as const,
    administratorId: context.administratorId,
    permission: requirement.permission,
    access: requirement.access,
    scope: requirement.scope,
    reason,
  });
}

export function authorizeScopedAdministrativeAction(
  context: PlatformAdministratorAuthorityContext,
  grants: readonly AdminPermissionGrant[],
  requirement: ScopedAdministrativeActionRequirement,
  evaluation: ScopedAdministrativeEvaluationInput,
): ScopedAdministrativeAuthorizationDecision {
  if (context.rolePresetKeys.length === 0) {
    return deny(context, requirement, "role-context-missing");
  }

  if (!context.effectivePermissions.includes(requirement.permission)) {
    return deny(context, requirement, "permission-not-granted");
  }

  const relevantGrants = grants.filter(
    (grant) =>
      grant.administratorId === context.administratorId &&
      grant.permission === requirement.permission,
  );
  if (relevantGrants.length === 0) {
    return deny(context, requirement, "scoped-grant-not-found");
  }

  const activeGrants = relevantGrants.filter(
    (grant) => !isAdminPermissionGrantExpired(grant, evaluation.now),
  );
  if (activeGrants.length === 0) {
    return deny(context, requirement, "grant-expired");
  }

  const scopeMatches = activeGrants.filter((grant) =>
    adminGrantScopeMatches(grant.scope, requirement.scope),
  );
  if (scopeMatches.length === 0) {
    return deny(context, requirement, "scope-not-satisfied");
  }

  const satisfiedConditionKeys = uniqueConditionKeys(evaluation.satisfiedConditionKeys);
  const matchingGrant = scopeMatches.find((grant) =>
    conditionsSatisfied(grant, satisfiedConditionKeys),
  );
  if (!matchingGrant) {
    return deny(context, requirement, "conditions-not-satisfied");
  }

  return Object.freeze({
    kind: "allow" as const,
    administratorId: context.administratorId,
    permission: requirement.permission,
    access: requirement.access,
    scope: requirement.scope,
    grantId: matchingGrant.id,
  });
}

export function assertScopedAdministrativeActionAuthorized(
  context: PlatformAdministratorAuthorityContext,
  grants: readonly AdminPermissionGrant[],
  requirement: ScopedAdministrativeActionRequirement,
  evaluation: ScopedAdministrativeEvaluationInput,
): ScopedAdministrativeAuthorizationDecision & { readonly kind: "allow" } {
  const decision = authorizeScopedAdministrativeAction(context, grants, requirement, evaluation);
  if (decision.kind !== "allow") {
    throw new Error(
      `Scoped administrative action denied for ${decision.permission} at ${decision.scope.value}: ${decision.reason}.`,
    );
  }
  return decision;
}
