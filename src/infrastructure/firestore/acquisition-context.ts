import { Timestamp, type Firestore } from "firebase-admin/firestore";

import {
  AcquisitionContextBindingError,
  bindAcquisitionContext,
  createAcquisitionContextEvent,
  resumeAcquisitionContext,
  type AcquisitionContextEnvelope,
  type AcquisitionContextEvent,
} from "../../domain/acquisition/model.ts";
import type { AcquisitionContextRepository } from "../../domain/acquisition/repository.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";

const CONTEXTS = "acquisitionContexts";
const EVENTS = "acquisitionContextEvents";

function isoTimestamp(value: unknown): string {
  if (typeof value === "string") return new Date(value).toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  throw new Error("Acquisition persistence is missing a valid timestamp.");
}

function hydrate(data: FirebaseFirestore.DocumentData | undefined): AcquisitionContextEnvelope {
  if (!data || data.schemaVersion !== FIRESTORE_SCHEMA_VERSION || data.version !== 1) {
    throw new Error("Acquisition context failed schema validation.");
  }
  return Object.freeze({
    ...data,
    intent: Object.freeze({ ...data.intent }),
    source: Object.freeze({ ...data.source }),
    issuedAt: isoTimestamp(data.issuedAt),
    expiresAt: isoTimestamp(data.expiresAt),
    boundAt: data.boundAt ? isoTimestamp(data.boundAt) : null,
    firstResumedAt: data.firstResumedAt ? isoTimestamp(data.firstResumedAt) : null,
  }) as AcquisitionContextEnvelope;
}

function persistenceRecord(value: AcquisitionContextEnvelope | AcquisitionContextEvent) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION });
}

export class FirestoreAcquisitionContextRepository implements AcquisitionContextRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getById(id: string): Promise<AcquisitionContextEnvelope | null> {
    const snapshot = await this.db.collection(CONTEXTS).doc(id).get();
    return snapshot.exists ? hydrate(snapshot.data()) : null;
  }

  async create(context: AcquisitionContextEnvelope, event: AcquisitionContextEvent): Promise<void> {
    if (event.acquisitionContextId !== context.id || event.kind !== "issued") {
      throw new Error("Acquisition issuance event does not match its context.");
    }
    await this.db.runTransaction(async (transaction) => {
      transaction.create(this.db.collection(CONTEXTS).doc(context.id), persistenceRecord(context));
      transaction.create(this.db.collection(EVENTS).doc(event.id), persistenceRecord(event));
    });
  }

  async bind(input: Parameters<AcquisitionContextRepository["bind"]>[0]): Promise<AcquisitionContextEnvelope> {
    return this.db.runTransaction(async (transaction) => {
      const reference = this.db.collection(CONTEXTS).doc(input.id);
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) {
        throw new AcquisitionContextBindingError("Acquisition context is unavailable.");
      }
      const current = hydrate(snapshot.data());
      const bound = bindAcquisitionContext({
        context: current,
        browserSecretDigest: input.browserSecretDigest,
        userId: input.userId,
        accessJourneyId: input.accessJourneyId,
        now: input.now,
      });
      if (current.status !== "issued") return bound;

      const event = createAcquisitionContextEvent({
        id: input.eventId,
        context: bound,
        kind: "bound",
        occurredAt: input.now,
      });
      transaction.set(reference, persistenceRecord(bound));
      transaction.create(this.db.collection(EVENTS).doc(event.id), persistenceRecord(event));
      return bound;
    });
  }

  async resume(input: Parameters<AcquisitionContextRepository["resume"]>[0]): Promise<AcquisitionContextEnvelope> {
    return this.db.runTransaction(async (transaction) => {
      const reference = this.db.collection(CONTEXTS).doc(input.id);
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error("Acquisition context is unavailable.");
      const current = hydrate(snapshot.data());
      const resumed = resumeAcquisitionContext({
        context: current,
        userId: input.userId,
        accessJourneyId: input.accessJourneyId,
        now: input.now,
      });
      if (current.status === "resumed") return resumed;
      const event = createAcquisitionContextEvent({
        id: input.eventId,
        context: resumed,
        kind: "resumed",
        occurredAt: input.now,
      });
      transaction.set(reference, persistenceRecord(resumed));
      transaction.create(this.db.collection(EVENTS).doc(event.id), persistenceRecord(event));
      return resumed;
    });
  }
}
