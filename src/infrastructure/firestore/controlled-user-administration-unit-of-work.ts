import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type {
  ControlledUserAdministrationMutation,
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

function location(mutation: ControlledUserAdministrationMutation): Readonly<{
  key: FirestoreCollectionKey;
  id: string;
}> {
  if (mutation.kind === "invitation") return { key: "organizationUserInvitations", id: mutation.record.id };
  if (mutation.kind === "membership") return { key: "organizationMemberships", id: mutation.record.id };
  if (mutation.kind === "authorization") return { key: "organizationAuthorizations", id: mutation.record.membershipId };
  return { key: "accessRestrictions", id: mutation.record.id };
}

export class FirestoreControlledUserAdministrationUnitOfWork
  implements ControlledUserAdministrationUnitOfWork
{
  constructor(private readonly db: Firestore) {}

  async commit(input: Readonly<{
    mutation: ControlledUserAdministrationMutation;
    auditEvent: PlatformAdministrativeAuditEvent;
  }>): Promise<void> {
    const target = location(input.mutation);
    const stateRef = this.db.doc(firestoreDocumentPath(target.key, target.id));
    const auditRef = this.db.collection(PLATFORM_ADMIN_AUDIT_COLLECTION).doc(input.auditEvent.id);

    await this.db.runTransaction(async (transaction) => {
      const [stateSnapshot, auditSnapshot] = await Promise.all([
        transaction.get(stateRef),
        transaction.get(auditRef),
      ]);
      if (auditSnapshot.exists) throw new Error(`Platform admin audit event already exists: ${input.auditEvent.id}.`);
      if (input.mutation.mode === "create" && stateSnapshot.exists) {
        throw new Error(`Controlled user administration create target already exists: ${target.id}.`);
      }
      if (input.mutation.mode === "update" && !stateSnapshot.exists) {
        throw new Error(`Controlled user administration update target does not exist: ${target.id}.`);
      }

      const statePayload = {
        ...input.mutation.record,
        schemaVersion: FIRESTORE_SCHEMA_VERSION,
        createdAt: input.mutation.mode === "create"
          ? FieldValue.serverTimestamp()
          : stateSnapshot.data()?.createdAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (input.mutation.mode === "create") transaction.create(stateRef, statePayload);
      else transaction.set(stateRef, statePayload);

      transaction.create(auditRef, {
        schemaVersion: PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION,
        ...input.auditEvent,
      });
    });
  }
}
