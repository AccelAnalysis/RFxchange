import { readFile } from "node:fs/promises";

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

const failures = [];

if (firebaseConfig.firestore?.indexes !== "firestore.indexes.json") {
  failures.push("firebase.json must bind Firestore indexes to firestore.indexes.json.");
}

if (!Array.isArray(indexConfig.indexes)) {
  failures.push("firestore.indexes.json must define an indexes array.");
}

if (!Array.isArray(indexConfig.fieldOverrides)) {
  failures.push("firestore.indexes.json must define a fieldOverrides array.");
}

if (!queryContracts.includes('"automatic-single-field"')) {
  failures.push("Firestore query contracts must support automatic-single-field index strategy.");
}

if (!queryContracts.includes('"automatic-equality-merge"')) {
  failures.push("Firestore query contracts must support automatic-equality-merge index strategy.");
}

if (!queryContracts.includes('"manual-composite"')) {
  failures.push("Firestore query contracts must reserve a manual-composite index strategy.");
}

if (!queryContracts.includes("FIRESTORE_MANUAL_INDEX_CONTRACTS")) {
  failures.push("Firestore query contracts must expose manual index contracts explicitly.");
}

if (queryContracts.includes("compositeIndexCandidate")) {
  failures.push("INF-005 must replace speculative compositeIndexCandidate flags with explicit index strategies.");
}

const contractPattern = /contract\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*\[([^\]]*)\]\s*,\s*"(zero-or-one|many)"\s*\)/g;
const contracts = [];
for (const match of queryContracts.matchAll(contractPattern)) {
  const fields = [...match[3].matchAll(/"([^"]+)"/g)].map((fieldMatch) => fieldMatch[1]);
  contracts.push({ name: match[1], collection: match[2], fields });
}

if (contracts.length === 0) {
  failures.push("No Firestore query contracts were discovered for index validation.");
}

for (const contract of contracts) {
  if (contract.fields.length === 0) {
    failures.push(`Firestore query contract ${contract.name} must declare at least one filter field.`);
  }
}

const repositoryOperators = [...repositories.matchAll(/\.where\(\s*"[^"]+"\s*,\s*"([^"]+)"/g)].map(
  (match) => match[1],
);

for (const operator of repositoryOperators) {
  if (operator !== "==") {
    failures.push(
      `Repository query operator ${operator} requires an explicit INF-005 index decision before use.`,
    );
  }
}

if (/\.orderBy\s*\(/.test(repositories)) {
  failures.push("Repository orderBy queries require an explicit INF-005 manual index review.");
}

const currentManualIndexes = Array.isArray(indexConfig.indexes) ? indexConfig.indexes : [];
const fieldOverrides = Array.isArray(indexConfig.fieldOverrides) ? indexConfig.fieldOverrides : [];

// The approved foundation query set is equality-only. Firestore automatic indexes support
// these queries, including compound equality through index merging. No manual indexes are
// justified until a repository query introduces a shape that automatic indexes cannot serve.
if (currentManualIndexes.length !== 0) {
  failures.push(
    "The current equality-only repository contracts require no manual Firestore indexes; remove speculative index entries.",
  );
}

if (fieldOverrides.length !== 0) {
  failures.push(
    "INF-005 currently requires default automatic indexing; fieldOverrides must remain empty unless a reviewed exemption is added.",
  );
}

const multiEqualityContracts = contracts.filter((contract) => contract.fields.length > 1);
if (multiEqualityContracts.length === 0) {
  failures.push("Expected compound equality query contracts for automatic index-merge validation.");
}

const contractNames = new Set(contracts.map((contract) => contract.name));
if (contractNames.size !== contracts.length) {
  failures.push("Firestore query contract names must be unique.");
}

if (failures.length > 0) {
  console.error("Firestore index management validation failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Firestore index management validated: ${contracts.length} query contracts, ${multiEqualityContracts.length} compound equality contracts, ${currentManualIndexes.length} manual indexes.`,
);
