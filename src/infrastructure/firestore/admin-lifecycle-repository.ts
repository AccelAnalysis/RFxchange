import type { Firestore } from "firebase-admin/firestore";

import { platformAdministratorId, type PlatformAdministratorId } from "../../domain/admin-authorization/model.ts";
import { parseAdminGrantScope } from "../../domain/admin-authorization/grants.ts";
import { createPlatformAdministratorRoleConfiguration } from "../../domain/admin-authorization/role-configuration.ts";
import type { PlatformAdministratorLifecycleRepository } from "../../domain/admin-authorization/administrator-lifecycle-repository.ts";
import type {
  PlatformAdministratorAccount,
  PlatformAdministratorLifecycleEvent,
  PlatformAdministratorLifecycleEventId,
  PlatformAdministratorLifecycleSnapshot,
  PlatformAdministratorLifecycleTimestamp,
  PlatformAdministratorSubject,
} from "../../domain/admin-authorization/administrator-lifecycle.ts";

export const PLATFORM_ADMINISTRATOR_COLLECTION = "platformAdministrators" as const;
export const PLATFORM_ADMINISTRATOR_EVENT_COLLECTION = "platformAdministratorLifecycleEvents" as const;
export const PLATFORM_ADMINISTRATOR_SCHEMA_VERSION = 1 as const;

function strings(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    throw new Error(`${field} must be an array of strings.`);
  }
  return value;
}

function bool(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${field} must be boolean.`);
  return value;
}

function iso(value: unknown, field: string): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be a valid timestamp.`);
  }
  return new Date(value).toISOString();
}

function nullableIso(value: unknown, field: string): PlatformAdministratorLifecycleTimestamp | null {
  if (value === null || value === undefined) return null;
  return iso(value, field) as PlatformAdministratorLifecycleTimestamp;
}

