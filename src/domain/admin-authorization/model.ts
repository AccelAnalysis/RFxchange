type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type PlatformAdministratorId = Brand<string, "PlatformAdministratorId">;
export type AdminRolePresetKey = Brand<string, "AdminRolePresetKey">;
export type AdminPermissionKey = Brand<string, "AdminPermissionKey">;

export const ADMIN_PERMISSION_NAMESPACES = [
  "platform",
  "admin",
  "config",
  "organization",
  "user",
  "rfx",
  "credibility",
  "provider",
  "referral",
  "commerce",
  "geography",
  "support",
  "trust",
  "analytics",
  "audit",
  "system",
] as const;

export type AdminPermissionNamespace = (typeof ADMIN_PERMISSION_NAMESPACES)[number];

export interface AdminPermissionDefinition {
  readonly key: AdminPermissionKey;
  readonly namespace: AdminPermissionNamespace;
  readonly description: string;
}

const RAW_ADMIN_PERMISSION_CATALOG = [
  ["platform.policy.read", "platform", "Read platform policy metadata."],
  ["platform.policy.change-directive.read", "platform", "Read platform governance change directives."],
  ["admin.authority.read", "admin", "Read administrator authority context."],
  ["admin.permission.catalog.read", "admin", "Read the administrative permission catalog."],
  ["admin.lifecycle.create", "admin", "Create a non-protected platform administrator account."],
  ["admin.lifecycle.access.manage", "admin", "Assign or revoke administrator roles, permissions and scope limits."],
  ["admin.lifecycle.disable", "admin", "Disable a non-protected platform administrator account."],
  ["admin.lifecycle.remove", "admin", "Remove a previously disabled non-protected platform administrator account."],
  ["admin.security.lock", "admin", "Lock a non-protected administrator and invalidate privileged sessions."],
  ["admin.security.credential-reset.require", "admin", "Require an administrator credential reset before privileged access resumes."],
  ["admin.security.mfa.require", "admin", "Require MFA enrollment before privileged administrator access resumes."],
  ["admin.security.reauthentication.require", "admin", "Require recent re-authentication before privileged administrator access resumes."],
  ["admin.security.session.terminate", "admin", "Terminate an administrator's privileged sessions."],
  ["config.value.read", "config", "Read governed configuration values."],
  ["config.value.manage", "config", "Change governed configuration values subject to privileged checks and immutable audit."],
  ["config.history.read", "config", "Read governed configuration history."],
  ["organization.profile.read", "organization", "Read organization profile data."],
  ["organization.profile.update", "organization", "Update organization profile data when separately authorized."],
  ["organization.location.private.read", "organization", "Read exact private organization location data when minimum-necessary access is explicitly authorized."],
  ["organization.document.private.read", "organization", "Read private organization documents when explicitly authorized."],
  ["organization.claim.read", "organization", "Read organization claim workflow state within an explicit scope."],
  ["organization.claim.adjudicate", "organization", "Compare evidence and adjudicate organization authority claims within an explicit scope."],
  ["user.profile.read", "user", "Read user profile data."],
  ["user.access.read", "user", "Read user access metadata."],
  ["user.access.manage", "user", "Administer user organization memberships and access state without bypassing organization attachment requirements."],
  ["rfx.record.read", "rfx", "Read RFx records available to administrative workflows."],
  ["rfx.private-evidence.read", "rfx", "Read private RFx responses, submissions, attachments or other restricted RFx evidence."],
  ["rfx.moderation.review", "rfx", "Review an RFx for moderation without selecting an awardee."],
  ["credibility.organization.verify", "credibility", "Verify an organization through an approved verification workflow."],
  ["credibility.organization.deny-verification", "credibility", "Deny organization verification through an approved workflow."],
  ["credibility.verification-evidence.read", "credibility", "Read restricted verification evidence when explicitly authorized."],
  ["credibility.badge.award", "credibility", "Award a manual credibility badge when policy allows."],
  ["credibility.endorsement.issue", "credibility", "Issue a platform endorsement when policy allows."],
  ["credibility.badge.suspend", "credibility", "Suspend a credibility badge."],
  ["credibility.badge.restore", "credibility", "Restore a suspended credibility badge."],
  ["credibility.badge.revoke", "credibility", "Revoke a credibility badge."],
  ["credibility.record.correct", "credibility", "Create an approved credibility correction."],
  ["credibility.appeal.review", "credibility", "Review a credibility appeal."],
  ["credibility.activity.invalidate", "credibility", "Invalidate qualifying credibility activity."],
  ["credibility.transaction.invalidate", "credibility", "Invalidate a transaction for credibility calculations."],
  ["credibility.endorsement-authority.suspend", "credibility", "Suspend endorsement authority."],
  ["credibility.endorsement-authority.restore", "credibility", "Restore endorsement authority."],
  ["provider.application.read", "provider", "Read resource-provider applications."],
  ["provider.application.review", "provider", "Review resource-provider applications."],
  ["provider.seed-promotion.preview", "provider", "Preview an evidence-bound provider seed promotion without writing canonical records."],
  ["provider.seed-promotion.commit", "provider", "Commit an approved provider seed promotion through the protected server adapter."],
  ["referral.record.read", "referral", "Read referral records allowed to administrative workflows."],
  ["referral.case.review", "referral", "Review referral cases without changing marketplace ranking."],
  ["commerce.account.read", "commerce", "Read commerce/account metadata allowed to administrative workflows."],
  ["commerce.payment-metadata.read", "commerce", "Read restricted payment metadata when explicitly authorized."],
  ["commerce.adjustment.review", "commerce", "Review a commerce adjustment request."],
  ["geography.definition.read", "geography", "Read geography definitions."],
  ["geography.release.read", "geography", "Read geography release state."],
  ["support.case.read", "support", "Read support cases."],
  ["support.case.update", "support", "Update an assigned support case."],
  ["trust.report.read", "trust", "Read trust-and-safety reports."],
  ["trust.complaint-evidence.read", "trust", "Read restricted complaint, report or investigation evidence when explicitly authorized."],
  ["trust.case.review", "trust", "Review a trust-and-safety case."],
  ["analytics.dashboard.read", "analytics", "Read permitted administrative analytics."],
  ["analytics.export.request", "analytics", "Request an analytics export subject to privacy controls."],
  ["audit.event.read", "audit", "Read permitted administrative audit events."],
  ["audit.correction.append", "audit", "Append an audit correction that preserves original history."],
  ["system.health.read", "system", "Read system operations health."],
  ["system.maintenance.request", "system", "Request a controlled maintenance operation."],
] as const satisfies readonly (readonly [string, AdminPermissionNamespace, string])[];

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

