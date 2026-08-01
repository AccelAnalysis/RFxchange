import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [model, service, scenario, client, map, emulator, architecture] = await Promise.all([
  read("src/domain/orientation/model.ts"),
  read("src/application/orientation/orientation-journey.ts"),
  read("src/application/orientation/synthetic-scenario.ts"),
  read("src/components/orientation/OrientationJourneyClient.tsx"),
  read("src/components/map/ExchangeSpatialScene.tsx"),
  read("scripts/smoke-orientation-discovery-team-emulator.mjs"),
  read("docs/architecture/WAVE_2_SLICE_2_11.md"),
]);

assert.ok(model.includes("SLICE_2_11_MAX_ORIENTATION_STEP = 8"));
assert.ok(service.includes('next.status === "completed" ? "completed" : "step-completed"'));
for (const contract of ["teammateInvitation", "jointResponse", "evaluation", "networkEffect"]) {
  assert.ok(scenario.includes(contract), `Missing deterministic synthetic ${contract} contract.`);
}
for (const boundary of ["not a subcontract", "no live RFx response", "does not automatically choose a winner", "not an award"]) {
  assert.ok(scenario.includes(boundary), `Missing orientation boundary: ${boundary}`);
}
for (const label of ["Accept synthetic invitation", "Submit synthetic response", "Make human tutorial selection", "Complete orientation"]) {
  assert.ok(client.includes(label), `Missing accessible progression action: ${label}`);
}
assert.ok(client.includes('role="table"') && client.includes("scenario.jointResponse.sections.map"));
assert.ok(map.includes('"joint-response"') && map.includes('"selected-outcome"') && map.includes('"network-effect"'));
assert.ok(emulator.includes("completedThroughStep, 8") && emulator.includes('kind === "completed"'));
assert.ok(architecture.includes("EDU-005") && architecture.includes("EDU-008"));

console.log("EDU-005-008 orientation response-to-outcome architecture validated.");
