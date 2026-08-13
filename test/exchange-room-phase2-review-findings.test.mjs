import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const root=new URL("../",import.meta.url); const read=(p)=>readFileSync(new URL(p,root),"utf8");
test("Room authorization endpoint projects only required permission booleans",()=>{
  const source=read("app/geography/canvas/action-authorization/route.ts");
  for(const permission of ["rfx.create","referral.manage","resource.manage"]) assert.ok(source.includes(permission));
  assert.match(source,/access\.kind !== "authorized"/); assert.match(source,/lifecycleState !== "open-platform"/);
});
test("shared controller hydrates authorization fail-closed and requires discovery UI",()=>{
  const source=read("src/components/participant/ExchangeRoomActionController.tsx");
  assert.match(source,/DENIED_ACTION_AUTHORIZATION/); assert.match(source,/action-authorization/);
  assert.match(source,/form\[action=\\"\/geography\/canvas\\"\]/); assert.match(source,/reopenExchangeRoomActionPanel/);
});
test("lens recovery reopens the persisted panel without changing selection or camera",()=>{
  const source=read("src/application/participant/exchange-room-spatial-controls.ts");
  assert.match(source,/\.\.\.context/); assert.match(source,/panelOpen: true/);
  assert.doesNotMatch(source,/selection:/); assert.doesNotMatch(source,/camera:/);
});
