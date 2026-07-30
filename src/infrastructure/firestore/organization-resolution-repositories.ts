import {
  FieldValue,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";

import type { GeographyId } from "../../domain/geography/model.ts";
import type { AccessLifecycleRecord } from "../../domain/lifecycle/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  OrganizationDiscoveryRecord,
  OrganizationResolutionRecord,
} from "../../domain/organization-resolution/model.ts";
import {
  OrganizationEntityKeyConflictError,
  type ExistingOrganizationResolutionCommit,
  type NewOrganizationResolutionCommit,
  type OrganizationDiscoveryRepository,
  type OrganizationResolutionRepositories,
  type OrganizationResolutionRepository,
  type OrganizationResolutionUnitOfWork,
} from "../../domain/organization-resolution/repository.ts";
import type { AccessJourneyId } from "../../domain/lifecycle/model.ts";
import type { UserId } from "../../domain/users/model.ts";
import {
  FIRESTORE_SCHEMA_VERSION,
  assertOrganizationScopedFirestoreRecord,
  firestoreCollectionName,
  firestoreDocumentPath,
  type FirestoreCollectionKey,
} from "./schema.ts";
import {
  getFirstFirestoreRecord,
  listFirestoreRecords,
  saveMutableFirestoreRecord,
} from "./support.ts";

function mutableCreatePayload(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function appendOnlyPayload(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
  };
}

