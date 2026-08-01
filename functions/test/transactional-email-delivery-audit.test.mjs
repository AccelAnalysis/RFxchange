import assert from "node:assert/strict";
import test from "node:test";

import {
  createBackgroundJobRequest,
} from "../lib/application/background-jobs.js";
import {
  createTransactionalEmailDeliveryIntent,
  executeReliableTransactionalEmailJob,
} from "../lib/application/transactional-email-delivery-audit.js";
import { createFunctionsRuntimeContext } from "../lib/application/runtime-foundation.js";
import { backgroundJobPayloadFingerprint } from "../lib/runtime/background-job-identifiers.js";

const NOW = "2026-08-01T21:20:00.000Z";
const runtime = createFunctionsRuntimeContext({
  environment: "development",
  projectId: "demo-rfxchange",
  emulator: true,
  region: "us-east1",
});

function fixture() {
  const idempotencyKey = "organization-user-invited-event-1-recipient-1";
  const correlationId = "correlation-email-1";
  const payloadFingerprint = backgroundJobPayloadFingerprint({
    eventId: "event-1",
    template: "organization.invitation@1",
    recipient: "member@example.test",
  });
  const intent = createTransactionalEmailDeliveryIntent({
    messageId: "message-email-1",
    idempotencyKey,
    payloadFingerprint,
    purpose: "administrative",
    eventKey: "organization.user-invited",
    eventVersion: 1,
    originatingEventId: "event-1",
    templateKey: "organization.invitation",
    templateVersion: 1,
    recipientEmail: "Member@Example.Test",
    correlationId,
    environment: "development",
    projectId: "demo-rfxchange",
    organizationId: "org-1",
    userId: "user-1",
    relatedObjectType: "organization-invitation",
    relatedObjectId: "invite-1",
    requestedAt: NOW,
  });
  const request = createBackgroundJobRequest({
    jobName: "communications.transactional-email.delivery",
    category: "notification",
    idempotencyKey,
    payloadFingerprint,
    correlationId,
    environment: "development",
    projectId: "demo-rfxchange",
    requestedAt: NOW,
    maxAttempts: 3,
    retryBackoffSeconds: 5,
    leaseSeconds: 30,
  });
  return { intent, request };
}

function auditStore(initial = { status: "queued", attemptCount: 0, lastErrorCode: null }) {
  const calls = [];
  return {
    calls,
    async ensureIntent() {
      calls.push(["intent"]);
      return { deliveryId: "delivery-1", ...initial };
    },
    async recordAttempt(input) {
      calls.push(["attempt", input.attemptNumber]);
    },
    async recordAccepted(input) {
      calls.push(["accepted", input.attemptNumber, input.receipt.providerKey]);
    },
    async recordFailure(input) {
      calls.push([
        "failure",
        input.attemptNumber,
        input.status,
        input.errorCode,
        input.retryAfterSeconds,
      ]);
    },
    async listTerminalFailures() {
      return [];
    },
  };
}

function backgroundStore(attemptNumber = 1) {
  const calls = [];
  return {
    calls,
    async claim(request) {
      calls.push(["claim", request.idempotencyKey]);
      return {
        kind: "claimed",
        claim: { jobId: "job-1", attemptNumber, maxAttempts: request.maxAttempts },
      };
    },
    async completeSuccess(input) {
      calls.push(["success", input.claim.attemptNumber]);
    },
    async completeFailure(input) {
      calls.push(["failure", input.claim.attemptNumber, input.retryable]);
      return input.retryable
        ? { status: "retryable-failure", nextAttemptAt: "2026-08-01T21:20:05.000Z" }
        : { status: "terminal-failure", nextAttemptAt: null };
    },
  };
}

test("COMMS-004 intent retains routing correlation without retaining the raw recipient address", () => {
  const { intent } = fixture();
  assert.equal(intent.recipientDomain, "example.test");
  assert.match(intent.recipientAddressHash, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(intent).includes("member@example.test"), false);
  assert.equal(intent.eventVersion, 1);
  assert.equal(intent.templateVersion, 1);
  assert.equal(intent.originatingEventId, "event-1");
});

