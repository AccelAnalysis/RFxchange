import {
  FieldValue,
  type DocumentData,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";

import type { GeographyId } from "../../domain/geography/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import type { UserId } from "../../domain/users/model.ts";
import type {
  OrganizationAuthorityClaim,
  OrganizationAuthorityClaimId,
  OrganizationAuthorityClaimStatus,
} from "../../domain/organization-claims/model.ts";
import type {
  OrganizationAuthorityClaimRepository,
  OrganizationAuthorityClaimUnitOfWork,
} from "../../domain/organization-claims/repository.ts";
import {
  FIRESTORE_SCHEMA_VERSION,
  firestoreCollectionName,
  firestoreDocumentPath,
} from "./schema.ts";
import {
  getFirestoreRecordById,
  listFirestoreRecords,
} from "./support.ts";

function appendOnly(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
  };
}

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

function createOptionalAudit(
  transaction: Transaction,
  db: Firestore,
  auditEvent: object | undefined,
): void {
  if (!auditEvent) return;
  const id = (auditEvent as { readonly id: string }).id;
  transaction.create(
    db.collection("platformAdministrativeAuditEvents").doc(id),
    appendOnly(auditEvent),
  );
}

export class FirestoreOrganizationAuthorityClaimRepository
  implements OrganizationAuthorityClaimRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  getById(id: OrganizationAuthorityClaimId): Promise<OrganizationAuthorityClaim | null> {
    return getFirestoreRecordById<OrganizationAuthorityClaim>(
      this.db,
      "organizationAuthorityClaims",
      id,
    );
  }

  listByOrganizationId(organizationId: OrganizationId): Promise<readonly OrganizationAuthorityClaim[]> {
    return listFirestoreRecords<OrganizationAuthorityClaim>(
      this.db.collection(firestoreCollectionName("organizationAuthorityClaims"))
        .where("organizationId", "==", organizationId),
      "organizationAuthorityClaims",
    );
  }

  listByUserId(userId: UserId): Promise<readonly OrganizationAuthorityClaim[]> {
    return listFirestoreRecords<OrganizationAuthorityClaim>(
      this.db.collection(firestoreCollectionName("organizationAuthorityClaims"))
        .where("userId", "==", userId),
      "organizationAuthorityClaims",
    );
  }

  listByStatus(status: OrganizationAuthorityClaimStatus): Promise<readonly OrganizationAuthorityClaim[]> {
    return listFirestoreRecords<OrganizationAuthorityClaim>(
      this.db.collection(firestoreCollectionName("organizationAuthorityClaims"))
        .where("status", "==", status),
      "organizationAuthorityClaims",
    );
  }

  listByGeographyId(geographyId: GeographyId): Promise<readonly OrganizationAuthorityClaim[]> {
    return listFirestoreRecords<OrganizationAuthorityClaim>(
      this.db.collection(firestoreCollectionName("organizationAuthorityClaims"))
        .where("geographyId", "==", geographyId),
      "organizationAuthorityClaims",
    );
  }

  async create(
    claim: OrganizationAuthorityClaim,
    event: Parameters<OrganizationAuthorityClaimRepository["create"]>[1],
  ): Promise<void> {
    const claimRef = this.db.doc(firestoreDocumentPath("organizationAuthorityClaims", claim.id));
    const eventRef = this.db.doc(firestoreDocumentPath("organizationAuthorityClaimEvents", event.id));
    await this.db.runTransaction(async (transaction) => {
      const [claimSnapshot, eventSnapshot] = await Promise.all([
        transaction.get(claimRef),
        transaction.get(eventRef),
      ]);
      if (claimSnapshot.exists || eventSnapshot.exists) {
        throw new Error("Organization authority claim identity already exists.");
      }
      transaction.create(claimRef, mutableCreate(claim));
      transaction.create(eventRef, appendOnly(event));
    });
  }
}

