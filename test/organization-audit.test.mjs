import test from "node:test";
import assert from "node:assert/strict";

import { createOrganizationAssetRef } from "../src/domain/assets/model.ts";
import { createOrganizationActionAuditEvent } from "../src/domain/audit/model.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";

const now = "2026-07-29T04:00:00.000Z";

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

test("records organization activity with exact user and membership attribution", () => {
  const { organization, user, membership } = fixture();
  const event = createOrganizationActionAuditEvent(user, membership, organization, {
    id: "audit-1",
    action: "organization.profile-updated",
    occurredAt: now,
  });

  assert.equal(event.organizationId, organization.id);
  assert.deepEqual(event.actor, {
    userId: user.id,
    membershipId: membership.id,
  });
  assert.equal(event.action, "organization.profile-updated");
  assert.equal(event.target, null);
  assert.equal(event.occurredAt, now);
  assert.equal(Object.isFrozen(event), true);
  assert.equal(Object.isFrozen(event.actor), true);
});

test("records an organization-owned asset target without changing actor attribution", () => {
  const { organization, user, membership } = fixture();
  const target = createOrganizationAssetRef(organization, {
    id: "rfx-1",
    kind: "rfx",
  });

  const event = createOrganizationActionAuditEvent(user, membership, organization, {
    id: "audit-2",
    action: "rfx.published",
    occurredAt: now,
    target,
  });

  assert.deepEqual(event.target, {
    assetId: target.id,
    assetKind: "rfx",
  });
  assert.equal(event.organizationId, organization.id);
  assert.equal(event.actor.userId, user.id);
  assert.equal(Object.isFrozen(event.target), true);
});

test("rejects attribution when the membership belongs to another user", () => {
  const { organization, membership } = fixture();
  const otherUser = createUserIdentity({
    id: "user-two",
    name: "User Two",
    primaryEmail: "other@example.com",
    loginProvider: "example-idp",
    loginSubject: "subject-2",
    now,
  });

  assert.throws(
    () =>
      createOrganizationActionAuditEvent(otherUser, membership, organization, {
        id: "audit-3",
        action: "document.uploaded",
        occurredAt: now,
      }),
    /belongs to a different user identity/,
  );
});

test("inactive membership cannot originate an attributed user action", () => {
  const { organization, user, membership } = fixture("inactive");

  assert.throws(
    () =>
      createOrganizationActionAuditEvent(user, membership, organization, {
        id: "audit-4",
        action: "response.submitted",
        occurredAt: now,
      }),
    /Inactive organization membership/,
  );
});

test("rejects membership and target attribution across organization tenants", () => {
  const { organization, user, membership } = fixture();
  const otherOrganization = createOrganizationAccount({ id: "org-beta", now });
  const otherTarget = createOrganizationAssetRef(otherOrganization, {
    id: "document-2",
    kind: "document",
  });

  assert.throws(
    () =>
      createOrganizationActionAuditEvent(user, membership, otherOrganization, {
        id: "audit-5",
        action: "organization.profile-updated",
        occurredAt: now,
      }),
    /different organization tenant/,
  );

  assert.throws(
    () =>
      createOrganizationActionAuditEvent(user, membership, organization, {
        id: "audit-6",
        action: "document.updated",
        occurredAt: now,
        target: otherTarget,
      }),
    /Audit target belongs to a different organization tenant/,
  );
});

test("rejects invalid audit identifiers, actions and timestamps", () => {
  const { organization, user, membership } = fixture();

  assert.throws(
    () =>
      createOrganizationActionAuditEvent(user, membership, organization, {
        id: " ",
        action: "rfx.published",
        occurredAt: now,
      }),
    /audit event id.*required/i,
  );

  assert.throws(
    () =>
      createOrganizationActionAuditEvent(user, membership, organization, {
        id: "audit-7",
        action: "Published RFx",
        occurredAt: now,
      }),
    /lowercase dot-delimited identifier/,
  );

  assert.throws(
    () =>
      createOrganizationActionAuditEvent(user, membership, organization, {
        id: "audit-8",
        action: "rfx.published",
        occurredAt: "not-a-date",
      }),
    /valid ISO-compatible date-time value/,
  );
});
