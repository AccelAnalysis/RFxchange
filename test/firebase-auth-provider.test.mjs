import assert from "node:assert/strict";
import test from "node:test";
import { register } from "node:module";
register("../scripts/node-typescript-source-loader.mjs", import.meta.url);
const { firebaseWebOptionsFromEnvironment, getClientFirebaseAuth } = await import("../src/infrastructure/auth/firebase-client.ts");
test("web configuration requires explicit values and excludes server credentials", () => {
  const names = ["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_APP_ID"];
  const saved = new Map(names.map(name => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    assert.throws(() => firebaseWebOptionsFromEnvironment());
    for (const name of names) process.env[name] = " test-value ";
    const options = firebaseWebOptionsFromEnvironment();
    assert.equal(options.projectId, "test-value");
    assert.equal(options.apiKey, "test-value");
    assert.equal("credential" in options, false);
    assert.throws(() => getClientFirebaseAuth(), /server/);
  } finally {
    for (const [name,value] of saved) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  }
});
