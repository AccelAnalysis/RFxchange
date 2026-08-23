import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildHamptonRoadsPromotionReviewManifest,
  compileHamptonRoadsPromotionComparison,
} from "../src/application/provider-seeding/hampton-roads-promotion-review.ts";
import {
  acceptedPointFingerprint,
  createCanonicalGeography,
  createGeographyDatasetSource,
  createGeographyVersion,
  geographyReference,
} from "../src/domain/geography-fabric/model.ts";
import {
  createProviderCanonicalSearchSnapshot,
} from "../src/domain/provider-seeding/promotion-runtime.ts";
import {
  buildHamptonRoadsGeographyEnrichmentManifest,
} from "../scripts/resolve-hampton-roads-location-geographies.mjs";
import {
  buildHamptonRoadsProviderMigrationPlan,
} from "../scripts/prepare-hampton-roads-provider-migration.mjs";
import {
  prepareHamptonRoadsProviderPromotionReview,
} from "../scripts/prepare-hampton-roads-provider-promotion-review.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const generatedAt = "2026-08-24T00:15:00.000Z";

function fixtureResolution(point) {
  const source = createGeographyDatasetSource({
    id: "fixture-census-current-current",
    sourceSystem: "census-geocoder",
    name: "Fixture Census Geography",
    authority: "U.S. Census Bureau",
    sourceUrl: "https://geocoding.geo.census.gov/",
    licenseOrUseBasis: "Public federal geography service",
    vintage: "Current_Current",
    importedAt: generatedAt,
  });
  const version = createGeographyVersion({
    id: "fixture:country:us:current-current",
    geographyId: "fixture:country:us",
    datasetSourceId: source.id,
    sourceLayer: "States and Counties",
    vintage: "Current_Current",
    name: "United States",
    now: generatedAt,
  });
  const geography = createCanonicalGeography({
    id: "fixture:country:us",
    type: "country",
    name: "United States",
    externalId: "US",
    sourceSystem: "census-geocoder",
    currentVersionId: version.id,
    now: generatedAt,
  });
  const reference = geographyReference({ geography, version });
  return Object.freeze({
    acceptedPoint: point,
    acceptedPointFingerprint: acceptedPointFingerprint(point),
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
    resolvedAt: generatedAt,
  });
}

async function reviewManifest() {
  const plan = await buildHamptonRoadsProviderMigrationPlan();
  const geographyManifest = await buildHamptonRoadsGeographyEnrichmentManifest({
    plan,
    generatedAt,
    resolver: Object.freeze({
      async resolveAcceptedPoint(point) {
        return fixtureResolution(point);
      },
    }),
  });
  return buildHamptonRoadsPromotionReviewManifest({
    plan,
    geographyManifest,
    generatedAt,
  });
}

test("Hampton Roads review joins all source records without inferring approval", async () => {
  const review = await reviewManifest();
  assert.equal(review.schemaVersion, 1);
  assert.equal(review.marketKey, "hampton-roads-va");
  assert.equal(review.productionWrites, false);
  assert.equal(review.approvalsInferred, false);
  assert.deepEqual(review.counts, {
    sourceCandidates: 32,
    readyForCanonicalSearch: 11,
    identityReviewRequired: 11,
    needsGeographyResolution: 0,
    blocked: 10,
  });
  assert.equal(review.items.length, 32);
  assert.ok(
    review.items
      .filter((item) => item.status === "ready-for-canonical-search")
      .every(
        (item) =>
          item.sourceRecord
          && item.geographyResolution
          && item.geographyResolutionFingerprint
          && item.promotionEligible === false,
      ),
  );
  assert.ok(
    review.items
      .filter((item) => item.status === "identity-review-required")
      .every((item) => item.promotionEligible === false),
  );
  assert.ok(
    review.items
      .filter((item) => item.status === "blocked")
      .every((item) => !item.geographyResolution),
  );
});

test("accepted point and Geography Fabric resolution remain invariant", async () => {
  const review = await reviewManifest();
  for (const item of review.items.filter((entry) => entry.sourceRecord)) {
    if (!item.geographyResolution) continue;
    assert.equal(
      item.sourceRecord.location.acceptedPointFingerprint,
      item.geographyResolution.acceptedPointFingerprint,
    );
    assert.deepEqual(
      item.sourceRecord.location.acceptedPoint,
      item.geographyResolution.acceptedPoint,
    );
  }
});

