import test from "node:test";
import assert from "node:assert/strict";

import { createAdminPermissionGrant, createScopedAdministrativeActionRequirement } from "../src/domain/admin-authorization/grants.ts";
import {
  authorizeConditionalScopedAdministrativeAction,
  createAdminSensitiveActionPolicy,
} from "../src/domain/admin-authorization/conditions.ts";
import {
  createPlatformAdministratorRoleConfiguration,
  resolveAuthorityContextFromAdminRoleConfiguration,
} from "../src/domain/admin-authorization/role-configuration.ts";
import { DEFAULT_ADMIN_ROLE_PRESETS } from "../src/domain/admin-authorization/role-presets.ts";

const now = "2026-07-29T20:00:00.000Z";
const permission = "credibility.badge.revoke";
const scope = "ORGANIZATION:org-1";

function authority(removedPermissions = []) {
  const configuration = createPlatformAdministratorRoleConfiguration({
    administratorId: "admin-1",
    rolePresetKeys: ["verification-credibility-administrator"],
    removedPermissions,
    createdAt: "2026-07-29T19:00:00.000Z",
  });
  return resolveAuthorityContextFromAdminRoleConfiguration(configuration, DEFAULT_ADMIN_ROLE_PRESETS);
}

function grant() {
  return createAdminPermissionGrant({
    id: "grant-sensitive",
    administratorId: "admin-1",
    permission,
    scope: "GLOBAL",
    createdAt: "2026-07-29T19:00:00.000Z",
  });
}

function requirement() {
  return createScopedAdministrativeActionRequirement({ permission, access: "write", scope });
}

function policy() {
  return createAdminSensitiveActionPolicy({
    permission,
    requiredConditions: [
      { kind: "justification", minimumCharacters: 10 },
      { kind: "evidence", minimumReferences: 2 },
      { kind: "recent-reauthentication", maximumAgeSeconds: 300 },
      { kind: "secondary-approval", maximumAgeSeconds: 600 },
    ],
    createdAt: "2026-07-29T18:00:00.000Z",
  });
}

function completeEvidence(overrides = {}) {
  return {
    justification: "Verified evidence supports this administrative action.",
    evidenceReferences: ["evidence-1", "evidence-2"],
    reauthenticatedAt: "2026-07-29T19:58:00.000Z",
    secondaryApprovals: [
      {
        approverAdministratorId: "admin-2",
        permission,
        scopeValue: scope,
        approvedAt: "2026-07-29T19:57:00.000Z",
      },
    ],
    ...overrides,
  };
}

test("ordinary authorized scoped action passes when no sensitive policy is configured", () => {
  const decision = authorizeConditionalScopedAdministrativeAction(
    authority(),
    [grant()],
    requirement(),
    null,
    { now },
  );
  assert.equal(decision.kind, "allow");
  assert.deepEqual(decision.satisfiedConditions, []);
});

test("required justification must be present and sufficiently descriptive", () => {
  const decision = authorizeConditionalScopedAdministrativeAction(
    authority(), [grant()], requirement(), policy(), { now, evidence: completeEvidence({ justification: "short" }) },
  );
  assert.equal(decision.kind, "deny");
  assert.equal(decision.phase, "conditions");
  assert.equal(decision.reason, "justification-required");
});

test("required evidence references cannot be omitted", () => {
  const decision = authorizeConditionalScopedAdministrativeAction(
    authority(), [grant()], requirement(), policy(), { now, evidence: completeEvidence({ evidenceReferences: ["only-one"] }) },
  );
  assert.equal(decision.kind, "deny");
  assert.equal(decision.phase, "conditions");
  assert.equal(decision.reason, "evidence-required");
});

test("recent reauthentication is required and stale evidence fails closed", () => {
  const missing = authorizeConditionalScopedAdministrativeAction(
    authority(), [grant()], requirement(), policy(), { now, evidence: completeEvidence({ reauthenticatedAt: null }) },
  );
  assert.equal(missing.kind, "deny");
  assert.equal(missing.reason, "reauthentication-required");

  const stale = authorizeConditionalScopedAdministrativeAction(
    authority(), [grant()], requirement(), policy(), {
      now,
      evidence: completeEvidence({ reauthenticatedAt: "2026-07-29T19:50:00.000Z" }),
    },
  );
  assert.equal(stale.kind, "deny");
  assert.equal(stale.reason, "reauthentication-stale");
});

test("secondary approval must be distinct, permission-bound, scope-bound, and recent", () => {
  for (const approval of [
    { approverAdministratorId: "admin-1", permission, scopeValue: scope, approvedAt: "2026-07-29T19:59:00.000Z" },
    { approverAdministratorId: "admin-2", permission: "credibility.badge.restore", scopeValue: scope, approvedAt: "2026-07-29T19:59:00.000Z" },
    { approverAdministratorId: "admin-2", permission, scopeValue: "ORGANIZATION:org-2", approvedAt: "2026-07-29T19:59:00.000Z" },
    { approverAdministratorId: "admin-2", permission, scopeValue: scope, approvedAt: "2026-07-29T19:45:00.000Z" },
  ]) {
    const decision = authorizeConditionalScopedAdministrativeAction(
      authority(), [grant()], requirement(), policy(), {
        now,
        evidence: completeEvidence({ secondaryApprovals: [approval] }),
      },
    );
    assert.equal(decision.kind, "deny");
    assert.equal(decision.reason, "secondary-approval-required");
  }
});

test("all configured sensitive conditions allow only after base authorization succeeds", () => {
  const decision = authorizeConditionalScopedAdministrativeAction(
    authority(), [grant()], requirement(), policy(), { now, evidence: completeEvidence() },
  );
  assert.equal(decision.kind, "allow");
  assert.deepEqual(decision.satisfiedConditions, [
    "justification",
    "evidence",
    "recent-reauthentication",
    "secondary-approval",
  ]);
});

test("condition evidence cannot grant a permission explicitly removed from the administrator", () => {
  const decision = authorizeConditionalScopedAdministrativeAction(
    authority([permission]), [grant()], requirement(), policy(), { now, evidence: completeEvidence() },
  );
  assert.equal(decision.kind, "deny");
  assert.equal(decision.phase, "authorization");
  assert.equal(decision.authorization.reason, "permission-not-granted");
});

test("policy configuration fails closed for mismatch, duplicate conditions, and invalid limits", () => {
  assert.throws(
    () => createAdminSensitiveActionPolicy({
      permission,
      requiredConditions: [{ kind: "justification" }, { kind: "justification" }],
      createdAt: now,
    }),
    /cannot repeat a condition kind/,
  );
  assert.throws(
    () => createAdminSensitiveActionPolicy({
      permission,
      requiredConditions: [{ kind: "recent-reauthentication", maximumAgeSeconds: 0 }],
      createdAt: now,
    }),
    /positive integer/,
  );

  const mismatched = createAdminSensitiveActionPolicy({
    permission: "credibility.badge.restore",
    requiredConditions: [{ kind: "justification" }],
    createdAt: now,
  });
  assert.throws(
    () => authorizeConditionalScopedAdministrativeAction(
      authority(), [grant()], requirement(), mismatched, { now, evidence: completeEvidence() },
    ),
    /does not match the authorized action permission/,
  );
});
