import type { FirestoreCollectionKey } from "./schema";

export type FirestoreEqualityFilter = Readonly<{
  field: string;
  operator: "==";
}>;

export interface FirestoreQueryContract {
  readonly name: string;
  readonly collection: FirestoreCollectionKey;
  readonly filters: readonly FirestoreEqualityFilter[];
  readonly cardinality: "zero-or-one" | "many";
  /** INF-005 materializes indexes only where these approved query shapes require them. */
  readonly compositeIndexCandidate: boolean;
}

const contract = (
  name: string,
  collection: FirestoreCollectionKey,
  fields: readonly string[],
  cardinality: FirestoreQueryContract["cardinality"],
): FirestoreQueryContract =>
  Object.freeze({
    name,
    collection,
    filters: Object.freeze(fields.map((field) => Object.freeze({ field, operator: "==" as const }))),
    cardinality,
    compositeIndexCandidate: fields.length > 1,
  });

/**
 * Approved INF-002 Firestore query shapes. INF-005 uses this inventory to create the minimum
 * required composite indexes rather than speculating about future access patterns.
 */
export const FIRESTORE_QUERY_CONTRACTS: readonly FirestoreQueryContract[] = Object.freeze([
  contract("organization-profile-by-organization", "organizationProfiles", ["organizationId"], "zero-or-one"),
  contract("user-by-primary-email", "users", ["primaryEmail"], "zero-or-one"),
  contract("user-by-login", "users", ["login.provider", "login.subject"], "zero-or-one"),
  contract("memberships-by-user", "organizationMemberships", ["userId"], "many"),
  contract("active-memberships-by-user", "organizationMemberships", ["userId", "status"], "many"),
  contract("memberships-by-organization", "organizationMemberships", ["organizationId"], "many"),
  contract("authorizations-by-user", "organizationAuthorizations", ["userId"], "many"),
  contract("authorizations-by-organization", "organizationAuthorizations", ["organizationId"], "many"),
  contract("audit-events-by-organization", "organizationAuditEvents", ["organizationId"], "many"),
  contract("audit-events-by-user", "organizationAuditEvents", ["actor.userId"], "many"),
  contract("audit-events-by-membership", "organizationAuditEvents", ["actor.membershipId"], "many"),
  contract("restriction-by-organization", "accessRestrictions", ["target.kind", "target.organizationId"], "zero-or-one"),
  contract("restriction-by-membership", "accessRestrictions", ["target.kind", "target.membershipId"], "zero-or-one"),
  contract("legal-document-by-kind-version", "legalDocumentVersions", ["kind", "version"], "zero-or-one"),
  contract("legal-documents-by-kind", "legalDocumentVersions", ["kind"], "many"),
  contract("legal-acknowledgements-by-user", "legalAcknowledgements", ["userId"], "many"),
  contract("legal-acknowledgements-by-membership", "legalAcknowledgements", ["membershipId"], "many"),
  contract("legal-acknowledgements-by-organization", "legalAcknowledgements", ["organizationId"], "many"),
  contract("legal-acknowledgements-by-version", "legalAcknowledgements", ["documentVersionId"], "many"),
  contract("authority-representations-by-organization", "organizationAuthorityRepresentations", ["organizationId"], "many"),
  contract("authority-representations-by-user", "organizationAuthorityRepresentations", ["userId"], "many"),
  contract("authority-representations-by-membership", "organizationAuthorityRepresentations", ["membershipId"], "many"),
  contract("platform-changes-by-actor", "platformChangeDirectives", ["actorId"], "many"),
  contract("platform-changes-by-target-kind", "platformChangeDirectives", ["targetKind"], "many"),
  contract("retention-policies-by-key", "retentionPolicies", ["policyKey"], "many"),
  contract("retention-assignments-by-record", "retentionAssignments", ["record.recordId"], "many"),
  contract("admin-grants-by-administrator", "adminPermissionGrants", ["administratorId"], "many"),
]);

export const FIRESTORE_COMPOSITE_INDEX_CANDIDATES = Object.freeze(
  FIRESTORE_QUERY_CONTRACTS.filter((query) => query.compositeIndexCandidate),
);
