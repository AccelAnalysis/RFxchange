export const FIRESTORE_SCHEMA_VERSION = 1 as const;

export const FIRESTORE_COLLECTIONS = {
  organizations: "organizations",
  organizationProfiles: "organizationProfiles",
  organizationDiscoveryRecords: "organizationDiscoveryRecords",
  organizationResolutions: "organizationResolutions",
  organizationEntityKeys: "organizationEntityKeys",
  users: "users",
  organizationMemberships: "organizationMemberships",
  organizationAuthorizations: "organizationAuthorizations",
  organizationUserInvitations: "organizationUserInvitations",
  organizationAuditEvents: "organizationAuditEvents",
  geographies: "geographies",
  primaryGeographySelections: "primaryGeographySelections",
  geographyParticipationAuthorizations: "geographyParticipationAuthorizations",
  accessJourneys: "accessJourneys",
  accessRestrictions: "accessRestrictions",
  legalDocumentVersions: "legalDocumentVersions",
  legalAcknowledgements: "legalAcknowledgements",
  organizationAuthorityRepresentations: "organizationAuthorityRepresentations",
  platformChangeDirectives: "platformChangeDirectives",
  retentionPolicies: "retentionPolicies",
  retentionAssignments: "retentionAssignments",
  adminAuthorityContexts: "adminAuthorityContexts",
  adminPermissionGrants: "adminPermissionGrants",
  backgroundJobs: "backgroundJobs",
  backgroundJobEvents: "backgroundJobEvents",
} as const;

export type FirestoreCollectionKey = keyof typeof FIRESTORE_COLLECTIONS;
export type FirestoreCollectionName = (typeof FIRESTORE_COLLECTIONS)[FirestoreCollectionKey];
export type FirestoreRecordScope =
  | "organization-root"
  | "organization-scoped"
  | "user-scoped"
  | "platform-scoped"
  | "mixed-scope";

export interface FirestoreCollectionConvention {
  readonly collection: FirestoreCollectionName;
  readonly documentIdSource:
    | "id"
    | "membershipId"
    | "administratorId"
    | "userId";
  readonly scope: FirestoreRecordScope;
  readonly organizationIdRequired: boolean;
  readonly appendOnly: boolean;
  readonly mutable: boolean;
}

/**
 * Canonical mapping from current RFxchange persistence ports to Firestore collections.
 * These conventions contain no Firebase SDK types and do not implement adapters.
 */
export const FIRESTORE_COLLECTION_CONVENTIONS: Readonly<
  Record<FirestoreCollectionKey, FirestoreCollectionConvention>
> = Object.freeze({
  organizations: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizations,
    documentIdSource: "id",
    scope: "organization-root",
    organizationIdRequired: false,
    appendOnly: false,
    mutable: true,
  }),
  organizationProfiles: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationProfiles,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  organizationDiscoveryRecords: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationDiscoveryRecords,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  organizationResolutions: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationResolutions,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
  }),
  organizationEntityKeys: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationEntityKeys,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
  }),
  users: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.users,
    documentIdSource: "id",
    scope: "user-scoped",
    organizationIdRequired: false,
    appendOnly: false,
    mutable: true,
  }),
  organizationMemberships: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationMemberships,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  organizationAuthorizations: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationAuthorizations,
    documentIdSource: "membershipId",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  organizationUserInvitations: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationUserInvitations,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  organizationAuditEvents: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationAuditEvents,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
  }),
  geographies: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.geographies,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: false,
    mutable: true,
  }),
  primaryGeographySelections: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.primaryGeographySelections,
    documentIdSource: "userId",
    scope: "user-scoped",
    organizationIdRequired: false,
    appendOnly: false,
    mutable: true,
  }),
  geographyParticipationAuthorizations: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.geographyParticipationAuthorizations,
    documentIdSource: "id",
    scope: "mixed-scope",
    organizationIdRequired: false,
    appendOnly: false,
    mutable: true,
  }),
  accessJourneys: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.accessJourneys,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: false,
    mutable: true,
  }),
  accessRestrictions: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.accessRestrictions,
    documentIdSource: "id",
    scope: "mixed-scope",
    organizationIdRequired: false,
    appendOnly: false,
    mutable: true,
  }),
  legalDocumentVersions: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.legalDocumentVersions,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
  legalAcknowledgements: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.legalAcknowledgements,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
  }),
  organizationAuthorityRepresentations: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationAuthorityRepresentations,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
  }),
  platformChangeDirectives: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.platformChangeDirectives,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
  retentionPolicies: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.retentionPolicies,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
  retentionAssignments: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.retentionAssignments,
    documentIdSource: "id",
    scope: "mixed-scope",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
  adminAuthorityContexts: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.adminAuthorityContexts,
    documentIdSource: "administratorId",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: false,
    mutable: true,
  }),
  adminPermissionGrants: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.adminPermissionGrants,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
  backgroundJobs: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.backgroundJobs,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: false,
    mutable: true,
  }),
  backgroundJobEvents: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.backgroundJobEvents,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
});

export const FIRESTORE_SYSTEM_FIELDS = Object.freeze({
  schemaVersion: "schemaVersion",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  organizationId: "organizationId",
});

export interface FirestorePersistenceMetadata {
  readonly schemaVersion: typeof FIRESTORE_SCHEMA_VERSION;
  /** Server-assigned Firestore timestamp at initial persistence. */
  readonly createdAt: "server-timestamp";
  /** Server-assigned Firestore timestamp on mutable record updates; absent on append-only records. */
  readonly updatedAt?: "server-timestamp";
}

function stableDocumentId(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error("Firestore document id is required.");
  if (normalized.includes("/")) throw new Error("Firestore document id cannot contain a slash.");
  if (normalized === "." || normalized === "..") {
    throw new Error("Firestore document id cannot be . or ...");
  }
  return normalized;
}

export function firestoreCollectionName(key: FirestoreCollectionKey): FirestoreCollectionName {
  return FIRESTORE_COLLECTIONS[key];
}

export function firestoreDocumentPath(key: FirestoreCollectionKey, id: string): string {
  return `${firestoreCollectionName(key)}/${stableDocumentId(id)}`;
}

export function assertOrganizationScopedFirestoreRecord(
  key: FirestoreCollectionKey,
  organizationId: string | null | undefined,
): void {
  const convention = FIRESTORE_COLLECTION_CONVENTIONS[key];
  if (!convention.organizationIdRequired) return;

  if (!organizationId?.trim()) {
    throw new Error(`${convention.collection} records require an explicit organizationId.`);
  }
}

/**
 * Firestore foreign relationships are stored as stable IDs, not DocumentReference values.
 * This keeps domain records provider-independent and makes tenant/security query predicates explicit.
 */
export const FIRESTORE_REFERENCE_POLICY = "stable-id-fields-not-document-references" as const;

/** Composite indexes are materialized only from approved query contracts. */
export const FIRESTORE_INDEX_POLICY = "query-contract-driven-composite-indexes" as const;
