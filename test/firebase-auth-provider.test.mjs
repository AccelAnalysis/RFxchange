import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const provider = await readFile("src/infrastructure/auth/provider.ts", "utf8");
const browser = await readFile("src/infrastructure/auth/firebase-browser.ts", "utf8");
const client = await readFile("src/infrastructure/auth/firebase-client.ts", "utf8");
const server = await readFile("src/infrastructure/auth/firebase-server.ts", "utf8");
const firebaseAdmin = await readFile("src/infrastructure/firebase/admin.ts", "utf8");

test("AUTH-001 keeps Firebase identity separate from RFxchange UserIdentity", () => {
  assert.match(provider, /subject: string/);
  assert.match(provider, /not an RFxchange UserId/);
  assert.doesNotMatch(browser, /domain\/users/);
  assert.doesNotMatch(server, /domain\/users/);
});

test("AUTH-001 exposes browser authentication primitives behind an adapter", () => {
  assert.match(browser, /class FirebaseBrowserAuthenticationProvider/);
  assert.match(browser, /createUserWithEmailAndPassword/);
  assert.match(browser, /firebaseSignInWithEmailAndPassword/);
  assert.match(browser, /onAuthStateChanged/);
  assert.match(browser, /getIdToken/);
});

test("AUTH-001 uses modular web SDK and localhost-only emulator wiring", () => {
  assert.match(client, /from "firebase\/app"/);
  assert.match(client, /connectAuthEmulator/);
  assert.match(client, /process\.env\.NODE_ENV !== "production"/);
  assert.match(client, /127\.0\.0\.1/);
  assert.match(client, /localhost/);
  assert.doesNotMatch(client, /firebase\/compat/);
});

test("AUTH-001 shares server Firebase Admin initialization without session semantics", () => {
  assert.match(firebaseAdmin, /getApps\(\)/);
  assert.match(firebaseAdmin, /initializeApp\(\{/);
  assert.match(firebaseAdmin, /applicationDefault\(\)/);
  assert.match(firebaseAdmin, /projectId/);
  assert.match(server, /getAuth\(getFirebaseAdminApp\(\)\)/);
  assert.doesNotMatch(server, /verifyIdToken|createSessionCookie|verifySessionCookie/);
});
