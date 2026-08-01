import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [model, service, scenario, route, page, client, map, rules, workflow] = await Promise.all([
  read("src/domain/orientation/model.ts"),
  read("src/application/orientation/orientation-journey.ts"),
  read("src/application/orientation/synthetic-scenario.ts"),
  read("app/api/orientation/route.ts"),
  read("app/orientation/page.tsx"),
  read("src/components/orientation/OrientationJourneyClient.tsx"),
  read("src/components/map/ExchangeSpatialScene.tsx"),
  read("firestore.rules"),
  read(".github/workflows/ci.yml"),
]);

for (const feature of ["EDU-001", "EDU-002", "EDU-003", "EDU-004"]) {
  assert.ok(model.includes("ORIENTATION_STEP_SEQUENCE"), `${feature} requires the shared orientation sequence.`);
}
assert.ok(model.includes('"network-effect"') && model.includes("SLICE_2_10_MAX_ORIENTATION_STEP = 4"));
assert.ok(service.includes("assertOrientationJourneyBinding") && service.includes("saveTransition"));
assert.ok(scenario.includes('"synthetic-orientation"'));
assert.ok(scenario.includes("qualificationBoundary") && scenario.includes("discoveryBoundary"));
assert.ok(route.includes("resolveParticipantRoute") && route.includes("resolveAuthorizedOrientationScope"));
assert.ok(page.includes("loadAuthorizedParticipantMapProjection"));
assert.ok(client.includes("Synthetic tutorial · not live activity"));
assert.ok(client.includes("showSearch={false}") && client.includes('workspaceOverlay="right"'));
assert.ok(map.includes("TUTORIAL_NODE_SOURCE_ID") && map.includes("TUTORIAL_PATH_SOURCE_ID"));
assert.ok(rules.includes("match /orientationJourneys/{documentId}"));
assert.ok(rules.includes("match /orientationJourneyEvents/{documentId}"));
assert.ok(workflow.includes("smoke-orientation-discovery-team-emulator.mjs"));
console.log("EDU-001-004 orientation discovery and teammate architecture validated.");
