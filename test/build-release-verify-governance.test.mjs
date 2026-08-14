import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const authority = read("docs/program/FOUR_LENS_PROGRAM_AUTHORITY.md");
const amendment = read("docs/program/BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md");
const protocol = read("docs/program/INDEPENDENT_ACCEPTANCE_PROTOCOL.md");
const matrix = read("docs/program/PARALLEL_DELIVERY_MATRIX.md");
const agents = read("AGENTS.md");

const universalMergeGatePattern = /Exact-head review remains a real merge gate/;

test("Build Release Verify separates integration, release and certification", () => {
  assert.match(amendment, /Build → Release → Verify/);
  assert.match(amendment, /Neither merge nor production deployment implies `Verified`/);
  assert.match(amendment, /independent GitHub review is \*\*not a universal default pre-merge requirement\*\*/);
  assert.match(amendment, /Reviewer capacity therefore blocks \*\*certification\*\*, not ordinary development by default/);
  assert.match(amendment, /Standard/);
  assert.match(amendment, /Elevated/);
  assert.match(amendment, /Critical/);
});

test("Four-Lens authority no longer reinstates universal independent-review merge blocking", () => {
  assert.match(authority, /BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT\.md/);
  assert.match(authority, /Independent exact-head review is no longer a universal default merge gate/);
  assert.doesNotMatch(authority, universalMergeGatePattern);
  assert.match(authority, /Only `Verified` satisfies experience completion/);
  assert.match(authority, /No builder may certify its own work as complete/);
});

test("Independent Acceptance remains the exclusive Verified path", () => {
  assert.match(protocol, /A candidate does not need to remain unmerged merely to become eligible for Lane 06 audit/);
  assert.match(protocol, /The acceptance signal required for `Verified` must be authored in GitHub by the exact configured or packet-assigned identity/);
  assert.match(protocol, /reviewer must differ from the implementation actor/);
  assert.match(protocol, /Merge and production release do not promote the tracker by themselves/);
});

test("repository operating instructions require exact-head safety evidence without universal review blocking", () => {
  assert.match(agents, /governing delivery model is \*\*Build → Release → Verify\*\*/);
  assert.match(agents, /independent review is not a universal pre-merge requirement/);
  assert.match(agents, /Production CI must pass on the exact candidate head before ordinary merge and again on merged `main`/);
  assert.match(agents, /only the Independent Acceptance lane may record `Verified`/);
});

test("delivery matrix treats reviewer scarcity as certification debt", () => {
  assert.match(matrix, /reviewer constraint blocks \*\*new `Verified` certification\*\*/);
  assert.match(matrix, /does not, by itself, freeze ordinary safe integration\/release/);
  assert.match(matrix, /pre-amendment packet explicitly forbids merge before independent acceptance/);
});
