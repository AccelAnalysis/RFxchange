import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [contract, localityModel, mapboxCanvas, mapboxStyles, spatialScene, spatialStyles, roadmap] = await Promise.all([
  read("src/design/cartography.ts"),
  read("src/application/geography/controlled-locality-map.ts"),
  read("src/components/map/MapboxLocalityCanvas.tsx"),
  read("src/components/map/MapboxLocalityCanvas.module.css"),
  read("src/components/map/ExchangeSpatialScene.tsx"),
  read("src/components/map/ExchangeSpatialScene.module.css"),
  read("docs/brand/BRAND_IMPLEMENTATION_ROADMAP.md"),
]);

for (const requirement of [
  "EXCHANGE_LIGHT_MAPBOX_STYLE",
  "exchangeLightBasemapConfig",
  "exchangeLightCartography",
  "progressiveMapDetail",
  "proprietaryDensityGradient",
  "focalTargetGeometry",
  "cartographyDomainPolicy",
]) {
  assert.ok(contract.includes(requirement), `Brand B3 cartography contract is missing ${requirement}.`);
}

for (const renderer of [mapboxCanvas, spatialScene]) {
  for (const requirement of [
    'style: "mapbox://styles/mapbox/standard"',
    'lightPreset: "day"',
    'theme: "faded"',
    "showTransitLabels: false",
    "show3dObjects: true",
    "map.fitBounds",
    "map.easeTo",
    'label: "2D"',
    'label: "Perspective"',
    'label: "3D"',
  ]) {
    assert.ok(renderer.includes(requirement), `Brand B3 renderer is missing ${requirement}.`);
  }
}

assert.ok(
  localityModel.includes('import { exchangeLightCartography } from "../../design/cartography.ts"') &&
    localityModel.includes("selectedLocalityFill") &&
    localityModel.includes("selectedLocalityAccent") &&
    localityModel.includes("nonFocusMask"),
  "Controlled locality styling must consume the Exchange Light cartography authority.",
);

assert.ok(
  mapboxStyles.includes('content: "RF"') &&
    mapboxStyles.includes("--object-node-organization-fill") &&
    mapboxStyles.includes("--object-node-selected-ring") &&
    mapboxStyles.includes('[data-kind="organization-location"]') &&
    mapboxStyles.includes("--object-node-additional-location-ring"),
  "Mapbox point overlays must use organization-node and subordinate-location grammar.",
);
assert.equal(
  mapboxStyles.includes("rotate(-45deg)"),
  false,
  "Brand B3 cannot retain the generic teardrop pin geometry.",
);
assert.equal(
  /#(?:0b0b0d|f7f3ea|252932|d6a23a|8a6418|2e5eaa|3b7b57)\b/i.test(`${mapboxStyles}\n${spatialStyles}`),
  false,
  "Brand B3 map interface styling must consume semantic tokens instead of approved raw palette literals.",
);

for (const preserved of [
  "HOME_MARKER_HALO_LAYER_ID",
  "HOME_MARKER_CORE_LAYER_ID",
  "HOME_MARKER_RF_LAYER_ID",
  "HOME_MARKER_LABEL_LAYER_ID",
  "EXCHANGE_ORBIT_PERIOD_MS = 225_000",
  "LOCALITY_ORBIT_PITCH = 60",
  "ORGANIZATION_ORBIT_PITCH = 75",
  "ORGANIZATION_ORBIT_ZOOM = 16",
]) {
  assert.ok(spatialScene.includes(preserved), `PR #99 focal marker/camera contract is missing ${preserved}.`);
}

assert.ok(
  contract.includes("opportunityBeaconRequiresPublishedProjection: true") &&
    contract.includes("serviceFieldRequiresProviderTerritory: true") &&
    contract.includes("relationshipPathRequiresAuthoritativeEvent: true") &&
    contract.includes("syntheticLiveObjectsAllowed: false") &&
    contract.includes("nonSpatialObjectsMayNotReceivePointCoordinates: true"),
  "Brand B3 must preserve domain-availability and spatial-truth boundaries.",
);
for (const prohibitedLayer of [
  "OPPORTUNITY_BEACON_LAYER_ID",
  "PROVIDER_SERVICE_FIELD_LAYER_ID",
  "LIVE_REFERRAL_PATH_LAYER_ID",
  "CREDIBILITY_SEAL_LAYER_ID",
  "OUTCOME_PATH_LAYER_ID",
]) {
  assert.equal(
    `${mapboxCanvas}\n${spatialScene}`.includes(prohibitedLayer),
    false,
    `Brand B3 cannot fabricate later-domain layer ${prohibitedLayer}.`,
  );
}

assert.ok(
  roadmap.includes("Brand Gate B3 — Mapbox/cartographic convergence") &&
    roadmap.includes("real marker remains anchored and visible in default 3D, 2D, Fit home and manual interaction"),
  "Brand B3 implementation must remain aligned with canonical acceptance.",
);

console.log(
  "Brand Gate B3 cartographic convergence validated: Exchange Light locality fields, proprietary organization nodes, subordinate-location grammar, progressive detail and density contracts, preserved PR #99 camera/marker behavior, and no fabricated later-domain map objects.",
);
