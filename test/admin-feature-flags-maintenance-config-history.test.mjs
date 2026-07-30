import test from "node:test";
import assert from "node:assert/strict";

import { GovernedConfigurationService } from "../src/application/admin/governed-configuration-service.ts";
import { FeatureFlagAdministrationService } from "../src/application/admin/feature-flag-administration.ts";
import { SystemMaintenanceOperationService } from "../src/application/admin/system-maintenance-operations.ts";
import { ControlledSystemMaintenanceExecutor } from "../src/infrastructure/system/controlled-maintenance-executor.ts";
import {
  createPlatformAdministratorAuthorityContext,
} from "../src/domain/admin-authorization/model.ts";
import {
  defaultAdminRolePreset,
  permissionsFromAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";
import { completeSystemMaintenanceOperation } from "../src/domain/admin-system/maintenance-operations.ts";

const t0 = "2026-07-30T20:00:00.000Z";
const t1 = "2026-07-30T21:00:00.000Z";

function authority(key, administratorId, conditioned = false) {
  const preset = defaultAdminRolePreset(key);
  if (!conditioned) return resolveAuthorityContextFromAdminRolePreset(administratorId, preset);
  return createPlatformAdministratorAuthorityContext({
    administratorId,
    rolePresetKeys: [preset.key],
    effectivePermissions: permissionsFromAdminRolePreset(preset),
    scopeSatisfied: true,
    conditions: {
      requirement: "pre-resolved",
      status: "satisfied",
      evidenceKeys: ["recent-reauthentication"],
    },
  });
}

const technical = authority("technical-system-administrator", "admin-tech");
const conditionedTechnical = authority("technical-system-administrator", "admin-tech", true);
const analyst = authority("analyst-auditor", "admin-analyst");
const support = authority("member-success-support-administrator", "admin-support", true);

function security(at = t0) {
  return { authenticationSubject: "auth-admin", sessionId: "session-admin", provider: "firebase-auth", reauthenticatedAt: at };
}

class MemoryConfigurationStore {
  constructor() {
    this.records = new Map();
    this.history = new Map();
    this.audit = [];
  }
  async getByKey(key) { return this.records.get(key) ?? null; }
  async listAll() { return [...this.records.values()]; }
  async listHistoryByKey(key) { return [...(this.history.get(key) ?? [])]; }
  async commitChange(input) {
    const current = this.records.get(input.state.key) ?? null;
    assert.equal(current?.revision ?? 0, input.expectedRevision);
    assert.equal(input.changeRecord.revision, input.state.revision);
    this.records.set(input.state.key, input.state);
    this.history.set(input.state.key, [...(this.history.get(input.state.key) ?? []), input.changeRecord]);
    this.audit.push(input.auditEvent);
  }
}

class MemoryFeatureFlagStore {
  constructor() {
    this.states = new Map();
    this.changes = [];
    this.audit = [];
  }
  async getById(id) { return this.states.get(id) ?? null; }
  async listAll() { return [...this.states.values()]; }
  async commitChange(input) {
    assert.equal(this.states.get(input.state.id)?.revision ?? 0, input.expectedRevision);
    this.states.set(input.state.id, input.state);
    this.changes.push(input.changeRecord);
    this.audit.push(input.auditEvent);
  }
}

class MemoryMaintenanceStore {
  constructor() {
    this.operations = new Map();
    this.audit = [];
  }
  async createRequested({ operation, auditEvent }) {
    if (this.operations.has(operation.id)) throw new Error("duplicate operation");
    this.operations.set(operation.id, operation);
    this.audit.push(auditEvent);
  }
  async complete({ operationId, completedAt, result }) {
    const current = this.operations.get(operationId);
    if (!current) throw new Error("operation not found");
    const completed = completeSystemMaintenanceOperation(current, completedAt, result);
    this.operations.set(operationId, completed);
    return completed;
  }
  async getById(id) { return this.operations.get(id) ?? null; }
}

test("ADM-084 records immutable before/after version history and resolves the value effective at a point in time", async () => {
  const store = new MemoryConfigurationStore();
  const service = new GovernedConfigurationService({ repository: store, changes: store, history: store });
  await service.change({
    authority: conditionedTechnical,
    key: "founding.capacity",
    value: 250,
    expectedRevision: 0,
    policyVersion: "founder-v1",
    effectiveAt: t0,
    reason: "Set approved founding capacity.",
    now: t0,
    execution: { auditEventId: "audit-history-1", changeRecordId: "config-history-1", securityContext: security(t0) },
  });
  await service.change({
    authority: conditionedTechnical,
    key: "founding.capacity",
    value: 300,
    expectedRevision: 1,
    policyVersion: "founder-v2",
    effectiveAt: t1,
    reason: "Increase approved capacity.",
    now: t1,
    execution: { auditEventId: "audit-history-2", changeRecordId: "config-history-2", securityContext: security(t1) },
  });

  const history = await service.listHistory(analyst, "founding.capacity");
  assert.equal(history.length, 2);
  assert.equal(history[0].previousValue, null);
  assert.equal(history[0].newValue, 250);
  assert.equal(history[1].previousValue, 250);
  assert.equal(history[1].newValue, 300);
  assert.equal(history[1].actorAdministratorId, "admin-tech");
  assert.equal(history[1].reason, "Increase approved capacity.");
  assert.equal(history[1].policyVersion, "founder-v2");
  assert.equal((await service.valueEffectiveAt(analyst, "founding.capacity", "2026-07-30T20:30:00.000Z")).newValue, 250);
  assert.equal((await service.valueEffectiveAt(analyst, "founding.capacity", "2026-07-30T21:30:00.000Z")).newValue, 300);
  await assert.rejects(() => service.listHistory(support, "founding.capacity"), /permission-not-granted/);
});

test("ADM-047 only toggles approved flags in the current environment and every change is reversible and audited", async () => {
  const store = new MemoryFeatureFlagStore();
  const service = new FeatureFlagAdministrationService(store, store, "staging");
  assert.equal(service.catalog(technical).includes("rfx-publishing"), true);
  await assert.rejects(() => service.change({
    authority: conditionedTechnical,
    flag: "made-up-flag",
    environment: "staging",
    scopeKind: "global",
    enabled: true,
    expectedRevision: 0,
    reason: "No.",
    now: t0,
    auditEventId: "flag-audit-bad",
    securityContext: security(t0),
  }), /not approved/);
  await assert.rejects(() => service.change({
    authority: conditionedTechnical,
    flag: "rfx-publishing",
    environment: "production",
    scopeKind: "global",
    enabled: true,
    expectedRevision: 0,
    reason: "Wrong environment.",
    now: t0,
    auditEventId: "flag-audit-env",
    securityContext: security(t0),
  }), /environment mismatch/);
  await assert.rejects(() => service.change({
    authority: technical,
    flag: "rfx-publishing",
    environment: "staging",
    scopeKind: "global",
    enabled: true,
    expectedRevision: 0,
    reason: "Requires reauth.",
    now: t0,
    auditEventId: "flag-audit-no-reauth",
    securityContext: security(t0),
  }), /conditions-not-satisfied/);

  const enabled = await service.change({
    authority: conditionedTechnical,
    flag: "rfx-publishing",
    environment: "staging",
    scopeKind: "geography",
    scopeId: "51093",
    enabled: true,
    expectedRevision: 0,
    reason: "Enable controlled pilot.",
    now: t0,
    auditEventId: "flag-audit-1",
    changeRecordId: "flag-change-1",
    securityContext: security(t0),
  });
  const disabled = await service.change({
    authority: conditionedTechnical,
    flag: "rfx-publishing",
    environment: "staging",
    scopeKind: "geography",
    scopeId: "51093",
    enabled: false,
    expectedRevision: 1,
    reason: "End controlled pilot.",
    now: t1,
    auditEventId: "flag-audit-2",
    changeRecordId: "flag-change-2",
    securityContext: security(t1),
  });
  assert.equal(enabled.enabled, true);
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.revision, 2);
  assert.deepEqual(store.changes.map((change) => [change.previousEnabled, change.enabled]), [[null, true], [true, false]]);
  assert.equal(store.audit.every((event) => event.action === "config.feature-flag.changed"), true);
});

