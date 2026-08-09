import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("trusted lockfile mirrors root and Functions dependency manifests", async () => {
  const [rootPackageSource, functionsPackageSource, lockSource] = await Promise.all([
    read("package.json"),
    read("functions/package.json"),
    read("package-lock.json"),
  ]);
  const rootPackage = JSON.parse(rootPackageSource);
  const functionsPackage = JSON.parse(functionsPackageSource);
  const lock = JSON.parse(lockSource);

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

  assert.equal(rootPackage.devDependencies?.["firebase-tools"], "15.24.0");
  assert.equal(lock.packages[""].devDependencies?.["firebase-tools"], "15.24.0");
  assert.ok(lock.packages?.["node_modules/firebase-tools"], "Firebase CLI must resolve from the committed lockfile");
  assert.equal(lock.packages["node_modules/firebase-tools"].version, "15.24.0");
});

test("production CI requires immutable npm installs, locked tooling, and read-only repository authority", async () => {
  const workflow = await read(".github/workflows/ci.yml");

  assert.match(workflow, /permissions:\n  contents: read\n/);
  assert.match(workflow, /- name: Install dependencies\n        run: npm ci\n/);
  assert.match(workflow, /run: \.\/node_modules\/\.bin\/firebase emulators:exec/);
  assert.doesNotMatch(workflow, /npm install/);
  assert.doesNotMatch(workflow, /\bnpx\b[^\n]*firebase-tools/);
  assert.doesNotMatch(workflow, /firebase-tools@/);
  assert.doesNotMatch(workflow, /contents: write/);
  assert.doesNotMatch(workflow, /actions\/upload-artifact/);
  assert.doesNotMatch(workflow, /Commit trusted dependency lockfile/);
  assert.doesNotMatch(workflow, /Commit locked Firebase CLI dependency/);
  assert.doesNotMatch(workflow, /github\.head_ref/);
});
