import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const parseLock = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

const [workspaceLock, functionsLock] = await Promise.all([
  parseLock("package-lock.json"),
  parseLock("functions/package-lock.json"),
]);

function packageRecord(lock, path, label) {
  const record = lock?.packages?.[path];
  assert.ok(record && typeof record === "object", `${label} is missing from ${path}.`);
  return record;
}

function dependencyParents(lock, dependencyName) {
  return Object.entries(lock.packages ?? {})
    .filter(([, record]) => record?.dependencies?.[dependencyName])
    .map(([path, record]) => Object.freeze({ path, range: record.dependencies[dependencyName] }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function versionTuple(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version ?? "");
  assert.ok(match, `Invalid package version ${String(version)}.`);
  return match.slice(1).map(Number);
}

function versionAtLeast(version, minimum) {
  const left = versionTuple(version);
  const right = versionTuple(minimum);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] > right[index]) return true;
    if (left[index] < right[index]) return false;
  }
  return true;
}

function assertKnownUuidBoundary(lock, label) {
  const uuid = packageRecord(lock, "node_modules/uuid", `${label} uuid`);
  if (versionAtLeast(uuid.version, "11.1.1")) return;

  const parents = dependencyParents(lock, "uuid").filter(({ range }) => !range.includes("14"));
  const allowedParents = new Set(["node_modules/gaxios", "node_modules/teeny-request"]);
  assert.deepEqual(
    parents.map(({ path }) => path),
    [...allowedParents].sort(),
    `${label} vulnerable uuid must remain confined to the reviewed gaxios/teeny-request multipart dependency boundary until upstream removes it.`,
  );
  assert.equal(uuid.version, "9.0.1", `${label} uuid reachability disposition must be re-reviewed when the resolved vulnerable version changes.`);
}

assertKnownUuidBoundary(workspaceLock, "workspace");
assertKnownUuidBoundary(functionsLock, "Functions production artifact");

const workspaceOtel = packageRecord(workspaceLock, "node_modules/@opentelemetry/core", "workspace @opentelemetry/core");
assert.equal(workspaceOtel.dev, true, "@opentelemetry/core residual finding must remain development-only Firebase CLI tooling.");
assert.equal(functionsLock.packages?.["node_modules/@opentelemetry/core"], undefined, "@opentelemetry/core must not enter the standalone Functions production artifact.");

const workspaceStreamJson = packageRecord(workspaceLock, "node_modules/stream-json", "workspace stream-json");
assert.equal(workspaceStreamJson.dev, true, "stream-json residual finding must remain development-only Firebase CLI tooling.");
assert.equal(functionsLock.packages?.["node_modules/stream-json"], undefined, "stream-json must not enter the standalone Functions production artifact.");

const firebaseTools = packageRecord(workspaceLock, "node_modules/firebase-tools", "workspace firebase-tools");
assert.equal(firebaseTools.dev, true, "Firebase CLI must remain a development-only dependency.");

console.log(JSON.stringify({
  status: "dependency-security-dispositions-valid",
  workspaceUuid: workspaceLock.packages["node_modules/uuid"].version,
  functionsUuid: functionsLock.packages["node_modules/uuid"].version,
  opentelemetryCore: workspaceOtel.version,
  streamJson: workspaceStreamJson.version,
  firebaseTools: firebaseTools.version,
}, null, 2));