test("ordinary reviewed search compiles target-specific Geography and comparison evidence", async () => {
  const review = await reviewManifest();
  const item = review.items.find(
    (entry) => entry.status === "ready-for-canonical-search",
  );
  assert.ok(item?.sourceRecord);
  const canonicalSearch = createProviderCanonicalSearchSnapshot({
    id: `${item.seedKey}:search`,
    candidateId: item.sourceRecord.id,
    matches: [],
    generatedAt,
  });
  const packet = compileHamptonRoadsPromotionComparison({
    item,
    canonicalSearch,
    outcome: "create-new-organization",
    targetOrganizationId: `seeded-${item.seedKey}`,
    reviewedByAdministratorId: "admin-review-1",
    authorityContextId: "authority-review-1",
    reviewedAt: generatedAt,
  });
  assert.equal(packet.productionWrites, false);
  assert.equal(packet.approvalCreated, false);
  assert.equal(packet.geography.profile.organizationId, `seeded-${item.seedKey}`);
  assert.equal(packet.geography.profile.visibility, "approximate");
  assert.equal(packet.candidate.geographyEnrichmentStatus, "ready_for_profile_materialization");
  assert.equal(packet.comparison.outcome, "create-new-organization");
  assert.equal(packet.comparison.selectedOrganizationId, null);
});

test("existing Organization target must appear in current canonical search evidence", async () => {
  const review = await reviewManifest();
  const item = review.items.find(
    (entry) => entry.status === "ready-for-canonical-search",
  );
  assert.ok(item?.sourceRecord);
  const canonicalSearch = createProviderCanonicalSearchSnapshot({
    id: `${item.seedKey}:search-existing`,
    candidateId: item.sourceRecord.id,
    matches: [
      Object.freeze({
        organizationId: "org-existing-provider",
        displayName: "Existing Provider",
        basis: Object.freeze(["website-domain"]),
        confidence: 0.98,
        evidenceSummary: "Current canonical domain match.",
      }),
    ],
    generatedAt,
  });
  assert.throws(
    () =>
      compileHamptonRoadsPromotionComparison({
        item,
        canonicalSearch,
        outcome: "attach-to-existing-organization",
        targetOrganizationId: "org-not-in-search",
        reviewedByAdministratorId: "admin-review-1",
        authorityContextId: "authority-review-1",
        reviewedAt: generatedAt,
      }),
    /target in current search evidence/,
  );
});

test("identity-review and blocked items cannot enter ordinary comparison", async () => {
  const review = await reviewManifest();
  for (const status of ["identity-review-required", "blocked"]) {
    const item = review.items.find((entry) => entry.status === status);
    assert.ok(item);
    const candidateId = item.sourceRecord?.id ?? "blocked-provider-seed";
    const canonicalSearch = createProviderCanonicalSearchSnapshot({
      id: `${item.seedKey}:blocked-search`,
      candidateId,
      matches: [],
      generatedAt,
    });
    assert.throws(
      () =>
        compileHamptonRoadsPromotionComparison({
          item,
          canonicalSearch,
          outcome: "create-new-organization",
          targetOrganizationId: `seeded-${item.seedKey}`,
          reviewedByAdministratorId: "admin-review-1",
          authorityContextId: "authority-review-1",
          reviewedAt: generatedAt,
        }),
      /Only a geography-ready ordinary comparison item/,
    );
  }
});

test("offline review script requires explicit enrichment and cannot write production", async () => {
  await assert.rejects(
    prepareHamptonRoadsProviderPromotionReview({ generatedAt }),
    /requires the offline Geography Fabric enrichment manifest/,
  );
  const source = read("scripts/prepare-hampton-roads-provider-promotion-review.mjs");
  assert.doesNotMatch(
    source,
    /firebase-admin|firebase\/firestore|getFirestore|\.set\(|\.create\(|\.update\(|postgres|postgis|neon/i,
  );
  assert.match(source, /productionWrites: false/);
  assert.match(source, /approvalsInferred: false/);
});
