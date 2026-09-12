#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile, rm, writeFile } from "node:fs/promises";

// Phase 4 activates current RFxchange destinations and the mobile Menu. Keep the historical
// configured-browser harness intact, but adapt only assertions that still encode the prior
// unavailable-Capabilities / desktop-Account-on-mobile contract and the initial detail layout. Every other browser,
// accessibility, transition, authorization, Firebase, RFx, and build-identity check still runs.
const sourceUrl = new URL("./acceptance-exchange-shell-emulator.mjs", import.meta.url);
const adaptedUrl = new URL("./.phase4-acceptance-exchange-shell-emulator.mjs", import.meta.url);
let source = await readFile(sourceUrl, "utf8");

function replaceOnce(label, before, after) {
  const matches = source.split(before).length - 1;
  assert.equal(matches, 1, `${label} expected one legacy harness fragment; found ${matches}.`);
  source = source.replace(before, after);
}

replaceOnce(
  "primary Capabilities availability",
  '  assert.deepEqual(contract.map((item) => item.availability), ["enabled", "enabled", "enabled", "unavailable"]);',
  '  assert.deepEqual(contract.map((item) => item.availability), ["enabled", "enabled", "enabled", "enabled"]);',
);
replaceOnce(
  "primary Capabilities route",
  '  assert.equal(contract[3].href, null);\n  assert.equal(contract[3].disabled, "true");\n  assert.ok(contract[3].describedBy);',
  '  assert.equal(contract[3].href, "/capabilities");\n  assert.equal(contract[3].disabled, null);\n  assert.equal(contract[3].describedBy, null);',
);
replaceOnce(
  "controlled Capabilities progressive availability",
  '`location.pathname === "/geography/canvas" && Boolean(document.querySelector(\'[data-participant-lens="capabilities"][aria-disabled="true"]\'))`,',
  '`location.pathname === "/geography/canvas" && Boolean(document.querySelector(\'[data-participant-lens="capabilities"][data-availability="enabled"]\'))`,',
);
replaceOnce(
  "controlled unavailable-lens evidence",
  '      controlledLensesUnavailable: ["capabilities"],',
  '      controlledLensesUnavailable: [],',
);
replaceOnce(
  "mobile Menu trigger metrics",
  '      const account = document.querySelector(\'[data-participant-utility="account"] > button\');\n      const avatar = account?.firstElementChild;',
  '      const account = document.querySelector(\'[data-mobile-menu-trigger]\');\n      const avatar = account?.firstElementChild;',
);
replaceOnce(
  "mobile Menu icon size",
  '    assert.ok(mobile.accountAvatar?.avatarWidth >= 30 && mobile.accountAvatar?.avatarWidth <= 36);',
  '    assert.ok(mobile.accountAvatar?.avatarWidth >= 20 && mobile.accountAvatar?.avatarWidth <= 30);',
);
replaceOnce(
  "mobile Menu keyboard target",
  '      const button = document.querySelector(\'[data-participant-utility="account"] > button\');\n      button.focus();\n      button.dispatchEvent(new KeyboardEvent(\'keydown\', { key: \'ArrowDown\', bubbles: true }));',
  '      const button = document.querySelector(\'[data-mobile-menu-trigger]\');\n      button.focus();\n      button.dispatchEvent(new KeyboardEvent(\'keydown\', { key: \'ArrowUp\', bubbles: true }));',
);
replaceOnce(
  "mobile Menu authority refresh trigger",
  '    await evaluate(cdp, `document.querySelector(\'[data-participant-utility="account"] > button\')?.click()`);\n    await wait(300);',
  '    await evaluate(cdp, `document.querySelector(\'[data-mobile-menu-trigger]\')?.click()`);\n    await wait(300);',
);
replaceOnce(
  "localized Capabilities route",
  '      assert.equal(labels.capabilitiesAvailability, "unavailable");\n      assert.equal(labels.capabilitiesHref, null);',
  '      assert.equal(labels.capabilitiesAvailability, "enabled");\n      assert.equal(labels.capabilitiesHref, "/capabilities");',
);
replaceOnce(
  "configured acceptance route chain",
  '    routeChain: ["Intelligence", "Opportunities/RFx", "Resources", "Capabilities (unavailable)", "Referrals (Menu)", "Intelligence", "Account", "Quick Start"],',
  '    routeChain: ["Intelligence", "Opportunities/RFx", "Resources", "Capabilities", "Referrals (Menu)", "Intelligence", "Account", "Quick Start"],',
);

