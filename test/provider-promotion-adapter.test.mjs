import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createPlatformAdministratorAuthorityContext,
} from "../src/domain/admin-authorization/model.ts";
import { defaultAdminRolePreset } from "../src/domain/admin-authorization/role-presets.ts";
import {
  createProviderCanonicalComparison,
  createProviderPromotionApproval,
  createProviderPromotionCommand,
  createProviderSeedPromotionCandidate,
} from "../src/domain/provider-seeding/promotion.ts";
import { evaluateProviderPromotion } from "../src/application/provider-seeding/provider-promotion-evaluation.ts";
import {
  providerApprovalFingerprint,
  providerCanonicalSearchFingerprint,
  providerComparisonFingerprint,
  providerGeographyProfileFingerprint,
  providerPromotionAuthorityContextFingerprint,
  providerPromotionRequestFingerprint,
  providerSourcePlanFingerprint,
  providerSourceRecordFingerprint,
} from "../src/application/provider-seeding/promotion-fingerprints.ts";

const now = "2026-08-23T23:45:00.000Z";

function geographyPacket() {
  const source = Object.freeze({
    id: "dataset-census-current",
    sourceSystem: "census-geocoder",
    name: "Census current",
    authority: "United States Census Bureau",
    sourceUrl: "https://geocoding.geo.census.gov/",
    licenseOrUseBasis: "United States Government public data",
    vintage: "Current_Current",
    effectiveFrom: null,
    effectiveTo: null,
    importedAt: now,
  });
  const geography = Object.freeze({
    id: "census:country:us",
    type: "country",
    name: "United States",
    countryCode: "US",
    stateCode: null,
    externalId: "US",
    sourceSystem: "census-geocoder",
    economicDevelopmentZone: false,
    currentVersionId: "census:country:us:current-current",
    createdAt: now,
    updatedAt: now,
  });
  const version = Object.freeze({
    id: "census:country:us:current-current",
    geographyId: geography.id,
    datasetSourceId: source.id,
    sourceLayer: "country",
    vintage: "Current_Current",
    name: "United States (Current_Current)",
    parentVersionId: null,
    geometryReference: null,
    effectiveFrom: null,
    effectiveTo: null,
    metadata: Object.freeze({}),
    createdAt: now,
  });
  const reference = Object.freeze({
    geographyId: geography.id,
    versionId: version.id,
    type: "country",
    name: geography.name,
    externalId: "US",
    sourceSystem: "census-geocoder",
    vintage: version.vintage,
    parentVersionId: null,
    countryCode: "US",
    stateCode: null,
    economicDevelopmentZone: false,
  });
  const membership = Object.freeze({
    id: "seeded-location-001:1:census:country:us:current-current",
    locationId: "seeded-location-001",
    organizationId: null,
    profileVersion: 1,
    geographyId: geography.id,
    geographyVersionId: version.id,
    geographyType: "country",
    role: "physical",
    derivation: "accepted-coordinate",
    confidence: 1,
    createdAt: now,
  });
  const profile = Object.freeze({
    id: "seeded-location-001",
    locationId: "seeded-location-001",
    organizationId: null,
    operatingGeographyId: null,
    profileVersion: 1,
    acceptedPoint: Object.freeze({ longitude: -76.342, latitude: 37.029 }),
    acceptedPointFingerprint: "-76.3420000,37.0290000",
    visibility: "approximate",
    hierarchy: Object.freeze({
      country: reference,
      state: null,
      countyEquivalent: null,
      place: null,
      censusTract: null,
      blockGroup: null,
      censusBlock: null,
    }),
    overlays: Object.freeze([]),
    membershipIds: Object.freeze([membership.id]),
    resolver: "fixture",
    benchmark: "Public_AR_Current",
    resolverVintage: "Current_Current",
    derivedFrom: "accepted-coordinate",
    sourceLocationUpdatedAt: now,
    resolvedAt: now,
    updatedAt: now,
  });
  const command = Object.freeze({
    id: "geography-seed-command-001",
    action: "materialize-location-profile",
    organizationId: null,
    subjectId: profile.id,
    requestFingerprint: "sha256:geography",
    actorUserId: null,
    actorMembershipId: null,
    recordedAt: now,
  });
  const event = Object.freeze({
    id: "geography-seed-event-001",
    kind: "location-profile-materialized",
    organizationId: null,
    subjectId: profile.id,
    commandId: command.id,
    occurredAt: now,
  });
  return Object.freeze({
    datasetSources: Object.freeze([source]),
    geographies: Object.freeze([geography]),
    versions: Object.freeze([version]),
    profile,
    memberships: Object.freeze([membership]),
    command,
    event,
  });
}

