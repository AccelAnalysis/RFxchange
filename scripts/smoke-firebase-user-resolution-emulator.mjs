import assert from "node:assert/strict";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  inMemoryPersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { FirebaseUserIdentityResolver } from "../src/infrastructure/auth/firebase-user-resolution.ts";

assert.ok(
  process.env.FIRESTORE_EMULATOR_HOST,
  "AUTH-002 smoke test must run with the Firestore emulator.",
);

class EmulatorUserIdentityRepository {
  constructor(db) {
    this.collection = db.collection("users");
  }

  async getById(id) {
    const snapshot = await this.collection.doc(id).get();
    return snapshot.exists ? snapshot.data() : null;
  }

  async getByPrimaryEmail(primaryEmail) {
    const snapshot = await this.collection.where("primaryEmail", "==", primaryEmail).limit(1).get();
    return snapshot.empty ? null : snapshot.docs[0].data();
  }

  async getByLogin(provider, subject) {
    const snapshot = await this.collection
      .where("login.provider", "==", provider)
      .where("login.subject", "==", subject)
      .limit(1)
      .get();
    return snapshot.empty ? null : snapshot.docs[0].data();
  }

  async create(user) {
    await this.collection.doc(user.id).create(user);
  }
}

function principalFromFirebaseUser(user) {
  return Object.freeze({
    provider: "firebase",
    subject: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
  });
}

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

const adminApp = initializeAdminApp(
  { projectId },
  `auth-002-admin-${Date.now()}`,
);
const db = getFirestore(adminApp);
const users = new EmulatorUserIdentityRepository(db);
const resolver = new FirebaseUserIdentityResolver(users);

const email = `auth-002-${Date.now()}@example.test`;
const password = "RFxchange-AUTH-002-Smoke-123!";

try {
  const createdCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firstPrincipal = principalFromFirebaseUser(createdCredential.user);
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

  await signOut(auth);
  const signedInCredential = await signInWithEmailAndPassword(auth, email, password);
  const secondPrincipal = principalFromFirebaseUser(signedInCredential.user);
  const second = await resolver.resolve({
    principal: secondPrincipal,
    now: new Date().toISOString(),
  });

  assert.equal(second.kind, "existing");
  assert.equal(second.user.id, first.user.id, "Repeated sign-in must resolve the same RFxchange UserId.");

  const persisted = await users.getByLogin("firebase", second.user.login.subject);
  assert.equal(persisted?.id, first.user.id, "Resolved identity must persist in Firestore.");

  if (auth.currentUser) await deleteUser(auth.currentUser);
  console.log("AUTH-002 Firebase identity to RFxchange UserIdentity emulator smoke test passed.");
} finally {
  await db.terminate();
  await deleteAdminApp(adminApp);
  await deleteClientApp(clientApp);
}
