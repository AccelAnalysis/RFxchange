import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const tracker = read("docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md");
const dependencyMap = read("docs/tracking/RFxchange_DEPENDENCY_MAP.md");
const roadmap = read("docs/slices/WAVE_3_ROADMAP.md");
const brandTracker = read("docs/tracking/RFxchange_BRAND_GATE_TRACKER.md");
const closeout = read("docs/architecture/WAVE_3_CLOSEOUT.md");
const closeoutAcceptance = read("scripts/acceptance-wave3-closeout-configured.mjs");
const referralAcceptance = read("scripts/acceptance-referral-network-configured.mjs");
const resourceAcceptance = read("scripts/acceptance-resource-network-configured.mjs");
const educationAcceptance = read("scripts/acceptance-network-education-configured.mjs");

const checked = tracker.match(/^- \[x\] `/gm) ?? [];
const unchecked = tracker.match(/^- \[ \] `/gm) ?? [];
assert.equal(checked.length, 175);
assert.equal(unchecked.length, 263);
assert.match(tracker, /438 total · 175 Done · 263 Not Started/);

const network = tracker.match(/### 3 - Network([\s\S]*?)### 4 - RFx Core/)?.[1] ?? "";
assert.equal((network.match(/^- \[x\] `/gm) ?? []).length, 38);
assert.equal((network.match(/^- \[ \] `/gm) ?? []).length, 0);
const rfxCore = tracker.match(/### 4 - RFx Core([\s\S]*?)### 5 - Trust & Engagement/)?.[1] ?? "";
assert.equal((rfxCore.match(/^- \[ \] `/gm) ?? []).length, 18);
assert.equal((rfxCore.match(/^- \[x\] `/gm) ?? []).length, 23);

for (const authority of [tracker, dependencyMap, roadmap, closeout]) {
  assert.match(authority, /Network(?: is|:) \*\*38\/38\*\*|Network \*\*38\/38\*\*|Network at 38\/38/);
}
assert.match(dependencyMap, /Slice 4\.1 implementation result/);
assert.match(dependencyMap, /`ISS-001`, `ISS-002` and `ISS-003`/);
assert.match(brandTracker, /B6b — Network Lenses \| Not Started \/ intentionally pending/);
assert.match(closeout, /all \*\*27\*\* top-level Firestore collections/);
assert.match(closeout, /PR #140 production CI run `31306043810`/);
assert.match(closeout, /zero residual Storage objects/);
assert.match(closeout, /all 41 RFx Core IDs[\s\S]*remain Not Started/);

assert.match(closeoutAcceptance, /\["inspect", "cleanup", "assert-zero"\]/);
assert.match(closeoutAcceptance, /db\.listCollections\(\)/);
assert.match(closeoutAcceptance, /name\.includes\(state\.runId\)/);
assert.match(closeoutAcceptance, /RFXCHANGE_FIREBASE_STORAGE_BUCKET/);
assert.match(referralAcceptance, /fixtureOrganizationIds/);
assert.match(referralAcceptance, /state\.externalActor\?\.organizationId/);
assert.match(resourceAcceptance, /providerStatusSnapshot\.exists/);
assert.match(resourceAcceptance, /providerServiceProfileSnapshot\.exists/);
assert.match(educationAcceptance, /preservedProviderApplication/);
assert.match(educationAcceptance, /educationCreatedApplications: 0/);

console.log("Wave 3 closeout validation passed: historical 38/38 Network evidence remains intact while current tracker arithmetic and the post-closeout Slice 4.1 boundary are reconciled.");
