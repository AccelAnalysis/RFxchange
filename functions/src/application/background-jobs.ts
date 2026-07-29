import type { FunctionsRuntimeContext } from "./runtime-foundation.js";

export const BACKGROUND_JOB_CATEGORIES = Object.freeze([
  "notification",
  "webhook",
  "retention",
  "credibility",
  "indexing",
  "system",
] as const);

export type BackgroundJobCategory = (typeof BACKGROUND_JOB_CATEGORIES)[number];
export type BackgroundJobStatus =
  | "running"
  | "succeeded"
  | "retryable-failure"
  | "terminal-failure";

export type BackgroundJobMetadataValue = string | number | boolean | null;
export type BackgroundJobMetadata = Readonly<Record<string, BackgroundJobMetadataValue>>;

export interface BackgroundJobRequest {
  readonly jobName: string;
  readonly category: BackgroundJobCategory;
  readonly idempotencyKey: string;
  readonly payloadFingerprint: string;
  readonly correlationId: string;
  readonly environment: FunctionsRuntimeContext["environment"];
  readonly projectId: string;
  readonly requestedAt: string;
  readonly maxAttempts: number;
  readonly retryBackoffSeconds: number;
  readonly leaseSeconds: number;
}

export interface BackgroundJobClaim {
  readonly jobId: string;
  readonly attemptNumber: number;
  readonly maxAttempts: number;
}

export type BackgroundJobClaimDecision =
  | Readonly<{ readonly kind: "claimed"; readonly claim: BackgroundJobClaim }>
  | Readonly<{
      readonly kind: "duplicate";
      readonly jobId: string;
      readonly attemptCount: number;
    }>
  | Readonly<{
      readonly kind: "in-progress";
      readonly jobId: string;
      readonly attemptCount: number;
      readonly leaseExpiresAt: string;
    }>
  | Readonly<{
      readonly kind: "retry-not-ready";
      readonly jobId: string;
      readonly attemptCount: number;
      readonly nextAttemptAt: string;
    }>
  | Readonly<{
      readonly kind: "terminal";
      readonly jobId: string;
      readonly attemptCount: number;
      readonly errorCode: string | null;
    }>;

export interface BackgroundJobFailureCompletion {
  readonly status: "retryable-failure" | "terminal-failure";
  readonly nextAttemptAt: string | null;
}

export interface BackgroundJobStore {
  claim(request: BackgroundJobRequest, now: string): Promise<BackgroundJobClaimDecision>;
  completeSuccess(input: Readonly<{
    request: BackgroundJobRequest;
    claim: BackgroundJobClaim;
    completedAt: string;
    metadata: BackgroundJobMetadata;
  }>): Promise<void>;
  completeFailure(input: Readonly<{
    request: BackgroundJobRequest;
    claim: BackgroundJobClaim;
    completedAt: string;
    retryable: boolean;
    errorCode: string;
  }>): Promise<BackgroundJobFailureCompletion>;
}

export interface BackgroundJobHandlerContext {
  readonly request: BackgroundJobRequest;
  readonly jobId: string;
  readonly attemptNumber: number;
}

export type BackgroundJobHandler = (
  context: BackgroundJobHandlerContext,
) => Promise<BackgroundJobMetadata | void>;

export type BackgroundJobExecutionResult =
  | Readonly<{
      readonly outcome: "succeeded";
      readonly jobId: string;
      readonly attemptNumber: number;
      readonly metadata: BackgroundJobMetadata;
    }>
  | Readonly<{
      readonly outcome: "duplicate";
      readonly jobId: string;
      readonly attemptCount: number;
    }>
  | Readonly<{
      readonly outcome: "in-progress";
      readonly jobId: string;
      readonly attemptCount: number;
      readonly leaseExpiresAt: string;
    }>
  | Readonly<{
      readonly outcome: "retry-not-ready";
      readonly jobId: string;
      readonly attemptCount: number;
      readonly nextAttemptAt: string;
    }>
  | Readonly<{
      readonly outcome: "retry-scheduled";
      readonly jobId: string;
      readonly attemptNumber: number;
      readonly errorCode: string;
      readonly nextAttemptAt: string;
    }>
  | Readonly<{
      readonly outcome: "terminal-failure";
      readonly jobId: string;
      readonly attemptNumber: number;
      readonly errorCode: string;
    }>;

