import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = {
  scene: await readFile("src/components/map/ExchangeSpatialScene.tsx", "utf8"),
  sceneCss: await readFile("src/components/map/ExchangeSpatialScene.module.css", "utf8"),
  preference: await readFile("src/components/map/map-motion-preference.ts", "utf8"),
  preferenceUi: await readFile("src/components/account/MapMotionPreferenceToggle.tsx", "utf8"),
  activation: await readFile("src/components/onboarding/SpatialActivationExperience.tsx", "utf8"),
  join: await readFile("app/join/page.tsx", "utf8"),
  workspace: await readFile("app/geography/canvas/page.tsx", "utf8"),
  account: await readFile("app/organization-profile/page.tsx", "utf8"),
  architecture: await readFile("docs/architecture/SPATIAL_ONBOARDING_HOME_ORBIT.md", "utf8"),
};

assert.match(files.scene, /EXCHANGE_ORBIT_PERIOD_MS = 225_000/);
assert.match(files.scene, /LOCALITY_ORBIT_PITCH = 60/);
assert.match(files.scene, /ORGANIZATION_ORBIT_PITCH = 75/);
assert.match(files.scene, /ORGANIZATION_ORBIT_ZOOM = 16/);
assert.match(files.scene, /mode === "organization"/);
assert.match(files.scene, /fitBounds\(bounds/);
assert.match(files.scene, /text-allow-overlap/);
assert.match(files.scene, /text-ignore-placement/);
assert.match(files.scene, /text-pitch-alignment": "viewport"/);
assert.match(files.scene, /HOME_MARKER_LABEL_LAYER_ID/);

assert.match(files.sceneCss, /position: fixed/);
assert.match(files.sceneCss, /inset: 0/);

assert.match(files.preference, /rfxchange:map-rotation-enabled/);
assert.match(files.preference, /MAP_ROTATION_PREFERENCE_EVENT/);
assert.match(files.preferenceUi, /Ambient map rotation/);
assert.match(files.account, /MapMotionPreferenceToggle/);

assert.match(files.activation, /activationState !== null/);
assert.match(files.activation, /selectedGeography \? "locality" : "regional"/);
assert.match(files.join, /SpatialActivationExperience/);
assert.match(files.workspace, /mode="organization"/);
assert.match(files.workspace, /marker=\{authenticated\.homeMarker\}/);

assert.match(files.architecture, /225 seconds/);
assert.match(files.architecture, /60 degrees/);
assert.match(files.architecture, /75 degrees/);
assert.match(files.architecture, /zoom 16/);
assert.match(files.architecture, /edge-to-edge/);
assert.match(files.architecture, /Account/);

console.log("Spatial onboarding and home-orbit regression contract validated.");
