import {
  createPlatformAdministratorAuthorityContext,
  platformAdministratorId,
  requireCataloguedAdminPermission,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
  type PlatformAdministratorId,
} from "./model.ts";
import {
  adminRolePresetKey,
  permissionsFromAdminRolePreset,
  type AdminRolePreset,
  type AdminRolePresetKey,
} from "./role-presets.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };
export type AdminRoleConfigurationTimestamp = Brand<string, "AdminRoleConfigurationTimestamp">;

export interface PlatformAdministratorRoleConfiguration {
  readonly administratorId: PlatformAdministratorId;
  readonly rolePresetKeys: readonly AdminRolePresetKey[];
  readonly addedPermissions: readonly AdminPermissionKey[];
  readonly removedPermissions: readonly AdminPermissionKey[];
  readonly createdAt: AdminRoleConfigurationTimestamp;
  readonly updatedAt: AdminRoleConfigurationTimestamp;
}

export interface CreatePlatformAdministratorRoleConfigurationInput {
  readonly administratorId: string;
  readonly rolePresetKeys: readonly string[];
  readonly addedPermissions?: readonly string[];
  readonly removedPermissions?: readonly string[];
  readonly createdAt: string;
  readonly updatedAt?: string;
}

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function timestamp(value: string, field: string): AdminRoleConfigurationTimestamp {
  const normalized = requiredValue(value, field);
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString() as AdminRoleConfigurationTimestamp;
}

function uniqueRoleKeys(values: readonly string[]): readonly AdminRolePresetKey[] {
  const keys = [...new Set(values.map(adminRolePresetKey))];
  if (keys.length === 0) {
    throw new Error("Platform administrator role configuration requires at least one role preset.");
  }
  return Object.freeze(keys);
}

function uniquePermissions(values: readonly string[] = []): readonly AdminPermissionKey[] {
  return Object.freeze([...new Set(values.map(requireCataloguedAdminPermission))]);
}

export function createPlatformAdministratorRoleConfiguration(
  input: CreatePlatformAdministratorRoleConfigurationInput,
): PlatformAdministratorRoleConfiguration {
  const createdAt = timestamp(input.createdAt, "Administrator role configuration creation timestamp");
  const updatedAt = timestamp(
    input.updatedAt ?? input.createdAt,
    "Administrator role configuration update timestamp",
  );
  if (Date.parse(updatedAt) < Date.parse(createdAt)) {
    throw new Error("Administrator role configuration update cannot precede creation.");
  }

  return Object.freeze({
    administratorId: platformAdministratorId(input.administratorId),
    rolePresetKeys: uniqueRoleKeys(input.rolePresetKeys),
    addedPermissions: uniquePermissions(input.addedPermissions),
    removedPermissions: uniquePermissions(input.removedPermissions),
    createdAt,
    updatedAt,
  });
}

function presetMap(presets: readonly AdminRolePreset[]): ReadonlyMap<AdminRolePresetKey, AdminRolePreset> {
  const map = new Map<AdminRolePresetKey, AdminRolePreset>();
  for (const preset of presets) {
    if (map.has(preset.key)) throw new Error(`Duplicate administrative role preset supplied: ${preset.key}.`);
    map.set(preset.key, preset);
  }
  return map;
}

export function resolveEffectiveAdminPermissions(
  configuration: PlatformAdministratorRoleConfiguration,
  presets: readonly AdminRolePreset[],
): readonly AdminPermissionKey[] {
  const available = presetMap(presets);
  const effective = new Set<AdminPermissionKey>();

  for (const key of configuration.rolePresetKeys) {
    const preset = available.get(key);
    if (!preset) throw new Error(`Assigned administrative role preset is unavailable: ${key}.`);
    for (const permission of permissionsFromAdminRolePreset(preset)) effective.add(permission);
  }

  for (const permission of configuration.addedPermissions) effective.add(permission);

  // Explicit per-administrator removal is authoritative over both role bundles and additions.
  for (const permission of configuration.removedPermissions) effective.delete(permission);

  return Object.freeze([...effective]);
}

export function resolveAuthorityContextFromAdminRoleConfiguration(
  configuration: PlatformAdministratorRoleConfiguration,
  presets: readonly AdminRolePreset[],
): PlatformAdministratorAuthorityContext {
  return createPlatformAdministratorAuthorityContext({
    administratorId: configuration.administratorId,
    rolePresetKeys: configuration.rolePresetKeys,
    effectivePermissions: resolveEffectiveAdminPermissions(configuration, presets),
    scopeSatisfied: true,
  });
}
