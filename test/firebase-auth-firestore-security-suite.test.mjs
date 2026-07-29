import assert from "node:assert/strict";
import test from "node:test";

import { authorizeOrganizationOperation } from "../src/application/auth/authorize-organization-operation.ts";

const NOW = "2026-07-29T21:10:00.000Z";
const PERMISSION = "organization.profile.manage";

function context(userId = "usr_alice", subject = "firebase_alice") {
  return {
    user: {
      id: userId,
      name: userId === "usr_alice" ? "Alice Owner" : "Bob User",
      primaryEmail: `${userId}@example.test`,
      login: { provider: "firebase", subject },
      security: { mfaEnabled: false, credentialVersion: 1 },
      createdAt: NOW,
      updatedAt: NOW,
    },
    authentication: {
      provider: "firebase",
      subject,
      authenticatedAt: "2026-07-29T21:09:00.000Z",
      issuedAt: "2026-07-29T21:09:00.000Z",
      expiresAt: "2026-07-29T22:09:00.000Z",
      source: "id-token",
    },
  };
}

function fixture() {
  const organizations = new Map([
    ["org_a", { id: "org_a", createdAt: NOW, updatedAt: NOW }],
    ["org_b", { id: "org_b", createdAt: NOW, updatedAt: NOW }],
    ["org_c", { id: "org_c", createdAt: NOW, updatedAt: NOW }],
  ]);
  const memberships = new Map([
    [
      "mem_alice_a",
      {
        id: "mem_alice_a",
        userId: "usr_alice",
        organizationId: "org_a",
        status: "active",
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    [
      "mem_alice_inactive",
      {
        id: "mem_alice_inactive",
        userId: "usr_alice",
        organizationId: "org_b",
        status: "inactive",
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    [
      "mem_alice_restricted",
      {
        id: "mem_alice_restricted",
        userId: "usr_alice",
        organizationId: "org_c",
        status: "active",
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
  ]);
  const authorizations = new Map([
    [
      "mem_alice_a",
      {
        membershipId: "mem_alice_a",
        userId: "usr_alice",
        organizationId: "org_a",
        roleKey: "owner",
        permissions: [PERMISSION],
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    [
      "mem_alice_inactive",
      {
        membershipId: "mem_alice_inactive",
        userId: "usr_alice",
        organizationId: "org_b",
        roleKey: "viewer",
        permissions: [PERMISSION],
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    [
      "mem_alice_restricted",
      {
        membershipId: "mem_alice_restricted",
        userId: "usr_alice",
        organizationId: "org_c",
        roleKey: "owner",
        permissions: [PERMISSION],
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
  ]);
  const organizationRestrictions = new Map();
  const membershipRestrictions = new Map([
    [
      "mem_alice_restricted",
      {
        id: "rst_mem_alice_restricted",
        target: {
          kind: "membership",
          organizationId: "org_c",
          membershipId: "mem_alice_restricted",
          userId: "usr_alice",
        },
        state: "suspended",
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
  ]);
  const snapshots = new Map([
    [
      "firebase_alice",
      {
        provider: "firebase",
        subject: "firebase_alice",
        email: "alice@example.test",
        emailVerified: true,
        disabled: false,
        mfaEnrolled: false,
        tokensValidAfter: "2026-07-29T21:00:00.000Z",
        lastSignInAt: "2026-07-29T21:09:00.000Z",
      },
    ],
    [
      "firebase_bob",
      {
        provider: "firebase",
        subject: "firebase_bob",
        email: "bob@example.test",
        emailVerified: true,
        disabled: false,
        mfaEnrolled: false,
        tokensValidAfter: "2026-07-29T21:00:00.000Z",
        lastSignInAt: "2026-07-29T21:09:00.000Z",
      },
    ],
  ]);

  const dependencies = {
    accountSecurity: {
      async inspect(subject) {
        const result = snapshots.get(subject);
        if (!result) throw new Error("account-not-found");
        return result;
      },
    },
    organizations: {
      async getById(id) {
        return organizations.get(id) ?? null;
      },
      async create(value) {
        organizations.set(value.id, value);
      },
    },
    memberships: {
      async getById(id) {
        return memberships.get(id) ?? null;
      },
      async listByUserId() {
        return [];
      },
      async listActiveByUserId() {
        return [];
      },
      async listByOrganizationId() {
        return [];
      },
      async create(value) {
        memberships.set(value.id, value);
      },
    },
    authorizations: {
      async getByMembershipId(id) {
        return authorizations.get(id) ?? null;
      },
      async listByUserId() {
        return [];
      },
      async listByOrganizationId() {
        return [];
      },
      async save(value) {
        authorizations.set(value.membershipId, value);
      },
    },
    restrictions: {
      async getById() {
        return null;
      },
      async getForOrganization(id) {
        return organizationRestrictions.get(id) ?? null;
      },
      async getForMembership(id) {
        return membershipRestrictions.get(id) ?? null;
      },
      async save(value) {
        if (value.target.kind === "organization") organizationRestrictions.set(value.target.organizationId, value);
        else membershipRestrictions.set(value.target.membershipId, value);
      },
    },
  };

  return { dependencies, authorizations, snapshots };
}

async function decide(overrides = {}) {
  const fixtureState = fixture();
  const input = {
    context: context(),
    organizationId: "org_a",
    membershipId: "mem_alice_a",
    permission: PERMISSION,
    ...overrides,
  };
  return { fixtureState, decision: await authorizeOrganizationOperation(input, fixtureState.dependencies) };
}

test("no authenticated server context is denied", async () => {
  const { decision } = await decide({ context: null });
  assert.deepEqual(decision, { allowed: false, reason: "unauthenticated" });
});

test("another RFxchange user cannot exercise a membership", async () => {
  const { decision } = await decide({ context: context("usr_bob", "firebase_bob") });
  assert.deepEqual(decision, { allowed: false, reason: "wrong-user" });
});

test("a membership cannot cross organization tenants", async () => {
  const { decision } = await decide({ organizationId: "org_b" });
  assert.deepEqual(decision, { allowed: false, reason: "wrong-organization" });
});

test("inactive membership is denied before permission use", async () => {
  const { decision } = await decide({ organizationId: "org_b", membershipId: "mem_alice_inactive" });
  assert.deepEqual(decision, { allowed: false, reason: "membership-inactive" });
});

test("active ARC-008 restriction denies organization access", async () => {
  const { decision } = await decide({
    organizationId: "org_c",
    membershipId: "mem_alice_restricted",
  });
  assert.deepEqual(decision, {
    allowed: false,
    reason: "organization-access-restricted",
    restrictionState: "suspended",
  });
});

test("missing permission is denied after identity, membership, and restriction checks", async () => {
  const fixtureState = fixture();
  fixtureState.authorizations.get("mem_alice_a").permissions = [];
  const decision = await authorizeOrganizationOperation(
    {
      context: context(),
      organizationId: "org_a",
      membershipId: "mem_alice_a",
      permission: PERMISSION,
    },
    fixtureState.dependencies,
  );
  assert.deepEqual(decision, { allowed: false, reason: "missing-permission" });
});

test("verified current identity with active membership, no restriction, and permission is allowed", async () => {
  const { decision } = await decide();
  assert.equal(decision.allowed, true);
  assert.equal(decision.context.user.id, "usr_alice");
  assert.equal(decision.membership.id, "mem_alice_a");
  assert.equal(decision.organization.id, "org_a");
  assert.equal(decision.permission, PERMISSION);
});

test("disabled and revoked provider states fail closed", async () => {
  const disabledFixture = fixture();
  disabledFixture.snapshots.get("firebase_alice").disabled = true;
  const disabled = await authorizeOrganizationOperation(
    {
      context: context(),
      organizationId: "org_a",
      membershipId: "mem_alice_a",
      permission: PERMISSION,
    },
    disabledFixture.dependencies,
  );
  assert.deepEqual(disabled, { allowed: false, reason: "account-disabled" });

  const revokedFixture = fixture();
  revokedFixture.snapshots.get("firebase_alice").tokensValidAfter = "2026-07-29T21:09:30.000Z";
  const revoked = await authorizeOrganizationOperation(
    {
      context: context(),
      organizationId: "org_a",
      membershipId: "mem_alice_a",
      permission: PERMISSION,
    },
    revokedFixture.dependencies,
  );
  assert.deepEqual(revoked, { allowed: false, reason: "credential-revoked" });
});
