import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  RfxAggregate,
  RfxCommandReceipt,
  RfxId,
} from "../../domain/rfx/model.ts";
import {
  RfxPersistenceConflictError,
  type RfxPersistenceBundle,
  type RfxRepository,
} from "../../domain/rfx/repository.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";
import { getFirestoreRecordById, listFirestoreRecords } from "./support.ts";

const AGGREGATES = "rfxAggregates";
const EVENTS = "rfxEvents";
const COMMANDS = "rfxCommands";
const AUDITS = "organizationAuditEvents";

function immutable(value: object) {
  return Object.freeze({
    ...value,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    persistedAt: FieldValue.serverTimestamp(),
  });
}

function mutable(value: object) {
  return Object.freeze({
    ...value,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    persistedAt: FieldValue.serverTimestamp(),
    persistenceUpdatedAt: FieldValue.serverTimestamp(),
  });
}

function exactReplay(
  prior: RfxCommandReceipt,
  command: RfxCommandReceipt,
): boolean {
  return (
    prior.issuerOrganizationId === command.issuerOrganizationId &&
    prior.rfxId === command.rfxId &&
    prior.action === command.action &&
    prior.requestFingerprint === command.requestFingerprint &&
    prior.resultingVersion === command.resultingVersion
  );
}

function currentAggregate(record: RfxAggregate): RfxAggregate {
  return record.package === undefined
    ? Object.freeze({ ...record, package: null })
    : record;
}

export class FirestoreRfxRepository implements RfxRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  getById(id: RfxId) {
    return getFirestoreRecordById<RfxAggregate>(
      this.db,
      "rfxAggregates",
      id,
    ).then((record) => (record ? currentAggregate(record) : null));
  }

  listByIssuerOrganizationId(organizationId: OrganizationId) {
    return listFirestoreRecords<RfxAggregate>(
      this.db
        .collection(AGGREGATES)
        .where("issuerOrganizationId", "==", organizationId),
      "rfxAggregates",
    ).then((records) =>
      Object.freeze(
        [...records]
          .map(currentAggregate)
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
      ),
    );
  }

  getCommand(id: string) {
    return getFirestoreRecordById<RfxCommandReceipt>(
      this.db,
      "rfxCommands",
      id,
    );
  }

  async save(bundle: RfxPersistenceBundle): Promise<"created" | "replayed"> {
    const aggregateRef = this.db
      .collection(AGGREGATES)
      .doc(bundle.aggregate.id);
    const eventRef = this.db.collection(EVENTS).doc(bundle.event.id);
    const commandRef = this.db.collection(COMMANDS).doc(bundle.command.id);
    const auditRef = this.db.collection(AUDITS).doc(bundle.audit.id);

    return this.db.runTransaction(async (transaction) => {
      const [commandSnapshot, aggregateSnapshot, eventSnapshot, auditSnapshot] =
        await transaction.getAll(commandRef, aggregateRef, eventRef, auditRef);

      if (commandSnapshot.exists) {
        const prior = commandSnapshot.data() as RfxCommandReceipt;
        if (exactReplay(prior, bundle.command)) return "replayed" as const;
        throw new RfxPersistenceConflictError(
          "RFx command identity collision.",
        );
      }
      if (eventSnapshot.exists || auditSnapshot.exists) {
        throw new RfxPersistenceConflictError(
          "RFx evidence identity collision.",
        );
      }

      if (bundle.expectedVersion === null) {
        if (
          aggregateSnapshot.exists ||
          bundle.aggregate.version !== 1 ||
          bundle.event.kind !== "rfx-draft-created"
        ) {
          throw new RfxPersistenceConflictError(
            "RFx draft identity already exists.",
          );
        }
        transaction.create(aggregateRef, mutable(bundle.aggregate));
      } else {
        if (!aggregateSnapshot.exists) {
          throw new RfxPersistenceConflictError(
            "RFx draft is unavailable for this change.",
          );
        }
        const current = aggregateSnapshot.data() as RfxAggregate;
        if (
          current.issuerOrganizationId !==
            bundle.aggregate.issuerOrganizationId ||
          current.version !== bundle.expectedVersion ||
          bundle.aggregate.version !== bundle.expectedVersion + 1
        ) {
          throw new RfxPersistenceConflictError(
            `RFx changed; current version is ${current.version}.`,
          );
        }
        transaction.set(aggregateRef, mutable(bundle.aggregate));
      }

      transaction.create(eventRef, immutable(bundle.event));
      transaction.create(commandRef, immutable(bundle.command));
      transaction.create(auditRef, immutable(bundle.audit));
      return "created" as const;
    });
  }
}
