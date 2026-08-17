import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Stage 2 action surfaces consume the validated spatial presentation state", () => {
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  assert.match(workspace, /snapPoint=\{spatialContext\.sheetSnapPoint\}/);
  assert.match(workspace, /initialScrollTop=\{spatialContext\.sheetScrollTop\}/);
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
