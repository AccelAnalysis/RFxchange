import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (value) => fs.readFileSync(path.join(root, value), "utf8");
const exists = (value) => fs.existsSync(path.join(root, value));
const json = (value) => JSON.parse(read(value));
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

const requiredDocuments = [
  "docs/program/FOUR_LENS_PROGRAM_AUTHORITY.md",
  "docs/program/MOBILE_EXCHANGE_STAGES_3_6_AUTHORITY.md",
  "docs/program/FOUR_LENS_EXPERIENCE_LEDGER.md",
  "docs/program/PARALLEL_DELIVERY_MATRIX.md",
  "docs/program/SHARED_EXCHANGE_CONTRACTS.md",
  "docs/program/INDEPENDENT_ACCEPTANCE_PROTOCOL.md",
  "docs/program/CHAT_LANE_CHARTERS.md",
  "docs/program/SHARED_EXPERIENCE_COMPLETION_BACKLOG.md",
  "docs/program/WAVE_4_ASSURANCE_LEDGER.md",
  "docs/program/INTELLIGENCE_PROGRAM_ROADMAP.md",
  "docs/program/RESOURCES_REFERRALS_COMPLETION_INVENTORY.md",
  "docs/program/evidence/README.md",
  "docs/program/FOUR_LENS_BOOTSTRAP_RECOVERY.md",
  "governance/four-lens-requirements.json",
  "governance/four-lens-workstreams.json",
];
for (const file of requiredDocuments) assert.ok(exists(file), `Missing Four-Lens program artifact: ${file}`);

const requirements = json("governance/four-lens-requirements.json");
const workstreams = json("governance/four-lens-workstreams.json");
const authority = read("docs/program/FOUR_LENS_PROGRAM_AUTHORITY.md");
const stages36Authority = read("docs/program/MOBILE_EXCHANGE_STAGES_3_6_AUTHORITY.md");
const matrix = read("docs/program/PARALLEL_DELIVERY_MATRIX.md");
const wave4Assurance = read("docs/program/WAVE_4_ASSURANCE_LEDGER.md");
const agents = read("AGENTS.md");
const tracker = read("docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md");