export function platformAdministratorId(value: string): PlatformAdministratorId {
  return requiredValue(value, "Platform administrator id") as PlatformAdministratorId;
}

export function adminRolePresetKey(value: string): AdminRolePresetKey {
  const normalized = requiredValue(value, "Admin role preset key");
  if (!/^[a-z0-9][a-z0-9._-]{0,95}$/.test(normalized)) {
    throw new Error("Admin role preset key must be a stable lowercase identifier.");
  }
  return normalized as AdminRolePresetKey;
}

function parseAdminPermissionKey(value: string): {
  readonly namespace: AdminPermissionNamespace;
  readonly normalized: string;
} {
  const normalized = requiredValue(value, "Administrative permission key");
  if (!/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*){2,5}$/.test(normalized)) {
    throw new Error("Administrative permission key must be namespaced lowercase segments separated by dots.");
  }
  const namespace = normalized.split(".", 1)[0] as AdminPermissionNamespace;
  if (!ADMIN_PERMISSION_NAMESPACES.includes(namespace)) {
    throw new Error(`Unsupported administrative permission namespace: ${namespace}.`);
  }
  return Object.freeze({ namespace, normalized });
}

export function adminPermissionKey(value: string): AdminPermissionKey {
  return parseAdminPermissionKey(value).normalized as AdminPermissionKey;
}

export const ADMIN_PERMISSION_CATALOG: readonly AdminPermissionDefinition[] = Object.freeze(
  RAW_ADMIN_PERMISSION_CATALOG.map(([rawKey, namespace, description]) => {
    const parsed = parseAdminPermissionKey(rawKey);
    if (parsed.namespace !== namespace) throw new Error(`Permission ${rawKey} is assigned to the wrong namespace.`);
    return Object.freeze({ key: parsed.normalized as AdminPermissionKey, namespace, description });
  }),
);

const ADMIN_PERMISSION_KEYS = new Set(ADMIN_PERMISSION_CATALOG.map((definition) => definition.key));

export function isCataloguedAdminPermission(permission: AdminPermissionKey): boolean {
  return ADMIN_PERMISSION_KEYS.has(permission);
}

export function requireCataloguedAdminPermission(value: string): AdminPermissionKey {
  const permission = adminPermissionKey(value);
  if (!isCataloguedAdminPermission(permission)) {
    throw new Error(`Administrative permission is not in the catalog: ${permission}.`);
  }
  return permission;
}

export interface AdminGlobalScopeResolution {
  readonly required: "GLOBAL";
  readonly resolved: "GLOBAL";
  readonly satisfied: boolean;
}

export type AdminConditionResolution =
  | Readonly<{ readonly requirement: "none"; readonly status: "not-required" }>
  | Readonly<{ readonly requirement: "pre-resolved"; readonly status: "satisfied"; readonly evidenceKeys: readonly string[] }>
  | Readonly<{ readonly requirement: "pre-resolved"; readonly status: "unsatisfied"; readonly evidenceKeys: readonly string[] }>;

export interface PlatformAdministratorAuthorityContext {
  readonly administratorId: PlatformAdministratorId;
  readonly rolePresetKeys: readonly AdminRolePresetKey[];
  readonly effectivePermissions: readonly AdminPermissionKey[];
  readonly scope: AdminGlobalScopeResolution;
  readonly conditions: AdminConditionResolution;
}

