import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createPlatformAdministratorAuthorityContext,
  ADMIN_PERMISSION_CATALOG,
} from "../src/domain/admin-authorization/model.ts";
import {
  createCanonicalGeography,
  createGeographyDatasetSource,
  createGeographyVersion,
  geographyPoint,
  geographyReference,
} from "../src/domain/geography-fabric/model.ts";
import {
  buildLocationProfileMaterialization,
} from "../src/application/geography-fabric/location-profile-materialization.ts";
import {
  createOrganizationAccount,
  createOrganizationProfile,
} from "../src/domain/organizations/model.ts";
import {
  createOrganizationDataProvenance,
  createOrganizationDiscoveryRecord,
} from "../src/domain/organization-resolution/model.ts";
import {
  createProviderCanonicalComparison,
  createProviderPromotionApproval,
  createProviderPromotionCommand,
  createProviderSeedPromotionCandidate,
} from "../src/domain/provider-seeding/promotion.ts";
import {
  createProviderCanonicalSearchSnapshot,
  createProviderSeedSourceRecord,
  providerCanonicalComparisonFingerprint,
  providerCanonicalSearchFingerprint,
  providerGeographyProfileFingerprint,
  providerPromotionApprovalFingerprint,
  providerPromotionRequestFingerprint,
  providerSeedSourceRecordFingerprint,
} from "../src/domain/provider-seeding/promotion-runtime.ts";
import {
  ProviderSeedPromotionService,
  providerPromotionAuthorityContextFingerprint,
} from "../src/application/provider-seeding/provider-promotion-service.ts";
import {
  PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTION_CONVENTIONS,
} from "../src/infrastructure/firestore/provider-seed-promotion-schema.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const now = "2026-08-23T23:45:00.000Z";
const point = geographyPoint({ longitude: -76.2859, latitude: 36.8508 });

function authority({ includePermission = true, satisfied = true } = {}) {
  return createPlatformAdministratorAuthorityContext({
    administratorId: "admin-provider-seed-1",
    rolePresetKeys: ["super-admin"],
    effectivePermissions: includePermission
      ? ["provider.seed.promote"]
      : ["provider.application.review"],
    scopeSatisfied: true,
    conditions: {
      requirement: "pre-resolved",
      status: satisfied ? "satisfied" : "unsatisfied",
      evidenceKeys: satisfied
        ? ["provider-comparison-reviewed", "promotion-confirmed"]
        : [],
    },
  });
}

function geographyPacket(organizationId = "org-seeded-1") {
  const source = createGeographyDatasetSource({
    id: "census-current-current",
    sourceSystem: "census-geocoder",
    name: "Census Current Geography",
    authority: "U.S. Census Bureau",
    sourceUrl: "https://geocoding.geo.census.gov/",
    licenseOrUseBasis: "Public federal geography service",
    vintage: "Current_Current",
    importedAt: now,
  });
  const version = createGeographyVersion({
    id: "census:country:us:current-current",
    geographyId: "census:country:us",
    datasetSourceId: source.id,
    sourceLayer: "States and Counties",
    vintage: "Current_Current",
    name: "United States",
    now,
  });
  const geography = createCanonicalGeography({
    id: "census:country:us",
    type: "country",
    name: "United States",
    externalId: "US",
    sourceSystem: "census-geocoder",
    currentVersionId: version.id,
    now,
  });
  const reference = geographyReference({ geography, version });
  const resolution = Object.freeze({
    acceptedPoint: point,
    acceptedPointFingerprint: `${point.longitude.toFixed(7)},${point.latitude.toFixed(7)}`,
    datasetSources: Object.freeze([source]),
    entries: Object.freeze([
      Object.freeze({ geography, version, reference }),
    ]),
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
    resolver: "fixture-census-resolver",
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    resolvedAt: now,
  });
  return buildLocationProfileMaterialization({
    locationId: "seed-location-1",
    organizationId,
    acceptedPoint: point,
    visibility: "approximate",
    profileVersion: 1,
    sourceLocationUpdatedAt: now,
    resolution,
    commandId: "geo-command-seed-location-1",
    eventId: "geo-event-seed-location-1",
    requestFingerprint: "geo-request-seed-location-1",
  });
}

