import assert from "node:assert/strict";
import test from "node:test";

import {
  ORGANIZATION_ASSET_KINDS,
  assertOrganizationOwnsAsset,
  belongsToOrganization,
  createOrganizationAssetRef,
  organizationAssetKind,
} from "../src/domain/assets/model.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";

const NOW = "2026-07-29T00:00:00-04:00";

function organization(id) {
  return createOrganizationAccount({ id, now: NOW });
}

test("all ARC-009 asset families derive ownership from an organization tenant", () => {
  const org = organization("org_owner");

  const expectedKinds = [
    "capability",
    "location",
    "service-area",
    "rfx",
    "response",
    "referral",
    "team",
    "document",
    "resource",
    "membership",
    "credibility",
  ];

  assert.deepEqual([...ORGANIZATION_ASSET_KINDS], expectedKinds);

  for (const kind of expectedKinds) {
    const asset = createOrganizationAssetRef(org, { id: `${kind}_001`, kind });
    assert.equal(asset.organizationId, org.id);
    assert.equal(asset.kind, kind);
    assert.equal(belongsToOrganization(org, asset), true);
  }
});

test("cross-tenant asset ownership is rejected", () => {
  const first = organization("org_first");
  const second = organization("org_second");
  const rfx = createOrganizationAssetRef(first, { id: "rfx_001", kind: "rfx" });

  assert.doesNotThrow(() => assertOrganizationOwnsAsset(first, rfx));
  assert.equal(belongsToOrganization(second, rfx), false);
  assert.throws(
    () => assertOrganizationOwnsAsset(second, rfx),
    /different organization tenant/,
  );
});

test("existing organization membership satisfies the organization-scoped ownership contract", () => {
  const org = organization("org_membership");
  const user = createUserIdentity({
    id: "user_001",
    name: "Member User",
    primaryEmail: "member@example.com",
    loginProvider: "example-idp",
    loginSubject: "subject_001",
    now: NOW,
  });
  const membership = createOrganizationMembership(user, org, {
    id: "membership_001",
    now: NOW,
  });

  assert.equal(membership.organizationId, org.id);
  assert.doesNotThrow(() => assertOrganizationOwnsAsset(org, membership));
});

test("asset IDs and kinds are validated without introducing individual ownership", () => {
  const org = organization("org_validation");

  assert.throws(
    () => createOrganizationAssetRef(org, { id: "   ", kind: "document" }),
    /Organization asset id is required/,
  );
  assert.throws(() => organizationAssetKind("user-profile"), /Unsupported organization asset kind/);

  const document = createOrganizationAssetRef(org, { id: "document_001", kind: "document" });
  assert.equal("userId" in document, false);
  assert.equal("ownerUserId" in document, false);
});