export class FirestoreOrganizationAuthorityClaimUnitOfWork
  implements OrganizationAuthorityClaimUnitOfWork {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async update(input: Parameters<OrganizationAuthorityClaimUnitOfWork["update"]>[0]): Promise<void> {
    const claimRef = this.db.doc(firestoreDocumentPath("organizationAuthorityClaims", input.claim.id));
    const eventRef = this.db.doc(firestoreDocumentPath("organizationAuthorityClaimEvents", input.event.id));
    const decisionRef = input.decision
      ? this.db.doc(firestoreDocumentPath("organizationAuthorityDecisions", input.decision.id))
      : null;
    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(claimRef);
      if (!snapshot.exists || snapshot.data()?.status !== input.event.fromStatus) {
        throw new Error("Organization authority claim changed concurrently.");
      }
      transaction.set(claimRef, mutableUpdate(input.claim, snapshot.data()?.createdAt));
      transaction.create(eventRef, appendOnly(input.event));
      if (decisionRef && input.decision) transaction.create(decisionRef, appendOnly(input.decision));
      createOptionalAudit(transaction, this.db, input.auditEvent);
    });
  }

  async approve(input: Parameters<OrganizationAuthorityClaimUnitOfWork["approve"]>[0]): Promise<void> {
    const claimRef = this.db.doc(firestoreDocumentPath("organizationAuthorityClaims", input.claim.id));
    const eventRef = this.db.doc(firestoreDocumentPath("organizationAuthorityClaimEvents", input.event.id));
    const decisionRef = this.db.doc(firestoreDocumentPath("organizationAuthorityDecisions", input.decision.id));
    const membershipRef = this.db.doc(firestoreDocumentPath("organizationMemberships", input.membership.id));
    const authorizationRef = this.db.doc(
      firestoreDocumentPath("organizationAuthorizations", input.authorization.membershipId),
    );
    const lifecycleRef = this.db.doc(firestoreDocumentPath("accessJourneys", input.lifecycle.id));
    await this.db.runTransaction(async (transaction) => {
      const [claimSnapshot, membershipSnapshot, authorizationSnapshot, lifecycleSnapshot] =
        await Promise.all([
          transaction.get(claimRef),
          transaction.get(membershipRef),
          transaction.get(authorizationRef),
          transaction.get(lifecycleRef),
        ]);
      if (!claimSnapshot.exists || claimSnapshot.data()?.status !== input.event.fromStatus) {
        throw new Error("Organization authority claim changed concurrently.");
      }
      if (membershipSnapshot.exists || authorizationSnapshot.exists) {
        throw new Error("Authority membership identity already exists.");
      }
      if (
        !lifecycleSnapshot.exists ||
        lifecycleSnapshot.data()?.state !== "organization-resolved" ||
        lifecycleSnapshot.data()?.userId !== input.claim.userId
      ) {
        throw new Error("Organization authority lifecycle changed concurrently.");
      }
      transaction.set(claimRef, mutableUpdate(input.claim, claimSnapshot.data()?.createdAt));
      transaction.create(eventRef, appendOnly(input.event));
      transaction.create(decisionRef, appendOnly(input.decision));
      transaction.create(membershipRef, mutableCreate(input.membership));
      transaction.create(authorizationRef, mutableCreate(input.authorization));
      transaction.set(
        lifecycleRef,
        mutableUpdate(input.lifecycle, lifecycleSnapshot.data()?.createdAt),
      );
      createOptionalAudit(transaction, this.db, input.auditEvent);
    });
  }

  async establishParticipantCreated(
    input: Parameters<OrganizationAuthorityClaimUnitOfWork["establishParticipantCreated"]>[0],
  ): Promise<void> {
    const membershipRef = this.db.doc(
      firestoreDocumentPath("organizationMemberships", input.membership.id),
    );
    const authorizationRef = this.db.doc(
      firestoreDocumentPath("organizationAuthorizations", input.authorization.membershipId),
    );
    const lifecycleRef = this.db.doc(
      firestoreDocumentPath("accessJourneys", input.lifecycle.id),
    );
    await this.db.runTransaction(async (transaction) => {
      const [membershipSnapshot, authorizationSnapshot, lifecycleSnapshot] = await Promise.all([
        transaction.get(membershipRef),
        transaction.get(authorizationRef),
        transaction.get(lifecycleRef),
      ]);
      if (membershipSnapshot.exists || authorizationSnapshot.exists) {
        throw new Error("Participant-created authority membership identity already exists.");
      }
      if (
        !lifecycleSnapshot.exists ||
        lifecycleSnapshot.data()?.state !== "organization-resolved" ||
        lifecycleSnapshot.data()?.userId !== input.membership.userId
      ) {
        throw new Error("Participant-created authority lifecycle changed concurrently.");
      }
      transaction.create(membershipRef, mutableCreate(input.membership));
      transaction.create(authorizationRef, mutableCreate(input.authorization));
      transaction.set(
        lifecycleRef,
        mutableUpdate(input.lifecycle, lifecycleSnapshot.data()?.createdAt),
      );
    });
  }
}

export function createFirestoreOrganizationAuthorityClaims(db: Firestore) {
  return Object.freeze({
    claims: new FirestoreOrganizationAuthorityClaimRepository(db),
    unitOfWork: new FirestoreOrganizationAuthorityClaimUnitOfWork(db),
  });
}
