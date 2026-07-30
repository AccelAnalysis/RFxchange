import {
  ADMIN_PERMISSION_CATALOG,
  createPlatformAdministratorAuthorityContext,
  requireCataloguedAdminPermission,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
} from "./model.ts";

export const ADMIN_ROLE_PRESET_KEYS = [
  "super-admin",
  "platform-administrator",
  "trust-safety-administrator",
  "verification-credibility-administrator",
  "rfx-marketplace-administrator",
  "commerce-administrator",
  "member-success-support-administrator",
  "geography-institutional-administrator",
  "technical-system-administrator",
  "analyst-auditor",
] as const;

export type AdminRolePresetKey = (typeof ADMIN_ROLE_PRESET_KEYS)[number];
export type AdminRolePresetTimestamp = string & { readonly __brand: "AdminRolePresetTimestamp" };

export interface AdminRolePresetGrantTemplate {
  readonly permission: AdminPermissionKey;
  readonly scope: "GLOBAL";
  readonly conditionKeys: readonly string[];
}

export interface AdminRolePreset {
  readonly key: AdminRolePresetKey;
  readonly displayName: string;
  readonly description: string;
  readonly grants: readonly AdminRolePresetGrantTemplate[];
  readonly createdAt: AdminRolePresetTimestamp;
  readonly updatedAt: AdminRolePresetTimestamp;
}

export interface CreateAdminRolePresetInput {
  readonly key: string;
  readonly displayName: string;
  readonly description: string;
  readonly permissions: readonly string[];
  readonly createdAt: string;
  readonly updatedAt?: string;
}

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function presetTimestamp(value: string, field: string): AdminRolePresetTimestamp {
  const normalized = requiredValue(value, field);
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString() as AdminRolePresetTimestamp;
}

export function adminRolePresetKey(value: string): AdminRolePresetKey {
  const normalized = requiredValue(value, "Administrative role preset key");
  if (!(ADMIN_ROLE_PRESET_KEYS as readonly string[]).includes(normalized)) {
    throw new Error(`Unknown administrative role preset: ${normalized}.`);
  }
  return normalized as AdminRolePresetKey;
}

function uniquePermissions(values: readonly string[]): readonly AdminPermissionKey[] {
  const permissions = [...new Set(values.map(requireCataloguedAdminPermission))];
  if (permissions.length === 0) throw new Error("Administrative role preset requires at least one permission.");
  return Object.freeze(permissions);
}

export function createAdminRolePreset(input: CreateAdminRolePresetInput): AdminRolePreset {
  const createdAt = presetTimestamp(input.createdAt, "Role preset creation timestamp");
  const updatedAt = presetTimestamp(input.updatedAt ?? input.createdAt, "Role preset update timestamp");
  if (Date.parse(updatedAt) < Date.parse(createdAt)) {
    throw new Error("Role preset update timestamp cannot precede creation.");
  }

  return Object.freeze({
    key: adminRolePresetKey(input.key),
    displayName: requiredValue(input.displayName, "Role preset display name"),
    description: requiredValue(input.description, "Role preset description"),
    grants: Object.freeze(
      uniquePermissions(input.permissions).map((permission) =>
        Object.freeze({ permission, scope: "GLOBAL" as const, conditionKeys: Object.freeze([]) }),
      ),
    ),
    createdAt,
    updatedAt,
  });
}

export function permissionsFromAdminRolePreset(preset: AdminRolePreset): readonly AdminPermissionKey[] {
  return Object.freeze([...new Set(preset.grants.map((grant) => grant.permission))]);
}

export function resolveAuthorityContextFromAdminRolePreset(
  administratorId: string,
  preset: AdminRolePreset,
): PlatformAdministratorAuthorityContext {
  return createPlatformAdministratorAuthorityContext({
    administratorId,
    rolePresetKeys: [preset.key],
    effectivePermissions: permissionsFromAdminRolePreset(preset),
    scopeSatisfied: true,
  });
}

const ALL_PERMISSIONS = ADMIN_PERMISSION_CATALOG.map((definition) => definition.key);
const P = (...permissions: string[]): readonly string[] => Object.freeze(permissions);

