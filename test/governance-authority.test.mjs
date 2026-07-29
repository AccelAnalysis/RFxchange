import test from "node:test";
import assert from "node:assert/strict";

import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";
import {
  ORGANIZATION_AUTHORITY_STATEMENT,
  PLATFORM_CHANGE_OPERATIONS,
  PLATFORM_CHANGE_TARGET_KINDS,
  createEmergencyPlatformChangeDirective,
  createNormalPlatformChangeDirective,
  createOrganizationAuthorityRepresentation,
  platformChangeOperation,
  platformChangeTargetKind,
} from "../src/domain/governance/model.ts";

const now = "2026-07-29T13:00:00.000Z";

function fixture(status = "active") {
  const organization = createOrganizationAccount({ id: "org-alpha", now });
  const user = createUserIdentity({
    id: "user-one",
    name: "User One",
    primaryEmail: "user@example.com",
    loginProvider: "example-idp",
    loginSubject: "subject-1",
    now,
  });
  const membership = createOrganizationMembership(user, organization, {
    id: "membership-1",
    status,
    now,
  });

  return { organization, user, membership };
}

test("records the initial user's organization authority representation without claiming verification", () => {
  const { organization, user, membership } = fixture();
  const representation = createOrganizationAuthorityRepresentation(user, membership, organization, {
    id: "authority-1",
    confirmsAuthority: true,
    now,
  });

  assert.equal(representation.userId, user.id);
  assert.equal(representation.membershipId, membership.id);
  assert.equal(representation.organizationId, organization.id);
  assert.equal(representation.statement, ORGANIZATION_AUTHORITY_STATEMENT);
  assert.equal(representation.evidence.source, "explicit-user-action");
  assert.equal("verified" in representation, false);
  assert.equal("verificationStatus" in representation, false);
});

test("organization authority representation rejects inactive, cross-user and cross-tenant contexts", () => {
  const inactive = fixture("inactive");
  assert.throws(
    () =>
      createOrganizationAuthorityRepresentation(
        inactive.user,
        inactive.membership,
        inactive.organization,
        { id: "authority-inactive", confirmsAuthority: true, now },
      ),
    /Inactive organization membership/,
  );

  const { organization, membership } = fixture();
  const otherUser = createUserIdentity({
    id: "user-two",
    name: "User Two",
    primaryEmail: "user2@example.com",
    loginProvider: "example-idp",
    loginSubject: "subject-2",
    now,
  });
  assert.throws(
    () =>
      createOrganizationAuthorityRepresentation(otherUser, membership, organization, {
        id: "authority-cross-user",
        confirmsAuthority: true,
        now,
      }),
    /different user identity/,
  );

  const { user } = fixture();
  const otherOrganization = createOrganizationAccount({ id: "org-beta", now });
  assert.throws(
    () =>
      createOrganizationAuthorityRepresentation(user, membership, otherOrganization, {
        id: "authority-cross-tenant",
        confirmsAuthority: true,
        now,
      }),
    /different organization tenant/,
  );
});

test("platform change authority catalog covers the required governed surfaces and operations", () => {
  assert.deepEqual(PLATFORM_CHANGE_TARGET_KINDS, [
    "feature",
    "workflow",
    "geography",
    "eligibility",
    "api",
    "integration",
  ]);
  assert.deepEqual(PLATFORM_CHANGE_OPERATIONS, [
    "add",
    "modify",
    "remove",
    "temporarily-disable",
  ]);
});

test("normal platform changes require completed communication before becoming effective", () => {
  const directive = createNormalPlatformChangeDirective({
    id: "change-1",
    actorId: "platform-actor-1",
    targetKind: "feature",
    targetKey: "rfx-publishing",
    operation: "modify",
    mode: "normal",
    reason: "Update feature behavior",
    communicatedAt: "2026-07-29T13:05:00.000Z",
    effectiveAt: "2026-07-29T14:00:00.000Z",
    now,
  });

  assert.equal(directive.authority, "platform-governance");
  assert.equal(directive.mode, "normal");
  assert.equal(directive.communication.requirement, "before-effective");
  assert.equal(directive.communication.status, "completed");
  assert.equal(directive.targetKind, "feature");
  assert.equal(directive.operation, "modify");

  assert.throws(
    () =>
      createNormalPlatformChangeDirective({
        id: "change-too-late",
        actorId: "platform-actor-1",
        targetKind: "workflow",
        targetKey: "onboarding",
        operation: "modify",
        mode: "normal",
        reason: "Change onboarding flow",
        communicatedAt: "2026-07-29T15:00:00.000Z",
        effectiveAt: "2026-07-29T14:00:00.000Z",
        now,
      }),
    /communicated before they become effective/,
  );
});

test("emergency/security intervention may take effect immediately while communication is pending", () => {
  const directive = createEmergencyPlatformChangeDirective({
    id: "change-emergency",
    actorId: "platform-security-1",
    targetKind: "integration",
    targetKey: "external-provider-x",
    operation: "temporarily-disable",
    mode: "emergency-security",
    reason: "Active security incident",
    communication: { status: "pending" },
    now,
  });

  assert.equal(directive.mode, "emergency-security");
  assert.equal(directive.communication.requirement, "post-action-allowed");
  assert.equal(directive.communication.status, "pending");
  assert.equal(directive.effectiveAt, directive.createdAt);
  assert.equal(directive.authority, "platform-governance");
});

test("emergency/security intervention may also preserve completed communication evidence", () => {
  const directive = createEmergencyPlatformChangeDirective({
    id: "change-emergency-communicated",
    actorId: "platform-security-1",
    targetKind: "geography",
    targetKey: "locality-001",
    operation: "temporarily-disable",
    mode: "emergency-security",
    reason: "Security containment",
    communication: {
      status: "completed",
      communicatedAt: "2026-07-29T13:02:00.000Z",
    },
    now,
  });

  assert.equal(directive.communication.status, "completed");
  assert.equal(directive.communication.requirement, "post-action-allowed");
});

test("rejects unsupported change targets, unsupported operations and missing change evidence", () => {
  assert.throws(() => platformChangeTargetKind("billing-plan"), /Unsupported platform change target kind/);
  assert.throws(() => platformChangeOperation("silently-rewrite"), /Unsupported platform change operation/);

  assert.throws(
    () =>
      createEmergencyPlatformChangeDirective({
        id: "change-no-reason",
        actorId: "platform-security-1",
        targetKind: "api",
        targetKey: "public-api",
        operation: "temporarily-disable",
        mode: "emergency-security",
        reason: "   ",
        communication: { status: "pending" },
        now,
      }),
    /Emergency\/security reason is required/,
  );
});
