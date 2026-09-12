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

test("configured-browser acceptance preserves the historical baseline while adapting candidate contextual actions", () => {
  const runner = read("scripts/run-configured-exchange-shell-acceptance.mjs");
  const acceptance = read("scripts/acceptance-exchange-shell-emulator.mjs");
  assert.match(runner, /new URL\("\.\/acceptance-exchange-shell-emulator\.mjs", import\.meta\.url\)/);
  assert.match(runner, /readFile\(sourceUrl, "utf8"\)/);
  assert.match(runner, /function replaceOnce\(/);
  assert.match(runner, /assert\.equal\(matches, 1/);
  assert.match(runner, /new URL\("\.\/\.phase4-acceptance-exchange-shell-emulator\.mjs", import\.meta\.url\)/);
  assert.match(runner, /await writeFile\(adaptedUrl, source, "utf8"\)/);
  assert.match(runner, /await import\(`\$\{adaptedUrl\.href\}/);
  assert.match(runner, /await rm\(adaptedUrl, \{ force: true \}\)/);
  assert.match(runner, /primary Capabilities availability/);
  assert.match(runner, /mobile Menu trigger metrics/);
  assert.match(runner, /localized Capabilities route/);
  assert.match(runner, /candidate-aware Room activation signature/);
  assert.match(runner, /contextual detail close acceptance/);
  assert.match(runner, /closed Exchange Room detail surface without persistent actions/);
  assert.match(runner, /contextual lens settlement acceptance/);
  assert.match(runner, /preserve candidate detail disclosure/);
  assert.match(runner, /candidate Room detection without permanent actions/);
  assert.match(runner, /candidate \? continuityBefore\.panelOpen : true/);
  assert.match(acceptance, /closed Exchange Room detail surface with persistent action rail/);
  assert.match(acceptance, /nav\[data-mobile-lens-navigation="persistent-bottom"\]/);
  assert.match(acceptance, /bottomNavigationLenses/);
  assert.match(acceptance, /legacyLensMenuPresent/);
  assert.doesNotMatch(
    acceptance,
    /\[data-participant-navigation\] details > summary/,
    "configured mobile acceptance must use the persistent bottom navigation",
  );
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
