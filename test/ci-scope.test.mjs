import assert from "node:assert/strict";
import test from "node:test";
import { ciScope } from "../scripts/ci-scope.mjs";

test("presentation and documentation changes skip emulators", () => {
  assert.equal(ciScope(["src/components/map/ExchangeSpatialScene.tsx", "src/components/a.css", "docs/a.md", "AGENTS.md"]).firebase, false);
});
test("server, security, dependency and test boundaries select Firebase coverage", () => {
  for (const path of ["app/api/new/route.ts", "app/actions.ts", "apps/admin/src/action.ts", "src/domain/a.ts", "src/application/a.ts", "src/infrastructure/a.ts", "src/accelpo/a.ts", "src/config/a.ts", "functions/src/a.ts", "firestore.rules", "firestore.indexes.json", "storage.rules", "firebase.json", "package-lock.json", "scripts/smoke.mjs", "test/auth.test.mjs", ".github/workflows/ci.yml", "new-server-directory/action.ts"]) {
    assert.equal(ciScope([path]).firebase, true, path);
  }
});
test("manual full runs and mixed changes retain integration coverage", () => {
  assert.equal(ciScope([], true).firebase, true);
  assert.equal(ciScope(["docs/a.md", "firestore.rules"]).firebase, true);
});
test("browser coverage follows UI runtime changes and skips documents", () => {
  assert.equal(ciScope(['src/components/map/ExchangeSpatialScene.tsx']).browser, true);
  assert.equal(ciScope(['test/browser/mapbox.mjs']).browser, true);
  assert.equal(ciScope(['docs/design.md']).browser, false);
  assert.equal(ciScope([], true).browser, true);
});
