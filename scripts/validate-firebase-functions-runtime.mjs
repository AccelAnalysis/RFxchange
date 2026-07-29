import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rootPackage = JSON.parse(await readFile("package.json", "utf8"));
const functionsPackage = JSON.parse(await readFile("functions/package.json", "utf8"));
const firebaseConfig = JSON.parse(await readFile("firebase.json", "utf8"));
const application = await readFile("functions/src/application/runtime-foundation.ts", "utf8");
const environment = await readFile("functions/src/runtime/environment.ts", "utf8");
const observability = await readFile("functions/src/runtime/observability.ts", "utf8");
const entrypoint = await readFile("functions/src/index.ts", "utf8");
const workflow = await readFile(".github/workflows/ci.yml", "utf8");

assert.ok(
  rootPackage.workspaces?.includes("functions"),
  "INF-006 must install the Functions package through the root npm workspace.",
);
assert.equal(
  rootPackage.scripts?.["validate:firebase-functions-runtime"],
  "node scripts/validate-firebase-functions-runtime.mjs",
  "INF-006 validation script must remain addressable.",
);
assert.equal(functionsPackage.type, "module", "Cloud Functions package must use explicit ESM.");
assert.equal(functionsPackage.main, "lib/index.js", "Cloud Functions deploy entrypoint must be compiled.");
assert.equal(functionsPackage.dependencies?.["firebase-functions"], "7.3.0");
assert.equal(functionsPackage.dependencies?.["firebase-admin"], "14.2.0");
assert.match(functionsPackage.engines?.node ?? "", />=22/);

assert.equal(firebaseConfig.functions?.source, "functions");
assert.equal(firebaseConfig.functions?.runtime, "nodejs22");
assert.ok(
  firebaseConfig.functions?.predeploy?.some((command) => command.includes("run build")),
  "Firebase Functions deployment must compile TypeScript through a predeploy hook.",
);

for (const workload of ["asynchronous", "scheduled", "event-driven", "integration"]) {
  assert.ok(application.includes(`"${workload}"`), `Functions workload contract is missing ${workload}.`);
}
assert.ok(!application.includes("firebase-functions"), "Application runtime contract must remain provider-independent.");
assert.ok(!application.includes("firebase-admin"), "Application runtime contract must remain provider-independent.");

for (const required of [
  "RFXCHANGE_ENV",
  "RFXCHANGE_EXPECTED_PROJECT_ID",
  "GCLOUD_PROJECT",
  "FIREBASE_CONFIG",
  "FUNCTIONS_EMULATOR",
  "Firebase project mismatch",
]) {
  assert.ok(environment.includes(required), `Functions environment boundary is missing ${required}.`);
}
for (const required of [
  "correlationId",
  "structured: true",
  "durationMs",
  "outcome",
  "errorCode",
]) {
  assert.ok(observability.includes(required), `Functions observability convention is missing ${required}.`);
}
for (const required of [
  "setGlobalOptions",
  "runtimeFoundationHealth",
  'invoker: "private"',
  'memory: "256MiB"',
  "maxInstances: 10",
  "concurrency: 40",
  'response.set("cache-control", "no-store")',
]) {
  assert.ok(entrypoint.includes(required), `Functions entrypoint is missing ${required}.`);
}
assert.ok(
  workflow.includes("smoke-firebase-functions-runtime-emulator.mjs"),
  "CI must execute the Cloud Functions emulator acceptance test.",
);
assert.ok(
  workflow.includes("RFXCHANGE_EXPECTED_PROJECT_ID: demo-rfxchange"),
  "CI Functions execution must bind to the intended demo project.",
);

console.log("INF-006 Firebase Cloud Functions runtime foundation validated.");
