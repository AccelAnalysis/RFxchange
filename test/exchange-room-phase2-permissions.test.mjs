import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../src/application/participant/exchange-room-actions.ts", import.meta.url),
  "utf8",
);

const activeCapable = [
  "opportunities.find",
  "opportunities.create-rfx",
  "resources.find-providers",
  "resources.browse-resources",
  "resources.my-requests",
  "resources.provider-status",
  "intelligence.organizations",
  "intelligence.capabilities",
];

const gray = [
  "opportunities.pursue-respond",
  "opportunities.team",
  "intelligence.locations",
  "intelligence.layers",
  "referrals.new",
  "referrals.sent",
  "referrals.received",
  "referrals.starred",
];

test("privileged Phase 2 actions fail closed without exact permission", () => {
  assert.match(source, /actionAuthorization\?\.rfxCreate \?\? false/);
  assert.match(source, /actionAuthorization\?\.referralManage \?\? false/);
  assert.match(source, /actionAuthorization\?\.resourceManage \?\? false/);
  assert.match(source, /id: "resources\.my-requests"[^\n]*authorization: "open-platform-referral-manage"/);
});

test("Intelligence actions require Network discovery", () => {
  assert.match(source, /networkDiscoveryAvailable \?\? false/);
});

test("the eight ACTIVE-capable positions remain operational entries", () => {
  assert.equal(activeCapable.length, 8);
  for (const id of activeCapable) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(source, new RegExp(`id: "${escaped}"[^\\n]*operational: true`), id);
  }
});

test("the eight GRAY positions stay non-operational with no handler", () => {
  assert.equal(gray.length, 8);
  for (const id of gray) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      source,
      new RegExp(`id: "${escaped}"[^\\n]*operational: false[^\\n]*handler: null`),
      id,
    );
  }
});

test("New Referral remains individually disabled until an adapter opens the real composer", () => {
  assert.match(source, /id: "referrals\.new"[^\n]*operational: false[^\n]*handler: null/);
});
