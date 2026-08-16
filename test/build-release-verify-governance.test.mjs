import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const authority = read("docs/program/FOUR_LENS_PROGRAM_AUTHORITY.md");
const buildReleaseVerify = read("docs/program/BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md");
const completionAmendment = read("docs/program/FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md");
const protocol = read("docs/program/INDEPENDENT_ACCEPTANCE_PROTOCOL.md");
const agents = read("AGENTS.md");
const trackerIntegrity = read("scripts/validate-four-lens-tracker-integrity.mjs");

const universalMergeGatePattern = /Exact-head review remains a real merge gate/;

test("Four-Lens completion no longer requires independent verification", () => {
  assert.match(completionAmendment, /Independent verification \/ Independent Acceptance is no longer a required completion condition/);
  assert.match(completionAmendment, /`Implemented — Not Verified` is therefore a valid terminal Four-Lens implementation\/completion state/);
  assert.match(completionAmendment, /Lane 06 remains available as an optional assurance and audit lane/);
  assert.match(completionAmendment, /Lane 06 no longer owns whether ordinary Four-Lens work is complete/);
  assert.match(completionAmendment, /Independent reviewer availability is not a merge, release, or completion factor by itself/);
});

test("the completion amendment explicitly supersedes the historical certification gate", () => {
  assert.match(completionAmendment, /only `Verified` satisfies Four-Lens completion/);
  assert.match(completionAmendment, /Independent Acceptance is required before a Four-Lens requirement may be considered complete/);
  assert.match(completionAmendment, /tracker\/ledger promotion is prohibited solely because Independent Acceptance has not occurred/);
  assert.match(completionAmendment, /Historical records are preserved/);
});

test("removing mandatory independent verification does not weaken safety gates", () => {
  for (const required of [
    "authentication and authorization controls",
    "tenant isolation",
    "privacy controls",
    "payment integrity",
    "legal/policy requirements",
    "data-integrity requirements",
    "known material defect correction",
  ]) assert.match(completionAmendment, new RegExp(required.replace("/", "\\/")));
  assert.match(completionAmendment, /A green check is not permission to ignore a known material defect/);
});

test("historical Four-Lens authorities remain provenance while the completion amendment governs current completion", () => {
  assert.match(authority, /BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT\.md/);
  assert.doesNotMatch(authority, universalMergeGatePattern);
  assert.match(buildReleaseVerify, /Build → Release → Verify/);
  assert.match(protocol, /Independent Acceptance Protocol/);
  assert.match(agents, /FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT\.md/);
  assert.match(agents, /Production CI must pass on the exact candidate head before ordinary merge and again on merged `main`/);
});

test("operating instructions do not reinstall Independent Acceptance as a completion gate", () => {
  assert.match(agents, /Independent Acceptance is not required merely to check a completed item/);
  assert.match(agents, /Independent review is not a universal completion, tracker, merge, release or development prerequisite/);
  assert.match(agents, /`Implemented — Not Verified` may be a terminal completion state/);
  assert.doesNotMatch(agents, /A checked item requires implementation and independently accepted evidence/);
  assert.doesNotMatch(agents, /only the Independent Acceptance lane may record `Verified`\. No builder certifies its own feature or experience completion/);
});

test("RFx tracker completion accepts implemented terminal state without Lane 06", () => {
  assert.match(trackerIntegrity, /const completionStatuses = new Set\(\["Implemented — Not Verified", "Verified"\]\)/);
  assert.match(trackerIntegrity, /if \(requirement\.status === "Verified"\)/);
  assert.doesNotMatch(trackerIntegrity, /every later completion requires Verified/);
  assert.doesNotMatch(trackerIntegrity, /completion lacks Lane 06 acceptance/);
});

test("the streamlined program does not replace verification with another universal approval layer", () => {
  assert.match(completionAmendment, /Do not replace the removed independent-verification requirement with another universal approval layer/);
  assert.match(completionAmendment, /Use the smallest amount of governance necessary to ship the Exchange safely and truthfully/);
});
