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

test("build identity remains release-engineering data instead of participant-facing copy", async () => {
  const [marketing, account, workflow] = await Promise.all([
    read("apps/marketing/components/MarketingChrome.tsx"),
    read("app/organization-profile/page.tsx"),
    read(".github/workflows/ci.yml"),
  ]);

  assert.doesNotMatch(marketing, /currentBuildIdentity\(\)/);
  assert.doesNotMatch(marketing, /commitSha|shortSha|>SHA\s/);
  assert.doesNotMatch(account, /currentBuildIdentity\(\)/);
  assert.doesNotMatch(account, /<dt>Build SHA<\/dt>|Current release boundary|approved slices/);
  assert.doesNotMatch(workflow, /curl --fail --silent http:\/\/127\.0\.0\.1:3100\//);
  assert.doesNotMatch(workflow, /rfxchange-home\.html|>SHA \$\{RFXCHANGE_EXPECTED_BUILD_SHA/);
});
