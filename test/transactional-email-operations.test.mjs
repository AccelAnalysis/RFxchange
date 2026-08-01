import assert from "node:assert/strict";
import test from "node:test";

import { createTransactionalEmailDeliveryHealthProbe } from "../src/application/communications/transactional-email-operations.ts";

const CHECKED_AT = "2026-08-01T21:30:00.000Z";

test("COMMS-004 email-delivery health is operational when no terminal failures are visible", async () => {
  const calls = [];
  const probe = createTransactionalEmailDeliveryHealthProbe({
    reader: {
      async listTerminalFailures(input) {
        calls.push(input);
        return [];
      },
    },
    environment: "development",
    projectId: "demo-rfxchange",
    checkedAt: () => CHECKED_AT,
  });
  const measurement = await probe.check();
  assert.equal(probe.surface, "email-delivery");
  assert.equal(measurement.state, "operational");
  assert.equal(measurement.metrics.terminalFailureCount, 0);
  assert.deepEqual(calls[0], {
    environment: "development",
    projectId: "demo-rfxchange",
    organizationId: null,
    limit: 50,
  });
});

test("COMMS-004 terminal failures degrade the authorized health surface without recipient content", async () => {
  const probe = createTransactionalEmailDeliveryHealthProbe({
    reader: {
      async listTerminalFailures() {
        return [
          {
            deliveryId: "delivery-1",
            status: "terminal-failure",
            attemptCount: 3,
            lastErrorCode: "transactional-email-microsoft-graph-access-denied",
          },
        ];
      },
    },
    environment: "production",
    projectId: "rfxchange",
    organizationId: "organization-1",
    limit: 5,
    checkedAt: () => CHECKED_AT,
  });
  const measurement = await probe.check();
  assert.equal(measurement.state, "degraded");
  assert.equal(measurement.metrics.terminalFailureCount, 1);
  assert.equal(
    measurement.metrics.mostRecentErrorCode,
    "transactional-email-microsoft-graph-access-denied",
  );
  assert.equal(JSON.stringify(measurement).includes("@"), false);
  assert.match(measurement.summary, /authorized operations review/);
});
