import type { FirestoreCollectionKey } from "./schema";

export type FirestoreEqualityFilter = Readonly<{
  field: string;
  operator: "==";
}>;

export type FirestoreIndexStrategy =
  | "automatic-single-field"
  | "automatic-equality-merge"
  | "manual-composite";

export interface FirestoreQueryContract {
  readonly name: string;
  readonly collection: FirestoreCollectionKey;
  readonly filters: readonly FirestoreEqualityFilter[];
  readonly cardinality: "zero-or-one" | "many";
  /**
   * INF-005 records the index decision for every approved query shape.
   * Equality-only queries remain on Firestore automatic indexes; manual composite
   * indexes are reserved for query shapes that actually require them.
   */
  readonly indexStrategy: FirestoreIndexStrategy;
}

function equalityIndexStrategy(fields: readonly string[]): FirestoreIndexStrategy {
  return fields.length > 1 ? "automatic-equality-merge" : "automatic-single-field";
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
    indexStrategy: equalityIndexStrategy(fields),
  });

/**
 * Approved Firestore query shapes and their INF-005 index decisions.
 *
 * Firestore automatic indexes support single equality filters and can merge
 * automatic indexes for compound equality filters. A future range, inequality,
 * array-plus-clause, or sort query must extend this contract model and explicitly
 * declare the manual index it needs before being accepted into the repository layer.
 */
export const FIRESTORE_QUERY_CONTRACTS: readonly FirestoreQueryContract[] = Object.freeze([
  contract("organization-profile-by-organization", "organizationProfiles", ["organizationId"], "zero-or-one"),
  contract("organization-discovery-by-organization", "organizationDiscoveryRecords", ["organizationId"], "zero-or-one"),
  contract("organization-discovery-by-geography", "organizationDiscoveryRecords", ["geographyId.value"], "many"),
  contract("organization-resolution-by-journey", "organizationResolutions", ["accessJourneyId"], "zero-or-one"),
  contract("organization-resolutions-by-user", "organizationResolutions", ["userId"], "many"),
  contract("authority-claims-by-organization", "organizationAuthorityClaims", ["organizationId"], "many"),
  contract("authority-claims-by-user", "organizationAuthorityClaims", ["userId"], "many"),
  contract("authority-claims-by-status", "organizationAuthorityClaims", ["status"], "many"),
  contract("authority-claims-by-geography", "organizationAuthorityClaims", ["geographyId"], "many"),
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
  contract("geography-authorizations-by-user-and-geography", "geographyParticipationAuthorizations", ["subject.kind", "subject.userId", "geographyId"], "many"),
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
  contract("background-job-events-by-job", "backgroundJobEvents", ["jobId"], "many"),
  contract("referrals-by-sending-organization", "businessReferrals", ["senderOrganizationId"], "many"),
  contract("referrals-by-recipient-organization", "businessReferrals", ["attachedRecipientOrganizationId"], "many"),
  contract("referral-education-by-organization-actor", "referralEducationAcknowledgements", ["organizationId", "actorUserId"], "many"),
  contract("opportunity-saved-searches-by-owner", "opportunitySavedSearches", ["organizationId", "userId"], "many"),
  contract("active-opportunity-saved-searches", "opportunitySavedSearches", ["status"], "many"),
  contract("opportunity-watches-by-owner", "opportunityWatches", ["organizationId", "userId"], "many"),
]);

export const FIRESTORE_AUTOMATIC_INDEX_CONTRACTS = Object.freeze(
  FIRESTORE_QUERY_CONTRACTS.filter((query) => query.indexStrategy !== "manual-composite"),
);

/**
 * The list is intentionally empty for the current equality-only query set.
 * Future repository queries that require manual indexes must declare them here before merge.
 */
export const FIRESTORE_MANUAL_INDEX_CONTRACTS = Object.freeze(
  FIRESTORE_QUERY_CONTRACTS.filter((query) => query.indexStrategy === "manual-composite"),
);
