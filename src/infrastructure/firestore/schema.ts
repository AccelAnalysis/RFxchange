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
  "geographies", "accessJourneys", "legalDocumentVersions", "platformChangeDirectives",
  "retentionPolicies", "adminAuthorityContexts", "adminPermissionGrants", "backgroundJobs",
  "backgroundJobEvents", "commercialFoundingCapacity",
]);
const USER_SCOPED_COLLECTIONS: ReadonlySet<FirestoreCollectionKey> = new Set<FirestoreCollectionKey>(["users", "primaryGeographySelections"]);
const MIXED_SCOPE_COLLECTIONS: ReadonlySet<FirestoreCollectionKey> = new Set<FirestoreCollectionKey>([
  "geographyParticipationAuthorizations", "accessRestrictions", "retentionAssignments", "acquisitionContexts",
  "acquisitionContextEvents", "providerRequestMessages", "aiInterpretationQuotaBuckets",
]);
const PUBLIC_PROJECTION_COLLECTIONS: ReadonlySet<FirestoreCollectionKey> = new Set<FirestoreCollectionKey>(["rfxOpportunityProjections"]);
const ORGANIZATION_ROOT_COLLECTIONS: ReadonlySet<FirestoreCollectionKey> = new Set<FirestoreCollectionKey>(["organizations"]);
const ORGANIZATION_ID_OPTIONAL_ORG_COLLECTIONS: ReadonlySet<FirestoreCollectionKey> = new Set<FirestoreCollectionKey>([
  "businessReferrals", "businessReferralEvents", "businessReferralCommands", "rfxAggregates", "rfxEvents",
  "rfxCommands", "rfxPublicationSnapshots", "referralCommunicationIntents",
]);
const APPEND_ONLY_COLLECTIONS: ReadonlySet<FirestoreCollectionKey> = new Set<FirestoreCollectionKey>([
  "organizationResolutions", "organizationEntityKeys", "organizationAuthorityClaimEvents", "organizationAuthorityDecisions",
  "organizationLocationEvents", "organizationProfileEvents", "organizationProvisionalTerms", "organizationMarketProfileEvents",
  "organizationMarketProfileCommands", "organizationEnrichmentEvents", "organizationEnrichmentCommands", "organizationMarkerEvents",
  "organizationAuditEvents", "legalDocumentVersions", "legalAcknowledgements", "organizationAuthorityRepresentations",
  "platformChangeDirectives", "retentionPolicies", "retentionAssignments", "adminPermissionGrants", "backgroundJobEvents",
  "acquisitionContextEvents", "businessReferralEvents", "businessReferralCommands", "rfxEvents", "rfxCommands",
  "rfxPublicationSnapshots", "rfxOpportunityProjections", "opportunitySavedSearchMatches", "opportunityRelationCommands",
  "opportunityRelationEvents", "referralEducationAcknowledgements", "providerApplicationVersions", "providerApplicationEvents",
  "providerApplicationCommands", "providerNetworkEvents", "providerNetworkCommands", "providerRequestMessages",
  "networkEducationEvents", "networkEducationCommands", "orientationJourneyEvents", "activationReleaseEvents",
  "aiInterpretationProvenance", "aiInterpretationUsageEvents", "aiInterpretationEvents", "commercialProviderEvents",
]);

function scopeFor(key: FirestoreCollectionKey): FirestoreRecordScope {
  if (ORGANIZATION_ROOT_COLLECTIONS.has(key)) return "organization-root";
  if (USER_SCOPED_COLLECTIONS.has(key)) return "user-scoped";
  if (PLATFORM_SCOPED_COLLECTIONS.has(key)) return "platform-scoped";
  if (PUBLIC_PROJECTION_COLLECTIONS.has(key)) return "public-projection";
  if (MIXED_SCOPE_COLLECTIONS.has(key)) return "mixed-scope";
  return "organization-scoped";
}
function documentIdSourceFor(key: FirestoreCollectionKey): FirestoreCollectionConvention["documentIdSource"] {
  switch (key) {
    case "organizationAuthorizations": return "membershipId";
    case "adminAuthorityContexts": return "administratorId";
    case "primaryGeographySelections": return "userId";
    case "organizationCommercialAccounts":
    case "commercialSubscriptionReconciliations": return "organizationId";
    case "rfxOpportunityProjections":
    case "commercialFoundingCapacity": return "reference";
    default: return "id";
  }
}
function conventionFor(key: FirestoreCollectionKey): FirestoreCollectionConvention {
  const scope = scopeFor(key);
  const appendOnly = APPEND_ONLY_COLLECTIONS.has(key);
  return Object.freeze({
    collection: FIRESTORE_COLLECTIONS[key],
    documentIdSource: documentIdSourceFor(key),
    scope,
    organizationIdRequired: scope === "organization-scoped" && !ORGANIZATION_ID_OPTIONAL_ORG_COLLECTIONS.has(key),
    appendOnly,
    mutable: !appendOnly,
  });
}
const GENERATED_COLLECTION_CONVENTIONS = Object.fromEntries(
  (Object.keys(FIRESTORE_COLLECTIONS) as FirestoreCollectionKey[]).map((key) => [key, conventionFor(key)]),
) as Record<FirestoreCollectionKey, FirestoreCollectionConvention>;

/**
 * Canonical mapping from current RFxchange persistence ports to Firestore collections.
 * The explicit overrides below preserve existing INF-003 contracts in source-visible form while
 * the four commerce collections use the same canonical registry rather than a shadow convention.
 */
