import test from "node:test";
import assert from "node:assert/strict";

import {
  ADMIN_PERMISSION_CATALOG,
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
} from "../src/domain/admin-authorization/model.ts";
import {
  ADMIN_ROLE_PRESET_KEYS,
  DEFAULT_ADMIN_ROLE_PRESETS,
  createAdminRolePreset,
  defaultAdminRolePreset,
  permissionsFromAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";

const timestamp = "2026-07-29T12:00:00.000Z";

test("defines all ten required configurable platform role presets", () => {
  assert.deepEqual(ADMIN_ROLE_PRESET_KEYS, [
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
  ]);
  assert.equal(DEFAULT_ADMIN_ROLE_PRESETS.length, 10);
  assert.equal(new Set(DEFAULT_ADMIN_ROLE_PRESETS.map((preset) => preset.key)).size, 10);
  for (const preset of DEFAULT_ADMIN_ROLE_PRESETS) {
    assert.ok(preset.displayName.length > 0);
    assert.ok(preset.description.length > 0);
    assert.ok(preset.grants.length > 0);
    assert.ok(preset.grants.every((grant) => grant.scope === "GLOBAL"));
  }
});

test("Super Admin starts with the complete current permission catalog", () => {
  const expected = new Set(ADMIN_PERMISSION_CATALOG.map((definition) => definition.key));
  const actual = new Set(permissionsFromAdminRolePreset(defaultAdminRolePreset("super-admin")));
  assert.deepEqual(actual, expected);
});

test("Technical/System does not inherit marketplace, credibility, or commerce authority", () => {
  const permissions = permissionsFromAdminRolePreset(defaultAdminRolePreset("technical-system-administrator"));
  assert.ok(permissions.includes("system.health.read"));
  assert.ok(permissions.includes("system.maintenance.request"));
  assert.equal(permissions.some((permission) => permission.startsWith("credibility.")), false);
  assert.equal(permissions.some((permission) => permission.startsWith("commerce.")), false);
  assert.equal(permissions.some((permission) => permission.startsWith("rfx.")), false);
});

test("Analyst/Auditor remains read-only", () => {
  const permissions = permissionsFromAdminRolePreset(defaultAdminRolePreset("analyst-auditor"));
  for (const permission of permissions) {
    assert.equal(
      /\.(update|review|request|award|issue|suspend|restore|revoke|correct|invalidate)$/.test(permission),
      false,
      `${permission} must not be an operating mutation in Analyst/Auditor`,
    );
  }
  assert.ok(permissions.includes("analytics.dashboard.read"));
  assert.ok(permissions.includes("audit.event.read"));
});

test("authorization evaluates effective permissions rather than hard-coded role names", () => {
  const original = createAdminRolePreset({
    key: "platform-administrator",
    displayName: "Platform Administrator",
    description: "Configurable test bundle",
    permissions: ["organization.profile.read"],
    createdAt: timestamp,
  });
  const expanded = createAdminRolePreset({
    key: "platform-administrator",
    displayName: "Platform Administrator",
    description: "Configurable test bundle",
    permissions: ["organization.profile.read", "support.case.update"],
    createdAt: timestamp,
    updatedAt: "2026-07-29T13:00:00.000Z",
  });
  const requirement = createAdministrativeActionRequirement({ permission: "support.case.update" });

  assert.equal(
    authorizeAdministrativeAction(resolveAuthorityContextFromAdminRolePreset("admin-1", original), requirement).kind,
    "deny",
  );
  assert.equal(
    authorizeAdministrativeAction(resolveAuthorityContextFromAdminRolePreset("admin-1", expanded), requirement).kind,
    "allow",
  );
});

test("role preset creation rejects unknown presets, permissions, empty bundles, and time regression", () => {
  assert.throws(
    () => createAdminRolePreset({ key: "root", displayName: "Root", description: "No", permissions: ["audit.event.read"], createdAt: timestamp }),
    /Unknown administrative role preset/,
  );
  assert.throws(
    () => createAdminRolePreset({ key: "analyst-auditor", displayName: "Analyst", description: "No", permissions: ["made.up.permission"], createdAt: timestamp }),
    /not in the catalog/,
  );
  assert.throws(
    () => createAdminRolePreset({ key: "analyst-auditor", displayName: "Analyst", description: "No", permissions: [], createdAt: timestamp }),
    /at least one permission/,
  );
  assert.throws(
    () => createAdminRolePreset({ key: "analyst-auditor", displayName: "Analyst", description: "No", permissions: ["audit.event.read"], createdAt: timestamp, updatedAt: "2026-07-29T11:00:00.000Z" }),
    /cannot precede creation/,
  );
});
