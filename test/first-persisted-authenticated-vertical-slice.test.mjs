import test from "node:test";
import assert from "node:assert/strict";

import { AuthenticatedOrganizationWorkspaceService } from "../src/application/auth/authenticated-organization-workspace.ts";
import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { createOrganizationAccount, createOrganizationProfile } from "../src/domain/organizations/model.ts";
import { createOrganizationMembership, createUserIdentity } from "../src/domain/users/model.ts";

const now = "2026-07-30T12:00:00.000Z";

function fixture() {
  const user = createUserIdentity({
    id: "usr_inf009",
    name: "INF 009 User",
    primaryEmail: "inf009@example.test",
    loginProvider: "firebase",
    loginSubject: "firebase-inf009",
    now,
  });
  const context = authenticatedServerContext({
    user,
    claims: {
      provider: "firebase",
      subject: "firebase-inf009",
      email: user.primaryEmail,
      displayName: user.name,
      emailVerified: true,
      isAnonymous: false,
      authenticatedAt: now,
      issuedAt: now,
      expiresAt: "2026-07-30T13:00:00.000Z",
    },
    source: "session-cookie",
  });
  const orgA = createOrganizationAccount({ id: "org_inf009_a", now });
  const orgB = createOrganizationAccount({ id: "org_inf009_b", now });
  const profileA = createOrganizationProfile(orgA, { id: "profile_inf009_a", displayName: "INF 009 A", now });
  const profileB = createOrganizationProfile(orgB, { id: "profile_inf009_b", displayName: "INF 009 B", now });
  const membershipA = createOrganizationMembership(user, orgA, { id: "mem_inf009_a", now });
  const membershipB = createOrganizationMembership(user, orgB, { id: "mem_inf009_b", now });
  const authorizationA = createOrganizationUserAuthorization(membershipA, orgA, {
    roleKey: "owner",
    permissions: ["organization.profile.manage", "rfx.create"],
    now,
  });
  const authorizationB = createOrganizationUserAuthorization(membershipB, orgB, {
    roleKey: "viewer",
    permissions: ["rfx.create"],
    now,
  });
  return { user, context, orgA, orgB, profileA, profileB, membershipA, membershipB, authorizationA, authorizationB };
}

function serviceFor(input) {
  const organizations = new Map((input.organizations ?? []).map((value) => [value.id, value]));
  const profiles = new Map((input.profiles ?? []).map((value) => [value.organizationId, value]));
  const memberships = new Map((input.memberships ?? []).map((value) => [value.id, value]));
  const authorizations = new Map((input.authorizations ?? []).map((value) => [value.membershipId, value]));
  return new AuthenticatedOrganizationWorkspaceService({
    accountSecurity: {
      async inspect(subject) {
        return {
          provider: "firebase",
          subject,
          email: "inf009@example.test",
          emailVerified: true,
          disabled: false,
          mfaEnrolled: false,
          tokensValidAfter: null,
          lastSignInAt: now,
        };
      },
    },
    organizations: {
      async getById(id) { return organizations.get(id) ?? null; },
      async create(value) { organizations.set(value.id, value); },
    },
    profiles: {
      async getById(id) { return [...profiles.values()].find((profile) => profile.id === id) ?? null; },
      async getByOrganizationId(id) { return profiles.get(id) ?? null; },
      async create(value) { profiles.set(value.organizationId, value); },
    },
    memberships: {
      async getById(id) { return memberships.get(id) ?? null; },
      async listByUserId(userId) { return [...memberships.values()].filter((value) => value.userId === userId); },
      async listActiveByUserId(userId) { return [...memberships.values()].filter((value) => value.userId === userId && value.status === "active"); },
      async listByOrganizationId(id) { return [...memberships.values()].filter((value) => value.organizationId === id); },
      async create(value) { memberships.set(value.id, value); },
    },
    authorizations: {
      async getByMembershipId(id) { return authorizations.get(id) ?? null; },
      async listByUserId(userId) { return [...authorizations.values()].filter((value) => value.userId === userId); },
      async listByOrganizationId(id) { return [...authorizations.values()].filter((value) => value.organizationId === id); },
      async save(value) { authorizations.set(value.membershipId, value); },
    },
    restrictions: {
      async getById() { return null; },
      async getForOrganization() { return null; },
      async getForMembership() { return null; },
      async save() {},
    },
  });
}

test("INF-009 routes a signed-in user with no active membership to account resolution", async () => {
  const f = fixture();
  const result = await serviceFor({}).resolve({ context: f.context, permission: "organization.profile.manage" });
  assert.deepEqual(result, {
    kind: "account-resolution",
    userId: f.user.id,
    reason: "no-active-organization-membership",
  });
});

test("INF-009 requires explicit organization selection when more than one active membership exists", async () => {
  const f = fixture();
  const result = await serviceFor({ memberships: [f.membershipA, f.membershipB] }).resolve({
    context: f.context,
    permission: "rfx.create",
  });
  assert.equal(result.kind, "organization-selection-required");
  assert.deepEqual(result.options.map((option) => option.organizationId), [f.orgA.id, f.orgB.id]);
});

test("INF-009 rejects a requested organization outside the user's active memberships", async () => {
  const f = fixture();
  const result = await serviceFor({ memberships: [f.membershipA] }).resolve({
    context: f.context,
    requestedOrganizationId: f.orgB.id,
    permission: "organization.profile.manage",
  });
  assert.deepEqual(result, { kind: "access-denied", reason: "wrong-organization" });
});

test("INF-009 resolves one persisted organization only after canonical account, membership and permission authorization", async () => {
  const f = fixture();
  const result = await serviceFor({
    organizations: [f.orgA],
    profiles: [f.profileA],
    memberships: [f.membershipA],
    authorizations: [f.authorizationA],
  }).resolve({
    context: f.context,
    permission: "organization.profile.manage",
  });
  assert.equal(result.kind, "authorized");
  assert.equal(result.context.user.id, f.user.id);
  assert.equal(result.organization.organizationId, f.orgA.id);
  assert.equal(result.organization.profile.id, f.profileA.id);
  assert.equal(result.membership.id, f.membershipA.id);
  assert.equal(result.authorization.membershipId, f.membershipA.id);
  assert.equal(result.permission, "organization.profile.manage");
});

test("INF-009 does not manufacture a network workspace when the selected organization profile is missing", async () => {
  const f = fixture();
  const result = await serviceFor({
    organizations: [f.orgA],
    memberships: [f.membershipA],
    authorizations: [f.authorizationA],
  }).resolve({
    context: f.context,
    permission: "organization.profile.manage",
  });
  assert.deepEqual(result, {
    kind: "organization-profile-missing",
    organizationId: f.orgA.id,
    membershipId: f.membershipA.id,
  });
});

test("INF-009 preserves permission boundaries after organization selection", async () => {
  const f = fixture();
  const result = await serviceFor({
    organizations: [f.orgB],
    profiles: [f.profileB],
    memberships: [f.membershipB],
    authorizations: [f.authorizationB],
  }).resolve({
    context: f.context,
    requestedOrganizationId: f.orgB.id,
    permission: "organization.profile.manage",
  });
  assert.deepEqual(result, { kind: "access-denied", reason: "missing-permission" });
});
