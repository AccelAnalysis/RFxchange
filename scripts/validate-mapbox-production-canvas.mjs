import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [
  packageJson,
  envExample,
  layout,
  mapViewContract,
  mapboxCanvas,
  spatialScene,
  geographyRoute,
  existingWorkspace,
  participantMapRuntime,
  activationClient,
  locationPanel,
  markerPanel,
  previewFactory,
  architecture,
] = await Promise.all([
  read("package.json"),
  read(".env.example"),
  read("app/layout.tsx"),
  read("src/application/geography/map-view.ts"),
  read("src/components/map/MapboxLocalityCanvas.tsx"),
  read("src/components/map/ExchangeSpatialScene.tsx"),
  read("app/geography/canvas/page.tsx"),
  read("src/components/participant/ExistingWorkspaceFoundation.tsx"),
  read("src/infrastructure/geography/participant-map-runtime.ts"),
  read("src/components/onboarding/ActivationJourneyClient.tsx"),
  read("src/components/organization-location/OrganizationLocationPanel.tsx"),
  read("src/components/organization-marker/MarkerActivationPanel.tsx"),
  read("src/data/geography/portsmouth-controlled-locality-preview.ts"),
  read("docs/architecture/MAPBOX_PRODUCTION_SPATIAL_CANVAS.md"),
]);

assert.ok(packageJson.includes('"mapbox-gl": "3.25.0"'), "Mapbox GL JS must remain an explicit application dependency.");
assert.ok(layout.includes('import "mapbox-gl/dist/mapbox-gl.css"'), "Mapbox GL JS stylesheet must be loaded by the application root layout.");
assert.ok(
  envExample.includes("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.") && envExample.includes("Never place a Mapbox secret token") && envExample.includes('"sk."'),
  "Mapbox browser token configuration must require a public token and reject secret-token guidance.",
);

for (const requirement of [
  "new mapboxgl.Map",
  'style: "mapbox://styles/mapbox/standard"',
  "HOME_LOCALITY_SOURCE_ID",
  "HOME_MASK_SOURCE_ID",
  "createHomeLocalityMask",
  "model.layers",
  "map.fitBounds",
  "mapboxgl.NavigationControl",
  "window.sessionStorage",
  'token.startsWith("pk.")',
  "MAPBOX_MAX_ZOOM = 24",
  "minZoom: 0",
  "maxZoom: MAPBOX_MAX_ZOOM",
  "search/searchbox/v1/forward",
  "Search moves the camera only and never changes your home locality.",
  "Fit home",
  "PARTICIPANT_MAP_VIEW_OPTIONS",
  "map.easeTo",
  "aria-pressed",
  "viewMode: resolvedViewMode",
]) {
  assert.ok(mapboxCanvas.includes(requirement), `Production Mapbox canvas is missing ${requirement}.`);
}

for (const requirement of [
  "new mapboxgl.Map",
  'style: "mapbox://styles/mapbox/standard"',
  "createHomeLocalityMask",
  "LOCALITY_MASK_SOURCE_ID",
  "map.fitBounds",
  "mapboxgl.NavigationControl",
  'token.startsWith("pk.")',
  "minZoom: 0",
  "maxZoom: 24",
  "search/searchbox/v1/forward",
  "Search moves the camera only and never changes your home locality.",
  "Fit home",
  "PARTICIPANT_MAP_VIEW_OPTIONS",
  "map.easeTo",
  "aria-pressed",
  "HOME_MARKER_LABEL_LAYER_ID",
  "EXCHANGE_ORBIT_PERIOD_MS = 225_000",
]) {
  assert.ok(spatialScene.includes(requirement), `Spatial home-orbit Mapbox scene is missing ${requirement}.`);
}
for (const requirement of [
  'label: "2D"',
  'label: "Perspective"',
  'label: "3D"',
  "mapViewModeForPitch",
]) {
  assert.ok(mapViewContract.includes(requirement), `Canonical participant map-view contract is missing ${requirement}.`);
}

assert.ok(
  !mapboxCanvas.includes("rfx-locality-surrounding-fill") && !mapboxCanvas.includes("rfx-locality-surrounding-outline"),
  "Participant Mapbox rendering must not restore the old adjacent-locality overlay treatment.",
);
assert.ok(
  previewFactory.includes("createControlledLocalityPreview") && previewFactory.includes("homeGeographyId") && previewFactory.includes("home-locality focus"),
  "The bundled map model must be generic around home locality rather than Portsmouth-only semantics.",
);

const authenticatedMapSurface = `${geographyRoute}\n${existingWorkspace}\n${participantMapRuntime}`;
for (const requirement of [
  "resolveParticipantRoute",
  "createFirestoreOrganizationLocationRepositories",
  "createFirestoreOrganizationMarkerRepositories",
  "projectPublicOrganizationMarker",
  "ExistingWorkspaceFoundation",
  "ExchangeSpatialScene",
  'mode="organization"',
  "marker={homeMarker}",
  "interactive",
]) {
  assert.ok(authenticatedMapSurface.includes(requirement), `Authenticated Intelligence map is missing ${requirement}.`);
}
assert.ok(
  geographyRoute.includes("organizationId={authenticated.mapProjection.organizationId}") &&
    geographyRoute.includes("loadAuthorizedNetworkDiscovery") &&
    existingWorkspace.includes("role=\"search\"") &&
    existingWorkspace.includes("showSearch={false}") &&
    existingWorkspace.includes('workspaceOverlay={panelOpen ? "right" : "left"}'),
  "Slice 3.2 must preserve authorized organization identity, exactly one operational Network search, and contextual map controls.",
);
assert.ok(!geographyRoute.includes("SearchFilterOverlay"), "Intelligence must avoid a decorative duplicate search control.");
assert.ok(
  !existingWorkspace.includes("SearchFilterOverlay") &&
    existingWorkspace.match(/role="search"/g)?.length === 1,
  "The authenticated Spatial Workspace must expose one operational search/filter surface rather than duplicate controls.",
);

assert.ok(
  activationClient.includes("MapboxLocalityCanvas") &&
    activationClient.includes('kind: "location-candidate"') &&
    activationClient.includes("selectedLocationCandidateId") &&
    activationClient.includes("candidateId: selectedLocationCandidateId"),
  "Integrated activation must use the production Mapbox renderer for real location confirmation.",
);
for (const referenceSurface of [locationPanel, markerPanel]) {
  assert.ok(referenceSurface.includes("MapboxLocalityCanvas"), "Reference spatial evidence must remain compatible with the production Mapbox renderer.");
}

const architectureLower = architecture.toLowerCase();
for (const phrase of [
  "Mapbox GL JS is the canonical participant-facing map renderer",
  "Mapbox viewport state never grants geography participation",
  "ControlledLocalityMapModel",
  "Place this value in `.env.local`",
  "home locality",
  "zoom `0` through zoom `24`",
  "Mapbox Search Box API",
  "ExchangeSpatialScene",
]) {
  assert.ok(architecture.includes(phrase), `Mapbox architecture authority is missing: ${phrase}`);
}
assert.ok(
  architectureLower.includes("additional localities do not become selectable/participatory merely because the basemap or mapbox search displays them"),
  "Mapbox architecture must preserve the distinction between exploratory search visibility and canonical geography participation.",
);

console.log(
  "Mapbox production surfaces validated: Slice 3.2 authorized Network search/list/detail on the existing spatial shell, home organization continuity, map/view controls, authoritative home-locality focus, public-token hygiene, and viewport/authority separation.",
);