test("COMMS-004 records intent, attempt and provider acceptance around one INF-007 execution", async () => {
  const { intent, request } = fixture();
  const audit = auditStore();
  const jobs = backgroundStore();
  let delivered = 0;
  const result = await executeReliableTransactionalEmailJob({
    intent,
    request,
    runtime,
    backgroundJobStore: jobs,
    auditStore: audit,
    now: NOW,
    deliver: async () => {
      delivered += 1;
      return {
        status: "accepted",
        providerKey: "microsoft-graph",
        externalReference: "graph-request-1",
        diagnosticCode: "microsoft-graph-accepted",
      };
    },
  });
  assert.equal(result.outcome, "succeeded");
  assert.equal(delivered, 1);
  assert.deepEqual(audit.calls, [
    ["intent"],
    ["attempt", 1],
    ["accepted", 1, "microsoft-graph"],
  ]);
  assert.equal(jobs.calls.at(-1)[0], "success");
});

test("COMMS-005 accepted audit state and succeeded job suppress duplicate provider delivery", async () => {
  const { intent, request } = fixture();
  const audit = auditStore({ status: "accepted", attemptCount: 1, lastErrorCode: null });
  let delivered = false;
  let claimed = false;
  const result = await executeReliableTransactionalEmailJob({
    intent,
    request,
    runtime,
    backgroundJobStore: {
      async claim() {
        claimed = true;
        return {
          kind: "duplicate",
          jobId: "job-1",
          status: "succeeded",
          attemptCount: 1,
        };
      },
      async completeSuccess() {
        throw new Error("must not complete duplicate");
      },
      async completeFailure() {
        throw new Error("must not fail duplicate");
      },
    },
    auditStore: audit,
    now: NOW,
    deliver: async () => {
      delivered = true;
      throw new Error("must not deliver");
    },
  });
  assert.equal(result.outcome, "duplicate");
  assert.equal(delivered, false);
  assert.equal(claimed, true);
});

test("COMMS-005 accepted audit state heals interrupted INF-007 success without resending", async () => {
  const { intent, request } = fixture();
  const audit = auditStore({ status: "accepted", attemptCount: 1, lastErrorCode: null });
  const jobs = backgroundStore(2);
  let delivered = false;
  const result = await executeReliableTransactionalEmailJob({
    intent,
    request,
    runtime,
    backgroundJobStore: jobs,
    auditStore: audit,
    now: NOW,
    deliver: async () => {
      delivered = true;
      throw new Error("must not deliver");
    },
  });
  assert.equal(result.outcome, "succeeded");
  assert.equal(delivered, false);
  assert.deepEqual(audit.calls, [["intent"]]);
  assert.equal(jobs.calls.at(-1)[0], "success");
});

test("COMMS-005 transient failures are audited and scheduled by the existing deterministic retry policy", async () => {
  const { intent, request } = fixture();
  const audit = auditStore();
  const jobs = backgroundStore(1);
  const result = await executeReliableTransactionalEmailJob({
    intent,
    request,
    runtime,
    backgroundJobStore: jobs,
    auditStore: audit,
    now: NOW,
    deliver: async () => {
      throw {
        code: "throttled",
        retryable: true,
        providerKey: "microsoft-graph",
        externalReference: "graph-request-throttled",
        retryAfterSeconds: 20,
      };
    },
  });
  assert.equal(result.outcome, "retry-scheduled");
  assert.equal(result.nextAttemptAt, "2026-08-01T21:20:05.000Z");
  assert.deepEqual(audit.calls.at(-1), [
    "failure",
    1,
    "retryable-failure",
    "transactional-email-microsoft-graph-throttled",
    20,
  ]);
});

test("COMMS-005 permanent failures and exhausted transient failures become terminal and observable", async () => {
  for (const scenario of [
    { attempt: 1, retryable: false, code: "access-denied" },
    { attempt: 3, retryable: true, code: "service-unavailable" },
  ]) {
    const { intent, request } = fixture();
    const audit = auditStore({
      status: scenario.attempt === 1 ? "queued" : "retryable-failure",
      attemptCount: scenario.attempt - 1,
      lastErrorCode: null,
    });
    const jobs = backgroundStore(scenario.attempt);
    const result = await executeReliableTransactionalEmailJob({
      intent,
      request,
      runtime,
      backgroundJobStore: jobs,
      auditStore: audit,
      now: NOW,
      deliver: async () => {
        throw {
          code: scenario.code,
          retryable: scenario.retryable,
          providerKey: "microsoft-graph",
        };
      },
    });
    assert.equal(result.outcome, "terminal-failure");
    assert.equal(audit.calls.at(-1)[2], "terminal-failure");
  }
});
