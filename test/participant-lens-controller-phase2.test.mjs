import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("the Exchange Room uses spatial activeLens instead of whole-lens unavailability", () => {
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  assert.match(workspace, /activeItem=\{spatialContext\.activeLens\}/);
  assert.match(workspace, /useExchangeRoomLensController\(selectLens\)/);
  assert.doesNotMatch(workspace, /unavailableLensIds=/);
  assert.doesNotMatch(workspace, /const MAP_ONLY_UNAVAILABLE_LENSES/);
  assert.match(controller, /event\.preventDefault\(\)/);
  assert.match(controller, /onLensSelect\(lens\)/);
  assert.match(controller, /data-active-lens=\{activeLens\}/);
});

test("lens changes preserve the map, camera and selected organization substrate", () => {
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  assert.match(workspace, /activeLens: lens/);
  assert.match(workspace, /originLens: current\.activeLens/);
  assert.match(workspace, /initialCamera=\{spatialContext\.camera\}/);
  assert.match(workspace, /selection: Object\.freeze/);
  assert.doesNotMatch(workspace, /activeLens: "intelligence" as const/);
  assert.match(workspace, /name="selectedOrganization" value=\{selectedOrganizationQueryId\}/);
  assert.match(workspace, /selectedOrganizationId: selectedOrganizationQueryId/);
});

test("the primary four-lens Room control remains actionable at mobile widths", () => {
  const styles = read("src/components/participant/ExchangeRoomActionController.module.css");
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /\[data-participant-navigation\] > nav/);
  assert.match(styles, /display: flex !important/);
  assert.match(styles, /\[data-participant-navigation\] > details/);
  assert.match(styles, /display: none !important/);
  assert.match(styles, /overflow-x: auto/);
});

test("disabled Phase 2 actions are non-actionable without visible status prose", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const styles = read("src/components/participant/ExchangeRoomActionController.module.css");
  assert.match(controller, /className=\{styles\.disabledAction\}/);
  assert.match(controller, /disabled\n/);
  assert.match(controller, /data-disabled-reason=\{reason\}/);
  assert.doesNotMatch(controller, /Coming soon|Unavailable|In development|Not yet available/i);
  assert.match(styles, /border-style: dashed/);
  assert.match(styles, /cursor: not-allowed/);
});

test("Phase 2 does not weaken protected domain routes", () => {
  for (const path of [
    "app/opportunities/page.tsx",
    "app/resources/page.tsx",
    "app/referrals/page.tsx",
    "app/provider-application/page.tsx",
  ]) {
    assert.match(read(path), /lifecycleState !== "open-platform"/, path);
  }
  const canvas = read("app/geography/canvas/page.tsx");
  assert.match(canvas, /focusedOrganizationId: selectedOrganizationId/);
  assert.match(canvas, /focusedDiscovery/);
});
