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
  assert.deepEqual(functionsPackage.overrides, rootPackage.overrides);
  for (const dependency of ["firebase-admin", "firebase-functions", "qs"]) {
    assert.equal(functionsLock.packages[`node_modules/${dependency}`].version, lock.packages[`node_modules/${dependency}`].version, `Deployed Functions must retain the reviewed ${dependency} version.`);
  }

  assert.equal(rootPackage.devDependencies?.["firebase-tools"], "15.29.0");
  assert.equal(lock.packages[""].devDependencies?.["firebase-tools"], "15.29.0");
  assert.ok(lock.packages?.["node_modules/firebase-tools"], "Firebase CLI must resolve from the committed lockfile");
  assert.equal(lock.packages["node_modules/firebase-tools"].version, "15.29.0");
});

test("production CI keeps core checks mandatory while configured-browser evidence remains diagnostic", async () => {
  const workflow = await read(".github/workflows/ci.yml");

  assert.match(workflow, /permissions:\n  contents: read\n/);
  assert.match(workflow, /- name: Install dependencies\n        run: npm ci\n/);
  assert.match(workflow, /run: \.\/node_modules\/\.bin\/firebase emulators:exec/);
  assert.doesNotMatch(workflow, /npm install/);
  assert.doesNotMatch(workflow, /\bnpx\b[^\n]*firebase-tools/);
  assert.doesNotMatch(workflow, /firebase-tools@/);
  assert.doesNotMatch(workflow, /contents: write/);
  assert.match(
    workflow,
    /- name: Build exact pre-gate baseline\n        id: configured_browser_baseline\n        continue-on-error: true\n/,
    "The browser-comparison baseline must remain diagnostic rather than a universal completion gate.",
  );
  assert.match(
    workflow,
    /- name: Configured browser shell, accessibility and transition acceptance\n        if: \$\{\{ steps\.configured_browser_baseline\.outcome == 'success' \}\}\n        id: configured_browser_acceptance\n        continue-on-error: true\n/,
    "Configured-browser acceptance must remain diagnostic rather than a universal completion gate.",
  );
  assert.equal(
    workflow.match(/uses: actions\/upload-artifact@v4/g)?.length ?? 0,
    1,
    "Only the bounded participant-shell diagnostic artifact may be exported.",
  );
  assert.match(workflow, /if: \$\{\{ steps\.configured_browser_acceptance\.outcome == 'success' \}\}/);
  assert.match(workflow, /name: exchange-shell-transition-evidence-\$\{\{ steps\.build_identity\.outputs\.sha \}\}/);
  assert.match(workflow, /path: artifacts\/exchange-shell-transition-evidence\.json/);
  assert.match(workflow, /if-no-files-found: error/);
  assert.doesNotMatch(workflow, /Commit trusted dependency lockfile/);
  assert.doesNotMatch(workflow, /Commit locked Firebase CLI dependency/);
  assert.doesNotMatch(workflow, /github\.head_ref/);
});
