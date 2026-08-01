import {
  Timestamp,
  type DocumentData,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";

import type {
  TransactionalEmailAuditStatus,
  TransactionalEmailDeliveryAuditStore,
  TransactionalEmailDeliveryAuditSummary,
  TransactionalEmailDeliveryIntent,
} from "../application/transactional-email-delivery-audit.js";
import type { BackgroundTransactionalEmailDeliveryReceipt } from "../application/transactional-email-jobs.js";
import { sha256Hex } from "./background-job-identifiers.js";

export const TRANSACTIONAL_EMAIL_DELIVERIES_COLLECTION =
  "transactionalEmailDeliveries" as const;
export const TRANSACTIONAL_EMAIL_DELIVERY_EVENTS_COLLECTION =
  "transactionalEmailDeliveryEvents" as const;

interface PersistedTransactionalEmailDelivery {
  readonly id: string;
  readonly messageId: string;
  readonly idempotencyKeyHash: string;
  readonly payloadFingerprint: string;
  readonly purpose: string;
  readonly eventKey: string;
  readonly eventVersion: number;
  readonly originatingEventId: string;
  readonly templateKey: string;
  readonly templateVersion: number;
  readonly recipientAddressHash: string;
  readonly recipientDomain: string;
  readonly correlationId: string;
  readonly environment: string;
  readonly projectId: string;
  readonly organizationId: string | null;
  readonly userId: string | null;
  readonly relatedObjectType: string | null;
  readonly relatedObjectId: string | null;
  readonly status: TransactionalEmailAuditStatus;
  readonly attemptCount: number;
  readonly backgroundJobId: string | null;
  readonly providerKey: string | null;
  readonly providerReference: string | null;
  readonly diagnosticCode: string | null;
  readonly lastErrorCode: string | null;
  readonly retryable: boolean | null;
  readonly retryAfterSeconds: number | null;
  readonly requestedAt: Timestamp;
  readonly firstAttemptAt: Timestamp | null;
  readonly lastAttemptAt: Timestamp | null;
  readonly acceptedAt: Timestamp | null;
  readonly completedAt: Timestamp | null;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly schemaVersion: 1;
}

interface TransactionalEmailDeliveryEventRecord {
  readonly id: string;
  readonly deliveryId: string;
  readonly messageId: string;
  readonly eventType:
    | "queued"
    | "attempted"
    | "accepted"
    | "retryable-failure"
    | "terminal-failure"
    | "payload-conflict";
  readonly status: TransactionalEmailAuditStatus;
  readonly attemptNumber: number;
  readonly eventKey: string;
  readonly eventVersion: number;
  readonly originatingEventId: string;
  readonly templateKey: string;
  readonly templateVersion: number;
  readonly correlationId: string;
  readonly environment: string;
  readonly projectId: string;
  readonly organizationId: string | null;
  readonly userId: string | null;
  readonly backgroundJobId: string | null;
  readonly providerKey: string | null;
  readonly providerReference: string | null;
  readonly diagnosticCode: string | null;
  readonly errorCode: string | null;
  readonly retryable: boolean | null;
  readonly retryAfterSeconds: number | null;
  readonly observedAt: Timestamp;
  readonly schemaVersion: 1;
}

function parsedTimestamp(value: string, label: string): Timestamp {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid timestamp.`);
  return Timestamp.fromMillis(parsed);
}

function deliveryId(intent: TransactionalEmailDeliveryIntent): string {
  return sha256Hex(`transactional-email-delivery\u0000${intent.idempotencyKey}`);
}

function eventId(
  id: string,
  attemptNumber: number,
  eventType: TransactionalEmailDeliveryEventRecord["eventType"],
): string {
  return sha256Hex(`${id}\u0000${String(attemptNumber)}\u0000${eventType}`);
}

function toPersisted(
  data: DocumentData | undefined,
  path: string,
): PersistedTransactionalEmailDelivery {
  if (!data || data.schemaVersion !== 1 || typeof data.id !== "string") {
    throw new Error(`Transactional email delivery ${path} is malformed.`);
  }
  return data as PersistedTransactionalEmailDelivery;
}

function summary(record: PersistedTransactionalEmailDelivery): TransactionalEmailDeliveryAuditSummary {
  return Object.freeze({
    deliveryId: record.id,
    status: record.status,
    attemptCount: record.attemptCount,
    lastErrorCode: record.lastErrorCode,
  });
}

function assertIntentMatches(
  intent: TransactionalEmailDeliveryIntent,
  record: PersistedTransactionalEmailDelivery,
): void {
  const matches =
    record.id === deliveryId(intent) &&
    record.messageId === intent.messageId &&
    record.idempotencyKeyHash === sha256Hex(intent.idempotencyKey) &&
    record.purpose === intent.purpose &&
    record.eventKey === intent.eventKey &&
    record.eventVersion === intent.eventVersion &&
    record.originatingEventId === intent.originatingEventId &&
    record.templateKey === intent.templateKey &&
    record.templateVersion === intent.templateVersion &&
    record.recipientAddressHash === intent.recipientAddressHash &&
    record.correlationId === intent.correlationId &&
    record.environment === intent.environment &&
    record.projectId === intent.projectId &&
    record.organizationId === intent.organizationId &&
    record.userId === intent.userId &&
    record.relatedObjectType === intent.relatedObjectType &&
    record.relatedObjectId === intent.relatedObjectId;
  if (!matches) {
    throw new Error("Transactional email delivery intent does not match persisted identity.");
  }
}

function appendEvent(
  transaction: Transaction,
  db: Firestore,
  input: Readonly<{
    intent: TransactionalEmailDeliveryIntent;
    deliveryId: string;
    eventType: TransactionalEmailDeliveryEventRecord["eventType"];
    status: TransactionalEmailAuditStatus;
    attemptNumber: number;
    observedAt: Timestamp;
    backgroundJobId?: string | null;
    providerKey?: string | null;
    providerReference?: string | null;
    diagnosticCode?: string | null;
    errorCode?: string | null;
    retryable?: boolean | null;
    retryAfterSeconds?: number | null;
  }>,
): void {
  const record: TransactionalEmailDeliveryEventRecord = Object.freeze({
    id: eventId(input.deliveryId, input.attemptNumber, input.eventType),
    deliveryId: input.deliveryId,
    messageId: input.intent.messageId,
    eventType: input.eventType,
    status: input.status,
    attemptNumber: input.attemptNumber,
    eventKey: input.intent.eventKey,
    eventVersion: input.intent.eventVersion,
    originatingEventId: input.intent.originatingEventId,
    templateKey: input.intent.templateKey,
    templateVersion: input.intent.templateVersion,
    correlationId: input.intent.correlationId,
    environment: input.intent.environment,
    projectId: input.intent.projectId,
    organizationId: input.intent.organizationId,
    userId: input.intent.userId,
    backgroundJobId: input.backgroundJobId ?? null,
    providerKey: input.providerKey ?? null,
    providerReference: input.providerReference ?? null,
    diagnosticCode: input.diagnosticCode ?? null,
    errorCode: input.errorCode ?? null,
    retryable: input.retryable ?? null,
    retryAfterSeconds: input.retryAfterSeconds ?? null,
    observedAt: input.observedAt,
    schemaVersion: 1 as const,
  });
  transaction.create(
    db.collection(TRANSACTIONAL_EMAIL_DELIVERY_EVENTS_COLLECTION).doc(record.id),
    record,
  );
}

function initialRecord(
  intent: TransactionalEmailDeliveryIntent,
  id: string,
  observedAt: Timestamp,
): PersistedTransactionalEmailDelivery {
  return Object.freeze({
    id,
    messageId: intent.messageId,
    idempotencyKeyHash: sha256Hex(intent.idempotencyKey),
    payloadFingerprint: intent.payloadFingerprint,
    purpose: intent.purpose,
    eventKey: intent.eventKey,
    eventVersion: intent.eventVersion,
    originatingEventId: intent.originatingEventId,
    templateKey: intent.templateKey,
    templateVersion: intent.templateVersion,
    recipientAddressHash: intent.recipientAddressHash,
    recipientDomain: intent.recipientDomain,
    correlationId: intent.correlationId,
    environment: intent.environment,
    projectId: intent.projectId,
    organizationId: intent.organizationId,
    userId: intent.userId,
    relatedObjectType: intent.relatedObjectType,
    relatedObjectId: intent.relatedObjectId,
    status: "queued",
    attemptCount: 0,
    backgroundJobId: null,
    providerKey: null,
    providerReference: null,
    diagnosticCode: null,
    lastErrorCode: null,
    retryable: null,
    retryAfterSeconds: null,
    requestedAt: parsedTimestamp(intent.requestedAt, "Transactional email requested timestamp"),
    firstAttemptAt: null,
    lastAttemptAt: null,
    acceptedAt: null,
    completedAt: null,
    createdAt: observedAt,
    updatedAt: observedAt,
    schemaVersion: 1 as const,
  });
}

export class FirestoreTransactionalEmailDeliveryAuditStore
  implements TransactionalEmailDeliveryAuditStore {
  constructor(private readonly db: Firestore) {}

  async ensureIntent(
    intent: TransactionalEmailDeliveryIntent,
    observedAtIso: string,
  ): Promise<TransactionalEmailDeliveryAuditSummary> {
    const observedAt = parsedTimestamp(observedAtIso, "Transactional email intent timestamp");
    const id = deliveryId(intent);
    const ref = this.db.collection(TRANSACTIONAL_EMAIL_DELIVERIES_COLLECTION).doc(id);
    return this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) {
        const record = initialRecord(intent, id, observedAt);
        transaction.create(ref, record);
        appendEvent(transaction, this.db, {
          intent,
          deliveryId: id,
          eventType: "queued",
          status: "queued",
          attemptNumber: 0,
          observedAt,
        });
        return summary(record);
      }

      const record = toPersisted(snapshot.data(), snapshot.ref.path);
      assertIntentMatches(intent, record);
      if (record.payloadFingerprint !== intent.payloadFingerprint) {
        const errorCode = "transactional-email-idempotency-payload-conflict";
        transaction.update(ref, {
          status: "terminal-failure",
          lastErrorCode: errorCode,
          retryable: false,
          completedAt: observedAt,
          updatedAt: observedAt,
        });
        appendEvent(transaction, this.db, {
          intent,
          deliveryId: id,
          eventType: "payload-conflict",
          status: "terminal-failure",
          attemptNumber: record.attemptCount,
          observedAt,
          errorCode,
          retryable: false,
        });
        return Object.freeze({
          deliveryId: id,
          status: "terminal-failure" as const,
          attemptCount: record.attemptCount,
          lastErrorCode: errorCode,
        });
      }
      return summary(record);
    });
  }

  async recordAttempt(input: Readonly<{
    intent: TransactionalEmailDeliveryIntent;
    deliveryId: string;
    jobId: string;
    attemptNumber: number;
    observedAt: string;
  }>): Promise<void> {
    const observedAt = parsedTimestamp(input.observedAt, "Transactional email attempt timestamp");
    const ref = this.db.collection(TRANSACTIONAL_EMAIL_DELIVERIES_COLLECTION).doc(input.deliveryId);
    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const record = toPersisted(snapshot.data(), snapshot.ref.path);
      assertIntentMatches(input.intent, record);
      if (record.status === "accepted" || record.status === "terminal-failure") {
        throw new Error("Completed transactional email delivery cannot begin another attempt.");
      }
      if (record.attemptCount > input.attemptNumber) {
        throw new Error("Transactional email delivery attempt is stale.");
      }
      transaction.update(ref, {
        status: "attempting",
        attemptCount: input.attemptNumber,
        backgroundJobId: input.jobId,
        firstAttemptAt: record.firstAttemptAt ?? observedAt,
        lastAttemptAt: observedAt,
        lastErrorCode: null,
        retryable: null,
        retryAfterSeconds: null,
        updatedAt: observedAt,
      });
      appendEvent(transaction, this.db, {
        intent: input.intent,
        deliveryId: input.deliveryId,
        eventType: "attempted",
        status: "attempting",
        attemptNumber: input.attemptNumber,
        observedAt,
        backgroundJobId: input.jobId,
      });
    });
  }

  async recordAccepted(input: Readonly<{
    intent: TransactionalEmailDeliveryIntent;
    deliveryId: string;
    jobId: string;
    attemptNumber: number;
    receipt: BackgroundTransactionalEmailDeliveryReceipt;
    observedAt: string;
  }>): Promise<void> {
    const observedAt = parsedTimestamp(input.observedAt, "Transactional email acceptance timestamp");
    const ref = this.db.collection(TRANSACTIONAL_EMAIL_DELIVERIES_COLLECTION).doc(input.deliveryId);
    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const record = toPersisted(snapshot.data(), snapshot.ref.path);
      assertIntentMatches(input.intent, record);
      if (record.status === "accepted") return;
      if (record.status !== "attempting" || record.attemptCount !== input.attemptNumber) {
        throw new Error("Transactional email acceptance does not own the current attempt.");
      }
      transaction.update(ref, {
        status: "accepted",
        backgroundJobId: input.jobId,
        providerKey: input.receipt.providerKey,
        providerReference: input.receipt.externalReference,
        diagnosticCode: input.receipt.diagnosticCode,
        lastErrorCode: null,
        retryable: false,
        retryAfterSeconds: null,
        acceptedAt: observedAt,
        completedAt: observedAt,
        updatedAt: observedAt,
      });
      appendEvent(transaction, this.db, {
        intent: input.intent,
        deliveryId: input.deliveryId,
        eventType: "accepted",
        status: "accepted",
        attemptNumber: input.attemptNumber,
        observedAt,
        backgroundJobId: input.jobId,
        providerKey: input.receipt.providerKey,
        providerReference: input.receipt.externalReference,
        diagnosticCode: input.receipt.diagnosticCode,
        retryable: false,
      });
    });
  }

  async recordFailure(input: Readonly<{
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
  }>): Promise<void> {
    const observedAt = parsedTimestamp(input.observedAt, "Transactional email failure timestamp");
    const ref = this.db.collection(TRANSACTIONAL_EMAIL_DELIVERIES_COLLECTION).doc(input.deliveryId);
    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const record = toPersisted(snapshot.data(), snapshot.ref.path);
      assertIntentMatches(input.intent, record);
      if (record.status === "accepted") {
        throw new Error("Accepted transactional email delivery cannot be failed.");
      }
      if (record.status !== "attempting" || record.attemptCount !== input.attemptNumber) {
        throw new Error("Transactional email failure does not own the current attempt.");
      }
      transaction.update(ref, {
        status: input.status,
        backgroundJobId: input.jobId,
        providerKey: input.providerKey,
        providerReference: input.providerReference,
        diagnosticCode: null,
        lastErrorCode: input.errorCode,
        retryable: input.status === "retryable-failure",
        retryAfterSeconds: input.retryAfterSeconds,
        completedAt: input.status === "terminal-failure" ? observedAt : null,
        updatedAt: observedAt,
      });
      appendEvent(transaction, this.db, {
        intent: input.intent,
        deliveryId: input.deliveryId,
        eventType: input.status,
        status: input.status,
        attemptNumber: input.attemptNumber,
        observedAt,
        backgroundJobId: input.jobId,
        providerKey: input.providerKey,
        providerReference: input.providerReference,
        errorCode: input.errorCode,
        retryable: input.status === "retryable-failure",
        retryAfterSeconds: input.retryAfterSeconds,
      });
    });
  }

  async listTerminalFailures(input: Readonly<{
    environment: string;
    projectId: string;
    organizationId?: string | null;
    limit?: number;
  }>): Promise<readonly TransactionalEmailDeliveryAuditSummary[]> {
    const limit = Math.max(1, Math.min(input.limit ?? 50, 200));
    const snapshot = await this.db
      .collection(TRANSACTIONAL_EMAIL_DELIVERIES_COLLECTION)
      .where("status", "==", "terminal-failure")
      .limit(200)
      .get();
    return Object.freeze(
      snapshot.docs
        .map((document) => toPersisted(document.data(), document.ref.path))
        .filter((record) =>
          record.environment === input.environment &&
          record.projectId === input.projectId &&
          (input.organizationId === undefined ||
            input.organizationId === null ||
            record.organizationId === input.organizationId))
        .sort((left, right) => right.updatedAt.toMillis() - left.updatedAt.toMillis())
        .slice(0, limit)
        .map(summary),
    );
  }
}
