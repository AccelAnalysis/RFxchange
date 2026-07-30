import type { AuthenticationAccountSecuritySnapshot } from "../../application/auth/account-security.ts";
import {
  assertAdministrativeActionAuthorized,
  createAdministrativeActionRequirement,
  platformAdministratorId,
  requireCataloguedAdminPermission,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
  type PlatformAdministratorId,
} from "./model.ts";
import { parseAdminGrantScope, type AdminGrantScope } from "./grants.ts";
import {
  createPlatformAdministratorRoleConfiguration,
  type PlatformAdministratorRoleConfiguration,
} from "./role-configuration.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type PlatformAdministratorLifecycleEventId = Brand<string, "PlatformAdministratorLifecycleEventId">;
export type PlatformAdministratorLifecycleTimestamp = Brand<string, "PlatformAdministratorLifecycleTimestamp">;
export type PlatformAdministratorSubject = Brand<string, "PlatformAdministratorSubject">;

export type PlatformAdministratorStatus = "active" | "disabled" | "removed";

export interface PlatformAdministratorSecurityState {
  readonly locked: boolean;
  readonly credentialResetRequired: boolean;
  readonly mfaRequired: boolean;
  readonly reauthenticationRequiredAfter: PlatformAdministratorLifecycleTimestamp | null;
  readonly sessionsTerminatedAt: PlatformAdministratorLifecycleTimestamp | null;
}

export interface PlatformAdministratorAccount {
  readonly administratorId: PlatformAdministratorId;
  readonly subject: PlatformAdministratorSubject;
  readonly protectedAccount: boolean;
  readonly status: PlatformAdministratorStatus;
  readonly access: PlatformAdministratorRoleConfiguration;
  readonly scopeLimits: readonly AdminGrantScope[];
  readonly security: PlatformAdministratorSecurityState;
  readonly createdAt: PlatformAdministratorLifecycleTimestamp;
  readonly updatedAt: PlatformAdministratorLifecycleTimestamp;
}

export type PlatformAdministratorLifecycleAction =
  | "administrator.created"
  | "administrator.access.updated"
  | "administrator.disabled"
  | "administrator.removed"
  | "administrator.security.locked"
  | "administrator.security.credential-reset-required"
  | "administrator.security.mfa-required"
  | "administrator.security.reauthentication-required"
  | "administrator.security.sessions-terminated";

export interface PlatformAdministratorLifecycleEvent {
  readonly id: PlatformAdministratorLifecycleEventId;
  readonly actorAdministratorId: PlatformAdministratorId;
  readonly targetAdministratorId: PlatformAdministratorId;
  readonly permission: AdminPermissionKey;
  readonly action: PlatformAdministratorLifecycleAction;
  readonly reason: string;
  readonly occurredAt: PlatformAdministratorLifecycleTimestamp;
  readonly before: PlatformAdministratorLifecycleSnapshot | null;
  readonly after: PlatformAdministratorLifecycleSnapshot;
}

export interface PlatformAdministratorLifecycleSnapshot {
  readonly status: PlatformAdministratorStatus;
  readonly rolePresetKeys: readonly string[];
  readonly addedPermissions: readonly string[];
  readonly removedPermissions: readonly string[];
  readonly scopeLimits: readonly string[];
  readonly locked: boolean;
  readonly credentialResetRequired: boolean;
  readonly mfaRequired: boolean;
  readonly reauthenticationRequiredAfter: string | null;
  readonly sessionsTerminatedAt: string | null;
}

export interface AdministratorMutationResult {
  readonly account: PlatformAdministratorAccount;
  readonly event: PlatformAdministratorLifecycleEvent;
}

export interface CreatePlatformAdministratorAccountInput {
  readonly administratorId: string;
  readonly subject: string;
  readonly rolePresetKeys: readonly string[];
  readonly addedPermissions?: readonly string[];
  readonly removedPermissions?: readonly string[];
  readonly scopeLimits?: readonly string[];
  readonly protectedAccount?: boolean;
  readonly eventId: string;
  readonly reason: string;
  readonly occurredAt: string;
}

export interface UpdatePlatformAdministratorAccessInput {
  readonly rolePresetKeys: readonly string[];
  readonly addedPermissions?: readonly string[];
  readonly removedPermissions?: readonly string[];
  readonly scopeLimits?: readonly string[];
  readonly eventId: string;
  readonly reason: string;
  readonly occurredAt: string;
}

