import test from "node:test";
import assert from "node:assert/strict";

import { AdministratorLifecycleService } from "../src/application/admin/administrator-lifecycle-service.ts";
import { defaultAdminRolePreset, resolveAuthorityContextFromAdminRolePreset } from "../src/domain/admin-authorization/role-presets.ts";

const actor = resolveAuthorityContextFromAdminRolePreset("admin-root", defaultAdminRolePreset("super-admin"));

function sensitiveAudit(id) {
  return {
    auditEventId: id,
    securityContext: {
      sessionId: "session-root",
      deviceId: "device-root",
      provider: "firebase",
      mfaVerifiedAt: "2026-07-30T10:01:00.000Z",
      reauthenticatedAt: "2026-07-30T10:01:30.000Z",
      networkContextHash: "network-hash",
    },
    evidenceReferences: ["security-case-evidence"],
    approvalReferences: [{ approvalId: "approval-1", approverAdministratorId: "admin-approver" }],
  };
}

function harness() {
  const accounts = new Map();
  const events = new Map();
  const audits = new Map();
  const calls = [];
  const repository = {
    async getByAdministratorId(id) { return accounts.get(id) ?? null; },
    async getBySubject(subject) { return [...accounts.values()].find((account) => account.subject === subject) ?? null; },
    async save(account) { accounts.set(account.administratorId, account); },
    async appendEvent(event) { if (events.has(event.id)) throw new Error("duplicate event"); events.set(event.id, event); },
    async getEventById(id) { return events.get(id) ?? null; },
    async listEventsForAdministrator(id) { return [...events.values()].filter((event) => event.targetAdministratorId === id); },
  };
  const audit = {
    async append(event) { if (audits.has(event.id)) throw new Error("duplicate audit"); audits.set(event.id, event); },
    async getById(id) { return audits.get(id) ?? null; },
    async listByAdministratorId(id) { return [...audits.values()].filter((event) => event.actorAdministratorId === id); },
    async listByTarget(type, id) { return [...audits.values()].filter((event) => event.target.objectType === type && event.target.objectId === id); },
  };
  const identity = {
    async disable(subject) { calls.push(["disable", subject]); },
    async revokeSessions(subject) { calls.push(["revoke", subject]); },
  };
  return { service: new AdministratorLifecycleService(repository, identity, audit), accounts, events, audits, calls };
}

async function created(h) {
  return h.service.create(actor, {
    administratorId: "admin-target",
    subject: "firebase-target",
    rolePresetKeys: ["platform-administrator"],
    eventId: "evt-create",
    reason: "Create account",
    occurredAt: "2026-07-30T10:00:00.000Z",
  });
}

test("application service rejects duplicate administrator identity and subject", async () => {
  const h = harness();
  await created(h);
  assert.equal(h.audits.get("audit-evt-create").action, "administrator.created");
  await assert.rejects(() => h.service.create(actor, {
    administratorId: "admin-target",
    subject: "firebase-other",
    rolePresetKeys: ["platform-administrator"],
    eventId: "evt-dup-id",
    reason: "Duplicate",
    occurredAt: "2026-07-30T10:01:00.000Z",
  }), /id already exists/);
  await assert.rejects(() => h.service.create(actor, {
    administratorId: "admin-other",
    subject: "firebase-target",
    rolePresetKeys: ["platform-administrator"],
    eventId: "evt-dup-subject",
    reason: "Duplicate",
    occurredAt: "2026-07-30T10:01:00.000Z",
  }), /subject is already assigned/);
});

test("sensitive lifecycle actions require audit re-authentication before provider side effects", async () => {
  const h = harness();
  const account = await created(h);
  await assert.rejects(
    () => h.service.lock(actor, account, { eventId: "evt-lock-no-audit", reason: "Incident", occurredAt: "2026-07-30T10:02:00.000Z" }, { auditEventId: "audit-lock-no-context" }),
    /require recent re-authentication context/,
  );
  assert.equal(h.calls.length, 0, "provider effect must not run before audit validation");
});

test("lock and credential/session controls invoke provider effects and canonical immutable audit", async () => {
  const h = harness();
  const account = await created(h);
  await h.service.lock(actor, account, { eventId: "evt-lock", reason: "Incident", occurredAt: "2026-07-30T10:02:00.000Z" }, sensitiveAudit("audit-lock"));
  assert.deepEqual(h.calls.at(-1), ["disable", "firebase-target"]);
  assert.equal(h.audits.get("audit-lock").sensitivity, "sensitive");
  assert.equal(h.audits.get("audit-lock").permissionsExercised[0], "admin.security.lock");
  assert.equal(h.audits.get("audit-lock").target.objectId, "admin-target");
  assert.equal(h.audits.get("audit-lock").priorState.locked, false);
  assert.equal(h.audits.get("audit-lock").newState.locked, true);

  const h2 = harness();
  const account2 = await created(h2);
  await h2.service.requireMfa(actor, account2, { eventId: "evt-mfa", reason: "Require MFA", occurredAt: "2026-07-30T10:02:00.000Z" }, sensitiveAudit("audit-mfa"));
  assert.deepEqual(h2.calls.at(-1), ["revoke", "firebase-target"]);
  assert.equal(h2.events.get("evt-mfa").permission, "admin.security.mfa.require");
  assert.equal(h2.audits.get("audit-mfa").securityContext.reauthenticatedAt, "2026-07-30T10:01:30.000Z");

  const h3 = harness();
  const account3 = await created(h3);
  await h3.service.terminateSessions(actor, account3, { eventId: "evt-session", reason: "Terminate sessions", occurredAt: "2026-07-30T10:02:00.000Z" }, sensitiveAudit("audit-session"));
  assert.deepEqual(h3.calls.at(-1), ["revoke", "firebase-target"]);
  assert.equal(h3.audits.get("audit-session").approvalReferences[0].approvalId, "approval-1");
});
