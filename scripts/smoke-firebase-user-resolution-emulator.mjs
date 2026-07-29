import assert from "node:assert/strict";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import {
  connectAuthEmulator,
  deleteUser,
  inMemoryPersistence,
  initializeAuth,
} from "firebase/auth";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { FirebaseBrowserAuthenticationProvider } from "../src/infrastructure/auth/firebase-browser.ts";
import { FirebaseUserIdentityResolver } from "../src/infrastructure/auth/firebase-user-resolution.ts";
import { FirestoreUserIdentityRepository } from "../src/infrastructure/firestore/repositories.ts";

assert.ok(
  process.env.FIRESTORE_EMULATOR_HOST,
  "AUTH-002 smoke test must run with the Firestore emulator.",
);

const projectId = "demo-rfxchange";
const clientApp = initializeClientApp(
  {
    apiKey: "demo-api-key",
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    appId: "1:123456789:web:auth-002-smoke",
  },
  `auth-002-client-${Date.now()}`,
);
const auth = initializeAuth(clientApp, { persistence: inMemoryPersistence });
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
const browser = new FirebaseBrowserAuthenticationProvider(auth);

const adminApp = initializeAdminApp(
  { projectId },
  `auth-002-admin-${Date.now()}`,
);
const users = new FirestoreUserIdentityRepository(getFirestore(adminApp));
const resolver = new FirebaseUserIdentityResolver(users);

const email = `auth-002-${Date.now()}@example.test`;
const password = "RFxchange-AUTH-002-Smoke-123!";

try {
  const firstPrincipal = await browser.registerWithEmailAndPassword(email, password);
  const first = await resolver.resolve({
    principal: firstPrincipal,
    requestedName: "AUTH 002 Smoke User",
    now: new Date().toISOString(),
  });

  assert.equal(first.kind, "created");
  assert.notEqual(first.user.id, firstPrincipal.subject, "RFxchange UserId must not equal Firebase UID.");
  assert.equal(first.user.login.provider, "firebase");
  assert.equal(first.user.login.subject, firstPrincipal.subject);
  assert.equal(first.user.primaryEmail, email);

  await browser.signOut();
  const secondPrincipal = await browser.signInWithEmailAndPassword(email, password);
  const second = await resolver.resolve({
    principal: secondPrincipal,
    now: new Date().toISOString(),
  });

  assert.equal(second.kind, "existing");
  assert.equal(second.user.id, first.user.id, "Repeated sign-in must resolve the same RFxchange UserId.");

  const persisted = await users.getByLogin("firebase", second.user.login.subject);
  assert.equal(persisted?.id, first.user.id, "Resolved identity must persist through the Firestore repository.");

  if (auth.currentUser) await deleteUser(auth.currentUser);
  console.log("AUTH-002 Firebase identity to RFxchange UserIdentity emulator smoke test passed.");
} finally {
  await deleteAdminApp(adminApp);
  await deleteClientApp(clientApp);
}
