import assert from 'node:assert/strict';
import test from 'node:test';
import { ciScope } from '../scripts/ci-scope.mjs';
import { FIREBASE_SMOKE_SCRIPTS } from '../scripts/run-firebase-smoke.mjs';

test('ordinary unit, browser, presentation and tooling edits skip Firebase', () => {
  for (const file of ['test/auth.test.mjs', 'test/browser/mapbox.mjs', 'scripts/smoke-exchange-runtime.mjs', 'scripts/validate-internationalization.mjs', 'app/resources/page.tsx', 'src/components/map/ExchangeSpatialScene.tsx', 'docs/security.md']) {
    assert.equal(ciScope([file]).firebase, false, file);
  }
});
test('changed emulator tests select themselves without unrelated suites', () => {
  const file = 'scripts/smoke-market-profile-enrichment-emulator.mjs';
  assert.deepEqual(ciScope([file]).scripts, [file]);
});
test('domain and persistence changes follow transitive smoke imports', () => {
  for (const file of ['src/domain/market-profile/model.ts', 'src/infrastructure/firestore/market-profile.ts']) {
    const { scripts } = ciScope([file]);
    assert.ok(scripts.includes('scripts/smoke-market-profile-enrichment-emulator.mjs'));
    assert.ok(scripts.length < FIREBASE_SMOKE_SCRIPTS.length);
  }
});
test('security, dependency, workflow and unknown server changes retain full coverage', () => {
  for (const file of ['firestore.rules', 'firestore.indexes.json', 'storage.rules', 'firebase.json', 'package-lock.json', 'functions/src/a.ts', '.github/workflows/ci.yml', 'app/api/resources/route.ts', 'app/actions.ts', 'new-server-directory/action.ts', 'scripts/ci-scope.mjs']) {
    assert.deepEqual(ciScope([file]).scripts, FIREBASE_SMOKE_SCRIPTS, file);
  }
});
test('full and mixed runs cannot lose required suites', () => {
  assert.deepEqual(ciScope([], true).scripts, FIREBASE_SMOKE_SCRIPTS);
  assert.deepEqual(ciScope(['test/a.test.mjs', 'firestore.rules']).scripts, FIREBASE_SMOKE_SCRIPTS);
});
test('browser coverage follows UI and browser tests', () => {
  assert.equal(ciScope(['app/resources/page.tsx']).browser, true);
  assert.equal(ciScope(['test/browser/mapbox.mjs']).browser, true);
  assert.equal(ciScope(['test/auth.test.mjs']).browser, false);
  assert.equal(ciScope([], true).browser, true);
});
