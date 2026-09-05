import assert from "node:assert/strict";
import test from "node:test";
import { scopeUserAccess360OrganizationData } from "../src/application/admin/user-access-360.ts";
import { visibleImplementedAdminRuntimeDestinations } from "../src/application/admin/portal-navigation.ts";
import { createAdminPermissionGrant } from "../src/domain/admin-authorization/grants.ts";
import { defaultAdminRolePreset, resolveAuthorityContextFromAdminRolePreset } from "../src/domain/admin-authorization/role-presets.ts";

const now = "2026-09-05T12:00:00.000Z";
const authority = resolveAuthorityContextFromAdminRolePreset("admin-scope-test", defaultAdminRolePreset("super-admin"));
const grant = (permission, scope, id) => createAdminPermissionGrant({ id, administratorId: authority.administratorId, permission, scope, createdAt: now });

test("User 360 excludes other organizations and mismatched authorization records", () => {
  const memberships = [
    { id: "a", userId: "user", organizationId: "org-a" },
    { id: "b", userId: "user", organizationId: "org-b" },
  ];
  const organizationAuthorizations = [
    { membershipId: "a", userId: "user", organizationId: "org-a", permissions: ["profile.edit"] },
    { membershipId: "b", userId: "user", organizationId: "org-b", permissions: ["private-b"] },
    { membershipId: "a", userId: "other-user", organizationId: "org-a", permissions: ["wrong-user"] },
  ];
  const data = scopeUserAccess360OrganizationData({ memberships, organizationAuthorizations }, { kind: "ORGANIZATION", targetId: "org-a", value: "ORGANIZATION:org-a" });
  assert.deepEqual(data.memberships, [memberships[0]]);
  assert.deepEqual(data.organizationAuthorizations, [organizationAuthorizations[0]]);
  assert.doesNotMatch(JSON.stringify(data), /org-b|private-b|wrong-user/);
  assert.deepEqual(scopeUserAccess360OrganizationData({ memberships, organizationAuthorizations }, { kind: "CASE", targetId: "a", value: "CASE:a" }).memberships, []);
});

test("Users navigation requires both permissions in the same authorized scope", () => {
  const grants = [grant("user.profile.read", "ORGANIZATION:org-a", "profile-a"), grant("user.access.read", "ORGANIZATION:org-b", "access-b")];
  assert.equal(visibleImplementedAdminRuntimeDestinations(authority, grants, now).some((item) => item.key === "users-access"), false);
  grants.push(grant("user.access.read", "ORGANIZATION:org-a", "access-a"));
  assert.deepEqual(visibleImplementedAdminRuntimeDestinations(authority, grants, now).filter((item) => item.key === "users-access").map((item) => item.scope.value), ["ORGANIZATION:org-a"]);
});

test("unimplemented geography Analytics does not appear as an available destination", () => {
  const destinations = visibleImplementedAdminRuntimeDestinations(authority, [grant("analytics.dashboard.read", "GEOGRAPHY:geo-a", "analytics-a")], now);
  assert.equal(destinations.some((item) => item.key === "analytics"), false);
});

test("geography verification grants do not advertise an unsupported credential directory", () => {
  const destinations = visibleImplementedAdminRuntimeDestinations(authority, [grant("credibility.organization.verify", "GEOGRAPHY:geo-a", "verification-a")], now);
  assert.equal(destinations.some((item) => item.key === "claims-verification" || item.key === "credibility"), false);
});
