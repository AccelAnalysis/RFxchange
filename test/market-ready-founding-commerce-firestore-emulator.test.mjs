import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const command = [
  "emulators:exec",
  "--only",
  "auth,firestore",
  "--project",
  "demo-rfxchange",
  "node scripts/validate-market-ready-founding-commerce-firestore-emulator.mjs",
];

test("MRFC direct-client commercial authority collections fail closed in Firebase emulators", { timeout: 180_000 }, () => {
  const executable = process.platform === "win32"
    ? "node_modules/.bin/firebase.cmd"
    : "./node_modules/.bin/firebase";
  const result = spawnSync(executable, command, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      RFXCHANGE_ENV: "development",
      RFXCHANGE_EXPECTED_PROJECT_ID: "demo-rfxchange",
    },
  });
  assert.equal(
    result.status,
    0,
    `MRFC emulator evidence failed.\nSTDOUT:\n${result.stdout ?? ""}\nSTDERR:\n${result.stderr ?? ""}`,
  );
  assert.match(result.stdout ?? "", /MRFC commercial Firestore direct-client denial emulator suite passed\./);
});