export interface PlatformAdministratorSecurityCommandInput {
  readonly eventId: string;
  readonly reason: string;
  readonly occurredAt: string;
}

const LIFECYCLE_PERMISSIONS = Object.freeze({
  create: "admin.lifecycle.create",
  access: "admin.lifecycle.access.manage",
  disable: "admin.lifecycle.disable",
  remove: "admin.lifecycle.remove",
  lock: "admin.security.lock",
  credentialReset: "admin.security.credential-reset.require",
  mfa: "admin.security.mfa.require",
  reauthenticate: "admin.security.reauthentication.require",
  terminateSessions: "admin.security.session.terminate",
} as const);

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function lifecycleTimestamp(value: string, field = "Administrator lifecycle timestamp"): PlatformAdministratorLifecycleTimestamp {
  const normalized = requiredValue(value, field);
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString() as PlatformAdministratorLifecycleTimestamp;
}

function lifecycleEventId(value: string): PlatformAdministratorLifecycleEventId {
  return requiredValue(value, "Administrator lifecycle event id") as PlatformAdministratorLifecycleEventId;
}

function administratorSubject(value: string): PlatformAdministratorSubject {
  return requiredValue(value, "Administrator authentication subject") as PlatformAdministratorSubject;
}

function uniqueScopes(values: readonly string[] = ["GLOBAL"]): readonly AdminGrantScope[] {
  const scopes = values.map(parseAdminGrantScope);
  if (scopes.length === 0) throw new Error("Administrator access requires at least one scope limit.");
  return Object.freeze([...new Map(scopes.map((scope) => [scope.value, scope])).values()]);
}

function defaultSecurityState(): PlatformAdministratorSecurityState {
  return Object.freeze({
    locked: false,
    credentialResetRequired: false,
    mfaRequired: false,
    reauthenticationRequiredAfter: null,
    sessionsTerminatedAt: null,
  });
}

function snapshot(account: PlatformAdministratorAccount): PlatformAdministratorLifecycleSnapshot {
  return Object.freeze({
    status: account.status,
    rolePresetKeys: Object.freeze([...account.access.rolePresetKeys]),
    addedPermissions: Object.freeze([...account.access.addedPermissions]),
    removedPermissions: Object.freeze([...account.access.removedPermissions]),
    scopeLimits: Object.freeze(account.scopeLimits.map((scope) => scope.value)),
    locked: account.security.locked,
    credentialResetRequired: account.security.credentialResetRequired,
    mfaRequired: account.security.mfaRequired,
    reauthenticationRequiredAfter: account.security.reauthenticationRequiredAfter,
    sessionsTerminatedAt: account.security.sessionsTerminatedAt,
  });
}

function assertPermission(context: PlatformAdministratorAuthorityContext, permission: string): AdminPermissionKey {
  const requirement = createAdministrativeActionRequirement({ permission });
  assertAdministrativeActionAuthorized(context, requirement);
  return requirement.permission;
}

function assertTargetMutable(account: PlatformAdministratorAccount): void {
  if (account.protectedAccount) {
    throw new Error("Protected administrator accounts cannot be changed through ordinary lifecycle operations.");
  }
  if (account.status === "removed") {
    throw new Error("Removed administrator accounts cannot be changed.");
  }
}

function event(
  actor: PlatformAdministratorAuthorityContext,
  target: PlatformAdministratorAccount,
  previous: PlatformAdministratorAccount | null,
  permission: AdminPermissionKey,
  action: PlatformAdministratorLifecycleAction,
  input: PlatformAdministratorSecurityCommandInput,
): PlatformAdministratorLifecycleEvent {
  return Object.freeze({
    id: lifecycleEventId(input.eventId),
    actorAdministratorId: actor.administratorId,
    targetAdministratorId: target.administratorId,
    permission,
    action,
    reason: requiredValue(input.reason, "Administrator lifecycle reason"),
    occurredAt: lifecycleTimestamp(input.occurredAt),
    before: previous ? snapshot(previous) : null,
    after: snapshot(target),
  });
}

