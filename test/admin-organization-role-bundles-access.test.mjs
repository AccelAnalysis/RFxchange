import test from "node:test";
import assert from "node:assert/strict";

import { OrganizationAccessAdministrationService } from "../src/application/admin/organization-access-administration.ts";
import {
  DEFAULT_ORGANIZATION_ROLE_BUNDLES,
  ORGANIZATION_ROLE_BUNDLE_KEYS,
} from "../src/domain/authorization/organization-role-bundles.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import {
  defaultAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import { createOrganizationMembership, createUserIdentity } from "../src/domain/users/model.ts";

const NOW = "2026-07-30T18:00:00.000Z";
const support = resolveAuthorityContextFromAdminRolePreset(
  "admin-support",
  defaultAdminRolePreset("member-success-support-administrator"),
);
const analyst = resolveAuthorityContextFromAdminRolePreset(
  "admin-auditor",
  defaultAdminRolePreset("analyst-auditor"),
);

function fixture() {
  const user = createUserIdentity({
    id: "user-1",
    name: "Avery Carter",
    primaryEmail: "avery@example.com",
    loginProvider: "firebase",
    loginSubject: "firebase-user-1",
    now: NOW,
  });
  const orgA = createOrganizationAccount({ id: "org-a", now: NOW });
  const orgB = createOrganizationAccount({ id: "org-b", now: NOW });
  const membershipA = createOrganizationMembership(user, orgA, { id: "membership-a", now: NOW });
  const membershipB = createOrganizationMembership(user, orgB, { id: "membership-b", now: NOW });
  const authorizationA = createOrganizationUserAuthorization(membershipA, orgA, {
    roleKey: "viewer",
    permissions: [],
    now: NOW,
  });
  const authorizationB = createOrganizationUserAuthorization(membershipB, orgB, {
    roleKey: "viewer",
    permissions: [],
    now: NOW,
  });
  return { user, orgA, orgB, membershipA, membershipB, authorizationA, authorizationB };
}

function harness() {
  const f = fixture();
  const memberships = [f.membershipA, f.membershipB];
  const authorizations = new Map([
    [f.membershipA.id, f.authorizationA],
    [f.membershipB.id, f.authorizationB],
  ]);
  const bundles = new Map();
  const commits = [];
  const service = new OrganizationAccessAdministrationService({
    memberships: {
      async getById(id) { return memberships.find((membership) => membership.id === id) ?? null; },
      async listByUserId(userId) { return memberships.filter((membership) => membership.userId === userId); },
      async listActiveByUserId(userId) { return memberships.filter((membership) => membership.userId === userId && membership.status === "active"); },
      async listByOrganizationId(organizationId) { return memberships.filter((membership) => membership.organizationId === organizationId); },
      async create() { throw new Error("not used"); },
    },
    authorizations: {
      async getByMembershipId(id) { return authorizations.get(id) ?? null; },
      async listByUserId(userId) { return [...authorizations.values()].filter((record) => record.userId === userId); },
      async listByOrganizationId(organizationId) { return [...authorizations.values()].filter((record) => record.organizationId === organizationId); },
      async save(record) { authorizations.set(record.membershipId, record); },
    },
    roleBundles: {
      async getByKey(key) { return bundles.get(key) ?? null; },
      async listAll() { return [...bundles.values()]; },
      async save(bundle) { bundles.set(bundle.key, bundle); },
    },
    unitOfWork: {
      async saveMembershipAccess(input) {
        commits.push(input);
        if (input.membership) {
          const index = memberships.findIndex((membership) => membership.id === input.membership.id);
          memberships[index] = input.membership;
        }
        if (input.authorization) authorizations.set(input.authorization.membershipId, input.authorization);
      },
      async saveRoleBundle(input) {
        commits.push(input);
        bundles.set(input.bundle.key, input.bundle);
      },
    },
  });
  return { ...f, memberships, authorizations, bundles, commits, service };
}

const security = Object.freeze({
  authenticationSubject: "firebase-admin-support",
  sessionId: "session-1",
  provider: "firebase",
  reauthenticatedAt: "2026-07-30T17:59:00.000Z",
});

test("ADM-055 defines exactly ten configurable organization role bundles", () => {
  assert.deepEqual(DEFAULT_ORGANIZATION_ROLE_BUNDLES.map((bundle) => bundle.key), ORGANIZATION_ROLE_BUNDLE_KEYS);
  assert.deepEqual(DEFAULT_ORGANIZATION_ROLE_BUNDLES.map((bundle) => bundle.displayName), [
    "Primary Admin / Owner",
    "Organization Admin",
    "Power User / Manager",
    "Contributor",
    "Viewer",
    "Billing Manager",
    "RFx Issuer Manager",
    "RFx Evaluator",
    "Response Manager",
    "Resource Manager",
  ]);
});

