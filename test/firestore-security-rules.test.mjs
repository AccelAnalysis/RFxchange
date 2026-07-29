import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rules = readFileSync(resolve(root, "firestore.rules"), "utf8");
const firebaseConfig = JSON.parse(readFileSync(resolve(root, "firebase.json"), "utf8"));

const canonicalCollections = [
  "organizations",
  "organizationProfiles",
  "users",
  "organizationMemberships",
  "organizationAuthorizations",
  "organizationAuditEvents",
  "accessJourneys",
  "accessRestrictions",
  "legalDocumentVersions",
  "legalAcknowledgements",
  "organizationAuthorityRepresentations",
  "platformChangeDirectives",
  "retentionPolicies",
  "retentionAssignments",
  "adminAuthorityContexts",
  "adminPermissionGrants",
];

const appendOnlyCollections = [
  "organizationAuditEvents",
  "legalDocumentVersions",
  "legalAcknowledgements",
  "organizationAuthorityRepresentations",
  "platformChangeDirectives",
  "retentionPolicies",
  "retentionAssignments",
  "adminPermissionGrants",
];

test("INF-004 binds the Firebase project to the source-controlled Firestore ruleset", () => {
  assert.equal(firebaseConfig.firestore?.rules, "firestore.rules");
  assert.match(rules, /rules_version\s*=\s*['"]2['"]\s*;/);
});

test("INF-004 explicitly closes every canonical Firestore collection to clients", () => {
  for (const collection of canonicalCollections) {
    assert.match(rules, new RegExp(`match\\s+/${collection}/\\{documentId\\}`));
  }

  assert.match(
    rules,
    /function\s+serverManagedOnly\s*\(\s*\)\s*\{\s*return\s+false\s*;\s*\}/s,
  );
  assert.doesNotMatch(rules, /request\.auth/);
  assert.doesNotMatch(rules, /allow\s+[^;]+:\s*if\s+true\s*;/);
});

test("INF-004 preserves append-only client immutability", () => {
  for (const collection of appendOnlyCollections) {
    const block = rules.match(
      new RegExp(`match\\s+/${collection}/\\{documentId\\}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`),
    )?.[1];
    assert.ok(block, `Missing rules block for ${collection}`);
    assert.match(block, /allow\s+update\s*,\s*delete\s*:\s*if\s+false\s*;/);
  }
});

test("INF-004 denies any undeclared Firestore path", () => {
  assert.match(
    rules,
    /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read\s*,\s*write\s*:\s*if\s+false\s*;\s*\}/s,
  );
});
