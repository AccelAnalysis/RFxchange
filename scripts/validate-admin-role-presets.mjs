import { readFile } from "node:fs/promises";

const presets = await readFile("src/domain/admin-authorization/role-presets.ts", "utf8");
const model = await readFile("src/domain/admin-authorization/model.ts", "utf8");
const repository = await readFile("src/domain/admin-authorization/role-preset-repository.ts", "utf8");
const firestore = await readFile("src/infrastructure/firestore/admin-role-preset-repository.ts", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(`Admin role preset validation failed: ${message}`);
}

for (const key of [
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
]) {
  assert(presets.includes(`\"${key}\"`), `missing required preset ${key}`);
}

assert(presets.includes("AdminRolePresetGrantTemplate"), "presets must be permission-grant collections");
assert(presets.includes("permissionsFromAdminRolePreset"), "effective permissions must resolve from preset grants");
assert(
  presets.includes("resolveAuthorityContextFromAdminRolePreset"),
  "role configuration must resolve into the existing permission evaluator",
);
assert(
  !model.includes('rolePresetKeys.includes("super-admin")') &&
    !model.includes('rolePresetKeys.includes("platform-administrator")'),
  "action authorization must not grant authority from role names",
);
assert(repository.includes("AdminRolePresetRepository"), "role presets require a persistence port");
assert(repository.includes("save(preset: AdminRolePreset)"), "role presets must be configurable/mutable through the persistence boundary");
assert(firestore.includes('ADMIN_ROLE_PRESET_COLLECTION = "adminRolePresets"'), "Firestore persistence must use the role preset collection");
assert(firestore.includes(".doc(preset.key).set"), "role preset configuration must persist by stable preset key");
assert(
  presets.includes('key: "technical-system-administrator"') &&
    !presets.match(/key: "technical-system-administrator"[\s\S]*?permissions: P\([\s\S]*?"credibility\./),
  "technical/system preset must not absorb credibility authority",
);

console.log("Wave 1.12 ADM-012/ADM-094 administrative role preset guardrails passed.");
