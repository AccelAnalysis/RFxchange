import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = {
  scene: await readFile("src/components/map/ExchangeSpatialScene.tsx", "utf8"),
  sceneCss: await readFile("src/components/map/ExchangeSpatialScene.module.css", "utf8"),
  preference: await readFile("src/components/map/map-motion-preference.ts", "utf8"),
  preferenceUi: await readFile("src/components/account/MapMotionPreferenceToggle.tsx", "utf8"),
  activation: await readFile("src/components/onboarding/SpatialActivationExperience.tsx", "utf8"),
  activationClient: await readFile("src/components/onboarding/ActivationJourneyClient.tsx", "utf8"),
  spatialModelRoute: await readFile("app/api/onboarding/spatial-model/route.ts", "utf8"),
  homeSceneRoute: await readFile("app/api/onboarding/home-scene/route.ts", "utf8"),
  join: await readFile("app/join/page.tsx", "utf8"),
  workspaceRoute: await readFile("app/geography/canvas/page.tsx", "utf8"),
  workspace: await readFile("src/components/participant/ExistingWorkspaceFoundation.tsx", "utf8"),
  account: await readFile("app/organization-profile/page.tsx", "utf8"),
  architecture: await readFile("docs/architecture/SPATIAL_ONBOARDING_HOME_ORBIT.md", "utf8"),
};

assert.match(files.scene, /EXCHANGE_ORBIT_PERIOD_MS = 225_000/);
assert.match(files.scene, /LOCALITY_ORBIT_PITCH = 60/);
assert.match(files.scene, /ORGANIZATION_ORBIT_PITCH = 75/);
assert.match(files.scene, /ORGANIZATION_ORBIT_ZOOM = 16/);
assert.match(files.scene, /activeMode === "organization"/);
assert.match(files.scene, /fitBounds\(bounds/);
assert.match(files.scene, /text-allow-overlap/);
assert.match(files.scene, /text-ignore-placement/);
assert.match(files.scene, /text-pitch-alignment": "viewport"/);
assert.match(files.scene, /HOME_MARKER_LABEL_LAYER_ID/);
assert.match(files.scene, /NETWORK_MARKER_SOURCE_ID/);
assert.match(files.scene, /search\/searchbox\/v1\/forward/);
assert.match(files.scene, /VIEW_MODE_OPTIONS/);

assert.match(files.sceneCss, /position: fixed/);
assert.match(files.sceneCss, /inset: 0/);
assert.match(
  files.sceneCss,
  /width: min\(520px, calc\(50vw - 72px\)\)/,
  "The reusable desktop map-search panel must not cover the viewport-centered organization marker when enabled.",
);
assert.match(
  files.sceneCss,
  /max-height: min\(calc\(50vh - 112px\), calc\(100vh - 104px\)\)/,
  "The reusable mobile map-search panel must preserve a visible center lane when enabled.",
);

assert.match(files.preference, /rfxchange:map-rotation-enabled/);
assert.match(files.preference, /MAP_ROTATION_PREFERENCE_EVENT/);
assert.match(files.preferenceUi, /Ambient map rotation/);
assert.match(files.account, /MapMotionPreferenceToggle/);

assert.match(files.activation, /activationState !== null/);
assert.match(files.activation, /onStateChange=\{setActivationState\}/);
assert.match(files.activation, /\/api\/onboarding\/spatial-model/);
assert.match(files.activation, /sceneModelMatchesSelection/);
assert.match(files.activation, /selectedGeographyId[\s\S]*\? "locality"[\s\S]*: "regional"/);
assert.doesNotMatch(files.activationClient, /window\.location\.reload\(\)/);
assert.match(files.activationClient, /onStateChange\?\.\(state\)/);

for (const required of [
  "resolveParticipantRoute",
  "selections.getByUserId",
  "ControlledLocalityMapService",
  "TigerWebBoundarySnapshotRepository",
]) {
  assert.match(files.spatialModelRoute, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
for (const required of [
  "resolveParticipantRoute",
  "projectPublicOrganizationMarker",
  'access.kind !== "authorized"',
]) {
  assert.match(files.homeSceneRoute, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.match(files.join, /SpatialActivationExperience/);
assert.match(files.workspaceRoute, /ExistingWorkspaceFoundation/);
assert.match(files.workspaceRoute, /homeMarker=\{authenticated\.mapProjection\.homeMarker\}/);
assert.match(files.workspaceRoute, /organizationId=\{authenticated\.mapProjection\.organizationId\}/);
assert.match(files.workspaceRoute, /loadAuthorizedNetworkDiscovery/);
assert.match(files.workspace, /mode="organization"/);
assert.match(files.workspace, /marker=\{homeMarker\}/);
assert.match(files.workspace, /organizationMarkers=\{networkMarkers\}/);
assert.match(files.workspace, /workspaceOverlay=\{panelOpen \? "right" : "left"\}/);
assert.match(files.workspace, /authorizedObjectIds\.has\(restored\.selectedObjectId\)/);

assert.match(files.architecture, /225 seconds/);
assert.match(files.architecture, /60 degrees/);
assert.match(files.architecture, /75 degrees/);
assert.match(files.architecture, /zoom 16/);
assert.match(files.architecture, /edge-to-edge/);
assert.match(files.architecture, /Account/);
assert.match(files.architecture, /without a page reload/);

console.log("Spatial onboarding, B6a home orbit, and Slice 3.2 authorized organization-selection regression contract validated.");
