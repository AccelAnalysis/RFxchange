import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const contract = await read("src/design/cartography.ts");
const locality = await read("src/application/geography/controlled-locality-map.ts");
const mapStyles = await read("src/components/map/MapboxLocalityCanvas.module.css");
const scene = await read("src/components/map/ExchangeSpatialScene.tsx");

test("Brand B3 defines one Exchange Light cartographic contract", () => {
  assert.match(contract, /EXCHANGE_LIGHT_MAPBOX_STYLE/);
  assert.match(contract, /progressiveMapDetail/);
  assert.match(contract, /proprietaryDensityGradient/);
  assert.match(contract, /focalTargetGeometry/);
  assert.match(locality, /exchangeLightCartography/);
});

test("Brand B3 replaces generic pins with organization node and satellite grammar", () => {
  assert.match(mapStyles, /content: "RF"/);
  assert.match(mapStyles, /object-node-organization-fill/);
  assert.match(mapStyles, /data-kind="organization-location"/);
  assert.doesNotMatch(mapStyles, /rotate\(-45deg\)/);
});

test("Brand B3 preserves focal marker and camera signatures", () => {
  assert.match(scene, /EXCHANGE_ORBIT_PERIOD_MS = 225_000/);
  assert.match(scene, /LOCALITY_ORBIT_PITCH = 60/);
  assert.match(scene, /ORGANIZATION_ORBIT_PITCH = 75/);
  assert.match(scene, /ORGANIZATION_ORBIT_ZOOM = 16/);
  assert.match(scene, /HOME_MARKER_CORE_LAYER_ID/);
  assert.match(scene, /HOME_MARKER_LABEL_LAYER_ID/);
});

test("Brand B3 does not authorize later-domain spatial objects", () => {
  assert.match(contract, /opportunityBeaconRequiresPublishedProjection: true/);
  assert.match(contract, /serviceFieldRequiresProviderTerritory: true/);
  assert.match(contract, /relationshipPathRequiresAuthoritativeEvent: true/);
  assert.match(contract, /syntheticLiveObjectsAllowed: false/);
});
