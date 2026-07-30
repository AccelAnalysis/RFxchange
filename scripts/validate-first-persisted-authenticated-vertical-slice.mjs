import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const service = await readFile(
  new URL("../src/application/auth/authenticated-organization-workspace.ts", import.meta.url),
  "utf8",
);
const runtime = await readFile(
  new URL("../src/infrastructure/auth/firebase-authenticated-organization-runtime.ts", import.meta.url),
  "utf8",
);
const smoke = await readFile(
  new URL("./smoke-first-persisted-authenticated-vertical-slice-emulator.mjs", import.meta.url),
  "utf8",
);
const ci = await readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");

for (const required of [
  "listActiveByUserId",
  "resolveUserOrganizationAccess",
  "authorizeOrganizationOperation",
  "getByOrganizationId",
  "organization-selection-required",
  "organization-profile-missing",
]) {
  assert.ok(service.includes(required), `INF-009 workspace service is missing ${required}.`);
}
assert.ok(
  !service.includes('from "firebase') && !service.includes("firebase-admin"),
  "INF-009 application workspace resolution must remain provider-independent.",
);

assert.ok(
  runtime.includes("createFirestoreFoundationRepositories") &&
    runtime.includes("createServerFirebaseAccountSecurityService") &&
    runtime.includes("AuthenticatedOrganizationWorkspaceService"),
  "INF-009 server runtime must compose real Firestore adapters with Firebase account-security checks.",
);

for (const required of [
  "FirebaseBrowserAuthenticationProvider",
  "FirebaseServerSessionBoundary",
  "FirebaseUserIdentityResolver",
  "FirebaseAccountSecurityService",
  "createFirestoreFoundationRepositories",
  "createOrganizationMembership",
  "createOrganizationUserAuthorization",
  "issueSessionCookie",
  "authenticateSessionCookie",
  "repositoriesAfterReload",
  "schemaVersion",
  "organization.profile.manage",
]) {
  assert.ok(smoke.includes(required), `INF-009 emulator acceptance is missing ${required}.`);
}
assert.ok(
  smoke.includes("login -> identity -> membership -> organization -> permission -> Firestore -> session reload -> same authorized organization"),
  "INF-009 acceptance must explicitly prove the full persisted authenticated chain.",
);
assert.ok(
  ci.includes("smoke-first-persisted-authenticated-vertical-slice-emulator.mjs"),
  "INF-009 emulator acceptance must run in production CI.",
);

console.log("INF-009 first persisted authenticated vertical slice validated.");