function requiredValue(value: string, label: string, maximumLength: number): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximumLength) {
    throw new Error(`${label} cannot exceed ${maximumLength} characters.`);
  }
  return normalized;
}

function isoTimestamp(value: string, label: string): string {
  const normalized = requiredValue(value, label, 64);
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid ISO-compatible timestamp.`);
  return new Date(parsed).toISOString();
}

function boundedInteger(value: number, label: string, minimum: number, maximum: number): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be an integer between ${minimum} and ${maximum}.`);
  }
  return value;
}

function backgroundJobCategory(value: string): BackgroundJobCategory {
  const normalized = requiredValue(value, "Background job category", 32).toLowerCase();
  if (!(BACKGROUND_JOB_CATEGORIES as readonly string[]).includes(normalized)) {
    throw new Error(`Unsupported background job category: ${normalized}`);
  }
  return normalized as BackgroundJobCategory;
}

function normalizeMetadata(metadata: BackgroundJobMetadata | void): BackgroundJobMetadata {
  if (!metadata) return Object.freeze({});
  const entries = Object.entries(metadata);
  if (entries.length > 20) throw new Error("Background job metadata cannot exceed 20 fields.");

  const normalized = Object.fromEntries(
    entries.map(([key, value]) => {
      const normalizedKey = requiredValue(key, "Background job metadata key", 64);
      if (typeof value === "string" && value.length > 256) {
        throw new Error(`Background job metadata value ${normalizedKey} cannot exceed 256 characters.`);
      }
      if (!["string", "number", "boolean"].includes(typeof value) && value !== null) {
        throw new Error(`Background job metadata value ${normalizedKey} must be a scalar.`);
      }
      if (typeof value === "number" && !Number.isFinite(value)) {
        throw new Error(`Background job metadata value ${normalizedKey} must be finite.`);
      }
      return [normalizedKey, value] as const;
    }),
  );
  return Object.freeze(normalized);
}

export function createBackgroundJobRequest(input: Readonly<{
  jobName: string;
  category: string;
  idempotencyKey: string;
  payloadFingerprint: string;
  correlationId: string;
  environment: string;
  projectId: string;
  requestedAt: string;
  maxAttempts?: number;
  retryBackoffSeconds?: number;
  leaseSeconds?: number;
}>): BackgroundJobRequest {
  const jobName = requiredValue(input.jobName, "Background job name", 128).toLowerCase();
  if (!/^[a-z][a-z0-9.-]{2,127}$/.test(jobName)) {
    throw new Error("Background job name must be a lowercase dotted identifier.");
  }

  const payloadFingerprint = requiredValue(
    input.payloadFingerprint,
    "Background job payload fingerprint",
    64,
  ).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(payloadFingerprint)) {
    throw new Error("Background job payload fingerprint must be a SHA-256 hexadecimal digest.");
  }

  return Object.freeze({
    jobName,
    category: backgroundJobCategory(input.category),
    idempotencyKey: requiredValue(input.idempotencyKey, "Background job idempotency key", 256),
    payloadFingerprint,
    correlationId: requiredValue(input.correlationId, "Background job correlation id", 128),
    environment: requiredValue(input.environment, "Background job environment", 32) as BackgroundJobRequest["environment"],
    projectId: requiredValue(input.projectId, "Background job project id", 128),
    requestedAt: isoTimestamp(input.requestedAt, "Background job requested timestamp"),
    maxAttempts: boundedInteger(input.maxAttempts ?? 3, "Background job max attempts", 1, 10),
    retryBackoffSeconds: boundedInteger(
      input.retryBackoffSeconds ?? 10,
      "Background job retry backoff",
      1,
      600,
    ),
    leaseSeconds: boundedInteger(input.leaseSeconds ?? 300, "Background job lease", 5, 1800),
  });
}

