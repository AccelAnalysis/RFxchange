import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("RFx responder runtime protects issuer-private evaluation data", () => {
  const result = spawnSync(process.execPath, [
    "--experimental-transform-types",
    "--experimental-loader", "./scripts/node-typescript-source-loader.mjs",
    "--test", "test/support/rfx-cycle-production-privacy.mjs",
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
