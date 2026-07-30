import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const support = await readFile("src/infrastructure/firestore/support.ts", "utf8");
const repositories = await readFile("src/infrastructure/firestore/repositories.ts", "utf8");
const geographyRepositories = await readFile(
  "src/infrastructure/firestore/geography-repositories.ts",
  "utf8",
);
const queryContracts = await readFile("src/infrastructure/firestore/query-contracts.ts", "utf8");

test("INF-002 keeps Firestore provider details behind infrastructure adapters", () => {
  assert.match(repositories, /implements OrganizationAccountRepository/);
  assert.match(repositories, /implements OrganizationMembershipRepository/);
  assert.match(repositories, /implements OrganizationUserAuthorizationRepository/);
  assert.match(repositories, /implements OrganizationAuditRepository/);
  assert.match(repositories, /createFirestoreFoundationRepositories/);
});

test("INF-002 uses stable ids, server timestamps, schema versions, and append-only creates", () => {
  assert.match(support, /firestoreDocumentPath\(key, id\)/);
  assert.match(support, /FieldValue\.serverTimestamp\(\)/);
  assert.match(support, /schemaVersion: FIRESTORE_SCHEMA_VERSION/);
  assert.match(support, /await ref\.create\(/);
  assert.doesNotMatch(support, /\.add\(/);
});

test("GEO-001 persists geography selection and lifecycle advancement atomically", () => {
  assert.match(geographyRepositories, /implements GeographyDefinitionRepository/);
  assert.match(geographyRepositories, /implements PrimaryGeographySelectionUnitOfWork/);
  assert.match(geographyRepositories, /saveMutableFirestoreRecordsAtomically/);
  assert.match(geographyRepositories, /primaryGeographySelections/);
  assert.match(geographyRepositories, /accessJourneys/);
});

test("INF-002 exposes concrete query shapes to INF-005 index planning", () => {
  assert.match(queryContracts, /user-by-login/);
  assert.match(queryContracts, /active-memberships-by-user/);
  assert.match(queryContracts, /restriction-by-membership/);
  assert.match(queryContracts, /legal-document-by-kind-version/);
  assert.match(queryContracts, /FIRESTORE_QUERY_CONTRACTS/);
  assert.match(queryContracts, /FIRESTORE_MANUAL_INDEX_CONTRACTS/);
});
