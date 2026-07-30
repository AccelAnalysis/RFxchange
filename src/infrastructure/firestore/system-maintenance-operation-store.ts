import type { Firestore } from "firebase-admin/firestore";

import {
  PLATFORM_ADMIN_AUDIT_COLLECTION,
  PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION,
} from "./platform-admin-audit-repository.ts";
import {
  completeSystemMaintenanceOperation,
  createSystemMaintenanceOperation,
  type SystemMaintenanceOperation,
  type SystemMaintenanceOperationStore,
} from "../../domain/admin-system/maintenance-operations.ts";

export const SYSTEM_MAINTENANCE_OPERATION_COLLECTION = "systemMaintenanceOperations" as const;
const SYSTEM_MAINTENANCE_SCHEMA_VERSION = 1 as const;

function persisted(operation: SystemMaintenanceOperation) {
  return Object.freeze({ schemaVersion: SYSTEM_MAINTENANCE_SCHEMA_VERSION, ...operation });
}

function hydrate(id: string, raw: FirebaseFirestore.DocumentData | undefined): SystemMaintenanceOperation | null {
  if (!raw) return null;
  if (raw.schemaVersion !== SYSTEM_MAINTENANCE_SCHEMA_VERSION) {
    throw new Error(`System maintenance operation ${id} has an unsupported schema version.`);
  }
  if (raw.id !== id) throw new Error(`System maintenance operation ${id} does not match its document identity.`);
  const base = createSystemMaintenanceOperation({
    id,
    action: String(raw.action ?? ""),
    target: String(raw.target ?? ""),
    environment: String(raw.environment ?? ""),
    reason: String(raw.reason ?? ""),
    idempotencyKey: String(raw.idempotencyKey ?? ""),
    parameters: raw.parameters ?? {},
    requestedAt: String(raw.requestedAt ?? ""),
    requestedByAdministratorId: String(raw.requestedByAdministratorId ?? "") as SystemMaintenanceOperation["requestedByAdministratorId"],
  });
  if (raw.status === "running") return base;
  if (raw.status !== "succeeded" && raw.status !== "failed") {
    throw new Error(`System maintenance operation ${id} has invalid status.`);
  }
  return completeSystemMaintenanceOperation(base, String(raw.completedAt ?? ""), {
    status: raw.status,
    summary: String(raw.resultSummary ?? ""),
    diagnosticReference: raw.diagnosticReference === null || raw.diagnosticReference === undefined
      ? null
      : String(raw.diagnosticReference),
  });
}

export class FirestoreSystemMaintenanceOperationStore implements SystemMaintenanceOperationStore {
  constructor(private readonly db: Firestore) {}

  async createRequested(input: Parameters<SystemMaintenanceOperationStore["createRequested"]>[0]): Promise<void> {
    const operationRef = this.db.collection(SYSTEM_MAINTENANCE_OPERATION_COLLECTION).doc(input.operation.id);
    const auditRef = this.db.collection(PLATFORM_ADMIN_AUDIT_COLLECTION).doc(input.auditEvent.id);
    await this.db.runTransaction(async (transaction) => {
      const [operationSnapshot, auditSnapshot] = await Promise.all([
        transaction.get(operationRef),
        transaction.get(auditRef),
      ]);
      if (operationSnapshot.exists) throw new Error(`System maintenance operation already exists: ${input.operation.id}.`);
      if (auditSnapshot.exists) throw new Error(`Platform admin audit event already exists: ${input.auditEvent.id}.`);
      transaction.create(operationRef, persisted(input.operation));
      transaction.create(auditRef, { schemaVersion: PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION, ...input.auditEvent });
    });
  }

  async complete(input: Parameters<SystemMaintenanceOperationStore["complete"]>[0]): Promise<SystemMaintenanceOperation> {
    const operationRef = this.db.collection(SYSTEM_MAINTENANCE_OPERATION_COLLECTION).doc(input.operationId);
    return this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(operationRef);
      const current = hydrate(snapshot.id, snapshot.data());
      if (!current) throw new Error(`System maintenance operation not found: ${input.operationId}.`);
      const completed = completeSystemMaintenanceOperation(current, input.completedAt, input.result);
      transaction.set(operationRef, persisted(completed));
      return completed;
    });
  }

  async getById(operationId: string): Promise<SystemMaintenanceOperation | null> {
    const snapshot = await this.db.collection(SYSTEM_MAINTENANCE_OPERATION_COLLECTION).doc(operationId).get();
    return hydrate(snapshot.id, snapshot.data());
  }
}
