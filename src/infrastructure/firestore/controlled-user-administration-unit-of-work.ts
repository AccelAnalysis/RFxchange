import { FieldValue, type DocumentReference, type Firestore } from "firebase-admin/firestore";

import type {
  ControlledUserAdministrationStateMutation,
  ControlledUserAdministrationUnitOfWork,
} from "../../domain/admin-authorization/controlled-user-administration-repository.ts";
import type { PlatformAdministrativeAuditEvent } from "../../domain/admin-authorization/admin-audit.ts";
import {
  PLATFORM_ADMIN_AUDIT_COLLECTION,
  PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION,
} from "./platform-admin-audit-repository.ts";
import {
  FIRESTORE_SCHEMA_VERSION,
  firestoreDocumentPath,
  type FirestoreCollectionKey,
} from "./schema.ts";

function auditPayload(event: PlatformAdministrativeAuditEvent): object {
  return { schemaVersion: PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION, ...event };
}

function mutationLocation(mutation: ControlledUserAdministrationStateMutation): Readonly<{
  key: FirestoreCollectionKey;
  id: string;
}> {
  if (mutation.kind === "invitation") {
    return Object.freeze({ key: "organizationUserInvitations" as const, id: mutation.record.id });
  }
  if (mutation.kind === "membership") {
    return Object.freeze({ key: "organizationMemberships" as const, id: mutation.record.id });
  }
  if (mutation.kind === "authorization") {
    return Object.freeze({ key: "organizationAuthorizations" as const, id: mutation.record.membershipId });
  }
  return Object.freeze({ key: "accessRestrictions" as const, id: mutation.record.id });
}

function mutablePayload(record: object, createdAt: unknown): object {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function assertCreateOrUpdateContract(
  mutation: ControlledUserAdministrationStateMutation,
  exists: boolean,
): void {
  if (mutation.mode === "create" && exists) {
    throw new Error(`Controlled user administration create target already exists: ${mutationLocation(mutation).id}.`);
  }
  if (mutation.mode === "update" && !exists) {
    throw new Error(`Controlled user administration update target does not exist: ${mutationLocation(mutation).id}.`);
  }
}

export class FirestoreControlledUserAdministrationUnitOfWork
  implements ControlledUserAdministrationUnitOfWork
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async commit(input: Readonly<{
    mutation: ControlledUserAdministrationStateMutation;
    auditEvent: PlatformAdministrativeAuditEvent;
  }>): Promise<void> {
    const location = mutationLocation(input.mutation);
    const stateRef: DocumentReference = this.db.doc(firestoreDocumentPath(location.key, location.id));
    const auditRef = this.db.collection(PLATFORM_ADMIN_AUDIT_COLLECTION).doc(input.auditEvent.id);

    await this.db.runTransaction(async (transaction) => {
      const [stateSnapshot, auditSnapshot] = await Promise.all([
        transaction.get(stateRef),
        transaction.get(auditRef),
      ]);
      if (auditSnapshot.exists) {
        throw new Error(`Platform admin audit event already exists: ${input.auditEvent.id}.`);
      }
      assertCreateOrUpdateContract(input.mutation, stateSnapshot.exists);

      const createdAt = input.mutation.mode === "create"
        ? FieldValue.serverTimestamp()
        : stateSnapshot.data()?.createdAt ?? FieldValue.serverTimestamp();
      const payload = mutablePayload(input.mutation.record, createdAt);
      if (input.mutation.mode === "create") {
        transaction.create(stateRef, payload);
      } else {
        transaction.set(stateRef, payload);
      }
      transaction.create(auditRef, auditPayload(input.auditEvent));
    });
  }
}
