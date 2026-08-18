#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function run(args, command = process.execPath, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...extraEnv },
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run([
  "--experimental-strip-types",
  "--test",
  "test/mobile-exchange-stage3-continuity.test.mjs",
  "test/mobile-exchange-stage3-contracts.test.mjs",
  "test/mobile-exchange-stage3-map-projection.test.mjs",
  "test/mobile-exchange-stage3-spatial-scene.test.mjs",
]);

// The canonical configured harness remains the integration authority for the
// persistent shell, desktop/mobile layouts, five locales, accessibility, clean
// diagnostics, and the existing map runtime. Stage 3 adds contracts and one
// provider-neutral source; it does not create a private route or test-only shell.
const configuredCommand = [
  "node",
  "--experimental-transform-types",
  "--experimental-loader",
  "./scripts/node-typescript-source-loader.mjs",
  "scripts/run-configured-exchange-shell-acceptance.mjs",
].join(" ");

if (process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST) {
  run(configuredCommand.split(" ").slice(1));
} else {
  run([
    "emulators:exec",
    "--only",
    "auth,firestore",
    "--project",
    "demo-rfxchange",
    configuredCommand,
  ], "./node_modules/.bin/firebase", {
    RFXCHANGE_ENV: "development",
    RFXCHANGE_EXPECTED_PROJECT_ID: "demo-rfxchange",
    RFXCHANGE_ACCEPTANCE_BASE_WORKTREE: "/tmp/rfxchange-shell-base",
    RFXCHANGE_ACCEPTANCE_BASE_SHA: "7e61fd94232ad72de32f4776befdb61d9e729cf6",
    RFXCHANGE_ACCEPTANCE_CANDIDATE_SHA: process.env.RFXCHANGE_ACCEPTANCE_CANDIDATE_SHA ?? "working-tree",
    RFXCHANGE_ACCEPTANCE_OUTPUT: process.env.RFXCHANGE_ACCEPTANCE_OUTPUT ?? "/tmp/mobile-exchange-stage3-evidence.json",
    RFXCHANGE_CONFIGURED_MAP_ACCEPTANCE: process.env.RFXCHANGE_CONFIGURED_MAP_ACCEPTANCE ?? "0",
  });
}