function sourceRecord() {
  return createProviderSeedSourceRecord({
    marketKey: "hampton-roads-va",
    seedKey: "hrva-example-provider",
    displayName: "Example Provider",
    providerClass: "community-institutional",
    participationPolicy: "free-standard",
    providerType: "business-support-provider",
    resourceCategory: "business-assistance",
    serviceName: "Business Assistance",
    serviceSummary: "Source-backed business advising and technical assistance.",
    website: "https://example.org",
    aliases: ["Example Business Center"],
    serviceAreaLabels: ["Hampton Roads", "Norfolk"],
    primarySourceId: "source-example-1",
    intendedClaimState: "unclaimed",
    location: {
      locationKey: "hrva-example-provider-primary",
      label: "Example Provider",
      address: {
        addressLine1: "101 Main Street",
        addressLine2: null,
        locality: "Norfolk",
        regionCode: "VA",
        postalCode: "23510",
        countryCode: "US",
        matchedAddress: "101 Main St, Norfolk, VA 23510",
      },
      acceptedPoint: point,
      benchmark: "Public_AR_Current",
      geocodedAt: now,
    },
    sourcePlanFingerprint: "source-plan-fingerprint-1",
    donorRepository: "AccelAnalysis/TestRFx",
    donorCommit: "db19a0cc2171d0ddde4f34a20acc881ba7279248",
    preparedAt: now,
  });
}

function buildEvidence({
  targetOrganizationId = "org-seeded-1",
  outcome = "create-new-organization",
  existingDisplayName = "Example Provider",
} = {}) {
  const currentAuthority = authority();
  const authorityContextId = providerPromotionAuthorityContextFingerprint(currentAuthority);
  const source = sourceRecord();
  const geography = geographyPacket(targetOrganizationId);
  const candidate = createProviderSeedPromotionCandidate({
    marketKey: source.marketKey,
    seedKey: source.seedKey,
    displayName: source.displayName,
    providerClass: source.providerClass,
    participationPolicy: source.participationPolicy,
    providerType: source.providerType,
    resourceCategory: source.resourceCategory,
    serviceName: source.serviceName,
    website: source.website,
    aliases: source.aliases,
    primarySourceId: source.primarySourceId,
    disposition: "ready_for_canonical_comparison",
    acceptedLocationKey: source.location.locationKey,
    acceptedPointFingerprint: source.location.acceptedPointFingerprint,
    geographyEnrichmentStatus: "ready_for_profile_materialization",
    geographyProfileFingerprint: providerGeographyProfileFingerprint(geography),
    sourcePlanFingerprint: source.sourcePlanFingerprint,
    sourceRecordFingerprint: providerSeedSourceRecordFingerprint(source),
    donorRepository: source.donorRepository,
    donorCommit: source.donorCommit,
    preparedAt: source.preparedAt,
  });
  const matches = outcome === "attach-to-existing-organization"
    ? [
        Object.freeze({
          organizationId: targetOrganizationId,
          displayName: existingDisplayName,
          basis: Object.freeze(["authoritative-source-id"]),
          confidence: 1,
          evidenceSummary: "Reviewed source identity matches the existing Organization.",
        }),
      ]
    : [];
  const canonicalSearch = createProviderCanonicalSearchSnapshot({
    id: "provider-comparison-1",
    candidateId: candidate.id,
    matches,
    generatedAt: now,
  });
  const comparisonInput = {
    id: "provider-comparison-1",
    candidate,
    canonicalSearchFingerprint: providerCanonicalSearchFingerprint(canonicalSearch),
    matches,
    outcome,
    selectedOrganizationId: outcome === "attach-to-existing-organization"
      ? targetOrganizationId
      : null,
    rationale: "Canonical identity search was reviewed by an authorized administrator.",
    reviewedByAdministratorId: currentAuthority.administratorId,
    authorityContextId,
    reviewedAt: now,
  };
  const comparisonDraft = createProviderCanonicalComparison({
    ...comparisonInput,
    comparisonFingerprint: "comparison-fingerprint-placeholder",
  });
  const comparison = createProviderCanonicalComparison({
    ...comparisonInput,
    comparisonFingerprint: providerCanonicalComparisonFingerprint(comparisonDraft),
  });
  const approval = createProviderPromotionApproval({
    id: "provider-approval-1",
    candidate,
    comparison,
    decision: outcome === "attach-to-existing-organization"
      ? "approve-existing-organization"
      : "approve-new-organization",
    targetOrganizationId,
    candidateRecordFingerprint: candidate.sourceRecordFingerprint,
    geographyProfileFingerprint: candidate.geographyProfileFingerprint,
    comparisonFingerprint: comparison.comparisonFingerprint,
    rationale: "Approved for canonical non-published promotion.",
    approvedByAdministratorId: currentAuthority.administratorId,
    authorityContextId,
    approvedAt: now,
  });
  return Object.freeze({
    authority: currentAuthority,
    evidence: Object.freeze({
      candidate,
      sourceRecord: source,
      geography,
      canonicalSearch,
      comparison,
      approval,
    }),
  });
}

