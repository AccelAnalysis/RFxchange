#!/usr/bin/env node

import { readFile, rm, writeFile } from "node:fs/promises";

// Phase 4 activates the already-real Capabilities destination. The historical configured-browser
// harness otherwise remains authoritative, so adapt only its stale primary-navigation assertion
// while preserving every other browser, accessibility, transition, authorization and identity check.
const sourceUrl = new URL("./acceptance-exchange-shell-emulator.mjs", import.meta.url);
const adaptedUrl = new URL("./.phase4-acceptance-exchange-shell-emulator.mjs", import.meta.url);
const source = await readFile(sourceUrl, "utf8");
const staleContract = `  assert.deepEqual(contract.map((item) => item.availability), ["enabled", "enabled", "enabled", "unavailable"]);
  assert.equal(contract[3].href, null);
  assert.equal(contract[3].disabled, "true");
  assert.ok(contract[3].describedBy);
  assert.match(contract[3].text, /Capabilities|Capacidades|Capacités|Capacità|Fähigkeiten/);
  assert.equal(contract[3].current, null);`;
const currentContract = `  assert.deepEqual(contract.map((item) => item.availability), ["enabled", "enabled", "enabled", "enabled"]);
  assert.equal(contract[3].href, "/capabilities");
  assert.equal(contract[3].disabled, null);
  assert.equal(contract[3].describedBy, null);
  assert.match(contract[3].text, /Capabilities|Capacidades|Capacités|Capacità|Fähigkeiten/);
  assert.equal(contract[3].current, null);`;

if (!source.includes(staleContract)) {
  throw new Error("Configured-browser harness no longer matches the known pre-Phase-4 Capabilities contract; reconcile the canonical harness before running acceptance.");
}

await writeFile(adaptedUrl, source.replace(staleContract, currentContract), "utf8");
try {
  await import(`${adaptedUrl.href}?phase4=${Date.now()}`);
} finally {
  await rm(adaptedUrl, { force: true });
}
