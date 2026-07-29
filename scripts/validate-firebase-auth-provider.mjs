import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(absolute);
      return entry.isFile() && /\.(ts|tsx)$/.test(entry.name) ? [absolute] : [];
    }),
  );
  return nested.flat();
}

const packageJson = JSON.parse(await read("package.json"));
const envExample = await read(".env.example");
const provider = await read("src/infrastructure/auth/provider.ts");
const browser = await read("src/infrastructure/auth/firebase-browser.ts");
const client = await read("src/infrastructure/auth/firebase-client.ts");
const server = await read("src/infrastructure/auth/firebase-server.ts");
const firebaseAdmin = await read("src/infrastructure/firebase/admin.ts");

assert.equal(packageJson.dependencies?.firebase, "12.16.0", "AUTH-001 must pin the reviewed Firebase Web SDK.");
assert.equal(
  packageJson.dependencies?.["firebase-admin"],
  "14.2.0",
  "AUTH-001 must preserve the reviewed Firebase Admin SDK version.",
);

for (const envName of [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL=http://127.0.0.1:9099",
]) {
  assert.ok(envExample.includes(envName), `AUTH-001 environment example is missing ${envName}.`);
}

assert.match(provider, /subject: string/);
assert.match(provider, /This is not an RFxchange UserId/);
assert.match(provider, /registerWithEmailAndPassword/);
assert.match(provider, /signInWithEmailAndPassword/);
assert.match(provider, /getIdToken/);

for (const required of [
  'from "firebase/auth"',
  "createUserWithEmailAndPassword",
  "onAuthStateChanged",
  "firebaseSignInWithEmailAndPassword",
  "firebaseSignOut",
]) {
  assert.ok(browser.includes(required), `Firebase browser adapter is missing ${required}.`);
}
assert.ok(!browser.includes("firebase/compat"), "AUTH-001 must use the modular Firebase Web API, not compat.");

for (const required of [
  'from "firebase/app"',
  "getAuth(",
  "connectAuthEmulator(",
  'process.env.NODE_ENV !== "production"',
  '"127.0.0.1"',
  '"localhost"',
]) {
  assert.ok(client.includes(required), `Firebase browser runtime is missing ${required}.`);
}

assert.match(server, /from "firebase-admin\/auth"/);
assert.match(server, /getAuth\(getFirebaseAdminApp\(\)\)/);
assert.match(firebaseAdmin, /getApps\(\)/);
assert.match(firebaseAdmin, /initializeApp\(\)/);

for (const forbidden of [
  "serviceAccount",
  "private_key",
  "credential.cert",
  "FIREBASE_PRIVATE_KEY",
  "createSessionCookie",
  "verifySessionCookie",
  "verifyIdToken",
]) {
  assert.ok(
    ![browser, client, server, firebaseAdmin].some((source) => source.includes(forbidden)),
    `AUTH-001 must not introduce secret material or AUTH-003 session behavior: ${forbidden}`,
  );
}

for (const file of await sourceFiles(path.join(root, "src/domain"))) {
  const source = await readFile(file, "utf8");
  assert.ok(
    !source.includes("firebase/") && !source.includes("firebase-admin"),
    `Domain source must remain Firebase-independent: ${path.relative(root, file)}`,
  );
}

console.log("AUTH-001 Firebase Authentication provider integration validated.");