function saveLifecyclePayload(
  lifecycle: AccessLifecycleRecord,
  createdAt: unknown,
): DocumentData {
  return {
    ...lifecycle,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function organizationIdFrom(record: object): string | null {
  const value = (record as { readonly organizationId?: unknown }).organizationId;
  return typeof value === "string" ? value : null;
}

function assertRecord(
  key: FirestoreCollectionKey,
  record: object,
): void {
  assertOrganizationScopedFirestoreRecord(key, organizationIdFrom(record));
}

function create(
  transaction: Transaction,
  ref: DocumentReference,
  key: FirestoreCollectionKey,
  record: object,
  mode: "mutable" | "append-only",
): void {
  assertRecord(key, record);
  transaction.create(
    ref,
    mode === "mutable" ? mutableCreatePayload(record) : appendOnlyPayload(record),
  );
}

export class FirestoreOrganizationDiscoveryRepository
  implements OrganizationDiscoveryRepository
{
  constructor(private readonly db: Firestore) {}

  getByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrganizationDiscoveryRecord | null> {
    return getFirstFirestoreRecord<OrganizationDiscoveryRecord>(
      this.db
        .collection(firestoreCollectionName("organizationDiscoveryRecords"))
        .where("organizationId", "==", organizationId),
      "organizationDiscoveryRecords",
    );
  }

  listByGeographyId(
    geographyId: GeographyId,
  ): Promise<readonly OrganizationDiscoveryRecord[]> {
    return listFirestoreRecords<OrganizationDiscoveryRecord>(
      this.db
        .collection(firestoreCollectionName("organizationDiscoveryRecords"))
        .where("geographyId.value", "==", geographyId),
      "organizationDiscoveryRecords",
    );
  }

  save(record: OrganizationDiscoveryRecord): Promise<void> {
    return saveMutableFirestoreRecord(
      this.db,
      "organizationDiscoveryRecords",
      record.id,
      record,
    );
  }
}

export class FirestoreOrganizationResolutionRepository
  implements OrganizationResolutionRepository
{
  constructor(private readonly db: Firestore) {}

  getByAccessJourneyId(
    accessJourneyId: AccessJourneyId,
  ): Promise<OrganizationResolutionRecord | null> {
    return getFirstFirestoreRecord<OrganizationResolutionRecord>(
      this.db
        .collection(firestoreCollectionName("organizationResolutions"))
        .where("accessJourneyId", "==", accessJourneyId),
      "organizationResolutions",
    );
  }

  listByUserId(userId: UserId): Promise<readonly OrganizationResolutionRecord[]> {
    return listFirestoreRecords<OrganizationResolutionRecord>(
      this.db
        .collection(firestoreCollectionName("organizationResolutions"))
        .where("userId", "==", userId),
      "organizationResolutions",
    );
  }
}

export class FirestoreOrganizationResolutionUnitOfWork
  implements OrganizationResolutionUnitOfWork
{
  constructor(private readonly db: Firestore) {}

  async selectExisting(
    commit: ExistingOrganizationResolutionCommit,
  ): Promise<void> {
    const resolutionRef = this.db.doc(
      firestoreDocumentPath("organizationResolutions", commit.resolution.id),
    );
    const lifecycleRef = this.db.doc(
      firestoreDocumentPath("accessJourneys", commit.lifecycle.id),
    );

    await this.db.runTransaction(async (transaction) => {
      const [resolutionSnapshot, lifecycleSnapshot] = await Promise.all([
        transaction.get(resolutionRef),
        transaction.get(lifecycleRef),
      ]);
      if (resolutionSnapshot.exists) {
        throw new Error("Organization resolution already exists.");
      }
      if (!lifecycleSnapshot.exists) {
        throw new Error("Organization resolution lifecycle no longer exists.");
      }
      const persistedLifecycle = lifecycleSnapshot.data();
      if (
        persistedLifecycle?.state !== "geography-selected" ||
        persistedLifecycle.userId !== commit.resolution.userId
      ) {
        throw new Error("Organization resolution lifecycle changed concurrently.");
      }
      create(
        transaction,
        resolutionRef,
        "organizationResolutions",
        commit.resolution,
        "append-only",
      );
      transaction.set(
        lifecycleRef,
        saveLifecyclePayload(commit.lifecycle, persistedLifecycle.createdAt),
      );
    });
  }

  async createNew(commit: NewOrganizationResolutionCommit): Promise<void> {
    const accountRef = this.db.doc(
      firestoreDocumentPath("organizations", commit.account.id),
    );
    const profileRef = this.db.doc(
      firestoreDocumentPath("organizationProfiles", commit.profile.id),
    );
    const discoveryRef = this.db.doc(
      firestoreDocumentPath("organizationDiscoveryRecords", commit.discovery.id),
    );
    const resolutionRef = this.db.doc(
      firestoreDocumentPath("organizationResolutions", commit.resolution.id),
    );
    const lifecycleRef = this.db.doc(
      firestoreDocumentPath("accessJourneys", commit.lifecycle.id),
    );
    const entityKeyRefs = commit.entityKeys.map((key) =>
      Object.freeze({
        key,
        ref: this.db.doc(
          firestoreDocumentPath("organizationEntityKeys", key.id),
        ),
      }),
    );

    await this.db.runTransaction(async (transaction) => {
      const snapshots = await Promise.all([
        transaction.get(accountRef),
        transaction.get(profileRef),
        transaction.get(discoveryRef),
        transaction.get(resolutionRef),
        transaction.get(lifecycleRef),
        ...entityKeyRefs.map((entry) => transaction.get(entry.ref)),
      ]);
      if (snapshots.slice(0, 4).some((snapshot) => snapshot.exists)) {
        throw new Error("New organization resolution identity already exists.");
      }
      const lifecycleSnapshot = snapshots[4];
      const persistedLifecycle = lifecycleSnapshot?.data();
      if (
        !lifecycleSnapshot?.exists ||
        persistedLifecycle?.state !== "geography-selected" ||
        persistedLifecycle.userId !== commit.resolution.userId
      ) {
        throw new Error("Organization resolution lifecycle changed concurrently.");
      }
      const conflicts = snapshots
        .slice(5)
        .filter((snapshot) => snapshot.exists)
        .map((snapshot) => snapshot.data()?.organizationId)
        .filter(
          (organizationId): organizationId is OrganizationId =>
            typeof organizationId === "string" &&
            organizationId !== commit.account.id,
        );
      if (conflicts.length > 0) {
        throw new OrganizationEntityKeyConflictError(conflicts);
      }

      create(transaction, accountRef, "organizations", commit.account, "mutable");
      create(
        transaction,
        profileRef,
        "organizationProfiles",
        commit.profile,
        "mutable",
      );
      create(
        transaction,
        discoveryRef,
        "organizationDiscoveryRecords",
        commit.discovery,
        "mutable",
      );
      create(
        transaction,
        resolutionRef,
        "organizationResolutions",
        commit.resolution,
        "append-only",
      );
      for (const entry of entityKeyRefs) {
        if (snapshots[5 + entityKeyRefs.indexOf(entry)]?.exists) continue;
        create(
          transaction,
          entry.ref,
          "organizationEntityKeys",
          entry.key,
          "append-only",
        );
      }
      transaction.set(
        lifecycleRef,
        saveLifecyclePayload(commit.lifecycle, persistedLifecycle.createdAt),
      );
    });
  }
}

export function createFirestoreOrganizationResolutionRepositories(
  db: Firestore,
): OrganizationResolutionRepositories {
  return Object.freeze({
    discovery: new FirestoreOrganizationDiscoveryRepository(db),
    resolutions: new FirestoreOrganizationResolutionRepository(db),
    unitOfWork: new FirestoreOrganizationResolutionUnitOfWork(db),
  });
}
