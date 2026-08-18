import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const scene = await readFile(new URL("../src/components/map/ExchangeSpatialScene.tsx", import.meta.url), "utf8");

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
});

test("governed areas require exact authority keys and legacy overlays cannot duplicate the shared projection", () => {
  assert.match(scene, /candidate\.areaId === area\.areaId[\s\S]*candidate\.geographyId === area\.geographyId[\s\S]*candidate\.geometryReference === area\.geometryReference/);
  assert.match(scene, /A shared lens projection cannot be combined with legacy domain overlay props/);
  assert.match(scene, /data-lens-projection-list-only-count/);
});
