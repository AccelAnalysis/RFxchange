import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { OrganizationAccessAdministrationUnitOfWork } from "../../domain/admin-authorization/organization-access-admin-repository.ts";
import type { PlatformAdministrativeAuditEvent } from "../../domain/admin-authorization/admin-audit.ts";
import type { OrganizationRoleBundle } from "../../domain/authorization/organization-role-bundles.ts";
import type { OrganizationMembership } from "../../domain/users/model.ts";
import type { OrganizationUserAuthorization } from "../../domain/authorization/model.ts";
import { PLATFORM_ADMIN_AUDIT_COLLECTION, PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION } from "./platform-admin-audit-repository.ts";
import { ORGANIZATION_ROLE_BUNDLE_COLLECTION, ORGANIZATION_ROLE_BUNDLE_SCHEMA_VERSION } from "./organization-role-bundle-repository.ts";
import { FIRESTORE_SCHEMA_VERSION, firestoreDocumentPath } from "./schema.ts";

function auditPayload(event: PlatformAdministrativeAuditEvent): object {
  return { schemaVersion: PLATFORM_ADMIN_AUDIT_SCHEMA_VERSION, ...event };
}

function roleBundlePayload(bundle: OrganizationRoleBundle): object {
  return {
    schemaVersion: ORGANIZATION_ROLE_BUNDLE_SCHEMA_VERSION,
    key: bundle.key,
    displayName: bundle.displayName,
    description: bundle.description,
    permissions: [...bundle.permissions],
    createdAt: bundle.createdAt,
    updatedAt: bundle.updatedAt,
  };
}

function mutablePayload(
  record: OrganizationMembership | OrganizationUserAuthorization,
  existingCreatedAt: unknown,
): object {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: existingCreatedAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export class FirestoreOrganizationAccessAdministrationUnitOfWork
  implements OrganizationAccessAdministrationUnitOfWork
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async saveMembershipAccess(input: Readonly<{
    membership?: OrganizationMembership;
    authorization?: OrganizationUserAuthorization;
    auditEvent: PlatformAdministrativeAuditEvent;
  }>): Promise<void> {
    if (!input.membership && !input.authorization) {
      throw new Error("Organization access administration requires membership or authorization state to change.");
    }

    await this.db.runTransaction(async (transaction) => {
      const auditRef = this.db.collection(PLATFORM_ADMIN_AUDIT_COLLECTION).doc(input.auditEvent.id);
      const membershipRef = input.membership
        ? this.db.doc(firestoreDocumentPath("organizationMemberships", input.membership.id))
        : null;
      const authorizationRef = input.authorization
        ? this.db.doc(
            firestoreDocumentPath("organizationAuthorizations", input.authorization.membershipId),
          )
        : null;

      const [auditSnapshot, membershipSnapshot, authorizationSnapshot] = await Promise.all([
        transaction.get(auditRef),
        membershipRef ? transaction.get(membershipRef) : Promise.resolve(null),
        authorizationRef ? transaction.get(authorizationRef) : Promise.resolve(null),
      ]);

      if (auditSnapshot.exists) {
        throw new Error(`Platform admin audit event already exists: ${input.auditEvent.id}.`);
      }

      if (input.membership && membershipRef) {
        transaction.set(
          membershipRef,
          mutablePayload(input.membership, membershipSnapshot?.data()?.createdAt),
        );
      }

      if (input.authorization && authorizationRef) {
        transaction.set(
          authorizationRef,
          mutablePayload(input.authorization, authorizationSnapshot?.data()?.createdAt),
        );
      }

      transaction.create(auditRef, auditPayload(input.auditEvent));
    });
  }

  async saveRoleBundle(input: Readonly<{
    bundle: OrganizationRoleBundle;
    auditEvent: PlatformAdministrativeAuditEvent;
  }>): Promise<void> {
    await this.db.runTransaction(async (transaction) => {
      const auditRef = this.db.collection(PLATFORM_ADMIN_AUDIT_COLLECTION).doc(input.auditEvent.id);
      const auditSnapshot = await transaction.get(auditRef);
      if (auditSnapshot.exists) {
        throw new Error(`Platform admin audit event already exists: ${input.auditEvent.id}.`);
      }
      const bundleRef = this.db.collection(ORGANIZATION_ROLE_BUNDLE_COLLECTION).doc(input.bundle.key);
      transaction.set(bundleRef, roleBundlePayload(input.bundle));
      transaction.create(auditRef, auditPayload(input.auditEvent));
    });
  }
}
