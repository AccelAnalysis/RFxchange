import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const application = await readFile("src/application/auth/server-session.ts", "utf8");
const boundary = await readFile("src/infrastructure/auth/firebase-server-session.ts", "utf8");
const runtime = await readFile("src/infrastructure/auth/firebase-session-runtime.ts", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));

assert.equal(
  packageJson.scripts?.["validate:firebase-server-session"],
  "node scripts/validate-firebase-server-session.mjs",
  "AUTH-003 validation script must remain addressable.",
);

for (const required of [
  "AuthenticatedServerContext",
  "TrustedAuthenticationClaims",
  "csrf-verification-required",
  "recent-authentication-required",
]) {
  assert.ok(application.includes(required), `AUTH-003 application contract is missing ${required}.`);
}

for (const required of [
  "verifyIdToken(idToken, true)",
  "verifySessionCookie(sessionCookie, true)",
  "createSessionCookie",
  "RFXCHANGE_SESSION_DURATION_MS",
  "RFXCHANGE_RECENT_AUTH_WINDOW_SECONDS",
  "csrfVerified",
  'httpOnly: true',
  'sameSite: "lax"',
]) {
  assert.ok(boundary.includes(required), `AUTH-003 Firebase session boundary is missing ${required}.`);
}

assert.ok(runtime.includes("createServerAuthenticationBoundary"), "AUTH-003 server composition is missing.");
assert.ok(!application.includes("firebase-admin"), "Application session contracts must remain Firebase-independent.");

console.log("AUTH-003 Firebase server authenticated session boundary validated.");
