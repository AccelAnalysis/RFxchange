import test from "node:test";
import assert from "node:assert/strict";

import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";
import {
  ACCESS_LIFECYCLE_STATES,
  ACCESS_RESTRICTION_STATES,
  accessLifecycleState,
  accessRestrictionState,
  advanceAccessLifecycle,
  associateAccessJourneyWithUser,
  canAdvanceAccessLifecycle,
  createAccessLifecycle,
  createAccessRestriction,
  membershipRestrictionTarget,
  nextAccessLifecycleState,
  organizationRestrictionTarget,
  resolveEffectivePlatformAccess,
  transitionAccessRestriction,
} from "../src/domain/lifecycle/model.ts";

const now = "2026-07-29T12:00:00.000Z";
const later = "2026-07-29T12:01:00.000Z";

function membershipFixture() {
  const organization = createOrganizationAccount({ id: "org-alpha", now });
  const user = createUserIdentity({
    id: "user-one",
    name: "User One",
    primaryEmail: "user@example.com",
    loginProvider: "example-idp",
    loginSubject: "subject-one",
    now,
  });
  const membership = createOrganizationMembership(user, organization, {
    id: "membership-one",
    now,
  });

  return { organization, user, membership };
}

test("defines the canonical ARC-007 access lifecycle in exact order", () => {
  assert.deepEqual(ACCESS_LIFECYCLE_STATES, [
    "visitor",
    "account-started",
    "account-activated",
    "geography-selected",
    "organization-resolved",
    "organization-registered",
    "organization-activated",
    "controlled-platform",
    "open-platform",
  ]);
});

test("access lifecycle starts at visitor and advances one canonical step at a time", () => {
  let lifecycle = createAccessLifecycle({ id: "journey-one", now });
  assert.equal(lifecycle.state, "visitor");

  for (const next of ACCESS_LIFECYCLE_STATES.slice(1)) {
    assert.equal(canAdvanceAccessLifecycle(lifecycle.state, next), true);
    lifecycle = advanceAccessLifecycle(lifecycle, next, later);
    assert.equal(lifecycle.state, next);
  }

  assert.equal(nextAccessLifecycleState("open-platform"), null);
  assert.equal(lifecycle.createdAt, new Date(now).toISOString());
});

test("post-activation journey binding remains optional for visitors and immutable once established", () => {
  const { user } = membershipFixture();
  const other = createUserIdentity({
    id: "user-two",
    name: "User Two",
    primaryEmail: "user-two@example.com",
    loginProvider: "example-idp",
    loginSubject: "subject-two",
    now,
  });
  const visitor = createAccessLifecycle({ id: "journey-binding", now });
  assert.equal(visitor.userId, undefined);
  assert.throws(
    () => associateAccessJourneyWithUser(visitor, user.id, later),
    /visitor access journey cannot be bound/,
  );

  const started = advanceAccessLifecycle(visitor, "account-started", later);
  const bound = associateAccessJourneyWithUser(started, user.id, later);
  assert.equal(bound.userId, user.id);
  assert.equal(advanceAccessLifecycle(bound, "account-activated", later).userId, user.id);
  assert.throws(
    () => associateAccessJourneyWithUser(bound, other.id, later),
    /already bound to a different user/,
  );
});

test("lifecycle cannot skip, regress, or advance beyond open platform", () => {
  const lifecycle = createAccessLifecycle({ id: "journey-two", now });

  assert.equal(canAdvanceAccessLifecycle("visitor", "account-activated"), false);
  assert.throws(
    () => advanceAccessLifecycle(lifecycle, "account-activated", later),
    /Invalid access lifecycle transition/,
  );

  const started = advanceAccessLifecycle(lifecycle, "account-started", later);
  assert.throws(
    () => advanceAccessLifecycle(started, "visitor", later),
    /Invalid access lifecycle transition/,
  );

  let completed = lifecycle;
  for (const next of ACCESS_LIFECYCLE_STATES.slice(1)) {
    completed = advanceAccessLifecycle(completed, next, later);
  }

  assert.throws(
    () => advanceAccessLifecycle(completed, "open-platform", later),
    /Invalid access lifecycle transition/,
  );
});

