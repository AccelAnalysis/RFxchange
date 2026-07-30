import assert from "node:assert/strict";
import test from "node:test";

import {
  activateStoredAsset,
  createStoredAssetDraft,
  evaluateStoredAssetAccess,
} from "../src/domain/storage/model.ts";

const now = "2026-07-29T20:00:00.000Z";
const orgA = "org-a";
const orgB = "org-b";

function logoDraft(overrides = {}) {
  return createStoredAssetDraft({
    id: "asset-logo-1",
    organizationId: orgA,
    category: "organization-logo",
    originalFilename: "  ACME / Logo.PNG  ",
    contentType: "image/png",
    sizeBytes: 12,
    createdByUserId: "user-a",
    now,
    ...overrides,
  });
}

test("creates a controlled private object path and sanitizes display metadata", () => {
  const asset = logoDraft();
  assert.equal(asset.visibility, "private");
  assert.equal(asset.status, "pending-upload");
  assert.equal(asset.objectPath, "organizations/org-a/private/organization-logo/asset-logo-1/object.png");
  assert.equal(asset.originalFilename, "ACME - Logo.PNG");
  assert.equal(asset.sensitivity, "standard");
});

test("rejects unsupported types, oversized content, and path-shaped identifiers", () => {
  assert.throws(() => logoDraft({ contentType: "text/html" }), /not permitted/);
  assert.throws(() => logoDraft({ sizeBytes: 6 * 1024 * 1024 }), /exceeds/);
  assert.throws(() => logoDraft({ id: "../asset" }), /stable machine-readable/);
});

test("activates metadata only when object identity and integrity match", () => {
  const draft = logoDraft();
  const active = activateStoredAsset(
    draft,
    {
      objectPath: draft.objectPath,
      contentType: draft.contentType,
      sizeBytes: draft.sizeBytes,
      sha256: "a".repeat(64),
    },
    now,
  );
  assert.equal(active.status, "active");
  assert.equal(active.sha256, "a".repeat(64));
  assert.throws(
    () => activateStoredAsset(draft, { objectPath: "wrong", contentType: draft.contentType, sizeBytes: 12, sha256: "a".repeat(64) }, now),
    /path does not match/,
  );
});

test("organization access is tenant-bound and permission-bound", () => {
  const target = { organizationId: orgA, category: "organization-logo" };
  assert.equal(
    evaluateStoredAssetAccess(
      { kind: "organization-member", organizationId: orgA, permissions: ["organization.profile.manage"] },
      target,
      "create",
    ).allowed,
    true,
  );
  assert.deepEqual(
    evaluateStoredAssetAccess(
      { kind: "organization-member", organizationId: orgB, permissions: ["organization.profile.manage"] },
      target,
      "read",
    ),
    { allowed: false, reason: "wrong-organization", requiredPermission: "organization.profile.manage" },
  );
  assert.deepEqual(
    evaluateStoredAssetAccess(
      { kind: "organization-member", organizationId: orgA, permissions: [] },
      target,
      "read",
    ),
    { allowed: false, reason: "missing-permission", requiredPermission: "organization.profile.manage" },
  );
});

test("administrative storage access requires explicit named capabilities", () => {
  const target = { organizationId: orgA, category: "verification-evidence" };
  assert.equal(
    evaluateStoredAssetAccess(
      { kind: "platform-administrator", permissions: ["organization.asset.read"] },
      target,
      "read",
    ).allowed,
    true,
  );
  assert.deepEqual(
    evaluateStoredAssetAccess(
      { kind: "platform-administrator", permissions: [] },
      target,
      "read",
    ),
    { allowed: false, reason: "missing-permission", requiredPermission: "organization.asset.read" },
  );
});
