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

test("defines schema version and canonical collection names", () => {
  assert.equal(FIRESTORE_SCHEMA_VERSION, 1);
  assert.deepEqual(FIRESTORE_COLLECTIONS, {
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
  });
});

test("document paths derive deterministically from stable IDs", () => {
  assert.equal(firestoreDocumentPath("organizations", "org-alpha"), "organizations/org-alpha");
  assert.equal(
    firestoreDocumentPath("organizationMemberships", "membership-1"),
    "organizationMemberships/membership-1",
  );
  assert.throws(() => firestoreDocumentPath("users", " "), /document id is required/);
  assert.throws(() => firestoreDocumentPath("users", "a/b"), /cannot contain a slash/);
  assert.throws(() => firestoreDocumentPath("users", ".."), /cannot be/);
});

test("organization-scoped collections explicitly require organizationId", () => {
  for (const key of [
    "organizationProfiles",
    "organizationDiscoveryRecords",
    "organizationResolutions",
    "organizationEntityKeys",
    "organizationAuthorityClaims",
    "organizationAuthorityClaimEvents",
    "organizationAuthorityDecisions",
    "organizationLocationDrafts",
    "organizationLocations",
    "organizationLocationEvents",
    "organizationServiceGeographies",
    "organizationProfileCompletions",
    "organizationProfileEvents",
    "organizationCapabilityClaims",
    "organizationIndustryProfiles",
    "organizationPastPerformance",
    "organizationMarketPreferences",
    "organizationProvisionalTerms",
    "organizationMarketProfileEvents",
    "organizationMarketProfileCommands",
    "organizationCredentials",
    "organizationProfileAssets",
    "organizationAdditionalLocationDrafts",
    "organizationAdditionalLocations",
    "organizationEnrichmentEvents",
    "organizationEnrichmentCommands",
    "organizationMarkerActivations",
    "organizationMarkerEvents",
    "organizationMemberships",
    "organizationAuthorizations",
    "organizationUserInvitations",
    "organizationAuditEvents",
    "legalAcknowledgements",
    "organizationAuthorityRepresentations",
    "orientationJourneys",
    "orientationJourneyEvents",
    "firstValueSelections",
    "activationReleaseEvents",
    "referralEducationAcknowledgements",
    "providerApplications",
    "providerApplicationVersions",
    "providerApplicationEvents",
    "providerApplicationCommands",
    "officialResourceProviderStatuses",
    "providerServiceProfiles",
    "providerDiscoveryPublications",
    "providerResources",
    "providerNetworkEvents",
    "providerNetworkCommands",
    "providerAcquisitionInvitations",
    "aiInterpretationRecords",
    "aiInterpretationCandidates",
    "aiInterpretationProvenance",
    "aiInterpretationUsageEvents",
    "aiInterpretationEvents",
  ]) {
    assert.equal(FIRESTORE_COLLECTION_CONVENTIONS[key].organizationIdRequired, true);
    assert.throws(
      () => assertOrganizationScopedFirestoreRecord(key, ""),
      /require an explicit organizationId/,
    );
    assert.doesNotThrow(() => assertOrganizationScopedFirestoreRecord(key, "org-alpha"));
  }

  for (const key of [
    "users",
    "backgroundJobs",
    "backgroundJobEvents",
    "acquisitionContexts",
    "acquisitionContextEvents",
    "businessReferralEvents",
    "businessReferralCommands",
    "providerRequestMessages",
    "aiInterpretationQuotaBuckets",
  ]) {
    assert.equal(FIRESTORE_COLLECTION_CONVENTIONS[key].organizationIdRequired, false);
    assert.doesNotThrow(() => assertOrganizationScopedFirestoreRecord(key, undefined));
  }
});

test("append-only domain and operational history remains non-mutable", () => {
  for (const key of [
    "organizationAuditEvents",
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
  ]) {
    const convention = FIRESTORE_COLLECTION_CONVENTIONS[key];
    assert.equal(convention.appendOnly, true, `${key} must be append-only`);
    assert.equal(convention.mutable, false, `${key} must not be mutable`);
  }

  assert.equal(FIRESTORE_COLLECTION_CONVENTIONS.organizationUserInvitations.appendOnly, false);
  assert.equal(FIRESTORE_COLLECTION_CONVENTIONS.organizationUserInvitations.mutable, true);
  assert.equal(FIRESTORE_COLLECTION_CONVENTIONS.backgroundJobs.appendOnly, false);
  assert.equal(FIRESTORE_COLLECTION_CONVENTIONS.backgroundJobs.mutable, true);
});

test("relationship and index policies remain provider-independent and query driven", () => {
  assert.equal(FIRESTORE_REFERENCE_POLICY, "stable-id-fields-not-document-references");
  assert.equal(FIRESTORE_INDEX_POLICY, "query-contract-driven-composite-indexes");
});

test("singleton relationship state uses the owning stable identity as document ID", () => {
  assert.equal(FIRESTORE_COLLECTION_CONVENTIONS.organizationAuthorizations.documentIdSource, "membershipId");
  assert.equal(FIRESTORE_COLLECTION_CONVENTIONS.adminAuthorityContexts.documentIdSource, "administratorId");
  assert.equal(FIRESTORE_COLLECTION_CONVENTIONS.primaryGeographySelections.documentIdSource, "userId");
});
