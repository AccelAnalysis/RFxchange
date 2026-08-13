import test from "node:test";
import assert from "node:assert/strict";

import {
  FIRESTORE_COLLECTION_CONVENTIONS,
  FIRESTORE_COLLECTIONS,
  FIRESTORE_INDEX_POLICY,
  FIRESTORE_REFERENCE_POLICY,
  FIRESTORE_SCHEMA_VERSION,
  assertOrganizationScopedFirestoreRecord,
  firestoreDocumentPath,
} from "../src/infrastructure/firestore/schema.ts";

const EXPECTED_COLLECTION_KEYS = [
  "organizations", "organizationProfiles", "organizationDiscoveryRecords", "organizationResolutions",
  "organizationEntityKeys", "organizationAuthorityClaims", "organizationAuthorityClaimEvents",
  "organizationAuthorityDecisions", "organizationLocationDrafts", "organizationLocations",
  "organizationLocationEvents", "organizationServiceGeographies", "organizationProfileCompletions",
  "organizationProfileEvents", "organizationCapabilityClaims", "organizationIndustryProfiles",
  "organizationPastPerformance", "organizationMarketPreferences", "organizationProvisionalTerms",
  "organizationMarketProfileEvents", "organizationMarketProfileCommands", "organizationCredentials",
  "organizationProfileAssets", "organizationAdditionalLocationDrafts", "organizationAdditionalLocations",
  "organizationEnrichmentEvents", "organizationEnrichmentCommands", "organizationMarkerActivations",
  "organizationMarkerEvents", "users", "organizationMemberships", "organizationAuthorizations",
  "organizationUserInvitations", "organizationAuditEvents", "geographies", "primaryGeographySelections",
  "geographyParticipationAuthorizations", "accessJourneys", "accessRestrictions", "legalDocumentVersions",
  "legalAcknowledgements", "organizationAuthorityRepresentations", "platformChangeDirectives",
  "retentionPolicies", "retentionAssignments", "adminAuthorityContexts", "adminPermissionGrants",
  "backgroundJobs", "backgroundJobEvents", "acquisitionContexts", "acquisitionContextEvents",
  "businessReferrals", "businessReferralEvents", "businessReferralCommands", "rfxAggregates", "rfxEvents",
  "rfxCommands", "rfxPublicationSnapshots", "rfxOpportunityProjections", "opportunitySavedSearches",
  "opportunityWatches", "opportunitySavedSearchMatches", "opportunityAlertIntents",
  "opportunityRelationCommands", "opportunityRelationEvents", "referralEducationAcknowledgements",
  "referralCommunicationIntents", "providerApplications", "providerApplicationVersions",
  "providerApplicationEvents", "providerApplicationCommands", "officialResourceProviderStatuses",
  "providerServiceProfiles", "providerDiscoveryPublications", "providerResources", "providerNetworkEvents",
  "providerNetworkCommands", "providerRequestMessages", "providerAcquisitionInvitations",
  "networkEducationProgress", "networkEducationEvents", "networkEducationCommands", "orientationJourneys",
  "orientationJourneyEvents", "firstValueSelections", "activationReleaseEvents", "aiInterpretationRecords",
  "aiInterpretationCandidates", "aiInterpretationProvenance", "aiInterpretationUsageEvents",
  "aiInterpretationEvents", "aiInterpretationQuotaBuckets", "organizationCommercialAccounts",
  "commercialFoundingCapacity", "commercialProviderEvents", "commercialSubscriptionReconciliations",
];

test("defines schema version and exact canonical collection registry", () => {
  assert.equal(FIRESTORE_SCHEMA_VERSION, 1);
  assert.deepEqual(Object.keys(FIRESTORE_COLLECTIONS), EXPECTED_COLLECTION_KEYS);
  for (const key of EXPECTED_COLLECTION_KEYS) {
    assert.equal(FIRESTORE_COLLECTIONS[key], key);
    assert.equal(FIRESTORE_COLLECTION_CONVENTIONS[key].collection, key);
  }
});

test("document paths derive deterministically from stable IDs", () => {
  assert.equal(firestoreDocumentPath("organizations", "org-alpha"), "organizations/org-alpha");
  assert.equal(firestoreDocumentPath("organizationMemberships", "membership-1"), "organizationMemberships/membership-1");
  assert.equal(firestoreDocumentPath("organizationCommercialAccounts", "org-alpha"), "organizationCommercialAccounts/org-alpha");
  assert.equal(firestoreDocumentPath("commercialFoundingCapacity", "current"), "commercialFoundingCapacity/current");
  assert.throws(() => firestoreDocumentPath("users", " "), /document id is required/);
  assert.throws(() => firestoreDocumentPath("users", "a\/b"), /cannot contain a slash/);
  assert.throws(() => firestoreDocumentPath("users", ".."), /cannot be/);
});

