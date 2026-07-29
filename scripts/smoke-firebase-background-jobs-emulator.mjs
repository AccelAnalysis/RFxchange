import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

assert.equal(
  process.env.FIRESTORE_EMULATOR_HOST,
  "127.0.0.1:8080",
  "INF-007 job framework smoke test must use the Firestore emulator.",
);
assert.equal(
  process.env.FUNCTIONS_EMULATOR,
  undefined,
  "The smoke-test process is separate from the Functions runtime process.",
);

const projectId = "demo-rfxchange";
const endpoint =
  "http://127.0.0.1:5001/demo-rfxchange/us-east1/backgroundJobFrameworkProbe";
const runId = Date.now();
const app = initializeApp({ projectId }, `inf-007-smoke-${runId}`);
const db = getFirestore(app);

async function invoke(scenario, key) {
  const correlationId = `inf-007-${scenario}-${key}`;
  const response = await fetch(
    `${endpoint}?scenario=${encodeURIComponent(scenario)}&key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "x-correlation-id": correlationId },
    },
  );
  assert.equal(response.status, 200, `INF-007 ${scenario} probe must return a job result.`);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-correlation-id"), correlationId);
  return (await response.json()).result;
}

async function eventsFor(jobId) {
  const snapshot = await db.collection("backgroundJobEvents").where("jobId", "==", jobId).get();
  return snapshot.docs.map((document) => document.data());
}

try {
  const successKey = `success-${runId}`;
  const success = await invoke("success", successKey);
  assert.equal(success.outcome, "succeeded");
  assert.equal(success.attemptNumber, 1);
  const duplicate = await invoke("success", successKey);
  assert.equal(duplicate.outcome, "duplicate");
  assert.equal(duplicate.attemptCount, 1);

  const successRecord = (await db.collection("backgroundJobs").doc(success.jobId).get()).data();
  assert.equal(successRecord?.status, "succeeded");
  assert.equal(successRecord?.attemptCount, 1);
  assert.equal(successRecord?.metadata?.handled, true);
  assert.deepEqual(
    new Set((await eventsFor(success.jobId)).map((event) => event.eventType)),
    new Set(["claimed", "succeeded"]),
  );

  const retryKey = `retry-${runId}`;
  const retry = await invoke("retry", retryKey);
  assert.equal(retry.outcome, "retry-scheduled");
  assert.equal(retry.attemptNumber, 1);
  assert.equal(retry.errorCode, "probe-transient-failure");
  const retryTooSoon = await invoke("retry", retryKey);
  assert.equal(retryTooSoon.outcome, "retry-not-ready");

  const retryReadyAt = Date.parse(retry.nextAttemptAt);
  const remaining = Math.max(0, retryReadyAt - Date.now() + 250);
  await delay(remaining);
  const recovered = await invoke("retry", retryKey);
  assert.equal(recovered.outcome, "succeeded");
  assert.equal(recovered.attemptNumber, 2);
  assert.equal((await invoke("retry", retryKey)).outcome, "duplicate");

  const retryRecord = (await db.collection("backgroundJobs").doc(retry.jobId).get()).data();
  assert.equal(retryRecord?.status, "succeeded");
  assert.equal(retryRecord?.attemptCount, 2);
  assert.deepEqual(
    new Set((await eventsFor(retry.jobId)).map((event) => event.eventType)),
    new Set(["claimed", "retryable-failure", "succeeded"]),
  );
  assert.equal((await eventsFor(retry.jobId)).filter((event) => event.eventType === "claimed").length, 2);

  const terminalKey = `terminal-${runId}`;
  const terminal = await invoke("terminal", terminalKey);
  assert.equal(terminal.outcome, "terminal-failure");
  assert.equal(terminal.errorCode, "probe-terminal-failure");
  const terminalDuplicate = await invoke("terminal", terminalKey);
  assert.equal(terminalDuplicate.outcome, "terminal-failure");
  assert.equal(terminalDuplicate.attemptNumber, 1);

  const terminalRecord = (await db.collection("backgroundJobs").doc(terminal.jobId).get()).data();
  assert.equal(terminalRecord?.status, "terminal-failure");
  assert.equal(terminalRecord?.attemptCount, 1);
  assert.equal(terminalRecord?.lastErrorCode, "probe-terminal-failure");
  assert.deepEqual(
    new Set((await eventsFor(terminal.jobId)).map((event) => event.eventType)),
    new Set(["claimed", "terminal-failure"]),
  );

  console.log(
    "INF-007 scheduled/event-driven job framework emulator smoke test passed: idempotency, retry, recovery, terminal failure and audit events validated.",
  );
} finally {
  await deleteApp(app);
}
