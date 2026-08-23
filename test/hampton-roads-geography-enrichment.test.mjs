import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildHamptonRoadsGeographyEnrichmentManifest } from "../scripts/resolve-hampton-roads-location-geographies.mjs";
import { acceptedPointFingerprint } from "../src/domain/geography-fabric/model.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const generatedAt = "2026-08-23T23:00:00.000Z";

function countryReference() {
  return Object.freeze({
    geographyId: "census:country:us",
    versionId: "census:country:us:current-current",
    type: "country",
    name: "United States",
    externalId: "US",
    sourceSystem: "census-geocoder",
    vintage: "Current_Current",
    countryCode: "US",
    stateCode: null,
    economicDevelopmentZone: false,
  });
}

function stubResolution(point) {
  const country = countryReference();
  return Object.freeze({
    acceptedPoint: point,
    acceptedPointFingerprint: acceptedPointFingerprint(point),
    datasetSources: Object.freeze([]),
    entries: Object.freeze([]),
    hierarchy: Object.freeze({
      country,
      state: null,
      countyEquivalent: null,
      place: null,
      censusTract: null,
      blockGroup: null,
      censusBlock: null,
    }),
    overlays: Object.freeze([]),
    resolver: "fixture resolver",
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    resolvedAt: generatedAt,
  });
}

test("offline Hampton Roads enrichment resolves only accepted PR 243 locations", async () => {
  let calls = 0;
  const manifest = await buildHamptonRoadsGeographyEnrichmentManifest({
    generatedAt,
    resolver: Object.freeze({
      async resolveAcceptedPoint(point) {
        calls += 1;
        return stubResolution(point);
      },
    }),
  });

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.marketKey, "hampton-roads-va");
  assert.equal(manifest.sourceProviderCandidateCount, 32);
  assert.equal(manifest.sourceAcceptedGeocodeCount, 22);
  assert.equal(manifest.counts.uniqueAcceptedLocations, 22);
  assert.equal(manifest.counts.readyForProfileMaterialization, 22);
  assert.equal(manifest.counts.needsGeographyResolution, 0);
  assert.equal(calls, 22);
  assert.equal(manifest.productionWrites, false);
  assert.equal(manifest.marketOverlay.type, "region-market");
  assert.ok(
    manifest.locations.every(
      (location) =>
        location.status === "ready_for_profile_materialization"
        && location.overlays.some((overlay) => overlay.type === "region-market")
        && location.marketOverlay.derivation === "governed-import",
    ),
  );
  assert.ok(
    manifest.locations.every((location) =>
      location.dispositions.every((disposition) =>
        ["ready_for_canonical_comparison", "needs_identity_review"].includes(
          disposition,
        ),
      ),
    ),
  );
});

test("offline enrichment records a resolver failure without promoting or dropping the location", async () => {
  let calls = 0;
  const manifest = await buildHamptonRoadsGeographyEnrichmentManifest({
    generatedAt,
    resolver: Object.freeze({
      async resolveAcceptedPoint(point) {
        calls += 1;
        if (calls === 1) throw new Error("fixture resolver unavailable");
        return stubResolution(point);
      },
    }),
  });

  assert.equal(manifest.counts.uniqueAcceptedLocations, 22);
  assert.equal(manifest.counts.readyForProfileMaterialization, 21);
  assert.equal(manifest.counts.needsGeographyResolution, 1);
  const failed = manifest.locations.find(
    (location) => location.status === "needs_geography_resolution",
  );
  assert.ok(failed);
  assert.match(failed.error, /fixture resolver unavailable/);
  assert.ok(failed.acceptedPointFingerprint);
  assert.equal(manifest.productionWrites, false);
});

test("enrichment manifest generator cannot become a direct production write path", () => {
  const source = read("scripts/resolve-hampton-roads-location-geographies.mjs");
  assert.doesNotMatch(
    source,
    /firebase-admin|firebase\/firestore|getFirestore|postgres|postgis|neon|maplibre/i,
  );
  assert.doesNotMatch(
    source,
    /\b(?:db|firestore|transaction|batch)\s*\.\s*(?:set|create|update|delete)\s*\(/i,
  );
  assert.match(source, /productionWrites: false/);
  assert.match(source, /needs_geography_resolution/);
  assert.match(source, /ready_for_profile_materialization/);
  assert.match(source, /createHamptonRoadsMarketOverlay/);
});
