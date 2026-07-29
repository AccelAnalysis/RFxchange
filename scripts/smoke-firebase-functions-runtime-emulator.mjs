import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

const endpoint =
  "http://127.0.0.1:5001/demo-rfxchange/us-east1/runtimeFoundationHealth";
const correlationId = `inf-006-${Date.now()}`;

async function requestWhenReady() {
  let lastError = null;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        headers: { "x-correlation-id": correlationId },
      });
      if (response.status !== 404 && response.status !== 503) return response;
      lastError = new Error(`Functions emulator returned ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }
  throw lastError ?? new Error("Functions emulator health endpoint did not become ready.");
}

const response = await requestWhenReady();
assert.equal(response.status, 200, "Functions runtime health endpoint must succeed in the emulator.");
assert.equal(response.headers.get("x-correlation-id"), correlationId);
assert.equal(response.headers.get("cache-control"), "no-store");

const report = await response.json();
assert.deepEqual(
  {
    status: report.status,
    service: report.service,
    environment: report.environment,
    projectId: report.projectId,
    emulator: report.emulator,
    region: report.region,
    runtime: report.runtime,
  },
  {
    status: "ok",
    service: "rfxchange-functions",
    environment: "development",
    projectId: "demo-rfxchange",
    emulator: true,
    region: "us-east1",
    runtime: "nodejs22",
  },
);
assert.deepEqual(report.workloadKinds, [
  "asynchronous",
  "scheduled",
  "event-driven",
  "integration",
]);
assert.ok(Number.isFinite(Date.parse(report.generatedAt)));

const rejected = await fetch(endpoint, {
  method: "POST",
  headers: { "x-correlation-id": `${correlationId}-post` },
});
assert.equal(rejected.status, 405, "Operational probe must reject non-GET requests.");
assert.equal((await rejected.json()).error, "method-not-allowed");

console.log("INF-006 Firebase Cloud Functions runtime emulator smoke test passed.");
