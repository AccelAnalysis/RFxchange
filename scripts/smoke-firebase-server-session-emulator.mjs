import assert from "node:assert/strict";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectAuthEmulator, deleteUser, inMemoryPersistence, initializeAuth } from "firebase/auth";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

import { FirebaseBrowserAuthenticationProvider } from "../src/infrastructure/auth/firebase-browser.ts";
import { FirebaseServerSessionBoundary } from "../src/infrastructure/auth/firebase-server-session.ts";
import { FirebaseUserIdentityResolver } from "../src/infrastructure/auth/firebase-user-resolution.ts";

assert.equal(
  process.env.FIREBASE_AUTH_EMULATOR_HOST,
  "127.0.0.1:9099",
  "AUTH-003 smoke test must use the Firebase Auth emulator.",
);

const records = new Map();
const users = {
  async getById(id) {
    return records.get(id) ?? null;
  },
  async getByPrimaryEmail(email) {
    return [...records.values()].find((record) => record.primaryEmail === email.toLowerCase()) ?? null;
  },
  async getByLogin(provider, subject) {
    return [...records.values()].find(
      (record) => record.login.provider === provider && record.login.subject === subject,
    ) ?? null;
  },
  async create(user) {
    if (records.has(user.id)) throw new Error("duplicate-user");
    records.set(user.id, user);
  },
};

const projectId = "demo-rfxchange";
const clientApp = initializeClientApp(
  { apiKey: "demo-api-key", authDomain: `${projectId}.firebaseapp.com`, projectId, appId: "1:123:web:auth003" },
  `auth-003-client-${Date.now()}`,
);
const clientAuth = initializeAuth(clientApp, { persistence: inMemoryPersistence });
connectAuthEmulator(clientAuth, "http://127.0.0.1:9099", { disableWarnings: true });
const browser = new FirebaseBrowserAuthenticationProvider(clientAuth);

const adminApp = initializeAdminApp({ projectId }, `auth-003-admin-${Date.now()}`);
const adminAuth = getAdminAuth(adminApp);
const resolver = new FirebaseUserIdentityResolver(users);
const boundary = new FirebaseServerSessionBoundary(adminAuth, resolver, { secureCookies: false });

const email = `auth-003-${Date.now()}@example.test`;
const password = "RFxchange-AUTH-003-Smoke-123!";

try {
  await browser.registerWithEmailAndPassword(email, password);
  const idToken = await browser.getIdToken();
  assert.ok(idToken, "Firebase client must issue an ID token.");

  const issued = await boundary.issueSessionCookie({
    idToken,
    csrfVerified: true,
    requestedName: "AUTH 003 Smoke User",
    now: new Date().toISOString(),
  });
  assert.equal(issued.context.authentication.source, "id-token");
  assert.notEqual(issued.context.user.id, issued.context.authentication.subject);
  assert.ok(issued.cookie.value, "Firebase Admin must issue a session cookie through the emulator.");

  await browser.signOut();
  const authenticated = await boundary.authenticateSessionCookie({
    sessionCookie: issued.cookie.value,
    now: new Date().toISOString(),
  });
  assert.equal(authenticated.authentication.source, "session-cookie");
  assert.equal(authenticated.user.id, issued.context.user.id);

  console.log("AUTH-003 Firebase server authenticated session boundary emulator smoke test passed.");
} finally {
  if (clientAuth.currentUser) await deleteUser(clientAuth.currentUser);
  await deleteAdminApp(adminApp);
  await deleteClientApp(clientApp);
}
