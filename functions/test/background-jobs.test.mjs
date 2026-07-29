import assert from "node:assert/strict";
import test from "node:test";

import {
  createBackgroundJobRequest,
  executeBackgroundJob,
  retryableBackgroundJobError,
  terminalBackgroundJobError,
} from "../lib/application/background-jobs.js";
import { createFunctionsRuntimeContext } from "../lib/application/runtime-foundation.js";
import { backgroundJobPayloadFingerprint } from "../lib/runtime/background-job-identifiers.js";

const NOW = "2026-07-29T22:00:00.000Z";
const runtime = createFunctionsRuntimeContext({
  environment: "development",
  projectId: "demo-rfxchange",
  emulator: true,
  region: "us-east1",
});

function request(overrides = {}) {
  return createBackgroundJobRequest({
    jobName: "system.test-job",
    category: "system",
    idempotencyKey: "event-001",
    payloadFingerprint: backgroundJobPayloadFingerprint({ event: 1 }),
    correlationId: "correlation-001",
    environment: "development",
    projectId: "demo-rfxchange",
    requestedAt: NOW,
    maxAttempts: 3,
    retryBackoffSeconds: 1,
    leaseSeconds: 30,
    ...overrides,
  });
}

function claimedStore(failureCompletion = null) {
  const calls = [];
  return {
    calls,
    async claim(value, now) {
      calls.push(["claim", value.jobName, now]);
      return {
        kind: "claimed",
        claim: { jobId: "job-001", attemptNumber: 1, maxAttempts: value.maxAttempts },
      };
    },
    async completeSuccess(input) {
      calls.push(["success", input.claim.attemptNumber, input.metadata]);
    },
    async completeFailure(input) {
      calls.push(["failure", input.claim.attemptNumber, input.retryable, input.errorCode]);
      return (
        failureCompletion ?? {
          status: input.retryable ? "retryable-failure" : "terminal-failure",
          nextAttemptAt: input.retryable ? "2026-07-29T22:00:01.000Z" : null,
        }
      );
    },
  };
}

test("job request validates stable names, fingerprints, and bounded execution policy", () => {
  const value = request();
  assert.equal(value.jobName, "system.test-job");
  assert.equal(value.category, "system");
  assert.equal(value.maxAttempts, 3);
  assert.throws(() => request({ payloadFingerprint: "not-a-sha" }), /SHA-256/);
  assert.throws(() => request({ maxAttempts: 11 }), /between 1 and 10/);
  assert.throws(() => request({ jobName: "Invalid Job" }), /lowercase dotted identifier/);
});

test("successful execution claims once, invokes the handler, and records bounded metadata", async () => {
  const store = claimedStore();
  const result = await executeBackgroundJob({
    request: request(),
    runtime,
    store,
    now: NOW,
    handler: async ({ jobId, attemptNumber }) => ({ jobId, attemptNumber, processed: true }),
  });

  assert.equal(result.outcome, "succeeded");
  assert.equal(result.attemptNumber, 1);
  assert.equal(result.metadata.processed, true);
  assert.equal(store.calls[0][0], "claim");
  assert.equal(store.calls[1][0], "success");
});

test("duplicate and in-progress decisions do not invoke the handler", async () => {
  for (const decision of [
    { kind: "duplicate", jobId: "job-001", attemptCount: 1 },
    {
      kind: "in-progress",
      jobId: "job-001",
      attemptCount: 1,
      leaseExpiresAt: "2026-07-29T22:01:00.000Z",
    },
  ]) {
    let handled = false;
    const result = await executeBackgroundJob({
      request: request(),
      runtime,
      store: {
        claim: async () => decision,
        completeSuccess: async () => undefined,
        completeFailure: async () => ({ status: "terminal-failure", nextAttemptAt: null }),
      },
      now: NOW,
      handler: async () => {
        handled = true;
      },
    });
    assert.equal(result.outcome, decision.kind);
    assert.equal(handled, false);
  }
});

test("retryable failures create a retry result while terminal failures close the job", async () => {
  const retryStore = claimedStore();
  const retry = await executeBackgroundJob({
    request: request(),
    runtime,
    store: retryStore,
    now: NOW,
    handler: async () => {
      throw retryableBackgroundJobError("transient-provider-error", "Retry later.");
    },
  });
  assert.deepEqual(
    {
      outcome: retry.outcome,
      errorCode: retry.errorCode,
      nextAttemptAt: retry.nextAttemptAt,
    },
    {
      outcome: "retry-scheduled",
      errorCode: "transient-provider-error",
      nextAttemptAt: "2026-07-29T22:00:01.000Z",
    },
  );

  const terminalStore = claimedStore({ status: "terminal-failure", nextAttemptAt: null });
  const terminal = await executeBackgroundJob({
    request: request({ idempotencyKey: "event-terminal" }),
    runtime,
    store: terminalStore,
    now: NOW,
    handler: async () => {
      throw terminalBackgroundJobError("invalid-job-payload", "Do not retry.");
    },
  });
  assert.equal(terminal.outcome, "terminal-failure");
  assert.equal(terminal.errorCode, "invalid-job-payload");
});

test("environment and project mismatches fail before persistence", async () => {
  let claimed = false;
  await assert.rejects(
    executeBackgroundJob({
      request: request({ projectId: "wrong-project" }),
      runtime,
      store: {
        claim: async () => {
          claimed = true;
          throw new Error("unexpected");
        },
        completeSuccess: async () => undefined,
        completeFailure: async () => ({ status: "terminal-failure", nextAttemptAt: null }),
      },
      now: NOW,
      handler: async () => undefined,
    }),
    (error) => error.code === "job-project-mismatch" && error.retryable === false,
  );
  assert.equal(claimed, false);
});
