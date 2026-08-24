import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveBuildIdentity } from "../src/infrastructure/system/build-identity.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const COMMIT_SHA = "A72FEF782B349E94DF3DD229DBD7BB766BAA1081";
const EXACT_SOURCE_SHA_EXPRESSION = "${{ github.event.pull_request.head.sha || github.sha }}";
const VALIDATED_SOURCE_SHA_EXPRESSION = "${{ steps.build_identity.outputs.sha }}";

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

test("Next artifact identity and production CI are bound to the checked-out exact source commit", async () => {
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

  assert.ok(workflow.includes(`ref: ${EXACT_SOURCE_SHA_EXPRESSION}`));
  assert.ok(!workflow.includes("ref: ${{ github.sha }}"));
  assert.ok(!workflow.includes("github.event.pull_request.merge_commit_sha"));
  assert.ok(!workflow.includes("refs/pull/"));
  assert.ok(workflow.includes(`expected_sha="${EXACT_SOURCE_SHA_EXPRESSION}"`));
  assert.ok(workflow.includes('actual_sha="$(git rev-parse HEAD)"'));
  assert.ok(workflow.includes('if [ "$actual_sha" != "$expected_sha" ]; then'));
  assert.ok(workflow.includes('echo "sha=$actual_sha" >> "$GITHUB_OUTPUT"'));
  assert.ok(workflow.includes(`RFXCHANGE_BUILD_SHA: ${VALIDATED_SOURCE_SHA_EXPRESSION}`));
  assert.ok(workflow.includes(`RFXCHANGE_EXPECTED_BUILD_SHA: ${VALIDATED_SOURCE_SHA_EXPRESSION}`));
  assert.match(workflow, /- name: Verify compiled build identity/);
  assert.ok(workflow.includes('test "$(cat .next/BUILD_ID)" = "$RFXCHANGE_EXPECTED_BUILD_SHA"'));
});

test("build identity remains release-engineering data instead of participant-facing copy", async () => {
  const [marketing, account, workflow] = await Promise.all([
    read("src/components/marketing/MarketingChrome.tsx"),
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
