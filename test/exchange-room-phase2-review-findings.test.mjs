import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Room authorization endpoint projects only required permission booleans", () => {
  const source = read("app/geography/canvas/action-authorization/route.ts");
  for (const permission of ["rfx.create", "referral.manage", "resource.manage"]) assert.ok(source.includes(permission));
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
  assert.match(source, /exchangeRoomAuthorizationRequestLens === lens/);
  assert.match(source, /const generation = \+\+exchangeRoomAuthorizationGeneration/);
  assert.match(source, /ensureExchangeRoomAuthorization\(activeLens\)/);
  assert.equal((source.match(/fetch\("\/geography\/canvas\/action-authorization"/g) ?? []).length, 1);
});

test("fresh server authorization revokes successor actions while Resources keeps own and external authority distinct", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const registry = read("src/application/participant/exchange-room-actions.ts");
  const spatial = read("src/application/participant/participant-spatial-context.ts");
  const openPlatformGuard = controller.indexOf("if (!authorization.openPlatform) return false;");
  const rfxPermission = controller.indexOf('action.authorization === "open-platform-rfx-create"');
  const referralPermission = controller.indexOf('action.authorization === "open-platform-referral-manage"');
  const resourcePermission = controller.indexOf('action.authorization === "open-platform-resource-manage"');
  assert.ok(openPlatformGuard >= 0 && rfxPermission > openPlatformGuard && referralPermission > openPlatformGuard && resourcePermission > openPlatformGuard);
  assert.match(controller, /action\.resolvedHandler\?\.kind === "href"/);
  assert.match(registry, /id: "opportunities\.create-view"/);
  assert.match(spatial, /params\.set\("organization", context\.selection\.organizationId\)/);
  assert.match(spatial, /params\.set\("provider", context\.selection\.organizationId\)/);
  assert.match(spatial, /serverRevalidatesSelectedObjectsAndActions: true/);
  assert.match(registry, /id: "resources\.manage-view"[^\n]*authorization: "open-platform-resource-manage"[^\n]*externalAuthorization: "open-platform"/);
  assert.match(registry, /id: "capabilities\.evidence-refer"[^\n]*externalAuthorization: "open-platform-referral-manage"/);
});

test("permission refresh cannot reactivate a non-operational privileged action", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const registry = read("src/application/participant/exchange-room-actions.ts");
  assert.match(controller, /permission === true && action\.operational && action\.applicable/);
  assert.doesNotMatch(controller, /actionId === "capabilities\.evidence-refer"/);
  assert.match(registry, /id: "capabilities\.evidence-refer"[^\n]*operational: false[^\n]*handler: null/);
});

test("desktop and mobile share the same four-action projection without coupling it to detail visibility", () => {
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  const styles = read("src/components/participant/ExchangeRoomActionController.module.css");
  assert.equal((workspace.match(/<ExchangeRoomActionController/g) ?? []).length, 2);
  assert.match(workspace, /placement="workspace"/);
  assert.match(workspace, /placement="sheet"/);
  assert.match(styles, /\.actionGrid \{[\s\S]*?position: absolute;[\s\S]*?z-index: 40;/);
});

test("action rail reserves tablet clearance and stays four-position inside the Stage 2 sheet", () => {
  const styles = read("src/components/participant/ExchangeRoomActionController.module.css");
  assert.match(styles, /@media \(max-width: 760px\) \{[\s\S]*?action-rail-placement="sheet"[\s\S]*?grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/);
});

test("ordinary mobile lens selection is in-place through the persistent bottom navigation", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  assert.match(controller, /event\.preventDefault\(\)/);
  assert.doesNotMatch(controller, /stopPropagation/);
  assert.match(navigation, /data-mobile-lens-navigation="persistent-bottom"/);
  assert.doesNotMatch(navigation, /<details|mobileLensMenu/);
});
