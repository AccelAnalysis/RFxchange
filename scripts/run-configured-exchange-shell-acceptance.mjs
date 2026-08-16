#!/usr/bin/env node

import { readFile, rm, writeFile } from "node:fs/promises";

const sourceUrl = new URL("./acceptance-exchange-shell-emulator.mjs", import.meta.url);
const runtimeUrl = new URL(`./.acceptance-exchange-shell-emulator.issue196.${process.pid}.mjs`, import.meta.url);

let source = await readFile(sourceUrl, "utf8");

function replaceOnce(label, before, after) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Issue #196 runner could not find ${label}.`);
  if (source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`Issue #196 runner found more than one ${label}.`);
  }
  source = source.replace(before, after);
}

replaceOnce(
  "Phase 2 runtime-state insertion point",
  `});\n\nasync function exchangeRoomLensSnapshot(cdp) {`,
  `});\n\nlet exchangeRoomPhase2RuntimeDetected = false;\nlet exchangeRoomReopenEvidenceCaptured = false;\n\nasync function exchangeRoomLensSnapshot(cdp) {`,
);

replaceOnce(
  "open-grid-only helper assertion",
  `  assert.equal(before.phase2, true, \`${"${id}"} did not expose the Phase 2 Exchange Room controller.\`);`,
  `  assert.equal(exchangeRoomPhase2RuntimeDetected, true, \`${"${id}"} did not establish the Phase 2 Exchange Room controller.\`);`,
);

replaceOnce(
  "continuity snapshot before reopen evidence",
  `  assert.equal(before.wholeLensDisabled, false, "A permanent lens was disabled as a whole.");\n\n  const continuityBefore = await exchangeRoomLensSnapshot(cdp);`,
  `  assert.equal(before.wholeLensDisabled, false, "A permanent lens was disabled as a whole.");\n\n  if (!exchangeRoomReopenEvidenceCaptured) {\n    assert.equal(before.panelOpen, true, "Phase 2 action surface was not open before reopen acceptance.");\n    const closed = await evaluate(cdp, \`(() => {\n      const close = [...document.querySelectorAll('#organization-detail-panel button[type="button"]')]\n        .find((button) => button.textContent?.includes('×'));\n      if (!close) return false;\n      close.click();\n      return true;\n    })()\`);\n    assert.equal(closed, true, "Could not close the Exchange Room action surface before reopen acceptance.");\n    await waitForExpression(\n      cdp,\n      \`!document.querySelector('[data-exchange-room-action-grid]')\`,\n      "closed Exchange Room action surface",\n    );\n    exchangeRoomReopenEvidenceCaptured = true;\n  }\n\n  const continuityBefore = await exchangeRoomLensSnapshot(cdp);`,
);

replaceOnce(
  "panel-state preservation assertion",
  `  assert.equal(after.panelOpen, continuityBefore.panelOpen, \`${"${id}"} changed the organization detail-panel state during lens activation.\`);`,
  `  assert.equal(after.panelOpen, true, \`${"${id}"} did not leave/reopen the action surface.\`);`,
);

replaceOnce(
  "open-grid-only Phase 2 dispatch",
  `  const phase2 = await evaluate(cdp, \`Boolean(document.querySelector('[data-exchange-room-action-grid]'))\`);\n  return phase2\n    ? clickExchangeRoomLens(cdp, id, href, expectedPath, options)\n    : clickHref(cdp, href, expectedPath, options);`,
  `  const phase2SurfacePresent = await evaluate(cdp, \`Boolean(document.querySelector('[data-exchange-room-action-grid]'))\`);\n  if (phase2SurfacePresent) exchangeRoomPhase2RuntimeDetected = true;\n  const phase2 = exchangeRoomPhase2RuntimeDetected\n    && await evaluate(cdp, \`location.pathname === "/geography/canvas"\`);\n  return phase2\n    ? clickExchangeRoomLens(cdp, id, href, expectedPath, options)\n    : clickHref(cdp, href, expectedPath, options);`,
);

replaceOnce(
  "controlled participant permanent Resources lens expectation",
  `location.pathname === "/geography/canvas" && Boolean(document.querySelector('[data-participant-lens="resources"][aria-disabled="true"]'))`,
  `location.pathname === "/geography/canvas" && document.querySelector('[data-participant-lens="resources"]')?.getAttribute('data-availability') === "enabled"`,
);

replaceOnce(
  "orientation-complete permanent Referrals lens expectation",
  `location.pathname === "/geography/canvas" && Boolean(document.querySelector('[data-participant-lens="referrals"][aria-disabled="true"]'))`,
  `location.pathname === "/geography/canvas" && document.querySelector('[data-participant-lens="referrals"]')?.getAttribute('data-availability') === "enabled"`,
);

replaceOnce(
  "controlled whole-lens evidence semantics",
  `      controlledLensesUnavailable: true,`,
  `      controlledLensesUnavailable: false,`,
);

await writeFile(runtimeUrl, source, "utf8");
try {
  await import(`${runtimeUrl.href}?run=${Date.now()}`);
} finally {
  await rm(runtimeUrl, { force: true });
}
