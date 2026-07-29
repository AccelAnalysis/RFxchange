import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const application = await readFile("functions/src/application/background-jobs.ts", "utf8");
const adapter = await readFile("functions/src/runtime/firestore-background-job-store.ts", "utf8");
const functions = await readFile("functions/src/background-job-functions.ts", "utf8");
const exportsFile = await readFile("functions/src/index.ts", "utf8");
const schema = await readFile("src/infrastructure/firestore/schema.ts", "utf8");
const rules = await readFile("firestore.rules", "utf8");
const queryContracts = await readFile("src/infrastructure/firestore/query-contracts.ts", "utf8");
const workflow = await readFile(".github/workflows/ci.yml", "utf8");
const documentation = await readFile(
  "docs/architecture/INF-007-scheduled-event-driven-job-framework.md",
  "utf8",
);

assert.equal(
  packageJson.scripts?.["validate:background-job-framework"],
  "node scripts/validate-background-job-framework.mjs",
  "INF-007 validation script must remain addressable.",
);

for (const required of [
  "BackgroundJobStore",
  "BackgroundJobClaimDecision",
  "idempotencyKey",
  "payloadFingerprint",
  "retryBackoffSeconds",
  "leaseSeconds",
  "retryable-failure",
  "terminal-failure",
  "executeBackgroundJob",
  "job-environment-mismatch",
  "job-project-mismatch",
]) {
  assert.ok(application.includes(required), `INF-007 application framework is missing ${required}.`);
}
assert.ok(!application.includes("firebase-functions"));
assert.ok(!application.includes("firebase-admin"));
assert.ok(!application.includes("Firestore"));

for (const required of [
  "runTransaction",
  "backgroundJobDocumentId",
  "idempotency-payload-conflict",
  "leaseExpiresAt",
  "nextAttemptAt",
  "retryDelaySeconds",
  "attempts-exhausted",
  "transaction.create",
  "backgroundJobEvents",
]) {
  assert.ok(adapter.includes(required), `INF-007 Firestore adapter is missing ${required}.`);
}

for (const required of [
  "onSchedule",
  "scheduledBackgroundJobHeartbeat",
  'schedule: "every 15 minutes"',
  "retryCount: 3",
  "minBackoffSeconds: 10",
  "backgroundJobFrameworkProbe",
  "runtime.emulator",
  "retryableBackgroundJobError",
  "terminalBackgroundJobError",
]) {
  assert.ok(functions.includes(required), `INF-007 Functions composition is missing ${required}.`);
}
assert.ok(exportsFile.includes("scheduledBackgroundJobHeartbeat"));
assert.ok(exportsFile.includes("backgroundJobFrameworkProbe"));

for (const collection of ["backgroundJobs", "backgroundJobEvents"]) {
  assert.ok(schema.includes(`\"${collection}\"`), `Canonical schema is missing ${collection}.`);
  assert.match(
    rules,
    new RegExp(`match\\s+/${collection}/\\{documentId\\}`),
    `Firestore Rules are missing ${collection}.`,
  );
}
const eventConvention = schema.slice(
  schema.indexOf("backgroundJobEvents: Object.freeze({"),
  schema.indexOf("}),", schema.indexOf("backgroundJobEvents: Object.freeze({")) + 3,
);
assert.ok(eventConvention.includes("appendOnly: true"));
assert.ok(eventConvention.includes("mutable: false"));
assert.ok(queryContracts.includes('"background-job-events-by-job"'));

assert.ok(
  workflow.includes("smoke-firebase-background-jobs-emulator.mjs"),
  "CI must execute INF-007 emulator acceptance.",
);

for (const phrase of [
  "at-least-once",
  "idempotency",
  "lease",
  "retryable failure",
  "terminal failure",
  "append-only",
  "retention classification",
  "notifications",
  "webhooks",
  "credibility",
  "indexing",
]) {
  assert.ok(
    documentation.toLowerCase().includes(phrase),
    `INF-007 documentation is missing required policy: ${phrase}`,
  );
}

console.log("INF-007 scheduled and event-driven background job framework validated.");
