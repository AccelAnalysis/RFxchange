import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  AMACS_HISTORICAL_RELEASE_PIN,
  AMACS_RELEASE_PIN,
  createGeneratedArtifacts,
  sha256,
  verifyAmacsRelease,
} from "./amacs-release-tools.mjs";

const root = process.cwd();
const current = await verifyAmacsRelease(
  path.join(root, "standards/amacs/releases/0.5.0"),
  AMACS_RELEASE_PIN,
);
const historical = await verifyAmacsRelease(
  path.join(root, "standards/amacs/releases/0.1.0"),
  AMACS_HISTORICAL_RELEASE_PIN,
);

assert.equal(current.datasets.concepts.filter((record) => record.concept_type === "domain").length, 16);
assert.equal(current.datasets.concepts.filter((record) => record.concept_type === "family").length, 120);
assert.equal(current.datasets.concepts.filter((record) => record.concept_type === "capability" && record.matchable).length, 615);
assert.equal(current.datasets.aliases.length, 185);
assert.equal(current.datasets["market-roles"].length, 18);
assert.equal(current.datasets.properties.length, 35);
assert.equal(current.datasets.units.length, 27);
assert.equal(current.datasets.credentials.length, 17);
assert.equal(current.datasets["requirement-types"].length, 10);
assert.equal(current.datasets["requirement-bundles"].length, 8);
assert.equal(current.datasets["request-families"].length, 10);
assert.equal(current.datasets["governance-profiles"].length, 7);
assert.equal(current.datasets["readiness-rules"].length, 30);
assert.equal(current.datasets["response-sections"].length, 29);
assert.equal(current.datasets["response-templates"].length, 7);
assert.equal(current.datasets["decision-factors"].length, 22);
assert.equal(current.datasets["decision-templates"].length, 7);
assert.equal(current.datasets["outcome-types"].length, 12);

const generated = createGeneratedArtifacts(current, historical);
const generatedDirectory = path.join(root, "src/generated/amacs/0.5.0");
for (const [relativePath, expected] of Object.entries(generated)) {
  const actual = await readFile(path.join(generatedDirectory, relativePath), "utf8");
  assert.equal(actual, expected, `Generated AMACS artifact drifted: ${relativePath}`);
}

const lock = JSON.parse(generated["ingestion-lock.json"]);
for (const [relativePath, expectedHash] of Object.entries(lock.generatedChecksums)) {
  assert.equal(sha256(generated[relativePath]), expectedHash);
}

const migration = JSON.parse(generated["migration-preview.json"]);
assert.equal(migration.summary.historicalCapabilities, 500);
assert.equal(migration.summary.retainedHistoricalIds, 500);
assert.equal(migration.summary.newCurrentCapabilities, 115);
assert.equal(migration.rfxchangePersistenceInventory.canonicalAmacsReferencesFoundInCurrentRuntime, 0);
assert.match(migration.rfxchangePersistenceInventory.migrationRule, /never convert legacy text/i);

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(target));
    else if (/\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) files.push(target);
  }
  return files;
}

const participantSources = [
  ...await sourceFiles(path.join(root, "app")),
  ...await sourceFiles(path.join(root, "src/components")),
];
for (const filePath of participantSources) {
  const source = await readFile(filePath, "utf8");
  assert.doesNotMatch(source, /standards\/amacs|generated\/amacs|infrastructure\/amacs|ajv\/dist/i);
}

const allParticipantSource = (await Promise.all(participantSources.map((filePath) => readFile(filePath, "utf8")))).join("\n");
assert.doesNotMatch(allParticipantSource, /AMACS-CAP-\d{6}|participant capability picker|team coverage workflow/i);

console.log(
  "AMACS 0.5.0 reconciliation validated: 87 checksummed current-release files, 16 domains, 120 families, 615 capabilities, 185 aliases, complete registries/schemas, deterministic projections, 0.1.0 history, and browser-source isolation.",
);
