import test from "node:test";
import assert from "node:assert/strict";

import { ControlledUserAdministrationService } from "../src/application/admin/controlled-user-administration.ts";
import { createAdminPermissionGrant } from "../src/domain/admin-authorization/grants.ts";
import {
  defaultAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import { createOrganizationMembership, createUserIdentity } from "../src/domain/users/model.ts";

const NOW = "2026-07-30T20:00:00.000Z";
const support = resolveAuthorityContextFromAdminRolePreset(
  "admin-support",
  defaultAdminRolePreset("member-success-support-administrator"),
);

function grant(scope, options = {}) {
  return createAdminPermissionGrant({
    id: options.id ?? `grant-${scope.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
    administratorId: support.administratorId,
    permission: "user.access.manage",
    scope,
    conditionKeys: options.conditionKeys ?? [],
    createdAt: options.createdAt ?? "2026-07-30T18:00:00.000Z",
    ...(options.expiresAt ? { expiresAt: options.expiresAt } : {}),
  });
}

function fixture() {
  const organization = createOrganizationAccount({ id: "org-a", now: NOW });
  const otherOrganization = createOrganizationAccount({ id: "org-b", now: NOW });
  const sponsor = createUserIdentity({
    id: "user-owner",
    name: "Owner",
    primaryEmail: "owner@example.com",
    loginProvider: "firebase",
    loginSubject: "firebase-owner",
    now: NOW,
  });
  const sponsorMembership = createOrganizationMembership(sponsor, organization, {
    id: "membership-owner",
    now: NOW,
  });
  const sponsorAuthorization = createOrganizationUserAuthorization(
    sponsorMembership,
    organization,
    {
      roleKey: "administrator",
      permissions: ["organization.users.manage", "organization.permissions.manage"],
      now: NOW,
    },
  );
  const user = createUserIdentity({
    id: "user-1",
    name: "Avery Carter",
    primaryEmail: "avery@example.com",
    loginProvider: "firebase",
    loginSubject: "firebase-user-1",
    now: NOW,
  });
  const membership = createOrganizationMembership(user, organization, {
    id: "membership-1",
    now: NOW,
  });
  const otherMembership = createOrganizationMembership(user, otherOrganization, {
    id: "membership-2",
    now: NOW,
  });
  const authorization = createOrganizationUserAuthorization(membership, organization, {
    roleKey: "viewer",
    permissions: [],
    now: NOW,
  });
  const otherAuthorization = createOrganizationUserAuthorization(
    otherMembership,
    otherOrganization,
    { roleKey: "viewer", permissions: [], now: NOW },
  );
  return {
    organization,
    otherOrganization,
    sponsor,
    sponsorMembership,
    sponsorAuthorization,
    user,
    membership,
    otherMembership,
    authorization,
    otherAuthorization,
  };
}

function harness() {
  const f = fixture();
  const memberships = [f.membership, f.otherMembership, f.sponsorMembership];
  const authorizations = new Map([
    [f.membership.id, f.authorization],
    [f.otherMembership.id, f.otherAuthorization],
    [f.sponsorMembership.id, f.sponsorAuthorization],
  ]);
  const invitations = new Map();
  const restrictions = new Map();
  const roleBundles = new Map();
  const commits = [];

  const service = new ControlledUserAdministrationService({
    invitations: {
      async getById(id) { return invitations.get(id) ?? null; },
      async listByOrganizationId(organizationId) {
        return [...invitations.values()].filter((record) => record.organizationId === organizationId);
      },
      async findPendingByOrganizationAndEmail(organizationId, email) {
        const normalized = email.trim().toLowerCase();
        return [...invitations.values()].find(
          (record) => record.organizationId === organizationId && record.email === normalized && record.status === "pending",
        ) ?? null;
      },
      async create(record) { invitations.set(record.id, record); },
      async save(record) { invitations.set(record.id, record); },
    },
    memberships: {
      async getById(id) { return memberships.find((record) => record.id === id) ?? null; },
      async listByUserId(userId) { return memberships.filter((record) => record.userId === userId); },
      async listActiveByUserId(userId) {
        return memberships.filter((record) => record.userId === userId && record.status === "active");
      },
      async listByOrganizationId(organizationId) {
        return memberships.filter((record) => record.organizationId === organizationId);
      },
      async create(record) { memberships.push(record); },
    },
    authorizations: {
      async getByMembershipId(id) { return authorizations.get(id) ?? null; },
      async listByUserId(userId) {
        return [...authorizations.values()].filter((record) => record.userId === userId);
      },
      async listByOrganizationId(organizationId) {
        return [...authorizations.values()].filter((record) => record.organizationId === organizationId);
      },
      async save(record) { authorizations.set(record.membershipId, record); },
    },
    restrictions: {
      async getById(id) {
        return [...restrictions.values()].find((record) => record.id === id) ?? null;
      },
      async getForOrganization(organizationId) {
        return [...restrictions.values()].find(
          (record) => record.target.kind === "organization" && record.target.organizationId === organizationId,
        ) ?? null;
      },
      async getForMembership(membershipId) { return restrictions.get(membershipId) ?? null; },
      async save(record) {
        if (record.target.kind === "membership") restrictions.set(record.target.membershipId, record);
      },
    },
    roleBundles: {
      async getByKey(key) { return roleBundles.get(key) ?? null; },
      async listAll() { return [...roleBundles.values()]; },
      async save(bundle) { roleBundles.set(bundle.key, bundle); },
    },
    unitOfWork: {
      async commit(input) {
        commits.push(input);
        const { mutation } = input;
        if (mutation.kind === "invitation") invitations.set(mutation.record.id, mutation.record);
        if (mutation.kind === "membership") {
          const index = memberships.findIndex((record) => record.id === mutation.record.id);
          memberships[index] = mutation.record;
        }
        if (mutation.kind === "authorization") {
          authorizations.set(mutation.record.membershipId, mutation.record);
        }
        if (mutation.kind === "restriction" && mutation.record.target.kind === "membership") {
          restrictions.set(mutation.record.target.membershipId, mutation.record);
        }
      },
    },
  });
  return { ...f, memberships, authorizations, invitations, restrictions, commits, service };
}

function context(options = {}) {
  return {
    authority: support,
    grants: options.grants ?? [grant("ORGANIZATION:org-a")],
    now: options.now ?? NOW,
    auditEventId: options.auditEventId ?? "audit-1",
    reason: options.reason ?? "Approved support administration action.",
    security: {
      authenticationSubject: "firebase-admin-support",
      sessionId: "session-1",
      provider: "firebase",
      reauthenticatedAt: options.reauthenticatedAt ?? "2026-07-30T19:59:00.000Z",
    },
    ...(options.satisfiedGrantConditionKeys
      ? { satisfiedGrantConditionKeys: options.satisfiedGrantConditionKeys }
      : {}),
    ...(options.approvalReferences ? { approvalReferences: options.approvalReferences } : {}),
  };
}

function auditActions(commits) {
  return commits.map((entry) => entry.auditEvent.action);
}

test("ADM-068 invite and resend are organization-scoped, permission-checked and audited", async () => {
  const h = harness();
  const invitation = await h.service.invite({
    context: context({ auditEventId: "audit-invite" }),
    organization: h.organization,
    sponsor: h.sponsor,
    sponsorMembership: h.sponsorMembership,
    sponsorAuthorization: h.sponsorAuthorization,
    invitationId: "invitation-1",
    inviteeEmail: "new.user@example.com",
    rolePresetKey: "viewer",
  });
  assert.equal(invitation.status, "pending");
  assert.equal(h.commits[0].auditEvent.action, "user.invitation.created");
  assert.equal(h.commits[0].auditEvent.priorState, null);
  assert.equal(h.commits[0].auditEvent.newState.email, "new.user@example.com");

  const resent = await h.service.resendInvitation({
    context: context({ auditEventId: "audit-resend", now: "2026-07-31T20:00:00.000Z" }),
    organization: h.organization,
    invitationId: invitation.id,
  });
  assert.ok(Date.parse(resent.expiresAt) > Date.parse(invitation.expiresAt));
  assert.equal(h.commits[1].auditEvent.action, "user.invitation.resent");
  assert.equal(h.commits[1].auditEvent.priorState.expiresAt, invitation.expiresAt);
  assert.equal(h.commits[1].auditEvent.newState.expiresAt, resent.expiresAt);

  await assert.rejects(
    () => h.service.invite({
      context: context({ auditEventId: "audit-duplicate" }),
      organization: h.organization,
      sponsor: h.sponsor,
      sponsorMembership: h.sponsorMembership,
      sponsorAuthorization: h.sponsorAuthorization,
      invitationId: "invitation-2",
      inviteeEmail: "new.user@example.com",
      rolePresetKey: "viewer",
    }),
    /pending invitation already exists/,
  );
});

test("ADM-068 exact organization scope denies cross-tenant user administration while GLOBAL may cover the target", async () => {
  const h = harness();
  await assert.rejects(
    () => h.service.assignPermission({
      context: context({ grants: [grant("ORGANIZATION:org-b")] }),
      organization: h.organization,
      user: h.user,
      membershipId: h.membership.id,
      permission: "response.create",
    }),
    /scope-not-satisfied/,
  );

  const updated = await h.service.assignPermission({
    context: context({ grants: [grant("GLOBAL")] }),
    organization: h.organization,
    user: h.user,
    membershipId: h.membership.id,
    permission: "response.create",
  });
  assert.deepEqual(updated.permissions, ["response.create"]);
});

test("ADM-068 grant expiry and grant conditions fail closed", async () => {
  const expired = harness();
  await assert.rejects(
    () => expired.service.assignPermission({
      context: context({
        grants: [grant("ORGANIZATION:org-a", { expiresAt: "2026-07-30T19:00:00.000Z" })],
      }),
      organization: expired.organization,
      user: expired.user,
      membershipId: expired.membership.id,
      permission: "response.create",
    }),
    /grant-expired/,
  );

  const conditioned = harness();
  const conditionedGrant = grant("ORGANIZATION:org-a", {
    id: "grant-conditioned",
    conditionKeys: ["case-approved"],
  });
  await assert.rejects(
    () => conditioned.service.assignPermission({
      context: context({ grants: [conditionedGrant] }),
      organization: conditioned.organization,
      user: conditioned.user,
      membershipId: conditioned.membership.id,
      permission: "response.create",
    }),
    /conditions-not-satisfied/,
  );
  const updated = await conditioned.service.assignPermission({
    context: context({ grants: [conditionedGrant], satisfiedGrantConditionKeys: ["case-approved"] }),
    organization: conditioned.organization,
    user: conditioned.user,
    membershipId: conditioned.membership.id,
    permission: "response.create",
  });
  assert.deepEqual(updated.permissions, ["response.create"]);
});

test("ADM-068 removal preserves active-organization invariant and logs before/after membership state", async () => {
  const h = harness();
  const removed = await h.service.removeFromOrganization({
    context: context({ auditEventId: "audit-remove" }),
    organization: h.organization,
    user: h.user,
    membershipId: h.membership.id,
  });
  assert.equal(removed.status, "inactive");
  assert.equal(h.commits.at(-1).auditEvent.action, "user.organization.removed");
  assert.equal(h.commits.at(-1).auditEvent.priorState.status, "active");
  assert.equal(h.commits.at(-1).auditEvent.newState.status, "inactive");

  const orphan = harness();
  orphan.memberships.splice(orphan.memberships.findIndex((record) => record.id === orphan.otherMembership.id), 1);
  await assert.rejects(
    () => orphan.service.removeFromOrganization({
      context: context({ auditEventId: "audit-orphan" }),
      organization: orphan.organization,
      user: orphan.user,
      membershipId: orphan.membership.id,
    }),
    /orphan an active user/,
  );
});

test("ADM-068 suspension and restore use the existing membership restriction state machine", async () => {
  const h = harness();
  const suspended = await h.service.suspend({
    context: context({ auditEventId: "audit-suspend" }),
    organization: h.organization,
    user: h.user,
    membershipId: h.membership.id,
    restrictionId: "restriction-1",
  });
  assert.equal(suspended.state, "suspended");
  assert.equal(suspended.target.kind, "membership");
  assert.equal(h.commits.at(-1).auditEvent.action, "user.access.suspended");

  const restored = await h.service.restore({
    context: context({ auditEventId: "audit-restore", now: "2026-07-30T20:05:00.000Z" }),
    organization: h.organization,
    user: h.user,
    membershipId: h.membership.id,
  });
  assert.equal(restored.state, "none");
  assert.equal(h.commits.at(-1).auditEvent.action, "user.access.restored");
  assert.equal(h.commits.at(-1).auditEvent.priorState.state, "suspended");
  assert.equal(h.commits.at(-1).auditEvent.newState.state, "none");
});

test("ADM-068 approved access reset requires a distinct approval and records the restored bundle", async () => {
  const h = harness();
  await assert.rejects(
    () => h.service.resetAccess({
      context: context({ auditEventId: "audit-reset-denied" }),
      organization: h.organization,
      user: h.user,
      membershipId: h.membership.id,
      approvedRoleBundleKey: "viewer",
    }),
    /distinct administrative approval/,
  );

  const reset = await h.service.resetAccess({
    context: context({
      auditEventId: "audit-reset",
      approvalReferences: [{ approvalId: "approval-1", approverAdministratorId: "admin-secondary" }],
    }),
    organization: h.organization,
    user: h.user,
    membershipId: h.membership.id,
    approvedRoleBundleKey: "response-manager",
  });
  assert.equal(reset.roleKey, "response-manager");
  assert.deepEqual(reset.permissions, ["response.create", "response.submit", "teaming.manage", "document.manage"]);
  assert.equal(h.commits.at(-1).auditEvent.action, "user.access.reset");
  assert.equal(h.commits.at(-1).auditEvent.approvalReferences[0].approverAdministratorId, "admin-secondary");
});

test("ADM-068 role transfer and granular permission assignment/revocation are explicit audited actions", async () => {
  const h = harness();
  const transferred = await h.service.transferRole({
    context: context({ auditEventId: "audit-role" }),
    organization: h.organization,
    user: h.user,
    membershipId: h.membership.id,
    roleBundleKey: "billing-manager",
  });
  assert.equal(transferred.roleKey, "billing-manager");
  assert.deepEqual(transferred.permissions, ["billing.manage"]);

  const assigned = await h.service.assignPermission({
    context: context({ auditEventId: "audit-assign", now: "2026-07-30T20:01:00.000Z" }),
    organization: h.organization,
    user: h.user,
    membershipId: h.membership.id,
    permission: "response.create",
  });
  assert.deepEqual(assigned.permissions, ["billing.manage", "response.create"]);

  const revoked = await h.service.revokePermission({
    context: context({ auditEventId: "audit-revoke", now: "2026-07-30T20:02:00.000Z" }),
    organization: h.organization,
    user: h.user,
    membershipId: h.membership.id,
    permission: "billing.manage",
  });
  assert.deepEqual(revoked.permissions, ["response.create"]);
  assert.deepEqual(auditActions(h.commits), [
    "user.role.transferred",
    "user.permission.assigned",
    "user.permission.revoked",
  ]);
  assert.deepEqual(h.commits.at(-1).auditEvent.priorState.permissions, ["billing.manage", "response.create"]);
  assert.deepEqual(h.commits.at(-1).auditEvent.newState.permissions, ["response.create"]);
});

test("ADM-068 requires recent reauthentication context for every successful sensitive mutation", async () => {
  const h = harness();
  await assert.rejects(
    () => h.service.assignPermission({
      context: {
        ...context({ auditEventId: "audit-no-reauth" }),
        security: {
          authenticationSubject: "firebase-admin-support",
          sessionId: "session-1",
          provider: "firebase",
          reauthenticatedAt: "",
        },
      },
      organization: h.organization,
      user: h.user,
      membershipId: h.membership.id,
      permission: "response.create",
    }),
    /re-authentication context|valid date-time/,
  );
  assert.equal(h.commits.length, 0);
});
