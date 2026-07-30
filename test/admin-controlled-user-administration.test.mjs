import test from "node:test";
import assert from "node:assert/strict";

import { ControlledUserAdministrationService } from "../src/application/admin/controlled-user-administration.ts";
import { createAdminPermissionGrant } from "../src/domain/admin-authorization/grants.ts";
import { defaultAdminRolePreset, resolveAuthorityContextFromAdminRolePreset } from "../src/domain/admin-authorization/role-presets.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import { createOrganizationMembership, createUserIdentity } from "../src/domain/users/model.ts";

const NOW = "2026-07-30T20:00:00.000Z";
const support = resolveAuthorityContextFromAdminRolePreset(
  "admin-support",
  defaultAdminRolePreset("member-success-support-administrator"),
);

function adminGrant(scope = "ORGANIZATION:org-a", extra = {}) {
  return createAdminPermissionGrant({
    id: extra.id ?? `grant-${scope.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
    administratorId: support.administratorId,
    permission: "user.access.manage",
    scope,
    conditionKeys: extra.conditionKeys ?? [],
    createdAt: "2026-07-30T18:00:00.000Z",
    ...(extra.expiresAt ? { expiresAt: extra.expiresAt } : {}),
  });
}

function makeUser(id, email) {
  return createUserIdentity({
    id,
    name: id,
    primaryEmail: email,
    loginProvider: "firebase",
    loginSubject: `firebase-${id}`,
    now: NOW,
  });
}

function harness() {
  const organization = createOrganizationAccount({ id: "org-a", now: NOW });
  const otherOrganization = createOrganizationAccount({ id: "org-b", now: NOW });
  const sponsor = makeUser("owner", "owner@example.com");
  const user = makeUser("user-1", "user1@example.com");
  const sponsorMembership = createOrganizationMembership(sponsor, organization, { id: "membership-owner", now: NOW });
  const membership = createOrganizationMembership(user, organization, { id: "membership-1", now: NOW });
  const otherMembership = createOrganizationMembership(user, otherOrganization, { id: "membership-2", now: NOW });
  const sponsorAuthorization = createOrganizationUserAuthorization(sponsorMembership, organization, {
    roleKey: "administrator",
    permissions: ["organization.users.manage", "organization.permissions.manage"],
    now: NOW,
  });
  const authorization = createOrganizationUserAuthorization(membership, organization, {
    roleKey: "viewer",
    permissions: [],
    now: NOW,
  });
  const otherAuthorization = createOrganizationUserAuthorization(otherMembership, otherOrganization, {
    roleKey: "viewer",
    permissions: [],
    now: NOW,
  });

  const memberships = [membership, otherMembership, sponsorMembership];
  const authorizations = new Map([
    [membership.id, authorization],
    [otherMembership.id, otherAuthorization],
    [sponsorMembership.id, sponsorAuthorization],
  ]);
  const invitations = new Map();
  const restrictions = new Map();
  const commits = [];

  const service = new ControlledUserAdministrationService({
    invitations: {
      async getById(id) { return invitations.get(id) ?? null; },
      async listByOrganizationId(id) { return [...invitations.values()].filter((x) => x.organizationId === id); },
      async findPendingByOrganizationAndEmail(id, email) {
        const normalized = email.trim().toLowerCase();
        return [...invitations.values()].find((x) => x.organizationId === id && x.email === normalized && x.status === "pending") ?? null;
      },
      async create(x) { invitations.set(x.id, x); },
      async save(x) { invitations.set(x.id, x); },
    },
    memberships: {
      async getById(id) { return memberships.find((x) => x.id === id) ?? null; },
      async listByUserId(id) { return memberships.filter((x) => x.userId === id); },
      async listActiveByUserId(id) { return memberships.filter((x) => x.userId === id && x.status === "active"); },
      async listByOrganizationId(id) { return memberships.filter((x) => x.organizationId === id); },
      async create(x) { memberships.push(x); },
    },
    authorizations: {
      async getByMembershipId(id) { return authorizations.get(id) ?? null; },
      async listByUserId(id) { return [...authorizations.values()].filter((x) => x.userId === id); },
      async listByOrganizationId(id) { return [...authorizations.values()].filter((x) => x.organizationId === id); },
      async save(x) { authorizations.set(x.membershipId, x); },
    },
    restrictions: {
      async getById(id) { return [...restrictions.values()].find((x) => x.id === id) ?? null; },
      async getForOrganization(id) { return [...restrictions.values()].find((x) => x.target.kind === "organization" && x.target.organizationId === id) ?? null; },
      async getForMembership(id) { return restrictions.get(id) ?? null; },
      async save(x) { if (x.target.kind === "membership") restrictions.set(x.target.membershipId, x); },
    },
    roleBundles: {
      async getByKey() { return null; },
      async listAll() { return []; },
      async save() {},
    },
    unitOfWork: {
      async commit(input) {
        commits.push(input);
        const { mutation } = input;
        if (mutation.kind === "invitation") invitations.set(mutation.record.id, mutation.record);
        if (mutation.kind === "membership") {
          const index = memberships.findIndex((x) => x.id === mutation.record.id);
          memberships[index] = mutation.record;
        }
        if (mutation.kind === "authorization") authorizations.set(mutation.record.membershipId, mutation.record);
        if (mutation.kind === "restriction" && mutation.record.target.kind === "membership") {
          restrictions.set(mutation.record.target.membershipId, mutation.record);
        }
      },
    },
  });

  return {
    organization, otherOrganization, sponsor, user, sponsorMembership, membership, otherMembership,
    sponsorAuthorization, memberships, authorizations, invitations, restrictions, commits, service,
  };
}

function ctx(extra = {}) {
  return {
    authority: support,
    grants: extra.grants ?? [adminGrant()],
    now: extra.now ?? NOW,
    auditEventId: extra.auditEventId ?? "audit-1",
    reason: "Approved support administration action.",
    security: {
      authenticationSubject: "firebase-admin-support",
      sessionId: "session-1",
      provider: "firebase",
      reauthenticatedAt: extra.reauthenticatedAt ?? "2026-07-30T19:59:00.000Z",
    },
    ...(extra.satisfiedGrantConditionKeys ? { satisfiedGrantConditionKeys: extra.satisfiedGrantConditionKeys } : {}),
    ...(extra.approvalReferences ? { approvalReferences: extra.approvalReferences } : {}),
  };
}

test("ADM-068 invitation create/resend is explicit, scoped and before/after audited", async () => {
  const h = harness();
  const invitation = await h.service.invite({
    context: ctx({ auditEventId: "audit-invite" }),
    organization: h.organization,
    sponsor: h.sponsor,
    sponsorMembership: h.sponsorMembership,
    sponsorAuthorization: h.sponsorAuthorization,
    invitationId: "invitation-1",
    inviteeEmail: "new.user@example.com",
    rolePresetKey: "viewer",
  });
  assert.equal(h.commits[0].auditEvent.action, "user.invitation.created");
  assert.equal(h.commits[0].auditEvent.priorState, null);
  const resent = await h.service.resendInvitation({
    context: ctx({ auditEventId: "audit-resend", now: "2026-07-31T20:00:00.000Z" }),
    organization: h.organization,
    invitationId: invitation.id,
  });
  assert.ok(Date.parse(resent.expiresAt) > Date.parse(invitation.expiresAt));
  assert.equal(h.commits[1].auditEvent.action, "user.invitation.resent");
  assert.equal(h.commits[1].auditEvent.priorState.expiresAt, invitation.expiresAt);
  assert.equal(h.commits[1].auditEvent.newState.expiresAt, resent.expiresAt);
});

test("ADM-068 scope, expiry and grant conditions fail closed while GLOBAL can cover the organization", async () => {
  const wrong = harness();
  await assert.rejects(() => wrong.service.assignPermission({
    context: ctx({ grants: [adminGrant("ORGANIZATION:org-b")] }),
    organization: wrong.organization,
    user: wrong.user,
    membershipId: wrong.membership.id,
    permission: "response.create",
  }), /scope-not-satisfied/);

  const expired = harness();
  await assert.rejects(() => expired.service.assignPermission({
    context: ctx({ grants: [adminGrant("ORGANIZATION:org-a", { expiresAt: "2026-07-30T19:00:00.000Z" })] }),
    organization: expired.organization,
    user: expired.user,
    membershipId: expired.membership.id,
    permission: "response.create",
  }), /grant-expired/);

  const conditioned = harness();
  const conditionedGrant = adminGrant("ORGANIZATION:org-a", { id: "grant-conditioned", conditionKeys: ["case-approved"] });
  await assert.rejects(() => conditioned.service.assignPermission({
    context: ctx({ grants: [conditionedGrant] }), organization: conditioned.organization,
    user: conditioned.user, membershipId: conditioned.membership.id, permission: "response.create",
  }), /conditions-not-satisfied/);
  const allowed = await conditioned.service.assignPermission({
    context: ctx({ grants: [conditionedGrant], satisfiedGrantConditionKeys: ["case-approved"] }),
    organization: conditioned.organization, user: conditioned.user,
    membershipId: conditioned.membership.id, permission: "response.create",
  });
  assert.deepEqual(allowed.permissions, ["response.create"]);

  const global = harness();
  const globalAllowed = await global.service.assignPermission({
    context: ctx({ grants: [adminGrant("GLOBAL")] }), organization: global.organization,
    user: global.user, membershipId: global.membership.id, permission: "response.create",
  });
  assert.deepEqual(globalAllowed.permissions, ["response.create"]);
});

test("ADM-068 organization removal preserves the no-orphan invariant", async () => {
  const h = harness();
  const removed = await h.service.removeFromOrganization({
    context: ctx({ auditEventId: "audit-remove" }), organization: h.organization,
    user: h.user, membershipId: h.membership.id,
  });
  assert.equal(removed.status, "inactive");
  assert.equal(h.commits.at(-1).auditEvent.action, "user.organization.removed");
  assert.equal(h.commits.at(-1).auditEvent.priorState.status, "active");
  assert.equal(h.commits.at(-1).auditEvent.newState.status, "inactive");

  const orphan = harness();
  orphan.memberships.splice(orphan.memberships.findIndex((x) => x.id === orphan.otherMembership.id), 1);
  await assert.rejects(() => orphan.service.removeFromOrganization({
    context: ctx({ auditEventId: "audit-orphan" }), organization: orphan.organization,
    user: orphan.user, membershipId: orphan.membership.id,
  }), /orphan an active user/);
});

test("ADM-068 suspend/restore uses membership restrictions and preserves before/after state", async () => {
  const h = harness();
  const suspended = await h.service.suspend({
    context: ctx({ auditEventId: "audit-suspend" }), organization: h.organization,
    user: h.user, membershipId: h.membership.id, restrictionId: "restriction-1",
  });
  assert.equal(suspended.state, "suspended");
  assert.equal(suspended.target.kind, "membership");
  const restored = await h.service.restore({
    context: ctx({ auditEventId: "audit-restore", now: "2026-07-30T20:05:00.000Z" }),
    organization: h.organization, user: h.user, membershipId: h.membership.id,
  });
  assert.equal(restored.state, "none");
  assert.equal(h.commits.at(-1).auditEvent.action, "user.access.restored");
  assert.equal(h.commits.at(-1).auditEvent.priorState.state, "suspended");
  assert.equal(h.commits.at(-1).auditEvent.newState.state, "none");
});

test("ADM-068 approved access reset requires distinct approval evidence", async () => {
  const h = harness();
  await assert.rejects(() => h.service.resetAccess({
    context: ctx({ auditEventId: "audit-reset-denied" }), organization: h.organization,
    user: h.user, membershipId: h.membership.id, approvedRoleBundleKey: "viewer",
  }), /distinct administrative approval/);
  const reset = await h.service.resetAccess({
    context: ctx({ auditEventId: "audit-reset", approvalReferences: [{ approvalId: "approval-1", approverAdministratorId: "admin-secondary" }] }),
    organization: h.organization, user: h.user, membershipId: h.membership.id,
    approvedRoleBundleKey: "response-manager",
  });
  assert.equal(reset.roleKey, "response-manager");
  assert.deepEqual(reset.permissions, ["response.create", "response.submit", "teaming.manage", "document.manage"]);
  assert.equal(h.commits.at(-1).auditEvent.action, "user.access.reset");
});

test("ADM-068 role transfer and granular permission assignment/revocation are separately audited", async () => {
  const h = harness();
  const role = await h.service.transferRole({
    context: ctx({ auditEventId: "audit-role" }), organization: h.organization,
    user: h.user, membershipId: h.membership.id, roleBundleKey: "billing-manager",
  });
  assert.equal(role.roleKey, "billing-manager");
  const assigned = await h.service.assignPermission({
    context: ctx({ auditEventId: "audit-assign", now: "2026-07-30T20:01:00.000Z" }),
    organization: h.organization, user: h.user, membershipId: h.membership.id,
    permission: "response.create",
  });
  assert.deepEqual(assigned.permissions, ["billing.manage", "response.create"]);
  const revoked = await h.service.revokePermission({
    context: ctx({ auditEventId: "audit-revoke", now: "2026-07-30T20:02:00.000Z" }),
    organization: h.organization, user: h.user, membershipId: h.membership.id,
    permission: "billing.manage",
  });
  assert.deepEqual(revoked.permissions, ["response.create"]);
  assert.deepEqual(h.commits.map((x) => x.auditEvent.action), [
    "user.role.transferred", "user.permission.assigned", "user.permission.revoked",
  ]);
});

test("ADM-068 sensitive mutations require reauthentication context", async () => {
  const h = harness();
  await assert.rejects(() => h.service.assignPermission({
    context: {
      ...ctx({ auditEventId: "audit-no-reauth" }),
      security: { authenticationSubject: "firebase-admin-support", sessionId: "session-1", provider: "firebase", reauthenticatedAt: "" },
    },
    organization: h.organization, user: h.user, membershipId: h.membership.id,
    permission: "response.create",
  }), /re-authentication (?:context|timestamp)|valid date-time/);
  assert.equal(h.commits.length, 0);
});