// The v2 edge panel initially shows results. Exercise a real selected record before
// asserting detail-close behavior, preserving the same close, lens and authority checks.
replaceOnce(
  "open a selected record before detail-close acceptance",
  '  if (!exchangeRoomReopenEvidenceCaptured) {\n    assert.equal(before.panelOpen, true, "Phase 2 detail surface was not open before reopen acceptance.");',
  `  if (!exchangeRoomReopenEvidenceCaptured) {
    const adaptiveResults = await evaluate(cdp, \`Boolean(document.querySelector('[data-desktop-panel="true"]'))\`);
    if (adaptiveResults) {
      const opened = await evaluate(cdp, \`(() => {
        const record = document.querySelector('[data-card-open]');
        if (!record) return false;
        record.click();
        return true;
      })()\`);
      assert.equal(opened, true, "Adaptive results did not expose an authorized record to open.");
      await waitForExpression(cdp, 'Boolean(document.querySelector("#organization-detail-panel"))', "selected record detail before close acceptance");
    }
    assert.equal(before.panelOpen, true, "Phase 2 detail surface was not open before reopen acceptance.");`,
);

// The close test deliberately selects an external organization. Subsequent URL
// continuity must preserve that subject while the signed-in actor remains unchanged.
replaceOnce(
  "capture the selected subject before a utility exit",
  '    observations.push(await clickLens(cdp, "resources", "/resources", { candidate: true, latencyMs: 450 }));',
  '    observations.push(await clickLens(cdp, "resources", "/resources", { candidate: true, latencyMs: 450 }));\n    const selectedSubjectBeforeUtilityExit = (await exchangeRoomLensSnapshot(cdp)).selection?.organizationId ?? organizationId;',
);
replaceOnce(
  "preserve the selected subject on the Intelligence return URL",
  '`?query=shell-acceptance&selectedOrganization=${organizationId}`,\n      "Returning to Intelligence discarded safe URL-derived map/query context."',
  '`?query=shell-acceptance&selectedOrganization=${selectedSubjectBeforeUtilityExit}`,\n      "Returning to Intelligence discarded safe URL-derived map/query context."',
);
replaceOnce(
  "retain the selected subject during an in-content route exit",
  '`/geography/canvas?query=shell-in-content&selectedOrganization=${organizationId}`;',
  '`/geography/canvas?query=shell-in-content&selectedOrganization=${selectedSubjectBeforeUtilityExit}`;',
);

// Observe Exchange storage before sign-out crosses into the separate Marketing origin.
replaceOnce(
  "clear Exchange context before the sign-out handoff",
  "    await evaluate(cdp, `document.querySelector('[role=\"menu\"] button[role=\"menuitem\"]')?.click()`);\n    await waitForExpression(cdp, `location.pathname === \"/\"`, \"signed-out public entry\");",
  "    const clearedExchangeContext = await evaluate(cdp, `(() => {\n      document.querySelector('[role=\"menu\"] button[role=\"menuitem\"]')?.click();\n      return {\n        intelligence: sessionStorage.getItem(${JSON.stringify(PARTICIPANT_INTELLIGENCE_CONTEXT_STORAGE_KEY)}),\n        spatial: Object.keys(sessionStorage).filter((key) => key.startsWith(${JSON.stringify(PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX)})),\n        referralIntent: sessionStorage.getItem(${JSON.stringify(PARTICIPANT_SPATIAL_LEGACY_REFERRAL_INTENT_KEY)}),\n      };\n    })()`);\n    assert.deepEqual(clearedExchangeContext, { intelligence: null, spatial: [], referralIntent: null }, \"Sign out retained participant context on the Exchange origin before the public-app handoff.\");\n    await waitForExpression(cdp, `location.pathname === \"/\"`, \"signed-out public entry\");",
);

await writeFile(adaptedUrl, source, "utf8");
try {
  await import(`${adaptedUrl.href}?phase4=${encodeURIComponent(process.env.RFXCHANGE_ACCEPTANCE_CANDIDATE_SHA ?? "local")}`);
} finally {
  await rm(adaptedUrl, { force: true });
}
