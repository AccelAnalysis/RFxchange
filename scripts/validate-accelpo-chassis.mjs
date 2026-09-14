import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const appRoot = resolve(root, "apps/accelpo");

const read = (name) => readFile(resolve(appRoot, name), "utf8");
const files = [
  "index.html",
  "app.js",
  "styles.css",
  "manifest.webmanifest",
  "icon.svg",
  "sw.js",
  "src/chassis/route-registry.js",
  "src/chassis/ports.ts",
  "src/chassis/registry.ts",
];

for (const file of files) await read(file);

const [index, app, styles, manifestText, worker, routes, ports, registry] = await Promise.all([
  read("index.html"),
  read("app.js"),
  read("styles.css"),
  read("manifest.webmanifest"),
  read("sw.js"),
  read("src/chassis/route-registry.js"),
  read("src/chassis/ports.ts"),
  read("src/chassis/registry.ts"),
]);
const manifest = JSON.parse(manifestText);

assert.equal(manifest.name, "AccelPO");
assert.equal(manifest.short_name, "AccelPO");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.scope, "./");
assert.equal(manifest.start_url, "./#home");
assert.match(index, /name="viewport"/);
assert.match(index, /rel="manifest"/);
assert.match(index, /type="module"/);

for (const route of ["home", "purchases", "new", "tasks", "organization", "purchaseDetail"]) {
  assert.match(routes, new RegExp(`\\b${route}\\b`));
}
for (const connectionPoint of [
  "IdentityContext",
  "RouteSurface",
  "CommandPort",
  "QueryProjection",
  "PolicyResolver",
  "TaskNotification",
  "FileEvidence",
  "RFxBridge",
  "MarketingEvent",
  "EntitlementBilling",
]) {
  assert.match(ports, new RegExp(`\\b${connectionPoint}\\b`));
  assert.match(registry, new RegExp(`\\b${connectionPoint}\\b`));
}

for (const copy of ["Home", "Purchases", "New purchase", "Tasks", "Organization", "What do you need?"]) {
  assert.match(app, new RegExp(copy.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")));
}
for (const accessibilityContract of [
  "aria-label=\"Primary navigation\"",
  "role=\"dialog\"",
  "aria-modal=\"true\"",
  "button:focus-visible",
  "prefers-reduced-motion",
]) {
  assert.match(accessibilityContract.includes("button") || accessibilityContract.includes("motion") ? `${app}\n${styles}` : app, new RegExp(accessibilityContract));
}

for (const internalTerm of [
  "CP-01",
  "CP-02",
  "CP-03",
  "CP-04",
  "QueryProjection",
  "PolicyResolver",
  "TaskNotification",
  "FileEvidence",
  "EntitlementBilling",
  "Firestore",
  "Firebase",
]) {
  assert.doesNotMatch(`${index}\n${app}`, new RegExp(internalTerm));
}

assert.match(worker, /accelpo-chassis-v2/);
assert.doesNotMatch(worker, /cache\.put\(event\.request/);
assert.match(app, /serviceWorker\.register\("\.\/sw\.js", \{ scope: "\.\/" \}\)/);
assert.doesNotMatch(app, /<canvas|mapbox|leaflet/i);

console.log(`AccelPO chassis validated (${files.length} files, ${manifest.name} standalone PWA).`);
