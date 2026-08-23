import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readText = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const readJson = async (path) => JSON.parse(await readText(path));

const loadFeatureLedger = async () => {
  const index = await readJson(phase1Path);
  const chunks = await Promise.all(index.featureFiles.map(readJson));
  return { ...index, features: chunks.flatMap((chunk) => chunk.features) };
};

const loadContractLedger = async () => {
  const index = await readJson(phase2Path);
  const chunks = await Promise.all(index.contractFiles.map(readJson));
  return { ...index, contracts: chunks.flatMap((chunk) => chunk.contracts) };
};

const phase1Path = "governance/testrfx-rfxchange-reconciliation.json";
const phase2Path = "governance/testrfx-rfxchange-contract-map.json";

test("TestRFx convergence inventory is complete and contract-mapped", async () => {
  const ledger = await loadFeatureLedger();
  assert.equal(ledger.schemaVersion, 1);
  assert.equal(ledger.productionRepository, "AccelAnalysis/RFxchange");
  assert.equal(ledger.donorRepository, "AccelAnalysis/TestRFx");
  assert.equal(ledger.rfxchangeBaselineSha, "399072c05aa78e536ad57d0998a643f1c6d49b08");
  assert.equal(ledger.testRfxBaselineSha, "db19a0cc2171d0ddde4f34a20acc881ba7279248");
  assert.equal(ledger.features.length, 53);

  const allowed = new Set([
    "ALREADY PRESENT",
    "PORT PRESENTATION",
    "PORT DOMAIN EXPERIENCE",
    "MIGRATE DATA",
    "REIMPLEMENT AGAINST FIREBASE",
    "DEFER",
    "SUPERSEDED",
    "RETIRE",
  ]);
  const ids = new Set();
  for (const feature of ledger.features) {
    assert.match(feature.id, /^TRX-\d{3}$/);
    assert.ok(!ids.has(feature.id), `Duplicate feature ID: ${feature.id}`);
    ids.add(feature.id);
    assert.ok(allowed.has(feature.disposition), `Invalid disposition: ${feature.disposition}`);
    for (const key of [
      "testRfxFeature",
      "purpose",
      "rfxchangeEquivalent",
      "currentRfxchangeWorkPacket",
      "canonicalDomainOwner",
      "dataImplications",
      "authorizationImplications",
      "uiImplications",
      "acceptanceCriteria",
      "status",
    ]) {
      assert.equal(typeof feature[key], "string", `${feature.id} missing ${key}`);
      assert.ok(feature[key].trim().length > 0, `${feature.id} empty ${key}`);
    }
    assert.ok(Array.isArray(feature.sourcePrs) && feature.sourcePrs.length > 0);
    assert.ok(Array.isArray(feature.sourcePaths) && feature.sourcePaths.length > 0);
    if (!["RETIRE", "SUPERSEDED"].includes(feature.disposition)) {
      assert.ok(
        Array.isArray(feature.contractMapIds) && feature.contractMapIds.length > 0,
        `${feature.id} requires a Phase 2 contract map`,
      );
    }
  }
});

test("Phase 2 contract map contains every mandatory boundary", async () => {
  const ledger = await loadContractLedger();
  assert.equal(ledger.schemaVersion, 1);
  assert.equal(ledger.contracts.length, 26);

  const requiredIds = new Set([
    "CM-001","CM-002","CM-003","CM-004","CM-005","CM-006","CM-007",
    "CM-008","CM-009","CM-010","CM-011","CM-012","CM-013","CM-014",
    "CM-015","CM-016","CM-017","CM-018","CM-019","CM-020","CM-021",
    "CM-022","CM-023","CM-024","CM-025","CM-026",
  ]);
  const ids = new Set();
  for (const contract of ledger.contracts) {
    assert.ok(requiredIds.has(contract.id), `Unexpected contract ID: ${contract.id}`);
    assert.ok(!ids.has(contract.id), `Duplicate contract ID: ${contract.id}`);
    ids.add(contract.id);

    for (const key of [
      "testRfxConcept",
      "canonicalIdentity",
      "canonicalPersistence",
      "serverCommand",
      "authorization",
      "publicProjection",
      "auditEventBehavior",
      "rollbackOrRetry",
      "canonicalOwner",
      "currentWorkPacket",
      "mappingStatus",
      "admissionDecision",
    ]) {
      assert.equal(typeof contract[key], "string", `${contract.id} missing ${key}`);
      assert.ok(contract[key].trim().length > 0, `${contract.id} empty ${key}`);
    }

    assert.ok(Array.isArray(contract.testRfxSourcePaths) && contract.testRfxSourcePaths.length > 0);
    assert.ok(Array.isArray(contract.acceptanceGates) && contract.acceptanceGates.length > 0);
    assert.equal(typeof contract.rfxchangeDestination, "object");
    for (const key of ["domain", "application", "infrastructure", "presentation"]) {
      assert.equal(typeof contract.rfxchangeDestination[key], "string");
      assert.ok(contract.rfxchangeDestination[key].trim().length > 0);
    }
    assert.ok(Array.isArray(contract.rfxchangeDestination.collections));
  }
  assert.deepEqual(ids, requiredIds);
});

test("every feature contract reference resolves", async () => {
  const phase1 = await loadFeatureLedger();
  const phase2 = await loadContractLedger();
  const contractIds = new Set(phase2.contracts.map((item) => item.id));

  for (const feature of phase1.features) {
    for (const contractId of feature.contractMapIds) {
      assert.ok(contractIds.has(contractId), `${feature.id} references missing ${contractId}`);
    }
  }
});

test("governance authority preserves Firebase/Mapbox production truth", async () => {
  const authority = await readText("docs/program/TESTRFX_RFXCHANGE_CONVERGENCE_AUTHORITY.md");
  const gate = await readText("docs/program/TESTRFX_RFXCHANGE_PORT_ADMISSION_GATE.md");
  const map = await readText("docs/program/TESTRFX_RFXCHANGE_CONTRACT_MAP.md");

  for (const phrase of [
    "sole production repository",
    "Firebase Authentication",
    "Firestore",
    "Firebase Functions",
    "Firebase Storage",
    "Mapbox",
    "No dual writes",
    "No cross-repository production synchronization",
  ]) {
    assert.ok(authority.includes(phrase), `Authority missing: ${phrase}`);
  }

  for (const phrase of [
    "canonical identity",
    "canonical persistence",
    "server command",
    "authorization",
    "participant/public projection",
    "audit/event behavior",
    "rollback or retry behavior",
  ]) {
    assert.ok(map.toLowerCase().includes(phrase.toLowerCase()), `Contract map missing: ${phrase}`);
  }

  for (const phrase of [
    "blind file copy",
    "generic `exchange_records` collection",
    "dual write",
    "MapLibre/OpenFreeMap",
    "local-only Save/Watch",
  ]) {
    assert.ok(gate.includes(phrase), `Admission gate missing prohibition: ${phrase}`);
  }
});
