import type { Firestore } from "firebase-admin/firestore";

import type { PlatformAdministrativeAuditRepository } from "../../domain/admin-authorization/admin-audit-repository.ts";
import type {
  PlatformAdministrativeAuditEvent,
  PlatformAdminAuditEventId,
  PlatformAdminAuditTimestamp,
  PlatformAdminAuditAction,
  PlatformAdminAuditApprovalReference,
} from "../../domain/admin-authorization/admin-audit.ts";
import {
  adminRolePresetKey,
  platformAdministratorId,
  requireCataloguedAdminPermission,
  type PlatformAdministratorId,
} from "../../domain/admin-authorization/model.ts";

export const PLATFORM_ADMIN_AUDIT_COLLECTION = "platformAdministrativeAuditEvents" as const;
export const PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION = 1 as const;

function iso(value: unknown, field: string): PlatformAdminAuditTimestamp {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be a valid timestamp.`);
  }
  return new Date(value).toISOString() as PlatformAdminAuditTimestamp;
}

function stringArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    throw new Error(`${field} must be an array of strings.`);
  }
  return Object.freeze([...value]);
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function objectState(value: unknown, field: string): Readonly<Record<string, unknown>> | null {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} must be an object.`);
  return Object.freeze({ ...(value as Record<string, unknown>) });
}

function hydrate(id: string, raw: FirebaseFirestore.DocumentData | undefined): PlatformAdministrativeAuditEvent | null {
  if (!raw) return null;
  if (raw.schemaVersion !== PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION) throw new Error(`Platform admin audit event ${id} has unsupported schema version.`);
  if (raw.id !== id) throw new Error("Platform admin audit event identity does not match document path.");
  if (!raw.target || typeof raw.target !== "object") throw new Error("Platform admin audit target is required.");
  if (!raw.securityContext || typeof raw.securityContext !== "object") throw new Error("Platform admin audit security context is required.");
  if (!Array.isArray(raw.approvalReferences)) throw new Error("Platform admin audit approval references are invalid.");
  const outcome = String(raw.outcome ?? "");
  if (outcome !== "allowed" && outcome !== "denied") throw new Error("Platform admin audit outcome is invalid.");
  const sensitivity = String(raw.sensitivity ?? "");
  if (sensitivity !== "ordinary" && sensitivity !== "sensitive") throw new Error("Platform admin audit sensitivity is invalid.");
  return Object.freeze({
    id: id as PlatformAdminAuditEventId,
    actorAdministratorId: platformAdministratorId(String(raw.actorAdministratorId ?? "")),
    actorRolePresetKeys: Object.freeze(stringArray(raw.actorRolePresetKeys, "Platform admin audit role keys").map(adminRolePresetKey)),
    permissionsExercised: Object.freeze(stringArray(raw.permissionsExercised, "Platform admin audit permissions").map(requireCataloguedAdminPermission)),
    target: Object.freeze({
      organizationId: nullableString(raw.target.organizationId),
      userId: nullableString(raw.target.userId),
      objectType: String(raw.target.objectType ?? ""),
      objectId: String(raw.target.objectId ?? ""),
    }),
    action: String(raw.action ?? "") as PlatformAdminAuditAction,
    outcome,
    sensitivity,
    priorState: objectState(raw.priorState, "Platform admin audit priorState"),
    newState: objectState(raw.newState, "Platform admin audit newState"),
    reason: String(raw.reason ?? ""),
    relatedCaseId: nullableString(raw.relatedCaseId),
    occurredAt: iso(raw.occurredAt, "Platform admin audit occurredAt"),
    securityContext: Object.freeze({
      authenticationSubject: nullableString(raw.securityContext.authenticationSubject),
      sessionId: nullableString(raw.securityContext.sessionId),
      deviceId: nullableString(raw.securityContext.deviceId),
      provider: nullableString(raw.securityContext.provider),
      mfaVerifiedAt: raw.securityContext.mfaVerifiedAt ? iso(raw.securityContext.mfaVerifiedAt, "Platform admin audit mfaVerifiedAt") : null,
      reauthenticatedAt: raw.securityContext.reauthenticatedAt ? iso(raw.securityContext.reauthenticatedAt, "Platform admin audit reauthenticatedAt") : null,
      networkContextHash: nullableString(raw.securityContext.networkContextHash),
    }),
    justification: nullableString(raw.justification),
    evidenceReferences: stringArray(raw.evidenceReferences, "Platform admin audit evidence references"),
    approvalReferences: Object.freeze(raw.approvalReferences.map((value: unknown) => {
      if (!value || typeof value !== "object") throw new Error("Platform admin audit approval reference is invalid.");
      const approval = value as Record<string, unknown>;
      return Object.freeze({
        approvalId: String(approval.approvalId ?? ""),
        approverAdministratorId: platformAdministratorId(String(approval.approverAdministratorId ?? "")),
      }) as PlatformAdminAuditApprovalReference;
    })),
  });
}

function persisted(event: PlatformAdministrativeAuditEvent) {
  return { schemaVersion: PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION, ...event };
}

export class FirestorePlatformAdministrativeAuditRepository implements PlatformAdministrativeAuditRepository {
  private readonly db: Firestore;
  constructor(db: Firestore) { this.db = db; }

  async append(event: PlatformAdministrativeAuditEvent): Promise<void> {
    const ref = this.db.collection(PLATFORM_ADMIN_AUDIT_COLLECTION).doc(event.id);
    await this.db.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      if (existing.exists) throw new Error(`Platform admin audit event already exists: ${event.id}.`);
      transaction.create(ref, persisted(event));
    });
  }

  async getById(id: PlatformAdminAuditEventId): Promise<PlatformAdministrativeAuditEvent | null> {
    const doc = await this.db.collection(PLATFORM_ADMIN_AUDIT_COLLECTION).doc(id).get();
    return hydrate(doc.id, doc.data());
  }

  async listByAdministratorId(administratorId: PlatformAdministratorId): Promise<readonly PlatformAdministrativeAuditEvent[]> {
    const snapshot = await this.db.collection(PLATFORM_ADMIN_AUDIT_COLLECTION).where("actorAdministratorId", "==", administratorId).get();
    return Object.freeze(snapshot.docs.map((doc) => hydrate(doc.id, doc.data())!));
  }

  async listByTarget(objectType: string, objectId: string): Promise<readonly PlatformAdministrativeAuditEvent[]> {
    const snapshot = await this.db.collection(PLATFORM_ADMIN_AUDIT_COLLECTION).where("target.objectType", "==", objectType).where("target.objectId", "==", objectId).get();
    return Object.freeze(snapshot.docs.map((doc) => hydrate(doc.id, doc.data())!));
  }
}
