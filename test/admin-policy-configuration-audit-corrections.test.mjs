import test from "node:test";
import assert from "node:assert/strict";

import { GovernedConfigurationService } from "../src/application/admin/governed-configuration-service.ts";
import { AdministrativeAuditCorrectionService } from "../src/application/admin/administrative-audit-correction-service.ts";
import {
  GOVERNED_CONFIGURATION_KEYS,
  createGovernedConfigurationState,
  governedConfigurationKey,
  proposeGovernedConfigurationChange,
} from "../src/domain/admin-configuration/model.ts";
import {
  createPlatformAdministratorAuthorityContext,
  type PlatformAdministratorAuthorityContext,
} from "../src/domain/admin-authorization/model.ts";
import {
  defaultAdminRolePreset,
  permissionsFromAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";
import { createPlatformAdministrativeAuditEvent } from "../src/domain/admin-authorization/admin-audit.ts";

const now = "2026-07-30T20:00:00.000Z";

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
const conditionedRoot = authority("super-admin", "admin-root", true);

class MemoryConfigurationStore {
  constructor() {
    this.records = new Map();
    this.auditEvents = [];
  }
  async getByKey(key) { return this.records.get(key) ?? null; }
  async listAll() { return Object.freeze([...this.records.values()]); }
  async commitChange(input) {
    const current = this.records.get(input.state.key) ?? null;
    assert.equal(current?.revision ?? 0, input.expectedRevision);
    assert.equal(input.state.revision, input.expectedRevision + 1);
    this.records.set(input.state.key, input.state);
    this.auditEvents.push(input.auditEvent);
  }
}

class MemoryAuditRepository {
  constructor(events = []) {
    this.events = new Map(events.map((event) => [event.id, event]));
  }
  async append(event) {
    if (this.events.has(event.id)) throw new Error(`Platform admin audit event already exists: ${event.id}.`);
    this.events.set(event.id, event);
  }
  async getById(id) { return this.events.get(id) ?? null; }
  async listByAdministratorId(administratorId) {
    return [...this.events.values()].filter((event) => event.actorAdministratorId === administratorId);
  }
  async listByTarget(objectType, objectId) {
    return [...this.events.values()].filter((event) => event.target.objectType === objectType && event.target.objectId === objectId);
  }
}

function reauthSecurityContext() {
  return {
    authenticationSubject: "auth-subject",
    sessionId: "session-1",
    provider: "firebase-auth",
    reauthenticatedAt: "2026-07-30T19:59:00.000Z",
  };
}

test("ADM-083 exposes all required policy values through one governed configuration catalog", () => {
  assert.equal(GOVERNED_CONFIGURATION_KEYS.length, 15);
  assert.deepEqual(GOVERNED_CONFIGURATION_KEYS, [
    "verification.evidence-types",
    "credibility.thresholds",
    "credibility.badge-expiration",
    "founding.capacity",
    "plans.limits",
    "referral.fee-rules",
    "referral.payout-thresholds",
    "providers.categories",
    "rfx.types",
    "capabilities.taxonomy",
    "notifications.defaults",
    "geography.release-states",
    "accounts.inactivity-windows",
    "admin.case-slas",
    "support.categories",
  ]);
  const service = new GovernedConfigurationService({
    repository: new MemoryConfigurationStore(),
    changes: new MemoryConfigurationStore(),
  });
  assert.equal(service.catalog(technical).length, 15);
  assert.throws(() => service.catalog(authority("platform-administrator", "admin-platform")), /access denied/);
});

test("ADM-083 configuration changes require manage authority plus pre-resolved privileged conditions", async () => {
  const store = new MemoryConfigurationStore();
  const service = new GovernedConfigurationService({ repository: store, changes: store });
  await assert.rejects(
    () => service.change({
      authority: technical,
      key: "founding.capacity",
      value: 250,
      expectedRevision: 0,
      policyVersion: "mvp-v1",
      effectiveAt: now,
      reason: "Set approved Founding capacity.",
      now,
      execution: { auditEventId: "audit-config-1", securityContext: reauthSecurityContext() },
    }),
    /conditions-not-satisfied/,
  );

  const state = await service.change({
    authority: conditionedTechnical,
    key: "founding.capacity",
    value: 250,
    expectedRevision: 0,
    policyVersion: "mvp-v1",
    effectiveAt: now,
    reason: "Set approved Founding capacity.",
    now,
    execution: { auditEventId: "audit-config-1", securityContext: reauthSecurityContext() },
  });
  assert.equal(state.revision, 1);
  assert.equal(state.value, 250);
  assert.equal(store.auditEvents.length, 1);
  assert.equal(store.auditEvents[0].action, "config.value.changed");
  assert.equal(store.auditEvents[0].permissionsExercised.includes("config.value.manage"), true);
  assert.equal(store.auditEvents[0].priorState, null);
  assert.equal(store.auditEvents[0].newState.revision, 1);
});

test("ADM-083 supports guarded updates without code deployment and rejects stale revisions", async () => {
  const store = new MemoryConfigurationStore();
  const service = new GovernedConfigurationService({ repository: store, changes: store });
  await service.change({
    authority: conditionedTechnical,
    key: "rfx.types",
    value: ["rfi", "rfq", "rfp"],
    expectedRevision: 0,
    policyVersion: "mvp-v1",
    effectiveAt: now,
    reason: "Seed approved request types.",
    now,
    execution: { auditEventId: "audit-config-rfx-1", securityContext: reauthSecurityContext() },
  });
  const later = "2026-07-30T20:05:00.000Z";
  const updated = await service.change({
    authority: conditionedTechnical,
    key: "rfx.types",
    value: ["rfi", "rfq", "rfp", "sources-sought"],
    expectedRevision: 1,
    policyVersion: "mvp-v2",
    effectiveAt: later,
    reason: "Add Sources Sought request type.",
    now: later,
    execution: { auditEventId: "audit-config-rfx-2", securityContext: { ...reauthSecurityContext(), reauthenticatedAt: later } },
  });
  assert.equal(updated.revision, 2);
  assert.deepEqual(updated.value, ["rfi", "rfq", "rfp", "sources-sought"]);
  await assert.rejects(
    () => service.change({
      authority: conditionedTechnical,
      key: "rfx.types",
      value: ["rfp"],
      expectedRevision: 1,
      policyVersion: "stale-v3",
      effectiveAt: later,
      reason: "Stale change.",
      now: later,
      execution: { auditEventId: "audit-config-rfx-3", securityContext: { ...reauthSecurityContext(), reauthenticatedAt: later } },
    }),
    /revision mismatch/,
  );
});

test("ADM-083 keeps analyst access read-only and validates JSON/policy state", async () => {
  const state = createGovernedConfigurationState({
    key: "support.categories",
    value: ["account", "rfx"],
    revision: 1,
    policyVersion: "mvp-v1",
    effectiveAt: now,
    updatedAt: now,
    updatedByAdministratorId: conditionedRoot.administratorId,
  });
  const store = new MemoryConfigurationStore();
  store.records.set(governedConfigurationKey("support.categories"), state);
  const service = new GovernedConfigurationService({ repository: store, changes: store });
  assert.equal((await service.get(analyst, "support.categories")).revision, 1);
  await assert.rejects(
    () => service.change({
      authority: analyst,
      key: "support.categories",
      value: ["changed"],
      expectedRevision: 1,
      policyVersion: "mvp-v2",
      effectiveAt: now,
      reason: "Not allowed.",
      now,
      execution: { auditEventId: "audit-denied", securityContext: reauthSecurityContext() },
    }),
    /permission-not-granted/,
  );
  assert.throws(
    () => proposeGovernedConfigurationChange({
      current: null,
      key: "support.categories",
      value: { invalid: Number.NaN },
      expectedRevision: 0,
      policyVersion: "mvp-v1",
      effectiveAt: now,
      updatedAt: now,
      updatedByAdministratorId: conditionedRoot.administratorId,
    }),
    /non-finite number/,
  );
});

test("technical role can manage configuration while Analyst Auditor remains read-only", () => {
  const technicalPermissions = permissionsFromAdminRolePreset(defaultAdminRolePreset("technical-system-administrator"));
  const analystPermissions = permissionsFromAdminRolePreset(defaultAdminRolePreset("analyst-auditor"));
  assert.equal(technicalPermissions.includes("config.value.manage"), true);
  assert.equal(analystPermissions.includes("config.value.manage"), false);
  assert.equal(analystPermissions.includes("config.value.read"), true);
});

test("ADM-086 appends a correction event linked to the original without changing original history", async () => {
  const original = createPlatformAdministrativeAuditEvent(conditionedRoot, {
    id: "audit-original",
    permissionsExercised: ["organization.profile.update"],
    target: { organizationId: "org-alpha", objectType: "organization-profile", objectId: "org-alpha" },
    action: "organization.profile.updated",
    priorState: { legalName: "Alpha" },
    newState: { legalName: "Alpha LLC" },
    reason: "Approved profile correction.",
    occurredAt: "2026-07-30T18:00:00.000Z",
  });
  const repo = new MemoryAuditRepository([original]);
  const service = new AdministrativeAuditCorrectionService(repo);
  const before = structuredClone(original);
  const correction = await service.appendCorrection({
    authority: conditionedRoot,
    originalEventId: original.id,
    correctionEventId: "audit-correction-1",
    correctedState: { legalName: "Alpha Services LLC" },
    reason: "Correct legal-name value recorded in prior admin event.",
    occurredAt: now,
    execution: { securityContext: reauthSecurityContext(), relatedCaseId: "CASE-100" },
  });
  assert.deepEqual(original, before);
  assert.deepEqual(await repo.getById(original.id), original);
  assert.equal(correction.action, "audit.event.correction-appended");
  assert.equal(correction.target.objectType, "platform-administrative-audit-event");
  assert.equal(correction.target.objectId, original.id);
  assert.equal(correction.newState.correctionOfEventId, original.id);
  assert.deepEqual(correction.newState.correctedState, { legalName: "Alpha Services LLC" });
  assert.equal(repo.events.size, 2);
});

test("ADM-086 fails closed without correction permission, recent privileged context, or original event", async () => {
  const repo = new MemoryAuditRepository();
  const service = new AdministrativeAuditCorrectionService(repo);
  await assert.rejects(
    () => service.appendCorrection({
      authority: analyst,
      originalEventId: "missing",
      correctionEventId: "correction",
      correctedState: { field: "value" },
      reason: "Attempt.",
      occurredAt: now,
      execution: { securityContext: reauthSecurityContext() },
    }),
    /permission-not-granted/,
  );

  const rootWithoutCondition = authority("super-admin", "admin-root-unconditioned");
  await assert.rejects(
    () => service.appendCorrection({
      authority: rootWithoutCondition,
      originalEventId: "missing",
      correctionEventId: "correction",
      correctedState: { field: "value" },
      reason: "Attempt.",
      occurredAt: now,
      execution: { securityContext: reauthSecurityContext() },
    }),
    /conditions-not-satisfied/,
  );

  await assert.rejects(
    () => service.appendCorrection({
      authority: conditionedRoot,
      originalEventId: "missing",
      correctionEventId: "correction",
      correctedState: { field: "value" },
      reason: "Attempt.",
      occurredAt: now,
      execution: { securityContext: reauthSecurityContext() },
    }),
    /not found/,
  );
});
