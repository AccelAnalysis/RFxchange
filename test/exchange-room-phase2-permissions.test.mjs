import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const source=readFileSync(new URL("../src/application/participant/exchange-room-actions.ts",import.meta.url),"utf8");
test("privileged Phase 2 actions fail closed without exact permission",()=>{
  assert.match(source,/actionAuthorization\?\.rfxCreate \?\? false/);
  assert.match(source,/actionAuthorization\?\.referralManage \?\? false/);
  assert.match(source,/actionAuthorization\?\.resourceManage \?\? false/);
  assert.match(source,/id: "resources\.my-requests"[^\n]*authorization: "open-platform-referral-manage"/);
});
test("Intelligence actions require Network discovery",()=>assert.match(source,/networkDiscoveryAvailable \?\? false/));
test("the seven missing-runtime actions stay non-operational with no handler",()=>{
  for(const id of [
    "opportunities.pursue-respond",
    "opportunities.team",
    "intelligence.locations",
    "intelligence.layers",
    "referrals.sent",
    "referrals.received",
    "referrals.starred",
  ]) {
    const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    assert.match(source,new RegExp(`id: "${escaped}"[^\\n]*operational: false[^\\n]*handler: null`),id);
  }
});