export interface CreatePlatformAdministratorAuthorityContextInput {
  readonly administratorId: string;
  readonly rolePresetKeys: readonly string[];
  readonly effectivePermissions: readonly string[];
  readonly scopeSatisfied?: boolean;
  readonly conditions?:
    | Readonly<{ readonly requirement: "none" }>
    | Readonly<{ readonly requirement: "pre-resolved"; readonly status: "satisfied" | "unsatisfied"; readonly evidenceKeys?: readonly string[] }>;
}

function uniqueValues<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function createConditionResolution(input: CreatePlatformAdministratorAuthorityContextInput["conditions"]): AdminConditionResolution {
  if (!input || input.requirement === "none") {
    return Object.freeze({ requirement: "none" as const, status: "not-required" as const });
  }
  return Object.freeze({
    requirement: "pre-resolved" as const,
    status: input.status,
    evidenceKeys: uniqueValues((input.evidenceKeys ?? []).map((key) => requiredValue(key, "Condition evidence key"))),
  });
}

export function createPlatformAdministratorAuthorityContext(
  input: CreatePlatformAdministratorAuthorityContextInput,
): PlatformAdministratorAuthorityContext {
  const roles = uniqueValues(input.rolePresetKeys.map(adminRolePresetKey));
  if (roles.length === 0) {
    throw new Error("Administrative authority context requires at least one role preset reference; role definitions are resolved separately.");
  }
  const permissions = uniqueValues(input.effectivePermissions.map(requireCataloguedAdminPermission));
  return Object.freeze({
    administratorId: platformAdministratorId(input.administratorId),
    rolePresetKeys: roles,
    effectivePermissions: permissions,
    scope: Object.freeze({ required: "GLOBAL" as const, resolved: "GLOBAL" as const, satisfied: input.scopeSatisfied ?? true }),
    conditions: createConditionResolution(input.conditions),
  });
}

export interface AdministrativeActionRequirement {
  readonly permission: AdminPermissionKey;
  readonly scope: "GLOBAL";
  readonly conditions: "none" | "pre-resolved";
}

export interface CreateAdministrativeActionRequirementInput {
  readonly permission: string;
  readonly scope?: "GLOBAL";
  readonly conditions?: "none" | "pre-resolved";
}

export function createAdministrativeActionRequirement(
  input: CreateAdministrativeActionRequirementInput,
): AdministrativeActionRequirement {
  return Object.freeze({
    permission: requireCataloguedAdminPermission(input.permission),
    scope: input.scope ?? "GLOBAL",
    conditions: input.conditions ?? "none",
  });
}

export type AdministrativeAuthorizationDecision =
  | Readonly<{ readonly kind: "allow"; readonly administratorId: PlatformAdministratorId; readonly permission: AdminPermissionKey; readonly scope: "GLOBAL" }>
  | Readonly<{ readonly kind: "deny"; readonly administratorId: PlatformAdministratorId; readonly permission: AdminPermissionKey; readonly reason: "role-context-missing" | "permission-not-granted" | "scope-not-satisfied" | "conditions-not-satisfied" }>;

export function authorizeAdministrativeAction(
  context: PlatformAdministratorAuthorityContext,
  requirement: AdministrativeActionRequirement,
): AdministrativeAuthorizationDecision {
  if (context.rolePresetKeys.length === 0) {
    return Object.freeze({ kind: "deny" as const, administratorId: context.administratorId, permission: requirement.permission, reason: "role-context-missing" as const });
  }
  if (!context.effectivePermissions.includes(requirement.permission)) {
    return Object.freeze({ kind: "deny" as const, administratorId: context.administratorId, permission: requirement.permission, reason: "permission-not-granted" as const });
  }
  if (
    requirement.scope !== "GLOBAL" ||
    context.scope.required !== requirement.scope ||
    context.scope.resolved !== requirement.scope ||
    !context.scope.satisfied
  ) {
    return Object.freeze({ kind: "deny" as const, administratorId: context.administratorId, permission: requirement.permission, reason: "scope-not-satisfied" as const });
  }
  if (
    requirement.conditions === "pre-resolved" &&
    !(context.conditions.requirement === "pre-resolved" && context.conditions.status === "satisfied")
  ) {
    return Object.freeze({ kind: "deny" as const, administratorId: context.administratorId, permission: requirement.permission, reason: "conditions-not-satisfied" as const });
  }
  return Object.freeze({ kind: "allow" as const, administratorId: context.administratorId, permission: requirement.permission, scope: requirement.scope });
}

export function assertAdministrativeActionAuthorized(
  context: PlatformAdministratorAuthorityContext,
  requirement: AdministrativeActionRequirement,
): AdministrativeAuthorizationDecision & { readonly kind: "allow" } {
  const decision = authorizeAdministrativeAction(context, requirement);
  if (decision.kind !== "allow") {
    throw new Error(`Administrative action denied for ${decision.permission}: ${decision.reason}.`);
  }
  return decision;
}
