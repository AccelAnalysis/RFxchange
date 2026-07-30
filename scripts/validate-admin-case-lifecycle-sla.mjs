import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const model = await readFile(new URL("../src/domain/admin-cases/model.ts", import.meta.url), "utf8");
const service = await readFile(new URL("../src/application/admin/administrative-case-service.ts", import.meta.url), "utf8");
const persistence = await readFile(new URL("../src/infrastructure/firestore/administrative-case-repository.ts", import.meta.url), "utf8");
const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");

for (const field of [
  "caseNumber", "objectType", "objectId", "organizationId", "userId", "type", "severity", "source",
  "geography", "assignedAdministratorId", "status", "evidenceReferences", "relatedCaseIds",
  "readPermission", "actionPermission", "slaPolicyKey", "slaDueAt", "createdAt", "updatedAt",
]) assert.ok(model.includes(field), `Administrative case model missing ${field}.`);

for (const status of [
  "new", "triaged", "assigned", "in-review", "waiting-for-participant", "action-required", "monitoring", "resolved", "closed",
]) assert.ok(model.includes(`\"${status}\"`), `Administrative case lifecycle missing ${status}.`);

for (const slaState of ["not-configured", "within-sla", "due-soon", "overdue", "satisfied"]) {
  assert.ok(model.includes(`\"${slaState}\"`), `Administrative case SLA model missing ${slaState}.`);
}
assert.ok(model.includes("Assigned administrator id"), "Assigned state must bind an administrator.");
assert.ok(model.includes("nextAdministrativeCaseStatus"), "Case transitions must follow an explicit lifecycle.");
assert.ok(model.includes("resolvedAt") && model.includes("closedAt"));

assert.ok(service.includes("authorizeAdministrativeAction"), "Case reads/actions must use named admin permissions.");
assert.ok(service.includes("AdministrativeCaseWorkQueueProvider"), "Canonical cases must feed the Slice 1.24 work queue.");
assert.ok(service.includes("assessAdministrativeCaseSla"), "Case queue must expose SLA state.");

assert.ok(persistence.includes('ADMINISTRATIVE_CASE_COLLECTION = "administrativeCases"'));
assert.ok(persistence.includes('ADMINISTRATIVE_CASE_EVENT_COLLECTION = "administrativeCaseEvents"'));
assert.ok(persistence.includes("runTransaction"));
assert.ok(persistence.includes("storedCase") && persistence.includes("storedEvent"));
assert.ok(persistence.includes("status changed before lifecycle transition commit"));

assert.ok(rules.includes("match /administrativeCases/{documentId}"));
assert.ok(rules.includes("match /administrativeCaseEvents/{documentId}"));
assert.ok(rules.includes("allow update, delete: if false;"), "Case lifecycle evidence must be append-only.");

for (const source of [model, service]) {
  assert.ok(!source.includes('from "firebase'), "ADM-061/062 domain/application contracts must remain provider independent.");
}

console.log("Canonical administrative case model, lifecycle and SLA controls validated.");
