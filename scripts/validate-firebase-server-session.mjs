import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const application = await readFile("src/application/auth/server-session.ts", "utf8");
const boundary = await readFile("src/infrastructure/auth/firebase-server-session.ts", "utf8");
const runtime = await readFile("src/infrastructure/auth/firebase-session-runtime.ts", "utf8");
const adminRuntime = await readFile("src/infrastructure/firebase/admin.ts", "utf8");
const sessionRoute = await readFile("app/api/auth/session/route.ts", "utf8");
const envExample = await readFile(".env.example", "utf8");
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
  "authentication-backend-unavailable",
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
  "isAdminRuntimeFailure",
]) {
  assert.ok(boundary.includes(required), `AUTH-003 Firebase session boundary is missing ${required}.`);
}

for (const required of [
  "applicationDefault()",
  "firebaseAdminProjectIdFromEnvironment",
  "RFXCHANGE_EXPECTED_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "Firebase project configuration mismatch",
]) {
  assert.ok(adminRuntime.includes(required), `Firebase Admin runtime is missing ${required}.`);
}

assert.ok(
  sessionRoute.includes('error.code === "authentication-backend-unavailable"') &&
    sessionRoute.includes("return 503"),
  "Session exchange must report Firebase Admin runtime failures as service/configuration failures rather than invalid user credentials.",
);
assert.ok(
  envExample.includes("GOOGLE_APPLICATION_CREDENTIALS=/absolute/local/path"),
  "Local real-Firebase configuration must document the Firebase Admin ADC path without embedding credential contents.",
);
assert.ok(runtime.includes("createServerAuthenticationBoundary"), "AUTH-003 server composition is missing.");
assert.ok(!application.includes("firebase-admin"), "Application session contracts must remain Firebase-independent.");

console.log("AUTH-003 Firebase server authenticated session boundary validated.");
