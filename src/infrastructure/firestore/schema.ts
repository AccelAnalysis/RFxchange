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
  rfxAggregates: "rfxAggregates",
  rfxEvents: "rfxEvents",
  rfxCommands: "rfxCommands",
  rfxPublicationSnapshots: "rfxPublicationSnapshots",
  rfxOpportunityProjections: "rfxOpportunityProjections",
  opportunitySavedSearches: "opportunitySavedSearches",
  opportunityWatches: "opportunityWatches",
  opportunitySavedSearchMatches: "opportunitySavedSearchMatches",
  opportunityAlertIntents: "opportunityAlertIntents",
  opportunityRelationCommands: "opportunityRelationCommands",
  opportunityRelationEvents: "opportunityRelationEvents",
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
  networkEducationProgress: "networkEducationProgress",
  networkEducationEvents: "networkEducationEvents",
  networkEducationCommands: "networkEducationCommands",
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
  organizationCommercialAccounts: "organizationCommercialAccounts",
  commercialFoundingCapacity: "commercialFoundingCapacity",
  commercialProviderEvents: "commercialProviderEvents",
  commercialSubscriptionReconciliations: "commercialSubscriptionReconciliations",
} as const;

export type FirestoreCollectionKey = keyof typeof FIRESTORE_COLLECTIONS;
export type FirestoreCollectionName = (typeof FIRESTORE_COLLECTIONS)[FirestoreCollectionKey];
export type FirestoreRecordScope =
  | "organization-root"
  | "organization-scoped"
  | "user-scoped"
  | "platform-scoped"
  | "public-projection"
  | "mixed-scope";

export interface FirestoreCollectionConvention {
  readonly collection: FirestoreCollectionName;
  readonly documentIdSource: "id" | "membershipId" | "administratorId" | "userId" | "organizationId" | "reference";
  readonly scope: FirestoreRecordScope;
  readonly organizationIdRequired: boolean;
  readonly appendOnly: boolean;
  readonly mutable: boolean;
}

const PLATFORM_SCOPED_COLLECTIONS: ReadonlySet<FirestoreCollectionKey> = new Set<FirestoreCollectionKey>([
  "geographies",
  "accessJourneys",
  "legalDocumentVersions",
  "platformChangeDirectives",
  "retentionPolicies",
  "adminAuthorityContexts",
  "adminPermissionGrants",
  "backgroundJobs",
  "backgroundJobEvents",
  "commercialFoundingCapacity",
]);

const USER_SCOPED_COLLECTIONS: ReadonlySet<FirestoreCollectionKey> = new Set<FirestoreCollectionKey>([
  "users",
  "primaryGeographySelections",
]);

const MIXED_SCOPE_COLLECTIONS: ReadonlySet<FirestoreCollectionKey> = new Set<FirestoreCollectionKey>([
  "geographyParticipationAuthorizations",
  "accessRestrictions",
  "retentionAssignments",
  "acquisitionContexts",
  "acquisitionContextEvents",
  "providerRequestMessages",
  "aiInterpretationQuotaBuckets",
]);

const PUBLIC_PROJECTION_COLLECTIONS: ReadonlySet<FirestoreCollectionKey> = new Set<FirestoreCollectionKey>([
  "rfxOpportunityProjections",
]);

const ORGANIZATION_ROOT_COLLECTIONS: ReadonlySet<FirestoreCollectionKey> = new Set<FirestoreCollectionKey>([
  "organizations",
]);

const ORGANIZATION_ID_OPTIONAL_ORG_COLLECTIONS: ReadonlySet<FirestoreCollectionKey> = new Set<FirestoreCollectionKey>([
  "businessReferrals",
  "businessReferralEvents",
  "businessReferralCommands",
  "rfxAggregates",
  "rfxEvents",
  "rfxCommands",
  "rfxPublicationSnapshots",
  "referralCommunicationIntents",
]);