export function createPlatformAdministratorAccount(
  actor: PlatformAdministratorAuthorityContext,
  input: CreatePlatformAdministratorAccountInput,
): AdministratorMutationResult {
  const permission = assertPermission(actor, LIFECYCLE_PERMISSIONS.create);
  const occurredAt = lifecycleTimestamp(input.occurredAt);
  const administratorId = platformAdministratorId(input.administratorId);
  const account: PlatformAdministratorAccount = Object.freeze({
    administratorId,
    subject: administratorSubject(input.subject),
    protectedAccount: input.protectedAccount ?? false,
    status: "active" as const,
    access: createPlatformAdministratorRoleConfiguration({
      administratorId,
      rolePresetKeys: input.rolePresetKeys,
      addedPermissions: input.addedPermissions,
      removedPermissions: input.removedPermissions,
      createdAt: occurredAt,
    }),
    scopeLimits: uniqueScopes(input.scopeLimits),
    security: defaultSecurityState(),
    createdAt: occurredAt,
    updatedAt: occurredAt,
  });
  return Object.freeze({ account, event: event(actor, account, null, permission, "administrator.created", input) });
}

export function updatePlatformAdministratorAccess(
  actor: PlatformAdministratorAuthorityContext,
  current: PlatformAdministratorAccount,
  input: UpdatePlatformAdministratorAccessInput,
): AdministratorMutationResult {
  const permission = assertPermission(actor, LIFECYCLE_PERMISSIONS.access);
  assertTargetMutable(current);
  const occurredAt = lifecycleTimestamp(input.occurredAt);
  if (Date.parse(occurredAt) < Date.parse(current.updatedAt)) {
    throw new Error("Administrator access update cannot precede the current account state.");
  }
  const account: PlatformAdministratorAccount = Object.freeze({
    ...current,
    access: createPlatformAdministratorRoleConfiguration({
      administratorId: current.administratorId,
      rolePresetKeys: input.rolePresetKeys,
      addedPermissions: input.addedPermissions,
      removedPermissions: input.removedPermissions,
      createdAt: current.access.createdAt,
      updatedAt: occurredAt,
    }),
    scopeLimits: uniqueScopes(input.scopeLimits ?? current.scopeLimits.map((scope) => scope.value)),
    updatedAt: occurredAt,
  });
  return Object.freeze({ account, event: event(actor, account, current, permission, "administrator.access.updated", input) });
}

function statusMutation(
  actor: PlatformAdministratorAuthorityContext,
  current: PlatformAdministratorAccount,
  input: PlatformAdministratorSecurityCommandInput,
  permissionKey: string,
  status: PlatformAdministratorStatus,
  action: PlatformAdministratorLifecycleAction,
): AdministratorMutationResult {
  const permission = assertPermission(actor, permissionKey);
  assertTargetMutable(current);
  if (status === "removed" && current.status !== "disabled") {
    throw new Error("Administrator account must be disabled before removal.");
  }
  const occurredAt = lifecycleTimestamp(input.occurredAt);
  const account = Object.freeze({ ...current, status, updatedAt: occurredAt });
  return Object.freeze({ account, event: event(actor, account, current, permission, action, input) });
}

export function disablePlatformAdministrator(
  actor: PlatformAdministratorAuthorityContext,
  current: PlatformAdministratorAccount,
  input: PlatformAdministratorSecurityCommandInput,
): AdministratorMutationResult {
  return statusMutation(actor, current, input, LIFECYCLE_PERMISSIONS.disable, "disabled", "administrator.disabled");
}

export function removePlatformAdministrator(
  actor: PlatformAdministratorAuthorityContext,
  current: PlatformAdministratorAccount,
  input: PlatformAdministratorSecurityCommandInput,
): AdministratorMutationResult {
  return statusMutation(actor, current, input, LIFECYCLE_PERMISSIONS.remove, "removed", "administrator.removed");
}

function securityMutation(
  actor: PlatformAdministratorAuthorityContext,
  current: PlatformAdministratorAccount,
  input: PlatformAdministratorSecurityCommandInput,
  permissionKey: string,
  action: PlatformAdministratorLifecycleAction,
  security: (current: PlatformAdministratorSecurityState, occurredAt: PlatformAdministratorLifecycleTimestamp) => PlatformAdministratorSecurityState,
): AdministratorMutationResult {
  const permission = assertPermission(actor, permissionKey);
  assertTargetMutable(current);
  const occurredAt = lifecycleTimestamp(input.occurredAt);
  const account = Object.freeze({
    ...current,
    security: security(current.security, occurredAt),
    updatedAt: occurredAt,
  });
  return Object.freeze({ account, event: event(actor, account, current, permission, action, input) });
}

