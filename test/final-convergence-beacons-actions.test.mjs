import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("final convergence sequence places Geography Fabric before provider promotion and remaining RFx/media completion", () => {
  const authority = read("docs/program/RFXCHANGE_FINAL_CONVERGENCE_SEQUENCE.md");
  const beacons = authority.indexOf("### 1. Dimensional Exchange Beacons");
  const actions = authority.indexOf("### 2. Correct live Exchange action wiring");
  const geography = authority.indexOf("### 3. RFxchange Geography Fabric foundation");
  const promotion = authority.indexOf("### 4. Geography consumers and Hampton Roads canonical promotion");
  const media = authority.indexOf("### 5. Public media projection");
  const rfx = authority.indexOf("### 6. Complete RFx production workflows");
  const intelligence = authority.indexOf("### 7. Intelligence geography layers");
  assert.ok(beacons >= 0 && actions > beacons && geography > actions && promotion > geography);
  assert.ok(media > promotion && rfx > media && intelligence > rfx);
  assert.match(authority, /Operating Geographies/);
  assert.match(authority, /region\/market[\s\S]*parallel overlays/);
  assert.match(authority, /physical location, service\/coverage, performance, intended audience, past performance, and analysis geography/);
});

test("beacon renderer is one proprietary family with fixed-anchor states and no MapLibre dependency", () => {
  const renderer = read("src/components/map/exchange-beacon-images.ts");
  for (const kind of ["own", "organization", "opportunities-rfx", "resources", "intelligence", "capabilities"]) {
    assert.match(renderer, new RegExp(`"${kind}"`));
  }
  for (const state of ["default", "approximate", "selected"]) assert.match(renderer, new RegExp(`"${state}"`));
  assert.match(renderer, /TIP_Y/);
  assert.match(renderer, /setLineDash\(\[7, 5\]\)/);
  assert.match(renderer, /colors\.flare/);
  assert.match(renderer, /pixelRatio: PIXEL_RATIO/);
  assert.doesNotMatch(renderer, /maplibre|openfreemap/i);
});

test("Mapbox scene registers beacons, stacked clusters, configured presets, and privacy-aware image identity", () => {
  const scene = read("src/components/map/ExchangeSpatialScene.tsx");
  const adapter = read("src/application/participant/lens-map-projection-adapter.ts");
  assert.match(scene, /registerExchangeBeaconImages\(map\)/);
  assert.match(scene, /NETWORK_CLUSTER_BACK_LAYER_ID/);
  assert.match(scene, /OPPORTUNITY_CLUSTER_BACK_LAYER_ID/);
  assert.match(scene, /LENS_PROJECTION_CLUSTER_BACK_LAYER_ID/);
  assert.match(scene, /"icon-image": \["get", "beaconImage"\]/);
  assert.match(scene, /MAP_BASEMAP_PRESETS/);
  assert.match(scene, /setConfigProperty\("basemap", "lightPreset"/);
  assert.match(adapter, /privacy: projection\.privacy/);
  assert.match(adapter, /beaconImage:/);
  assert.match(adapter, /ownOrganizationId/);
});

test("action projection preserves handler candidates through permission refresh and binds selected Opportunity actions", () => {
  const registry = read("src/application/participant/exchange-room-actions.ts");
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const opportunity = read("src/components/rfx/OpportunityDiscoveryWorkspace.tsx");
  assert.match(registry, /handlerCandidate: ExchangeRoomActionHandler \| null/);
  assert.match(registry, /externalHandler: "opportunity-assessment"/);
  assert.match(registry, /externalHandler: "opportunity-watch"/);
  assert.match(controller, /action\.handlerCandidate/);
  assert.match(controller, /onActionIntent/);
  assert.match(opportunity, /currentOpportunityReference: selected\?\.reference \?\? null/);
  assert.match(opportunity, /<ExchangeRoomActionController/);
  assert.match(opportunity, /opportunity-watch/);
});
