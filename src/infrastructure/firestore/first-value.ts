import { Timestamp, type Firestore } from "firebase-admin/firestore";

import type { FirstValueSelection } from "../../domain/first-value/model.ts";
import type { FirstValueSelectionRepository } from "../../domain/first-value/repository.ts";
import type { AccessLifecycleRecord } from "../../domain/lifecycle/model.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";

const SELECTIONS = "firstValueSelections";
const EVENTS = "activationReleaseEvents";
const LIFECYCLES = "accessJourneys";

function iso(value: unknown): string {
  if (typeof value === "string") return new Date(value).toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  throw new Error("First-value persistence is missing a valid timestamp.");
}

function hydrateSelection(data: FirebaseFirestore.DocumentData | undefined): FirstValueSelection {
  if (!data || data.schemaVersion !== FIRESTORE_SCHEMA_VERSION || data.catalogVersion !== 1) {
    throw new Error("First-value selection failed schema validation.");
  }
  return Object.freeze({
    ...data,
    presentedIntents: Object.freeze([...data.presentedIntents]),
    presentedAt: iso(data.presentedAt),
    selectedAt: iso(data.selectedAt),
    updatedAt: iso(data.updatedAt),
  }) as FirstValueSelection;
}

function hydrateLifecycle(data: FirebaseFirestore.DocumentData | undefined): AccessLifecycleRecord {
  if (!data || data.schemaVersion !== FIRESTORE_SCHEMA_VERSION) {
    throw new Error("Access lifecycle failed schema validation during OPEN release.");
  }
  return Object.freeze({ ...data, createdAt: iso(data.createdAt), updatedAt: iso(data.updatedAt) }) as AccessLifecycleRecord;
}

function persisted(value: object) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION });
}

export class FirestoreFirstValueSelectionRepository implements FirstValueSelectionRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getByAccessJourneyId(accessJourneyId: string): Promise<FirstValueSelection | null> {
    const snapshot = await this.db.collection(SELECTIONS).doc(accessJourneyId).get();
    return snapshot.exists ? hydrateSelection(snapshot.data()) : null;
  }

  async saveSelection(input: Parameters<FirstValueSelectionRepository["saveSelection"]>[0]): Promise<void> {
    await this.db.runTransaction(async (transaction) => {
      const selectionRef = this.db.collection(SELECTIONS).doc(input.selection.id);
      const eventRef = this.db.collection(EVENTS).doc(input.event.id);
      const [current, event] = await Promise.all([
        transaction.get(selectionRef),
        transaction.get(eventRef),
      ]);
      if (event.exists) throw new Error("Activation release event identity already exists.");
      if (input.expectedUpdatedAt === null) {
        if (current.exists) throw new Error("First-value selection already exists; reload before continuing.");
      } else if (!current.exists || hydrateSelection(current.data()).updatedAt !== input.expectedUpdatedAt) {
        throw new Error("First-value selection changed; reload before continuing.");
      }
      if (
        input.event.accessJourneyId !== input.selection.accessJourneyId ||
        input.event.userId !== input.selection.userId ||
        input.event.organizationId !== input.selection.organizationId
      ) throw new Error("First-value event scope does not match the selection.");
      transaction.set(selectionRef, persisted(input.selection));
      transaction.create(eventRef, persisted(input.event));
    });
  }

  async releaseOpen(input: Parameters<FirstValueSelectionRepository["releaseOpen"]>[0]): Promise<"released" | "already-open"> {
    return this.db.runTransaction(async (transaction) => {
      const lifecycleRef = this.db.collection(LIFECYCLES).doc(String(input.lifecycle.id));
      const selectionRef = this.db.collection(SELECTIONS).doc(input.selection.id);
      const eventRef = this.db.collection(EVENTS).doc(input.event.id);
      const [lifecycleSnapshot, selectionSnapshot, eventSnapshot] = await Promise.all([
        transaction.get(lifecycleRef),
        transaction.get(selectionRef),
        transaction.get(eventRef),
      ]);
      if (!lifecycleSnapshot.exists || !selectionSnapshot.exists) {
        throw new Error("OPEN release state is incomplete.");
      }
      const currentLifecycle = hydrateLifecycle(lifecycleSnapshot.data());
      const currentSelection = hydrateSelection(selectionSnapshot.data());
      if (
        currentLifecycle.id !== input.lifecycle.id ||
        currentLifecycle.userId !== input.selection.userId ||
        currentSelection.updatedAt !== input.selection.updatedAt ||
        currentSelection.accessJourneyId !== currentLifecycle.id
      ) throw new Error("OPEN release scope or first-value state changed before commit.");
      if (currentLifecycle.state === "open-platform" && eventSnapshot.exists) return "already-open" as const;
      if (currentLifecycle.state !== "controlled-platform" || eventSnapshot.exists) {
        throw new Error("OPEN release requires one controlled-platform transition and unused evidence identity.");
      }
      if (input.lifecycle.state !== "open-platform") throw new Error("OPEN release lifecycle must target open-platform.");
      transaction.set(lifecycleRef, persisted(input.lifecycle));
      transaction.create(eventRef, persisted(input.event));
      return "released" as const;
    });
  }
}
