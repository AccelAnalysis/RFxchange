import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  AMACS_HISTORICAL_RELEASE_PIN,
  AMACS_RELEASE_PIN,
  createGeneratedArtifacts,
  verifyAmacsRelease,
} from "../scripts/amacs-release-tools.mjs";
import { ImmutableAmacsCatalog } from "../src/infrastructure/amacs/immutable-catalog.ts";
import { loadAmacsRuntimeSchemaValidator } from "../src/infrastructure/amacs/runtime-schema-validator.ts";

const root = new URL("../", import.meta.url);
const rootPath = path.resolve(root.pathname);
const currentReleasePath = path.join(rootPath, "standards/amacs/releases/0.5.0");
const historicalReleasePath = path.join(rootPath, "standards/amacs/releases/0.1.0");
const generatedPath = path.join(rootPath, "src/generated/amacs/0.5.0");

const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));

async function catalog() {
  const [current, search, registries, historical] = await Promise.all([
    readJson(path.join(generatedPath, "catalog.json")),
    readJson(path.join(generatedPath, "search-index.json")),
    readJson(path.join(generatedPath, "registries.json")),
    readJson(path.join(generatedPath, "historical/0.1.0/catalog.json")),
  ]);
  return new ImmutableAmacsCatalog(
    current,
    search,
    registries,
    new Map([[historical.release.version, historical]]),
  );
}

test("verifies the exact current and historical release artifacts", async () => {
  const current = await verifyAmacsRelease(currentReleasePath, AMACS_RELEASE_PIN);
  const historical = await verifyAmacsRelease(historicalReleasePath, AMACS_HISTORICAL_RELEASE_PIN);
  assert.equal(current.checkedFileCount, 87);
  assert.equal(current.manifest.source_commit, AMACS_RELEASE_PIN.sourceCommit);
  assert.equal(historical.checkedFileCount, 59);
  assert.equal(historical.manifest.source_commit, AMACS_HISTORICAL_RELEASE_PIN.sourceCommit);
});

test("rejects checksum mutation and a replacement source commit", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "rfxchange-amacs-tamper-"));
  await cp(currentReleasePath, temporary, { recursive: true });
  await writeFile(path.join(temporary, "manifest.json"), "{}\n", "utf8");
  await assert.rejects(
    verifyAmacsRelease(temporary, AMACS_RELEASE_PIN),
    /checksum mismatch/i,
  );
  await assert.rejects(
    verifyAmacsRelease(currentReleasePath, { ...AMACS_RELEASE_PIN, sourceCommit: "0".repeat(40) }),
    /source commit drifted/i,
  );
});

test("rebuilds deterministic projections byte for byte", async () => {
  const current = await verifyAmacsRelease(currentReleasePath, AMACS_RELEASE_PIN);
  const historical = await verifyAmacsRelease(historicalReleasePath, AMACS_HISTORICAL_RELEASE_PIN);
  const first = createGeneratedArtifacts(current, historical);
  const second = createGeneratedArtifacts(current, historical);
  assert.deepEqual(first, second);
  for (const [relativePath, content] of Object.entries(first)) {
    assert.equal(await readFile(path.join(generatedPath, relativePath), "utf8"), content);
  }
});

test("exposes deterministic domain, family, capability, label, and alias search", async () => {
  const subject = await catalog();
  const domains = await subject.listDomains();
  assert.equal(domains.length, 16);
  const families = await subject.listFamilies(domains[0].domainId);
  assert.ok(families.length > 0);
  const capabilities = await subject.listCapabilities(families[0].familyId);
  assert.ok(capabilities.length > 0);

  const exact = await subject.searchCapabilities({ query: capabilities[0].preferredLabel });
  assert.equal(exact.results[0].capability.conceptId, capabilities[0].conceptId);
  assert.equal(exact.results[0].matchedBy, "label");

  const alias = await subject.searchCapabilities({ query: "general contractor" });
  assert.equal(alias.results[0].matchedBy, "alias");
  assert.equal(alias.results[0].capability.conceptId, "AMACS-CAP-000002");
});

test("rejects model-invented IDs and preserves exact 0.1.0 label snapshots", async () => {
  const subject = await catalog();
  assert.equal(await subject.hasCanonicalCapability("AMACS-CAP-999999"), false);
  assert.equal(await subject.getCapability("AMACS-CAP-999999"), null);
  const historical = await subject.resolveHistoricalCapability({
    releaseVersion: "0.1.0",
    conceptId: "AMACS-CAP-000009",
    labelSnapshot: "Commercial electrical installation",
  });
  assert.equal(historical?.preferredLabel, "Commercial electrical installation");
  assert.equal(await subject.resolveHistoricalCapability({
    releaseVersion: "0.1.0",
    conceptId: "AMACS-CAP-000009",
    labelSnapshot: "Silently changed label",
  }), null);
});

test("validates all four semantic-entry contracts and rejects authoritative candidates", async () => {
  const validator = await loadAmacsRuntimeSchemaValidator(rootPath);
  const examples = await readJson(path.join(
    rootPath,
    "test/fixtures/amacs-0.5.0-need-and-interpretation.json",
  ));
  const contracts = [
    ["market-need.schema.json", examples.market_need],
    ["interpretation-record.schema.json", examples.interpretation_record],
    ["interpretation-candidate.schema.json", examples.interpretation_candidate],
    ["concept-interpretation-guidance.schema.json", examples.concept_interpretation_guidance],
  ];
  for (const [schemaName, value] of contracts) {
    assert.equal((await validator.validate(schemaName, value)).valid, true, schemaName);
  }
  assert.equal((await validator.validate("interpretation-record.schema.json", {
    ...examples.interpretation_record,
    authoritative_effect: "creates_assertion",
  })).valid, false);
});

test("migration evidence preserves Slice 3.2 text and creates no later domain records", async () => {
  const preview = await readJson(path.join(generatedPath, "migration-preview.json"));
  assert.equal(preview.summary.retainedHistoricalIds, 500);
  assert.equal(preview.summary.newCurrentCapabilities, 115);
  assert.equal(preview.rfxchangePersistenceInventory.canonicalAmacsReferencesFoundInCurrentRuntime, 0);
  assert.match(preview.rfxchangePersistenceInventory.transitionalDiscoveryBehavior, /preserve existing Slice 3\.2/i);
  assert.match(preview.rfxchangePersistenceInventory.migrationRule, /never convert legacy text/i);
});
