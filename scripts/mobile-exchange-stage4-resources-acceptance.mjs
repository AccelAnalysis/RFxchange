import { spawnSync } from "node:child_process";

const startedAt = performance.now();
const result = spawnSync(process.execPath, [
  "--experimental-transform-types",
  "--experimental-loader",
  "./scripts/node-typescript-source-loader.mjs",
  "--test",
  "test/mobile-exchange-stage4-resources-contracts.test.mjs",
], { stdio: "inherit", env: process.env });

const elapsedMs = Math.round(performance.now() - startedAt);
console.log(JSON.stringify({ packet: "WP-MOBILE-EXCHANGE-STAGE4-RESOURCES-01", elapsedMs, status: result.status === 0 ? "passed" : "failed" }));
process.exit(result.status ?? 1);
