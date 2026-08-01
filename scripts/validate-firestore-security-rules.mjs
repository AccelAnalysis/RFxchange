import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rules = readFileSync(resolve(root, "firestore.rules"), "utf8");
const schema = readFileSync(resolve(root, "src/infrastructure/firestore/schema.ts"), "utf8");
const documentation = readFileSync(
  resolve(root, "docs/architecture/INF-004-firestore-security-rules-foundation.md"),
  "utf8",
);
const firebaseConfig = JSON.parse(readFileSync(resolve(root, "firebase.json"), "utf8"));

assert.equal(
  firebaseConfig.firestore?.rules,
  "firestore.rules",
  "firebase.json must bind Firestore to firestore.rules.",
);

assert.match(rules, /rules_version\s*=\s*['"]2['"]\s*;/, "Firestore rules_version must be 2.");
assert.match(rules, /service\s+cloud\.firestore\s*\{/, "Firestore rules service declaration is missing.");
assert.match(
  rules,
  /function\s+serverManagedOnly\s*\(\s*\)\s*\{\s*return\s+false\s*;\s*\}/s,
  "INF-004 server-managed deny helper is missing or no longer deny-by-default.",
);

const collectionBlock = schema.match(
  /export const FIRESTORE_COLLECTIONS = \{([\s\S]*?)\} as const;/,
)?.[1];
assert.ok(collectionBlock, "Unable to read FIRESTORE_COLLECTIONS from schema.ts.");

const canonicalCollections = [...collectionBlock.matchAll(/^\s+[A-Za-z0-9_]+:\s*"([^"]+)"/gm)].map(
  (match) => match[1],
);
assert.ok(canonicalCollections.length > 0, "No canonical Firestore collections were discovered.");

for (const collection of canonicalCollections) {
  assert.match(
    rules,
    new RegExp(`match\\s+/${collection}/\\{[^}]+\\}\\s*\\{`),
    `Canonical Firestore collection ${collection} is missing an explicit Security Rules match.`,
  );
}

const appendOnlyCollections = [
  "organizationAuditEvents",
  "organizationResolutions",
  "organizationEntityKeys",
  "organizationAuthorityClaimEvents",
  "organizationAuthorityDecisions",
  "organizationLocationEvents",
  "organizationProfileEvents",
  "organizationMarkerEvents",
  "legalDocumentVersions",
  "legalAcknowledgements",
  "organizationAuthorityRepresentations",
  "platformChangeDirectives",
  "retentionPolicies",
  "retentionAssignments",
  "adminPermissionGrants",
  "backgroundJobEvents",
  "acquisitionContextEvents",
  "orientationJourneyEvents",
  "activationReleaseEvents",
];

for (const collection of appendOnlyCollections) {
  const block = rules.match(
    new RegExp(`match\\s+/${collection}/\\{[^}]+\\}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`),
  )?.[1];
  assert.ok(block, `Append-only collection ${collection} is missing a rules block.`);
  assert.match(
    block,
    /allow\s+update\s*,\s*delete\s*:\s*if\s+false\s*;/,
    `Append-only collection ${collection} must explicitly deny client update/delete.`,
  );
}

assert.match(
  rules,
  /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read\s*,\s*write\s*:\s*if\s+false\s*;\s*\}/s,
  "Firestore rules must end with a recursive deny-all catch-all.",
);

assert.doesNotMatch(
  rules,
  /allow\s+[^;]+:\s*if\s+true\s*;/,
  "Firestore rules cannot contain unconditional client access.",
);

assert.doesNotMatch(
  rules,
  /request\.auth/,
  "INF-004 must not open authenticated client access before an approved UID/domain rules mapping.",
);

for (const requiredStatement of [
  "server managed",
  "deny by default",
  "Firebase Admin SDK",
  "bypass Cloud Firestore Security Rules",
  "least-privilege IAM",
  "AUTH-005",
  "INF-005",
]) {
  assert.ok(
    documentation.toLowerCase().includes(requiredStatement.toLowerCase()),
    `INF-004 documentation is missing required policy: ${requiredStatement}`,
  );
}

console.log(
  `Validated INF-004 Firestore Security Rules foundation across ${canonicalCollections.length} canonical collections.`,
);
