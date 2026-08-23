import assert from "node:assert/strict";
import test from "node:test";

import { buildLocationProfileMaterialization } from "../src/application/geography-fabric/location-profile-materialization.ts";
import { createHamptonRoadsMarketOverlay } from "../src/application/geography-fabric/market-overlays.ts";
import {
  CENSUS_GEOGRAPHY_BENCHMARK,
  CENSUS_GEOGRAPHY_VINTAGE,
  CensusAcceptedPointGeographyResolver,
  parseCensusCoordinateGeographies,
} from "../src/infrastructure/geography/census-geography-resolver.ts";

const now = "2026-08-23T22:00:00.000Z";
const point = Object.freeze({ longitude: -76.342, latitude: 37.029 });

const censusPayload = Object.freeze({
  result: Object.freeze({
    geographies: Object.freeze({
      States: Object.freeze([
        Object.freeze({ GEOID: "51", NAME: "Virginia", STUSAB: "VA", STATE: "51" }),
      ]),
      Counties: Object.freeze([
        Object.freeze({
          GEOID: "51520",
          NAME: "Hampton city",
          STATE: "51",
          COUNTY: "520",
          BASENAME: "Hampton",
        }),
      ]),
      "Census Designated Places": Object.freeze([
        Object.freeze({
          GEOID: "5170000",
          NAME: "Test CDP",
          STATE: "51",
        }),
      ]),
      "Incorporated Places": Object.freeze([
        Object.freeze({
          GEOID: "5135000",
          NAME: "Hampton city",
          STATE: "51",
        }),
      ]),
      "Census Tracts": Object.freeze([
        Object.freeze({
          GEOID: "51520010100",
          NAME: "Census Tract 101",
          STATE: "51",
          COUNTY: "520",
          TRACT: "010100",
        }),
      ]),
      "Census Block Groups": Object.freeze([
        Object.freeze({
          GEOID: "515200101001",
          NAME: "Block Group 1",
          STATE: "51",
          COUNTY: "520",
          TRACT: "010100",
          BLKGRP: "1",
        }),
      ]),
      "Census Blocks": Object.freeze([
        Object.freeze({
          GEOID: "515200101001000",
          NAME: "Block 1000",
          STATE: "51",
          COUNTY: "520",
          TRACT: "010100",
          BLKGRP: "1",
          BLOCK: "1000",
        }),
      ]),
      "Metropolitan Statistical Areas": Object.freeze([
        Object.freeze({
          GEOID: "47260",
          NAME: "Virginia Beach-Chesapeake-Norfolk, VA-NC Metro Area",
          STATE: "51",
        }),
      ]),
      "Combined Statistical Areas": Object.freeze([
        Object.freeze({
          GEOID: "545",
          NAME: "Virginia Beach-Chesapeake, VA-NC Combined Statistical Area",
          STATE: "51",
        }),
      ]),
      "ZIP Code Tabulation Areas": Object.freeze([
        Object.freeze({ GEOID: "23666", NAME: "ZCTA5 23666", STATE: "51" }),
      ]),
      "119th Congressional Districts": Object.freeze([
        Object.freeze({ GEOID: "5103", NAME: "Congressional District 3", STATE: "51" }),
      ]),
      "Unified School Districts": Object.freeze([
        Object.freeze({ GEOID: "5101860", NAME: "Hampton City Public Schools", STATE: "51" }),
      ]),
    }),
  }),
});

function resolution() {
  return parseCensusCoordinateGeographies({
    payload: censusPayload,
    acceptedPoint: point,
    benchmark: CENSUS_GEOGRAPHY_BENCHMARK,
    vintage: CENSUS_GEOGRAPHY_VINTAGE,
    resolvedAt: now,
  });
}

test("Census layers=all parsing creates source-qualified physical hierarchy and parallel overlays", () => {
  const value = resolution();
  assert.equal(value.acceptedPointFingerprint, "-76.3420000,37.0290000");
  assert.equal(value.hierarchy.country.type, "country");
  assert.equal(value.hierarchy.state.name, "Virginia");
  assert.equal(value.hierarchy.countyEquivalent.type, "county-equivalent");
  assert.equal(value.hierarchy.place.externalId, "5135000");
  assert.equal(value.hierarchy.censusTract.externalId, "51520010100");
  assert.equal(value.hierarchy.blockGroup.externalId, "515200101001");
  assert.equal(value.hierarchy.censusBlock.externalId, "515200101001000");

  const overlayTypes = new Set(value.overlays.map((reference) => reference.type));
  assert.deepEqual(
    overlayTypes,
    new Set([
      "msa",
      "csa",
      "zip-zcta",
      "congressional-district",
      "school-district-unified",
    ]),
  );
  assert.ok(!overlayTypes.has("region-market"));
  assert.equal(value.datasetSources[0].authority, "United States Census Bureau");
  assert.equal(value.datasetSources[0].vintage, CENSUS_GEOGRAPHY_VINTAGE);
});

