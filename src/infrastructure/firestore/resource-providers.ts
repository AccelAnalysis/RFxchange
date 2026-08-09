import { FieldValue, type DocumentData, type Firestore } from "firebase-admin/firestore";

import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  OfficialResourceProviderApplication,
  OfficialResourceProviderStatus,
  ProviderApplicationCommandReceipt,
  ProviderApplicationEvent,
  ProviderServiceProfile,
} from "../../domain/resource-providers/model.ts";
import type { ResourceProviderRepository } from "../../domain/resource-providers/repository.ts";
import { FIRESTORE_SCHEMA_VERSION, firestoreCollectionName, firestoreDocumentPath } from "./schema.ts";
import { getFirestoreRecordById, listFirestoreRecords } from "./support.ts";

function mutable(record: object, createdAt?: unknown): DocumentData {
  return { ...record, schemaVersion: FIRESTORE_SCHEMA_VERSION, createdAt: createdAt ?? FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
}

function appendOnly(record: object): DocumentData {
  return { ...record, schemaVersion: FIRESTORE_SCHEMA_VERSION, createdAt: FieldValue.serverTimestamp() };
}

export class FirestoreResourceProviderRepository implements ResourceProviderRepository {
  private readonly db: Firestore;
  constructor(db: Firestore) { this.db = db; }

  getApplicationByOrganizationId(organizationId: OrganizationId): Promise<OfficialResourceProviderApplication | null> {
    return getFirestoreRecordById(this.db, "providerApplications", organizationId);
  }
  async listApplications(): Promise<readonly OfficialResourceProviderApplication[]> {
    const records = await listFirestoreRecords<OfficialResourceProviderApplication>(this.db.collection(firestoreCollectionName("providerApplications")), "providerApplications");
    return Object.freeze([...records].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)));
  }
  getCommand(id: string): Promise<ProviderApplicationCommandReceipt | null> {
    return getFirestoreRecordById(this.db, "providerApplicationCommands", id);
  }
  getStatusByOrganizationId(organizationId: OrganizationId): Promise<OfficialResourceProviderStatus | null> {
    return getFirestoreRecordById(this.db, "officialResourceProviderStatuses", organizationId);
  }
  getServiceProfileByOrganizationId(organizationId: OrganizationId): Promise<ProviderServiceProfile | null> {
    return getFirestoreRecordById(this.db, "providerServiceProfiles", organizationId);
  }
  async listEvents(applicationId: string): Promise<readonly ProviderApplicationEvent[]> {
    const records = await listFirestoreRecords<ProviderApplicationEvent>(this.db.collection(firestoreCollectionName("providerApplicationEvents")).where("applicationId", "==", applicationId), "providerApplicationEvents");
    return Object.freeze([...records].sort((left, right) => left.aggregateVersion - right.aggregateVersion || Date.parse(left.occurredAt) - Date.parse(right.occurredAt)));
  }

  async saveParticipant(input: Parameters<ResourceProviderRepository["saveParticipant"]>[0]): Promise<void> {
    const applicationRef = this.db.doc(firestoreDocumentPath("providerApplications", input.application.id));
    const versionRef = this.db.doc(firestoreDocumentPath("providerApplicationVersions", `${input.application.id}:${input.event.id}`));
    const eventRef = this.db.doc(firestoreDocumentPath("providerApplicationEvents", input.event.id));
    const commandRef = this.db.doc(firestoreDocumentPath("providerApplicationCommands", input.command.id));
    const auditRef = this.db.doc(firestoreDocumentPath("organizationAuditEvents", input.audit.id));
    const profileRef = input.serviceProfile ? this.db.doc(firestoreDocumentPath("providerServiceProfiles", input.serviceProfile.id)) : null;
    await this.db.runTransaction(async (transaction) => {
      const [current, version, event, command, audit, profile] = await Promise.all([
        transaction.get(applicationRef), transaction.get(versionRef), transaction.get(eventRef), transaction.get(commandRef), transaction.get(auditRef), profileRef ? transaction.get(profileRef) : Promise.resolve(null),
      ]);
      const currentVersion = current.exists ? Number(current.data()?.version) : null;
      if (currentVersion !== input.expectedVersion) throw new Error("Provider application changed before the command committed.");
      if (version.exists || event.exists || command.exists || audit.exists) throw new Error("Provider application command evidence already exists.");
      if (input.application.organizationId !== input.event.organizationId || input.application.organizationId !== input.command.organizationId || input.application.organizationId !== input.audit.organizationId) throw new Error("Provider application persistence scope does not match.");
      transaction.set(applicationRef, mutable(input.application, current.data()?.createdAt));
      transaction.create(versionRef, appendOnly({ ...input.application, versionRecordId: versionRef.id }));
      transaction.create(eventRef, appendOnly(input.event));
      transaction.create(commandRef, appendOnly(input.command));
      transaction.create(auditRef, appendOnly(input.audit));
      if (profileRef && input.serviceProfile) transaction.set(profileRef, mutable(input.serviceProfile, profile?.data()?.createdAt));
    });
  }

  async saveAdministrative(input: Parameters<ResourceProviderRepository["saveAdministrative"]>[0]): Promise<void> {
    const applicationRef = this.db.doc(firestoreDocumentPath("providerApplications", input.application.id));
    const versionRef = this.db.doc(firestoreDocumentPath("providerApplicationVersions", `${input.application.id}:${input.event.id}`));
    const eventRef = this.db.doc(firestoreDocumentPath("providerApplicationEvents", input.event.id));
    const commandRef = this.db.doc(firestoreDocumentPath("providerApplicationCommands", input.command.id));
    const auditRef = this.db.collection("platformAdministrativeAuditEvents").doc(input.audit.id);
    const statusRef = input.status ? this.db.doc(firestoreDocumentPath("officialResourceProviderStatuses", input.status.id)) : null;
    const profileRef = input.serviceProfile ? this.db.doc(firestoreDocumentPath("providerServiceProfiles", input.serviceProfile.id)) : null;
    await this.db.runTransaction(async (transaction) => {
      const [current, version, event, command, audit, status, profile] = await Promise.all([
        transaction.get(applicationRef), transaction.get(versionRef), transaction.get(eventRef), transaction.get(commandRef), transaction.get(auditRef), statusRef ? transaction.get(statusRef) : Promise.resolve(null), profileRef ? transaction.get(profileRef) : Promise.resolve(null),
      ]);
      if (!current.exists || Number(current.data()?.version) !== input.expectedVersion) throw new Error("Provider application changed before administrative review committed.");
      if (version.exists || event.exists || command.exists || audit.exists) throw new Error("Provider administrative command evidence already exists.");
      transaction.set(applicationRef, mutable(input.application, current.data()?.createdAt));
      transaction.create(versionRef, appendOnly({ ...input.application, versionRecordId: versionRef.id }));
      transaction.create(eventRef, appendOnly(input.event));
      transaction.create(commandRef, appendOnly(input.command));
      transaction.create(auditRef, { schemaVersion: 1, ...input.audit });
      if (statusRef && input.status) transaction.set(statusRef, mutable(input.status, status?.data()?.createdAt));
      if (profileRef && input.serviceProfile) transaction.set(profileRef, mutable(input.serviceProfile, profile?.data()?.createdAt));
    });
  }
}

export class FirestoreProviderEvidenceOwnershipReader {
  private readonly db: Firestore;
  constructor(db: Firestore) { this.db = db; }
  async allBelongToOrganization(organizationId: string, assetIds: readonly string[]): Promise<boolean> {
    const records = await Promise.all(assetIds.map((id) => this.db.doc(firestoreDocumentPath("organizationProfileAssets", id)).get()));
    return records.every((record) => record.exists && String(record.data()?.organizationId) === organizationId && record.data()?.status !== "deleted");
  }
}
