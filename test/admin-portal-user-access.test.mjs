import test from "node:test";
import assert from "node:assert/strict";

import {
  ADMIN_PORTAL_SECTION_KEYS,
  assertAdminPortalSectionAccess,
  visibleAdminPortalSections,
} from "../src/application/admin/portal-navigation.ts";
import { buildUserAccess360 } from "../src/application/admin/user-access-360.ts";
import {
  assertAdministrativeMembershipDeactivationSafe,
  planAdministrativeMembershipDeactivation,
} from "../src/application/admin/membership-repair.ts";
import {
  createOrganizationAccount,
  createOrganizationProfile,
} from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";
import {
  defaultAdminRolePreset,
  permissionsFromAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";

const root = resolveAuthorityContextFromAdminRolePreset("admin-root", defaultAdminRolePreset("super-admin"));
const operations = resolveAuthorityContextFromAdminRolePreset("admin-ops", defaultAdminRolePreset("platform-administrator"));
const support = resolveAuthorityContextFromAdminRolePreset("admin-support", defaultAdminRolePreset("member-success-support-administrator"));
const technical = resolveAuthorityContextFromAdminRolePreset("admin-tech", defaultAdminRolePreset("technical-system-administrator"));
const now = "2026-07-30T16:00:00.000Z";

function fixture() {
  const user = createUserIdentity({
    id: "user-1",
    name: "Avery Carter",
    primaryEmail: "avery@example.com",
    loginProvider: "firebase",
    loginSubject: "firebase-user-1",
    mfaEnabled: true,
    now,
  });
  const orgA = createOrganizationAccount({ id: "org-a", now });
  const orgB = createOrganizationAccount({ id: "org-b", now });
  const profileA = createOrganizationProfile(orgA, { id: "profile-a", displayName: "Alpha Works", now });
  const profileB = createOrganizationProfile(orgB, { id: "profile-b", displayName: "Beta Works", now });
  const membershipA = createOrganizationMembership(user, orgA, { id: "membership-a", now });
  const membershipB = createOrganizationMembership(user, orgB, { id: "membership-b", now });
  return { user, orgA, orgB, profileA, profileB, membershipA, membershipB };
}

test("admin portal defines all 19 specification sections and Super Admin can reach all", () => {
  assert.equal(ADMIN_PORTAL_SECTION_KEYS.length, 19);
  assert.deepEqual(visibleAdminPortalSections(root).map((section) => section.key), ADMIN_PORTAL_SECTION_KEYS);
});

test("navigation hides unauthorized domains and server guard blocks them", () => {
  const visible = visibleAdminPortalSections(technical).map((section) => section.key);
  assert.ok(visible.includes("integrations-system"));
  assert.ok(visible.includes("policies-configuration"));
  assert.ok(visible.includes("audit-security"));
  assert.equal(visible.includes("commerce"), false);
  assert.equal(visible.includes("credibility"), false);
  assert.equal(visible.includes("rfx-opportunities"), false);
  assert.throws(() => assertAdminPortalSectionAccess(technical, "commerce"), /access denied/);
  assert.equal(assertAdminPortalSectionAccess(technical, "integrations-system").key, "integrations-system");
});

test("operating admin presets receive user access repair while analyst remains read-only", () => {
  assert.ok(permissionsFromAdminRolePreset(defaultAdminRolePreset("platform-administrator")).includes("user.access.manage"));
  assert.ok(permissionsFromAdminRolePreset(defaultAdminRolePreset("member-success-support-administrator")).includes("user.access.manage"));
  assert.equal(permissionsFromAdminRolePreset(defaultAdminRolePreset("analyst-auditor")).includes("user.access.manage"), false);
});

test("User & Access 360 requires both profile and access visibility and exposes required context", () => {
  const f = fixture();
  const view = buildUserAccess360(operations, {
    user: f.user,
    memberships: [f.membershipA, f.membershipB],
    organizationProfiles: [f.profileA, f.profileB],
    organizationAuthorizations: [],
    lastLoginAt: "2026-07-30T15:55:00.000Z",
    securityEvents: [{ type: "login", occurredAt: now, detail: "Successful login" }],
    invitations: [{ id: "invite-1", organizationId: f.orgA.id, status: "accepted", invitedAt: now }],
    recentActions: [{ action: "profile.viewed", occurredAt: now, target: f.user.id }],
  });
  assert.equal(view.identity.email, "avery@example.com");
  assert.equal(view.identity.mfaEnabled, true);
  assert.equal(view.authenticationState.lastLoginAt, "2026-07-30T15:55:00.000Z");
  assert.deepEqual(view.memberships.map((membership) => membership.organizationName), ["Alpha Works", "Beta Works"]);
  assert.equal(view.securityEvents.length, 1);
  assert.equal(view.invitations.length, 1);
  assert.equal(view.recentActions.length, 1);
  assert.throws(() => buildUserAccess360(technical, { user: f.user, memberships: [], organizationAuthorizations: [], lastLoginAt: null }), /User & Access 360 denied/);
});

test("administrative membership repair permits removal only when another active organization remains", () => {
  const f = fixture();
  const decision = planAdministrativeMembershipDeactivation(
    support,
    f.user,
    [f.membershipA, f.membershipB],
    f.membershipA.id,
    "2026-07-30T16:05:00.000Z",
  );
  const safe = assertAdministrativeMembershipDeactivationSafe(decision);
  assert.equal(safe.membership.status, "inactive");
  assert.deepEqual(safe.remainingActiveMembershipIds, [f.membershipB.id]);
});

test("administrative membership repair routes final-membership removal to account resolution instead of creating an orphan", () => {
  const f = fixture();
  const decision = planAdministrativeMembershipDeactivation(
    operations,
    f.user,
    [f.membershipA],
    f.membershipA.id,
    "2026-07-30T16:05:00.000Z",
  );
  assert.deepEqual(decision, {
    kind: "route-to-account-resolution",
    userId: f.user.id,
    membershipId: f.membershipA.id,
    reason: "last-active-organization-membership",
  });
  assert.throws(() => assertAdministrativeMembershipDeactivationSafe(decision), /would orphan an active user/);
});

test("technical administrator cannot execute user membership repair", () => {
  const f = fixture();
  assert.throws(
    () => planAdministrativeMembershipDeactivation(technical, f.user, [f.membershipA, f.membershipB], f.membershipA.id, now),
    /permission-not-granted/,
  );
});
