#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function run(args, command = process.execPath) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run([
  "--experimental-transform-types",
  "--test",
  "test/mobile-exchange-stage4-intelligence-projection.test.mjs",
  "test/mobile-exchange-stage4-intelligence-security.test.mjs",
  "test/mobile-exchange-stage3-contracts.test.mjs",
  "test/mobile-exchange-stage3-map-projection.test.mjs",
]);
