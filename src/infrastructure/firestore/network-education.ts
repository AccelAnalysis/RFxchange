import { FieldValue, type DocumentData, type Firestore } from "firebase-admin/firestore";

import type { NetworkEducationCommandReceipt, NetworkEducationProgress } from "../../domain/network-education/model.ts";
import {
  NetworkEducationPersistenceConflictError,
  type NetworkEducationRepository,
} from "../../domain/network-education/repository.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";

const PROGRESS = "networkEducationProgress";
const EVENTS = "networkEducationEvents";
const COMMANDS = "networkEducationCommands";

function persisted(value: object, originalCreatedAt?: unknown): DocumentData {
  return {
    ...value,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    persistenceCreatedAt: originalCreatedAt ?? FieldValue.serverTimestamp(),
    persistenceUpdatedAt: FieldValue.serverTimestamp(),
  };
}

function immutable(value: object): DocumentData {
  return { ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION, persistedAt: FieldValue.serverTimestamp() };
}

function domain<T>(snapshot: FirebaseFirestore.DocumentSnapshot): T | null {
  if (!snapshot.exists) return null;
  const data = { ...snapshot.data() } as Record<string, unknown>;
  delete data.schemaVersion;
  delete data.persistenceCreatedAt;
  delete data.persistenceUpdatedAt;
  delete data.persistedAt;
  return Object.freeze(data) as T;
}

export class FirestoreNetworkEducationRepository implements NetworkEducationRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getProgress(id: string) {
    return domain<NetworkEducationProgress>(await this.db.collection(PROGRESS).doc(id).get());
  }

  async getCommand(id: string) {
    return domain<NetworkEducationCommandReceipt>(await this.db.collection(COMMANDS).doc(id).get());
  }

  async save(input: Parameters<NetworkEducationRepository["save"]>[0]): Promise<void> {
    const progress = this.db.collection(PROGRESS).doc(input.progress.id);
    const event = this.db.collection(EVENTS).doc(input.event.id);
    const command = this.db.collection(COMMANDS).doc(input.command.id);
    await this.db.runTransaction(async (transaction) => {
      const [current, existingEvent, existingCommand] = await transaction.getAll(progress, event, command);
      const currentVersion = current.exists ? Number(current.data()?.version) : null;
      if (currentVersion !== input.expectedVersion) {
        throw new NetworkEducationPersistenceConflictError(
          `Education progress changed; current version is ${String(currentVersion)}.`,
        );
      }
      if (existingEvent.exists || existingCommand.exists) {
        throw new NetworkEducationPersistenceConflictError("Education evidence identity collision.");
      }
      transaction.set(progress, persisted(input.progress, current.data()?.persistenceCreatedAt));
      transaction.create(event, immutable(input.event));
      transaction.create(command, immutable(input.command));
    });
  }
}
