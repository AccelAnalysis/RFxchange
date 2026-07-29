import { randomUUID } from "node:crypto";
import * as logger from "firebase-functions/logger";

export type RuntimeLogLevel = "debug" | "info" | "warn" | "error";

export interface RuntimeObservation {
  readonly event: string;
  readonly correlationId: string;
  readonly service: "rfxchange-functions";
  readonly environment: string;
  readonly projectId: string;
  readonly emulator: boolean;
  readonly operation?: string;
  readonly durationMs?: number;
  readonly outcome?: "started" | "succeeded" | "failed" | "rejected";
  readonly errorCode?: string;
}

function normalizedCorrelationId(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  const normalized = candidate?.trim();
  return normalized && normalized.length <= 128 ? normalized : randomUUID();
}

export function correlationIdFromHeaders(
  headers: Readonly<Record<string, string | string[] | undefined>>,
): string {
  return normalizedCorrelationId(headers["x-correlation-id"]);
}

export function observeRuntime(level: RuntimeLogLevel, observation: RuntimeObservation): void {
  const payload = Object.freeze({
    structured: true,
    ...observation,
  });

  logger[level](observation.event, payload);
}

export function safeRuntimeErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { readonly code?: unknown }).code;
    if (typeof code === "string" && code.trim()) return code.trim().slice(0, 120);
  }
  return "runtime-error";
}