test("Census physical geography versions retain deterministic parent-version relationships", () => {
  const value = resolution();
  const byType = new Map(value.entries.map((entry) => [entry.reference.type, entry]));
  assert.equal(
    byType.get("state").version.parentVersionId,
    byType.get("country").version.id,
  );
  assert.equal(
    byType.get("county-equivalent").version.parentVersionId,
    byType.get("state").version.id,
  );
  assert.equal(
    byType.get("place").version.parentVersionId,
    byType.get("county-equivalent").version.id,
  );
  assert.equal(
    byType.get("census-tract").version.parentVersionId,
    byType.get("county-equivalent").version.id,
  );
  assert.equal(
    byType.get("block-group").version.parentVersionId,
    byType.get("census-tract").version.id,
  );
  assert.equal(
    byType.get("census-block").version.parentVersionId,
    byType.get("block-group").version.id,
  );
});

test("Accepted-location materialization attaches Hampton Roads as an overlay without moving the point", () => {
  const market = createHamptonRoadsMarketOverlay(now);
  const packet = buildLocationProfileMaterialization({
    locationId: "provider-location-1",
    organizationId: "provider-org-1",
    operatingGeographyId: "hampton-operating",
    acceptedPoint: point,
    visibility: "exact",
    profileVersion: 1,
    sourceLocationUpdatedAt: now,
    resolution: resolution(),
    additionalOverlays: [
      Object.freeze({
        entry: market.entry,
        datasetSource: market.datasetSource,
        derivation: "governed-import",
      }),
    ],
    commandId: "geo-command-provider-location-1-v1",
    eventId: "geo-event-provider-location-1-v1",
    requestFingerprint: "sha256:provider-location-1-v1",
  });

  assert.deepEqual(packet.profile.acceptedPoint, point);
  assert.equal(packet.profile.acceptedPointFingerprint, "-76.3420000,37.0290000");
  assert.ok(packet.profile.overlays.some((reference) => reference.type === "region-market"));
  assert.ok(packet.profile.overlays.some((reference) => reference.type === "msa"));
  assert.ok(
    packet.memberships.some(
      (membership) =>
        membership.geographyType === "region-market"
        && membership.role === "market"
        && membership.derivation === "governed-import",
    ),
  );
  assert.equal(packet.command.subjectId, packet.profile.id);
  assert.equal(packet.event.commandId, packet.command.id);
  assert.equal(packet.geographies.length, packet.versions.length);
  assert.equal(packet.profile.membershipIds.length, packet.memberships.length);
});

test("Materialization rejects resolver output for a different accepted coordinate", () => {
  assert.throws(
    () =>
      buildLocationProfileMaterialization({
        locationId: "provider-location-1",
        organizationId: "provider-org-1",
        acceptedPoint: { longitude: -76.5, latitude: 37.2 },
        visibility: "exact",
        profileVersion: 1,
        sourceLocationUpdatedAt: now,
        resolution: resolution(),
        commandId: "geo-command-mismatch",
        eventId: "geo-event-mismatch",
        requestFingerprint: "sha256:mismatch",
      }),
    /does not match the already accepted location coordinate/,
  );
});

test("Census resolver requests coordinate geoLookup layers=all and retries bounded transient failures", async () => {
  const requests = [];
  const resolver = new CensusAcceptedPointGeographyResolver({
    maximumAttempts: 2,
    timeoutMs: 2_000,
    now: () => now,
    fetchImpl: async (url, init) => {
      requests.push({ url: new URL(url), init });
      if (requests.length === 1) {
        return new Response("temporary", { status: 503 });
      }
      return new Response(JSON.stringify(censusPayload), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  const value = await resolver.resolveAcceptedPoint(point);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url.searchParams.get("layers"), "all");
  assert.equal(requests[0].url.searchParams.get("benchmark"), CENSUS_GEOGRAPHY_BENCHMARK);
  assert.equal(requests[0].url.searchParams.get("vintage"), CENSUS_GEOGRAPHY_VINTAGE);
  assert.equal(requests[0].url.searchParams.get("x"), String(point.longitude));
  assert.equal(requests[0].url.searchParams.get("y"), String(point.latitude));
  assert.equal(value.hierarchy.place.name, "Hampton city");
});

test("Census parser rejects empty geography results instead of inventing locality", () => {
  assert.throws(
    () =>
      parseCensusCoordinateGeographies({
        payload: { result: { geographies: {} } },
        acceptedPoint: point,
        resolvedAt: now,
      }),
    /returned no geography/,
  );
});