test("scope and organizationId conventions remain explicit", () => {
  const platformScoped = new Set(["geographies", "accessJourneys", "legalDocumentVersions", "platformChangeDirectives", "retentionPolicies", "adminAuthorityContexts", "adminPermissionGrants", "backgroundJobs", "backgroundJobEvents", "commercialFoundingCapacity"]);
  const userScoped = new Set(["users", "primaryGeographySelections"]);
  const mixedScoped = new Set(["geographyParticipationAuthorizations", "accessRestrictions", "retentionAssignments", "acquisitionContexts", "acquisitionContextEvents", "providerRequestMessages", "aiInterpretationQuotaBuckets"]);
  const publicProjection = new Set(["rfxOpportunityProjections"]);
  const organizationIdOptional = new Set(["businessReferrals", "businessReferralEvents", "businessReferralCommands", "rfxAggregates", "rfxEvents", "rfxCommands", "rfxPublicationSnapshots", "referralCommunicationIntents"]);

  for (const key of EXPECTED_COLLECTION_KEYS) {
    const convention = FIRESTORE_COLLECTION_CONVENTIONS[key];
    if (key === "organizations") assert.equal(convention.scope, "organization-root");
    else if (platformScoped.has(key)) assert.equal(convention.scope, "platform-scoped");
    else if (userScoped.has(key)) assert.equal(convention.scope, "user-scoped");
    else if (mixedScoped.has(key)) assert.equal(convention.scope, "mixed-scope");
    else if (publicProjection.has(key)) assert.equal(convention.scope, "public-projection");
    else assert.equal(convention.scope, "organization-scoped");

    const shouldRequireOrganizationId = convention.scope === "organization-scoped" && !organizationIdOptional.has(key);
    assert.equal(convention.organizationIdRequired, shouldRequireOrganizationId, key);
    if (shouldRequireOrganizationId) {
      assert.throws(() => assertOrganizationScopedFirestoreRecord(key, ""), /require an explicit organizationId/);
      assert.doesNotThrow(() => assertOrganizationScopedFirestoreRecord(key, "org-alpha"));
    } else {
      assert.doesNotThrow(() => assertOrganizationScopedFirestoreRecord(key, undefined));
    }
  }
});

test("append-only domain and operational history remains non-mutable", () => {
  const appendOnly = new Set([
    "organizationResolutions", "organizationEntityKeys", "organizationAuthorityClaimEvents",
    "organizationAuthorityDecisions", "organizationLocationEvents", "organizationProfileEvents",
    "organizationProvisionalTerms", "organizationMarketProfileEvents", "organizationMarketProfileCommands",
    "organizationEnrichmentEvents", "organizationEnrichmentCommands", "organizationMarkerEvents",
    "organizationAuditEvents", "legalDocumentVersions", "legalAcknowledgements",
    "organizationAuthorityRepresentations", "platformChangeDirectives", "retentionPolicies",
    "retentionAssignments", "adminPermissionGrants", "backgroundJobEvents", "acquisitionContextEvents",
    "businessReferralEvents", "businessReferralCommands", "rfxEvents", "rfxCommands",
    "rfxPublicationSnapshots", "rfxOpportunityProjections", "opportunitySavedSearchMatches",
    "opportunityRelationCommands", "opportunityRelationEvents", "referralEducationAcknowledgements",
    "providerApplicationVersions", "providerApplicationEvents", "providerApplicationCommands",
    "providerNetworkEvents", "providerNetworkCommands", "providerRequestMessages", "orientationJourneyEvents",
    "activationReleaseEvents", "aiInterpretationProvenance", "aiInterpretationUsageEvents",
    "aiInterpretationEvents", "commercialProviderEvents",
  ]);
  for (const key of EXPECTED_COLLECTION_KEYS) {
    const convention = FIRESTORE_COLLECTION_CONVENTIONS[key];
    assert.equal(convention.appendOnly, appendOnly.has(key), `${key} append-only policy`);
    assert.equal(convention.mutable, !appendOnly.has(key), `${key} mutable policy`);
  }
});

test("commercial collections follow Issue #192 INF-003 conventions", () => {
  assert.deepEqual(FIRESTORE_COLLECTION_CONVENTIONS.organizationCommercialAccounts, { collection: "organizationCommercialAccounts", documentIdSource: "organizationId", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true });
  assert.deepEqual(FIRESTORE_COLLECTION_CONVENTIONS.commercialFoundingCapacity, { collection: "commercialFoundingCapacity", documentIdSource: "reference", scope: "platform-scoped", organizationIdRequired: false, appendOnly: false, mutable: true });
  assert.deepEqual(FIRESTORE_COLLECTION_CONVENTIONS.commercialProviderEvents, { collection: "commercialProviderEvents", documentIdSource: "id", scope: "organization-scoped", organizationIdRequired: true, appendOnly: true, mutable: false });
  assert.deepEqual(FIRESTORE_COLLECTION_CONVENTIONS.commercialSubscriptionReconciliations, { collection: "commercialSubscriptionReconciliations", documentIdSource: "organizationId", scope: "organization-scoped", organizationIdRequired: true, appendOnly: false, mutable: true });
});

test("singleton relationship identities and provider-independent policies remain stable", () => {
  assert.equal(FIRESTORE_COLLECTION_CONVENTIONS.organizationAuthorizations.documentIdSource, "membershipId");
  assert.equal(FIRESTORE_COLLECTION_CONVENTIONS.adminAuthorityContexts.documentIdSource, "administratorId");
  assert.equal(FIRESTORE_COLLECTION_CONVENTIONS.primaryGeographySelections.documentIdSource, "userId");
  assert.equal(FIRESTORE_REFERENCE_POLICY, "stable-id-fields-not-document-references");
  assert.equal(FIRESTORE_INDEX_POLICY, "query-contract-driven-composite-indexes");
});
