import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CONTROLLED_LOCALITY_LAYER_ORDER,
  CONTROLLED_LOCALITY_LAYER_STYLES,
} from "../src/application/geography/controlled-locality-map.ts";
import {
  boundaryGeometryToSvgPath,
  projectGeographicPosition,
  viewportForZoom,
} from "../src/application/geography/geographic-projection.ts";
import { createPortsmouthControlledLocalityPreview } from "../src/data/geography/portsmouth-controlled-locality-preview.ts";
import {
  createAuthoritativeBoundaryGeometry,
} from "../src/domain/geography/boundary.ts";

const component = await readFile(
  new URL("../src/components/map/ControlledLocalityCanvas.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../src/components/map/ControlledLocalityCanvas.module.css", import.meta.url),
  "utf8",
);

function contrast(hexA, hexB) {
  const luminance = (hex) => {
    const channels = hex
      .slice(1)
      .match(/.{2}/g)
      .map((value) => {
        const channel = Number.parseInt(value, 16) / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const [lighter, darker] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function firstPathPoint(path) {
  const match = path.match(/^M(-?[\d.]+) (-?[\d.]+)/);
  assert.ok(match, "SVG path must begin with a projected move command.");
  return { x: Number(match[1]), y: Number(match[2]) };
}

test("GEO-004 loads authoritative Census TIGERweb geometry with versioned provenance and integrity", async () => {
  const model = await createPortsmouthControlledLocalityPreview();
  assert.equal(model.features.length, 4);
  for (const feature of model.features) {
    assert.equal(feature.boundary.provenance.authority, "United States Census Bureau");
    assert.equal(feature.boundary.provenance.dataset, "TIGERweb State_County");
    assert.equal(feature.boundary.provenance.vintage, "2025");
    assert.equal(feature.boundary.provenance.coordinateReferenceSystem, "EPSG:4326");
    assert.equal(feature.boundary.provenance.sourceFeatureId, feature.geography.fipsCode);
    assert.ok(feature.boundary.provenance.queryUrl.includes("f=geojson"));
    assert.ok(feature.boundary.vertexCount > 25, "Authoritative geometry must not collapse to a box.");
    assert.equal(
      createHash("sha256").update(JSON.stringify(feature.boundary.geometry)).digest("hex"),
      feature.boundary.provenance.geometrySha256,
    );
  }
});

test("GEO-004 rejects malformed, unclosed and provenance-mismatched boundary geometry", async () => {
  const model = await createPortsmouthControlledLocalityPreview();
  const selected = model.selectedGeography;
  const selectedFeature = model.features.find((feature) => feature.role === "selected");
  assert.ok(selectedFeature);
  const input = {
    id: "bad-boundary:2025:000",
    provenance: {
      ...selectedFeature.boundary.provenance,
      geometrySha256: "0".repeat(64),
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-76.4, 36.8],
          [-76.3, 36.8],
          [-76.3, 36.9],
          [-76.35, 36.85],
        ],
      ],
    },
  };
  assert.throws(
    () =>
      createAuthoritativeBoundaryGeometry(selected, {
        ...input,
        geometry: input.geometry,
      }),
    /linear ring must be closed/,
  );
  assert.throws(
    () =>
      createAuthoritativeBoundaryGeometry(selected, {
        ...input,
        provenance: { ...input.provenance, sourceFeatureId: "00000" },
        geometry: selectedFeature.boundary.geometry,
      }),
    /provenance does not match/,
  );
});

test("GEO-005/006 produce deterministic fills followed by surrounding and selected outlines", async () => {
  const model = await createPortsmouthControlledLocalityPreview();
  assert.deepEqual(
    model.layers.map((layer) => layer.id),
    CONTROLLED_LOCALITY_LAYER_ORDER,
  );
  assert.deepEqual(
    model.layers.map((layer) => layer.order),
    [10, 20, 30, 40, 50],
  );
  assert.equal(model.layers[0].features.length, 3);
  assert.ok(model.layers[0].features.every((feature) => feature.role === "surrounding"));
  assert.equal(model.layers[1].features.length, 1);
  assert.equal(model.layers[1].features[0].geography.id, "us-va-portsmouth");
  assert.equal(model.layers.at(-1).id, "selected-outline-accent");
  assert.equal(CONTROLLED_LOCALITY_LAYER_STYLES["surrounding-fill"].fillOpacity, 0.24);
  assert.equal(CONTROLLED_LOCALITY_LAYER_STYLES["selected-outline-accent"].stroke, "#d6a23a");
});

test("GEO-005 keeps the selected locality fitted and centered across multiple zoom levels", async () => {
  const model = await createPortsmouthControlledLocalityPreview();
  const nearby = viewportForZoom(model.camera.bounds, 1100, 700, "nearby");
  const locality = viewportForZoom(model.camera.bounds, 1100, 700, "locality");
  const focus = viewportForZoom(model.camera.bounds, 1100, 700, "focus");
  const center = model.camera.center;
  for (const viewport of [nearby, locality, focus]) {
    assert.deepEqual(projectGeographicPosition([center.longitude, center.latitude], viewport), {
      x: 550,
      y: 350,
    });
  }
  assert.ok(nearby.bounds.east - nearby.bounds.west > locality.bounds.east - locality.bounds.west);
  assert.ok(locality.bounds.east - locality.bounds.west > focus.bounds.east - focus.bounds.west);
});

test("coordinate-anchored geometry retains the same projected anchor during zoom interaction", async () => {
  const model = await createPortsmouthControlledLocalityPreview();
  const selected = model.features.find((feature) => feature.role === "selected");
  assert.ok(selected);
  const geometry = selected.boundary.geometry;
  const firstPosition =
    geometry.type === "Polygon"
      ? geometry.coordinates[0][0]
      : geometry.coordinates[0][0][0];

  for (const zoom of ["nearby", "locality", "focus"]) {
    const viewport = viewportForZoom(model.camera.bounds, 1100, 700, zoom);
    const projected = projectGeographicPosition(firstPosition, viewport);
    const pathStart = firstPathPoint(boundaryGeometryToSvgPath(geometry, viewport));
    assert.ok(Math.abs(pathStart.x - projected.x) < 0.01);
    assert.ok(Math.abs(pathStart.y - projected.y) < 0.01);
  }
});

test("controlled canvas preserves layer order, accessible controls and focus contrast", () => {
  assert.ok(component.includes("model.layers.map"));
  assert.ok(component.includes("data-layer-order={layer.order}"));
  assert.ok(component.includes('vectorEffect="non-scaling-stroke"'));
  assert.ok(component.includes('aria-label="Zoom in"'));
  assert.ok(component.includes('aria-label="Zoom out"'));
  assert.ok(component.includes('role="img"'));
  assert.ok(component.includes("<title"));
  assert.ok(component.includes("<desc"));
  assert.ok(
    styles.includes("prefers-reduced-motion"),
    "Slice 2.8 marker activation motion must provide a reduced-motion treatment.",
  );
  assert.ok(
    contrast(
      CONTROLLED_LOCALITY_LAYER_STYLES["selected-outline-contrast"].stroke,
      CONTROLLED_LOCALITY_LAYER_STYLES["selected-fill"].fill,
    ) >= 4.5,
  );
});
