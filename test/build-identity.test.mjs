import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveBuildIdentity } from "../src/infrastructure/system/build-identity.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const COMMIT_SHA = "A72FEF782B349E94DF3DD229DBD7BB766BAA1081";

test("build identity accepts only a complete Git commit SHA and normalizes it", () => {
  const identity = resolveBuildIdentity(`  ${COMMIT_SHA}  `);
  assert.deepEqual(identity, {
    commitSha: COMMIT_SHA.toLowerCase(),
    shortSha: COMMIT_SHA.slice(0, 12).toLowerCase(),
  });

  for (const invalid of [null, undefined, "", "abc123", "g".repeat(40), "a".repeat(39), "a".repeat(41)]) {
    assert.equal(resolveBuildIdentity(invalid), null);
  }
});

test("Next artifact identity and production CI are bound to the same GitHub commit", async () => {
  const [config, workflow, source] = await Promise.all([
    read("next.config.ts"),
    read(".github/workflows/ci.yml"),
    read("src/infrastructure/system/build-identity.ts"),
  ]);

  assert.match(config, /RFXCHANGE_BUILD_SHA/);
  assert.match(config, /GITHUB_SHA/);
  assert.match(config, /FULL_GIT_SHA/);
  assert.match(config, /generateBuildId: async \(\) => buildSha\.toLowerCase\(\)/);
  assert.match(source, /process\.env\.RFXCHANGE_BUILD_SHA/);
  assert.match(workflow, /- name: Production build\n        env:\n          RFXCHANGE_BUILD_SHA: \$\{\{ github\.sha \}\}\n        run: npm run build/);
  assert.match(workflow, /- name: Verify compiled build identity/);
  assert.match(workflow, /cat \.next\/BUILD_ID/);
  assert.match(workflow, /RFXCHANGE_EXPECTED_BUILD_SHA: \$\{\{ github\.sha \}\}/);
});

test("the compiled build SHA is visibly projected on public and authenticated surfaces", async () => {
  const [marketing, account] = await Promise.all([
    read("src/components/marketing/MarketingChrome.tsx"),
    read("app/organization-profile/page.tsx"),
  ]);

  assert.match(marketing, /currentBuildIdentity\(\)/);
  assert.match(marketing, /title=\{buildIdentity\.commitSha\}/);
  assert.match(marketing, /SHA \{buildIdentity\.shortSha\}/);
  assert.match(account, /currentBuildIdentity\(\)/);
  assert.match(account, /<dt>Build SHA<\/dt>/);
  assert.match(account, /buildIdentity\?\.commitSha/);
});
