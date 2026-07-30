import type { Firestore } from "firebase-admin/firestore";

import type { AdministrativeBoundaryEventRepository } from "../../domain/admin-authorization/authority-boundary-repository.ts";
import type {
  AdministrativeBoundaryAction,
  AdministrativeBoundaryEvent,
  AdministrativeBoundaryEventId,
  AdministrativeBoundaryTimestamp,
} from "../../domain/admin-authorization/authority-boundaries.ts";
import { platformAdministratorId, requireCataloguedAdminPermission, type PlatformAdministratorId } from "../../domain/admin-authorization/model.ts";

export const ADMIN_AUTHORITY_BOUNDARY_EVENT_COLLECTION = "adminAuthorityBoundaryEvents" as const;
export const ADMIN_AUTHORITY_BOUNDARY_EVENT_SCHEMA_VERSION = 1 as const;

function hydrate(id: string, raw: FirebaseFirestore.DocumentData | undefined): AdministrativeBoundaryEvent | null {
  if (!raw) return null;
  if (raw.schemaVersion !== ADMIN_AUTHORITY_BOUNDARY_EVENT_SCHEMA_VERSION) {
    throw new Error(`Administrative boundary event ${id} has an unsupported schema version.`);
  }
  if (raw.id !== id) throw new Error("Administrative boundary event identity does not match document path.");
  const occurredAt = String(raw.occurredAt ?? "");
  if (!Number.isFinite(Date.parse(occurredAt))) throw new Error("Administrative boundary event timestamp is invalid.");
  if (!Array.isArray(raw.missingPermissions) || !raw.missingPermissions.every((value: unknown) => typeof value === "string")) {
    throw new Error("Administrative boundary event missingPermissions are invalid.");
  }
  const outcome = String(raw.outcome ?? "");
  if (outcome !== "allowed" && outcome !== "denied") throw new Error("Administrative boundary event outcome is invalid.");
  return Object.freeze({
    id: id as AdministrativeBoundaryEventId,
    administratorId: platformAdministratorId(String(raw.administratorId ?? "")),
    action: String(raw.action ?? "") as AdministrativeBoundaryAction,
    outcome,
    reason: String(raw.reason ?? ""),
    occurredAt: new Date(occurredAt).toISOString() as AdministrativeBoundaryTimestamp,
    missingPermissions: Object.freeze(raw.missingPermissions.map(requireCataloguedAdminPermission)),
  });
}

function persisted(event: AdministrativeBoundaryEvent) {
  return Object.freeze({
    schemaVersion: ADMIN_AUTHORITY_BOUNDARY_EVENT_SCHEMA_VERSION,
    ...event,
  });
}

export class FirestoreAdministrativeBoundaryEventRepository
  implements AdministrativeBoundaryEventRepository
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async append(event: AdministrativeBoundaryEvent): Promise<void> {
    const ref = this.db.collection(ADMIN_AUTHORITY_BOUNDARY_EVENT_COLLECTION).doc(event.id);
    await this.db.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      if (existing.exists) throw new Error(`Administrative boundary event already exists: ${event.id}.`);
      transaction.create(ref, persisted(event));
    });
  }

  async getById(id: AdministrativeBoundaryEventId): Promise<AdministrativeBoundaryEvent | null> {
    const doc = await this.db.collection(ADMIN_AUTHORITY_BOUNDARY_EVENT_COLLECTION).doc(id).get();
    return hydrate(doc.id, doc.data());
  }

  async listByAdministratorId(
    administratorId: PlatformAdministratorId,
  ): Promise<readonly AdministrativeBoundaryEvent[]> {
    const snapshot = await this.db
      .collection(ADMIN_AUTHORITY_BOUNDARY_EVENT_COLLECTION)
      .where("administratorId", "==", administratorId)
      .get();
    return Object.freeze(snapshot.docs.map((doc) => hydrate(doc.id, doc.data())!));
  }
}