const APPEND_ONLY_COLLECTIONS: ReadonlySet<FirestoreCollectionKey> = new Set<FirestoreCollectionKey>([
  "organizationResolutions",
  "organizationEntityKeys",
  "organizationAuthorityClaimEvents",
  "organizationAuthorityDecisions",
  "organizationLocationEvents",
  "organizationProfileEvents",
  "organizationProvisionalTerms",
  "organizationMarketProfileEvents",
  "organizationMarketProfileCommands",
  "organizationEnrichmentEvents",
  "organizationEnrichmentCommands",
  "organizationMarkerEvents",
  "organizationAuditEvents",
  "legalDocumentVersions",
  "legalAcknowledgements",
  "organizationAuthorityRepresentations",
  "platformChangeDirectives",
  "retentionPolicies",
  "retentionAssignments",
  "adminPermissionGrants",
  "backgroundJobEvents",
  "acquisitionContextEvents",
  "businessReferralEvents",
  "businessReferralCommands",
  "rfxEvents",
  "rfxCommands",
  "rfxPublicationSnapshots",
  "rfxOpportunityProjections",
  "opportunitySavedSearchMatches",
  "opportunityRelationCommands",
  "opportunityRelationEvents",
  "referralEducationAcknowledgements",
  "providerApplicationVersions",
  "providerApplicationEvents",
  "providerApplicationCommands",
  "providerNetworkEvents",
  "providerNetworkCommands",
  "providerRequestMessages",
  "orientationJourneyEvents",
  "activationReleaseEvents",
  "aiInterpretationProvenance",
  "aiInterpretationUsageEvents",
  "aiInterpretationEvents",
  "commercialProviderEvents",
]);

function scopeFor(key: FirestoreCollectionKey): FirestoreRecordScope {
  if (ORGANIZATION_ROOT_COLLECTIONS.has(key)) return "organization-root";
  if (USER_SCOPED_COLLECTIONS.has(key)) return "user-scoped";
  if (PLATFORM_SCOPED_COLLECTIONS.has(key)) return "platform-scoped";
  if (PUBLIC_PROJECTION_COLLECTIONS.has(key)) return "public-projection";
  if (MIXED_SCOPE_COLLECTIONS.has(key)) return "mixed-scope";
  return "organization-scoped";
}

function documentIdSourceFor(
  key: FirestoreCollectionKey,
): FirestoreCollectionConvention["documentIdSource"] {
  switch (key) {
    case "organizationAuthorizations":
      return "membershipId";
    case "adminAuthorityContexts":
      return "administratorId";
    case "primaryGeographySelections":
      return "userId";
    case "organizationCommercialAccounts":
    case "commercialSubscriptionReconciliations":
      return "organizationId";
    case "rfxOpportunityProjections":
    case "commercialFoundingCapacity":
      return "reference";
    default:
      return "id";
  }
}

function conventionFor(key: FirestoreCollectionKey): FirestoreCollectionConvention {
  const scope = scopeFor(key);
  const appendOnly = APPEND_ONLY_COLLECTIONS.has(key);
  return Object.freeze({
    collection: FIRESTORE_COLLECTIONS[key],
    documentIdSource: documentIdSourceFor(key),
    scope,
    organizationIdRequired:
      scope === "organization-scoped" && !ORGANIZATION_ID_OPTIONAL_ORG_COLLECTIONS.has(key),
    appendOnly,
    mutable: !appendOnly,
  });
}

/**
 * Canonical mapping from current RFxchange persistence ports to Firestore collections.
 * These conventions contain no Firebase SDK types and do not implement adapters.
 */
export const FIRESTORE_COLLECTION_CONVENTIONS: Readonly<
  Record<FirestoreCollectionKey, FirestoreCollectionConvention>
> = Object.freeze(
  Object.fromEntries(
    (Object.keys(FIRESTORE_COLLECTIONS) as FirestoreCollectionKey[])
      .map((key) => [key, conventionFor(key)]),
  ) as Record<FirestoreCollectionKey, FirestoreCollectionConvention>,
);

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
