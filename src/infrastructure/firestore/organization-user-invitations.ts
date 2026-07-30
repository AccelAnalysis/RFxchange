import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type {
  OrganizationInvitationAcceptanceCommit,
  OrganizationInvitationAcceptanceUnitOfWork,
  OrganizationUserInvitationRepository,
} from "../../domain/organization-invitations/repository.ts";
import type {
  OrganizationUserInvitation,
  OrganizationUserInvitationId,
} from "../../domain/organization-invitations/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import {
  FIRESTORE_SCHEMA_VERSION,
  firestoreCollectionName,
  firestoreDocumentPath,
} from "./schema.ts";
import {
  createMutableFirestoreRecord,
  getFirestoreRecordById,
  listFirestoreRecords,
  saveMutableFirestoreRecord,
} from "./support.ts";

export class FirestoreOrganizationUserInvitationRepository
  implements OrganizationUserInvitationRepository
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  getById(id: OrganizationUserInvitationId): Promise<OrganizationUserInvitation | null> {
    return getFirestoreRecordById<OrganizationUserInvitation>(
      this.db,
      "organizationUserInvitations",
      id,
    );
  }

  listByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<readonly OrganizationUserInvitation[]> {
    return listFirestoreRecords<OrganizationUserInvitation>(
      this.db
        .collection(firestoreCollectionName("organizationUserInvitations"))
        .where("organizationId", "==", organizationId),
      "organizationUserInvitations",
    );
  }

  async findPendingByOrganizationAndEmail(
    organizationId: OrganizationId,
    email: string,
  ): Promise<OrganizationUserInvitation | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const invitations = await this.listByOrganizationId(organizationId);
    return (
      invitations.find(
        (invitation) =>
          invitation.status === "pending" && invitation.email === normalizedEmail,
      ) ?? null
    );
  }

  create(invitation: OrganizationUserInvitation): Promise<void> {
    return createMutableFirestoreRecord(
      this.db,
      "organizationUserInvitations",
      invitation.id,
      invitation,
    );
  }

  save(invitation: OrganizationUserInvitation): Promise<void> {
    return saveMutableFirestoreRecord(
      this.db,
      "organizationUserInvitations",
      invitation.id,
      invitation,
    );
  }
}

function mutablePayload(record: object, createdAt: unknown): object {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function appendOnlyPayload(record: object): object {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
  };
}

/**
 * Makes invitation acceptance visible atomically: accepted invitation + organization membership +
 * membership authorization + individual legal acknowledgement evidence either all commit or none do.
 */
export class FirestoreOrganizationInvitationAcceptanceUnitOfWork
  implements OrganizationInvitationAcceptanceUnitOfWork
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async commitAcceptance(input: OrganizationInvitationAcceptanceCommit): Promise<void> {
    const invitationRef = this.db.doc(
      firestoreDocumentPath("organizationUserInvitations", input.invitation.id),
    );
    const membershipRef = this.db.doc(
      firestoreDocumentPath("organizationMemberships", input.membership.id),
    );
    const authorizationRef = this.db.doc(
      firestoreDocumentPath("organizationAuthorizations", input.authorization.membershipId),
    );
    const legalRefs = input.legalAcknowledgements.map((record) =>
      this.db.doc(firestoreDocumentPath("legalAcknowledgements", record.id)),
    );

    await this.db.runTransaction(async (transaction) => {
      const [storedInvitation, existingMembership, existingAuthorization, ...existingLegal] =
        await Promise.all([
          transaction.get(invitationRef),
          transaction.get(membershipRef),
          transaction.get(authorizationRef),
          ...legalRefs.map((ref) => transaction.get(ref)),
        ]);

      if (!storedInvitation.exists) throw new Error("Organization invitation no longer exists.");
      const stored = storedInvitation.data();
      if (
        stored?.status !== "pending" ||
        stored.organizationId !== input.invitation.organizationId ||
        stored.email !== input.invitation.email
      ) {
        throw new Error("Organization invitation changed or is no longer pending.");
      }
      if (input.invitation.status !== "accepted") {
        throw new Error("Acceptance unit of work requires an accepted invitation plan.");
      }
      if (input.invitation.acceptedByUserId !== input.acceptedByUserId) {
        throw new Error("Accepted invitation user does not match the authenticated acceptance user.");
      }
      if (
        input.membership.organizationId !== input.invitation.organizationId ||
        input.membership.userId !== input.acceptedByUserId ||
        input.authorization.organizationId !== input.invitation.organizationId ||
        input.authorization.userId !== input.acceptedByUserId ||
        input.authorization.membershipId !== input.membership.id
      ) {
        throw new Error("Invitation acceptance records do not share one user, membership and organization context.");
      }
      if (existingMembership.exists || existingAuthorization.exists || existingLegal.some((doc) => doc.exists)) {
        throw new Error("Invitation acceptance target records already exist.");
      }
      if (
        input.legalAcknowledgements.some(
          (record) =>
            record.organizationId !== input.invitation.organizationId ||
            record.userId !== input.acceptedByUserId ||
            record.membershipId !== input.membership.id,
        )
      ) {
        throw new Error("Invitation legal acknowledgements do not match the accepted membership context.");
      }

      transaction.set(
        invitationRef,
        mutablePayload(input.invitation, stored?.createdAt ?? FieldValue.serverTimestamp()),
      );
      transaction.create(
        membershipRef,
        mutablePayload(input.membership, FieldValue.serverTimestamp()),
      );
      transaction.create(
        authorizationRef,
        mutablePayload(input.authorization, FieldValue.serverTimestamp()),
      );
      input.legalAcknowledgements.forEach((record, index) => {
        transaction.create(legalRefs[index], appendOnlyPayload(record));
      });
    });
  }
}
