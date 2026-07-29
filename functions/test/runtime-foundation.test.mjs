import assert from "node:assert/strict";
import test from "node:test";

import {
  createFunctionsRuntimeContext,
  createFunctionsRuntimeHealthReport,
  RFXCHANGE_FUNCTION_WORKLOAD_KINDS,
} from "../lib/application/runtime-foundation.js";
import {
  functionsRuntimeContextFromEnvironment,
  RFXCHANGE_FUNCTIONS_REGION,
} from "../lib/runtime/environment.js";
import { correlationIdFromHeaders } from "../lib/runtime/observability.js";

test("runtime context is provider-independent and limited to approved workload classes", () => {
  const context = createFunctionsRuntimeContext({
    environment: "development",
    projectId: "demo-rfxchange",
    emulator: true,
    region: RFXCHANGE_FUNCTIONS_REGION,
  });

  assert.deepEqual(context, {
    service: "rfxchange-functions",
    environment: "development",
    projectId: "demo-rfxchange",
    emulator: true,
    region: "us-east1",
    runtime: "nodejs22",
  });
  assert.deepEqual(RFXCHANGE_FUNCTION_WORKLOAD_KINDS, [
    "asynchronous",
    "scheduled",
    "event-driven",
    "integration",
  ]);
});

test("production role cannot run with the emulator flag", () => {
  assert.throws(
    () =>
      createFunctionsRuntimeContext({
        environment: "production",
        projectId: "rfxchange",
        emulator: true,
        region: "us-east1",
      }),
    /Production RFxchange functions cannot run with the emulator flag enabled/,
  );
});

test("runtime environment requires an explicit role outside the emulator", () => {
  assert.throws(
    () =>
      functionsRuntimeContextFromEnvironment({
        GCLOUD_PROJECT: "rfxchange-preview",
      }),
    /RFXCHANGE_ENV is required outside the Firebase Functions emulator/,
  );
});

test("runtime environment validates the intended Firebase project", () => {
  assert.throws(
    () =>
      functionsRuntimeContextFromEnvironment({
        FUNCTIONS_EMULATOR: "true",
        RFXCHANGE_ENV: "development",
        RFXCHANGE_EXPECTED_PROJECT_ID: "expected-project",
        GCLOUD_PROJECT: "unexpected-project",
      }),
    /Firebase project mismatch/,
  );

  const context = functionsRuntimeContextFromEnvironment({
    FUNCTIONS_EMULATOR: "true",
    RFXCHANGE_EXPECTED_PROJECT_ID: "demo-rfxchange",
    FIREBASE_CONFIG: JSON.stringify({ projectId: "demo-rfxchange" }),
  });
  assert.equal(context.environment, "development");
  assert.equal(context.projectId, "demo-rfxchange");
});

test("health report contains bounded operational metadata and no credentials", () => {
  const context = createFunctionsRuntimeContext({
    environment: "staging",
    projectId: "rfxchange-staging",
    emulator: false,
    region: "us-east1",
  });
  const report = createFunctionsRuntimeHealthReport(context, "2026-07-29T21:30:00Z");

  assert.equal(report.status, "ok");
  assert.equal(report.generatedAt, "2026-07-29T21:30:00.000Z");
  assert.equal("credentials" in report, false);
  assert.equal("serviceAccount" in report, false);
});

test("observability accepts a bounded caller correlation id and generates one otherwise", () => {
  assert.equal(correlationIdFromHeaders({ "x-correlation-id": "request-123" }), "request-123");
  assert.match(correlationIdFromHeaders({}), /^[0-9a-f-]{36}$/);
  assert.match(
    correlationIdFromHeaders({ "x-correlation-id": "x".repeat(129) }),
    /^[0-9a-f-]{36}$/,
  );
});
