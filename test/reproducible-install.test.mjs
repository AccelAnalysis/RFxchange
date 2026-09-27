import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("trusted lockfile mirrors root and Functions dependency manifests", async () => {
  const [rootPackageSource, functionsPackageSource, lockSource, functionsLockSource] = await Promise.all([
    read("package.json"),
    read("functions/package.json"),
    read("package-lock.json"),
    read("functions/package-lock.json"),
  ]);
  const rootPackage = JSON.parse(rootPackageSource);
  const functionsPackage = JSON.parse(functionsPackageSource);
  const lock = JSON.parse(lockSource);
  const functionsLock = JSON.parse(functionsLockSource);

  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.requires, true);
  assert.ok(lock.packages?.[""], "Root workspace must be represented in package-lock.json");
  assert.ok(lock.packages?.functions, "Functions workspace must be represented in package-lock.json");

  assert.deepEqual(lock.packages[""].workspaces, rootPackage.workspaces);
  assert.deepEqual(lock.packages[""].dependencies, rootPackage.dependencies);
  assert.deepEqual(lock.packages[""].devDependencies, rootPackage.devDependencies);
  assert.deepEqual(lock.packages[""].engines, rootPackage.engines);
  assert.deepEqual(lock.packages.functions.dependencies, functionsPackage.dependencies);
  assert.deepEqual(lock.packages.functions.devDependencies, functionsPackage.devDependencies);
  assert.deepEqual(lock.packages.functions.engines, functionsPackage.engines);
  // Firebase uploads functions/ alone; the workspace-root lockfile is outside that artifact.
  assert.equal(functionsLock.lockfileVersion, 3);
  assert.deepEqual(functionsLock.packages[""].dependencies, functionsPackage.dependencies);
  assert.deepEqual(functionsLock.packages[""].devDependencies, functionsPackage.devDependencies);
  assert.deepEqual(functionsLock.packages[""].engines, functionsPackage.engines);

  // Root tooling and the standalone Functions artifact intentionally do not share an identical
  // override graph. Functions carries only overrides that apply to its production dependency tree:
  // gaxios and firebase-admin both need the patched uuid line, while OpenTelemetry is root-only CLI
  // tooling and must not be pulled into the deployed artifact.
  assert.deepEqual(functionsPackage.overrides, {
    qs: rootPackage.overrides.qs,
    gaxios: rootPackage.overrides.gaxios,
    "firebase-admin": rootPackage.overrides["firebase-admin"],
  });
  assert.equal(functionsPackage.overrides?.["@opentelemetry/core"], undefined);
  for (const dependency of ["firebase-admin", "firebase-functions", "qs"]) {
    assert.equal(functionsLock.packages[`node_modules/${dependency}`].version, lock.packages[`node_modules/${dependency}`].version, `Deployed Functions must retain the reviewed ${dependency} version.`);
  }

  assert.equal(rootPackage.devDependencies?.["firebase-tools"], "15.29.0");
  assert.equal(lock.packages[""].devDependencies?.["firebase-tools"], "15.29.0");
  assert.ok(lock.packages?.["node_modules/firebase-tools"], "Firebase CLI must resolve from the committed lockfile");
  assert.equal(lock.packages["node_modules/firebase-tools"].version, "15.29.0");
});
