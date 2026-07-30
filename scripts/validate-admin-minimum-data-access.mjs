import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ADMINISTRATIVE_DATA_CLASSES,
  ADMINISTRATIVE_DATA_CLASS_PERMISSIONS,
  authorizeAdministrativeDataAccess,
} from "../src/domain/admin-authorization/minimum-data-access.ts";
import {
  defaultAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";

assert.equal(ADMINISTRATIVE_DATA_CLASSES.length, 6);
assert.equal(new Set(Object.values(ADMINISTRATIVE_DATA_CLASS_PERMISSIONS)).size, 6);

const operations = resolveAuthorityContextFromAdminRolePreset("guard-ops", defaultAdminRolePreset("platform-administrator"));
assert.equal(authorizeAdministrativeDataAccess(operations, "organization-profile").kind, "allow");
for (const dataClass of [
  "private-organization-document",
  "verification-evidence",
  "payment-metadata",
  "private-rfx-evidence",
  "complaint-evidence",
]) {
  assert.equal(authorizeAdministrativeDataAccess(operations, dataClass).kind, "deny", dataClass);
}

const model = await readFile("src/domain/admin-authorization/model.ts", "utf8");
for (const permission of Object.values(ADMINISTRATIVE_DATA_CLASS_PERMISSIONS)) {
  assert.match(model, new RegExp(permission.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const policy = await readFile("src/domain/admin-authorization/minimum-data-access.ts", "utf8");
assert.equal(/firebase-admin|firebase\//.test(policy), false, "minimum-data access policy must remain provider-independent");
assert.match(policy, /permission-not-granted/);
assert.match(policy, /authorizeAdministrativeAction/);

console.log("ADM-090 minimum-necessary administrative data permission guardrails validated.");