function persistAccount(account: PlatformAdministratorAccount) {
  return {
    schemaVersion: PLATFORM_ADMINISTRATOR_SCHEMA_VERSION,
    administratorId: account.administratorId,
    subject: account.subject,
    protectedAccount: account.protectedAccount,
    status: account.status,
    access: {
      rolePresetKeys: account.access.rolePresetKeys,
      addedPermissions: account.access.addedPermissions,
      removedPermissions: account.access.removedPermissions,
      createdAt: account.access.createdAt,
      updatedAt: account.access.updatedAt,
    },
    scopeLimits: account.scopeLimits.map((scope) => scope.value),
    security: account.security,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

function hydrateAccount(id: string, raw: FirebaseFirestore.DocumentData | undefined): PlatformAdministratorAccount | null {
  if (!raw) return null;
  if (raw.schemaVersion !== PLATFORM_ADMINISTRATOR_SCHEMA_VERSION) {
    throw new Error(`Platform administrator ${id} has an unsupported schema version.`);
  }
  if (raw.administratorId !== id) throw new Error("Platform administrator identity does not match document path.");
  if (!raw.access || typeof raw.access !== "object") throw new Error("Platform administrator access state is required.");
  if (!raw.security || typeof raw.security !== "object") throw new Error("Platform administrator security state is required.");
  const status = String(raw.status ?? "");
  if (status !== "active" && status !== "disabled" && status !== "removed") {
    throw new Error("Platform administrator status is invalid.");
  }
  const subject = String(raw.subject ?? "").trim();
  if (!subject) throw new Error("Platform administrator authentication subject is required.");
  const access = createPlatformAdministratorRoleConfiguration({
    administratorId: id,
    rolePresetKeys: strings(raw.access.rolePresetKeys, "Administrator rolePresetKeys"),
    addedPermissions: strings(raw.access.addedPermissions, "Administrator addedPermissions"),
    removedPermissions: strings(raw.access.removedPermissions, "Administrator removedPermissions"),
    createdAt: iso(raw.access.createdAt, "Administrator access createdAt"),
    updatedAt: iso(raw.access.updatedAt, "Administrator access updatedAt"),
  });
  const scopeLimits = strings(raw.scopeLimits, "Administrator scopeLimits").map(parseAdminGrantScope);
  if (scopeLimits.length === 0) throw new Error("Platform administrator requires at least one scope limit.");
  return Object.freeze({
    administratorId: platformAdministratorId(id),
    subject: subject as PlatformAdministratorSubject,
    protectedAccount: bool(raw.protectedAccount, "Administrator protectedAccount"),
    status,
    access,
    scopeLimits: Object.freeze(scopeLimits),
    security: Object.freeze({
      locked: bool(raw.security.locked, "Administrator security.locked"),
      credentialResetRequired: bool(raw.security.credentialResetRequired, "Administrator security.credentialResetRequired"),
      mfaRequired: bool(raw.security.mfaRequired, "Administrator security.mfaRequired"),
      reauthenticationRequiredAfter: nullableIso(raw.security.reauthenticationRequiredAfter, "Administrator security.reauthenticationRequiredAfter"),
      sessionsTerminatedAt: nullableIso(raw.security.sessionsTerminatedAt, "Administrator security.sessionsTerminatedAt"),
    }),
    createdAt: iso(raw.createdAt, "Administrator createdAt") as PlatformAdministratorLifecycleTimestamp,
    updatedAt: iso(raw.updatedAt, "Administrator updatedAt") as PlatformAdministratorLifecycleTimestamp,
  });
}

function persistEvent(event: PlatformAdministratorLifecycleEvent) {
  return { schemaVersion: PLATFORM_ADMINISTRATOR_SCHEMA_VERSION, ...event };
}

function snapshot(raw: unknown): PlatformAdministratorLifecycleSnapshot | null {
  if (raw === null) return null;
  if (!raw || typeof raw !== "object") throw new Error("Administrator lifecycle snapshot is invalid.");
  const value = raw as Record<string, unknown>;
  const status = String(value.status ?? "");
  if (status !== "active" && status !== "disabled" && status !== "removed") throw new Error("Administrator lifecycle snapshot status is invalid.");
  return Object.freeze({
    status,
    rolePresetKeys: strings(value.rolePresetKeys, "Lifecycle snapshot rolePresetKeys"),
    addedPermissions: strings(value.addedPermissions, "Lifecycle snapshot addedPermissions"),
    removedPermissions: strings(value.removedPermissions, "Lifecycle snapshot removedPermissions"),
    scopeLimits: strings(value.scopeLimits, "Lifecycle snapshot scopeLimits"),
    locked: bool(value.locked, "Lifecycle snapshot locked"),
    credentialResetRequired: bool(value.credentialResetRequired, "Lifecycle snapshot credentialResetRequired"),
    mfaRequired: bool(value.mfaRequired, "Lifecycle snapshot mfaRequired"),
    reauthenticationRequiredAfter: value.reauthenticationRequiredAfter === null ? null : iso(value.reauthenticationRequiredAfter, "Lifecycle snapshot reauthenticationRequiredAfter"),
    sessionsTerminatedAt: value.sessionsTerminatedAt === null ? null : iso(value.sessionsTerminatedAt, "Lifecycle snapshot sessionsTerminatedAt"),
  });
}

function hydrateEvent(id: string, raw: FirebaseFirestore.DocumentData | undefined): PlatformAdministratorLifecycleEvent | null {
  if (!raw) return null;
  if (raw.schemaVersion !== PLATFORM_ADMINISTRATOR_SCHEMA_VERSION) throw new Error(`Administrator lifecycle event ${id} has an unsupported schema version.`);
  if (raw.id !== id) throw new Error("Administrator lifecycle event identity does not match document path.");
  return Object.freeze({
    id: id as PlatformAdministratorLifecycleEventId,
    actorAdministratorId: platformAdministratorId(String(raw.actorAdministratorId ?? "")),
    targetAdministratorId: platformAdministratorId(String(raw.targetAdministratorId ?? "")),
    permission: String(raw.permission ?? "") as PlatformAdministratorLifecycleEvent["permission"],
    action: String(raw.action ?? "") as PlatformAdministratorLifecycleEvent["action"],
    reason: String(raw.reason ?? ""),
    occurredAt: iso(raw.occurredAt, "Administrator lifecycle event occurredAt") as PlatformAdministratorLifecycleTimestamp,
    before: snapshot(raw.before),
    after: snapshot(raw.after)!,
  });
}

export class FirestorePlatformAdministratorLifecycleRepository implements PlatformAdministratorLifecycleRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getByAdministratorId(administratorId: PlatformAdministratorId): Promise<PlatformAdministratorAccount | null> {
    const document = await this.db.collection(PLATFORM_ADMINISTRATOR_COLLECTION).doc(administratorId).get();
    return hydrateAccount(document.id, document.data());
  }

  async getBySubject(subject: string): Promise<PlatformAdministratorAccount | null> {
    const snapshot = await this.db.collection(PLATFORM_ADMINISTRATOR_COLLECTION).where("subject", "==", subject.trim()).limit(1).get();
    if (snapshot.empty) return null;
    const document = snapshot.docs[0];
    return hydrateAccount(document.id, document.data());
  }

  async save(account: PlatformAdministratorAccount): Promise<void> {
    await this.db.collection(PLATFORM_ADMINISTRATOR_COLLECTION).doc(account.administratorId).set(persistAccount(account));
  }

  async appendEvent(event: PlatformAdministratorLifecycleEvent): Promise<void> {
    const ref = this.db.collection(PLATFORM_ADMINISTRATOR_EVENT_COLLECTION).doc(event.id);
    await this.db.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      if (existing.exists) throw new Error(`Administrator lifecycle event already exists: ${event.id}.`);
      transaction.create(ref, persistEvent(event));
    });
  }

  async getEventById(eventId: PlatformAdministratorLifecycleEventId): Promise<PlatformAdministratorLifecycleEvent | null> {
    const document = await this.db.collection(PLATFORM_ADMINISTRATOR_EVENT_COLLECTION).doc(eventId).get();
    return hydrateEvent(document.id, document.data());
  }

  async listEventsForAdministrator(administratorId: PlatformAdministratorId): Promise<readonly PlatformAdministratorLifecycleEvent[]> {
    const snapshot = await this.db.collection(PLATFORM_ADMINISTRATOR_EVENT_COLLECTION).where("targetAdministratorId", "==", administratorId).get();
    return Object.freeze(snapshot.docs.map((document) => hydrateEvent(document.id, document.data())!));
  }
}
