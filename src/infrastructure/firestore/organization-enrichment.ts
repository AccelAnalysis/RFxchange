import { FieldValue, type DocumentData, type Firestore } from "firebase-admin/firestore";

import type {
  OrganizationAdditionalLocation,
  OrganizationAdditionalLocationDraft,
  OrganizationCredential,
  OrganizationEnrichmentCommandReceipt,
  OrganizationProfileAsset,
} from "../../domain/organization-enrichment/model.ts";
import {
  OrganizationEnrichmentPersistenceConflictError,
  type OrganizationEnrichmentRepository,
} from "../../domain/organization-enrichment/repository.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import { FIRESTORE_SCHEMA_VERSION, firestoreDocumentPath, type FirestoreCollectionKey } from "./schema.ts";
import { getFirestoreRecordById, listFirestoreRecords } from "./support.ts";

function mutable(record: object, createdAt: unknown = FieldValue.serverTimestamp()): DocumentData {
  return { ...record, schemaVersion: FIRESTORE_SCHEMA_VERSION, createdAt, updatedAt: FieldValue.serverTimestamp() };
}

function immutable(record: object): DocumentData {
  return { ...record, schemaVersion: FIRESTORE_SCHEMA_VERSION, createdAt: FieldValue.serverTimestamp() };
}

function scopedList<T extends object>(db: Firestore, collection: FirestoreCollectionKey, organizationId: OrganizationId): Promise<readonly T[]> {
  return listFirestoreRecords<T>(db.collection(collection).where("organizationId", "==", organizationId), collection);
}

export class FirestoreOrganizationEnrichmentRepository implements OrganizationEnrichmentRepository {
  constructor(private readonly db: Firestore) {}

  listCredentials(organizationId: OrganizationId) {
    return scopedList<OrganizationCredential>(this.db, "organizationCredentials", organizationId);
  }
  getCredential(id: string) {
    return getFirestoreRecordById<OrganizationCredential>(this.db, "organizationCredentials", id);
  }
  listProfileAssets(organizationId: OrganizationId) {
    return scopedList<OrganizationProfileAsset>(this.db, "organizationProfileAssets", organizationId);
  }
  getProfileAsset(id: string) {
    return getFirestoreRecordById<OrganizationProfileAsset>(this.db, "organizationProfileAssets", id);
  }
  listAdditionalLocations(organizationId: OrganizationId) {
    return scopedList<OrganizationAdditionalLocation>(this.db, "organizationAdditionalLocations", organizationId);
  }
  getAdditionalLocation(id: string) {
    return getFirestoreRecordById<OrganizationAdditionalLocation>(this.db, "organizationAdditionalLocations", id);
  }
  getAdditionalLocationDraft(id: string) {
    return getFirestoreRecordById<OrganizationAdditionalLocationDraft>(this.db, "organizationAdditionalLocationDrafts", id);
  }
  getCommand(id: string) {
    return getFirestoreRecordById<OrganizationEnrichmentCommandReceipt>(this.db, "organizationEnrichmentCommands", id);
  }

  async save(input: Parameters<OrganizationEnrichmentRepository["save"]>[0]): Promise<void> {
    const commandRef = this.db.doc(firestoreDocumentPath("organizationEnrichmentCommands", input.command.id));
    const eventRef = this.db.doc(firestoreDocumentPath("organizationEnrichmentEvents", input.event.id));
    const auditRef = this.db.doc(firestoreDocumentPath("organizationAuditEvents", input.auditEvent.id));
    const collection = input.record.kind === "credential" ? "organizationCredentials" as const
      : input.record.kind === "profile-asset" ? "organizationProfileAssets" as const
        : input.record.kind === "location-draft" ? "organizationAdditionalLocationDrafts" as const
          : "organizationAdditionalLocations" as const;
    const value = input.record.kind === "location-confirmation" ? input.record.value : input.record.value;
    const recordRef = this.db.doc(firestoreDocumentPath(collection, value.id));
    const draftRef = input.record.kind === "location-confirmation"
      ? this.db.doc(firestoreDocumentPath("organizationAdditionalLocationDrafts", input.record.draft.id))
      : null;

    await this.db.runTransaction(async (transaction) => {
      const snapshots = await transaction.getAll(commandRef, eventRef, auditRef, recordRef, ...(draftRef ? [draftRef] : []));
      const [commandSnapshot, eventSnapshot, auditSnapshot, recordSnapshot, draftSnapshot] = snapshots;
      if (commandSnapshot.exists) {
        const prior = commandSnapshot.data() as OrganizationEnrichmentCommandReceipt;
        if (prior.organizationId === input.command.organizationId && prior.action === input.command.action &&
          prior.resultId === input.command.resultId && prior.requestFingerprint === input.command.requestFingerprint) return;
        throw new OrganizationEnrichmentPersistenceConflictError(
          "Organization enrichment command identity collision.",
        );
      }
      if (eventSnapshot.exists || auditSnapshot.exists) {
        throw new OrganizationEnrichmentPersistenceConflictError(
          "Organization enrichment event identity collision.",
        );
      }
      if (value.organizationId !== input.command.organizationId || input.event.organizationId !== input.command.organizationId ||
        input.auditEvent.organizationId !== input.command.organizationId) {
        throw new Error("Organization enrichment persistence inputs have mismatched organization scope.");
      }
      transaction.set(recordRef, mutable(value, recordSnapshot.data()?.createdAt ?? FieldValue.serverTimestamp()));
      if (draftRef && input.record.kind === "location-confirmation") {
        if (!draftSnapshot?.exists) {
          throw new OrganizationEnrichmentPersistenceConflictError(
            "Additional-location draft disappeared before confirmation.",
          );
        }
        transaction.set(draftRef, mutable(input.record.draft, draftSnapshot.data()?.createdAt ?? FieldValue.serverTimestamp()));
      }
      transaction.create(eventRef, immutable(input.event));
      transaction.create(auditRef, immutable(input.auditEvent));
      transaction.create(commandRef, immutable(input.command));
    });
  }
}
