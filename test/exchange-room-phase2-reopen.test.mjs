import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Stage 2 action surfaces consume the validated spatial presentation state", () => {
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  assert.match(workspace, /snapPoint=\{spatialContext\.sheetSnapPoint\}/);
  assert.match(workspace, /initialScrollTop=\{mobileDetailOpen \? 0 : spatialContext\.sheetScrollTop\}/);
  assert.match(workspace, /panelOpen: true/);
  assert.match(workspace, /placement="workspace"/);
  assert.match(workspace, /placement="sheet"/);
});

test("ordinary permanent-lens activation reopens the existing Room surface after the lens transaction", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  assert.match(controller, /onLensSelect\(lens\);\s*reopenActiveExchangeRoomSurface\(\);/);
  assert.match(controller, /serializeParticipantSpatialContext\(reopened\)/);
  assert.match(controller, /PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT/);
  assert.match(controller, /event\.preventDefault\(\)/);
  assert.doesNotMatch(controller, /location\.(assign|replace)|window\.location/);
});

test("configured-browser reopen acceptance preserves the canonical harness while adapting successor navigation", () => {
  const runner = read("scripts/run-configured-exchange-shell-acceptance.mjs");
  const acceptance = read("scripts/acceptance-exchange-shell-emulator.mjs");
  assert.match(runner, /new URL\("\.\/acceptance-exchange-shell-emulator\.mjs", import\.meta\.url\)/);
  assert.match(runner, /primary Capabilities availability/);
  assert.match(runner, /mobile Menu trigger metrics/);
  assert.match(runner, /localized Capabilities route/);
  assert.match(acceptance, /!document\.querySelector\('#organization-detail-panel'\)/);
  assert.match(acceptance, /Boolean\(document\.querySelector\('\[data-exchange-room-action-grid\]'\)\)/);
  assert.match(acceptance, /nav\[data-mobile-lens-navigation="persistent-bottom"\]/);
  assert.match(acceptance, /bottomNavigationLenses/);
  assert.match(acceptance, /legacyLensMenuPresent/);
});

test("desktop and sheet action rails share one authorization request projection", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  assert.match(controller, /let exchangeRoomAuthorizationSnapshot: LensAuthorizationProjection \| null = null;/);
  assert.match(controller, /useSyncExternalStore\(\s*subscribeExchangeRoomAuthorization,\s*exchangeRoomAuthorizationStoreSnapshot,/);
  assert.equal(controller.match(/fetch\("\/geography\/canvas\/action-authorization"/g)?.length ?? 0, 1);
});

test("reopen path preserves authorization boundary while unavailable Capabilities actions stay disabled", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const registry = read("src/application/participant/exchange-room-actions.ts");
  assert.match(controller, /fetch\("\/geography\/canvas\/action-authorization"/);
  assert.match(controller, /action\.resolvedHandler\?\.kind === "href"/);
  assert.match(registry, /id: "opportunities\.create-view"/);
  assert.doesNotMatch(controller, /opportunities\.create-rfx|resources\.my-requests|resources\.provider-status/);
  assert.doesNotMatch(controller, /actionId === "capabilities\.evidence-refer"/);
  assert.match(registry, /id: "capabilities\.evidence-refer"[^\n]*operational: false[^\n]*handler: null/);
});