export const FIRESTORE_COLLECTION_CONVENTIONS: Readonly<Record<FirestoreCollectionKey, FirestoreCollectionConvention>> = Object.freeze({
  ...GENERATED_COLLECTION_CONVENTIONS,
  organizationAuditEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationAuditEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationResolutions: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationResolutions, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationEntityKeys: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationEntityKeys, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationAuthorityClaimEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationAuthorityClaimEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationAuthorityDecisions: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationAuthorityDecisions, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationLocationEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationLocationEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationProfileEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationProfileEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationProvisionalTerms: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationProvisionalTerms, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationMarketProfileEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationMarketProfileEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationMarketProfileCommands: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationMarketProfileCommands, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationMarkerEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationMarkerEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  legalDocumentVersions: Object.freeze({ collection: FIRESTORE_COLLECTIONS.legalDocumentVersions, documentIdSource: "id", scope: "platform-scoped", organizationIdRequired: false, appendOnly: true, mutable: false }),
  legalAcknowledgements: Object.freeze({ collection: FIRESTORE_COLLECTIONS.legalAcknowledgements, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  organizationAuthorityRepresentations: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationAuthorityRepresentations, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  platformChangeDirectives: Object.freeze({ collection: FIRESTORE_COLLECTIONS.platformChangeDirectives, documentIdSource: "id", scope: "platform-scoped", organizationIdRequired: false, appendOnly: true, mutable: false }),
  retentionPolicies: Object.freeze({ collection: FIRESTORE_COLLECTIONS.retentionPolicies, documentIdSource: "id", scope: "platform-scoped", organizationIdRequired: false, appendOnly: true, mutable: false }),
  retentionAssignments: Object.freeze({ collection: FIRESTORE_COLLECTIONS.retentionAssignments, documentIdSource: "id", scope: "mixed-scope", organizationIdRequired: false, appendOnly: true, mutable: false }),
  adminPermissionGrants: Object.freeze({ collection: FIRESTORE_COLLECTIONS.adminPermissionGrants, documentIdSource: "id", scope: "platform-scoped", organizationIdRequired: false, appendOnly: true, mutable: false }),
  backgroundJobEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.backgroundJobEvents, documentIdSource: "id", scope: "platform-scoped", organizationIdRequired: false, appendOnly: true, mutable: false }),
  acquisitionContextEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.acquisitionContextEvents, documentIdSource: "id", scope: "mixed-scope", organizationIdRequired: false, appendOnly: true, mutable: false }),
  businessReferralEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.businessReferralEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: false, appendOnly: true, mutable: false }),
  businessReferralCommands: Object.freeze({ collection: FIRESTORE_COLLECTIONS.businessReferralCommands, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: false, appendOnly: true, mutable: false }),
  referralEducationAcknowledgements: Object.freeze({ collection: FIRESTORE_COLLECTIONS.referralEducationAcknowledgements, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  networkEducationEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.networkEducationEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  networkEducationCommands: Object.freeze({ collection: FIRESTORE_COLLECTIONS.networkEducationCommands, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  orientationJourneyEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.orientationJourneyEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  activationReleaseEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.activationReleaseEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  aiInterpretationProvenance: Object.freeze({ collection: FIRESTORE_COLLECTIONS.aiInterpretationProvenance, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  aiInterpretationUsageEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.aiInterpretationUsageEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  aiInterpretationEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.aiInterpretationEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  backgroundJobs: Object.freeze({ collection: FIRESTORE_COLLECTIONS.backgroundJobs, documentIdSource: "id", scope: "platform-scoped", organizationIdRequired: false, appendOnly: false, mutable: true }),
  organizationUserInvitations: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationUserInvitations, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  organizationCommercialAccounts: Object.freeze({ collection: FIRESTORE_COLLECTIONS.organizationCommercialAccounts, documentIdSource: "organizationId", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
  commercialFoundingCapacity: Object.freeze({ collection: FIRESTORE_COLLECTIONS.commercialFoundingCapacity, documentIdSource: "reference", scope: "platform-scoped", organizationIdRequired: false, appendOnly: false, mutable: true }),
  commercialProviderEvents: Object.freeze({ collection: FIRESTORE_COLLECTIONS.commercialProviderEvents, documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false }),
  commercialSubscriptionReconciliations: Object.freeze({ collection: FIRESTORE_COLLECTIONS.commercialSubscriptionReconciliations, documentIdSource: "organizationId", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true }),
});

export const FIRESTORE_SYSTEM_FIELDS = Object.freeze({
  schemaVersion: "schemaVersion",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  organizationId: "organizationId",
});
export interface FirestorePersistenceMetadata {
  readonly schemaVersion: typeof FIRESTORE_SCHEMA_VERSION;
  readonly createdAt: "server-timestamp";
  readonly updatedAt?: "server-timestamp";
}
function stableDocumentId(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error("Firestore document id is required.");
  if (normalized.includes("/")) throw new Error("Firestore document id cannot contain a slash.");
  if (normalized === "." || normalized === "..") throw new Error("Firestore document id cannot be . or ...");
  return normalized;
}
export function firestoreCollectionName(key: FirestoreCollectionKey): FirestoreCollectionName { return FIRESTORE_COLLECTIONS[key]; }
export function firestoreDocumentPath(key: FirestoreCollectionKey, id: string): string { return `${firestoreCollectionName(key)}/${stableDocumentId(id)}`; }
export function assertOrganizationScopedFirestoreRecord(key: FirestoreCollectionKey, organizationId: string | null | undefined): void {
  const convention = FIRESTORE_COLLECTION_CONVENTIONS[key];
  if (!convention.organizationIdRequired) return;
  if (!organizationId?.trim()) throw new Error(`${convention.collection} records require an explicit organizationId.`);
}
export const FIRESTORE_REFERENCE_POLICY = "stable-id-fields-not-document-references" as const;
export const FIRESTORE_INDEX_POLICY = "query-contract-driven-composite-indexes" as const;