test("ADM-048 routes recovery through guarded server handlers and returns persisted status feedback", async () => {
  const store = new MemoryMaintenanceStore();
  const executor = new ControlledSystemMaintenanceExecutor({
    "retry-background-job": async (operation) => ({ status: "succeeded", summary: `Retried ${operation.target}`, diagnosticReference: "retry-42" }),
    reindex: async () => ({ status: "failed", summary: "Index provider rejected request.", diagnosticReference: "index-busy" }),
    "disable-failing-integration": async () => ({ status: "succeeded", summary: "Integration disabled temporarily." }),
    "background-repair": async () => ({ status: "succeeded", summary: "Repair completed." }),
    "maintenance-mode": async () => ({ status: "succeeded", summary: "Maintenance state changed." }),
  });
  const service = new SystemMaintenanceOperationService(store, executor, "production");

  await assert.rejects(() => service.request({
    authority: conditionedTechnical,
    operationId: "op-no-confirm",
    action: "retry-background-job",
    target: "job-42",
    environment: "production",
    reason: "Retry after provider recovery.",
    idempotencyKey: "retry-job-42",
    now: t0,
    auditEventId: "maint-audit-0",
    securityContext: security(t0),
  }), /confirmation token/);

  await assert.rejects(() => service.request({
    authority: conditionedTechnical,
    operationId: "op-repair-bad",
    action: "background-repair",
    target: "organization-directory",
    environment: "production",
    reason: "Repair inconsistent projection.",
    idempotencyKey: "repair-1",
    confirmation: "confirm:background-repair:organization-directory:production",
    parameters: { dryRun: false },
    now: t0,
    auditEventId: "maint-audit-repair-bad",
    securityContext: security(t0),
  }), /validatedDryRunReference/);

  const retry = await service.request({
    authority: conditionedTechnical,
    operationId: "op-retry-42",
    action: "retry-background-job",
    target: "job-42",
    environment: "production",
    reason: "Retry after provider recovery.",
    idempotencyKey: "retry-job-42",
    confirmation: "confirm:retry-background-job:job-42:production",
    now: t0,
    auditEventId: "maint-audit-1",
    securityContext: security(t0),
  });
  assert.equal(retry.status, "succeeded");
  assert.equal(retry.diagnosticReference, "retry-42");
  assert.equal((await service.get(technical, "op-retry-42")).status, "succeeded");
  assert.equal(store.audit[0].action, "system.maintenance.retry-background-job");

  const reindex = await service.request({
    authority: conditionedTechnical,
    operationId: "op-reindex",
    action: "reindex",
    target: "organization-directory",
    environment: "production",
    reason: "Recover index drift.",
    idempotencyKey: "reindex-org-directory",
    confirmation: "confirm:reindex:organization-directory:production",
    parameters: { mode: "incremental" },
    now: t1,
    auditEventId: "maint-audit-2",
    securityContext: security(t1),
  });
  assert.equal(reindex.status, "failed");
  assert.equal(reindex.diagnosticReference, "index-busy");
  await assert.rejects(() => service.get(support, "op-reindex"), /permission-not-granted/);
});
