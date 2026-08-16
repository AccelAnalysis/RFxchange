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

const completionStatuses = new Set(["Implemented — Not Verified", "Verified"]);

for (const entry of trackerEntries.filter((candidate) => candidate.done && !historicalDone.has(candidate.id))) {
  const requirement = requirementByFeatureId.get(entry.id);
  assert.ok(
    completionStatuses.has(requirement.status),
    `${entry.id} cannot enter canonical RFx completion while ${requirement.id} is ${requirement.status}; completion requires an implemented terminal state under the Four-Lens Completion Governance Amendment`,
  );
  assert.match(
    requirement.implementation?.sha ?? "",
    /^[0-9a-f]{40}$/,
    `${entry.id} completion lacks an exact implementation SHA`,
  );
  assert.ok(requirement.implementation?.actor, `${entry.id} completion lacks an implementation actor`);

  if (requirement.status === "Verified") {
    assert.equal(requirement.acceptance?.lane, "independent-acceptance", `${entry.id} Verified assurance lacks Lane 06 provenance`);
    assert.equal(requirement.acceptance?.result, "Verified", `${entry.id} Verified assurance lacks a Verified independent disposition`);
    assert.equal(requirement.acceptance?.sha, requirement.implementation?.sha, `${entry.id} Verified assurance is not bound to the exact implementation SHA`);
  }
}

console.log(
  `Four-Lens tracker integrity validated: ${historicalDone.size} frozen pre-authority RFx completions; later completions may be Implemented — Not Verified or optionally Verified.`,
);
