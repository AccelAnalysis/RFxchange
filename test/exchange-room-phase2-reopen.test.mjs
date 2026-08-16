import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("dismissed Phase 2 action surface follows validated spatial panel state", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  assert.match(controller, /useSyncExternalStore\([\s\S]*subscribeExchangeRoomSurface[\s\S]*exchangeRoomSurfaceSnapshot/);
  assert.match(controller, /readActiveParticipantSpatialContext\(\)/);
  assert.match(controller, /context\?\.panelOpen === false \? "closed" : "open"/);
  assert.match(controller, /if \(!surfaceOpen\) return null/);
});

test("ordinary permanent-lens activation reopens the existing Room surface after the lens transaction", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  assert.match(controller, /onLensSelect\(lens\);\s*reopenActiveExchangeRoomSurface\(\);/);
  assert.doesNotMatch(controller, /reopenActiveExchangeRoomSurface\(\);\s*onLensSelect\(lens\);/);
  assert.match(controller, /Object\.freeze\(\{ \.\.\.current, panelOpen: true \}\)/);
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
