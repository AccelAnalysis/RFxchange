import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildHamptonRoadsProviderMigrationPlan } from "../scripts/prepare-hampton-roads-provider-migration.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Hampton Roads donor manifests become a deterministic review-aware RFxchange migration plan", async () => {
  const plan = await buildHamptonRoadsProviderMigrationPlan();
  assert.equal(plan.schemaVersion, 1);
  assert.equal(plan.marketKey, "hampton-roads-va");
  assert.equal(plan.donorRepository, "AccelAnalysis/TestRFx");
  assert.equal(plan.donorCommit, "db19a0cc2171d0ddde4f34a20acc881ba7279248");
  assert.deepEqual(plan.sourceCounts, {
    candidates: 32,
    locations: 40,
    acceptedGeocodes: 22,
    unresolvedGeocodes: 8,
    heldOut: 2,
  });
  assert.deepEqual(plan.dispositionCounts, {
    off_map_unresolved: 7,
    ready_for_canonical_comparison: 11,
    needs_identity_review: 11,
    needs_geocode_review: 1,
    held_out: 2,
  });
});

test("only exact accepted Census decisions can carry coordinates forward", async () => {
  const plan = await buildHamptonRoadsProviderMigrationPlan();
  const coordinateRecords = plan.records.filter((record) => record.location?.census);
  assert.equal(coordinateRecords.length, 22);
  assert.ok(coordinateRecords.every((record) => record.location.census.matchType === "single_match_state_zip"));
  assert.ok(coordinateRecords.every((record) => Number.isFinite(record.location.census.latitude) && Number.isFinite(record.location.census.longitude)));

  const offMap = plan.records.filter((record) => ["off_map_unresolved", "needs_geocode_review", "held_out"].includes(record.disposition));
  assert.equal(offMap.length, 10);
  assert.ok(offMap.every((record) => !record.location?.census));
  assert.equal(plan.records.find((record) => record.seedKey === "hrva-virginia-peninsula-chamber")?.disposition, "needs_geocode_review");
  assert.equal(plan.records.find((record) => record.seedKey === "hrva-hampton-reaktor")?.disposition, "held_out");
});

test("provider migration planning cannot become an alternate runtime or direct production write path", () => {
  const source = read("scripts/prepare-hampton-roads-provider-migration.mjs");
  assert.doesNotMatch(source, /firebase-admin|firebase\/firestore|getFirestore|\.set\(|\.create\(|postgres|postgis|neon|maplibre|exchange_records/i);
  assert.match(source, /ready_for_canonical_comparison/);
  assert.match(source, /needs_identity_review/);
  assert.match(source, /needs_geocode_review/);
  assert.match(source, /off_map_unresolved/);
  assert.match(source, /held_out/);
});
