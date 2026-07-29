import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const application = await readFile("src/application/auth/account-security.ts", "utf8");
const browser = await readFile("src/infrastructure/auth/firebase-browser-lifecycle.ts", "utf8");
const client = await readFile("src/infrastructure/auth/firebase-client.ts", "utf8");
const server = await readFile("src/infrastructure/auth/firebase-account-security.ts", "utf8");
const runtime = await readFile("src/infrastructure/auth/firebase-account-security-runtime.ts", "utf8");
const session = await readFile("src/infrastructure/auth/firebase-server-session.ts", "utf8");
const appIndex = await readFile("src/application/auth/index.ts", "utf8");
const infraIndex = await readFile("src/infrastructure/auth/index.ts", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));

assert.equal(
  packageJson.scripts?.["validate:firebase-authentication-lifecycle"],
  "node scripts/validate-firebase-authentication-lifecycle.mjs",
  "AUTH-004 validation script must remain addressable.",
);

for (const required of [
  "AuthenticationAccountSecuritySnapshot",
  "requireVerifiedEmailForOrganizationAccess",
  "authenticationAccountState",
  "authenticationCredentialState",
  "evaluateAuthenticatedOrganizationAccess",
  "account-disabled",
  "credential-revoked",
  "email-verification-required",
  "membership-inactive",
  "organization-access-restricted",
]) {
  assert.ok(application.includes(required), `AUTH-004 application security contract is missing ${required}.`);
}

for (const required of [
  "sendEmailVerification",
  "sendPasswordResetEmail",
  "requestPasswordRecovery",
  "reloadCurrentPrincipal",
  "auth/user-not-found",
]) {
  assert.ok(browser.includes(required), `AUTH-004 browser lifecycle is missing ${required}.`);
}

assert.ok(
  client.includes("createClientAuthenticationLifecycle"),
  "AUTH-004 browser lifecycle production composition is missing.",
);

for (const required of [
  "getUser(uid)",
  "updateUser(uid, { disabled: true })",
  "updateUser(uid, { disabled: false })",
  "revokeRefreshTokens(uid)",
  "mfaEnrolled",
  "tokensValidAfter",
]) {
  assert.ok(server.includes(required), `AUTH-004 provider account security is missing ${required}.`);
}

assert.ok(
  runtime.includes("createServerFirebaseAccountSecurityService"),
  "AUTH-004 server account-security production composition is missing.",
);

for (const required of [
  'code === "auth/user-disabled"',
  'code === "auth/id-token-revoked"',
  'code === "auth/session-cookie-revoked"',
  'new ServerSessionError("account-disabled"',
  'new ServerSessionError("credential-revoked"',
]) {
  assert.ok(session.includes(required), `AUTH-004 session failure mapping is missing ${required}.`);
}

assert.ok(appIndex.includes('export * from "./account-security"'), "AUTH-004 application export is missing.");
for (const required of [
  'export * from "./firebase-browser-lifecycle"',
  'export * from "./firebase-account-security"',
  'export * from "./firebase-account-security-runtime"',
]) {
  assert.ok(infraIndex.includes(required), `AUTH-004 infrastructure export is missing ${required}.`);
}

assert.ok(!application.includes("firebase/"), "Application security policy must remain Firebase-independent.");
assert.ok(!application.includes("firebase-admin"), "Application security policy must remain Firebase-independent.");
assert.ok(
  application.indexOf('reason: "account-disabled"') < application.indexOf('reason: "membership-inactive"'),
  "Authentication state must be evaluated before organization membership state.",
);

console.log("AUTH-004 Firebase authentication lifecycle and account security validated.");
