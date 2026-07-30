import type { Firestore } from "firebase-admin/firestore";

import {
  PLATFORM_ADMIN_AUDIT_COLLECTION,
  PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION,
} from "./platform-admin-audit-repository.ts";
import {
  createGovernedConfigurationChangeRecord,
  type GovernedConfigurationChangeRecord,
} from "../../domain/admin-configuration/history.ts";
import {
  createGovernedConfigurationState,
  governedConfigurationKey,
  type GovernedConfigurationKey,
  type GovernedConfigurationState,
} from "../../domain/admin-configuration/model.ts";
import type {
  GovernedConfigurationChangeCommit,
  GovernedConfigurationChangeUnitOfWork,
  GovernedConfigurationHistoryRepository,
  GovernedConfigurationRepository,
} from "../../domain/admin-configuration/repository.ts";

export const GOVERNED_CONFIGURATION_COLLECTION = "governedConfigurationValues" as const;
export const GOVERNED_CONFIGURATION_HISTORY_COLLECTION = "governedConfigurationChanges" as const;
export const GOVERNED_CONFIGURATION_SCHEMA_VERSION = 1 as const;
export const GOVERNED_CONFIGURATION_HISTORY_SCHEMA_VERSION = 1 as const;

interface PersistedGovernedConfigurationState {
  readonly schemaVersion: typeof GOVERNED_CONFIGURATION_SCHEMA_VERSION;
  readonly key: string;
  readonly value: unknown;
  readonly revision: number;
  readonly policyVersion: string;
  readonly effectiveAt: string;
  readonly updatedAt: string;
  readonly updatedByAdministratorId: string;
}

function persisted(state: GovernedConfigurationState): PersistedGovernedConfigurationState {
  return Object.freeze({
    schemaVersion: GOVERNED_CONFIGURATION_SCHEMA_VERSION,
    key: state.key,
    value: state.value,
    revision: state.revision,
    policyVersion: state.policyVersion,
    effectiveAt: state.effectiveAt,
    updatedAt: state.updatedAt,
    updatedByAdministratorId: state.updatedByAdministratorId,
  });
}