function buildCommand(evidence, action = "commit-approved-provider-promotion") {
  const input = {
    id: action === "commit-approved-provider-promotion"
      ? "provider-promotion-command-commit-1"
      : "provider-promotion-command-preview-1",
    action,
    candidate: evidence.candidate,
    comparison: evidence.comparison,
    approval: evidence.approval,
    targetLocationId: "seed-location-1",
    targetProviderResourceId: "provider-seed-draft-1",
    geographyProfileId: evidence.geography.profile.id,
    approvalFingerprint: providerPromotionApprovalFingerprint(evidence.approval),
    actorAdministratorId: evidence.approval.approvedByAdministratorId,
    authorityContextId: evidence.approval.authorityContextId,
    confirmation: action === "commit-approved-provider-promotion"
      ? "PROMOTE APPROVED PROVIDER"
      : null,
    recordedAt: now,
  };
  const draft = createProviderPromotionCommand({
    ...input,
    requestFingerprint: "request-fingerprint-placeholder",
  });
  return createProviderPromotionCommand({
    ...input,
    requestFingerprint: providerPromotionRequestFingerprint(draft),
  });
}

function organizationState(targetOrganizationId, displayName) {
  const account = createOrganizationAccount({ id: targetOrganizationId, now });
  const profile = createOrganizationProfile(account, {
    id: `${targetOrganizationId}:profile-existing`,
    displayName,
    now,
  });
  const provenance = createOrganizationDataProvenance({
    kind: "organization-confirmed",
    sourceLabel: "Existing canonical Organization",
    observedAt: now,
  });
  const discovery = createOrganizationDiscoveryRecord(account, profile, {
    id: `${targetOrganizationId}:discovery-existing`,
    origin: "organization-confirmed",
    identity: { displayName },
    provenance,
    now,
  });
  return Object.freeze({ account, profile, discovery });
}

function serviceFixture({
  evidenceBundle,
  currentAuthority,
  existing = null,
  currentMatches = evidenceBundle.canonicalSearch.matches,
}) {
  let committed = null;
  const service = new ProviderSeedPromotionService({
    authorityContexts: {
      async getByAdministratorId() {
        return currentAuthority;
      },
    },
    accounts: {
      async getById() {
        return existing?.account ?? null;
      },
      async create() {
        throw new Error("Direct account creation is not allowed by the service fixture.");
      },
    },
    profiles: {
      async getByOrganizationId() {
        return existing?.profile ?? null;
      },
      async create() {
        throw new Error("Direct profile creation is not allowed by the service fixture.");
      },
    },
    discovery: {
      async getByOrganizationId() {
        return existing?.discovery ?? null;
      },
      async listByGeographyId() {
        return [];
      },
      async save() {
        throw new Error("Direct discovery writes are not allowed by the service fixture.");
      },
    },
    evidence: {
      async loadForCommand() {
        return evidenceBundle;
      },
    },
    canonicalSearch: {
      async searchCurrent(input) {
        return createProviderCanonicalSearchSnapshot({
          id: `${input.candidateId}:fresh-search`,
          candidateId: input.candidateId,
          matches: currentMatches.filter(
            (match) => !input.excludeOrganizationIds.includes(match.organizationId),
          ),
          generatedAt: input.generatedAt,
        });
      },
    },
    unitOfWork: {
      async commit(writeSet) {
        committed = writeSet;
        return writeSet.receipt;
      },
    },
  });
  return Object.freeze({
    service,
    committed: () => committed,
  });
}

test("provider seed promotion permission is explicit and not ordinary provider review", () => {
  assert.ok(
    ADMIN_PERMISSION_CATALOG.some(
      (definition) => definition.key === "provider.seed.promote",
    ),
  );
  assert.ok(
    ADMIN_PERMISSION_CATALOG.some(
      (definition) => definition.key === "provider.application.review",
    ),
  );
});

test("preview validates all evidence without persisting, claiming creation, or publishing", async () => {
  const built = buildEvidence();
  const fixture = serviceFixture({
    evidenceBundle: built.evidence,
    currentAuthority: built.authority,
  });
  const receipt = await fixture.service.preview(
    buildCommand(built.evidence, "preview-approved-provider-promotion"),
  );
  assert.equal(fixture.committed(), null);
  assert.equal(receipt.status, "previewed");
  assert.equal(receipt.organizationCreated, false);
  assert.equal(receipt.organizationAttached, false);
  assert.equal(receipt.providerDiscoveryPublished, false);
  assert.equal(receipt.resourcePublished, false);
  assert.equal(receipt.officialResourceProviderGranted, false);
});

