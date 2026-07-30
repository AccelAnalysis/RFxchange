import {
  FieldValue,
  type DocumentData,
  type Firestore,
} from "firebase-admin/firestore";

import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  EssentialOrganizationProfile,
  OrganizationProfileCompletion,
} from "../../domain/organization-profile/model.ts";
import type {
  EssentialOrganizationProfileRepositories,
  EssentialOrganizationProfileUnitOfWork,
  OrganizationProfileCompletionRepository,
} from "../../domain/organization-profile/repository.ts";
import {
  FIRESTORE_SCHEMA_VERSION,
  firestoreDocumentPath,
} from "./schema.ts";
import { getFirestoreRecordById } from "./support.ts";

function mutableCreate(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function mutableUpdate(record: object, createdAt: unknown): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function appendOnly(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
  };
}

function normalizedTimestamp(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return null;
}

export class FirestoreOrganizationProfileCompletionRepository
  implements OrganizationProfileCompletionRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  getByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrganizationProfileCompletion | null> {
    return getFirestoreRecordById<OrganizationProfileCompletion>(
      this.db,
      "organizationProfileCompletions",
      organizationId,
    );
  }
}

export class FirestoreEssentialOrganizationProfileUnitOfWork
  implements EssentialOrganizationProfileUnitOfWork {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async save(
    input: Parameters<EssentialOrganizationProfileUnitOfWork["save"]>[0],
  ): Promise<void> {
    const profileRef = this.db.doc(
      firestoreDocumentPath("organizationProfiles", input.profile.id),
    );
    const completionRef = this.db.doc(
      firestoreDocumentPath(
        "organizationProfileCompletions",
        input.completion.id,
      ),
    );
    const eventRef = this.db.doc(
      firestoreDocumentPath("organizationProfileEvents", input.event.id),
    );
    const auditRef = this.db.doc(
      firestoreDocumentPath("organizationAuditEvents", input.auditEvent.id),
    );
    await this.db.runTransaction(async (transaction) => {
      const [profileSnapshot, completionSnapshot, eventSnapshot, auditSnapshot] =
        await Promise.all([
          transaction.get(profileRef),
          transaction.get(completionRef),
          transaction.get(eventRef),
          transaction.get(auditRef),
        ]);
      if (!profileSnapshot.exists) {
        throw new Error("Durable organization profile no longer exists.");
      }
      const currentProfile = profileSnapshot.data() as
        | EssentialOrganizationProfile
        | undefined;
      if (
        currentProfile?.organizationId !== input.profile.organizationId ||
        normalizedTimestamp(currentProfile.updatedAt) !==
          input.expectedProfileUpdatedAt
      ) {
        throw new Error("Organization profile changed before the update committed.");
      }
      if (eventSnapshot.exists || auditSnapshot.exists) {
        throw new Error("Organization profile event or audit identity already exists.");
      }
      if (
        input.completion.organizationId !== input.profile.organizationId ||
        input.completion.profileId !== input.profile.id ||
        input.event.organizationId !== input.profile.organizationId ||
        input.event.profileId !== input.profile.id ||
        input.auditEvent.organizationId !== input.profile.organizationId
      ) {
        throw new Error("Organization profile persistence inputs have mismatched scope.");
      }
      transaction.set(
        profileRef,
        mutableUpdate(input.profile, profileSnapshot.data()?.createdAt),
      );
      transaction.set(
        completionRef,
        completionSnapshot.exists
          ? mutableUpdate(
              input.completion,
              completionSnapshot.data()?.createdAt,
            )
          : mutableCreate(input.completion),
      );
      transaction.create(eventRef, appendOnly(input.event));
      transaction.create(auditRef, appendOnly(input.auditEvent));
    });
  }
}

export function createFirestoreEssentialOrganizationProfileRepositories(
  db: Firestore,
): EssentialOrganizationProfileRepositories {
  return Object.freeze({
    completions: new FirestoreOrganizationProfileCompletionRepository(db),
    unitOfWork: new FirestoreEssentialOrganizationProfileUnitOfWork(db),
  });
}