export class BackgroundJobExecutionError extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor(code: string, message: string, retryable: boolean) {
    super(message);
    this.name = "BackgroundJobExecutionError";
    this.code = requiredValue(code, "Background job error code", 120);
    this.retryable = retryable;
  }
}

export function retryableBackgroundJobError(code: string, message: string): BackgroundJobExecutionError {
  return new BackgroundJobExecutionError(code, message, true);
}

export function terminalBackgroundJobError(code: string, message: string): BackgroundJobExecutionError {
  return new BackgroundJobExecutionError(code, message, false);
}

function assertRuntimeScope(request: BackgroundJobRequest, runtime: FunctionsRuntimeContext): void {
  if (request.environment !== runtime.environment) {
    throw terminalBackgroundJobError(
      "job-environment-mismatch",
      `Background job environment ${request.environment} does not match runtime ${runtime.environment}.`,
    );
  }
  if (request.projectId !== runtime.projectId) {
    throw terminalBackgroundJobError(
      "job-project-mismatch",
      `Background job project ${request.projectId} does not match runtime ${runtime.projectId}.`,
    );
  }
}

function classifiedFailure(error: unknown): Readonly<{ retryable: boolean; errorCode: string }> {
  if (error instanceof BackgroundJobExecutionError) {
    return Object.freeze({ retryable: error.retryable, errorCode: error.code });
  }
  return Object.freeze({ retryable: true, errorCode: "unhandled-job-error" });
}

export async function executeBackgroundJob(input: Readonly<{
  request: BackgroundJobRequest;
  runtime: FunctionsRuntimeContext;
  store: BackgroundJobStore;
  handler: BackgroundJobHandler;
  now: string;
}>): Promise<BackgroundJobExecutionResult> {
  assertRuntimeScope(input.request, input.runtime);
  const now = isoTimestamp(input.now, "Background job execution timestamp");
  const decision = await input.store.claim(input.request, now);

  if (decision.kind === "duplicate") {
    return Object.freeze({ outcome: "duplicate" as const, ...decision });
  }
  if (decision.kind === "in-progress") {
    return Object.freeze({ outcome: "in-progress" as const, ...decision });
  }
  if (decision.kind === "retry-not-ready") {
    return Object.freeze({ outcome: "retry-not-ready" as const, ...decision });
  }
  if (decision.kind === "terminal") {
    return Object.freeze({
      outcome: "terminal-failure" as const,
      jobId: decision.jobId,
      attemptNumber: decision.attemptCount,
      errorCode: decision.errorCode ?? "terminal-background-job",
    });
  }

  const { claim } = decision;
  try {
    const metadata = normalizeMetadata(
      await input.handler({
        request: input.request,
        jobId: claim.jobId,
        attemptNumber: claim.attemptNumber,
      }),
    );
    await input.store.completeSuccess({
      request: input.request,
      claim,
      completedAt: new Date().toISOString(),
      metadata,
    });
    return Object.freeze({
      outcome: "succeeded" as const,
      jobId: claim.jobId,
      attemptNumber: claim.attemptNumber,
      metadata,
    });
  } catch (error) {
    const failure = classifiedFailure(error);
    const completion = await input.store.completeFailure({
      request: input.request,
      claim,
      completedAt: new Date().toISOString(),
      retryable: failure.retryable,
      errorCode: failure.errorCode,
    });

    if (completion.status === "retryable-failure" && completion.nextAttemptAt) {
      return Object.freeze({
        outcome: "retry-scheduled" as const,
        jobId: claim.jobId,
        attemptNumber: claim.attemptNumber,
        errorCode: failure.errorCode,
        nextAttemptAt: completion.nextAttemptAt,
      });
    }
    return Object.freeze({
      outcome: "terminal-failure" as const,
      jobId: claim.jobId,
      attemptNumber: claim.attemptNumber,
      errorCode: failure.errorCode,
    });
  }
}
