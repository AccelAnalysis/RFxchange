import type { Firestore } from "firebase-admin/firestore";

import { platformAdministratorId, type PlatformAdministratorId } from "../../domain/admin-authorization/model.ts";
import type { PrivilegedAdministratorSecurityRepository } from "../../domain/admin-authorization/privileged-security-repository.ts";
import type {
  PrivilegedAdministratorDevice,
  PrivilegedAdministratorSession,
  PrivilegedDeviceId,
  PrivilegedSecurityEvent,
  PrivilegedSecurityEventId,
  PrivilegedSecurityTimestamp,
  PrivilegedSessionId,
  ProductionAuthorityEvidence,
  ProductionAuthorityGrantId,
} from "../../domain/admin-authorization/privileged-security.ts";

export const PRIVILEGED_SESSION_COLLECTION = "privilegedAdministratorSessions" as const;
export const PRIVILEGED_DEVICE_COLLECTION = "privilegedAdministratorDevices" as const;
export const PRIVILEGED_SECURITY_EVENT_COLLECTION = "privilegedAdministratorSecurityEvents" as const;
export const PRIVILEGED_SECURITY_SCHEMA_VERSION = 1 as const;

function iso(value: unknown, field: string): PrivilegedSecurityTimestamp {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) throw new Error(`${field} must be a valid timestamp.`);
  return new Date(value).toISOString() as PrivilegedSecurityTimestamp;
}

function nullableIso(value: unknown, field: string): PrivilegedSecurityTimestamp | null {
  return value === null || value === undefined ? null : iso(value, field);
}

function productionAuthority(raw: unknown): ProductionAuthorityEvidence | null {
  if (raw === null || raw === undefined) return null;
  if (!raw || typeof raw !== "object") throw new Error("Privileged production authority is invalid.");
  const value = raw as Record<string, unknown>;
  return Object.freeze({
    grantId: String(value.grantId ?? "") as ProductionAuthorityGrantId,
    administratorId: platformAdministratorId(String(value.administratorId ?? "")),
    grantedByAdministratorId: platformAdministratorId(String(value.grantedByAdministratorId ?? "")),
    grantedAt: iso(value.grantedAt, "Production authority grantedAt"),
    expiresAt: iso(value.expiresAt, "Production authority expiresAt"),
  });
}

function hydrateSession(id: string, raw: FirebaseFirestore.DocumentData | undefined): PrivilegedAdministratorSession | null {
  if (!raw) return null;
  if (raw.schemaVersion !== PRIVILEGED_SECURITY_SCHEMA_VERSION) throw new Error(`Privileged session ${id} has an unsupported schema version.`);
  if (raw.id !== id) throw new Error("Privileged session identity does not match document path.");
  const status = String(raw.status ?? "");
  if (status !== "active" && status !== "revoked") throw new Error("Privileged session status is invalid.");
  return Object.freeze({
    id: id as PrivilegedSessionId,
    administratorId: platformAdministratorId(String(raw.administratorId ?? "")),
    deviceId: String(raw.deviceId ?? "") as PrivilegedDeviceId,
    status,
    createdAt: iso(raw.createdAt, "Privileged session createdAt"),
    authenticatedAt: iso(raw.authenticatedAt, "Privileged session authenticatedAt"),
    lastActivityAt: iso(raw.lastActivityAt, "Privileged session lastActivityAt"),
    mfaVerifiedAt: iso(raw.mfaVerifiedAt, "Privileged session mfaVerifiedAt"),
    revokedAt: nullableIso(raw.revokedAt, "Privileged session revokedAt"),
    productionAuthority: productionAuthority(raw.productionAuthority),
  });
}

function hydrateDevice(id: string, raw: FirebaseFirestore.DocumentData | undefined): PrivilegedAdministratorDevice | null {
  if (!raw) return null;
  if (raw.schemaVersion !== PRIVILEGED_SECURITY_SCHEMA_VERSION) throw new Error(`Privileged device ${id} has an unsupported schema version.`);
  if (raw.id !== id) throw new Error("Privileged device identity does not match document path.");
  const status = String(raw.status ?? "");
  if (status !== "trusted" && status !== "revoked") throw new Error("Privileged device status is invalid.");
  return Object.freeze({
    id: id as PrivilegedDeviceId,
    administratorId: platformAdministratorId(String(raw.administratorId ?? "")),
    label: String(raw.label ?? ""),
    status,
    firstSeenAt: iso(raw.firstSeenAt, "Privileged device firstSeenAt"),
    lastSeenAt: iso(raw.lastSeenAt, "Privileged device lastSeenAt"),
    revokedAt: nullableIso(raw.revokedAt, "Privileged device revokedAt"),
  });
}

