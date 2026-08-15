import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";

import { createFunctionsRuntimeHealthReport } from "./application/runtime-foundation.js";
import {
  functionsRuntimeContextFromEnvironment,
  RFXCHANGE_FUNCTIONS_REGION,
} from "./runtime/environment.js";
import {
  correlationIdFromHeaders,
  observeRuntime,
  safeRuntimeErrorCode,
} from "./runtime/observability.js";

setGlobalOptions({
  region: RFXCHANGE_FUNCTIONS_REGION,
  memory: "256MiB",
  timeoutSeconds: 60,
  minInstances: 0,
  maxInstances: 10,
  concurrency: 40,
  cpu: 1,
});

/**
 * Private operational probe for deployment and emulator acceptance.
 *
 * This function exposes runtime metadata only. It does not execute RFxchange feature-domain work.
 */
export const runtimeFoundationHealth = onRequest(
  { invoker: "private" },
  (request, response) => {
    const correlationId = correlationIdFromHeaders(request.headers);
    const startedAt = Date.now();

    try {
      const context = functionsRuntimeContextFromEnvironment();
      observeRuntime("info", {
        event: "functions.runtime.health",
        correlationId,
        service: context.service,
        environment: context.environment,
        projectId: context.projectId,
        emulator: context.emulator,
        operation: "runtime-foundation-health",
        outcome: "started",
      });

      if (request.method !== "GET") {
        observeRuntime("warn", {
          event: "functions.runtime.health",
          correlationId,
          service: context.service,
          environment: context.environment,
          projectId: context.projectId,
          emulator: context.emulator,
          operation: "runtime-foundation-health",
          durationMs: Date.now() - startedAt,
          outcome: "rejected",
          errorCode: "method-not-allowed",
        });
        response.set("x-correlation-id", correlationId).status(405).json({
          error: "method-not-allowed",
          correlationId,
        });
        return;
      }

      const report = createFunctionsRuntimeHealthReport(context, new Date().toISOString());
      observeRuntime("info", {
        event: "functions.runtime.health",
        correlationId,
        service: context.service,
        environment: context.environment,
        projectId: context.projectId,
        emulator: context.emulator,
        operation: "runtime-foundation-health",
        durationMs: Date.now() - startedAt,
        outcome: "succeeded",
      });
      response.set("cache-control", "no-store");
      response.set("x-correlation-id", correlationId).status(200).json(report);
    } catch (error) {
      const errorCode = safeRuntimeErrorCode(error);
      observeRuntime("error", {
        event: "functions.runtime.health",
        correlationId,
        service: "rfxchange-functions",
        environment: process.env.RFXCHANGE_ENV ?? "unknown",
        projectId: process.env.GCLOUD_PROJECT ?? "unknown",
        emulator: process.env.FUNCTIONS_EMULATOR === "true",
        operation: "runtime-foundation-health",
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

export {
  backgroundJobFrameworkProbe,
  scheduledBackgroundJobHeartbeat,
} from "./background-job-functions.js";
export {
  scheduledOpportunityAlertDelivery,
} from "./opportunity-discovery-functions.js";
export {
  scheduledOpportunityDiscoveryEvaluation,
} from "./opportunity-discovery-evaluation-functions.js";