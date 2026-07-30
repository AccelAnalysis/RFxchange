import type { Firestore } from "firebase-admin/firestore";

import {
  PLATFORM_ADMIN_AUDIT_COLLECTION,
  PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION,
} from "./platform-admin-audit-repository.ts";
import {
  createFeatureFlagState,
  type FeatureFlagChangeRecord,
  type FeatureFlagChangeUnitOfWork,
  type FeatureFlagRepository,
  type FeatureFlagState,
  type FeatureFlagStateId,
} from "../../domain/admin-system/feature-flags.ts";

export const FEATURE_FLAG_STATE_COLLECTION = "featureFlagStates" as const;
export const FEATURE_FLAG_CHANGE_COLLECTION = "featureFlagChanges" as const;
const FEATURE_FLAG_SCHEMA_VERSION = 1 as const;

function persistedState(state: FeatureFlagState) {
  return Object.freeze({ schemaVersion: FEATURE_FLAG_SCHEMA_VERSION, ...state });
}

function persistedChange(record: FeatureFlagChangeRecord) {
  return Object.freeze({ schemaVersion: FEATURE_FLAG_SCHEMA_VERSION, ...record });
}

function hydrate(id: string, raw: FirebaseFirestore.DocumentData | undefined): FeatureFlagState | null {
  if (!raw) return null;
  if (raw.schemaVersion !== FEATURE_FLAG_SCHEMA_VERSION) throw new Error(`Feature flag ${id} has an unsupported schema version.`);
  const state = createFeatureFlagState({
    flag: String(raw.flag ?? ""),
    environment: String(raw.environment ?? ""),
    scopeKind: String(raw.scope?.kind ?? ""),
    scopeId: raw.scope?.id === null || raw.scope?.id === undefined ? null : String(raw.scope.id),
    enabled: Boolean(raw.enabled),
    revision: Number(raw.revision),
    updatedAt: String(raw.updatedAt ?? ""),
    updatedByAdministratorId: String(raw.updatedByAdministratorId ?? "") as FeatureFlagState["updatedByAdministratorId"],
  });
  if (state.id !== id) throw new Error(`Feature flag ${id} does not match its document identity.`);
  return state;
}

export class FirestoreFeatureFlagRepository implements FeatureFlagRepository, FeatureFlagChangeUnitOfWork {
  constructor(private readonly db: Firestore) {}

  async getById(id: FeatureFlagStateId): Promise<FeatureFlagState | null> {
    const snapshot = await this.db.collection(FEATURE_FLAG_STATE_COLLECTION).doc(id).get();
    return hydrate(snapshot.id, snapshot.data());
  }

  async listAll(): Promise<readonly FeatureFlagState[]> {
    const snapshot = await this.db.collection(FEATURE_FLAG_STATE_COLLECTION).get();
    return Object.freeze(
      snapshot.docs
        .map((document) => hydrate(document.id, document.data()))
        .filter((value): value is FeatureFlagState => value !== null)
        .sort((left, right) => left.id.localeCompare(right.id)),
    );
  }

  async commitChange(input: Parameters<FeatureFlagChangeUnitOfWork["commitChange"]>[0]): Promise<void> {
    const stateRef = this.db.collection(FEATURE_FLAG_STATE_COLLECTION).doc(input.state.id);
    const changeRef = this.db.collection(FEATURE_FLAG_CHANGE_COLLECTION).doc(input.changeRecord.id);
    const auditRef = this.db.collection(PLATFORM_ADMIN_AUDIT_COLLECTION).doc(input.auditEvent.id);
    await this.db.runTransaction(async (transaction) => {
      const [stateSnapshot, changeSnapshot, auditSnapshot] = await Promise.all([
        transaction.get(stateRef),
        transaction.get(changeRef),
        transaction.get(auditRef),
      ]);
      if (changeSnapshot.exists) throw new Error(`Feature flag change already exists: ${input.changeRecord.id}.`);
      if (auditSnapshot.exists) throw new Error(`Platform admin audit event already exists: ${input.auditEvent.id}.`);
      const current = hydrate(stateSnapshot.id, stateSnapshot.data());
      const currentRevision = current?.revision ?? 0;
      if (currentRevision !== input.expectedRevision) {
        throw new Error(`Feature flag ${input.state.id} changed before commit: expected ${input.expectedRevision}, current ${currentRevision}.`);
      }
      if (input.state.revision !== currentRevision + 1 || input.changeRecord.revision !== input.state.revision) {
        throw new Error("Feature flag state and immutable change record revisions are inconsistent.");
      }
      transaction.set(stateRef, persistedState(input.state));
      transaction.create(changeRef, persistedChange(input.changeRecord));
      transaction.create(auditRef, { schemaVersion: PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION, ...input.auditEvent });
    });
  }
}
