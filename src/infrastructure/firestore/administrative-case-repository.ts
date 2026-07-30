import type { Firestore } from "firebase-admin/firestore";

import type {
  AdministrativeCase,
  AdministrativeCaseEvent,
  AdministrativeCaseEventId,
  AdministrativeCaseId,
} from "../../domain/admin-cases/model.ts";
import type {
  AdministrativeCaseEventRepository,
  AdministrativeCaseLifecycleUnitOfWork,
  AdministrativeCaseRepository,
} from "../../domain/admin-cases/repository.ts";

export const ADMINISTRATIVE_CASE_COLLECTION = "administrativeCases" as const;
export const ADMINISTRATIVE_CASE_EVENT_COLLECTION = "administrativeCaseEvents" as const;
export const ADMINISTRATIVE_CASE_SCHEMA_VERSION = 1 as const;

function casePayload(caseRecord: AdministrativeCase): object {
  return { schemaVersion: ADMINISTRATIVE_CASE_SCHEMA_VERSION, ...caseRecord };
}
function eventPayload(event: AdministrativeCaseEvent): object {
  return { schemaVersion: ADMINISTRATIVE_CASE_SCHEMA_VERSION, ...event };
}
function hydrateCase(id: string, raw: FirebaseFirestore.DocumentData | undefined): AdministrativeCase | null {
  if (!raw) return null;
  if (raw.schemaVersion !== ADMINISTRATIVE_CASE_SCHEMA_VERSION || raw.id !== id) {
    throw new Error(`Administrative case ${id} has invalid persisted identity/schema.`);
  }
  const { schemaVersion: _schemaVersion, ...record } = raw;
  return Object.freeze(record) as AdministrativeCase;
}
function hydrateEvent(id: string, raw: FirebaseFirestore.DocumentData | undefined): AdministrativeCaseEvent | null {
  if (!raw) return null;
  if (raw.schemaVersion !== ADMINISTRATIVE_CASE_SCHEMA_VERSION || raw.id !== id) {
    throw new Error(`Administrative case event ${id} has invalid persisted identity/schema.`);
  }
  const { schemaVersion: _schemaVersion, ...record } = raw;
  return Object.freeze(record) as AdministrativeCaseEvent;
}

export class FirestoreAdministrativeCaseRepository implements AdministrativeCaseRepository {
  private readonly db: Firestore;
  constructor(db: Firestore) { this.db = db; }

  async getById(id: AdministrativeCaseId): Promise<AdministrativeCase | null> {
    const snapshot = await this.db.collection(ADMINISTRATIVE_CASE_COLLECTION).doc(id).get();
    return hydrateCase(snapshot.id, snapshot.data());
  }

  async listOpen(): Promise<readonly AdministrativeCase[]> {
    const snapshot = await this.db.collection(ADMINISTRATIVE_CASE_COLLECTION).get();
    return Object.freeze(
      snapshot.docs
        .map((document) => hydrateCase(document.id, document.data()))
        .filter((record): record is AdministrativeCase => record !== null)
        .filter((record) => record.status !== "closed"),
    );
  }

  async create(caseRecord: AdministrativeCase): Promise<void> {
    await this.db.collection(ADMINISTRATIVE_CASE_COLLECTION).doc(caseRecord.id).create(casePayload(caseRecord));
  }

  async save(caseRecord: AdministrativeCase): Promise<void> {
    await this.db.collection(ADMINISTRATIVE_CASE_COLLECTION).doc(caseRecord.id).set(casePayload(caseRecord));
  }
}

export class FirestoreAdministrativeCaseEventRepository implements AdministrativeCaseEventRepository {
  private readonly db: Firestore;
  constructor(db: Firestore) { this.db = db; }

  async getById(id: AdministrativeCaseEventId): Promise<AdministrativeCaseEvent | null> {
    const snapshot = await this.db.collection(ADMINISTRATIVE_CASE_EVENT_COLLECTION).doc(id).get();
    return hydrateEvent(snapshot.id, snapshot.data());
  }

  async listByCaseId(caseId: AdministrativeCaseId): Promise<readonly AdministrativeCaseEvent[]> {
    const snapshot = await this.db
      .collection(ADMINISTRATIVE_CASE_EVENT_COLLECTION)
      .where("caseId", "==", caseId)
      .get();
    return Object.freeze(
      snapshot.docs
        .map((document) => hydrateEvent(document.id, document.data()))
        .filter((record): record is AdministrativeCaseEvent => record !== null)
        .sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt)),
    );
  }

  async append(event: AdministrativeCaseEvent): Promise<void> {
    await this.db.collection(ADMINISTRATIVE_CASE_EVENT_COLLECTION).doc(event.id).create(eventPayload(event));
  }
}

export class FirestoreAdministrativeCaseLifecycleUnitOfWork
  implements AdministrativeCaseLifecycleUnitOfWork
{
  private readonly db: Firestore;
  constructor(db: Firestore) { this.db = db; }

  async commitTransition(input: Readonly<{
    caseRecord: AdministrativeCase;
    event: AdministrativeCaseEvent;
  }>): Promise<void> {
    await this.db.runTransaction(async (transaction) => {
      const caseRef = this.db.collection(ADMINISTRATIVE_CASE_COLLECTION).doc(input.caseRecord.id);
      const eventRef = this.db.collection(ADMINISTRATIVE_CASE_EVENT_COLLECTION).doc(input.event.id);
      const [storedCase, storedEvent] = await Promise.all([
        transaction.get(caseRef),
        transaction.get(eventRef),
      ]);
      if (!storedCase.exists) throw new Error("Administrative case no longer exists.");
      if (storedEvent.exists) throw new Error(`Administrative case event already exists: ${input.event.id}.`);
      const raw = storedCase.data();
      if (raw?.status !== input.event.fromStatus) {
        throw new Error("Administrative case status changed before lifecycle transition commit.");
      }
      if (input.event.caseId !== input.caseRecord.id || input.event.toStatus !== input.caseRecord.status) {
        throw new Error("Administrative case transition event does not match the new case state.");
      }
      transaction.set(caseRef, casePayload(input.caseRecord));
      transaction.create(eventRef, eventPayload(input.event));
    });
  }
}
