import test from "node:test";
import assert from "node:assert/strict";

import {
  AdministrativeCaseService,
  AdministrativeCaseWorkQueueProvider,
  administrativeCaseToWorkItem,
} from "../src/application/admin/administrative-case-service.ts";
import {
  ADMINISTRATIVE_CASE_STATUSES,
  assessAdministrativeCaseSla,
  createAdministrativeCase,
  transitionAdministrativeCase,
} from "../src/domain/admin-cases/model.ts";
import {
  defaultAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";

const NOW = "2026-07-30T14:00:00.000Z";
const support = resolveAuthorityContextFromAdminRolePreset(
  "admin-support",
  defaultAdminRolePreset("member-success-support-administrator"),
);
const technical = resolveAuthorityContextFromAdminRolePreset(
  "admin-tech",
  defaultAdminRolePreset("technical-system-administrator"),
);

function makeCase(overrides = {}) {
  return createAdministrativeCase({
    id: "case-1",
    caseNumber: "CASE-000001",
    objectType: "support-case",
    objectId: "support-1",
    organizationId: "org-1",
    userId: "user-1",
    type: "support",
    severity: "high",
    source: "support",
    geography: "Isle of Wight County, VA",
    evidenceReferences: ["evidence-1"],
    relatedCaseIds: ["case-related"],
    readPermission: "support.case.read",
    actionPermission: "support.case.update",
    slaPolicyKey: "support-high-4h",
    slaDueAt: "2026-07-30T18:00:00.000Z",
    now: NOW,
    ...overrides,
  });
}

test("ADM-061 canonical case captures the complete work envelope", () => {
  const record = makeCase();
  assert.equal(record.caseNumber, "CASE-000001");
  assert.equal(record.objectType, "support-case");
  assert.equal(record.organizationId, "org-1");
  assert.equal(record.userId, "user-1");
  assert.equal(record.severity, "high");
  assert.equal(record.source, "support");
  assert.equal(record.geography, "Isle of Wight County, VA");
  assert.equal(record.status, "new");
  assert.equal(record.evidenceReferences.length, 1);
  assert.equal(record.relatedCaseIds.length, 1);
  assert.equal(record.readPermission, "support.case.read");
  assert.equal(record.actionPermission, "support.case.update");
});

test("ADM-062 exposes the exact specified lifecycle in order", () => {
  assert.deepEqual(ADMINISTRATIVE_CASE_STATUSES, [
    "new",
    "triaged",
    "assigned",
    "in-review",
    "waiting-for-participant",
    "action-required",
    "monitoring",
    "resolved",
    "closed",
  ]);
});

test("ADM-062 requires sequential transitions, assignment identity and immutable event evidence", () => {
  let record = makeCase();
  const triaged = transitionAdministrativeCase({
    caseRecord: record,
    eventId: "event-1",
    actorAdministratorId: "admin-support",
    nextStatus: "triaged",
    reason: "Validated incoming case.",
    now: "2026-07-30T14:05:00.000Z",
  });
  assert.equal(triaged.caseRecord.status, "triaged");
  assert.equal(triaged.event.fromStatus, "new");
  assert.equal(triaged.event.toStatus, "triaged");
  assert.equal(triaged.event.actorAdministratorId, "admin-support");
  assert.throws(
    () => transitionAdministrativeCase({
      caseRecord: triaged.caseRecord,
      eventId: "event-skip",
      actorAdministratorId: "admin-support",
      nextStatus: "in-review",
      reason: "Attempted skip.",
      now: "2026-07-30T14:06:00.000Z",
    }),
    /Invalid administrative case transition/,
  );
  assert.throws(
    () => transitionAdministrativeCase({
      caseRecord: triaged.caseRecord,
      eventId: "event-no-assignee",
      actorAdministratorId: "admin-support",
      nextStatus: "assigned",
      reason: "Assign case.",
      now: "2026-07-30T14:06:00.000Z",
    }),
    /Assigned administrator id is required/,
  );
  const assigned = transitionAdministrativeCase({
    caseRecord: triaged.caseRecord,
    eventId: "event-2",
    actorAdministratorId: "admin-support",
    nextStatus: "assigned",
    assignedAdministratorId: "admin-investigator",
    reason: "Assigned to case owner.",
    now: "2026-07-30T14:07:00.000Z",
  });
  assert.equal(assigned.caseRecord.assignedAdministratorId, "admin-investigator");
  assert.equal(assigned.event.assignedAdministratorId, "admin-investigator");
  record = assigned.caseRecord;
  assert.equal(record.status, "assigned");
});

test("ADM-062 SLA evaluates within, due-soon, overdue and satisfied states", () => {
  const record = makeCase();
  assert.equal(assessAdministrativeCaseSla(record, "2026-07-30T15:00:00.000Z"), "within-sla");
  assert.equal(assessAdministrativeCaseSla(record, "2026-07-30T17:30:00.000Z"), "due-soon");
  assert.equal(assessAdministrativeCaseSla(record, "2026-07-30T18:01:00.000Z"), "overdue");
  const noSla = makeCase({ id: "case-no-sla", caseNumber: "CASE-2", slaPolicyKey: null, slaDueAt: null });
  assert.equal(assessAdministrativeCaseSla(noSla, "2026-07-30T17:30:00.000Z"), "not-configured");

  let current = record;
  for (const [index, nextStatus] of ADMINISTRATIVE_CASE_STATUSES.slice(1).entries()) {
    const result = transitionAdministrativeCase({
      caseRecord: current,
      eventId: `event-life-${index}`,
      actorAdministratorId: "admin-support",
      nextStatus,
      assignedAdministratorId: nextStatus === "assigned" ? "admin-support" : undefined,
      reason: `Move to ${nextStatus}.`,
      now: new Date(Date.parse(NOW) + (index + 1) * 60_000).toISOString(),
    });
    current = result.caseRecord;
  }
  assert.equal(current.status, "closed");
  assert.ok(current.resolvedAt);
  assert.ok(current.closedAt);
  assert.equal(assessAdministrativeCaseSla(current, "2026-07-31T00:00:00.000Z"), "satisfied");
});

test("case service permission filters reads/transitions and atomically delegates lifecycle", async () => {
  let current = makeCase();
  const commits = [];
  const service = new AdministrativeCaseService({
    cases: {
      async getById(id) { return id === current.id ? current : null; },
      async listOpen() { return current.status === "closed" ? [] : [current]; },
      async save(record) { current = record; },
      async create(record) { current = record; },
    },
    lifecycle: {
      async commitTransition(input) {
        commits.push(input);
        current = input.caseRecord;
      },
    },
  });

  assert.equal((await service.get(support, current.id)).id, current.id);
  await assert.rejects(() => service.get(technical, current.id), /permission-not-granted/);
  current = await service.transition({
    authority: support,
    caseRecord: current,
    eventId: "service-event-1",
    nextStatus: "triaged",
    reason: "Triage complete.",
    now: "2026-07-30T14:05:00.000Z",
  });
  assert.equal(commits.length, 1);
  assert.equal(commits[0].event.actorAdministratorId, "admin-support");
  await assert.rejects(
    () => service.transition({
      authority: technical,
      caseRecord: current,
      eventId: "service-denied",
      nextStatus: "assigned",
      assignedAdministratorId: "admin-tech",
      reason: "Unauthorized.",
      now: "2026-07-30T14:06:00.000Z",
    }),
    /permission-not-granted/,
  );
});

test("ADM-061 case becomes the canonical provider for Slice 1.24 unified queue", async () => {
  const record = makeCase();
  const work = administrativeCaseToWorkItem(record);
  assert.equal(work.id, record.id);
  assert.equal(work.caseNumber, record.caseNumber);
  assert.equal(work.requiredPermission, record.readPermission);

  const provider = new AdministrativeCaseWorkQueueProvider({
    async getById() { return record; },
    async listOpen() { return [record]; },
    async save() {},
    async create() {},
  });
  const items = await provider.listOpenWork();
  assert.equal(provider.source, "administrative-cases");
  assert.equal(items.length, 1);
  assert.equal(items[0].objectId, record.objectId);
});
