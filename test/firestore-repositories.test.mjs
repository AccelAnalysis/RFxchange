import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const support = await readFile("src/infrastructure/firestore/support.ts", "utf8");
const repositories = await readFile("src/infrastructure/firestore/repositories.ts", "utf8");
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

test("INF-002 exposes concrete query shapes for INF-005 instead of speculative indexes", () => {
  assert.match(queryContracts, /user-by-login/);
  assert.match(queryContracts, /active-memberships-by-user/);
  assert.match(queryContracts, /restriction-by-membership/);
  assert.match(queryContracts, /legal-document-by-kind-version/);
  assert.match(queryContracts, /FIRESTORE_COMPOSITE_INDEX_CANDIDATES/);
});
