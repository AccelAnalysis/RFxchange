import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { register } from "node:module";
register("../scripts/node-typescript-source-loader.mjs", import.meta.url);
const { FIRESTORE_QUERY_CONTRACTS } = await import("../src/infrastructure/firestore/query-contracts.ts");
import { SAD_RUNTIME_MANUAL_INDEXES } from "../src/infrastructure/firestore/sad-runtime-schema.ts";
const config = JSON.parse(readFileSync("firebase.json", "utf8"));
const indexes = JSON.parse(readFileSync("firestore.indexes.json", "utf8"));
test("Firebase binds deployed rules, indexes, and compiled Functions", () => {
  assert.equal(config.firestore.rules, "firestore.rules");
  assert.equal(config.firestore.indexes, "firestore.indexes.json");
  assert.equal(config.storage.rules, "storage.rules");
  assert.equal(config.functions.source, "functions");
  assert.equal(config.functions.runtime, "nodejs22");
  assert.ok(config.functions.predeploy.some(command => command.includes("run build")));
});
test("deployed indexes match query contracts regardless of object-key order", () => {
  const ordered = values => [...values].sort((a,b) => a.collectionGroup.localeCompare(b.collectionGroup));
  assert.deepEqual(ordered(indexes.indexes), ordered(SAD_RUNTIME_MANUAL_INDEXES));
  assert.deepEqual(indexes.fieldOverrides, []);
  assert.equal(new Set(FIRESTORE_QUERY_CONTRACTS.map(query => query.name)).size, FIRESTORE_QUERY_CONTRACTS.length);
  for (const query of FIRESTORE_QUERY_CONTRACTS) {
    assert.ok(query.filters.length > 0);
    assert.equal(query.indexStrategy, query.filters.length > 1 ? "automatic-equality-merge" : "automatic-single-field");
    assert.ok(query.filters.every(filter => filter.operator === "=="));
  }
});