export function lockPlatformAdministrator(actor: PlatformAdministratorAuthorityContext, current: PlatformAdministratorAccount, input: PlatformAdministratorSecurityCommandInput): AdministratorMutationResult {
  return securityMutation(actor, current, input, LIFECYCLE_PERMISSIONS.lock, "administrator.security.locked", (security, occurredAt) => Object.freeze({ ...security, locked: true, sessionsTerminatedAt: occurredAt }));
}

export function requirePlatformAdministratorCredentialReset(actor: PlatformAdministratorAuthorityContext, current: PlatformAdministratorAccount, input: PlatformAdministratorSecurityCommandInput): AdministratorMutationResult {
  return securityMutation(actor, current, input, LIFECYCLE_PERMISSIONS.credentialReset, "administrator.security.credential-reset-required", (security, occurredAt) => Object.freeze({ ...security, credentialResetRequired: true, sessionsTerminatedAt: occurredAt }));
}

export function requirePlatformAdministratorMfa(actor: PlatformAdministratorAuthorityContext, current: PlatformAdministratorAccount, input: PlatformAdministratorSecurityCommandInput): AdministratorMutationResult {
  return securityMutation(actor, current, input, LIFECYCLE_PERMISSIONS.mfa, "administrator.security.mfa-required", (security, occurredAt) => Object.freeze({ ...security, mfaRequired: true, sessionsTerminatedAt: occurredAt }));
}

export function requirePlatformAdministratorReauthentication(actor: PlatformAdministratorAuthorityContext, current: PlatformAdministratorAccount, input: PlatformAdministratorSecurityCommandInput): AdministratorMutationResult {
  return securityMutation(actor, current, input, LIFECYCLE_PERMISSIONS.reauthenticate, "administrator.security.reauthentication-required", (security, occurredAt) => Object.freeze({ ...security, reauthenticationRequiredAfter: occurredAt, sessionsTerminatedAt: occurredAt }));
}

export function terminatePlatformAdministratorSessions(actor: PlatformAdministratorAuthorityContext, current: PlatformAdministratorAccount, input: PlatformAdministratorSecurityCommandInput): AdministratorMutationResult {
  return securityMutation(actor, current, input, LIFECYCLE_PERMISSIONS.terminateSessions, "administrator.security.sessions-terminated", (security, occurredAt) => Object.freeze({ ...security, sessionsTerminatedAt: occurredAt }));
}

export type PrivilegedAdministratorAccessDecision =
  | Readonly<{ readonly allowed: true }>
  | Readonly<{ readonly allowed: false; readonly reason: "administrator-disabled" | "administrator-removed" | "administrator-locked" | "credential-reset-required" | "mfa-required" | "recent-reauthentication-required" | "provider-account-disabled" | "provider-credential-revoked" }>;

export function evaluatePrivilegedAdministratorAccess(input: Readonly<{
  account: PlatformAdministratorAccount;
  provider: AuthenticationAccountSecuritySnapshot;
  authenticatedAt: string;
}>): PrivilegedAdministratorAccessDecision {
  if (input.account.status === "removed") return Object.freeze({ allowed: false as const, reason: "administrator-removed" as const });
  if (input.account.status === "disabled") return Object.freeze({ allowed: false as const, reason: "administrator-disabled" as const });
  if (input.account.security.locked) return Object.freeze({ allowed: false as const, reason: "administrator-locked" as const });
  if (input.account.security.credentialResetRequired) return Object.freeze({ allowed: false as const, reason: "credential-reset-required" as const });
  if (input.account.security.mfaRequired && !input.provider.mfaEnrolled) return Object.freeze({ allowed: false as const, reason: "mfa-required" as const });
  if (input.provider.disabled) return Object.freeze({ allowed: false as const, reason: "provider-account-disabled" as const });
  const authenticatedAt = lifecycleTimestamp(input.authenticatedAt, "Privileged authentication timestamp");
  if (input.provider.tokensValidAfter && Date.parse(authenticatedAt) < Date.parse(input.provider.tokensValidAfter)) {
    return Object.freeze({ allowed: false as const, reason: "provider-credential-revoked" as const });
  }
  const reauth = input.account.security.reauthenticationRequiredAfter;
  if (reauth && Date.parse(authenticatedAt) <= Date.parse(reauth)) {
    return Object.freeze({ allowed: false as const, reason: "recent-reauthentication-required" as const });
  }
  return Object.freeze({ allowed: true as const });
}

export function lifecyclePermissionKeys(): readonly AdminPermissionKey[] {
  return Object.freeze(Object.values(LIFECYCLE_PERMISSIONS).map(requireCataloguedAdminPermission));
}
