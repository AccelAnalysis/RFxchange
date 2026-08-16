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
  assert.doesNotMatch(controller, /event\.stopPropagation\(\)/);
  assert.match(controller, /onLensSelect\(lens\)/);
  assert.match(controller, /data-active-lens=\{activeLens\}/);
});

test("permanent lens deep links are projected atomically from one spatial-store snapshot", () => {
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  assert.match(navigation, /function storedLensHrefSnapshot\(\): string/);
  assert.match(navigation, /intelligenceHref: storedIntelligenceHref\(\)/);
  assert.match(navigation, /opportunityHref: storedOpportunityHref\(\)/);
  assert.match(navigation, /resourceHref: storedResourceHref\(\)/);
  assert.match(navigation, /referralHref: storedReferralHref\(\)/);
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

test("the four-action controller is mounted once outside the closable detail branch", () => {
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  const controllerMatches = workspace.match(/<ExchangeRoomActionController/g) ?? [];
  assert.equal(controllerMatches.length, 1);
  const controllerIndex = workspace.indexOf("<ExchangeRoomActionController");
  const panelConditionalIndex = workspace.indexOf("{panelOpen ? (");
  assert.ok(controllerIndex >= 0 && panelConditionalIndex >= 0 && controllerIndex < panelConditionalIndex);
  assert.match(workspace, /onClick=\{\(\) => updatePanel\(false\)\}/);
});

test("390px uses the native mobile lens menu and ordinary selection can close it", () => {
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  const navigationStyles = read("src/components/participant/ParticipantTopNavigation.module.css");
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const controllerStyles = read("src/components/participant/ExchangeRoomActionController.module.css");

  assert.match(navigation, /onNavigate=\{closeMobileLensMenu\}/);
  assert.match(navigation, /if \(event\.key === "Escape"\)/);
  assert.match(navigationStyles, /@media \(max-width: 760px\)[\s\S]*?\.desktopLenses \{\s*display: none;/);
  assert.match(navigationStyles, /@media \(max-width: 760px\)[\s\S]*?\.mobileLensMenu \{\s*display: block;/);
  assert.match(navigationStyles, /@media \(max-width: 390px\)/);
  assert.doesNotMatch(controllerStyles, /\[data-participant-navigation\]/);
  assert.doesNotMatch(controller, /stopPropagation/);
  assert.match(controllerStyles, /@media \(max-width: 760px\)[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
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
  ]) {
    assert.match(read(path), /lifecycleState !== "open-platform"/, path);
  }
  const canvas = read("app/geography/canvas/page.tsx");
  assert.match(canvas, /focusedOrganizationId: selectedOrganizationId/);
  assert.match(canvas, /focusedDiscovery/);
});