test("commit creates source-backed canonical staging without participant or publication facts", async () => {
  const built = buildEvidence();
  const fixture = serviceFixture({
    evidenceBundle: built.evidence,
    currentAuthority: built.authority,
  });
  const receipt = await fixture.service.commit(buildCommand(built.evidence));
  const writeSet = fixture.committed();
  assert.ok(writeSet);
  assert.equal(receipt.status, "committed");
  assert.equal(receipt.organizationCreated, true);
  assert.equal(receipt.organizationAttached, false);
  assert.equal(writeSet.organization.createRecords, true);
  assert.equal(writeSet.organization.discovery.origin, "seeded");
  assert.equal(writeSet.organization.discovery.authorityState, "unestablished");
  assert.equal(writeSet.organization.discovery.verificationState, "not-evaluated");
  assert.equal(writeSet.location.authorityState, "source-backed-unclaimed");
  assert.equal(writeSet.location.visibility, "approximate");
  assert.equal(writeSet.location.participantProjectionState, "withheld");
  assert.equal(writeSet.draft.status, "staged");
  assert.equal(writeSet.draft.officialResourceProviderStatus, "not-granted");
  assert.equal(writeSet.draft.providerDiscoveryStatus, "not-published");
  assert.equal(writeSet.draft.resourcePublicationStatus, "not-published");
  assert.equal(writeSet.draft.participantAuthorUserId, null);
});

test("existing-Organization attachment reuses canonical identity without overwriting it", async () => {
  const targetOrganizationId = "org-existing-1";
  const displayName = "Existing Example Provider";
  const built = buildEvidence({
    targetOrganizationId,
    outcome: "attach-to-existing-organization",
    existingDisplayName: displayName,
  });
  const existing = organizationState(targetOrganizationId, displayName);
  const fixture = serviceFixture({
    evidenceBundle: built.evidence,
    currentAuthority: built.authority,
    existing,
  });
  const receipt = await fixture.service.commit(buildCommand(built.evidence));
  const writeSet = fixture.committed();
  assert.ok(writeSet);
  assert.equal(receipt.organizationCreated, false);
  assert.equal(receipt.organizationAttached, true);
  assert.equal(writeSet.organization.mode, "attach-existing");
  assert.equal(writeSet.organization.createRecords, false);
  assert.equal(writeSet.organization.profile, existing.profile);
  assert.equal(
    writeSet.draft.canonicalOrganizationDisplayName,
    existing.profile.displayName,
  );
});

test("fresh canonical identity search blocks a new duplicate after approval", async () => {
  const built = buildEvidence();
  const fixture = serviceFixture({
    evidenceBundle: built.evidence,
    currentAuthority: built.authority,
    currentMatches: [
      Object.freeze({
        organizationId: "org-new-conflict",
        displayName: "Example Provider",
        basis: Object.freeze(["display-name"]),
        confidence: 0.85,
        evidenceSummary: "A matching canonical Organization appeared after approval.",
      }),
    ],
  });
  await assert.rejects(
    fixture.service.commit(buildCommand(built.evidence)),
    /Canonical Organization search changed after provider promotion approval/,
  );
  assert.equal(fixture.committed(), null);
});

test("stale persisted source evidence blocks promotion before the unit of work", async () => {
  const built = buildEvidence();
  const staleEvidence = Object.freeze({
    ...built.evidence,
    sourceRecord: Object.freeze({
      ...built.evidence.sourceRecord,
      serviceSummary: "Changed after approval.",
    }),
  });
  const fixture = serviceFixture({
    evidenceBundle: staleEvidence,
    currentAuthority: built.authority,
  });
  await assert.rejects(
    fixture.service.commit(buildCommand(built.evidence)),
    /source-record fingerprint is stale|no longer matches its source record/,
  );
  assert.equal(fixture.committed(), null);
});

test("missing dedicated permission or unresolved conditions blocks promotion", async () => {
  const built = buildEvidence();
  for (const currentAuthority of [
    authority({ includePermission: false }),
    authority({ satisfied: false }),
  ]) {
    const fixture = serviceFixture({
      evidenceBundle: built.evidence,
      currentAuthority,
    });
    await assert.rejects(
      fixture.service.commit(buildCommand(built.evidence)),
      /Administrative action denied/,
    );
    assert.equal(fixture.committed(), null);
  }
});

test("provider seed Firestore schema is server-only and append-only", () => {
  for (const convention of Object.values(
    PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTION_CONVENTIONS,
  )) {
    assert.equal(convention.serverOnly, true);
    assert.equal(convention.appendOnly, true);
    assert.equal(convention.mutable, false);
  }
});

test("Firestore promotion adapter cannot write participant/provider publication collections", () => {
  const source = read(
    "src/infrastructure/firestore/provider-seed-promotion-repositories.ts",
  );
  assert.match(source, /runTransaction/);
  assert.match(source, /sourceBackedLocations/);
  assert.match(source, /seedDrafts/);
  assert.match(source, /geographyFabricDocumentPath/);
  assert.doesNotMatch(
    source,
    /providerDiscoveryPublications|providerResources|providerApplications|providerServiceProfiles|organizationLocations|confirmedByUserId|confirmedByMembershipId|createdByUserId/,
  );
});
