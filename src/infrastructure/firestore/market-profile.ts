import { FieldValue, type DocumentData, type Firestore } from "firebase-admin/firestore";

import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  OrganizationCapabilityClaim,
  OrganizationIndustryProfile,
  OrganizationMarketPreferences,
  OrganizationMarketProfileCommandReceipt,
  OrganizationPastPerformance,
  OrganizationProvisionalTerm,
} from "../../domain/market-profile/model.ts";
import type {
  OrganizationCapabilityClaimRepository,
  OrganizationMarketProfileRepository,
} from "../../domain/market-profile/repository.ts";
import { FIRESTORE_SCHEMA_VERSION, firestoreDocumentPath } from "./schema.ts";
import { getFirestoreRecordById, listFirestoreRecords } from "./support.ts";

function mutable(record: object, createdAt: unknown = FieldValue.serverTimestamp()): DocumentData {
  return { ...record, schemaVersion: FIRESTORE_SCHEMA_VERSION, createdAt, updatedAt: FieldValue.serverTimestamp() };
}

function immutable(record: object): DocumentData {
  return { ...record, schemaVersion: FIRESTORE_SCHEMA_VERSION, createdAt: FieldValue.serverTimestamp() };
}

function scopedList<T extends object>(db: Firestore, collection: Parameters<typeof firestoreDocumentPath>[0], organizationId: OrganizationId): Promise<readonly T[]> {
  return listFirestoreRecords<T>(
    db.collection(collection).where("organizationId", "==", organizationId),
    collection,
  );
}

export class FirestoreOrganizationCapabilityClaimRepository implements OrganizationCapabilityClaimRepository {
  constructor(private readonly db: Firestore) {}
  getById(id: string) {
    return getFirestoreRecordById<OrganizationCapabilityClaim>(this.db, "organizationCapabilityClaims", id);
  }
  listByOrganizationId(organizationId: OrganizationId) {
    return scopedList<OrganizationCapabilityClaim>(this.db, "organizationCapabilityClaims", organizationId);
  }
}

export class FirestoreOrganizationMarketProfileRepository implements OrganizationMarketProfileRepository {
  readonly claims: OrganizationCapabilityClaimRepository;
  constructor(private readonly db: Firestore) {
    this.claims = new FirestoreOrganizationCapabilityClaimRepository(db);
  }

  getIndustryProfile(organizationId: OrganizationId) {
    return getFirestoreRecordById<OrganizationIndustryProfile>(this.db, "organizationIndustryProfiles", organizationId);
  }
  listPastPerformance(organizationId: OrganizationId) {
    return scopedList<OrganizationPastPerformance>(this.db, "organizationPastPerformance", organizationId);
  }
  getPreferences(organizationId: OrganizationId) {
    return getFirestoreRecordById<OrganizationMarketPreferences>(this.db, "organizationMarketPreferences", organizationId);
  }
  listProvisionalTerms(organizationId: OrganizationId) {
    return scopedList<OrganizationProvisionalTerm>(this.db, "organizationProvisionalTerms", organizationId);
  }
  getCommand(id: string) {
    return getFirestoreRecordById<OrganizationMarketProfileCommandReceipt>(this.db, "organizationMarketProfileCommands", id);
  }

  async save(input: Parameters<OrganizationMarketProfileRepository["save"]>[0]): Promise<void> {
    const commandRef = this.db.doc(firestoreDocumentPath("organizationMarketProfileCommands", input.command.id));
    const eventRef = this.db.doc(firestoreDocumentPath("organizationMarketProfileEvents", input.event.id));
    const auditRef = this.db.doc(firestoreDocumentPath("organizationAuditEvents", input.auditEvent.id));
    const recordCollection = input.record.kind === "capability"
      ? "organizationCapabilityClaims" as const
      : input.record.kind === "industry"
        ? "organizationIndustryProfiles" as const
        : input.record.kind === "past-performance"
          ? "organizationPastPerformance" as const
          : input.record.kind === "preferences"
            ? "organizationMarketPreferences" as const
            : "organizationProvisionalTerms" as const;
    const recordRef = this.db.doc(firestoreDocumentPath(recordCollection, input.record.value.id));

    await this.db.runTransaction(async (transaction) => {
      const [commandSnapshot, eventSnapshot, auditSnapshot, recordSnapshot] = await transaction.getAll(commandRef, eventRef, auditRef, recordRef);
      if (commandSnapshot.exists) {
        const prior = commandSnapshot.data() as OrganizationMarketProfileCommandReceipt;
        if (
          prior.organizationId === input.command.organizationId &&
          prior.action === input.command.action &&
          prior.resultId === input.command.resultId &&
          prior.requestFingerprint === input.command.requestFingerprint
        ) return;
        throw new Error("Market profile command identity collision.");
      }
      if (eventSnapshot.exists || auditSnapshot.exists) throw new Error("Market profile event identity collision.");
      if (
        input.record.value.organizationId !== input.command.organizationId ||
        input.event.organizationId !== input.command.organizationId ||
        input.auditEvent.organizationId !== input.command.organizationId
      ) throw new Error("Market profile persistence inputs have mismatched organization scope.");

      const recordData = input.record.kind === "provisional-term"
        ? immutable(input.record.value)
        : mutable(input.record.value, recordSnapshot.data()?.createdAt ?? FieldValue.serverTimestamp());
      if (input.record.kind === "provisional-term" && recordSnapshot.exists) throw new Error("Provisional term identity already exists.");
      transaction.set(recordRef, recordData);
      transaction.create(eventRef, immutable(input.event));
      transaction.create(auditRef, immutable(input.auditEvent));
      transaction.create(commandRef, immutable(input.command));
    });
  }
}
