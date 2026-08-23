import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = await readFile(new URL("../app/capabilities/page.tsx", import.meta.url), "utf8");
const runtime = await readFile(new URL("../src/infrastructure/organizations/capabilities-runtime.ts", import.meta.url), "utf8");
const workspace = await readFile(new URL("../src/components/capabilities/CapabilitiesWorkspace.tsx", import.meta.url), "utf8");

test("Stage 4 route uses the canonical participant authorization and map boundaries", () => {
  assert.match(route, /resolveParticipantRoute/);
  assert.match(route, /lifecycleState !== "open-platform"/);
  assert.match(route, /loadAuthorizedParticipantMapProjection/);
  assert.match(runtime, /loadAuthorizedNetworkDiscovery/);
  assert.match(runtime, /loadAuthorizedMarketProfile/);
  assert.match(runtime, /organization\.profile\.manage/);
  assert.match(runtime, /authorizationMatches/);
});

test("Stage 4 pins AMACS, uses shared map and action composition, and contains no AI candidate path", () => {
  assert.match(runtime, /PINNED_AMACS_VERSION = "0\.5\.0"/);
  assert.match(runtime, /da7879f2609271b067ae6d02875e9388a02c4fe5/);
  assert.doesNotMatch(runtime, /interpretationCandidate|interpretationRecord/);
  assert.match(workspace, /ExchangeSpatialScene/);
  assert.match(workspace, /ExchangeRoomActionController/);
  assert.match(workspace, /activeLens="capabilities"/);
  assert.match(workspace, /comparisonDisclaimer/);
});
