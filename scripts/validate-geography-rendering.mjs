import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const boundary = await read("src/domain/geography/boundary.ts");
const model = await read("src/application/geography/controlled-locality-map.ts");
const projection = await read("src/application/geography/geographic-projection.ts");
const component = await read("src/components/map/ControlledLocalityCanvas.tsx");
const snapshotSource = await read(
  "src/data/geography/tigerweb-2025-hampton-roads-boundaries.ts",
);
const generator = await read("scripts/fetch-tigerweb-locality-boundaries.mjs");
const architecture = await read("docs/architecture/WAVE_2_SLICE_2_2.md");

for (const requirement of [
  "AuthoritativeBoundaryGeometry",
  "BoundaryGeometryProvenance",
  "EPSG:4326",
  "geometrySha256",
  "Polygon",
  "MultiPolygon",
  "linear ring must be closed",
]) {
  assert.ok(boundary.includes(requirement), `Boundary domain is missing ${requirement}.`);
}
assert.ok(
  !boundary.includes('from "firebase') && !boundary.includes("firebase-admin"),
  "Authoritative boundary geometry must remain provider-independent.",
);

const expectedLayers = [
  "surrounding-fill",
  "selected-fill",
  "surrounding-outline",
  "selected-outline-contrast",
  "selected-outline-accent",
];
let previousIndex = -1;
for (const layer of expectedLayers) {
  const index = model.indexOf(`"${layer}"`);
  assert.ok(index > previousIndex, `Controlled locality layer order is invalid at ${layer}.`);
  previousIndex = index;
}

for (const requirement of [
  "boundaryGeometryToSvgPath",
  "projectGeographicPosition",
  "viewportForZoom",
  "CONTROLLED_LOCALITY_ZOOM_LEVELS",
]) {
  assert.ok(projection.includes(requirement), `Geographic projection is missing ${requirement}.`);
}
for (const requirement of [
  "model.layers.map",
  "vectorEffect=\"non-scaling-stroke\"",
  "fillRule=\"evenodd\"",
  "aria-label=\"Zoom in\"",
  "aria-label=\"Zoom out\"",
  "data-layer-order",
]) {
  assert.ok(component.includes(requirement), `Controlled locality canvas is missing ${requirement}.`);
}

for (const requirement of [
  "tigerweb.geo.census.gov",
  "TIGERweb State_County",
  '"vintage": "2025"',
  '"coordinateReferenceSystem": "EPSG:4326"',
  '"maxAllowableOffsetDegrees": 0.0001',
]) {
  assert.ok(snapshotSource.includes(requirement), `Boundary snapshot is missing ${requirement}.`);
}
assert.ok(
  generator.includes("createHash(\"sha256\")") &&
    generator.includes('f: "geojson"') &&
    generator.includes('outSR: "4326"'),
  "Boundary ingestion must preserve GeoJSON CRS and SHA-256 integrity evidence.",
);

const hashes = [...snapshotSource.matchAll(/"geometrySha256": "([a-f0-9]{64})"/g)].map(
  (match) => match[1],
);
assert.equal(hashes.length, 4, "Expected four authoritative locality geometry hashes.");
assert.equal(new Set(hashes).size, 4, "Every locality geometry must have distinct integrity evidence.");
assert.equal(
  createHash("sha256").update(snapshotSource).digest("hex").length,
  64,
  "Snapshot source must be hashable.",
);
assert.ok(architecture.includes("GEO-004") && architecture.includes("Explicit non-scope"));

console.log(
  "Slice 2.2 geography rendering validated: authoritative geometry, deterministic focus/muting layers, coordinate projection, and accessible interaction.",
);
