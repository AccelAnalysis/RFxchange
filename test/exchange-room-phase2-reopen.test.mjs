import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Stage 2 contextual action surfaces consume the validated spatial presentation state", () => {
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  assert.match(workspace, /snapPoint=\{spatialContext\.sheetSnapPoint\}/);
  assert.match(workspace, /initialScrollTop=\{detailOpen \? 0 : spatialContext\.sheetScrollTop\}/);
  assert.match(workspace, /onScrollPositionChange=\{\(sheetScrollTop\) => \{\s*if \(detailOpen\) return;/);
  assert.match(workspace, /onSnapPointChange=\{\(sheetSnapPoint\)/);
  assert.match(workspace, /panelOpen: true/);
  assert.doesNotMatch(workspace, /placement="workspace"/);
  assert.match(workspace, /placement="sheet"/);
  assert.match(workspace, /placement="popover"/);
});

test("ordinary permanent-lens activation preserves the current detail disclosure instead of reopening it", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  assert.match(controller, /event\.preventDefault\(\);\s*onLensSelect\(lens\);/);
  assert.doesNotMatch(controller, /reopenActiveExchangeRoomSurface/);
  assert.doesNotMatch(controller, /PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT/);
  assert.doesNotMatch(controller, /PARTICIPANT_SPATIAL_ACTIVE_KEY/);
  assert.doesNotMatch(controller, /window\.sessionStorage/);
  assert.doesNotMatch(controller, /location\.(assign|replace)|window\.location/);
});

test("contextual action surfaces share one authorization request projection", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  assert.match(controller, /let exchangeRoomAuthorizationSnapshot: LensAuthorizationProjection \| null = null;/);
  assert.match(controller, /let exchangeRoomAuthorizationRequestLens: ParticipantLensId \| null = null;/);
  assert.match(controller, /if \(exchangeRoomAuthorizationRequestLens === lens\) return;/);
  assert.match(controller, /if \(exchangeRoomAuthorizationSnapshot\?\.lens === lens && exchangeRoomAuthorizationRequestLens === null\) return;/);
  assert.match(controller, /useSyncExternalStore\(\s*subscribeExchangeRoomAuthorization,\s*exchangeRoomAuthorizationStoreSnapshot,/);
  assert.equal(
    controller.match(/fetch\("\/geography\/canvas\/action-authorization"/g)?.length ?? 0,
    1,
    "detail and popover action surfaces must share the single module-level authorization fetch path",
  );
});

test("in-place lens change preserves authorization boundary while unavailable Capabilities actions stay disabled", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const registry = read("src/application/participant/exchange-room-actions.ts");
  assert.match(controller, /fetch\("\/geography\/canvas\/action-authorization"/);
  assert.match(controller, /action\.handlerCandidate/);
  assert.doesNotMatch(controller, /opportunities\.create-rfx|resources\.my-requests|resources\.provider-status/);
  assert.doesNotMatch(controller, /actionId === "capabilities\.evidence-refer"/);
  assert.match(registry, /id: "capabilities\.evidence-refer"[^\n]*operational: false[^\n]*handler: null/);
});
