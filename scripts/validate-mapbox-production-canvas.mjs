import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [
  packageJson,
  envExample,
  layout,
  mapboxCanvas,
  geographyRoute,
  resolutionRoute,
  locationPanel,
  markerPanel,
  architecture,
] = await Promise.all([
  read("package.json"),
  read(".env.example"),
  read("app/layout.tsx"),
  read("src/components/map/MapboxLocalityCanvas.tsx"),
  read("app/geography/canvas/page.tsx"),
  read("app/organization-resolution/page.tsx"),
  read("src/components/organization-location/OrganizationLocationPanel.tsx"),
  read("src/components/organization-marker/MarkerActivationPanel.tsx"),
  read("docs/architecture/MAPBOX_PRODUCTION_SPATIAL_CANVAS.md"),
]);

assert.ok(
  packageJson.includes('"mapbox-gl": "3.25.0"'),
  "Mapbox GL JS must remain an explicit application dependency.",
);
assert.ok(
  layout.includes('import "mapbox-gl/dist/mapbox-gl.css"'),
  "Mapbox GL JS stylesheet must be loaded by the application root layout.",
);
assert.ok(
  envExample.includes("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.") &&
    envExample.includes("Never place a Mapbox secret token") &&
    envExample.includes('"sk."'),
  "Mapbox browser token configuration must require a public token and reject secret-token guidance.",
);

for (const requirement of [
  "new mapboxgl.Map",
  'style: "mapbox://styles/mapbox/standard"',
  "map.addSource(LOCALITY_SOURCE_ID",
  "model.layers",
  "map.fitBounds",
  "mapboxgl.NavigationControl",
  "window.sessionStorage",
  'token.startsWith("pk.")',
  "Map exploration does not change operating-geography authority.",
]) {
  assert.ok(mapboxCanvas.includes(requirement), `Production Mapbox canvas is missing ${requirement}.`);
}

for (const surface of [geographyRoute, resolutionRoute, locationPanel, markerPanel]) {
  assert.ok(
    surface.includes("MapboxLocalityCanvas"),
    "Participant spatial surfaces must use the production Mapbox locality renderer.",
  );
}

for (const phrase of [
  "Mapbox GL JS is the canonical participant-facing map renderer",
  "Mapbox viewport state never grants geography participation",
  "ControlledLocalityMapModel is the renderer input",
  "Place this value in `.env.local`",
  "additional localities do not become selectable/participatory merely because the basemap displays them",
]) {
  assert.ok(architecture.includes(phrase), `Mapbox architecture authority is missing: ${phrase}`);
}

console.log(
  "Mapbox production canvas validated: authoritative GeoJSON integration, continuous camera navigation, public-token hygiene, viewport/authority separation, and participant surface adoption.",
);
