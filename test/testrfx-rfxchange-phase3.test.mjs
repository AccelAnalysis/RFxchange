import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readText = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const readJson = async (path) => JSON.parse(await readText(path));
const ledgerPath = "governance/testrfx-rfxchange-phase3.json";
const documentPath = "docs/program/TESTRFX_RFXCHANGE_PHASE3_STABILIZATION.md";

test("Phase 3 records current-main stabilization of the active destination candidates", async () => {
  const ledger = await readJson(ledgerPath);
  assert.equal(ledger.schemaVersion, 1);
  assert.equal(ledger.phase, "Phase 3 — Stabilize the destination before large ports");
  assert.equal(ledger.productionRepository, "AccelAnalysis/RFxchange");
  assert.equal(ledger.donorRepository, "AccelAnalysis/TestRFx");
  assert.equal(ledger.phase2MergeSha, "be7a1d485f3034262e59c99f3a2fd92505dc65a0");
  assert.equal(ledger.finalMainSha, "b5c12b196193099ee4fe7af70fc94dc54fa3f97d");
  assert.equal(ledger.status, "implemented-not-verified");

  assert.equal(ledger.stabilizedCandidates.length, 4);
  assert.deepEqual(ledger.stabilizedCandidates.map((item) => item.pr), [237, 234, 235, 238]);
  for (const candidate of ledger.stabilizedCandidates) {
    assert.equal(candidate.classification, "still required");
    assert.match(candidate.result, /^merged-/);
    assert.match(candidate.candidateSha, /^[0-9a-f]{40}$/);
    assert.match(candidate.mergeSha, /^[0-9a-f]{40}$/);
    assert.equal(typeof candidate.exactHeadCiRunId, "number");
  }
});

test("Phase 3 classifies and closes every overlapping historical pull request", async () => {
  const ledger = await readJson(ledgerPath);
  assert.deepEqual(ledger.historicalPullRequests.map((item) => item.pr), [221, 220, 219, 210]);
  assert.deepEqual(ledger.historicalPullRequests.map((item) => item.classification), [
    "incorporated into a newer successor",
    "incorporated into a newer successor",
    "partially reusable",
    "partially reusable",
  ]);
  for (const item of ledger.historicalPullRequests) {
    assert.match(item.status, /closed-not-merged$/);
  }
});

test("large donor ports remain blocked behind the Phase 2 admission gate", async () => {
  const ledger = await readJson(ledgerPath);
  assert.equal(ledger.admission.taskCanvas.state, "blocked");
  assert.equal(ledger.admission.providerData.state, "not-activated");
  assert.equal(ledger.admission.publicMedia.state, "not-activated");
  assert.match(ledger.admission.waveA.state, /^eligible-for-bounded-activation/);
  assert.ok(ledger.nextRequiredPackets.includes("WP-MOBILE-EXCHANGE-RFX-48-01"));
  assert.ok(ledger.nextRequiredPackets.includes("WP-MOBILE-EXCHANGE-RFX-49-01"));
  assert.ok(ledger.nextRequiredPackets.includes("WP-MOBILE-EXCHANGE-RFX-410-01"));
  assert.ok(ledger.nextRequiredPackets.includes("WP-MOBILE-EXCHANGE-STAGE4-OPPORTUNITIES-01"));
});

test("the Phase 3 closeout preserves RFxchange production authority", async () => {
  const [ledger, document] = await Promise.all([readJson(ledgerPath), readText(documentPath)]);
  const prohibited = ledger.prohibitions.join("\n").toLowerCase();
  for (const phrase of ["testrfx runtime", "postgresql", "maplibre", "dual writes", "browser-derived authority", "task canvas"]) {
    assert.ok(prohibited.includes(phrase), `Missing prohibition: ${phrase}`);
  }
  for (const phrase of [
    "Firebase Authentication",
    "Firestore repositories",
    "Firebase Functions",
    "Firebase Storage",
    "Mapbox",
    "There are no dual writes",
    "The large Task Canvas remains blocked",
  ]) {
    assert.ok(document.includes(phrase), `Missing Phase 3 boundary: ${phrase}`);
  }
  assert.doesNotMatch(document, /Phase 3.*Verified/i);
});