function fixture() {
  const authority = createPlatformAdministratorAuthorityContext({
    administratorId: "admin-provider-promotion",
    rolePresetKeys: ["super-admin"],
    effectivePermissions: [
      "provider.seed-promotion.preview",
      "provider.seed-promotion.commit",
    ],
    scopeSatisfied: true,
    conditions: {
      requirement: "pre-resolved",
      status: "satisfied",
      evidenceKeys: ["reauth:provider-promotion-001", "release:hampton-roads-001"],
    },
  });
  const authorityFingerprint = providerPromotionAuthorityContextFingerprint(authority);
  const plan = Object.freeze({
    schemaVersion: 1,
    marketKey: "hampton-roads-va",
    donorRepository: "AccelAnalysis/TestRFx",
    donorCommit: "db19a0cc2171d0ddde4f34a20acc881ba7279248",
    sourceCounts: Object.freeze({
      candidates: 32,
      locations: 27,
      acceptedGeocodes: 22,
      unresolvedGeocodes: 5,
      heldOut: 5,
    }),
    dispositionCounts: Object.freeze({ ready_for_canonical_comparison: 14, needs_identity_review: 8, needs_geocode_review: 3, off_map_unresolved: 2, held_out: 5 }),
  });
  const planFingerprint = providerSourcePlanFingerprint(plan);
  const packet = geographyPacket();
  const geographyFingerprint = providerGeographyProfileFingerprint(packet);
  let source = Object.freeze({
    id: "hampton-roads-va:provider-001",
    candidateId: "hampton-roads-va:provider-001",
    seedKey: "provider-001",
    displayName: "Hampton Roads Business Center",
    serviceSummary: "Source-backed business counseling and technical assistance.",
    serviceAreaLabels: Object.freeze(["Hampton Roads, Virginia"]),
    primarySourceId: "source-001",
    website: "https://example.org/",
    aliases: Object.freeze(["HR Business Center"]),
    acceptedLocation: Object.freeze({
      locationKey: "seeded-location-001",
      label: "Main office",
      addressLine1: "100 Main Street",
      addressLine2: null,
      locality: "Hampton",
      regionCode: "VA",
      postalCode: "23666",
      countryCode: "US",
      matchedAddress: "100 MAIN ST, HAMPTON, VA, 23666",
      acceptedPoint: Object.freeze({ longitude: -76.342, latitude: 37.029 }),
      acceptedPointFingerprint: "-76.3420000,37.0290000",
      geocodeProvider: "census",
      geocodeBenchmark: "Public_AR_Current",
      geocodedAt: now,
    }),
    sourcePlan: plan,
    sourcePlanFingerprint: planFingerprint,
    sourceRecordFingerprint: "pending",
    preparedAt: now,
  });
  let candidate = createProviderSeedPromotionCandidate({
    id: source.candidateId,
    marketKey: "hampton-roads-va",
    seedKey: source.seedKey,
    displayName: source.displayName,
    providerClass: "community-institutional",
    participationPolicy: "free-standard",
    providerType: "business-support",
    resourceCategory: "technical-assistance",
    serviceName: "Business counseling",
    website: source.website,
    aliases: source.aliases,
    primarySourceId: source.primarySourceId,
    disposition: "ready_for_canonical_comparison",
    acceptedLocationKey: source.acceptedLocation.locationKey,
    acceptedPointFingerprint: source.acceptedLocation.acceptedPointFingerprint,
    geographyEnrichmentStatus: "ready_for_profile_materialization",
    geographyProfileFingerprint: geographyFingerprint,
    sourcePlanFingerprint: planFingerprint,
    sourceRecordFingerprint: "pending",
    donorRepository: plan.donorRepository,
    donorCommit: plan.donorCommit,
    preparedAt: now,
  });
  const recordFingerprint = providerSourceRecordFingerprint(candidate, source);
  source = Object.freeze({ ...source, sourceRecordFingerprint: recordFingerprint });
  candidate = createProviderSeedPromotionCandidate({
    ...candidate,
    sourceRecordFingerprint: recordFingerprint,
  });
  const geography = Object.freeze({
    id: candidate.id,
    candidateId: candidate.id,
    sourceRecordFingerprint: recordFingerprint,
    geographyProfileFingerprint: geographyFingerprint,
    packet,
    preparedAt: now,
  });
  const searchFingerprint = providerCanonicalSearchFingerprint([]);
  let comparison = createProviderCanonicalComparison({
    id: "comparison-provider-001-v1",
    candidate,
    canonicalSearchFingerprint: searchFingerprint,
    matches: [],
    outcome: "create-new-organization",
    rationale: "No current canonical Organization matched the source-backed identity.",
    comparisonFingerprint: "pending",
    reviewedByAdministratorId: String(authority.administratorId),
    authorityContextId: authorityFingerprint,
    reviewedAt: now,
  });
  const comparisonFingerprint = providerComparisonFingerprint(comparison);
  comparison = createProviderCanonicalComparison({
    ...comparison,
    candidate,
    comparisonFingerprint,
  });
  const approval = createProviderPromotionApproval({
    id: "approval-provider-001-v1",
    candidate,
    comparison,
    decision: "approve-new-organization",
    targetOrganizationId: "seeded-org-provider-001",
    candidateRecordFingerprint: recordFingerprint,
    geographyProfileFingerprint: geographyFingerprint,
    comparisonFingerprint,
    rationale: "Create an unclaimed canonical Organization with unpublished seeded provider records.",
    approvedByAdministratorId: String(authority.administratorId),
    authorityContextId: authorityFingerprint,
    approvedAt: now,
  });
  const approvalFingerprint = providerApprovalFingerprint(approval);
  let command = createProviderPromotionCommand({
    id: "promotion-command-provider-001",
    action: "commit-approved-provider-promotion",
    candidate,
    comparison,
    approval,
    targetLocationId: "seeded-location-001",
    targetProviderResourceId: "seeded-resource-provider-001",
    geographyProfileId: "seeded-location-001",
    approvalFingerprint,
    requestFingerprint: "pending",
    actorAdministratorId: String(authority.administratorId),
    authorityContextId: authorityFingerprint,
    confirmation: "PROMOTE APPROVED PROVIDER",
    recordedAt: now,
  });
  const requestFingerprint = providerPromotionRequestFingerprint(command);
  command = createProviderPromotionCommand({
    id: command.id,
    action: command.action,
    candidate,
    comparison,
    approval,
    targetLocationId: command.targetLocationId,
    targetProviderResourceId: command.targetProviderResourceId,
    geographyProfileId: command.geographyProfileId,
    approvalFingerprint,
    requestFingerprint,
    actorAdministratorId: command.actorAdministratorId,
    authorityContextId: command.authorityContextId,
    confirmation: "PROMOTE APPROVED PROVIDER",
    recordedAt: now,
  });
  return Object.freeze({ authority, candidate, source, geography, comparison, approval, command });
}

