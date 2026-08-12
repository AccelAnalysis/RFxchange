import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (value) => fs.readFileSync(path.join(root, value), "utf8");

const requirements = JSON.parse(read("governance/four-lens-requirements.json"));
const tracker = read("docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md");
const rfxSection = tracker.match(/### 4 - RFx Core([\s\S]*?)### 5 - Trust & Engagement/)?.[1] ?? "";
const trackerEntries = [...rfxSection.matchAll(/- \[([ x])\] `([A-Z]+-\d+)`/g)].map((match) => ({
  id: match[2],
  done: match[1] === "x",
}));

assert.equal(trackerEntries.length, 41, "Canonical tracker must retain exactly 41 RFx Core Feature IDs");

const historicalDone = new Set([
  "ACQ-009",
  "DSC-004",
  "DSC-005",
  "DSC-006",
  "DSC-007",
  "DSC-008",
  "ISS-001",
  "ISS-002",
  "ISS-003",
  "ISS-005",
  "ISS-006",
  "ISS-007",
  "ISS-009",
  "ISS-011",
  "ISS-016",
  "ISS-018",
  "ISS-019",
  "ISS-020",
]);
assert.equal(historicalDone.size, 18, "Historical Wave 4 pre-authority completion exception must remain exactly 18 IDs");

const requirementByFeatureId = new Map(
  requirements.requirements
    .filter((record) => record.id.startsWith("RFX-FEATURE-"))
    .map((record) => [record.id.replace("RFX-FEATURE-", ""), record]),
);
assert.equal(requirementByFeatureId.size, 41, "Every RFx Core Feature ID must have exactly one Four-Lens requirement record");

const trackerIds = new Set(trackerEntries.map((entry) => entry.id));
assert.deepEqual([...trackerIds].sort(), [...requirementByFeatureId.keys()].sort(), "RFx tracker and Four-Lens requirement IDs have drifted");

for (const featureId of historicalDone) {
  const entry = trackerEntries.find((candidate) => candidate.id === featureId);
  assert.ok(entry?.done, `Historical pre-authority completion ${featureId} was silently revoked; use the governed correction/reconciliation process instead`);
}

for (const entry of trackerEntries.filter((candidate) => candidate.done && !historicalDone.has(candidate.id))) {
  const requirement = requirementByFeatureId.get(entry.id);
  assert.equal(
    requirement.status,
    "Verified",
    `${entry.id} cannot enter canonical RFx completion while ${requirement.id} is ${requirement.status}; implementation alone is Implemented — Not Verified`,
  );
  assert.equal(requirement.acceptance?.lane, "independent-acceptance", `${entry.id} completion lacks Lane 06 acceptance`);
  assert.equal(requirement.acceptance?.result, "Verified", `${entry.id} completion lacks a Verified independent disposition`);
  assert.equal(requirement.acceptance?.sha, requirement.implementation?.sha, `${entry.id} completion is not bound to the exact accepted implementation SHA`);
}

console.log(`Four-Lens tracker integrity validated: ${historicalDone.size} frozen pre-authority RFx completions; every later completion requires Verified.`);
