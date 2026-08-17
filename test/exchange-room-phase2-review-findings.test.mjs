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

test("persistent Room shares and revalidates fail-closed action authority on in-place lens transitions", () => {
  const source = read("src/components/participant/ExchangeRoomActionController.tsx");
  assert.match(source, /useSyncExternalStore/);
  assert.match(source, /subscribeExchangeRoomAuthorization/);
  assert.match(source, /exchangeRoomAuthorizationStoreSnapshot/);
  assert.match(source, /exchangeRoomAuthorizationRequestLens === lens/);
  assert.match(source, /const generation = \+\+exchangeRoomAuthorizationGeneration/);
  assert.match(source, /generation !== exchangeRoomAuthorizationGeneration/);
  assert.match(source, /ensureExchangeRoomAuthorization\(activeLens\)/);
  assert.match(source, /authorizationState\?\.lens === activeLens/);
  assert.match(source, /: DENIED_ACTION_AUTHORIZATION;/);
  assert.equal((source.match(/fetch\("\/geography\/canvas\/action-authorization"/g) ?? []).length, 1);
});

test("fresh server authorization revokes open-platform actions while Resources keeps discovery and management authority distinct", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const registry = read("src/application/participant/exchange-room-actions.ts");
  const spatial = read("src/application/participant/participant-spatial-context.ts");
  const openPlatformGuard = controller.indexOf("if (!authorization.openPlatform) return false;");
  const rfxPermission = controller.indexOf('action.authorization === "open-platform-rfx-create"');
  const referralPermission = controller.indexOf('action.authorization === "open-platform-referral-manage"');
  const resourcePermission = controller.indexOf('action.authorization === "open-platform-resource-manage"');
  assert.ok(openPlatformGuard >= 0 && rfxPermission > openPlatformGuard && referralPermission > openPlatformGuard && resourcePermission > openPlatformGuard);
  assert.match(controller, /open-platform-referral-manage"\) return authorization\.referralManage/);
  assert.match(controller, /open-platform-resource-manage"\) return authorization\.resourceManage/);
  assert.match(controller, /resources\.find-providers" \|\| actionId === "resources\.browse-resources"/);
  assert.match(controller, /participantSpatialLensHref\("resources"\)/);
  assert.match(spatial, /params\.set\("organization", context\.selection\.organizationId\)/);
  assert.match(spatial, /params\.set\("provider", context\.selection\.organizationId\)/);
  assert.match(spatial, /serverRevalidatesSelectedObjectsAndActions: true/);
  assert.match(registry, /id: "resources\.find-providers"[^\n]*authorization: "open-platform"/);
  assert.match(registry, /id: "resources\.browse-resources"[^\n]*authorization: "open-platform"/);
  assert.match(registry, /id: "resources\.my-requests"[^\n]*authorization: "open-platform-referral-manage"/);
  assert.match(registry, /id: "resources\.provider-status"[^\n]*authorization: "open-platform-resource-manage"/);
});

test("permission refresh cannot reactivate a non-operational privileged action", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const registry = read("src/application/participant/exchange-room-actions.ts");
  assert.match(controller, /permission === true && action\.operational && action\.applicable/);
  assert.doesNotMatch(controller, /actionId === "referrals\.new"/);
  assert.match(registry, /id: "referrals\.new"[^\n]*operational: false[^\n]*handler: null/);
});

test("desktop and mobile share the same four-action projection without coupling it to detail visibility", () => {
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  const styles = read("src/components/participant/ExchangeRoomActionController.module.css");
  assert.equal((workspace.match(/<ExchangeRoomActionController/g) ?? []).length, 2);
  assert.match(workspace, /placement="workspace"/);
  assert.match(workspace, /placement="sheet"/);
  assert.match(workspace, /onClick=\{\(\) => \{/);
  assert.match(workspace, /panelOpen: false/);
  assert.match(styles, /\.actionGrid \{[\s\S]*?position: absolute;[\s\S]*?z-index: 40;/);
});

test("action rail reserves tablet clearance and stays four-position inside the Stage 2 sheet", () => {
  const styles = read("src/components/participant/ExchangeRoomActionController.module.css");
  assert.match(
    styles,
    /@media \(max-width: 1024px\) and \(min-width: 761px\) \{[\s\S]*?data-ui-sheet[\s\S]*?padding-bottom: calc\(116px \+ env\(safe-area-inset-bottom, 0px\)\);[\s\S]*?scroll-padding-bottom: calc\(116px \+ env\(safe-area-inset-bottom, 0px\)\);/,
  );
  assert.match(styles, /@media \(max-width: 760px\) \{[\s\S]*?action-rail-placement="sheet"[\s\S]*?grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/);
});

test("ordinary mobile lens selection is in-place through the persistent bottom navigation", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  assert.match(controller, /event\.preventDefault\(\)/);
  assert.doesNotMatch(controller, /stopPropagation/);
  assert.doesNotMatch(controller, /reopenExchangeRoomActionPanel/);
  assert.match(navigation, /className=\{styles\.mobileBottomNavigation\}/);
  assert.match(navigation, /data-mobile-lens-navigation="persistent-bottom"/);
  assert.match(navigation, /<LensItems[\s\S]*mobile/);
  assert.doesNotMatch(navigation, /<details|mobileLensMenu/);
});
