import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = {
  package: "package.json",
  application: "src/application/auth/resolve-user-identity.ts",
  firebase: "src/infrastructure/auth/firebase-user-resolution.ts",
  server: "src/infrastructure/auth/firebase-user-resolution-server.ts",
  smoke: "scripts/smoke-firebase-user-resolution-emulator.mjs",
};

async function read(path) {
  return readFile(path, "utf8");
}

const packageJson = JSON.parse(await read(files.package));
const application = await read(files.application);
const firebase = await read(files.firebase);
const server = await read(files.server);
const smoke = await read(files.smoke);

assert.equal(
  packageJson.scripts?.["validate:firebase-user-resolution"],
  "node scripts/validate-firebase-user-resolution.mjs",
  "AUTH-002 validation script must remain addressable from package.json.",
);

for (const required of [
  "TrustedAuthenticationIdentity",
  "UserIdentityIdStrategy",
  "resolveUserIdentity",
  "getByLogin(provider, subject)",
  "getById(id)",
  "users.create(candidate)",
  "anonymous-identity-not-supported",
  "email-required-for-new-user",
  "name-required-for-new-user",
  "user-id-collision",
]) {
  assert.ok(application.includes(required), `AUTH-002 application resolver is missing: ${required}`);
}

assert.doesNotMatch(
  application,
  /from\s+["'](?:firebase|firebase-admin)(?:\/[^"']*)?["']/,
  "AUTH-002 application resolution must remain authentication-provider independent.",
);
assert.ok(
  !application.includes("getByPrimaryEmail("),
  "AUTH-002 must not auto-link identities merely because email addresses match.",
);

for (const required of [
  "FirebaseUserIdentityIdStrategy",
  'createHash("sha256")',
  "rfxchange:user:",
  "usr_",
  "trustedIdentityFromFirebasePrincipal",
  "FirebaseUserIdentityResolver",
  "FIREBASE_AUTH_PROVIDER",
  "resolveUserIdentity",
]) {
  assert.ok(firebase.includes(required), `AUTH-002 Firebase adapter is missing: ${required}`);
}

for (const required of [
  "createServerFirestoreFoundationRepositories",
  "FirebaseUserIdentityResolver",
  ".users.users",
]) {
  assert.ok(server.includes(required), `AUTH-002 server composition is missing: ${required}`);
}

for (const forbidden of ["verifyIdToken", "createSessionCookie", "verifySessionCookie"]) {
  assert.ok(
    !application.includes(forbidden) && !firebase.includes(forbidden) && !server.includes(forbidden),
    `AUTH-002 must not absorb AUTH-003 credential/session responsibility: ${forbidden}`,
  );
}

for (const required of [
  "FIRESTORE_EMULATOR_HOST",
  "EmulatorUserIdentityRepository",
  "FirebaseUserIdentityResolver",
  "createUserWithEmailAndPassword",
  'assert.equal(first.kind, "created")',
  'assert.equal(second.kind, "existing")',
  "Repeated sign-in must resolve the same RFxchange UserId",
  "await db.terminate()",
]) {
  assert.ok(smoke.includes(required), `AUTH-002 emulator smoke test is missing: ${required}`);
}

console.log("AUTH-002 Firebase identity to RFxchange UserIdentity resolution validated.");
