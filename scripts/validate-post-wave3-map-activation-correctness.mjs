import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [activation, spatialActivation, scene, mapbox, workspace, recovery, authority] = await Promise.all([
  read("src/components/onboarding/ActivationJourneyClient.tsx"),
  read("src/components/onboarding/SpatialActivationExperience.tsx"),
  read("src/components/map/ExchangeSpatialScene.tsx"),
  read("src/components/map/MapboxLocalityCanvas.tsx"),
  read("src/components/participant/ExistingWorkspaceFoundation.tsx"),
  read("src/application/onboarding/required-scene-recovery.ts"),
  read("docs/architecture/POST_WAVE_3_STABILIZATION_5_MAP_ACTIVATION_CORRECTNESS.md"),
]);

assert.match(activation, /entry\.id === selectedLocationCandidateId/);
assert.match(activation, /candidateId: selectedLocationCandidateId/);
assert.match(spatialActivation, /loadRequiredSceneWithRetry/);
assert.match(recovery, /REQUIRED_SCENE_MAX_ATTEMPTS = 3/);
assert.match(recovery, /if \(isAbortError\(error\)\) throw error/);
assert.match(scene, /!continuousMotionRef\.current/);
assert.doesNotMatch(workspace, /continuousMotion=/);
assert.match(mapbox, /synchronizePointOverlays/);
assert.match(mapbox, /source\?\.setData\(relationshipPathGeoJson\)/);
assert.match(mapbox, /source\?\.setData\(serviceFieldGeoJson\)/);
assert.match(authority, /Feature-ID effect:\*\* none/);
assert.match(authority, /438 total · 152 Done · 286 Not Started/);

console.log("Post-Wave 3 Stabilization 5 map and activation correctness validated.");