test("ADM-055 configured bundle replaces only bundle data and produces sensitive canonical audit evidence", async () => {
  const h = harness();
  const configured = await h.service.configureRoleBundle({
    authority: support,
    key: "response-manager",
    displayName: "Response Manager",
    description: "Custom response lead bundle.",
    permissions: ["response.create", "response.submit"],
    now: "2026-07-30T18:05:00.000Z",
    auditEventId: "audit-role-bundle-1",
    reason: "Align response role to launch policy.",
    security,
  });
  assert.deepEqual(configured.permissions, ["response.create", "response.submit"]);
  assert.equal(h.commits.length, 1);
  assert.equal(h.commits[0].auditEvent.action, "organization.role-bundle.configured");
  assert.equal(h.commits[0].auditEvent.sensitivity, "sensitive");
  assert.equal(h.commits[0].auditEvent.newState.permissions.length, 2);
});

test("ADM-056 authorized support admin can inspect memberships and existing effective access", async () => {
  const h = harness();
  const snapshot = await h.service.inspectUserAccess(support, h.user);
  assert.equal(snapshot.memberships.length, 2);
  assert.equal(snapshot.memberships[0].membership.id, h.membershipA.id);
  assert.equal(snapshot.memberships[0].authorization.roleKey, "viewer");
  await assert.rejects(() => h.service.inspectUserAccess(
    resolveAuthorityContextFromAdminRolePreset("admin-tech", defaultAdminRolePreset("technical-system-administrator")),
    h.user,
  ), /permission-not-granted/);
});

test("ADM-056 changes one membership role and granular permissions with before/after audit", async () => {
  const h = harness();
  const updated = await h.service.assignMembershipAccess({
    authority: support,
    organization: h.orgA,
    user: h.user,
    membershipId: h.membershipA.id,
    roleKey: "custom-response-lead",
    permissions: ["response.create", "response.submit", "teaming.manage"],
    now: "2026-07-30T18:06:00.000Z",
    auditEventId: "audit-access-1",
    reason: "Support case approved access repair.",
    security,
  });
  assert.equal(updated.roleKey, "custom-response-lead");
  assert.deepEqual(updated.permissions, ["response.create", "response.submit", "teaming.manage"]);
  const commit = h.commits.at(-1);
  assert.equal(commit.auditEvent.action, "organization.membership.access-changed");
  assert.equal(commit.auditEvent.priorState.roleKey, "viewer");
  assert.equal(commit.auditEvent.newState.roleKey, "custom-response-lead");
  assert.deepEqual(commit.auditEvent.newState.permissions, ["response.create", "response.submit", "teaming.manage"]);
});

test("ADM-056 can apply a configured/default bundle without role-name authorization assumptions", async () => {
  const h = harness();
  const updated = await h.service.assignMembershipAccess({
    authority: support,
    organization: h.orgA,
    user: h.user,
    membershipId: h.membershipA.id,
    roleBundleKey: "billing-manager",
    now: "2026-07-30T18:07:00.000Z",
    auditEventId: "audit-access-2",
    reason: "Billing duties assigned.",
    security,
  });
  assert.equal(updated.roleKey, "billing-manager");
  assert.deepEqual(updated.permissions, ["billing.manage"]);
});

test("ADM-056 membership deactivation preserves orphan-user prevention and audit attribution", async () => {
  const h = harness();
  const updated = await h.service.setMembershipStatus({
    authority: support,
    organization: h.orgA,
    user: h.user,
    membershipId: h.membershipA.id,
    status: "inactive",
    now: "2026-07-30T18:08:00.000Z",
    auditEventId: "audit-membership-1",
    reason: "Organization access removed after verified request.",
    security,
  });
  assert.equal(updated.status, "inactive");
  assert.equal(h.commits.at(-1).auditEvent.priorState.membershipStatus, "active");
  assert.equal(h.commits.at(-1).auditEvent.newState.membershipStatus, "inactive");

  const single = harness();
  single.memberships.splice(1, 1);
  await assert.rejects(
    () => single.service.setMembershipStatus({
      authority: support,
      organization: single.orgA,
      user: single.user,
      membershipId: single.membershipA.id,
      status: "inactive",
      now: "2026-07-30T18:09:00.000Z",
      auditEventId: "audit-membership-orphan",
      reason: "Attempt final membership removal.",
      security,
    }),
    /would orphan an active user/,
  );
});

test("read-only analyst cannot configure bundles or mutate organization access", async () => {
  const h = harness();
  await assert.rejects(
    () => h.service.configureRoleBundle({
      authority: analyst,
      key: "viewer",
      displayName: "Viewer",
      description: "Attempted unauthorized change.",
      permissions: [],
      now: NOW,
      auditEventId: "audit-denied-role",
      reason: "Unauthorized attempt.",
      security,
    }),
    /permission-not-granted/,
  );
  await assert.rejects(
    () => h.service.assignMembershipAccess({
      authority: analyst,
      organization: h.orgA,
      user: h.user,
      membershipId: h.membershipA.id,
      roleKey: "viewer",
      permissions: [],
      now: NOW,
      auditEventId: "audit-denied-access",
      reason: "Unauthorized attempt.",
      security,
    }),
    /permission-not-granted/,
  );
});
