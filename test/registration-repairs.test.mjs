import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { CensusTigerLocalityDirectory } from "../src/infrastructure/geography/census-tiger-locality-directory.ts";
import { TigerWebBoundarySnapshotRepository } from "../src/infrastructure/geography/tigerweb-boundary-snapshot.ts";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function response(body) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  }));
}

const fairfaxGeometry = {
  type: "Polygon",
  coordinates: [[
    [-77.55, 38.65],
    [-77.05, 38.65],
    [-77.05, 39.0],
    [-77.55, 39.0],
    [-77.55, 38.65],
  ]],
};

function censusFetcher(input) {
  const url = new URL(String(input));
  const isCounty = url.pathname.endsWith("/State_County/MapServer/1/query");
  const isPlace = url.pathname.endsWith("/Places_CouSub_ConCity_SubMCD/MapServer/4/query");
  assert.ok(isCounty || isPlace, `Unexpected TIGERweb layer: ${url.pathname}`);
  if (url.searchParams.get("f") === "geojson") {
    assert.equal(url.searchParams.get("where"), "GEOID='51059'");
    return response({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {
          GEOID: "51059",
          BASENAME: "Fairfax",
          NAME: "Fairfax County",
          STATE: "51",
          CENTLAT: "+38.8357",
          CENTLON: "-77.2760",
        },
        geometry: fairfaxGeometry,
      }],
    });
  }
  if (isCounty) {
    return response({
      features: [{ attributes: {
        GEOID: "51059",
        BASENAME: "Fairfax",
        NAME: "Fairfax County",
        STATE: "51",
      } }],
    });
  }
  return response({ features: [] });
}

test("registration policy acceptances link to readable public policies", async () => {
  const client = await source("src/components/onboarding/ActivationJourneyClient.tsx");
  assert.match(client, /href="\/terms" target="_blank"/);
  assert.match(client, /href="\/platform-rules" target="_blank"/);
  assert.match(client, /href="\/privacy" target="_blank"/);
  for (const path of ["app/terms/page.tsx", "app/platform-rules/page.tsx", "app/privacy/page.tsx"]) {
    const page = await source(path);
    assert.match(page, /PublicPolicyPage/);
  }
  const policies = await source("src/content/legal.ts");
  assert.match(policies, /PUBLIC_POLICY_VERSION/);
  assert.match(policies, /RFxchange Terms of Service/);
  assert.match(policies, /RFxchange Platform Rules/);
  assert.match(policies, /RFxchange Privacy Policy/);
});

test("home-locality registration uses Census TIGERweb search rather than a Portsmouth-only choice list", async () => {
  const client = await source("src/components/onboarding/ActivationJourneyClient.tsx");
  const route = await source("app/api/onboarding/activation/route.ts");
  assert.match(client, /search-geographies/);
  assert.match(client, /select-census-geography/);
  assert.match(client, /placeholder="Portsmouth, Richmond, Fairfax…"/);
  assert.match(client, /role="combobox"/);
  assert.match(client, /role="listbox"/);
  assert.doesNotMatch(client, /state\.releasedGeographies\.map/);
  assert.match(route, /CensusTigerLocalityDirectory/);
});

test("Census TIGERweb directory searches and resolves a canonical released locality server-side", async () => {
  const directory = new CensusTigerLocalityDirectory({
    fetcher: censusFetcher,
    now: () => "2026-07-31T12:00:00.000Z",
  });
  const candidates = await directory.search({ query: "Fairfax", stateCode: "VA" });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].fipsCode, "51059");
  assert.equal(candidates[0].reference, "census-tigerweb:county:VA:51059");

  const geography = await directory.resolve(candidates[0].reference);
  assert.equal(geography.id, "us-census-51059");
  assert.equal(geography.name, "Fairfax");
  assert.equal(geography.releaseState, "released");
  assert.equal(geography.fipsCode, "51059");
  assert.equal(geography.boundary.authority, "United States Census Bureau");
  assert.equal(geography.adjacentGeographyIds.length, 0);
});

test("dynamic Census locality has an authoritative boundary available to location and map workflows", async () => {
  const directory = new CensusTigerLocalityDirectory({
    fetcher: censusFetcher,
    now: () => "2026-07-31T12:00:00.000Z",
  });
  const geography = await directory.resolve("census-tigerweb:county:VA:51059");
  const definitions = {
    async getById(id) { return id === geography.id ? geography : null; },
    async save() {},
  };
  const boundaries = new TigerWebBoundarySnapshotRepository(definitions, {
    fetcher: censusFetcher,
    now: () => "2026-07-31T12:01:00.000Z",
  });
  const boundary = await boundaries.getByGeographyId(geography.id);
  assert.ok(boundary);
  assert.equal(boundary.geographyId, geography.id);
  assert.equal(boundary.provenance.sourceFeatureId, "51059");
  assert.ok(boundary.vertexCount >= 5);
});

test("email verification gives visible feedback and refreshes the RFxchange session after Firebase verification", async () => {
  const client = await source("src/components/onboarding/ActivationJourneyClient.tsx");
  assert.match(client, /setVerificationNotice/);
  assert.match(client, /reloadCurrentPrincipal/);
  assert.match(client, /if \(!principal\.emailVerified\)/);
  assert.match(client, /const refreshedSession = await exchangeSession\(\)/);
  assert.match(client, /getIdToken\(true\)/);
  assert.match(client, /Firebase still reports this email as unverified/);
});
