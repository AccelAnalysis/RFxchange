import assert from "node:assert/strict";
import test from "node:test";
import { startAmbientMapRotation } from "../src/components/map/map-motion-preference.ts";
function map() { const handlers = new Map(); const calls = []; return { calls, handlers, on: (name, fn) => handlers.set(name, fn), off: (name, fn) => { if (handlers.get(name) === fn) handlers.delete(name); }, getBearing: () => 20, easeTo: options => calls.push(options), stop: () => calls.push("stop") }; }
test("ambient rotation uses native easing and cleans up its sole continuation", () => {
  const m = map(); const stop = startAmbientMapRotation(m, () => true);
  assert.equal(m.calls.length, 1); assert.equal(m.calls[0].bearing, 110); assert.equal(m.calls[0].essential, false);
  m.handlers.get("moveend")(); assert.equal(m.calls.length, 2);
  const old = m.handlers.get("moveend"); stop(); old();
  assert.equal(m.handlers.size, 0); assert.equal(m.calls.at(-1), "stop"); assert.equal(m.calls.length, 3);
});
test("reduced motion, user pause or hidden document prevents a camera animation", () => {
  const m = map(); let allowed = false; const stop = startAmbientMapRotation(m, () => allowed);
  assert.equal(m.calls.length, 0); allowed = true; m.handlers.get("moveend")(); assert.equal(m.calls.length, 1);
  allowed = false; m.handlers.get("moveend")(); assert.equal(m.calls.length, 1); stop();
});
