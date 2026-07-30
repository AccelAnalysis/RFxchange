import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ADMINISTRATIVE_SEPARATION_INVARIANTS,
  MARKETPLACE_ADMIN_PROHIBITED_ACTIONS,
  RESERVED_SUPER_ADMIN_ACTIONS,
  RESERVED_SUPER_ADMIN_REQUIREMENTS,
  authorizeAdministrativeBoundaryAction,
} from "../src/domain/admin-authorization/authority-boundaries.ts";
import {
  defaultAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";

const root = resolveAuthorityContextFromAdminRolePreset("guard-root", defaultAdminRolePreset("super-admin"));
const operations = resolveAuthorityContextFromAdminRolePreset("guard-ops", defaultAdminRolePreset("platform-administrator"));
const technical = resolveAuthorityContextFromAdminRolePreset("guard-tech", defaultAdminRolePreset("technical-system-administrator"));

assert.equal(RESERVED_SUPER_ADMIN_ACTIONS.length, 14);
for (const action of RESERVED_SUPER_ADMIN_ACTIONS) {
  assert.ok(RESERVED_SUPER_ADMIN_REQUIREMENTS[action].length >= 3);
  assert.equal(authorizeAdministrativeBoundaryAction(root, action).kind, "allow");
  assert.equal(authorizeAdministrativeBoundaryAction(operations, action).kind, "deny");
}
for (const action of MARKETPLACE_ADMIN_PROHIBITED_ACTIONS) {
  assert.equal(authorizeAdministrativeBoundaryAction(root, action).kind, "deny");
}
assert.equal(ADMINISTRATIVE_SEPARATION_INVARIANTS.length, 9);

for (const permission of [
  "credibility.organization.verify",
  "commerce.adjustment.review",
  "rfx.moderation.review",
  "admin.lifecycle.remove",
]) {
  assert.equal(technical.effectivePermissions.includes(permission), false, `technical role must not default to ${permission}`);
}

const domain = await readFile("src/domain/admin-authorization/authority-boundaries.ts", "utf8");
assert.equal(/rolePresetKeys\.includes|===\s*["']super-admin["']/.test(domain), false, "boundary authorization must not hard-code a role name");
assert.match(domain, /issuer-authority-required/);
assert.match(domain, /separation-of-authority/);
assert.match(domain, /missingPermissions/);

const service = await readFile("src/application/admin/authority-boundary-service.ts", "utf8");
assert.match(service, /events\.append/);
const repository = await readFile("src/infrastructure/firestore/admin-authority-boundary-repository.ts", "utf8");
assert.match(repository, /adminAuthorityBoundaryEvents/);
assert.match(repository, /transaction\.create/);

console.log("ADM-019/021/033/049/095 administrative authority boundary guardrails validated.");
