import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

import {
  createBackgroundJobRequest,
  executeBackgroundJob,
  retryableBackgroundJobError,
  terminalBackgroundJobError,
  type BackgroundJobExecutionResult,
} from "./application/background-jobs.js";
import { functionsRuntimeContextFromEnvironment } from "./runtime/environment.js";
import {
  backgroundJobPayloadFingerprint,
  sha256Hex,
} from "./runtime/background-job-identifiers.js";
import { getFunctionsFirestore } from "./runtime/firebase-admin.js";
import { FirestoreBackgroundJobStore } from "./runtime/firestore-background-job-store.js";
import {
  correlationIdFromHeaders,
  observeRuntime,
  safeRuntimeErrorCode,
} from "./runtime/observability.js";

function queryValue(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const normalized = candidate?.trim();
  return normalized || null;
}

function logJobResult(
  result: BackgroundJobExecutionResult,
  input: Readonly<{
    correlationId: string;
    environment: string;
    projectId: string;
    emulator: boolean;
    operation: string;
    durationMs: number;
  }>,
): void {
  const failed = result.outcome === "retry-scheduled" || result.outcome === "terminal-failure";
  observeRuntime(failed ? "warn" : "info", {
    event: "background.job.execution",
    correlationId: input.correlationId,
    service: "rfxchange-functions",
    environment: input.environment,
    projectId: input.projectId,
    emulator: input.emulator,
    operation: input.operation,
    durationMs: input.durationMs,
    outcome: failed ? "failed" : "succeeded",
    ...("errorCode" in result ? { errorCode: result.errorCode } : {}),
  });
}

/**
 * Scheduled framework canary. Its durable job/event records prove the generic framework without
 * introducing notification, retention, credibility, webhook, or indexing domain logic early.
 */
export const scheduledBackgroundJobHeartbeat = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "UTC",
    retryCount: 3,
    minBackoffSeconds: 10,
    maxBackoffSeconds: 300,
  },
  async (event) => {
    const runtime = functionsRuntimeContextFromEnvironment();
    const startedAt = Date.now();
    const requestedAt = event.scheduleTime;
    const schedulerJob = event.jobName ?? "manual-scheduler-invocation";
    const idempotencyKey = `${schedulerJob}:${requestedAt}`;
    const correlationId = sha256Hex(idempotencyKey).slice(0, 32);
    const request = createBackgroundJobRequest({
      jobName: "system.runtime-heartbeat",
      category: "system",
      idempotencyKey,
      payloadFingerprint: backgroundJobPayloadFingerprint({
        schedule: "every 15 minutes",
        schedulerJob,
        requestedAt,
      }),
      correlationId,
      environment: runtime.environment,
      projectId: runtime.projectId,
      requestedAt,
      maxAttempts: 3,
      retryBackoffSeconds: 10,
      leaseSeconds: 120,
    });
    const result = await executeBackgroundJob({
      request,
      runtime,
      store: new FirestoreBackgroundJobStore(getFunctionsFirestore()),
      now: new Date().toISOString(),
      handler: async ({ attemptNumber }) => ({
        heartbeat: true,
        attemptNumber,
        schedule: "every-15-minutes",
      }),
    });

    logJobResult(result, {
      correlationId,
      environment: runtime.environment,
      projectId: runtime.projectId,
      emulator: runtime.emulator,
      operation: request.jobName,
      durationMs: Date.now() - startedAt,
    });

    if (result.outcome === "retry-scheduled" || result.outcome === "retry-not-ready") {
      throw new Error(`Scheduled background job requires retry: ${result.outcome}.`);
    }
  },
);

/** Emulator-only acceptance surface for deterministic success, retry, and terminal scenarios. */
export const backgroundJobFrameworkProbe = onRequest(
  { invoker: "private", timeoutSeconds: 30 },
  async (request, response) => {
    const correlationId = correlationIdFromHeaders(request.headers);
    const startedAt = Date.now();

    try {
      const runtime = functionsRuntimeContextFromEnvironment();
      if (!runtime.emulator) {
        response.set("cache-control", "no-store");
        response.set("x-correlation-id", correlationId).status(404).json({
          error: "not-found",
          correlationId,
        });
        return;
      }
      if (request.method !== "POST") {
        response.set("cache-control", "no-store");
        response.set("x-correlation-id", correlationId).status(405).json({
          error: "method-not-allowed",
          correlationId,
        });
        return;
      }

      const scenario = queryValue(request.query.scenario);
      const idempotencyKey = queryValue(request.query.key);
      if (!scenario || !["success", "retry", "terminal"].includes(scenario) || !idempotencyKey) {
        response.set("cache-control", "no-store");
        response.set("x-correlation-id", correlationId).status(400).json({
          error: "invalid-probe-request",
          correlationId,
        });
        return;
      }

      const requestedAt = new Date().toISOString();
      const jobName = `system.framework-probe.${scenario}`;
      const jobRequest = createBackgroundJobRequest({
        jobName,
        category: "system",
        idempotencyKey,
        payloadFingerprint: backgroundJobPayloadFingerprint({ scenario, idempotencyKey }),
        correlationId,
        environment: runtime.environment,
        projectId: runtime.projectId,
        requestedAt,
        maxAttempts: 3,
        retryBackoffSeconds: 1,
        leaseSeconds: 5,
      });

      const result = await executeBackgroundJob({
        request: jobRequest,
        runtime,
        store: new FirestoreBackgroundJobStore(getFunctionsFirestore()),
        now: requestedAt,
        handler: async ({ attemptNumber }) => {
          if (scenario === "retry" && attemptNumber === 1) {
            throw retryableBackgroundJobError(
              "probe-transient-failure",
              "INF-007 retry acceptance failure.",
            );
          }
          if (scenario === "terminal") {
            throw terminalBackgroundJobError(
              "probe-terminal-failure",
              "INF-007 terminal acceptance failure.",
            );
          }
          return {
            scenario,
            attemptNumber,
            handled: true,
          };
        },
      });

      logJobResult(result, {
        correlationId,
        environment: runtime.environment,
        projectId: runtime.projectId,
        emulator: runtime.emulator,
        operation: jobName,
        durationMs: Date.now() - startedAt,
      });
      response.set("cache-control", "no-store");
      response.set("x-correlation-id", correlationId).status(200).json({
        correlationId,
        result,
      });
    } catch (error) {
      const errorCode = safeRuntimeErrorCode(error);
      observeRuntime("error", {
        event: "background.job.probe",
        correlationId,
        service: "rfxchange-functions",
        environment: process.env.RFXCHANGE_ENV ?? "unknown",
        projectId: process.env.GCLOUD_PROJECT ?? "unknown",
        emulator: process.env.FUNCTIONS_EMULATOR === "true",
        operation: "background-job-framework-probe",
        durationMs: Date.now() - startedAt,
        outcome: "failed",
        errorCode,
      });
      response.set("cache-control", "no-store");
      response.set("x-correlation-id", correlationId).status(500).json({
        error: errorCode,
        correlationId,
      });
    }
  },
);
