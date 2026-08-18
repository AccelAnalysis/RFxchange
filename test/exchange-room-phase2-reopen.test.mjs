import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Stage 2 action surfaces consume the validated spatial presentation state", () => {
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  assert.match(workspace, /snapPoint=\{spatialContext\.sheetSnapPoint\}/);
  assert.match(workspace, /initialScrollTop=\{mobileDetailOpen \? 0 : spatialContext\.sheetScrollTop\}/);
  assert.match(workspace, /onScrollPositionChange=\{\(sheetScrollTop\) => \{\s*if \(mobileDetailOpen\) return;/);
  assert.match(workspace, /onSnapPointChange=\{\(sheetSnapPoint\)/);
  assert.match(workspace, /panelOpen: true/);
  assert.match(workspace, /placement="workspace"/);
  assert.match(workspace, /placement="sheet"/);
});

test("ordinary permanent-lens activation reopens the existing Room surface after the lens transaction", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  assert.match(controller, /onLensSelect\(lens\);\s*reopenActiveExchangeRoomSurface\(\);/);
  assert.doesNotMatch(controller, /reopenActiveExchangeRoomSurface\(\);\s*onLensSelect\(lens\);/);
  assert.match(controller, /const reopened = Object\.freeze\(\{[\s\S]*\.\.\.current,[\s\S]*panelOpen: true,[\s\S]*sheetSnapPoint:/);
  assert.match(controller, /serializeParticipantSpatialContext\(reopened\)/);
  assert.match(controller, /PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT/);
  assert.match(controller, /event\.preventDefault\(\)/);
  assert.doesNotMatch(controller, /location\.(assign|replace)|window\.location/);
});

test("configured-browser reopen acceptance closes detail while preserving the action rail", () => {
  const runner = read("scripts/run-configured-exchange-shell-acceptance.mjs");
  const acceptance = read("scripts/acceptance-exchange-shell-emulator.mjs");
  assert.match(runner, /!document\.querySelector\('#organization-detail-panel'\)/);
  assert.match(runner, /Boolean\(document\.querySelector\('\[data-exchange-room-action-grid\]'\)\)/);
  assert.match(runner, /closed Exchange Room detail surface with persistent action rail/);
  assert.match(runner, /did not reopen the Exchange Room detail surface/);
  assert.doesNotMatch(
    runner,
    /!document\.querySelector\('\[data-exchange-room-action-grid\]'\)/,
    "the persistent four-position action rail must not be treated as a closable detail surface",
  );
  assert.match(
    acceptance,
    /grids\.length > 0 && grids\.every\(\(grid\) => \([\s\S]*grid\.querySelectorAll\('\[data-exchange-room-action\]'\)\.length === 4/,
    "configured acceptance must validate each responsive four-position rail independently",
  );
  assert.doesNotMatch(
    acceptance,
    /document\.querySelectorAll\('\[data-exchange-room-action-grid\] \[data-exchange-room-action\]'\)\.length === 4/,
    "the two responsive rails must not be collapsed into one global four-action count",
  );
  assert.match(acceptance, /nav\[data-mobile-lens-navigation="persistent-bottom"\]/);
  assert.match(acceptance, /bottomNavigationLenses/);
  assert.match(acceptance, /legacyLensMenuPresent/);
  assert.doesNotMatch(
    acceptance,
    /\[data-participant-navigation\] details > summary/,
    "configured mobile acceptance must use the persistent bottom navigation",
  );
});

test("desktop and sheet action rails share one authorization request projection", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  assert.match(controller, /let exchangeRoomAuthorizationSnapshot: LensAuthorizationProjection \| null = null;/);
  assert.match(controller, /let exchangeRoomAuthorizationRequestLens: ParticipantLensId \| null = null;/);
  assert.match(controller, /if \(exchangeRoomAuthorizationRequestLens === lens\) return;/);
  assert.match(controller, /if \(exchangeRoomAuthorizationSnapshot\?\.lens === lens && exchangeRoomAuthorizationRequestLens === null\) return;/);
  assert.match(controller, /useSyncExternalStore\(\s*subscribeExchangeRoomAuthorization,\s*exchangeRoomAuthorizationStoreSnapshot,/);
  assert.equal(
    controller.match(/fetch\("\/geography\/canvas\/action-authorization"/g)?.length ?? 0,
    1,
    "both responsive action rails must share the single module-level authorization fetch path",
  );
});

test("reopen path preserves authorization boundary and truthful active deep links while New Referral stays disabled", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const registry = read("src/application/participant/exchange-room-actions.ts");
  assert.match(controller, /fetch\("\/geography\/canvas\/action-authorization"/);
  assert.match(controller, /opportunities\.create-rfx/);
  assert.match(controller, /resources\.my-requests/);
  assert.match(controller, /resources\.provider-status/);
  assert.match(controller, /participantSpatialLensHref\("resources"\)/);
  assert.doesNotMatch(controller, /actionId === "referrals\.new"/);
  assert.match(registry, /id: "referrals\.new"[^\n]*operational: false[^\n]*handler: null/);
});
