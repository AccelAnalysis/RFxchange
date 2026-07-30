import assert from "node:assert/strict";
import test from "node:test";

import {
  transactionalEmailBackgroundJobHandler,
} from "../lib/application/transactional-email-jobs.js";

test("transactional email job handler returns bounded provider response metadata", async () => {
  const handler = transactionalEmailBackgroundJobHandler(async () => ({
    status: "accepted",
    providerKey: "microsoft-graph",
    externalReference: "graph-request-001",
    diagnosticCode: "microsoft-graph-accepted",
  }));
  const metadata = await handler({
    request: {},
    jobId: "job-001",
    attemptNumber: 1,
  });
  assert.deepEqual(metadata, {
    deliveryStatus: "accepted",
    providerKey: "microsoft-graph",
    providerReference: "graph-request-001",
    diagnosticCode: "microsoft-graph-accepted",
  });
});

test("transactional email job handler maps provider retryability into INF-007 errors", async () => {
  for (const retryable of [true, false]) {
    const handler = transactionalEmailBackgroundJobHandler(async () => {
      throw {
        code: retryable ? "throttled" : "access-denied",
        retryable,
        providerKey: "microsoft-graph",
      };
    });
    await assert.rejects(
      () => handler({ request: {}, jobId: "job-001", attemptNumber: 1 }),
      (error) => {
        assert.equal(error.retryable, retryable);
        assert.match(error.code, /transactional-email-microsoft-graph/);
        return true;
      },
    );
  }
});
