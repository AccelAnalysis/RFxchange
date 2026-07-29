import assert from "node:assert/strict";
import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  inMemoryPersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const app = initializeApp(
  {
    apiKey: "demo-api-key",
    authDomain: "demo-rfxchange.firebaseapp.com",
    projectId: "demo-rfxchange",
    appId: "1:123456789:web:auth-smoke",
  },
  `auth-smoke-${Date.now()}`,
);

const auth = initializeAuth(app, { persistence: inMemoryPersistence });
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });

const email = `auth-smoke-${Date.now()}@example.test`;
const password = "RFxchange-Auth-Smoke-123!";

try {
  const created = await createUserWithEmailAndPassword(auth, email, password);
  assert.ok(created.user.uid, "Auth emulator must assign a Firebase UID.");
  assert.equal(created.user.email, email);

  const idToken = await created.user.getIdToken();
  assert.ok(idToken.length > 0, "Auth emulator must issue an ID token.");

  const createdUid = created.user.uid;
  await signOut(auth);
  assert.equal(auth.currentUser, null, "Sign-out must clear the current Firebase principal.");

  const signedIn = await signInWithEmailAndPassword(auth, email, password);
  assert.equal(signedIn.user.uid, createdUid, "Sign-in must recover the same Firebase subject.");

  await deleteUser(signedIn.user);
  console.log("Firebase Auth emulator provider smoke test passed.");
} finally {
  await deleteApp(app);
}