function hydrate(
  id: string,
  raw: FirebaseFirestore.DocumentData | undefined,
): GovernedConfigurationState | null {
  if (!raw) return null;
  if (raw.schemaVersion !== GOVERNED_CONFIGURATION_SCHEMA_VERSION) {
    throw new Error(`Governed configuration ${id} has an unsupported schema version.`);
  }
  if (raw.key !== id) {
    throw new Error(`Governed configuration ${id} does not match its document identity.`);
  }
  return createGovernedConfigurationState({
    key: id,
    value: raw.value,
    revision: Number(raw.revision),
    policyVersion: String(raw.policyVersion ?? ""),
    effectiveAt: String(raw.effectiveAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
    updatedByAdministratorId: String(raw.updatedByAdministratorId ?? "") as GovernedConfigurationState["updatedByAdministratorId"],
  });
}

function persistedHistory(record: GovernedConfigurationChangeRecord) {
  return Object.freeze({
    schemaVersion: GOVERNED_CONFIGURATION_HISTORY_SCHEMA_VERSION,
    id: record.id,
    key: record.key,
    revision: record.revision,
    previousValue: record.previousValue,
    newValue: record.newValue,
    effectiveAt: record.effectiveAt,
    recordedAt: record.recordedAt,
    actorAdministratorId: record.actorAdministratorId,
    reason: record.reason,
    policyVersion: record.policyVersion,
    auditEventId: record.auditEventId,
  });
}

function hydrateHistory(
  id: string,
  raw: FirebaseFirestore.DocumentData | undefined,
): GovernedConfigurationChangeRecord | null {
  if (!raw) return null;
  if (raw.schemaVersion !== GOVERNED_CONFIGURATION_HISTORY_SCHEMA_VERSION) {
    throw new Error(`Governed configuration history ${id} has an unsupported schema version.`);
  }
  if (raw.id !== id) throw new Error(`Governed configuration history ${id} does not match its document identity.`);
  const key = governedConfigurationKey(String(raw.key ?? ""));
  const state = createGovernedConfigurationState({
    key,
    value: raw.newValue,
    revision: Number(raw.revision),
    policyVersion: String(raw.policyVersion ?? ""),
    effectiveAt: String(raw.effectiveAt ?? ""),
    updatedAt: String(raw.recordedAt ?? ""),
    updatedByAdministratorId: String(raw.actorAdministratorId ?? "") as GovernedConfigurationState["updatedByAdministratorId"],
  });
  return createGovernedConfigurationChangeRecord({
    id,
    key,
    revision: state.revision,
    previousValue: raw.previousValue ?? null,
    newValue: state.value,
    effectiveAt: state.effectiveAt,
    recordedAt: state.updatedAt,
    actorAdministratorId: state.updatedByAdministratorId,
    reason: String(raw.reason ?? ""),
    policyVersion: state.policyVersion,
    auditEventId: String(raw.auditEventId ?? ""),
  });
}

export class FirestoreGovernedConfigurationRepository
  implements GovernedConfigurationRepository, GovernedConfigurationHistoryRepository, GovernedConfigurationChangeUnitOfWork
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getByKey(key: GovernedConfigurationKey): Promise<GovernedConfigurationState | null> {
    const snapshot = await this.db.collection(GOVERNED_CONFIGURATION_COLLECTION).doc(key).get();
    return hydrate(snapshot.id, snapshot.data());
  }

  async listAll(): Promise<readonly GovernedConfigurationState[]> {
    const snapshot = await this.db.collection(GOVERNED_CONFIGURATION_COLLECTION).get();
    return Object.freeze(
      snapshot.docs
        .map((document) => hydrate(document.id, document.data()))
        .filter((value): value is GovernedConfigurationState => value !== null)
        .sort((left, right) => left.key.localeCompare(right.key)),
    );
  }

  async listHistoryByKey(key: GovernedConfigurationKey): Promise<readonly GovernedConfigurationChangeRecord[]> {
    const snapshot = await this.db.collection(GOVERNED_CONFIGURATION_HISTORY_COLLECTION).where("key", "==", key).get();
    return Object.freeze(
      snapshot.docs
        .map((document) => hydrateHistory(document.id, document.data()))
        .filter((value): value is GovernedConfigurationChangeRecord => value !== null)
        .sort((left, right) => left.revision - right.revision),
    );
  }

  async commitChange(input: GovernedConfigurationChangeCommit): Promise<void> {
    const stateRef = this.db.collection(GOVERNED_CONFIGURATION_COLLECTION).doc(input.state.key);
    const historyRef = this.db.collection(GOVERNED_CONFIGURATION_HISTORY_COLLECTION).doc(input.changeRecord.id);
    const auditRef = this.db.collection(PLATFORM_ADMIN_AUDIT_COLLECTION).doc(input.auditEvent.id);
    await this.db.runTransaction(async (transaction) => {
      const stateSnapshot = await transaction.get(stateRef);
      const historySnapshot = await transaction.get(historyRef);
      const auditSnapshot = await transaction.get(auditRef);
      if (historySnapshot.exists) {
        throw new Error(`Governed configuration change record already exists: ${input.changeRecord.id}.`);
      }
      if (auditSnapshot.exists) {
        throw new Error(`Platform admin audit event already exists: ${input.auditEvent.id}.`);
      }
      const current = hydrate(stateSnapshot.id, stateSnapshot.data());
      const currentRevision = current?.revision ?? 0;
      if (currentRevision !== input.expectedRevision) {
        throw new Error(
          `Governed configuration ${input.state.key} changed before commit: expected revision ${input.expectedRevision}, current ${currentRevision}.`,
        );
      }
      if (input.state.revision !== currentRevision + 1 || input.changeRecord.revision !== input.state.revision) {
        throw new Error("Governed configuration next revision/history record is inconsistent with stored state.");
      }
      transaction.set(stateRef, persisted(input.state));
      transaction.create(historyRef, persistedHistory(input.changeRecord));
      transaction.create(auditRef, {
        schemaVersion: PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION,
        ...input.auditEvent,
      });
    });
  }
}
