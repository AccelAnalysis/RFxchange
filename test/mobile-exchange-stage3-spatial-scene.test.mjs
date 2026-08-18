import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const scene = await readFile(new URL("../src/components/map/ExchangeSpatialScene.tsx", import.meta.url), "utf8");
const adapter = await readFile(new URL("../src/application/participant/lens-map-projection-adapter.ts", import.meta.url), "utf8");

test("the existing spatial scene consumes one non-clustered shared projection source", () => {
  assert.match(scene, /LENS_PROJECTION_SOURCE_ID = "rfx-spatial-scene-lens-projection"/);
  assert.match(scene, /map\.addSource\(LENS_PROJECTION_SOURCE_ID, \{\s*type: "geojson",\s*data: lensProjectionGeoJsonRef\.current/);
  assert.doesNotMatch(scene, /map\.addSource\(LENS_PROJECTION_SOURCE_ID,[\s\S]{0,160}cluster: true/);
  assert.match(scene, /lensProjectionSource\?\.setData\(lensProjectionRenderModel\.data\)/);
});

test("selection callbacks use the original projection lookup and clusters only move the camera", () => {
  assert.match(scene, /lensProjectionSelectableRef\.current\.get\(renderId\)/);
  assert.match(scene, /onLensProjectionSelectRef\.current\?\.\(projection\)/);
  assert.match(scene, /lensProjectionClusterRef\.current\.get\(renderId\)/);
  assert.match(scene, /zoom: Math\.min\(map\.getZoom\(\) \+ 2, map\.getMaxZoom\(\)\)/);
  assert.doesNotMatch(scene, /lensProjectionClusterRef[\s\S]{0,500}onLensProjectionSelectRef/);
  assert.match(scene, /layers: \[\s*LENS_PROJECTION_OBJECT_LAYER_ID,\s*HOME_MARKER_CORE_LAYER_ID,\s*LENS_PROJECTION_CLUSTER_LAYER_ID/);
  assert.match(scene, /layers: \[LENS_PROJECTION_OBJECT_LAYER_ID, HOME_MARKER_CORE_LAYER_ID\]/);
  assert.doesNotMatch(scene, /map\.on\("click", HOME_MARKER_CORE_LAYER_ID[\s\S]{0,500}LENS_PROJECTION_(?:CLUSTER|AREA)/);
  assert.match(scene, /properties\?\.selectable === true/);
});

test("governed areas require exact authority keys and legacy overlays cannot duplicate the shared projection", () => {
  assert.match(adapter, /candidate\.areaId === area\.areaId[\s\S]*candidate\.geographyId === area\.geographyId[\s\S]*candidate\.geometryReference === area\.geometryReference/);
  assert.match(scene, /A shared lens projection cannot be combined with legacy domain overlay props/);
  assert.match(scene, /data-lens-projection-list-only-count/);
  assert.match(scene, /lensProjectionContainsOrganizationMarker\(lensProjectionAdapter, marker\.id\)/);
  assert.match(scene, /const sceneMarker = homeMarkerIsProjected \? null : marker/);
  assert.match(scene, /const markerRef = useRef\(marker\)/);
  assert.match(scene, /markerRef\.current = marker/);
  assert.match(scene, /markerGeoJson\(sceneMarker\)/);
  assert.match(scene, /data-lens-projection-deduplicated-home-marker/);
});