function hydrateEvent(id: string, raw: FirebaseFirestore.DocumentData | undefined): PrivilegedSecurityEvent | null {
  if (!raw) return null;
  if (raw.schemaVersion !== PRIVILEGED_SECURITY_SCHEMA_VERSION) throw new Error(`Privileged security event ${id} has an unsupported schema version.`);
  if (raw.id !== id) throw new Error("Privileged security event identity does not match document path.");
  if (!Array.isArray(raw.riskSignals) || !raw.riskSignals.every((value: unknown) => typeof value === "string")) throw new Error("Privileged security riskSignals are invalid.");
  return Object.freeze({
    id: id as PrivilegedSecurityEventId,
    administratorId: platformAdministratorId(String(raw.administratorId ?? "")),
    sessionId: raw.sessionId ? String(raw.sessionId) as PrivilegedSessionId : null,
    deviceId: raw.deviceId ? String(raw.deviceId) as PrivilegedDeviceId : null,
    type: String(raw.type ?? "") as PrivilegedSecurityEvent["type"],
    occurredAt: iso(raw.occurredAt, "Privileged security event occurredAt"),
    riskSignals: Object.freeze(raw.riskSignals) as PrivilegedSecurityEvent["riskSignals"],
    detail: String(raw.detail ?? ""),
  });
}

function persisted<T extends object>(value: T) {
  return { schemaVersion: PRIVILEGED_SECURITY_SCHEMA_VERSION, ...value };
}

export class FirestorePrivilegedAdministratorSecurityRepository implements PrivilegedAdministratorSecurityRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) { this.db = db; }

  async getSession(id: PrivilegedSessionId): Promise<PrivilegedAdministratorSession | null> {
    const doc = await this.db.collection(PRIVILEGED_SESSION_COLLECTION).doc(id).get();
    return hydrateSession(doc.id, doc.data());
  }

  async saveSession(session: PrivilegedAdministratorSession): Promise<void> {
    await this.db.collection(PRIVILEGED_SESSION_COLLECTION).doc(session.id).set(persisted(session));
  }

  async listActiveSessions(administratorId: PlatformAdministratorId): Promise<readonly PrivilegedAdministratorSession[]> {
    const snapshot = await this.db.collection(PRIVILEGED_SESSION_COLLECTION).where("administratorId", "==", administratorId).where("status", "==", "active").get();
    return Object.freeze(snapshot.docs.map((doc) => hydrateSession(doc.id, doc.data())!));
  }

  async getDevice(id: PrivilegedDeviceId): Promise<PrivilegedAdministratorDevice | null> {
    const doc = await this.db.collection(PRIVILEGED_DEVICE_COLLECTION).doc(id).get();
    return hydrateDevice(doc.id, doc.data());
  }

  async saveDevice(device: PrivilegedAdministratorDevice): Promise<void> {
    await this.db.collection(PRIVILEGED_DEVICE_COLLECTION).doc(device.id).set(persisted(device));
  }

  async listDevices(administratorId: PlatformAdministratorId): Promise<readonly PrivilegedAdministratorDevice[]> {
    const snapshot = await this.db.collection(PRIVILEGED_DEVICE_COLLECTION).where("administratorId", "==", administratorId).get();
    return Object.freeze(snapshot.docs.map((doc) => hydrateDevice(doc.id, doc.data())!));
  }

  async appendSecurityEvent(event: PrivilegedSecurityEvent): Promise<void> {
    const ref = this.db.collection(PRIVILEGED_SECURITY_EVENT_COLLECTION).doc(event.id);
    await this.db.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      if (existing.exists) throw new Error(`Privileged security event already exists: ${event.id}.`);
      transaction.create(ref, persisted(event));
    });
  }

  async getSecurityEvent(id: PrivilegedSecurityEventId): Promise<PrivilegedSecurityEvent | null> {
    const doc = await this.db.collection(PRIVILEGED_SECURITY_EVENT_COLLECTION).doc(id).get();
    return hydrateEvent(doc.id, doc.data());
  }
}
