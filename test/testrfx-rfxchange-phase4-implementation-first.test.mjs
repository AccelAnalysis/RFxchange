import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Phase 4 makes technical feasibility the implementation gate and uses progressive availability", () => {
  const authority = read("docs/program/TESTRFX_RFXCHANGE_PHASE4_IMPLEMENTATION_FIRST.md");
  assert.match(authority, /Build everything that is technically possible now/);
  assert.match(authority, /Progressive availability handles unfinished functionality/);
  assert.match(authority, /Governance prevents architectural violations; it does not prevent implementation/);
  assert.match(authority, /no longer implementation blockers by themselves/i);
  assert.match(authority, /coordination preference, not a universal implementation prerequisite/i);
  assert.match(authority, /visible but disabled/i);
  assert.match(authority, /missing future function must not block implementation/i);
});

test("implementation-first authority preserves RFxchange production truth", () => {
  const authority = read("docs/program/TESTRFX_RFXCHANGE_PHASE4_IMPLEMENTATION_FIRST.md");
  for (const required of [
    "Firebase Authentication",
    "Firestore",
    "Firebase Functions",
    "Firebase Storage",
    "Mapbox",
  ]) assert.match(authority, new RegExp(required));

  for (const prohibited of [
    "PostgreSQL",
    "PostGIS",
    "Neon",
    "MapLibre",
    "dual writes",
    "direct client writes",
  ]) assert.match(authority, new RegExp(prohibited, "i"));
});

test("Phase 2 packet decomposition no longer reinstalls activation or wave-order blocking", () => {
  const decomposition = read("docs/program/TESTRFX_RFXCHANGE_PHASE2_WORK_PACKETS.md");
  assert.match(decomposition, /does \*\*not\*\* require a separate activation event before implementation/);
  assert.match(decomposition, /work-packet status and wave order do not themselves block executable work/);
  assert.doesNotMatch(decomposition, /Activation remains behind the current RFx packet chain/);
  assert.doesNotMatch(decomposition, /After Waves A–D and current Stage 4\/5 ownership are reconciled/);
});