const DEFAULT_PRESET_INPUTS = [
  {
    key: "super-admin",
    displayName: "Super Admin",
    description: "Platform ownership, authority, security and governance.",
    permissions: ALL_PERMISSIONS,
  },
  {
    key: "platform-administrator",
    displayName: "Platform Administrator",
    description: "Broad delegated day-to-day platform operations without reserved sensitive authority.",
    permissions: P(
      "admin.authority.read", "admin.permission.catalog.read", "organization.profile.read",
      "organization.profile.update", "user.profile.read", "user.access.read", "rfx.record.read",
      "rfx.moderation.review", "provider.application.read", "provider.application.review",
      "referral.record.read", "referral.case.review", "geography.definition.read",
      "geography.release.read", "support.case.read", "support.case.update", "trust.report.read",
      "trust.case.review", "analytics.dashboard.read", "audit.event.read", "system.health.read",
    ),
  },
  {
    key: "trust-safety-administrator",
    displayName: "Trust & Safety Administrator",
    description: "Integrity reports, investigations, restrictions and trust operations.",
    permissions: P(
      "organization.profile.read", "user.profile.read", "user.access.read", "rfx.record.read",
      "referral.record.read", "support.case.read", "support.case.update", "trust.report.read",
      "trust.case.review", "audit.event.read",
    ),
  },
  {
    key: "verification-credibility-administrator",
    displayName: "Verification & Credibility Administrator",
    description: "Organization verification, credibility records, badges and endorsements.",
    permissions: P(
      "organization.profile.read", "credibility.organization.verify",
      "credibility.organization.deny-verification", "credibility.badge.award",
      "credibility.endorsement.issue", "credibility.badge.suspend", "credibility.badge.restore",
      "credibility.badge.revoke", "credibility.record.correct", "credibility.appeal.review",
      "credibility.activity.invalidate", "credibility.transaction.invalidate",
      "credibility.endorsement-authority.suspend", "credibility.endorsement-authority.restore",
      "audit.event.read",
    ),
  },
  {
    key: "rfx-marketplace-administrator",
    displayName: "RFx & Marketplace Administrator",
    description: "RFx workflow and marketplace-process operations without issuer award authority.",
    permissions: P(
      "organization.profile.read", "rfx.record.read", "rfx.moderation.review",
      "referral.record.read", "referral.case.review", "support.case.read", "audit.event.read",
    ),
  },
  {
    key: "commerce-administrator",
    displayName: "Commerce Administrator",
    description: "Membership, billing, ledger and financial operations within explicit commerce authority.",
    permissions: P(
      "organization.profile.read", "user.profile.read", "commerce.account.read",
      "commerce.adjustment.review", "support.case.read", "audit.event.read",
    ),
  },
  {
    key: "member-success-support-administrator",
    displayName: "Member Success & Support Administrator",
    description: "Onboarding, support, permitted profile correction and customer-success operations.",
    permissions: P(
      "organization.profile.read", "organization.profile.update", "user.profile.read",
      "user.access.read", "provider.application.read", "support.case.read", "support.case.update",
      "audit.event.read",
    ),
  },
  {
    key: "geography-institutional-administrator",
    displayName: "Geography & Institutional Administrator",
    description: "Locality, geography and institutional-program operations.",
    permissions: P(
      "organization.profile.read", "geography.definition.read", "geography.release.read",
      "analytics.dashboard.read", "support.case.read", "audit.event.read",
    ),
  },
  {
    key: "technical-system-administrator",
    displayName: "Technical / System Administrator",
    description: "Infrastructure, configuration and maintenance operations without marketplace authority.",
    permissions: P(
      "config.value.read", "config.history.read", "system.health.read",
      "system.maintenance.request", "audit.event.read",
    ),
  },
  {
    key: "analyst-auditor",
    displayName: "Analyst / Auditor",
    description: "Read-only administrative analytics and audit visibility.",
    permissions: P(
      "platform.policy.read", "admin.authority.read", "admin.permission.catalog.read",
      "config.value.read", "config.history.read", "organization.profile.read", "user.profile.read",
      "user.access.read", "rfx.record.read", "provider.application.read", "referral.record.read",
      "commerce.account.read", "geography.definition.read", "geography.release.read",
      "support.case.read", "trust.report.read", "analytics.dashboard.read", "audit.event.read",
      "system.health.read",
    ),
  },
] as const;

const DEFAULT_PRESET_TIMESTAMP = "2026-07-29T00:00:00.000Z";

export const DEFAULT_ADMIN_ROLE_PRESETS: readonly AdminRolePreset[] = Object.freeze(
  DEFAULT_PRESET_INPUTS.map((input) =>
    createAdminRolePreset({ ...input, createdAt: DEFAULT_PRESET_TIMESTAMP }),
  ),
);

export function defaultAdminRolePreset(key: AdminRolePresetKey): AdminRolePreset {
  const preset = DEFAULT_ADMIN_ROLE_PRESETS.find((candidate) => candidate.key === key);
  if (!preset) throw new Error(`Default administrative role preset is missing: ${key}.`);
  return preset;
}
