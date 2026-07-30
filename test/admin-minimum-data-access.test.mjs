import test from "node:test";
import assert from "node:assert/strict";

import { createPlatformAdministratorAuthorityContext } from "../src/domain/admin-authorization/model.ts";
import {
  ADMINISTRATIVE_DATA_CLASSES,
  ADMINISTRATIVE_DATA_CLASS_PERMISSIONS,
  authorizeAdministrativeDataAccess,
} from "../src/domain/admin-authorization/minimum-data-access.ts";
import {
  defaultAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";

const platformAdmin = resolveAuthorityContextFromAdminRolePreset(
  "admin-ops",
  defaultAdminRolePreset("platform-administrator"),
);

test("ADM-090 defines distinct permission for every administrative data class", () => {
  assert.equal(ADMINISTRATIVE_DATA_CLASSES.length, 6);
  assert.equal(new Set(Object.values(ADMINISTRATIVE_DATA_CLASS_PERMISSIONS)).size, 6);
});

test("routine profile authority can read profiles but not unrelated sensitive evidence", () => {
  assert.equal(authorizeAdministrativeDataAccess(platformAdmin, "organization-profile").kind, "allow");
  for (const dataClass of [
    "private-organization-document",
    "verification-evidence",
    "payment-metadata",
    "private-rfx-evidence",
    "complaint-evidence",
  ]) {
    const decision = authorizeAdministrativeDataAccess(platformAdmin, dataClass);
    assert.equal(decision.kind, "deny", dataClass);
    assert.equal(decision.reason, "permission-not-granted", dataClass);
  }
});

test("profile update capability alone does not imply any sensitive read capability", () => {
  const editor = createPlatformAdministratorAuthorityContext({
    administratorId: "admin-profile-editor",
    rolePresetKeys: ["custom-profile-editor"],
    effectivePermissions: ["organization.profile.read", "organization.profile.update"],
  });
  assert.equal(authorizeAdministrativeDataAccess(editor, "organization-profile").kind, "allow");
  assert.equal(authorizeAdministrativeDataAccess(editor, "verification-evidence").kind, "deny");
  assert.equal(authorizeAdministrativeDataAccess(editor, "payment-metadata").kind, "deny");
  assert.equal(authorizeAdministrativeDataAccess(editor, "private-rfx-evidence").kind, "deny");
  assert.equal(authorizeAdministrativeDataAccess(editor, "complaint-evidence").kind, "deny");
});

test("each sensitive data class can be granted independently without granting the others", () => {
  for (const dataClass of ADMINISTRATIVE_DATA_CLASSES.filter((value) => value !== "organization-profile")) {
    const permission = ADMINISTRATIVE_DATA_CLASS_PERMISSIONS[dataClass];
    const context = createPlatformAdministratorAuthorityContext({
      administratorId: `admin-${dataClass}`,
      rolePresetKeys: ["minimum-data-test"],
      effectivePermissions: [permission],
    });
    assert.equal(authorizeAdministrativeDataAccess(context, dataClass).kind, "allow", dataClass);
    for (const other of ADMINISTRATIVE_DATA_CLASSES.filter((value) => value !== dataClass)) {
      assert.equal(authorizeAdministrativeDataAccess(context, other).kind, "deny", `${dataClass} must not imply ${other}`);
    }
  }
});

test("Super Admin catalog breadth is explicit rather than data-class implication", () => {
  const root = resolveAuthorityContextFromAdminRolePreset("admin-root", defaultAdminRolePreset("super-admin"));
  for (const dataClass of ADMINISTRATIVE_DATA_CLASSES) {
    assert.equal(authorizeAdministrativeDataAccess(root, dataClass).kind, "allow", dataClass);
  }
});
