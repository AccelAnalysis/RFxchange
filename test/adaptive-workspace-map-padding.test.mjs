import assert from "node:assert/strict";
import test from "node:test";
import { workspaceMapPadding } from "../src/components/map/workspaceMapPadding.ts";

test("adaptive sheets reserve vertical map space at mobile and intermediate widths", () => {
  for (const width of [390, 768, 1024]) {
    const padding = workspaceMapPadding("right", { width, height: 900 }, true);
    assert.equal(padding.left, padding.right, "A bottom sheet must not displace the map toward one side.");
    assert.ok(padding.bottom > padding.right);
    assert.ok(padding.top + padding.bottom < 900);
  }
});

test("desktop map padding clears the actual 420–480px edge panel", () => {
  for (const width of [1025, 1440, 1920]) {
    const panelWidth = Math.max(420, Math.min(width * 0.32, 480));
    const padding = workspaceMapPadding("right", { width, height: 900 }, true);
    assert.ok(padding.right >= panelWidth);
    assert.ok(padding.right <= panelWidth + 24, "Padding must not reserve the former broad overlay width.");
    assert.ok(padding.right + padding.left < width);
  }
});

test("the opt-in adaptive layout preserves other scene padding contracts", () => {
  const viewport = { width: 900, height: 800 };
  assert.deepEqual(workspaceMapPadding("left", viewport), { top: 88, right: 72, bottom: 62, left: 432 });
  assert.deepEqual(workspaceMapPadding(null, viewport, true), { top: 84, right: 36, bottom: 36, left: 36 });
});

test("short viewports retain usable map space", () => {
  const padding = workspaceMapPadding("right", { width: 640, height: 360 }, true);
  assert.ok(360 - padding.top - padding.bottom >= 80);
});
