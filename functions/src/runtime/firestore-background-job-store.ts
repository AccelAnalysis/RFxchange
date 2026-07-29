import {
  Timestamp,
  type DocumentData,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";

import type {
  BackgroundJobClaim,
  BackgroundJobClaimDecision,
  BackgroundJobFailureCompletion,
  BackgroundJobMetadata,
  BackgroundJobRequest,
  BackgroundJobStatus,
  BackgroundJobStore,
} from "../application/background-jobs.js";
import { backgroundJobDocumentId, sha256Hex } from "./background-job-identifiers.js";

export const BACKGROUND_JOBS_COLLECTION = "backgroundJobs" as const;
export const BACKGROUND_JOB_EVENTS_COLLECTION = "backgroundJobEvents" as const;

interface PersistedBackgroundJob {
  readonly id: string;
  readonly jobName: string;
  readonly category: string;
  readonly idempotencyKeyHash: string;
  readonly payloadFingerprint: string;
  readonly correlationId: string;
  readonly environment: string;
  readonly projectId: string;
  readonly status: BackgroundJobStatus;
  readonly attemptCount: number;
  readonly maxAttempts: number;
  readonly retryBackoffSeconds: number;
  readonly leaseSeconds: number;
  readonly leaseExpiresAt: Timestamp | null;
  readonly nextAttemptAt: Timestamp | null;
  readonly completedAt: Timestamp | null;
  readonly lastErrorCode: string | null;
  readonly metadata: BackgroundJobMetadata;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly schemaVersion: 1;
}

export interface BackgroundJobEventRecord {
  readonly id: string;
  readonly jobId: string;
  readonly jobName: string;
  readonly category: string;
  readonly eventType:
    | "claimed"
    | "succeeded"
    | "retryable-failure"
    | "terminal-failure"
    | "payload-conflict"
    | "attempts-exhausted";
  readonly status: BackgroundJobStatus;
  readonly attemptNumber: number;
  readonly correlationId: string;
  readonly environment: string;
  readonly projectId: string;
  readonly errorCode: string | null;
  readonly metadata: BackgroundJobMetadata;
  readonly observedAt: Timestamp;
  readonly schemaVersion: 1;
}

function parsedTimestamp(value: string, label: string): Timestamp {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid timestamp.`);
  return Timestamp.fromMillis(parsed);
}

function timestampIso(value: Timestamp): string {
  return value.toDate().toISOString();
}

function eventId(
  jobId: string,
  attemptNumber: number,
  eventType: BackgroundJobEventRecord["eventType"],
): string {
  return sha256Hex(`${jobId}\u0000${String(attemptNumber)}\u0000${eventType}`);
}

function toPersistedJob(data: DocumentData | undefined, path: string): PersistedBackgroundJob {
  if (!data) throw new Error(`Background job ${path} is missing data.`);
  if (data.schemaVersion !== 1) throw new Error(`Background job ${path} has unsupported schemaVersion.`);
  if (typeof data.id !== "string" || typeof data.jobName !== "string") {
    throw new Error(`Background job ${path} is malformed.`);
  }
  return data as PersistedBackgroundJob;
}

function appendEvent(
  transaction: Transaction,
  db: Firestore,
  input: Readonly<{
    request: BackgroundJobRequest;
    jobId: string;
    eventType: BackgroundJobEventRecord["eventType"];
    status: BackgroundJobStatus;
    attemptNumber: number;
    observedAt: Timestamp;
    errorCode?: string | null;
    metadata?: BackgroundJobMetadata;
  }>,
): void {
  const id = eventId(input.jobId, input.attemptNumber, input.eventType);
  const record: BackgroundJobEventRecord = Object.freeze({
    id,
    jobId: input.jobId,
    jobName: input.request.jobName,
    category: input.request.category,
    eventType: input.eventType,
    status: input.status,
    attemptNumber: input.attemptNumber,
    correlationId: input.request.correlationId,
    environment: input.request.environment,
    projectId: input.request.projectId,
    errorCode: input.errorCode ?? null,
    metadata: input.metadata ?? Object.freeze({}),
    observedAt: input.observedAt,
    schemaVersion: 1 as const,
  });
  transaction.create(db.collection(BACKGROUND_JOB_EVENTS_COLLECTION).doc(id), record);
}

function initialJob(
  request: BackgroundJobRequest,
  jobId: string,
  now: Timestamp,
): PersistedBackgroundJob {
  return Object.freeze({
    id: jobId,
    jobName: request.jobName,
    category: request.category,
    idempotencyKeyHash: sha256Hex(request.idempotencyKey),
    payloadFingerprint: request.payloadFingerprint,
    correlationId: request.correlationId,
    environment: request.environment,
    projectId: request.projectId,
    status: "running" as const,
    attemptCount: 1,
    maxAttempts: request.maxAttempts,
    retryBackoffSeconds: request.retryBackoffSeconds,
    leaseSeconds: request.leaseSeconds,
    leaseExpiresAt: Timestamp.fromMillis(now.toMillis() + request.leaseSeconds * 1000),
    nextAttemptAt: null,
    completedAt: null,
    lastErrorCode: null,
    metadata: Object.freeze({}),
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1 as const,
  });
}

function assertRequestMatchesPersisted(
  request: BackgroundJobRequest,
  job: PersistedBackgroundJob,
  jobId: string,
): void {
  if (job.id !== jobId || job.jobName !== request.jobName) {
    throw new Error("Persisted background job identity does not match the requested job.");
  }
  if (
    job.environment !== request.environment ||
    job.projectId !== request.projectId ||
    job.category !== request.category
  ) {
    throw new Error("Persisted background job runtime scope does not match the request.");
  }
  if (job.idempotencyKeyHash !== sha256Hex(request.idempotencyKey)) {
    throw new Error("Persisted background job idempotency key hash does not match the request.");
  }
}

function retryDelaySeconds(request: BackgroundJobRequest, attemptNumber: number): number {
  return Math.min(request.retryBackoffSeconds * 2 ** Math.max(0, attemptNumber - 1), 3600);
}

export class FirestoreBackgroundJobStore implements BackgroundJobStore {
  constructor(private readonly db: Firestore) {}

  async claim(request: BackgroundJobRequest, nowIso: string): Promise<BackgroundJobClaimDecision> {
    const now = parsedTimestamp(nowIso, "Background job claim timestamp");
    const jobId = backgroundJobDocumentId(request.jobName, request.idempotencyKey);
    const ref = this.db.collection(BACKGROUND_JOBS_COLLECTION).doc(jobId);

    return this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) {
        transaction.create(ref, initialJob(request, jobId, now));
        appendEvent(transaction, this.db, {
          request,
          jobId,
          eventType: "claimed",
          status: "running",
          attemptNumber: 1,
          observedAt: now,
        });
        return Object.freeze({
          kind: "claimed" as const,
          claim: Object.freeze({ jobId, attemptNumber: 1, maxAttempts: request.maxAttempts }),
        });
      }

      const job = toPersistedJob(snapshot.data(), snapshot.ref.path);
      assertRequestMatchesPersisted(request, job, jobId);

      if (job.payloadFingerprint !== request.payloadFingerprint) {
        const errorCode = "idempotency-payload-conflict";
        transaction.update(ref, {
          status: "terminal-failure",
          leaseExpiresAt: null,
          nextAttemptAt: null,
          completedAt: now,
          lastErrorCode: errorCode,
          updatedAt: now,
        });
        appendEvent(transaction, this.db, {
          request,
          jobId,
          eventType: "payload-conflict",
          status: "terminal-failure",
          attemptNumber: job.attemptCount,
          observedAt: now,
          errorCode,
        });
        return Object.freeze({
          kind: "terminal" as const,
          jobId,
          attemptCount: job.attemptCount,
          errorCode,
        });
      }

      if (job.status === "succeeded") {
        return Object.freeze({
          kind: "duplicate" as const,
          jobId,
          attemptCount: job.attemptCount,
        });
      }
      if (job.status === "terminal-failure") {
        return Object.freeze({
          kind: "terminal" as const,
          jobId,
          attemptCount: job.attemptCount,
          errorCode: job.lastErrorCode,
        });
      }
      if (
        job.status === "running" &&
        job.leaseExpiresAt &&
        job.leaseExpiresAt.toMillis() > now.toMillis()
      ) {
        return Object.freeze({
          kind: "in-progress" as const,
          jobId,
          attemptCount: job.attemptCount,
          leaseExpiresAt: timestampIso(job.leaseExpiresAt),
        });
      }
      if (
        job.status === "retryable-failure" &&
        job.nextAttemptAt &&
        job.nextAttemptAt.toMillis() > now.toMillis()
      ) {
        return Object.freeze({
          kind: "retry-not-ready" as const,
          jobId,
          attemptCount: job.attemptCount,
          nextAttemptAt: timestampIso(job.nextAttemptAt),
        });
      }

      if (job.attemptCount >= job.maxAttempts) {
        const errorCode = job.lastErrorCode ?? "background-job-attempts-exhausted";
        transaction.update(ref, {
          status: "terminal-failure",
          leaseExpiresAt: null,
          nextAttemptAt: null,
          completedAt: now,
          lastErrorCode: errorCode,
          updatedAt: now,
        });
        appendEvent(transaction, this.db, {
          request,
          jobId,
          eventType: "attempts-exhausted",
          status: "terminal-failure",
          attemptNumber: job.attemptCount,
          observedAt: now,
          errorCode,
        });
        return Object.freeze({
          kind: "terminal" as const,
          jobId,
          attemptCount: job.attemptCount,
          errorCode,
        });
      }

      const attemptNumber = job.attemptCount + 1;
      transaction.update(ref, {
        status: "running",
        attemptCount: attemptNumber,
        correlationId: request.correlationId,
        leaseExpiresAt: Timestamp.fromMillis(now.toMillis() + request.leaseSeconds * 1000),
        nextAttemptAt: null,
        completedAt: null,
        updatedAt: now,
      });
      appendEvent(transaction, this.db, {
        request,
        jobId,
        eventType: "claimed",
        status: "running",
        attemptNumber,
        observedAt: now,
      });
      const claim: BackgroundJobClaim = Object.freeze({
        jobId,
        attemptNumber,
        maxAttempts: job.maxAttempts,
      });
      return Object.freeze({ kind: "claimed" as const, claim });
    });
  }

  async completeSuccess(input: Readonly<{
    request: BackgroundJobRequest;
    claim: BackgroundJobClaim;
    completedAt: string;
    metadata: BackgroundJobMetadata;
  }>): Promise<void> {
    const completedAt = parsedTimestamp(input.completedAt, "Background job completion timestamp");
    const ref = this.db.collection(BACKGROUND_JOBS_COLLECTION).doc(input.claim.jobId);

    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const job = toPersistedJob(snapshot.data(), snapshot.ref.path);
      assertRequestMatchesPersisted(input.request, job, input.claim.jobId);
      if (job.status !== "running" || job.attemptCount !== input.claim.attemptNumber) {
        throw new Error("Background job success completion does not own the current attempt.");
      }
      transaction.update(ref, {
        status: "succeeded",
        leaseExpiresAt: null,
        nextAttemptAt: null,
        completedAt,
        lastErrorCode: null,
        metadata: input.metadata,
        updatedAt: completedAt,
      });
      appendEvent(transaction, this.db, {
        request: input.request,
        jobId: input.claim.jobId,
        eventType: "succeeded",
        status: "succeeded",
        attemptNumber: input.claim.attemptNumber,
        observedAt: completedAt,
        metadata: input.metadata,
      });
    });
  }

  async completeFailure(input: Readonly<{
    request: BackgroundJobRequest;
    claim: BackgroundJobClaim;
    completedAt: string;
    retryable: boolean;
    errorCode: string;
  }>): Promise<BackgroundJobFailureCompletion> {
    const completedAt = parsedTimestamp(input.completedAt, "Background job failure timestamp");
    const ref = this.db.collection(BACKGROUND_JOBS_COLLECTION).doc(input.claim.jobId);

    return this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const job = toPersistedJob(snapshot.data(), snapshot.ref.path);
      assertRequestMatchesPersisted(input.request, job, input.claim.jobId);
      if (job.status !== "running" || job.attemptCount !== input.claim.attemptNumber) {
        throw new Error("Background job failure completion does not own the current attempt.");
      }

      const canRetry = input.retryable && input.claim.attemptNumber < input.claim.maxAttempts;
      const nextAttemptAt = canRetry
        ? Timestamp.fromMillis(
            completedAt.toMillis() +
              retryDelaySeconds(input.request, input.claim.attemptNumber) * 1000,
          )
        : null;
      const status: BackgroundJobFailureCompletion["status"] = canRetry
        ? "retryable-failure"
        : "terminal-failure";

      transaction.update(ref, {
        status,
        leaseExpiresAt: null,
        nextAttemptAt,
        completedAt: canRetry ? null : completedAt,
        lastErrorCode: input.errorCode,
        updatedAt: completedAt,
      });
      appendEvent(transaction, this.db, {
        request: input.request,
        jobId: input.claim.jobId,
        eventType: status,
        status,
        attemptNumber: input.claim.attemptNumber,
        observedAt: completedAt,
        errorCode: input.errorCode,
      });

      return Object.freeze({
        status,
        nextAttemptAt: nextAttemptAt ? timestampIso(nextAttemptAt) : null,
      });
    });
  }
}
