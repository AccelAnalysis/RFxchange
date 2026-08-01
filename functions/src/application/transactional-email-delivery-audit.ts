import { createHash } from "node:crypto";

import {
  executeBackgroundJob,
  retryableBackgroundJobError,
  terminalBackgroundJobError,
  type BackgroundJobExecutionResult,
  type BackgroundJobRequest,
  type BackgroundJobStore,
} from "./background-jobs.js";
import type { FunctionsRuntimeContext } from "./runtime-foundation.js";
import {
  classifyTransactionalEmailProviderFailure,
  transactionalEmailDeliveryMetadata,
  type BackgroundTransactionalEmailDeliveryReceipt,
} from "./transactional-email-jobs.js";

export type TransactionalEmailAuditStatus =
  | "queued"
  | "attempting"
  | "accepted"
  | "retryable-failure"
  | "terminal-failure";

export interface TransactionalEmailDeliveryIntent {
  readonly messageId: string;
  readonly idempotencyKey: string;
  readonly payloadFingerprint: string;
  readonly purpose: "transactional" | "administrative";
  readonly eventKey: string;
  readonly eventVersion: number;
  readonly originatingEventId: string;
  readonly templateKey: string;
  readonly templateVersion: number;
  readonly recipientAddressHash: string;
  readonly recipientDomain: string;
  readonly correlationId: string;
  readonly organizationId: string | null;
  readonly userId: string | null;
  readonly relatedObjectType: string | null;
  readonly relatedObjectId: string | null;
  readonly requestedAt: string;
}

export interface TransactionalEmailDeliveryAuditSummary {
  readonly deliveryId: string;
  readonly status: TransactionalEmailAuditStatus;
  readonly attemptCount: number;
  readonly lastErrorCode: string | null;
}

export interface TransactionalEmailDeliveryAuditStore {
  ensureIntent(
    intent: TransactionalEmailDeliveryIntent,
    observedAt: string,
  ): Promise<TransactionalEmailDeliveryAuditSummary>;
  recordAttempt(input: Readonly<{
    intent: TransactionalEmailDeliveryIntent;
    deliveryId: string;
    jobId: string;
    attemptNumber: number;
    observedAt: string;
  }>): Promise<void>;
  recordAccepted(input: Readonly<{
    intent: TransactionalEmailDeliveryIntent;
    deliveryId: string;
    jobId: string;
    attemptNumber: number;
    receipt: BackgroundTransactionalEmailDeliveryReceipt;
    observedAt: string;
  }>): Promise<void>;
  recordFailure(input: Readonly<{
    intent: TransactionalEmailDeliveryIntent;
    deliveryId: string;
    jobId: string;
    attemptNumber: number;
    status: "retryable-failure" | "terminal-failure";
    providerKey: string | null;
    providerReference: string | null;
    errorCode: string;
    retryAfterSeconds: number | null;
    observedAt: string;
  }>): Promise<void>;
  listTerminalFailures(input: Readonly<{
    environment: string;
    projectId: string;
    organizationId?: string | null;
    limit?: number;
  }>): Promise<readonly TransactionalEmailDeliveryAuditSummary[]>;
}

function required(value: string, label: string, maximumLength: number): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximumLength) {
    throw new Error(`${label} cannot exceed ${maximumLength} characters.`);
  }
  return normalized;
}

function stableKey(value: string, label: string): string {
  const normalized = required(value, label, 128).toLowerCase();
  if (!/^[a-z0-9][a-z0-9._:-]{0,127}$/.test(normalized)) {
    throw new Error(`${label} must be a stable lowercase identifier.`);
  }
  return normalized;
}

function positiveVersion(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1 || value > 10_000) {
    throw new Error(`${label} must be an integer between 1 and 10000.`);
  }
  return value;
}

