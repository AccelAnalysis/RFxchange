import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("disabled Phase 2 actions stay non-actionable and expose status only to assistive technology", () => {
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const styles = read("src/components/participant/ExchangeRoomActionController.module.css");
  assert.match(controller, /className=\{styles\.disabledAction\}/);
  assert.match(controller, /<button[^>]*className=\{styles\.disabledAction\}[^>]*\bdisabled\b[^>]*data-action-state="disabled"[^>]*>/s);
  assert.match(controller, /data-disabled-reason=\{reason\}/);
  assert.match(controller, /aria-label=\{`\$\{label\}\. \$\{messages\.disabledReasons\[reason\]\}`\}/);
  assert.doesNotMatch(controller, />\s*\{messages\.disabledReasons\[reason\]\}\s*</);
  assert.match(styles, /opacity: 1/);
  assert.match(styles, /cursor: not-allowed/);
});

test("Phase 2 does not weaken protected domain routes", () => {
  for (const path of [
    "app/opportunities/page.tsx",
    "app/resources/page.tsx",
    "app/referrals/page.tsx",
    "app/provider-application/page.tsx",
    "app/capabilities/page.tsx",
  ]) {
    assert.match(read(path), /lifecycleState !== "open-platform"/, path);
  }
  const canvas = read("app/geography/canvas/page.tsx");
  assert.match(canvas, /focusedOrganizationId: selectedOrganizationId/);
  assert.match(canvas, /focusedDiscovery/);
});
