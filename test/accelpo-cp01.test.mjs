import assert from "node:assert/strict";
import test from "node:test";

import {
  identityOrganizationStorageKey,
  safeInternalReturnTo,
  signInDestination,
  resolveOrganizationSelection,
} from "../src/accelpo/cp01/identity-context.ts";
import { projectIdentityContext } from "../src/accelpo/cp01/identity-projection.ts";

const option = (organizationId, membershipId) => ({
  organizationId,
  membershipId,
  displayName: organizationId,
});

test("organization selection is server-shaped and cannot select a non-member", () => {
  const memberships = [option("org-one", "membership-one"), option("org-two", "membership-two")];

  assert.equal(resolveOrganizationSelection(memberships, "org-one").kind, "selected");
  assert.equal(resolveOrganizationSelection(memberships, "org-attacker").kind, "organization-selection-required");
  assert.equal(resolveOrganizationSelection(memberships, "org-attacker").options.length, 2);
  assert.equal(resolveOrganizationSelection([], null).reason, "no-active-membership");
});

test("organization storage is scoped to the provider subject and is only a hint", () => {
  assert.equal(
    identityOrganizationStorageKey("firebase-subject/one"),
    "accelpo.identity.organization.v1.firebase-subject%2Fone",
  );
  assert.notEqual(
    identityOrganizationStorageKey("firebase-subject/one"),
    identityOrganizationStorageKey("firebase-subject/two"),
  );
});

test("deep-link restoration rejects external and authentication return targets", () => {
  assert.equal(safeInternalReturnTo("/purchases/case-1?tab=history"), "/purchases/case-1?tab=history");
  assert.equal(safeInternalReturnTo("https://attacker.example/steal"), null);
  assert.equal(safeInternalReturnTo("//attacker.example/steal"), null);
  assert.equal(safeInternalReturnTo("/\\\\attacker.example"), null);
  assert.equal(signInDestination("/purchases/case-1"), "/signin?returnTo=%2Fpurchases%2Fcase-1");
  assert.equal(signInDestination("https://attacker.example/steal"), "/signin");
});

function identityDependencies({ membership, authorization }) {
  const organization = { id: membership.organizationId };
  const profile = { id: "profile-one", organizationId: membership.organizationId, displayName: "One Org" };
  return {
    accountSecurity: {
      inspect: async () => ({
        provider: "firebase",
        subject: "firebase-subject",
        email: "owner@example.com",
        emailVerified: true,
        disabled: false,
        mfaEnrolled: false,
        tokensValidAfter: null,
        lastSignInAt: null,
      }),
    },
    organizations: {
      getById: async () => organization,
    },
    profiles: {
      getByOrganizationId: async () => profile,
    },
    memberships: {
      listActiveByUserId: async () => [membership],
      listByOrganizationId: async () => [membership],
      getById: async () => membership,
    },
    authorizations: {
      getByMembershipId: async () => authorization,
    },
    restrictions: {
      getForOrganization: async () => null,
      getForMembership: async () => null,
    },
  };
}

const context = {
  user: {
    id: "user-one",
    name: "Owner",
    primaryEmail: "owner@example.com",
  },
  authentication: {
    provider: "firebase",
    subject: "firebase-subject",
    authenticatedAt: "2026-09-14T10:00:00.000Z",
    issuedAt: "2026-09-14T10:00:00.000Z",
    expiresAt: "2026-09-15T10:00:00.000Z",
    source: "session-cookie",
  },
};

const membership = {
  id: "membership-one",
  userId: "user-one",
  organizationId: "org-one",
  status: "active",
};

const authorization = {
  id: "authorization-one",
  membershipId: "membership-one",
  userId: "user-one",
  organizationId: "org-one",
  roleKey: "owner",
  permissions: ["purchasing.request"],
};

test("server projection selects only the authenticated user's active membership", async () => {
  const result = await projectIdentityContext(context, "org-attacker", identityDependencies({ membership, authorization }));
  assert.equal(result.kind, "organization-selection-required");
  assert.deepEqual(result.options.map((option) => option.organizationId), ["org-one"]);

  const ready = await projectIdentityContext(context, "org-one", identityDependencies({ membership, authorization }));
  assert.equal(ready.kind, "ready");
  assert.equal(ready.projection.activeOrganization.organizationId, "org-one");
  assert.deepEqual(ready.projection.permissions, ["purchasing.request"]);
  assert.equal(ready.projection.seat.ownerCountsAsSeat, true);
  assert.equal(ready.projection.seat.activeSeats, 1);
  assert.equal(ready.projection.seat.source, "shared-membership-count");
});

test("server projection fails closed when authorization belongs to another membership", async () => {
  const result = await projectIdentityContext(context, "org-one", identityDependencies({
    membership,
    authorization: { ...authorization, membershipId: "membership-attacker" },
  }));
  assert.deepEqual(result, { kind: "forbidden", reason: "authorization-missing" });
});
