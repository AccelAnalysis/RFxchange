import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Room authorization endpoint projects only required permission booleans", () => {
  const source = read("app/geography/canvas/action-authorization/route.ts");
  for (const permission of ["rfx.create", "referral.manage", "resource.manage"]) {
    assert.ok(source.includes(permission));
  }
  assert.match(source, /access\.kind !== "authorized"/);
  assert.match(source, /lifecycleState !== "open-platform"/);
});

test("shared controller hydrates authorization fail-closed and requires discovery UI", () => {
  const source = read("src/components/participant/ExchangeRoomActionController.tsx");
  assert.match(source, /DENIED_ACTION_AUTHORIZATION/);
  assert.match(source, /action-authorization/);
  assert.ok(source.includes('form[action="/geography/canvas"]'));
});

test("persistent Room revalidates action authority fail-closed on every in-place lens transition", () => {
  const source = read("src/components/participant/ExchangeRoomActionController.tsx");
  assert.match(source, /interface LensAuthorizationProjection/);
  assert.match(source, /authorizationState\.lens === activeLens/);
  assert.match(source, /: DENIED_ACTION_AUTHORIZATION;/);
  assert.match(source, /lens: activeLens,[\s\S]*authorization: Object\.freeze/);
  assert.match(source, /\}, \[activeLens\]\);/);
});

test("fresh server authorization revokes every open-platform action and Resource handlers match route authority", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const registry = read("src/application/participant/exchange-room-actions.ts");
  const spatial = read("src/application/participant/participant-spatial-context.ts");
  const openPlatformGuard = controller.indexOf("if (!authorization.openPlatform) return false;");
  const rfxPermission = controller.indexOf('action.authorization === "open-platform-rfx-create"');
  const referralPermission = controller.indexOf('action.authorization === "open-platform-referral-manage"');
  assert.ok(openPlatformGuard >= 0 && rfxPermission > openPlatformGuard && referralPermission > openPlatformGuard);
  assert.match(controller, /open-platform-referral-manage"\) return authorization\.referralManage/);
  assert.match(controller, /resources\.find-providers" \|\| actionId === "resources\.browse-resources"/);
  assert.match(controller, /participantSpatialLensHref\("resources"\)/);
  assert.match(spatial, /params\.set\("organization", context\.selection\.organizationId\)/);
  assert.match(spatial, /params\.set\("provider", context\.selection\.organizationId\)/);
  assert.match(spatial, /serverRevalidatesSelectedObjectsAndActions: true/);
  assert.match(registry, /id: "resources\.find-providers"[^\n]*authorization: "open-platform-referral-manage"/);
  assert.match(registry, /id: "resources\.browse-resources"[^\n]*authorization: "open-platform-referral-manage"/);
});

test("closing organization detail cannot remove the shared four-action architecture", () => {
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  const styles = read("src/components/participant/ExchangeRoomActionController.module.css");
  assert.equal((workspace.match(/<ExchangeRoomActionController/g) ?? []).length, 1);
  assert.ok(workspace.indexOf("<ExchangeRoomActionController") < workspace.indexOf("{panelOpen ? ("));
  assert.match(workspace, /onClick=\{\(\) => updatePanel\(false\)\}/);
  assert.match(styles, /\.actionGrid \{[\s\S]*?position: absolute;[\s\S]*?z-index: 40;/);
});

test("action tray reserves sheet clearance through tablet collision range", () => {
  const styles = read("src/components/participant/ExchangeRoomActionController.module.css");
  assert.match(
    styles,
    /@media \(max-width: 1024px\) \{[\s\S]*?data-ui-sheet[\s\S]*?padding-bottom: calc\(116px \+ env\(safe-area-inset-bottom\)\);[\s\S]*?scroll-padding-bottom: calc\(116px \+ env\(safe-area-inset-bottom\)\);/,
  );
  assert.match(styles, /@media \(max-width: 760px\) \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
});

test("ordinary mobile lens selection is in-place without swallowing the menu close handler", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  assert.match(controller, /event\.preventDefault\(\)/);
  assert.doesNotMatch(controller, /stopPropagation/);
  assert.doesNotMatch(controller, /reopenExchangeRoomActionPanel/);
  assert.match(navigation, /function closeMobileLensMenu/);
  assert.match(navigation, /onNavigate=\{closeMobileLensMenu\}/);
  assert.match(navigation, /event\.currentTarget\.open = false/);
});