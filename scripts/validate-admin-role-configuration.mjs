import { readFile } from "node:fs/promises";

const configuration = await readFile("src/domain/admin-authorization/role-configuration.ts", "utf8");
const grants = await readFile("src/domain/admin-authorization/grants.ts", "utf8");
const repository = await readFile("src/domain/admin-authorization/role-configuration-repository.ts", "utf8");
const firestore = await readFile("src/infrastructure/firestore/admin-role-configuration-repository.ts", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(`Admin role configuration validation failed: ${message}`);
}

assert(configuration.includes("rolePresetKeys: readonly AdminRolePresetKey[]"), "configuration must support multiple role presets");
assert(configuration.includes("addedPermissions: readonly AdminPermissionKey[]"), "configuration must support explicit permission additions");
assert(configuration.includes("removedPermissions: readonly AdminPermissionKey[]"), "configuration must support explicit permission removals");
assert(configuration.includes("for (const key of configuration.rolePresetKeys)"), "effective permissions must compose all assigned roles");
assert(configuration.includes("for (const permission of configuration.addedPermissions) effective.add(permission)"), "direct additions must extend role bundles");
assert(configuration.includes("for (const permission of configuration.removedPermissions) effective.delete(permission)"), "explicit removals must override role bundles and additions");
assert(
  configuration.includes("createPlatformAdministratorAuthorityContext"),
  "multi-role composition must resolve into the existing permission authorization context",
);
assert(
  grants.includes("!context.effectivePermissions.includes(requirement.permission)"),
  "scoped grants must still respect the effective permission set after overrides",
);
assert(repository.includes("PlatformAdministratorRoleConfigurationRepository"), "source role configuration requires a repository port");
assert(firestore.includes('ADMIN_ROLE_CONFIGURATION_COLLECTION = "adminRoleConfigurations"'), "role configuration must have Firestore persistence");
assert(firestore.includes(".doc(configuration.administratorId)"), "one mutable role configuration must be keyed by administrator identity");

console.log("Wave 1.13 ADM-013 multi-role and permission override guardrails passed.");
