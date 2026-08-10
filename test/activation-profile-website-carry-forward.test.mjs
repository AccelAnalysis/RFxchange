import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const fixturePath = fileURLToPath(
  new URL("./activation-profile-website-carry-forward.fixture.mjs", import.meta.url),
);
const loaderUrl = new URL(
  "../scripts/node-typescript-source-loader.mjs",
  import.meta.url,
).href;

test("website carry-forward executes through the activation service", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-transform-types",
      "--experimental-loader",
      loaderUrl,
      fixturePath,
    ],
    {
      encoding: "utf8",
      cwd: fileURLToPath(new URL("../", import.meta.url)),
    },
  );

  assert.equal(
    result.status,
    0,
    [result.stdout, result.stderr].filter(Boolean).join("\n"),
  );
  assert.match(result.stdout, /tests 9/);
  assert.match(result.stdout, /pass 9/);
  assert.match(result.stdout, /fail 0/);
});
