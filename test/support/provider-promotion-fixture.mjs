import {
  createPlatformAdministratorAuthorityContext,
} from "../../src/domain/admin-authorization/model.ts";
import {
  createProviderCanonicalComparison,
  createProviderPromotionApproval,
  createProviderPromotionCommand,
  createProviderSeedPromotionCandidate,
} from "../../src/domain/provider-seeding/promotion.ts";
import {
  providerApprovalFingerprint,
  providerCanonicalSearchFingerprint,
  providerComparisonFingerprint,
  providerGeographyProfileFingerprint,
  providerPromotionAuthorityContextFingerprint,
  providerPromotionRequestFingerprint,
  providerSourcePlanFingerprint,
  providerSourceRecordFingerprint,
} from "../../src/application/provider-seeding/promotion-fingerprints.ts";

export const PROVIDER_PROMOTION_FIXTURE_NOW = "2026-08-23T23:45:00.000Z";

export function providerPromotionGeographyPacket(suffix = "001") {
  const now = PROVIDER_PROMOTION_FIXTURE_NOW;
  const locationId = `seeded-location-${suffix}`;
  const source = Object.freeze({
    id: `dataset-census-current-${suffix}`,
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
    id: `census:country:us-${suffix}`,
    type: "country",
    name: "United States",
    countryCode: "US",
    stateCode: null,
    externalId: `US-${suffix}`,
    sourceSystem: "census-geocoder",
    economicDevelopmentZone: false,
    currentVersionId: `census:country:us-${suffix}:current-current`,
    createdAt: now,
    updatedAt: now,
  });
  const version = Object.freeze({
    id: geography.currentVersionId,
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
    externalId: geography.externalId,
    sourceSystem: "census-geocoder",
    vintage: version.vintage,
    parentVersionId: null,
    countryCode: "US",
    stateCode: null,
    economicDevelopmentZone: false,
  });
  const membership = Object.freeze({
    id: `${locationId}:1:${version.id}`,
    locationId,
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
    id: locationId,
    locationId,
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
    id: `geography-seed-command-${suffix}`,
    action: "materialize-location-profile",
    organizationId: null,
    subjectId: profile.id,
    requestFingerprint: `sha256:geography-${suffix}`,
    actorUserId: null,
    actorMembershipId: null,
    recordedAt: now,
  });
  const event = Object.freeze({
    id: `geography-seed-event-${suffix}`,
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

export function createProviderPromotionFixture(suffix = "001") {
  const now = PROVIDER_PROMOTION_FIXTURE_NOW;
  const authority = createPlatformAdministratorAuthorityContext({
    administratorId: `admin-provider-promotion-${suffix}`,
    rolePresetKeys: ["super-admin"],
    effectivePermissions: [
      "provider.seed-promotion.preview",
      "provider.seed-promotion.commit",
    ],
    scopeSatisfied: true,
    conditions: {
      requirement: "pre-resolved",
      status: "satisfied",
      evidenceKeys: [
        `reauth:provider-promotion-${suffix}`,
        `release:hampton-roads-${suffix}`,
      ],
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
    dispositionCounts: Object.freeze({
      ready_for_canonical_comparison: 14,
      needs_identity_review: 8,
      needs_geocode_review: 3,
      off_map_unresolved: 2,
      held_out: 5,
    }),
  });
  const planFingerprint = providerSourcePlanFingerprint(plan);
  const packet = providerPromotionGeographyPacket(suffix);
  const geographyFingerprint = providerGeographyProfileFingerprint(packet);
  const candidateId = `hampton-roads-va:provider-${suffix}`;
  let source = Object.freeze({
    id: candidateId,
    candidateId,
    seedKey: `provider-${suffix}`,
    displayName: `Hampton Roads Business Center ${suffix}`,
    serviceSummary: "Source-backed business counseling and technical assistance.",
    serviceAreaLabels: Object.freeze(["Hampton Roads, Virginia"]),
    primarySourceId: `source-${suffix}`,
    website: `https://provider-${suffix}.example.org/`,
    aliases: Object.freeze([`HR Business Center ${suffix}`]),
    acceptedLocation: Object.freeze({
      locationKey: packet.profile.locationId,
      label: "Main office",
      addressLine1: "100 Main Street",
      addressLine2: null,
      locality: "Hampton",
      regionCode: "VA",
      postalCode: "23666",
      countryCode: "US",
      matchedAddress: "100 MAIN ST, HAMPTON, VA, 23666",
      acceptedPoint: packet.profile.acceptedPoint,
      acceptedPointFingerprint: packet.profile.acceptedPointFingerprint,
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
    id: candidateId,
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
    id: `comparison-provider-${suffix}-v1`,
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
  const targetOrganizationId = `seeded-org-provider-${suffix}`;
  const approval = createProviderPromotionApproval({
    id: `approval-provider-${suffix}-v1`,
    candidate,
    comparison,
    decision: "approve-new-organization",
    targetOrganizationId,
    candidateRecordFingerprint: recordFingerprint,
    geographyProfileFingerprint: geographyFingerprint,
    comparisonFingerprint,
    rationale: "Create an unclaimed canonical Organization with unpublished seeded provider records.",
    approvedByAdministratorId: String(authority.administratorId),
    authorityContextId: authorityFingerprint,
    approvedAt: now,
  });
  const approvalFingerprint = providerApprovalFingerprint(approval);
  const commandInput = Object.freeze({
    candidate,
    comparison,
    approval,
    targetLocationId: packet.profile.locationId,
    targetProviderResourceId: `seeded-resource-provider-${suffix}`,
    geographyProfileId: packet.profile.id,
    approvalFingerprint,
    actorAdministratorId: String(authority.administratorId),
    authorityContextId: authorityFingerprint,
    recordedAt: now,
  });
  let commitCommand = createProviderPromotionCommand({
    id: `promotion-command-provider-${suffix}`,
    action: "commit-approved-provider-promotion",
    ...commandInput,
    requestFingerprint: "pending",
    confirmation: "PROMOTE APPROVED PROVIDER",
  });
  commitCommand = createProviderPromotionCommand({
    id: commitCommand.id,
    action: commitCommand.action,
    ...commandInput,
    requestFingerprint: providerPromotionRequestFingerprint(commitCommand),
    confirmation: "PROMOTE APPROVED PROVIDER",
  });
  let previewCommand = createProviderPromotionCommand({
    id: `promotion-preview-provider-${suffix}`,
    action: "preview-approved-provider-promotion",
    ...commandInput,
    requestFingerprint: "pending",
  });
  previewCommand = createProviderPromotionCommand({
    id: previewCommand.id,
    action: previewCommand.action,
    ...commandInput,
    requestFingerprint: providerPromotionRequestFingerprint(previewCommand),
  });
  return Object.freeze({
    authority,
    candidate,
    source,
    geography,
    comparison,
    approval,
    commitCommand,
    previewCommand,
    targetOrganizationId,
    evidence: Object.freeze({ candidate, source, geography, comparison, approval }),
  });
}