test("dedicated provider seed promotion permissions are not granted to the ordinary platform administrator preset", () => {
  const platform = defaultAdminRolePreset("platform-administrator");
  const permissions = platform.grants.map((grant) => String(grant.permission));
  assert.equal(permissions.includes("provider.seed-promotion.preview"), false);
  assert.equal(permissions.includes("provider.seed-promotion.commit"), false);
});

test("approved create-new promotion evaluates to unclaimed, unpublished canonical staging records", () => {
  const value = fixture();
  const evaluated = evaluateProviderPromotion({
    evidence: value,
    command: value.command,
    authority: value.authority,
    currentMatches: [],
    target: Object.freeze({ account: null, profile: null, discovery: null }),
    now,
  });
  assert.equal(evaluated.account.id, "seeded-org-provider-001");
  assert.equal(evaluated.discovery.origin, "seeded");
  assert.equal(evaluated.discovery.authorityState, "unestablished");
  assert.equal(evaluated.discovery.verificationState, "not-evaluated");
  assert.equal(evaluated.seededLocation.participantConfirmed, false);
  assert.equal(evaluated.seededLocation.publicProjection, "disabled");
  assert.equal(evaluated.classification.claimState, "unclaimed");
  assert.equal(evaluated.classification.providerDiscovery, "disabled");
  assert.equal(evaluated.resourceDraft.status, "draft");
  assert.equal(evaluated.resourceDraft.publication, "disabled");
  assert.equal(evaluated.preview.publishProviderDiscovery, false);
  assert.equal(evaluated.preview.publishResource, false);
  assert.equal(evaluated.receipt.publishProviderDiscovery, false);
  assert.equal(evaluated.receipt.publishResource, false);
  assert.equal(evaluated.geographyPacket.profile.organizationId, "seeded-org-provider-001");
  assert.ok(evaluated.geographyPacket.memberships.every((membership) => membership.organizationId === "seeded-org-provider-001"));
});

