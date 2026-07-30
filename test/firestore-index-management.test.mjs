import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const firebaseConfig = JSON.parse(
  await readFile(new URL("../firebase.json", import.meta.url), "utf8"),
);
const indexConfig = JSON.parse(
  await readFile(new URL("../firestore.indexes.json", import.meta.url), "utf8"),
);
const queryContracts = await readFile(
  new URL("../src/infrastructure/firestore/query-contracts.ts", import.meta.url),
  "utf8",
);
const repositories = await readFile(
  new URL("../src/infrastructure/firestore/repositories.ts", import.meta.url),
  "utf8",
);
const geographyRepositories = await readFile(
  new URL("../src/infrastructure/firestore/geography-repositories.ts", import.meta.url),
  "utf8",
);

test("firebase configuration source-controls Firestore indexes", () => {
  assert.equal(firebaseConfig.firestore?.indexes, "firestore.indexes.json");
  assert.ok(Array.isArray(indexConfig.indexes));
  assert.ok(Array.isArray(indexConfig.fieldOverrides));
});

test("foundation queries rely only on automatic Firestore indexing", () => {
  assert.deepEqual(indexConfig.indexes, []);
  assert.deepEqual(indexConfig.fieldOverrides, []);
  assert.match(queryContracts, /automatic-single-field/);
  assert.match(queryContracts, /automatic-equality-merge/);
  assert.match(queryContracts, /manual-composite/);
  assert.match(queryContracts, /FIRESTORE_MANUAL_INDEX_CONTRACTS/);
  assert.doesNotMatch(queryContracts, /compositeIndexCandidate/);
});

test("current Firestore repository queries remain equality-only and unsorted", () => {
  const operators = [...`${repositories}\n${geographyRepositories}`.matchAll(/\.where\(\s*"[^"]+"\s*,\s*"([^"]+)"/g)].map(
    (match) => match[1],
  );

  assert.ok(operators.length > 0, "Expected repository query filters to validate.");
  assert.deepEqual([...new Set(operators)], ["=="]);
  assert.doesNotMatch(repositories, /\.orderBy\s*\(/);
});

test("compound equality contracts are explicitly planned for index merging", () => {
  for (const queryName of [
    "user-by-login",
    "active-memberships-by-user",
    "restriction-by-organization",
    "restriction-by-membership",
    "legal-document-by-kind-version",
    "geography-authorizations-by-user-and-geography",
  ]) {
    assert.ok(queryContracts.includes(`\"${queryName}\"`), `Missing compound equality query ${queryName}.`);
  }

  assert.match(
    queryContracts,
    /fields\.length > 1 \? "automatic-equality-merge" : "automatic-single-field"/,
  );
});
