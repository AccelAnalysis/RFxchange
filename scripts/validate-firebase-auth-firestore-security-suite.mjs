import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const authorization = await readFile(
  "src/application/auth/authorize-organization-operation.ts",
  "utf8",
);
const applicationIndex = await readFile("src/application/auth/index.ts", "utf8");
const rules = await readFile("firestore.rules", "utf8");
const smoke = await readFile("scripts/smoke-firebase-auth-firestore-security-emulator.mjs", "utf8");
const workflow = await readFile(".github/workflows/ci.yml", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));

assert.equal(
  packageJson.scripts?.["validate:firebase-auth-firestore-security-suite"],
  "node scripts/validate-firebase-auth-firestore-security-suite.mjs",
  "AUTH-005 validation script must remain addressable.",
);

for (const required of [
  "authorizeOrganizationOperation",
  "AuthenticatedServerContext | null",
  "accountSecurity.inspect",
  "memberships.getById",
  "organizations.getById",
  "restrictions.getForOrganization",
  "restrictions.getForMembership",
  "authorizations.getByMembershipId",
  "evaluateAuthenticatedOrganizationAccess",
  "evaluateOrganizationPermission",
  '"unauthenticated"',
  '"wrong-user"',
  '"wrong-organization"',
  '"membership-inactive"',
  '"organization-access-restricted"',
  '"missing-permission"',
]) {
  assert.ok(authorization.includes(required), `AUTH-005 authorization boundary is missing ${required}.`);
}

assert.ok(
  applicationIndex.includes('export * from "./authorize-organization-operation"'),
  "AUTH-005 application boundary export is missing.",
);
assert.ok(!authorization.includes("firebase/"), "AUTH-005 application boundary must remain Firebase-independent.");
assert.ok(!authorization.includes("firebase-admin"), "AUTH-005 application boundary must remain Firebase-independent.");

for (const required of [
  'function serverManagedOnly()',
  'return false;',
  'match /{document=**}',
  'allow read, write: if false;',
]) {
  assert.ok(rules.includes(required), `AUTH-005 requires the default-deny Firestore rule ${required}.`);
}

for (const required of [
  "FIREBASE_AUTH_EMULATOR_HOST",
  "FIRESTORE_EMULATOR_HOST",
  "FirebaseServerSessionBoundary",
  "FirebaseUserIdentityResolver",
  "FirebaseAccountSecurityService",
  "authorizeOrganizationOperation",
  'reason: "unauthenticated"',
  'reason: "wrong-user"',
  'reason: "wrong-organization"',
  'reason: "membership-inactive"',
  'reason: "organization-access-restricted"',
  'reason: "missing-permission"',
  "permission-denied",
  "Authenticated direct client read must remain denied",
  "AUTH-005 Firebase Auth and Firestore security suite passed.",
]) {
  assert.ok(smoke.includes(required), `AUTH-005 emulator suite is missing ${required}.`);
}

assert.ok(
  workflow.includes("node scripts/smoke-firebase-auth-firestore-security-emulator.mjs"),
  "AUTH-005 emulator suite must run in CI.",
);
assert.ok(
  workflow.includes("--only auth,firestore"),
  "AUTH-005 CI must start both Auth and Firestore emulators.",
);

console.log("AUTH-005 Firebase Auth and Firestore emulator security suite validated.");
