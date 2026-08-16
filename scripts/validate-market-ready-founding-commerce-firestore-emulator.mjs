import assert from "node:assert/strict";
import { deleteApp, initializeApp } from "firebase/app";
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

const COLLECTIONS = [
  "organizationCommercialAccounts",
  "commercialFoundingCapacity",
  "commercialProviderEvents",
  "commercialSubscriptionReconciliations",
];

assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099");
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");

const projectId = "demo-rfxchange";

function client(name) {
  const app = initializeApp({
    apiKey: "demo-api-key",
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    appId: `1:123:web:${name}`,
  }, `${name}-${Date.now()}-${Math.random()}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const firestore = getFirestore(app);
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  return { app, auth, firestore };
}

async function denied(operation, label) {
  await assert.rejects(
    operation,
    (error) => error?.code === "permission-denied" || error?.code === "firestore/permission-denied",
    label,
  );
}

const anonymous = client("mrfc-anonymous");
const authenticated = client("mrfc-authenticated");

try {
  const email = `mrfc-${Date.now()}@example.test`;
  await createUserWithEmailAndPassword(authenticated.auth, email, "RFxchange-MRFC-Emulator-123!");

  for (const collection of COLLECTIONS) {
    const anonymousRef = doc(anonymous.firestore, collection, `anonymous-${collection}`);
    const authenticatedRef = doc(authenticated.firestore, collection, `authenticated-${collection}`);
    await denied(getDoc(anonymousRef), `Unauthenticated direct read must be denied for ${collection}.`);
    await denied(setDoc(anonymousRef, { schemaVersion: 1 }), `Unauthenticated direct write must be denied for ${collection}.`);
    await denied(getDoc(authenticatedRef), `Authenticated direct read must be denied for ${collection}.`);
    await denied(setDoc(authenticatedRef, { schemaVersion: 1 }), `Authenticated direct write must be denied for ${collection}.`);
  }

  console.log("MRFC commercial Firestore direct-client denial emulator suite passed.");
} finally {
  await signOut(authenticated.auth).catch(() => undefined);
  await Promise.all([deleteApp(anonymous.app), deleteApp(authenticated.app)]);
}
