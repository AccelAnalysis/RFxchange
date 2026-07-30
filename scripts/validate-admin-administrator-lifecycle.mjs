import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ADMIN_PERMISSION_CATALOG,
} from "../src/domain/admin-authorization/model.ts";
import {
  lifecyclePermissionKeys,
} from "../src/domain/admin-authorization/administrator-lifecycle.ts";
import {
  defaultAdminRolePreset,
  permissionsFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";

const required = [
  "admin.lifecycle.create",
  "admin.lifecycle.access.manage",
  "admin.lifecycle.disable",
  "admin.lifecycle.remove",
  "admin.security.lock",
  "admin.security.credential-reset.require",
  "admin.security.mfa.require",
  "admin.security.reauthentication.require",
  "admin.security.session.terminate",
];

const catalog = new Set(ADMIN_PERMISSION_CATALOG.map((definition) => definition.key));
assert.deepEqual(lifecyclePermissionKeys(), required);
for (const permission of required) assert.ok(catalog.has(permission), `${permission} must be catalogued`);

const superPermissions = new Set(permissionsFromAdminRolePreset(defaultAdminRolePreset("super-admin")));
const ordinaryPermissions = new Set(permissionsFromAdminRolePreset(defaultAdminRolePreset("platform-administrator")));
for (const permission of required) {
  assert.ok(superPermissions.has(permission), `Super Admin must receive ${permission}`);
  assert.equal(ordinaryPermissions.has(permission), false, `Platform Administrator must not default to ${permission}`);
}

const lifecycle = await readFile("src/domain/admin-authorization/administrator-lifecycle.ts", "utf8");
assert.equal(/firebase-admin|firebase\//.test(lifecycle), false, "administrator lifecycle domain must remain provider-independent");
assert.match(lifecycle, /protectedAccount/);
assert.match(lifecycle, /must be disabled before removal/);
assert.match(lifecycle, /PlatformAdministratorLifecycleEvent/);
assert.match(lifecycle, /evaluatePrivilegedAdministratorAccess/);

const firebaseAdapter = await readFile("src/infrastructure/auth/firebase-privileged-administrator-security.ts", "utf8");
assert.match(firebaseAdapter, /FirebaseAccountSecurityService/);
assert.match(firebaseAdapter, /revokeSessions/);
assert.match(firebaseAdapter, /disable/);

const firestoreAdapter = await readFile("src/infrastructure/firestore/admin-lifecycle-repository.ts", "utf8");
assert.match(firestoreAdapter, /platformAdministrators/);
assert.match(firestoreAdapter, /platformAdministratorLifecycleEvents/);
assert.match(firestoreAdapter, /transaction\.create|transaction\.create/);

console.log("ADM-016/ADM-017 administrator lifecycle and privileged-security guardrails validated.");
