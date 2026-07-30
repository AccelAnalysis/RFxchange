import test from "node:test";
import assert from "node:assert/strict";

import { createAdminPermissionGrant, createScopedAdministrativeActionRequirement, authorizeScopedAdministrativeAction } from "../src/domain/admin-authorization/grants.ts";
import {
  createPlatformAdministratorRoleConfiguration,
  resolveAuthorityContextFromAdminRoleConfiguration,
  resolveEffectiveAdminPermissions,
} from "../src/domain/admin-authorization/role-configuration.ts";
import { DEFAULT_ADMIN_ROLE_PRESETS } from "../src/domain/admin-authorization/role-presets.ts";

const createdAt = "2026-07-29T12:00:00.000Z";

function configuration(overrides = {}) {
  return createPlatformAdministratorRoleConfiguration({
    administratorId: "admin-1",
    rolePresetKeys: ["member-success-support-administrator"],
    createdAt,
    ...overrides,
  });
}

test("one administrator can combine multiple role presets", () => {
  const config = configuration({
    rolePresetKeys: ["member-success-support-administrator", "commerce-administrator"],
  });
  const permissions = resolveEffectiveAdminPermissions(config, DEFAULT_ADMIN_ROLE_PRESETS);
  assert.ok(permissions.includes("support.case.update"));
  assert.ok(permissions.includes("commerce.adjustment.review"));
  assert.deepEqual(config.rolePresetKeys, [
    "member-success-support-administrator",
    "commerce-administrator",
  ]);
});

test("duplicate role assignments collapse to stable unique preset keys", () => {
  const config = configuration({
    rolePresetKeys: ["commerce-administrator", "commerce-administrator", "analyst-auditor"],
  });
  assert.deepEqual(config.rolePresetKeys, ["commerce-administrator", "analyst-auditor"]);
});

test("explicit additions extend a preset without cloning a new role", () => {
  const config = configuration({ addedPermissions: ["commerce.adjustment.review"] });
  const permissions = resolveEffectiveAdminPermissions(config, DEFAULT_ADMIN_ROLE_PRESETS);
  assert.ok(permissions.includes("support.case.update"));
  assert.ok(permissions.includes("commerce.adjustment.review"));
});

test("explicit removals override both preset and direct additions", () => {
  const config = configuration({
    addedPermissions: ["support.case.update", "commerce.adjustment.review"],
    removedPermissions: ["support.case.update"],
  });
  const permissions = resolveEffectiveAdminPermissions(config, DEFAULT_ADMIN_ROLE_PRESETS);
  assert.equal(permissions.includes("support.case.update"), false);
  assert.ok(permissions.includes("commerce.adjustment.review"));
});

test("a scoped grant cannot bypass an explicit permission removal", () => {
  const config = configuration({ removedPermissions: ["support.case.update"] });
  const context = resolveAuthorityContextFromAdminRoleConfiguration(config, DEFAULT_ADMIN_ROLE_PRESETS);
  const grant = createAdminPermissionGrant({
    id: "grant-1",
    administratorId: "admin-1",
    permission: "support.case.update",
    scope: "GLOBAL",
    createdAt,
  });
  const requirement = createScopedAdministrativeActionRequirement({
    permission: "support.case.update",
    access: "write",
    scope: "ORGANIZATION:org-1",
  });
  const decision = authorizeScopedAdministrativeAction(context, [grant], requirement, { now: createdAt });
  assert.deepEqual(decision.reason, "permission-not-granted");
});

test("role composition fails closed for missing assigned preset configuration", () => {
  const config = configuration({ rolePresetKeys: ["commerce-administrator"] });
  const withoutCommerce = DEFAULT_ADMIN_ROLE_PRESETS.filter((preset) => preset.key !== "commerce-administrator");
  assert.throws(
    () => resolveEffectiveAdminPermissions(config, withoutCommerce),
    /Assigned administrative role preset is unavailable/,
  );
});

test("configuration validates catalog values, requires a role, and prevents timestamp regression", () => {
  assert.throws(
    () => configuration({ rolePresetKeys: [] }),
    /at least one role preset/,
  );
  assert.throws(
    () => configuration({ addedPermissions: ["unknown.namespace.permission"] }),
    /(Unsupported administrative permission namespace|not in the catalog)/,
  );
  assert.throws(
    () => configuration({ updatedAt: "2026-07-29T11:59:59.000Z" }),
    /cannot precede creation/,
  );
});
