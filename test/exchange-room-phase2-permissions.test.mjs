import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const source=readFileSync(new URL("../src/application/participant/exchange-room-actions.ts",import.meta.url),"utf8");
test("privileged Phase 2 actions fail closed without exact permission",()=>{
  assert.match(source,/actionAuthorization\?\.rfxCreate \?\? false/);
  assert.match(source,/actionAuthorization\?\.referralManage \?\? false/);
  assert.match(source,/actionAuthorization\?\.resourceManage \?\? false/);
});
test("Intelligence actions require Network discovery",()=>assert.match(source,/networkDiscoveryAvailable \?\? false/));
