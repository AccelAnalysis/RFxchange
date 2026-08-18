import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const ownedRuntimeFiles = Object.freeze([
  "app/capabilities/page.tsx",
  "src/application/organizations/capabilities-exchange.ts",
  "src/application/organizations/capabilities-locale.ts",
  "src/infrastructure/organizations/capabilities-runtime.ts",
  "src/components/capabilities/CapabilitiesWorkspace.tsx",
  "src/components/capabilities/CapabilitiesWorkspace.module.css",
]);

const content = new Map(await Promise.all(ownedRuntimeFiles.map(async (file) => [file, await readFile(file, "utf8")])));
const combined = [...content.values()].join("\n");
assert.match(combined, /AMACS/);
assert.match(combined, /ExchangeSpatialScene/);
assert.match(combined, /ExchangeRoomActionController/);
assert.match(combined, /organization\.profile\.manage/);
assert.match(combined, /assistanceCandidatesAffectProjection:\s*false/);
assert.doesNotMatch(combined, /Math\.random|fake organization|sample capability|mock match/i);
assert.doesNotMatch(combined, /src\/generated\/amacs/);

const tests = spawnSync(process.execPath, [
  "--experimental-transform-types",
  "--experimental-loader", "./scripts/node-typescript-source-loader.mjs",
  "--test",
  "test/mobile-exchange-stage4-capabilities-adapter.test.mjs",
  "test/mobile-exchange-stage4-capabilities-boundary.test.mjs",
], { cwd: process.cwd(), encoding: "utf8" });
if (tests.status !== 0) {
  process.stderr.write(tests.stdout);
  process.stderr.write(tests.stderr);
  process.exit(tests.status ?? 1);
}
process.stdout.write(tests.stdout);
console.log("Stage 4 Capabilities owned-path acceptance passed.");
