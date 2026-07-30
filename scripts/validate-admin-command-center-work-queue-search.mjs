import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const commandCenter = await readFile(new URL("../src/application/admin/command-center.ts", import.meta.url), "utf8");
const workQueue = await readFile(new URL("../src/domain/admin-work-queue/model.ts", import.meta.url), "utf8");
const queueService = await readFile(new URL("../src/application/admin/unified-work-queue.ts", import.meta.url), "utf8");
const search = await readFile(new URL("../src/application/admin/universal-search.ts", import.meta.url), "utf8");

for (const queue of [
  "claims-awaiting-review", "verification-reviews", "resource-provider-applications", "rfx-flagged",
  "trust-reports", "integrity-holds", "billing-exceptions", "data-corrections", "support-cases", "failed-integrations",
]) assert.ok(commandCenter.includes(`\"${queue}\"`), `Missing attention queue ${queue}.`);

for (const panel of ["organizations", "marketplace", "connections", "network", "commerce", "trust", "systems"]) {
  assert.ok(commandCenter.includes(`\"${panel}\"`), `Missing platform health panel ${panel}.`);
}
assert.ok(commandCenter.includes("assertExactCoverage"), "Command center must not silently omit required queues or health panels.");
assert.ok(commandCenter.includes("authorizeAdministrativeAction"), "Command center visibility must be permission aware.");

for (const field of [
  "caseNumber", "objectType", "organizationId", "userId", "severity", "source", "geography",
  "assignedAdministratorId", "createdAt", "slaDueAt", "status", "evidenceReferences", "relatedCaseNumbers",
]) assert.ok(workQueue.includes(field), `Unified work queue is missing ${field}.`);
for (const status of [
  "new", "triaged", "assigned", "in-review", "waiting-for-participant", "action-required", "monitoring", "resolved", "closed",
]) assert.ok(workQueue.includes(`\"${status}\"`), `Missing suggested work lifecycle status ${status}.`);
assert.ok(queueService.includes("requiredPermission") && queueService.includes("authorizeAdministrativeAction"));

for (const category of [
  "organization", "user", "email", "organization-id", "rfx", "response", "referral", "transaction",
  "support-case", "geography", "uei", "cage", "provider", "stripe-customer", "audit-event",
]) assert.ok(search.includes(`\"${category}\"`), `Universal admin search is missing category ${category}.`);
assert.ok(search.includes("requiredPermission") && search.includes("authorizeAdministrativeAction"));
assert.ok(search.includes("limit") && search.includes("100"), "Universal search requires a bounded result limit.");

for (const source of [commandCenter, workQueue, queueService, search]) {
  assert.ok(!source.includes('from "firebase'), "Slice 1.24 application/domain contracts must remain provider independent.");
}

console.log("Attention-first command center, platform health, unified work queue and universal search validated.");