function timestamp(value: string, label: string): string {
  const normalized = required(value, label, 64);
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid timestamp.`);
  return new Date(parsed).toISOString();
}

function optional(value: string | null | undefined, label: string, maximumLength = 192): string | null {
  if (value === null || value === undefined || !value.trim()) return null;
  return required(value, label, maximumLength);
}

function recipientRoute(email: string): Readonly<{ addressHash: string; domain: string }> {
  const normalized = required(email, "Transactional email recipient", 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Transactional email recipient must be a valid email address.");
  }
  const domain = normalized.slice(normalized.lastIndexOf("@") + 1);
  return Object.freeze({
    addressHash: createHash("sha256").update(normalized).digest("hex"),
    domain,
  });
}

export function createTransactionalEmailDeliveryIntent(input: Readonly<{
  messageId: string;
  idempotencyKey: string;
  payloadFingerprint: string;
  purpose: "transactional" | "administrative";
  eventKey: string;
  eventVersion: number;
  originatingEventId: string;
  templateKey: string;
  templateVersion: number;
  recipientEmail: string;
  correlationId: string;
  organizationId?: string | null;
  userId?: string | null;
  relatedObjectType?: string | null;
  relatedObjectId?: string | null;
  requestedAt: string;
}>): TransactionalEmailDeliveryIntent {
  if (input.purpose !== "transactional" && input.purpose !== "administrative") {
    throw new Error(`Unsupported transactional email purpose: ${String(input.purpose)}.`);
  }
  const payloadFingerprint = required(
    input.payloadFingerprint,
    "Transactional email payload fingerprint",
    64,
  ).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(payloadFingerprint)) {
    throw new Error("Transactional email payload fingerprint must be a SHA-256 digest.");
  }
  const route = recipientRoute(input.recipientEmail);
  const relatedObjectType = optional(
    input.relatedObjectType,
    "Transactional email related object type",
    96,
  );
  const relatedObjectId = optional(
    input.relatedObjectId,
    "Transactional email related object id",
  );
  if ((relatedObjectType === null) !== (relatedObjectId === null)) {
    throw new Error("Transactional email related object type and id must be supplied together.");
  }
  return Object.freeze({
    messageId: stableKey(input.messageId, "Transactional email message id"),
    idempotencyKey: required(input.idempotencyKey, "Transactional email idempotency key", 256),
    payloadFingerprint,
    purpose: input.purpose,
    eventKey: stableKey(input.eventKey, "Transactional email event key"),
    eventVersion: positiveVersion(input.eventVersion, "Transactional email event version"),
    originatingEventId: required(
      input.originatingEventId,
      "Transactional email originating event id",
      192,
    ),
    templateKey: stableKey(input.templateKey, "Transactional email template key"),
    templateVersion: positiveVersion(input.templateVersion, "Transactional email template version"),
    recipientAddressHash: route.addressHash,
    recipientDomain: route.domain,
    correlationId: required(input.correlationId, "Transactional email correlation id", 192),
    organizationId: optional(input.organizationId, "Transactional email organization id"),
    userId: optional(input.userId, "Transactional email user id"),
    relatedObjectType,
    relatedObjectId,
    requestedAt: timestamp(input.requestedAt, "Transactional email requested timestamp"),
  });
}

function assertExecutionAlignment(
  intent: TransactionalEmailDeliveryIntent,
  request: BackgroundJobRequest,
): void {
  if (request.category !== "notification") {
    throw terminalBackgroundJobError(
      "transactional-email-job-category-invalid",
      "Transactional email delivery must use the notification job category.",
    );
  }
  if (!request.jobName.startsWith("communications.transactional-email")) {
    throw terminalBackgroundJobError(
      "transactional-email-job-name-invalid",
      "Transactional email delivery must use the canonical communications job name.",
    );
  }
  if (
    request.idempotencyKey !== intent.idempotencyKey ||
    request.payloadFingerprint !== intent.payloadFingerprint ||
    request.correlationId !== intent.correlationId
  ) {
    throw terminalBackgroundJobError(
      "transactional-email-job-intent-mismatch",
      "Transactional email audit intent does not match the background job request.",
    );
  }
}

export async function executeReliableTransactionalEmailJob(input: Readonly<{
  intent: TransactionalEmailDeliveryIntent;
  request: BackgroundJobRequest;
  runtime: FunctionsRuntimeContext;
  backgroundJobStore: BackgroundJobStore;
  auditStore: TransactionalEmailDeliveryAuditStore;
  deliver: () => Promise<BackgroundTransactionalEmailDeliveryReceipt>;
  now: string;
}>): Promise<BackgroundJobExecutionResult> {
  assertExecutionAlignment(input.intent, input.request);
  const observedAt = timestamp(input.now, "Transactional email execution timestamp");
  const current = await input.auditStore.ensureIntent(input.intent, observedAt);
  if (current.status === "accepted") {
    return Object.freeze({
      outcome: "duplicate" as const,
      jobId: current.deliveryId,
      attemptCount: current.attemptCount,
    });
  }
  if (current.status === "terminal-failure") {
    return Object.freeze({
      outcome: "terminal-failure" as const,
      jobId: current.deliveryId,
      attemptNumber: current.attemptCount,
      errorCode: current.lastErrorCode ?? "transactional-email-terminal-failure",
    });
  }

  return executeBackgroundJob({
    request: input.request,
    runtime: input.runtime,
    store: input.backgroundJobStore,
    now: observedAt,
    handler: async (context) => {
      await input.auditStore.recordAttempt({
        intent: input.intent,
        deliveryId: current.deliveryId,
        jobId: context.jobId,
        attemptNumber: context.attemptNumber,
        observedAt,
      });

      let receipt: BackgroundTransactionalEmailDeliveryReceipt;
      try {
        receipt = await input.deliver();
      } catch (error) {
        const failure = classifyTransactionalEmailProviderFailure(error);
        const retryable = failure?.retryable ?? true;
        const exhausted = context.attemptNumber >= context.request.maxAttempts;
        const status = retryable && !exhausted
          ? "retryable-failure" as const
          : "terminal-failure" as const;
        const providerKey = failure?.providerKey ?? null;
        const errorCode = failure
          ? `transactional-email-${failure.providerKey}-${failure.code}`.slice(0, 120)
          : "transactional-email-provider-unhandled";
        await input.auditStore.recordFailure({
          intent: input.intent,
          deliveryId: current.deliveryId,
          jobId: context.jobId,
          attemptNumber: context.attemptNumber,
          status,
          providerKey,
          providerReference: failure?.externalReference ?? null,
          errorCode,
          retryAfterSeconds: failure?.retryAfterSeconds ?? null,
          observedAt,
        });
        throw status === "retryable-failure"
          ? retryableBackgroundJobError(errorCode, "Transactional email delivery should be retried.")
          : terminalBackgroundJobError(errorCode, "Transactional email delivery must not be retried.");
      }

      if (receipt.status !== "accepted") {
        const errorCode = `transactional-email-${receipt.providerKey}-rejected`.slice(0, 120);
        await input.auditStore.recordFailure({
          intent: input.intent,
          deliveryId: current.deliveryId,
          jobId: context.jobId,
          attemptNumber: context.attemptNumber,
          status: "terminal-failure",
          providerKey: receipt.providerKey,
          providerReference: receipt.externalReference,
          errorCode,
          retryAfterSeconds: null,
          observedAt,
        });
        throw terminalBackgroundJobError(
          errorCode,
          "Transactional email provider rejected the delivery.",
        );
      }

      await input.auditStore.recordAccepted({
        intent: input.intent,
        deliveryId: current.deliveryId,
        jobId: context.jobId,
        attemptNumber: context.attemptNumber,
        receipt,
        observedAt,
      });
      return transactionalEmailDeliveryMetadata(receipt);
    },
  });
}