const expectedStatuses = [
  "Not Started",
  "In Progress",
  "Implemented — Not Verified",
  "Verified",
  "Blocked",
  "Deferred — Explicitly Approved",
  "Not Applicable — Explicitly Approved",
];
const expectedDispositions = ["Verified", "Partial", "Not Implemented", "Blocked", "Deferred", "Decision Required"];
const expectedAcceptanceTypes = ["functional", "domain-security", "browser-visual", "responsive", "motion", "accessibility", "copy", "cross-lens", "performance", "governance"];
const expectedVerifiedEvidenceSchema = {
  entry: { type: "one declared acceptanceTypes value", manifest: "docs/program/evidence/<candidate-sha>.json" },
  manifest: "A durable Lane 06 JSON manifest binding candidate SHA, base SHA, reviewer, GitHub Actions run, environment, and a passed timestamped check plus artifacts for every claimed type.",
  coverage: "Verified requires at least one manifest-backed evidence entry for every acceptance type declared by the requirement.",
};
const expectedLanes = ["control-room", "shared-exchange", "opportunities-rfx", "intelligence", "resources", "referrals", "independent-acceptance", "integration", "capabilities"];
const expectedPacketStatuses = ["ready-after-authority-merge", "frozen-until-authority-merge", "in-progress", "active", "reconciliation-authorized", "implemented-not-verified", "acceptance-pending", "verified", "completed", "blocked", "closed"];
const shaPattern = /^[0-9a-f]{40}$/;
const identityPattern = /^github(?:-app)?:[A-Za-z0-9](?:[A-Za-z0-9_.\-\[\]]*[A-Za-z0-9_\-\[\]])?$/;
const githubReviewPattern = /^https:\/\/github\.com\/AccelAnalysis\/RFxchange\/(?:pull\/\d+(?:#.+)?|actions\/runs\/\d+(?:\/.*)?)$/;

const adoptionBaseline = {
  algorithm: "sha256-json-v1",
  recordCount: 127,
  idDigest: "7fb07cad812ddaafd3636526b434f45d993d576db4d34eb06dd9782eed534e4a",
  originalRequirementDigest: "bb80aedfecfe5fb1aaee976ee66faec3820f786e3acc0709f8286427c599761a",
  governanceMetadataDigest: "68951aa360a20eb97b308964ee83552ba2228088710064f0f854bca01b7c07d4",
};
const historicalRequirementBaseline = {
  name: "four-lens-adoption-2026-08-12",
  algorithm: "sha256-json-v1",
  recordCount: 106,
  idDigest: "ac587e5ce4fefeb6c1b28e7c0cfab89e81e0e180b8e20d9cb7e087ef03219a67",
  originalRequirementDigest: "f0a839e2fe278bb0c5a45347582b22f24e4e8c055b6201daef7441633f3e09fc",
  governanceMetadataDigest: "651d332ca89cf25e4a8faaf91114d21274920eff26c8d85e7ce4c26406408235",
};
const adoptionPacketBaseline = {
  algorithm: "sha256-json-v1",
  recordCount: 8,
  idDigest: "7053ba8345ad10c4fb7636f0333dfa228ff8d78773f1590dec260b71eefd2ab5",
  governanceDigest: "4985a28f70bdca41ebd51cd4c12438ba783e8704485d2cb3ffb14b5525f55379",
};

assert.deepEqual(requirements.statuses, expectedStatuses);
assert.equal(requirements.productAuthority, "docs/program/MOBILE_EXCHANGE_STAGES_3_6_AUTHORITY.md");
assert.equal(workstreams.productAuthority, requirements.productAuthority);
assert.deepEqual(workstreams.productOwnerIdentities, ["github:AccelAnalysis"]);
assert.deepEqual(requirements.acceptanceDispositions, expectedDispositions);
assert.deepEqual(requirements.acceptanceTypes, expectedAcceptanceTypes);
assert.deepEqual(requirements.verifiedEvidenceSchema, expectedVerifiedEvidenceSchema);
assert.equal(workstreams.schemaVersion, 2);
assert.deepEqual(workstreams.lanes.map((lane) => lane.id), expectedLanes);
assert.deepEqual(workstreams.packetStatuses, expectedPacketStatuses);
assert.ok(["authority-setup", "operational"].includes(workstreams.programPhase), `Invalid program phase ${workstreams.programPhase}`);
assert.equal(workstreams.acceptanceHardening?.plannedPacketId, "WP-ACCEPTANCE-INTEGRITY-HARDENING-01");
assert.equal(workstreams.acceptanceHardening?.blocksBootstrap, false);
assert.equal(workstreams.acceptanceHardening?.status, "planned-nonblocking");
assert.ok(exists(workstreams.acceptanceHardening?.document), "Acceptance-hardening packet document is missing");

assert.equal(requirements.adoptionBaseline?.algorithm, adoptionBaseline.algorithm);
assert.equal(requirements.adoptionBaseline?.recordCount, adoptionBaseline.recordCount);
assert.equal(requirements.adoptionBaseline?.idDigest, adoptionBaseline.idDigest);
assert.equal(requirements.adoptionBaseline?.originalRequirementDigest, adoptionBaseline.originalRequirementDigest);
assert.equal(requirements.adoptionBaseline?.governanceMetadataDigest, adoptionBaseline.governanceMetadataDigest);
assert.equal(requirements.requirements.length, adoptionBaseline.recordCount, "No adopted requirement may disappear or sit outside the immutable baseline");
const baselineRecords = requirements.requirements;
assert.equal(digest(baselineRecords.map((record) => record.id)), adoptionBaseline.idDigest, "Immutable requirement IDs were deleted, substituted, or reordered");
assert.equal(
  digest(baselineRecords.map(({ id, originalRequirement }) => ({ id, originalRequirement }))),
  adoptionBaseline.originalRequirementDigest,
  "Immutable original requirement text was deleted, substituted, reordered, or rewritten",
);
assert.equal(
  digest(baselineRecords.map(({ id, source, lane, dependentLanes, dependencies, acceptanceTypes }) => ({ id, source, lane, dependentLanes, dependencies, acceptanceTypes }))),
  adoptionBaseline.governanceMetadataDigest,
  "Immutable requirement source, ownership, dependencies, or acceptance obligations were rewritten",
);

assert.deepEqual(requirements.historicalBaselines, [historicalRequirementBaseline]);
const originalRecords = requirements.requirements.slice(0, historicalRequirementBaseline.recordCount);
assert.equal(digest(originalRecords.map((record) => record.id)), historicalRequirementBaseline.idDigest, "Original 106 requirement IDs changed");
assert.equal(digest(originalRecords.map(({ id, originalRequirement }) => ({ id, originalRequirement }))), historicalRequirementBaseline.originalRequirementDigest, "Original 106 requirement text changed");
assert.equal(
  digest(originalRecords.map(({ id, source, lane, dependentLanes, dependencies, acceptanceTypes }) => ({ id, source, lane, dependentLanes, dependencies, acceptanceTypes }))),
  historicalRequirementBaseline.governanceMetadataDigest,
  "Original 106 requirement governance metadata changed",
);

assert.equal(workstreams.adoptionPacketBaseline?.algorithm, adoptionPacketBaseline.algorithm);
assert.equal(workstreams.adoptionPacketBaseline?.recordCount, adoptionPacketBaseline.recordCount);
assert.equal(workstreams.adoptionPacketBaseline?.idDigest, adoptionPacketBaseline.idDigest);
assert.equal(workstreams.adoptionPacketBaseline?.governanceDigest, adoptionPacketBaseline.governanceDigest);
assert.ok(workstreams.workPackets.length >= adoptionPacketBaseline.recordCount, "Operational Four-Lens state must retain the eight immutable initial packets");
const baselinePackets = workstreams.workPackets.slice(0, adoptionPacketBaseline.recordCount);
const packetGovernance = baselinePackets.map(({ id, lane, owner, branch, basePolicy = null, requirementIds, sources, dependencies, ownedPaths, nonOwnedPaths, acceptanceRequired, expectedOutput, stopBoundary }) => ({
  id, lane, owner, branch, basePolicy, requirementIds, sources, dependencies, ownedPaths, nonOwnedPaths, acceptanceRequired, expectedOutput, stopBoundary,
}));
assert.equal(digest(baselinePackets.map((packet) => packet.id)), adoptionPacketBaseline.idDigest, "Immutable initial packet IDs were deleted, substituted, or reordered");
assert.equal(digest(packetGovernance), adoptionPacketBaseline.governanceDigest, "Immutable initial packet ownership, dependency edges, scope, or acceptance obligations were rewritten");

assert.match(authority, /Parallelize production\. Centralize product intent\. Independently certify acceptance\./);
assert.match(authority, /No builder may certify its own work as complete/);
assert.match(authority, /Layer 1 — Bootstrap Governance/);
assert.match(authority, /Layer 2 — Acceptance Integrity Hardening/);
assert.match(agents, /FOUR_LENS_PROGRAM_AUTHORITY\.md/);
assert.match(agents, /only the Independent Acceptance lane may record `Verified`/);
assert.match(stages36Authority, /Opportunities\/RFx \| Resources \| Intelligence \| Capabilities/);
assert.match(stages36Authority, /Referrals is a governed cross-lens business function/);
assert.match(stages36Authority, /paid referral fees, live financial obligations, and payout management are not authorized/);
assert.match(stages36Authority, /Stabilization 2C remains incomplete/);
assert.deepEqual(
  requirements.requirements.slice(106).map((record) => record.id),
  [
    "MOB36-LENS-001",
    "MOB36-MIGRATION-001",
    "MOB36-SHARED-QUERY-001",
    "MOB36-SHARED-MAP-001",
    "MOB36-SHARED-RESULT-001",
    "MOB36-SHARED-DETAIL-001",
    "MOB36-OPPORTUNITIES-001",
    "MOB36-RESOURCES-001",
    "MOB36-INTELLIGENCE-001",
    "MOB36-CAPABILITIES-001",
    "MOB36-CAPABILITIES-AMACS-001",
    "MOB36-CAPABILITIES-MATCH-001",
    "MOB36-REFERRAL-CROSS-LENS-001",
    "MOB36-REFERRAL-MENU-001",
    "MOB36-MENU-001",
    "MOB36-WORKFLOW-001",
    "MOB36-NOTIFICATIONS-001",
    "MOB36-ONBOARDING-001",
    "MOB36-COMMERCIAL-001",
    "MOB36-INTEGRATION-001",
    "MOB36-RELEASE-001",
  ],
  "Stages 3–6 successor requirements must remain append-only and ordered",
);

const identityModel = workstreams.independentAcceptanceIdentityModel;
assert.equal(identityModel?.lane, "independent-acceptance");
assert.equal(identityModel?.packetAssignment?.enabled, true);
assert.deepEqual(identityModel?.packetAssignment?.allowedKinds, ["github", "github-app"]);
assert.ok(Array.isArray(identityModel?.configuredIdentities) && identityModel.configuredIdentities.length >= 1, "At least one program-authorized independent identity is required");
const programReviewerIdentities = new Set();
for (const reviewer of identityModel.configuredIdentities) {
  assert.match(reviewer.identity, identityPattern, `Invalid independent reviewer identity ${reviewer.identity}`);
  assert.ok(["github", "github-app"].includes(reviewer.kind), `Invalid independent reviewer kind ${reviewer.kind}`);
  assert.equal(reviewer.status, "active", `${reviewer.identity} is not active`);
  assert.equal(reviewer.authorization, "program", `${reviewer.identity} is not program-authorized`);
  assert.ok(!programReviewerIdentities.has(reviewer.identity), `Duplicate configured reviewer ${reviewer.identity}`);
  programReviewerIdentities.add(reviewer.identity);
}
assert.ok(programReviewerIdentities.has("github-app:chatgpt-codex-connector[bot]"), "Existing Codex GitHub App authority must remain supported");

const requirementById = new Map();
for (const requirement of requirements.requirements) {
  assert.match(requirement.id, /^[A-Z][A-Z0-9-]+$/, `Invalid requirement ID: ${requirement.id}`);
  assert.ok(!requirementById.has(requirement.id), `Duplicate requirement ID: ${requirement.id}`);
  requirementById.set(requirement.id, requirement);
  assert.ok(requirement.originalRequirement?.trim(), `${requirement.id} has no original requirement`);
  assert.ok(requirement.source?.trim(), `${requirement.id} has no source`);
  if (requirement.source.startsWith("docs/")) assert.ok(exists(requirement.source.split("#", 1)[0]), `${requirement.id} source does not exist`);
  assert.ok(expectedLanes.slice(1).includes(requirement.lane), `${requirement.id} has unknown lane ${requirement.lane}`);
  assert.ok(Array.isArray(requirement.dependentLanes), `${requirement.id} dependentLanes must be an array`);
  assert.ok(Array.isArray(requirement.dependencies), `${requirement.id} dependencies must be an array`);
  assert.ok(Array.isArray(requirement.acceptanceTypes) && requirement.acceptanceTypes.length > 0, `${requirement.id} needs acceptance types`);
  for (const type of requirement.acceptanceTypes) assert.ok(expectedAcceptanceTypes.includes(type), `${requirement.id} has unknown acceptance type ${type}`);
  assert.ok(expectedStatuses.includes(requirement.status), `${requirement.id} has invalid status ${requirement.status}`);
  assert.ok(requirement.implementation && Object.hasOwn(requirement.implementation, "actor") && Object.hasOwn(requirement.implementation, "pr") && Object.hasOwn(requirement.implementation, "sha"), `${requirement.id} needs implementation identity fields`);
  assert.ok(requirement.acceptance && Object.hasOwn(requirement.acceptance, "lane") && Object.hasOwn(requirement.acceptance, "reviewer") && Object.hasOwn(requirement.acceptance, "sha") && Object.hasOwn(requirement.acceptance, "result") && Array.isArray(requirement.acceptance.evidence), `${requirement.id} needs acceptance identity and evidence fields`);
  assert.ok(Object.hasOwn(requirement, "deferral"), `${requirement.id} needs an explicit deferral field`);

  if (requirement.implementation.actor !== null) assert.match(requirement.implementation.actor, identityPattern, `${requirement.id} has invalid implementation actor`);
  if (requirement.implementation.sha !== null) {
    assert.match(requirement.implementation.sha, shaPattern, `${requirement.id} implementation SHA must be exact`);
    assert.ok(requirement.implementation.actor, `${requirement.id} implementation SHA has no actor`);
  }
  if (requirement.acceptance.reviewer !== null) assert.match(requirement.acceptance.reviewer, identityPattern, `${requirement.id} has invalid acceptance reviewer`);
  if (requirement.acceptance.sha !== null) assert.match(requirement.acceptance.sha, shaPattern, `${requirement.id} acceptance SHA must be exact`);
  if (requirement.acceptance.result !== null) assert.ok(expectedDispositions.includes(requirement.acceptance.result), `${requirement.id} has invalid disposition`);
  if (["Implemented — Not Verified", "Verified"].includes(requirement.status)) assert.ok(requirement.implementation.sha && requirement.implementation.actor, `${requirement.id} claims implementation without exact actor/SHA`);
  if (requirement.acceptance.result === "Verified") assert.equal(requirement.status, "Verified", `${requirement.id} has Verified acceptance but non-Verified status`);
}

for (const requirement of requirements.requirements) {
  for (const dependency of requirement.dependencies) {
    if (/^(SHARED-|RFX-FEATURE-|RES-LENS-|INTEL-|REF-LENS-)/.test(dependency)) {
      assert.ok(requirementById.has(dependency), `${requirement.id} references missing program dependency ${dependency}`);
    }
  }
}

const requiredPacketIds = [
  "WP-CONTROL-AUTHORITY-SETUP",
  "WP-SHARED-COMPLETE-01",
  "WP-ACCEPT-W4-41-45",
  "WP-RFX-46-RECONCILE",
  "WP-ACCEPT-W4-46",
  "WP-INTEL-ROADMAP-01",
  "WP-RES-INVENTORY-01",
  "WP-REF-INVENTORY-01",
];
assert.deepEqual(
  workstreams.workPackets.slice(0, requiredPacketIds.length).map((packet) => packet.id),
  requiredPacketIds,
  "The eight immutable initial packet IDs must remain first and unchanged",
);
assert.equal(new Set(workstreams.workPackets.map((packet) => packet.id)).size, workstreams.workPackets.length, "Work-packet IDs must be unique");
const packetById = new Map(workstreams.workPackets.map((packet) => [packet.id, packet]));
const epochById = new Map();
for (const epoch of workstreams.activationEpochs ?? []) {
  assert.match(epoch.id, /^[a-z0-9][a-z0-9-]+$/, `Invalid activation epoch ${epoch.id}`);
  assert.ok(!epochById.has(epoch.id), `Duplicate activation epoch ${epoch.id}`);
  assert.match(epoch.mainBaseSha, shaPattern, `${epoch.id} has no exact main base`);
  assert.ok(Number.isInteger(epoch.controlPullRequest) && epoch.controlPullRequest > 0, `${epoch.id} has invalid Control Room PR`);
  assert.ok(Array.isArray(epoch.packetIds) && epoch.packetIds.length > 0, `${epoch.id} has no packets`);
  epochById.set(epoch.id, epoch);
}
assert.ok(epochById.has("authority-setup-2026-08-12"), "Authority setup activation epoch is missing");

const activeDependencyStatuses = new Set(["in-progress", "active", "reconciliation-authorized", "implemented-not-verified", "acceptance-pending", "verified", "completed", "closed"]);
const preActivationStatuses = new Set(["ready-after-authority-merge", "frozen-until-authority-merge"]);
for (const packet of workstreams.workPackets) {
  assert.ok(expectedLanes.includes(packet.lane), `${packet.id} has unknown lane`);
  assert.ok(expectedPacketStatuses.includes(packet.status), `${packet.id} has unknown status ${packet.status}`);
  assert.ok(packet.branch && packet.expectedOutput && packet.stopBoundary, `${packet.id} is incomplete`);
  assert.ok(Array.isArray(packet.requirementIds) && Array.isArray(packet.sources) && Array.isArray(packet.dependencies), `${packet.id} needs requirement/source/dependency arrays`);
  assert.ok(Array.isArray(packet.ownedPaths) && Array.isArray(packet.nonOwnedPaths) && Array.isArray(packet.acceptanceRequired), `${packet.id} needs ownership and acceptance arrays`);
  assert.ok(Array.isArray(packet.candidateHistory), `${packet.id} candidateHistory must be an array`);
  for (const requirementId of packet.requirementIds) assert.ok(requirementById.has(requirementId), `${packet.id} references missing requirement ${requirementId}`);

  if (packet.candidate !== null) {
    assert.match(packet.candidate.actor, identityPattern, `${packet.id} has invalid candidate actor`);
    assert.ok(Number.isInteger(packet.candidate.pr) && packet.candidate.pr > 0, `${packet.id} has invalid candidate PR`);
    if (packet.candidate.sha === "SELF") {
      assert.equal(packet.id, "WP-CONTROL-AUTHORITY-SETUP", "SELF is reserved for the pre-merge authority setup candidate");
      assert.equal(workstreams.programPhase, "authority-setup", "SELF cannot survive the authority-setup phase");
    } else {
      assert.match(packet.candidate.sha, shaPattern, `${packet.id} candidate SHA must be exact`);
    }
    if (packet.candidate.mergeSha !== null) assert.match(packet.candidate.mergeSha, shaPattern, `${packet.id} merge SHA must be exact`);
  }

  const dependencyIds = new Set();
  for (const dependency of packet.dependencies) {
    assert.ok(dependency && typeof dependency.packetId === "string" && Array.isArray(dependency.requiredStatuses) && dependency.requiredStatuses.length > 0, `${packet.id} has an incomplete dependency`);
    assert.ok(packetById.has(dependency.packetId), `${packet.id} references undeclared packet dependency ${dependency.packetId}`);
    assert.notEqual(dependency.packetId, packet.id, `${packet.id} cannot depend on itself`);
    assert.ok(!dependencyIds.has(dependency.packetId), `${packet.id} repeats dependency ${dependency.packetId}`);
    dependencyIds.add(dependency.packetId);
    for (const status of dependency.requiredStatuses) assert.ok(expectedPacketStatuses.includes(status), `${packet.id} allows unknown dependency status ${status}`);
    if (activeDependencyStatuses.has(packet.status)) {
      assert.ok(dependency.requiredStatuses.includes(packetById.get(dependency.packetId).status), `${packet.id} is ${packet.status} before ${dependency.packetId} reached ${dependency.requiredStatuses.join(" or ")}`);
    }
  }

  if (preActivationStatuses.has(packet.status)) {
    assert.equal(packet.exactBaseSha, null, `${packet.id} must not invent an exact base before activation`);
    assert.equal(packet.activationEpochId, null, `${packet.id} must not claim an activation epoch before activation`);
    assert.ok(packet.basePolicy, `${packet.id} needs a pre-activation base policy`);
  } else {
    assert.match(packet.exactBaseSha, shaPattern, `${packet.id} ${packet.status} state requires an exact base`);
    assert.ok(packet.activationEpochId && epochById.has(packet.activationEpochId), `${packet.id} ${packet.status} state requires a declared activation epoch`);
    const epoch = epochById.get(packet.activationEpochId);
    assert.ok(epoch.packetIds.includes(packet.id), `${packet.id} is not named by activation epoch ${epoch.id}`);
    assert.equal(packet.exactBaseSha, epoch.mainBaseSha, `${packet.id} exact base must equal its activation epoch main base`);
  }

  if (packet.lane === "independent-acceptance" && packet.independentReviewer !== null && packet.independentReviewer !== undefined) {
    assert.match(packet.independentReviewer, identityPattern, `${packet.id} has invalid packet-assigned reviewer`);
  }
}

const visitedPackets = new Set();
const activePacketPath = new Set();
const visitPacket = (packetId) => {
  if (visitedPackets.has(packetId)) return;
  assert.ok(!activePacketPath.has(packetId), `Work-packet dependency cycle reaches ${packetId}`);
  activePacketPath.add(packetId);
  for (const dependency of packetById.get(packetId).dependencies) visitPacket(dependency.packetId);
  activePacketPath.delete(packetId);
  visitedPackets.add(packetId);
};
for (const packetId of packetById.keys()) visitPacket(packetId);

const setup = packetById.get("WP-CONTROL-AUTHORITY-SETUP");
assert.equal(setup.candidate?.pr, 172);
assert.equal(setup.candidate?.actor, "github:AccelAnalysis");
if (workstreams.programPhase === "authority-setup") {
  assert.equal(setup.status, "in-progress", "Setup must remain in-progress before authority merge and post-merge CI");
  assert.equal(setup.exactBaseSha, workstreams.adoptionBaseSha, "Setup must remain bound to the adoption main SHA");
  assert.equal(setup.candidate.sha, "SELF", "Pre-merge setup must use SELF instead of guessing its final head");
  assert.equal(setup.candidate.mergeSha, null, "Pre-merge setup cannot know its merge SHA");
  assert.equal(setup.postMergeMainSha, null, "Pre-merge setup cannot claim a post-merge main SHA");
  assert.equal(setup.postMergeRunUrl, null, "Pre-merge setup cannot claim a post-merge CI run");
  for (const packet of workstreams.workPackets.filter((candidate) => candidate.id !== setup.id)) {
    assert.ok(preActivationStatuses.has(packet.status), `${packet.id} cannot activate during authority setup`);
    assert.equal(packet.exactBaseSha, null, `${packet.id} cannot have an exact activation base during authority setup`);
  }
} else {
  assert.ok(["completed", "closed"].includes(setup.status), "Operational phase requires the authority setup packet to be completed/closed");
  assert.match(setup.candidate.sha, shaPattern, "Operational setup must record PR #172 final head");
  assert.match(setup.candidate.mergeSha, shaPattern, "Operational setup must record the authority merge SHA");
  assert.match(setup.postMergeMainSha, shaPattern, "Operational setup must record the main SHA that received post-merge CI");
  assert.match(setup.postMergeRunUrl, /^https:\/\/github\.com\/AccelAnalysis\/RFxchange\/actions\/runs\/\d+$/, "Operational setup must record the successful production-ci Actions URL");
  assert.equal(setup.postMergeMainSha, setup.candidate.mergeSha, "Authority setup post-merge CI must be tied to the authority merge SHA");

  const initialOperationalPackets = [
    "WP-SHARED-COMPLETE-01",
    "WP-ACCEPT-W4-41-45",
    "WP-INTEL-ROADMAP-01",
    "WP-RES-INVENTORY-01",
    "WP-REF-INVENTORY-01",
  ];
  for (const packetId of initialOperationalPackets) {
    const packet = packetById.get(packetId);
    assert.ok(!preActivationStatuses.has(packet.status), `${packetId} must be activated when the program becomes operational`);
    assert.match(packet.exactBaseSha, shaPattern, `${packetId} must have an exact current-main activation base`);
    assert.ok(packet.activationEpochId && packet.activationEpochId !== "authority-setup-2026-08-12", `${packetId} must use a post-authority activation epoch`);
  }
}

const reviewerAuthorizedForRequirement = (reviewer, requirementId) => {
  if (programReviewerIdentities.has(reviewer)) return true;
  return workstreams.workPackets.some((packet) =>
    packet.lane === "independent-acceptance" &&
    packet.independentReviewer === reviewer &&
    packet.requirementIds.includes(requirementId)
  );
};

const trackerRfxSection = tracker.match(/### 4 - RFx Core([\s\S]*?)### 5 - Trust & Engagement/)?.[1] ?? "";
const trackerRfxIds = [...trackerRfxSection.matchAll(/- \[[ x]\] `([A-Z]+-\d+)`/g)].map((match) => match[1]);
const programRfxIds = requirements.requirements.filter((requirement) => requirement.id.startsWith("RFX-FEATURE-")).map((requirement) => requirement.id.replace("RFX-FEATURE-", ""));
assert.equal(trackerRfxIds.length, 41, "Canonical tracker must retain 41 Wave 4 RFx Core IDs");
assert.deepEqual([...programRfxIds].sort(), [...trackerRfxIds].sort(), "Program RFx requirements must cover each tracker RFx ID exactly once");

const checklist = [...tracker.matchAll(/^- \[([ x])\] `([A-Z]+-\d+)`/gm)];
const trackerDone = checklist.filter((match) => match[1] === "x").length;
const trackerNotStarted = checklist.length - trackerDone;
const trackerStatusById = new Map(checklist.map((match) => [match[2], match[1] === "x" ? "Done" : "Not Started"]));
const trackerRfxDone = [...trackerRfxSection.matchAll(/- \[x\] `/g)].length;
const progress = tracker.match(/\*\*(\d+) total · (\d+) Done · (\d+) Not Started\*\*/);
assert.ok(progress, "Tracker progress line is missing");
assert.deepEqual([Number(progress[1]), Number(progress[2]), Number(progress[3])], [checklist.length, trackerDone, trackerNotStarted], "Tracker progress arithmetic is stale");
assert.match(tracker, new RegExp(`4 - RFx Core: \\*\\*${trackerRfxDone}\\/${trackerRfxIds.length}\\*\\*`), "Tracker RFx progress is stale");
if (workstreams.programPhase === "authority-setup") {
  assert.equal(trackerDone, requirements.historicalAdoption.tracker.done, "Governance bootstrap may not change canonical Feature-ID completion");
  assert.equal(trackerRfxDone, requirements.historicalAdoption.tracker.rfxDone, "Governance bootstrap may not change RFx Core completion");
}

const visitedRequirements = new Set();
const activeRequirementPath = new Set();
const visitRequirement = (requirementId) => {
  if (visitedRequirements.has(requirementId)) return;
  assert.ok(!activeRequirementPath.has(requirementId), `Requirement dependency cycle reaches ${requirementId}`);
  activeRequirementPath.add(requirementId);
  for (const dependency of requirementById.get(requirementId).dependencies) if (requirementById.has(dependency)) visitRequirement(dependency);
  activeRequirementPath.delete(requirementId);
  visitedRequirements.add(requirementId);
};
for (const requirementId of requirementById.keys()) visitRequirement(requirementId);

for (const requirement of requirements.requirements.filter((record) => record.status === "Verified")) {
  assert.equal(requirement.acceptance.result, "Verified", `${requirement.id} is Verified without a Verified disposition`);
  assert.equal(requirement.acceptance.lane, "independent-acceptance", `${requirement.id} was not accepted by Lane 06`);
  assert.match(requirement.acceptance.reviewer, identityPattern, `${requirement.id} has no valid independent reviewer`);
  assert.notEqual(requirement.acceptance.reviewer, requirement.implementation.actor, `${requirement.id} was self-certified by its implementation actor`);
  assert.ok(reviewerAuthorizedForRequirement(requirement.acceptance.reviewer, requirement.id), `${requirement.id} reviewer ${requirement.acceptance.reviewer} was not explicitly authorized`);
  assert.equal(requirement.acceptance.sha, requirement.implementation.sha, `${requirement.id} acceptance does not bind the exact implementation SHA`);
  assert.match(requirement.acceptance.reviewUrl, githubReviewPattern, `${requirement.id} has no exact GitHub independent-review signal`);
  assert.ok(requirement.acceptance.evidence.length > 0, `${requirement.id} is Verified without evidence`);

  const evidenceTypes = new Set();
  const seenManifests = new Map();
  for (const evidence of requirement.acceptance.evidence) {
    assert.ok(evidence && typeof evidence === "object" && !Array.isArray(evidence), `${requirement.id} evidence must be structured`);
    assert.ok(requirement.acceptanceTypes.includes(evidence.type), `${requirement.id} evidence has undeclared type ${evidence.type}`);
    assert.equal(evidence.manifest, `docs/program/evidence/${requirement.implementation.sha}.json`, `${requirement.id} evidence must reference its exact candidate manifest`);
    assert.ok(exists(evidence.manifest), `${requirement.id} manifest does not exist`);
    let manifest = seenManifests.get(evidence.manifest);
    if (!manifest) {
      manifest = json(evidence.manifest);
      seenManifests.set(evidence.manifest, manifest);
    }
    assert.equal(manifest.candidateSha, requirement.implementation.sha, `${requirement.id} manifest candidate mismatch`);
    assert.match(manifest.baseSha, shaPattern, `${requirement.id} manifest lacks an exact base`);
    assert.equal(manifest.producer?.lane, "independent-acceptance", `${requirement.id} manifest is not produced by Lane 06`);
    assert.equal(manifest.producer?.reviewer, requirement.acceptance.reviewer, `${requirement.id} manifest reviewer mismatch`);
    assert.notEqual(manifest.producer?.reviewer, requirement.implementation.actor, `${requirement.id} manifest is self-produced by the implementation actor`);
    assert.match(manifest.runUrl, /^https:\/\/github\.com\/AccelAnalysis\/RFxchange\/actions\/runs\/\d+$/, `${requirement.id} manifest has no Actions run URL`);
    assert.ok(manifest.environment?.name && manifest.environment?.configurationReference, `${requirement.id} manifest has no configured environment`);
    assert.ok(Array.isArray(manifest.checks) && manifest.checks.length > 0, `${requirement.id} manifest has no checks`);
    const matchingChecks = manifest.checks.filter((check) => check.type === evidence.type);
    assert.ok(matchingChecks.length > 0, `${requirement.id} manifest has no ${evidence.type} check`);
    for (const check of matchingChecks) {
      assert.ok(check.method?.trim(), `${requirement.id} ${evidence.type} check has no method`);
      assert.equal(check.result, "passed", `${requirement.id} ${evidence.type} check did not pass`);
      assert.ok(typeof check.observedAt === "string" && !Number.isNaN(Date.parse(check.observedAt)), `${requirement.id} ${evidence.type} check has no valid timestamp`);
      assert.ok(Array.isArray(check.artifacts) && check.artifacts.length > 0, `${requirement.id} ${evidence.type} check has no artifacts`);
      for (const artifact of check.artifacts) assert.ok(/^https:\/\//.test(artifact) || exists(artifact.split("#", 1)[0]), `${requirement.id} ${evidence.type} artifact is not durable`);
    }
    evidenceTypes.add(evidence.type);
  }
  for (const type of requirement.acceptanceTypes) assert.ok(evidenceTypes.has(type), `${requirement.id} is Verified without ${type} evidence`);

  for (const dependency of requirement.dependencies) {
    if (requirementById.has(dependency)) {
      assert.ok(["Verified", "Not Applicable — Explicitly Approved"].includes(requirementById.get(dependency).status), `${requirement.id} cannot be Verified while dependency ${dependency} is ${requirementById.get(dependency).status}`);
    } else if (trackerStatusById.has(dependency)) {
      assert.equal(trackerStatusById.get(dependency), "Done", `${requirement.id} cannot be Verified while tracker dependency ${dependency} is not Done`);
    } else {
      assert.fail(`${requirement.id} cannot be Verified while external dependency ${dependency} has no governed resolved state`);
    }
  }

  const acceptancePackets = workstreams.workPackets.filter((packet) => packet.lane === "independent-acceptance" && packet.requirementIds.includes(requirement.id));
  assert.ok(acceptancePackets.some((packet) => ["verified", "completed", "closed"].includes(packet.status)), `${requirement.id} is Verified without a completed Lane 06 packet`);
}

const historicalDeferred = requirementById.get("SHARED-RESULT-001");
assert.equal(historicalDeferred.status, "Deferred — Explicitly Approved", "Historical cursor deferral must not silently change during bootstrap");
assert.deepEqual(historicalDeferred.acceptance, {
  lane: null,
  reviewer: null,
  sha: "6ad1fd0b6dfebe9d6013c4cca7901515810185ef",
  result: "Deferred",
  evidence: ["docs/architecture/POST_PR_159_PARTICIPANT_EXPERIENCE_CONVERGENCE.md#explicit-deferrals"],
});
assert.deepEqual(historicalDeferred.deferral, {
  reason: "The current Network discovery domain exposes a bounded page contract and no cursor token; the approved correction explicitly forbade invented cursor semantics.",
  missingDependency: "A separately authorized server cursor/detail contract.",
  impact: "Result exploration remains page-based and cannot yet meet the mature continuous-list target.",
  futureLane: "shared-exchange",
  futureMilestone: null,
  approvedBy: "Post-PR-#159 Experience Convergence authority",
});

for (const requirement of requirements.requirements) {
  if (requirement.status === "Deferred — Explicitly Approved" && requirement.id !== "SHARED-RESULT-001") {
    assert.equal(requirement.acceptance.result, "Deferred", `${requirement.id} defer needs Deferred disposition`);
    assert.match(requirement.deferral?.approvedBy, identityPattern, `${requirement.id} defer needs an exact independent GitHub identity`);
    assert.match(requirement.deferral?.approvalUrl, githubReviewPattern, `${requirement.id} defer needs an authenticated GitHub approval signal`);
    assert.ok(reviewerAuthorizedForRequirement(requirement.deferral.approvedBy, requirement.id), `${requirement.id} defer approver is not authorized`);
    assert.notEqual(requirement.deferral.approvedBy, requirement.implementation.actor, `${requirement.id} defer was self-approved by the implementation actor`);
    for (const field of ["reason", "missingDependency", "impact", "futureLane"]) assert.ok(requirement.deferral?.[field], `${requirement.id} defer lacks ${field}`);
  } else if (requirement.status === "Not Applicable — Explicitly Approved") {
    assert.equal(requirement.acceptance.result, null, `${requirement.id} N/A must not masquerade as Verified acceptance`);
    assert.match(requirement.deferral?.approvedBy, identityPattern, `${requirement.id} N/A needs an exact independent GitHub identity`);
    assert.match(requirement.deferral?.approvalUrl, githubReviewPattern, `${requirement.id} N/A needs an authenticated GitHub approval signal`);
    assert.ok(reviewerAuthorizedForRequirement(requirement.deferral.approvedBy, requirement.id), `${requirement.id} N/A approver is not authorized`);
    assert.notEqual(requirement.deferral.approvedBy, requirement.implementation.actor, `${requirement.id} N/A was self-approved by the implementation actor`);
    assert.ok(requirement.deferral?.reason && requirement.deferral?.impact && requirement.deferral?.futureLane, `${requirement.id} N/A needs explicit impact and future ownership`);
  } else if (requirement.id !== "SHARED-RESULT-001") {
    assert.equal(requirement.deferral, null, `${requirement.id} has deferral data without an explicit defer/N/A status`);
  }
}

for (const [label, select] of [
  ["Shared Exchange", (record) => record.lane === "shared-exchange" || record.lane === "independent-acceptance"],
  ["Opportunities/RFx", (record) => record.lane === "opportunities-rfx"],
  ["Resources", (record) => record.lane === "resources"],
  ["Intelligence", (record) => record.lane === "intelligence"],
  ["Capabilities", (record) => record.lane === "capabilities"],
  ["Referrals Cross-Lens", (record) => record.lane === "referrals"],
  ["Integration", (record) => record.lane === "integration"],
]) {
  const records = requirements.requirements.filter(select);
  const count = (statuses) => records.filter((record) => statuses.includes(record.status)).length;
  const expectedRow = [
    records.length,
    count(["Verified"]),
    count(["In Progress"]),
    count(["Implemented — Not Verified"]),
    count(["Not Started"]),
    count(["Blocked"]),
    count(["Deferred — Explicitly Approved", "Not Applicable — Explicitly Approved"]),
  ];
  const rowPattern = new RegExp(`\\| ${label.replace("/", "\\/")} \\| ${expectedRow.join(" \\| ")} \\|`);
  assert.match(matrix, rowPattern, `Delivery matrix row is stale for ${label}`);
}

for (const match of wave4Assurance.matchAll(/`(WP-[A-Z0-9-]+)`/g)) {
  assert.ok(packetById.has(match[1]), `Wave 4 assurance ledger references undeclared packet ${match[1]}`);
}

console.log(`Four-Lens governance validated deterministically: ${requirements.requirements.length} immutable requirements, ${adoptionPacketBaseline.recordCount} immutable initial packets, ${workstreams.workPackets.length} declared packets, phase ${workstreams.programPhase}, tracker ${trackerDone}/${checklist.length}, RFx ${trackerRfxDone}/${trackerRfxIds.length}.`);
