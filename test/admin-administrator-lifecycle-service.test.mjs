import test from "node:test";
import assert from "node:assert/strict";

import { AdministratorLifecycleService } from "../src/application/admin/administrator-lifecycle-service.ts";
import { defaultAdminRolePreset, resolveAuthorityContextFromAdminRolePreset } from "../src/domain/admin-authorization/role-presets.ts";

const actor = resolveAuthorityContextFromAdminRolePreset("admin-root", defaultAdminRolePreset("super-admin"));

function harness() {
  const accounts = new Map();
  const events = new Map();
  const calls = [];
  const repository = {
    async getByAdministratorId(id) { return accounts.get(id) ?? null; },
    async getBySubject(subject) { return [...accounts.values()].find((account) => account.subject === subject) ?? null; },
    async save(account) { accounts.set(account.administratorId, account); },
    async appendEvent(event) { if (events.has(event.id)) throw new Error("duplicate event"); events.set(event.id, event); },
    async getEventById(id) { return events.get(id) ?? null; },
    async listEventsForAdministrator(id) { return [...events.values()].filter((event) => event.targetAdministratorId === id); },
  };
  const identity = {
    async disable(subject) { calls.push(["disable", subject]); },
    async revokeSessions(subject) { calls.push(["revoke", subject]); },
  };
  return { service: new AdministratorLifecycleService(repository, identity), accounts, events, calls };
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

test("lock and disable invoke provider disable while security requirements revoke sessions", async () => {
  const h = harness();
  const account = await created(h);
  await h.service.lock(actor, account, { eventId: "evt-lock", reason: "Incident", occurredAt: "2026-07-30T10:02:00.000Z" });
  assert.deepEqual(h.calls.at(-1), ["disable", "firebase-target"]);

  const h2 = harness();
  const account2 = await created(h2);
  await h2.service.requireMfa(actor, account2, { eventId: "evt-mfa", reason: "Require MFA", occurredAt: "2026-07-30T10:02:00.000Z" });
  assert.deepEqual(h2.calls.at(-1), ["revoke", "firebase-target"]);
  assert.equal(h2.events.get("evt-mfa").permission, "admin.security.mfa.require");

  const h3 = harness();
  const account3 = await created(h3);
  await h3.service.terminateSessions(actor, account3, { eventId: "evt-session", reason: "Terminate sessions", occurredAt: "2026-07-30T10:02:00.000Z" });
  assert.deepEqual(h3.calls.at(-1), ["revoke", "firebase-target"]);
});