test("defines ARC-008 restriction states separately from lifecycle progress", () => {
  assert.deepEqual(ACCESS_RESTRICTION_STATES, [
    "none",
    "restricted",
    "suspended",
    "integrity-hold",
    "terminated",
  ]);

  const { organization } = membershipFixture();
  let lifecycle = createAccessLifecycle({ id: "journey-three", now });
  for (const next of ACCESS_LIFECYCLE_STATES.slice(1)) {
    lifecycle = advanceAccessLifecycle(lifecycle, next, later);
  }

  const restriction = createAccessRestriction(organizationRestrictionTarget(organization), {
    id: "restriction-one",
    state: "integrity-hold",
    now,
  });

  assert.equal(lifecycle.state, "open-platform");
  assert.deepEqual(resolveEffectivePlatformAccess(lifecycle, restriction), {
    mode: "restriction",
    lifecycleState: "open-platform",
    restrictionState: "integrity-hold",
  });
  assert.equal(lifecycle.state, "open-platform");
});

test("effective access distinguishes onboarding, controlled platform, open platform, and restriction overlay", () => {
  let lifecycle = createAccessLifecycle({ id: "journey-four", now });
  assert.deepEqual(resolveEffectivePlatformAccess(lifecycle, null), {
    mode: "onboarding",
    lifecycleState: "visitor",
  });

  for (const next of ACCESS_LIFECYCLE_STATES.slice(1, -1)) {
    lifecycle = advanceAccessLifecycle(lifecycle, next, later);
  }

  assert.deepEqual(resolveEffectivePlatformAccess(lifecycle, null), {
    mode: "controlled-platform",
    lifecycleState: "controlled-platform",
  });

  lifecycle = advanceAccessLifecycle(lifecycle, "open-platform", later);
  assert.deepEqual(resolveEffectivePlatformAccess(lifecycle, null), {
    mode: "open-platform",
    lifecycleState: "open-platform",
  });
});

test("supports organization and membership restriction targets without cross-tenant leakage", () => {
  const { organization, user, membership } = membershipFixture();
  const organizationTarget = organizationRestrictionTarget(organization);
  const membershipTarget = membershipRestrictionTarget(membership, organization);

  assert.deepEqual(organizationTarget, {
    kind: "organization",
    organizationId: organization.id,
  });
  assert.deepEqual(membershipTarget, {
    kind: "membership",
    organizationId: organization.id,
    membershipId: membership.id,
    userId: user.id,
  });

  const otherOrganization = createOrganizationAccount({ id: "org-beta", now });
  assert.throws(
    () => membershipRestrictionTarget(membership, otherOrganization),
    /does not belong to the supplied organization tenant/,
  );
});

test("non-terminal restrictions may be cleared or changed while termination is irreversible", () => {
  const { organization } = membershipFixture();
  const target = organizationRestrictionTarget(organization);
  let restriction = createAccessRestriction(target, {
    id: "restriction-two",
    state: "restricted",
    now,
  });

  restriction = transitionAccessRestriction(restriction, "suspended", later);
  assert.equal(restriction.state, "suspended");

  restriction = transitionAccessRestriction(restriction, "none", later);
  assert.equal(restriction.state, "none");

  restriction = transitionAccessRestriction(restriction, "terminated", later);
  assert.equal(restriction.state, "terminated");
  assert.throws(
    () => transitionAccessRestriction(restriction, "none", later),
    /Invalid access restriction transition/,
  );
});

test("validates lifecycle and restriction identifiers, states, and timestamps", () => {
  assert.throws(
    () => createAccessLifecycle({ id: " ", now }),
    /Access journey id is required/,
  );
  assert.throws(
    () => createAccessLifecycle({ id: "journey-bad-time", now: "not-a-date" }),
    /Lifecycle timestamp must be a valid ISO-compatible date-time value/,
  );
  assert.throws(() => accessLifecycleState("skipped"), /Unsupported access lifecycle state/);
  assert.throws(() => accessRestrictionState("banned"), /Unsupported access restriction state/);
});
