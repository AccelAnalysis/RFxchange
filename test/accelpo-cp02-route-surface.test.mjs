import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("CP-02 registers the task-first AccelPO route surface", async () => {
  const registry = await read("apps/accelpo/src/chassis/registry.ts");
  const routes = await read("apps/accelpo/src/chassis/route-registry.js");
  const app = await read("apps/accelpo/app.js");

  assert.match(registry, /id: "CP-02"/);
  for (const route of ["/", "/purchases", "/new", "/tasks", "/organization", "/purchases/:caseId"]) {
    assert.match(registry, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const route of ["home", "purchases", "new", "tasks", "organization", "purchaseDetail", "registerRouteContribution"]) {
    assert.match(routes, new RegExp(`\\b${route}\\b`));
  }
  assert.match(app, /route-registry\.js/);
  assert.match(app, /serviceWorker\.register\("\.\/sw\.js", \{ scope: "\.\/" \}\)/);
});

test("CP-02 keeps install metadata and a single scoped service worker", async () => {
  const manifest = JSON.parse(await read("apps/accelpo/manifest.webmanifest"));
  const index = await read("apps/accelpo/index.html");
  const serviceWorker = await read("apps/accelpo/sw.js");

  assert.equal(manifest.name, "AccelPO");
  assert.equal(manifest.short_name, "AccelPO");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.start_url, "./#home");
  assert.equal((index.match(/rel="manifest"/g) ?? []).length, 1);
  assert.match(index, /mobile-web-app-capable/);
  assert.match(serviceWorker, /accelpo-chassis-v2/);
  assert.doesNotMatch(serviceWorker, /cache\.put\(event\.request/);
});

test("Purchase Case deep links resolve without adding another router", async () => {
  const source = await read("apps/accelpo/src/chassis/route-registry.js");
  const routes = await import(`data:text/javascript,${encodeURIComponent(source)}`);

  assert.deepEqual(routes.routeFromHash("#home"), { view: "home", caseId: null });
  assert.deepEqual(routes.routeFromHash("#purchase/chairs"), { view: "purchase-detail", caseId: "chairs" });
  assert.equal(routes.hashForRoute("purchase-detail", "office chairs"), "purchase/office%20chairs");

  routes.registerRouteContribution("P3", [{ id: "review", label: "Review", icon: "check", hash: "review", showInNavigation: false }]);
  assert.deepEqual(routes.routeFromHash("#review"), { view: "review", caseId: null });
});
