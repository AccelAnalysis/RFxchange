import test from "node:test";
import assert from "node:assert/strict";

import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";
import {
  createOrganizationUserAuthorization,
  evaluateOrganizationPermission,
  organizationPermission,
} from "../src/domain/authorization/model.ts";

const now = "2026-07-29T03:00:00.000Z";

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

test("stores role metadata and granular permissions on the organization membership", () => {
  const { organization, user, membership } = fixture();
  const authorization = createOrganizationUserAuthorization(membership, organization, {
    roleKey: "custom-manager",
    permissions: ["rfx.create", "rfx.publish", "rfx.create"],
    now,
  });

  assert.equal(authorization.membershipId, membership.id);
  assert.equal(authorization.userId, user.id);
  assert.equal(authorization.organizationId, organization.id);
  assert.equal(authorization.roleKey, "custom-manager");
  assert.deepEqual(authorization.permissions, ["rfx.create", "rfx.publish"]);
});

test("authorization is capability-based rather than role-name based", () => {
  const { organization, membership } = fixture();
  const authorization = createOrganizationUserAuthorization(membership, organization, {
    roleKey: "custom-manager",
    permissions: ["rfx.create"],
    now,
  });

  assert.deepEqual(
    evaluateOrganizationPermission(
      membership,
      authorization,
      organization,
      organizationPermission("rfx.create"),
    ),
    { allowed: true },
  );
  assert.deepEqual(
    evaluateOrganizationPermission(
      membership,
      authorization,
      organization,
      organizationPermission("rfx.publish"),
    ),
    { allowed: false, reason: "missing-permission" },
  );
});

test("inactive membership cannot exercise stored permissions", () => {
  const { organization, membership } = fixture("inactive");
  const authorization = createOrganizationUserAuthorization(membership, organization, {
    roleKey: "responder",
    permissions: ["response.submit"],
    now,
  });

  assert.deepEqual(
    evaluateOrganizationPermission(
      membership,
      authorization,
      organization,
      organizationPermission("response.submit"),
    ),
    { allowed: false, reason: "inactive-membership" },
  );
});

test("authorization cannot cross organization tenants", () => {
  const { organization, membership } = fixture();
  const otherOrganization = createOrganizationAccount({ id: "org-beta", now });
  const authorization = createOrganizationUserAuthorization(membership, organization, {
    roleKey: "member",
    permissions: ["document.manage"],
    now,
  });

  assert.deepEqual(
    evaluateOrganizationPermission(
      membership,
      authorization,
      otherOrganization,
      organizationPermission("document.manage"),
    ),
    { allowed: false, reason: "wrong-organization" },
  );
});

test("authorization record must match the exact membership identity", () => {
  const { organization, user, membership } = fixture();
  const secondMembership = createOrganizationMembership(user, organization, {
    id: "membership-2",
    now,
  });
  const authorization = createOrganizationUserAuthorization(membership, organization, {
    roleKey: "member",
    permissions: ["referral.manage"],
    now,
  });

  assert.deepEqual(
    evaluateOrganizationPermission(
      secondMembership,
      authorization,
      organization,
      organizationPermission("referral.manage"),
    ),
    { allowed: false, reason: "authorization-membership-mismatch" },
  );
});

test("rejects unknown permissions and cross-tenant authorization creation", () => {
  const { membership } = fixture();
  const otherOrganization = createOrganizationAccount({ id: "org-beta", now });

  assert.throws(() => organizationPermission("rfx.superpower"), /Unknown organization permission/);
  assert.throws(
    () =>
      createOrganizationUserAuthorization(membership, otherOrganization, {
        roleKey: "member",
        permissions: ["rfx.create"],
        now,
      }),
    /does not belong to the supplied organization tenant/,
  );
});
