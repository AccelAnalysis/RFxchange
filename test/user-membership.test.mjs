import assert from "node:assert/strict";
import test from "node:test";

import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
  resolveUserOrganizationAccess,
} from "../src/domain/users/model.ts";

const NOW = "2026-07-29T00:00:00-04:00";

function user(overrides = {}) {
  return createUserIdentity({
    id: "user_001",
    name: "Jamie Rivera",
    primaryEmail: "Jamie@Example.com",
    loginProvider: "identity-provider",
    loginSubject: "subject_001",
    mfaEnabled: true,
    credentialVersion: 2,
    now: NOW,
    ...overrides,
  });
}

test("individual identity owns separate name, login and security data", () => {
  const identity = user();

  assert.equal(identity.id, "user_001");
  assert.equal(identity.name, "Jamie Rivera");
  assert.equal(identity.primaryEmail, "jamie@example.com");
  assert.equal(identity.login.provider, "identity-provider");
  assert.equal(identity.login.subject, "subject_001");
  assert.equal(identity.security.mfaEnabled, true);
  assert.equal(identity.security.credentialVersion, 2);
  assert.equal("organizationId" in identity, false);
  assert.equal("password" in identity, false);
});

test("active organization membership makes the user eligible for organization access", () => {
  const identity = user();
  const organization = createOrganizationAccount({ id: "org_001", now: NOW });
  const membership = createOrganizationMembership(identity, organization, {
    id: "membership_001",
    now: NOW,
  });

  const access = resolveUserOrganizationAccess(identity, [membership]);

  assert.equal(membership.userId, identity.id);
  assert.equal(membership.organizationId, organization.id);
  assert.equal(membership.status, "active");
  assert.equal(access.kind, "organization-access");
  assert.equal(access.activeMemberships.length, 1);
  assert.equal(access.activeMemberships[0], membership);
});

test("user with no active organization membership routes to account resolution", () => {
  const identity = user();
  const organization = createOrganizationAccount({ id: "org_001", now: NOW });
  const inactiveMembership = createOrganizationMembership(identity, organization, {
    id: "membership_inactive",
    status: "inactive",
    now: NOW,
  });

  assert.deepEqual(resolveUserOrganizationAccess(identity, []), {
    kind: "account-resolution",
    userId: "user_001",
    reason: "no-active-organization-membership",
  });

  assert.deepEqual(resolveUserOrganizationAccess(identity, [inactiveMembership]), {
    kind: "account-resolution",
    userId: "user_001",
    reason: "no-active-organization-membership",
  });
});

test("another user's membership cannot grant organization access", () => {
  const requestedUser = user({ id: "user_requested", loginSubject: "subject_requested" });
  const otherUser = user({ id: "user_other", primaryEmail: "other@example.com", loginSubject: "subject_other" });
  const organization = createOrganizationAccount({ id: "org_001", now: NOW });
  const otherMembership = createOrganizationMembership(otherUser, organization, {
    id: "membership_other",
    now: NOW,
  });

  const access = resolveUserOrganizationAccess(requestedUser, [otherMembership]);

  assert.equal(access.kind, "account-resolution");
});

test("one identity may hold active memberships in multiple organization tenants", () => {
  const identity = user();
  const firstOrganization = createOrganizationAccount({ id: "org_first", now: NOW });
  const secondOrganization = createOrganizationAccount({ id: "org_second", now: NOW });
  const memberships = [
    createOrganizationMembership(identity, firstOrganization, { id: "membership_first", now: NOW }),
    createOrganizationMembership(identity, secondOrganization, { id: "membership_second", now: NOW }),
  ];

  const access = resolveUserOrganizationAccess(identity, memberships);

  assert.equal(access.kind, "organization-access");
  assert.deepEqual(
    access.activeMemberships.map((membership) => membership.organizationId),
    ["org_first", "org_second"],
  );
});

test("identity and membership constructors reject invalid required security data", () => {
  assert.throws(
    () => user({ primaryEmail: "not-an-email" }),
    /Primary email must be valid/,
  );
  assert.throws(
    () => user({ loginSubject: "   " }),
    /Login subject is required/,
  );
  assert.throws(
    () => user({ credentialVersion: 0 }),
    /Credential version must be a positive integer/,
  );

  const identity = user();
  const organization = createOrganizationAccount({ id: "org_001", now: NOW });

  assert.throws(
    () => createOrganizationMembership(identity, organization, { id: "   ", now: NOW }),
    /Organization membership id is required/,
  );
});
