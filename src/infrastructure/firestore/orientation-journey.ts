import { Timestamp, type Firestore } from "firebase-admin/firestore";

import type { OrientationJourney, OrientationJourneyEvent } from "../../domain/orientation/model.ts";
import type { OrientationJourneyRepository } from "../../domain/orientation/repository.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";

const JOURNEYS = "orientationJourneys";
const EVENTS = "orientationJourneyEvents";

function iso(value: unknown): string {
  if (typeof value === "string") return new Date(value).toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  throw new Error("Orientation persistence is missing a valid timestamp.");
}

function hydrate(data: FirebaseFirestore.DocumentData | undefined): OrientationJourney {
  if (!data || data.schemaVersion !== FIRESTORE_SCHEMA_VERSION || data.version !== 1) {
    throw new Error("Orientation journey failed schema validation.");
  }
  return Object.freeze({
    ...data,
    startedAt: iso(data.startedAt),
    updatedAt: iso(data.updatedAt),
    completedAt: data.completedAt ? iso(data.completedAt) : null,
  }) as OrientationJourney;
}

function persisted(value: OrientationJourney | OrientationJourneyEvent) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION });
}

export class FirestoreOrientationJourneyRepository implements OrientationJourneyRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getById(id: string): Promise<OrientationJourney | null> {
    const snapshot = await this.db.collection(JOURNEYS).doc(id).get();
    return snapshot.exists ? hydrate(snapshot.data()) : null;
  }

  async saveTransition(input: Readonly<{
    expectedRevision: number | null;
    journey: OrientationJourney;
    event: OrientationJourneyEvent;
  }>): Promise<void> {
    if (
      input.event.orientationJourneyId !== input.journey.id ||
      input.event.revision !== input.journey.revision
    ) {
      throw new Error("Orientation event does not match its journey transition.");
    }
    await this.db.runTransaction(async (transaction) => {
      const journeyRef = this.db.collection(JOURNEYS).doc(input.journey.id);
      const eventRef = this.db.collection(EVENTS).doc(input.event.id);
      const current = await transaction.get(journeyRef);
      if (input.expectedRevision === null) {
        if (current.exists) throw new Error("Orientation journey already exists.");
        transaction.create(journeyRef, persisted(input.journey));
      } else {
        if (!current.exists || hydrate(current.data()).revision !== input.expectedRevision) {
          throw new Error("Orientation journey changed; reload before continuing.");
        }
        transaction.set(journeyRef, persisted(input.journey));
      }
      transaction.create(eventRef, persisted(input.event));
    });
  }
}
