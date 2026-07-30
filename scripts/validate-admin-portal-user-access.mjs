import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ADMIN_PORTAL_SECTION_KEYS,
  ADMIN_PORTAL_SECTIONS,
  visibleAdminPortalSections,
} from "../src/application/admin/portal-navigation.ts";
import {
  defaultAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";

assert.equal(ADMIN_PORTAL_SECTION_KEYS.length, 19);
assert.equal(ADMIN_PORTAL_SECTIONS.length, 19);
assert.equal(new Set(ADMIN_PORTAL_SECTIONS.map((section) => section.href)).size, 19);
assert.ok(ADMIN_PORTAL_SECTIONS.every((section) => section.visibilityPermissions.length > 0));

const root = resolveAuthorityContextFromAdminRolePreset("guard-root", defaultAdminRolePreset("super-admin"));
const technical = resolveAuthorityContextFromAdminRolePreset("guard-tech", defaultAdminRolePreset("technical-system-administrator"));
assert.equal(visibleAdminPortalSections(root).length, 19);
assert.equal(visibleAdminPortalSections(technical).some((section) => section.key === "commerce"), false);
assert.equal(visibleAdminPortalSections(technical).some((section) => section.key === "integrations-system"), true);

const user360 = await readFile("src/application/admin/user-access-360.ts", "utf8");
for (const field of [
  "identity",
  "authenticationState",
  "memberships",
  "platformRole",
  "granularPermissions",
  "securityEvents",
  "invitations",
  "restrictions",
  "termsVersionsAccepted",
  "recentActions",
]) assert.match(user360, new RegExp(field));
assert.match(user360, /user\.profile\.read/);
assert.match(user360, /user\.access\.read/);

const repair = await readFile("src/application/admin/membership-repair.ts", "utf8");
assert.match(repair, /user\.access\.manage/);
assert.match(repair, /resolveUserOrganizationAccess/);
assert.match(repair, /route-to-account-resolution/);
assert.match(repair, /would orphan an active user/);

const model = await readFile("src/domain/admin-authorization/model.ts", "utf8");
assert.match(model, /user\.access\.manage/);
const presets = await readFile("src/domain/admin-authorization/role-presets.ts", "utf8");
assert.match(presets, /member-success-support-administrator/);
assert.match(presets, /user\.access\.manage/);

for (const component of [
  "src/components/admin/AdminPortalNavigation.tsx",
  "src/components/admin/AdminPortalShell.tsx",
  "src/components/admin/UserAccess360.tsx",
]) {
  const source = await readFile(component, "utf8");
  assert.ok(source.length > 0, `${component} must exist`);
}

console.log("ADM-057/ADM-067/ADM-069 admin portal and User & Access guardrails validated.");
