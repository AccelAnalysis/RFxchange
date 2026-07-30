import test from "node:test";
import assert from "node:assert/strict";

import { createPlatformAdministrativeAuditEvent } from "../src/domain/admin-authorization/admin-audit.ts";
import { defaultAdminRolePreset, resolveAuthorityContextFromAdminRolePreset } from "../src/domain/admin-authorization/role-presets.ts";

const actor = resolveAuthorityContextFromAdminRolePreset("admin-root", defaultAdminRolePreset("super-admin"));

function base(overrides = {}) {
  return {
    id: "audit-1",
    permissionsExercised: ["admin.lifecycle.access.manage"],
    target: { organizationId: "org-1", userId: "user-1", objectType: "platform-administrator", objectId: "admin-target" },
    action: "administrator.access.updated",
    priorState: { roles: ["analyst-auditor"] },
    newState: { roles: ["platform-administrator"] },
    reason: "Approved access change",
    relatedCaseId: "case-77",
    occurredAt: "2026-07-30T15:00:00.000Z",
    securityContext: {
      authenticationSubject: "firebase-root",
      sessionId: "session-root",
      deviceId: "device-root",
      provider: "firebase",
      mfaVerifiedAt: "2026-07-30T14:58:00.000Z",
      reauthenticatedAt: "2026-07-30T14:59:00.000Z",
      networkContextHash: "network-hash",
    },
    justification: "Role expansion approved for operational coverage.",
    evidenceReferences: ["evidence-1"],
    approvalReferences: [{ approvalId: "approval-1", approverAdministratorId: "admin-approver" }],
    sensitivity: "sensitive",
    ...overrides,
  };
}

test("canonical admin audit event captures all required attribution and before/after context", () => {
  const event = createPlatformAdministrativeAuditEvent(actor, base());
  assert.equal(event.actorAdministratorId, actor.administratorId);
  assert.deepEqual(event.actorRolePresetKeys, actor.rolePresetKeys);
  assert.deepEqual(event.permissionsExercised, ["admin.lifecycle.access.manage"]);
  assert.equal(event.target.organizationId, "org-1");
  assert.equal(event.target.userId, "user-1");
  assert.equal(event.target.objectType, "platform-administrator");
  assert.deepEqual(event.priorState, { roles: ["analyst-auditor"] });
  assert.deepEqual(event.newState, { roles: ["platform-administrator"] });
  assert.equal(event.reason, "Approved access change");
  assert.equal(event.relatedCaseId, "case-77");
  assert.equal(event.securityContext.sessionId, "session-root");
  assert.equal(event.evidenceReferences[0], "evidence-1");
  assert.equal(event.approvalReferences[0].approvalId, "approval-1");
  assert.ok(Object.isFrozen(event));
  assert.ok(Object.isFrozen(event.priorState));
  assert.ok(Object.isFrozen(event.newState));
});

test("allowed audit events require at least one catalogued permission exercised", () => {
  assert.throws(() => createPlatformAdministrativeAuditEvent(actor, base({ permissionsExercised: [] })), /at least one permission exercised/);
  assert.throws(() => createPlatformAdministrativeAuditEvent(actor, base({ permissionsExercised: ["made.up.permission"] })), /Unsupported administrative permission namespace|not in the catalog/);
});

test("sensitive audit events require recent re-authentication context", () => {
  assert.throws(
    () => createPlatformAdministrativeAuditEvent(actor, base({ securityContext: { provider: "firebase" } })),
    /require recent re-authentication context/,
  );
});

test("ordinary events retain complete structure without inventing sensitive evidence", () => {
  const event = createPlatformAdministrativeAuditEvent(actor, base({
    id: "audit-ordinary",
    sensitivity: "ordinary",
    securityContext: {},
    evidenceReferences: [],
    approvalReferences: [],
    justification: null,
  }));
  assert.equal(event.sensitivity, "ordinary");
  assert.equal(event.securityContext.reauthenticatedAt, null);
  assert.deepEqual(event.evidenceReferences, []);
  assert.deepEqual(event.approvalReferences, []);
});

test("denied attempts can be recorded without claiming a permission was exercised", () => {
  const event = createPlatformAdministrativeAuditEvent(actor, base({
    id: "audit-denied",
    outcome: "denied",
    sensitivity: "ordinary",
    permissionsExercised: [],
    securityContext: {},
    priorState: null,
    newState: null,
    reason: "Issuer-only action denied",
    evidenceReferences: [],
    approvalReferences: [],
  }));
  assert.equal(event.outcome, "denied");
  assert.deepEqual(event.permissionsExercised, []);
});