test("commit requires current pre-resolved dedicated authority and exact reviewed authority fingerprint", () => {
  const value = fixture();
  const missingCondition = createPlatformAdministratorAuthorityContext({
    administratorId: String(value.authority.administratorId),
    rolePresetKeys: ["super-admin"],
    effectivePermissions: ["provider.seed-promotion.preview", "provider.seed-promotion.commit"],
    scopeSatisfied: true,
  });
  assert.throws(
    () => evaluateProviderPromotion({
      evidence: value,
      command: value.command,
      authority: missingCondition,
      currentMatches: [],
      target: { account: null, profile: null, discovery: null },
      now,
    }),
    /conditions-not-satisfied|authority context differs/,
  );
});

test("changed source or canonical search evidence invalidates promotion", () => {
  const value = fixture();
  const changedSource = Object.freeze({
    ...value.source,
    serviceSummary: "Changed after review.",
  });
  assert.throws(
    () => evaluateProviderPromotion({
      evidence: Object.freeze({ ...value, source: changedSource }),
      command: value.command,
      authority: value.authority,
      currentMatches: [],
      target: { account: null, profile: null, discovery: null },
      now,
    }),
    /source-record evidence is stale/,
  );
  const currentMatch = Object.freeze({
    organizationId: "other-org",
    profileId: "other-profile",
    displayName: "Hampton Roads Business Center",
    origin: "seeded",
    classification: "likely-match",
    score: 80,
    evidence: Object.freeze([{ kind: "display-name", strength: "strong", explanation: "Name matches.", score: 45 }]),
    publicCategories: Object.freeze([]),
    claimAction: Object.freeze({ label: "This is my organization", organizationId: "other-org" }),
  });
  assert.throws(
    () => evaluateProviderPromotion({
      evidence: value,
      command: value.command,
      authority: value.authority,
      currentMatches: [currentMatch],
      target: { account: null, profile: null, discovery: null },
      now,
    }),
    /canonical Organization search changed/,
  );
});

test("protected adapter code has an explicit release gate and cannot implicitly publish canonical provider Resources", () => {
  const source = readFileSync(
    new URL("../src/infrastructure/firestore/provider-promotion-adapter.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /RFXCHANGE_PROVIDER_PROMOTION_ENABLED/);
  assert.match(source, /provider\.seed-promotion\.commit/);
  assert.doesNotMatch(source, /firestoreDocumentPath\("providerResources"/);
  assert.doesNotMatch(source, /firestoreDocumentPath\("providerDiscoveryPublications"/);
  assert.match(source, /seededProviderResourceDrafts|resourceDrafts/);
});
