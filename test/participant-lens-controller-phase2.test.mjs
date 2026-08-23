import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("the shared Network workspace preserves one effective spatial lens while Capabilities owns its separate current route", () => {
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const capabilities = read("src/components/capabilities/CapabilitiesWorkspace.tsx");
  assert.match(workspace, /activeItem=\{activeLens\}/);
  assert.match(workspace, /spatialContext\.activeLens === "capabilities"[\s\S]*\? "intelligence"/);
  assert.match(workspace, /useExchangeRoomLensController\(selectLens\)/);
  assert.doesNotMatch(workspace, /const MAP_ONLY_UNAVAILABLE_LENSES/);
  assert.match(capabilities, /<ParticipantShell activeItem="capabilities"/);
  assert.match(capabilities, /<ExchangeSpatialScene/);
  assert.match(controller, /event\.preventDefault\(\)/);
  assert.doesNotMatch(controller, /event\.stopPropagation\(\)/);
  assert.match(controller, /onLensSelect\(lens\)/);
  assert.match(controller, /data-active-lens=\{activeLens\}/);
});

test("permanent lens deep links are projected atomically from one spatial-store snapshot plus the current Capabilities route", () => {
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  assert.match(navigation, /function storedLensHrefSnapshot\(\): string/);
  assert.match(navigation, /intelligenceHref: storedIntelligenceHref\(\)/);
  assert.match(navigation, /opportunityHref: participantSpatialLensHref\("opportunities-rfx"\)/);
  assert.match(navigation, /resourceHref: participantSpatialLensHref\("resources"\)/);
  assert.match(navigation, /capabilityHref: "\/capabilities"/);
  assert.doesNotMatch(navigation, /referralHref/);
  assert.match(navigation, /const serializedLensHrefs = useSyncExternalStore\([\s\S]*storedLensHrefSnapshot[\s\S]*DEFAULT_LENS_HREF_SNAPSHOT/);
  assert.equal((navigation.match(/useSyncExternalStore\(/g) ?? []).length, 1);
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

test("the four-action projection has desktop and sheet placements over the same active-lens state", () => {
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  const controllerMatches = workspace.match(/<ExchangeRoomActionController/g) ?? [];
  assert.equal(controllerMatches.length, 2);
  assert.match(workspace, /placement="workspace"/);
  assert.match(workspace, /placement="sheet"/);
  assert.match(workspace, /actions=\{exchangeRoomActions\}/g);
  assert.match(workspace, /onClick=\{\(\) => \{[\s\S]*panelOpen: false/);
});

test("390px uses four permanent lenses plus Menu in the persistent bottom navigation and keeps the sheet action rail", () => {
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  const navigationStyles = read("src/components/participant/ParticipantTopNavigation.module.css");
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const controllerStyles = read("src/components/participant/ExchangeRoomActionController.module.css");

  assert.match(navigation, /data-mobile-lens-navigation="persistent-bottom"/);
  assert.match(navigation, /className=\{styles\.mobileBottomNavigation\}/);
  assert.match(navigation, /data-mobile-menu-trigger/);
  assert.doesNotMatch(navigation, /<details|mobileLensMenu/);
  assert.match(navigationStyles, /@media \(max-width: 760px\)[\s\S]*?\.desktopLenses,[\s\S]*?\.accountUtility \{\s*display: none;/);
  assert.match(navigationStyles, /@media \(max-width: 760px\)[\s\S]*?\.mobileBottomNavigation \{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: repeat\(5, minmax\(0, 1fr\)\);/);
  assert.match(navigationStyles, /@media \(max-width: 390px\)/);
  assert.doesNotMatch(controllerStyles, /\[data-participant-navigation\]/);
  assert.doesNotMatch(controller, /stopPropagation/);
  assert.match(controllerStyles, /@media \(max-width: 760px\)[\s\S]*?action-rail-placement="sheet"[\s\S]*?grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
});

test("disabled Phase 2 actions are non-actionable without visible status prose", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const styles = read("src/components/participant/ExchangeRoomActionController.module.css");
  assert.match(controller, /className=\{styles\.disabledAction\}/);
  assert.match(controller, /<button[^>]*className=\{styles\.disabledAction\}[^>]*\bdisabled\b[^>]*data-action-state="disabled"[^>]*>/s);
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
    "app/capabilities/page.tsx",
  ]) {
    assert.match(read(path), /lifecycleState !== "open-platform"/, path);
  }
  const canvas = read("app/geography/canvas/page.tsx");
  assert.match(canvas, /focusedOrganizationId: selectedOrganizationId/);
  assert.match(canvas, /focusedDiscovery/);
});
