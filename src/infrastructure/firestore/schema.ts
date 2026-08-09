export const FIRESTORE_SCHEMA_VERSION = 1 as const;

export const FIRESTORE_COLLECTIONS = {
  organizations: "organizations",
  organizationProfiles: "organizationProfiles",
  organizationDiscoveryRecords: "organizationDiscoveryRecords",
  organizationResolutions: "organizationResolutions",
  organizationEntityKeys: "organizationEntityKeys",
  organizationAuthorityClaims: "organizationAuthorityClaims",
  organizationAuthorityClaimEvents: "organizationAuthorityClaimEvents",
  organizationAuthorityDecisions: "organizationAuthorityDecisions",
  organizationLocationDrafts: "organizationLocationDrafts",
  organizationLocations: "organizationLocations",
  organizationLocationEvents: "organizationLocationEvents",
  organizationServiceGeographies: "organizationServiceGeographies",
  organizationProfileCompletions: "organizationProfileCompletions",
  organizationProfileEvents: "organizationProfileEvents",
  organizationCapabilityClaims: "organizationCapabilityClaims",
  organizationIndustryProfiles: "organizationIndustryProfiles",
  organizationPastPerformance: "organizationPastPerformance",
  organizationMarketPreferences: "organizationMarketPreferences",
  organizationProvisionalTerms: "organizationProvisionalTerms",
  organizationMarketProfileEvents: "organizationMarketProfileEvents",
  organizationMarketProfileCommands: "organizationMarketProfileCommands",
  organizationCredentials: "organizationCredentials",
  organizationProfileAssets: "organizationProfileAssets",
  organizationAdditionalLocationDrafts: "organizationAdditionalLocationDrafts",
  organizationAdditionalLocations: "organizationAdditionalLocations",
  organizationEnrichmentEvents: "organizationEnrichmentEvents",
  organizationEnrichmentCommands: "organizationEnrichmentCommands",
  organizationMarkerActivations: "organizationMarkerActivations",
  organizationMarkerEvents: "organizationMarkerEvents",
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
  acquisitionContexts: "acquisitionContexts",
  acquisitionContextEvents: "acquisitionContextEvents",
  businessReferrals: "businessReferrals",
  businessReferralEvents: "businessReferralEvents",
  businessReferralCommands: "businessReferralCommands",
  referralEducationAcknowledgements: "referralEducationAcknowledgements",
  referralCommunicationIntents: "referralCommunicationIntents",
  providerApplications: "providerApplications",
  providerApplicationVersions: "providerApplicationVersions",
  providerApplicationEvents: "providerApplicationEvents",
  providerApplicationCommands: "providerApplicationCommands",
  officialResourceProviderStatuses: "officialResourceProviderStatuses",
  providerServiceProfiles: "providerServiceProfiles",
  providerDiscoveryPublications: "providerDiscoveryPublications",
  providerResources: "providerResources",
  providerNetworkEvents: "providerNetworkEvents",
  providerNetworkCommands: "providerNetworkCommands",
  providerRequestMessages: "providerRequestMessages",
  providerAcquisitionInvitations: "providerAcquisitionInvitations",
  orientationJourneys: "orientationJourneys",
  orientationJourneyEvents: "orientationJourneyEvents",
  firstValueSelections: "firstValueSelections",
  activationReleaseEvents: "activationReleaseEvents",
  aiInterpretationRecords: "aiInterpretationRecords",
  aiInterpretationCandidates: "aiInterpretationCandidates",
  aiInterpretationProvenance: "aiInterpretationProvenance",
  aiInterpretationUsageEvents: "aiInterpretationUsageEvents",
  aiInterpretationEvents: "aiInterpretationEvents",
  aiInterpretationQuotaBuckets: "aiInterpretationQuotaBuckets",
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
  organizationAuthorityClaims: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationAuthorityClaims,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  organizationAuthorityClaimEvents: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationAuthorityClaimEvents,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
  }),
  organizationAuthorityDecisions: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationAuthorityDecisions,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
  }),
  organizationLocationDrafts: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationLocationDrafts,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  organizationLocations: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationLocations,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  organizationLocationEvents: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationLocationEvents,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
  }),
  organizationServiceGeographies: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationServiceGeographies,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  organizationProfileCompletions: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationProfileCompletions,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  organizationProfileEvents: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationProfileEvents,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
  }),
  organizationCapabilityClaims: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationCapabilityClaims, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  organizationIndustryProfiles: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationIndustryProfiles, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  organizationPastPerformance: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationPastPerformance, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  organizationMarketPreferences: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationMarketPreferences, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  organizationProvisionalTerms: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationProvisionalTerms, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationMarketProfileEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationMarketProfileEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationMarketProfileCommands: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationMarketProfileCommands, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationCredentials: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationCredentials, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  organizationProfileAssets: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationProfileAssets, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  organizationAdditionalLocationDrafts: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationAdditionalLocationDrafts, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  organizationAdditionalLocations: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationAdditionalLocations, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  organizationEnrichmentEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationEnrichmentEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationEnrichmentCommands: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationEnrichmentCommands, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationMarkerActivations: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationMarkerActivations,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  organizationMarkerEvents: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.organizationMarkerEvents,
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
  acquisitionContexts: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.acquisitionContexts,
    documentIdSource: "id",
    scope: "mixed-scope",
    organizationIdRequired: false,
    appendOnly: false,
    mutable: true,
  }),
  acquisitionContextEvents: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.acquisitionContextEvents,
    documentIdSource: "id",
    scope: "mixed-scope",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
  businessReferrals: Object.freeze({ collection: FIRESTORE_COLLECTIONS.businessReferrals, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: false, appendOnly: false, mutable: true }),
  businessReferralEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.businessReferralEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: false, appendOnly: true, mutable: false }),
  businessReferralCommands: Object.freeze({ collection: FIRESTORE_COLLECTIONS.businessReferralCommands, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: false, appendOnly: true, mutable: false }),
  referralEducationAcknowledgements: Object.freeze({ collection: FIRESTORE_COLLECTIONS.referralEducationAcknowledgements, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  referralCommunicationIntents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.referralCommunicationIntents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: false, appendOnly: false, mutable: true }),
  providerApplications: Object.freeze({ collection: FIRESTORE_COLLECTIONS.providerApplications, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  providerApplicationVersions: Object.freeze({ collection: FIRESTORE_COLLECTIONS.providerApplicationVersions, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  providerApplicationEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.providerApplicationEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  providerApplicationCommands: Object.freeze({ collection: FIRESTORE_COLLECTIONS.providerApplicationCommands, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  officialResourceProviderStatuses: Object.freeze({ collection: FIRESTORE_COLLECTIONS.officialResourceProviderStatuses, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  providerServiceProfiles: Object.freeze({ collection: FIRESTORE_COLLECTIONS.providerServiceProfiles, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  providerDiscoveryPublications: Object.freeze({ collection: FIRESTORE_COLLECTIONS.providerDiscoveryPublications, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  providerResources: Object.freeze({ collection: FIRESTORE_COLLECTIONS.providerResources, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  providerNetworkEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.providerNetworkEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  providerNetworkCommands: Object.freeze({ collection: FIRESTORE_COLLECTIONS.providerNetworkCommands, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  providerRequestMessages: Object.freeze({ collection: FIRESTORE_COLLECTIONS.providerRequestMessages, documentIdSource: "id", scope: "mixed-scope", organizationIdRequired: false, appendOnly: true, mutable: false }),
  providerAcquisitionInvitations: Object.freeze({ collection: FIRESTORE_COLLECTIONS.providerAcquisitionInvitations, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  orientationJourneys: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.orientationJourneys,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  orientationJourneyEvents: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.orientationJourneyEvents,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
  }),
  firstValueSelections: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.firstValueSelections,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  activationReleaseEvents: Object.freeze({
    collection: FIRESTORE_COLLECTIONS.activationReleaseEvents,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
  }),
  aiInterpretationRecords: Object.freeze({ collection: FIRESTORE_COLLECTIONS.aiInterpretationRecords, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  aiInterpretationCandidates: Object.freeze({ collection: FIRESTORE_COLLECTIONS.aiInterpretationCandidates, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  aiInterpretationProvenance: Object.freeze({ collection: FIRESTORE_COLLECTIONS.aiInterpretationProvenance, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  aiInterpretationUsageEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.aiInterpretationUsageEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  aiInterpretationEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.aiInterpretationEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  aiInterpretationQuotaBuckets: Object.freeze({ collection: FIRESTORE_COLLECTIONS.aiInterpretationQuotaBuckets, documentIdSource: "id", scope: "mixed-scope", organizationIdRequired: false, appendOnly: false, mutable: true }),
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
