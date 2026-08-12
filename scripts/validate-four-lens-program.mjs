import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (value) => fs.readFileSync(path.join(root, value), "utf8");
const exists = (value) => fs.existsSync(path.join(root, value));

const requiredDocuments = [
  "docs/program/FOUR_LENS_PROGRAM_AUTHORITY.md",
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
  "governance/four-lens-requirements.json",
  "governance/four-lens-workstreams.json",
];
for (const file of requiredDocuments) assert.ok(exists(file), `Missing Four-Lens program artifact: ${file}`);

const requirements = JSON.parse(read("governance/four-lens-requirements.json"));
const workstreams = JSON.parse(read("governance/four-lens-workstreams.json"));
const authority = read("docs/program/FOUR_LENS_PROGRAM_AUTHORITY.md");
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
const expectedLanes = ["control-room", "shared-exchange", "opportunities-rfx", "intelligence", "resources", "referrals", "independent-acceptance", "integration"];
const expectedPacketStatuses = ["ready-after-authority-merge", "frozen-until-authority-merge", "in-progress", "active", "reconciliation-authorized", "implemented-not-verified", "acceptance-pending", "verified", "completed", "blocked", "closed"];
const adoptionBaseline = {
  algorithm: "sha256-json-v1",
  recordCount: 105,
  idDigest: "517138fc932bc8be942a56434948e35cb2139a6432ce8ce4108d46436a578506",
  originalRequirementDigest: "84821b87114b17721441933f91a2790f116570a29e696ac87a2d6d3be098d166",
  governanceMetadataDigest: "ee0c399d50da4bea28d9a457f6e913fd37c758b3f64a225f51bfaf4e6736a34e",
};
const adoptionPacketBaseline = {
  algorithm: "sha256-json-v1",
  recordCount: 8,
  idDigest: "7053ba8345ad10c4fb7636f0333dfa228ff8d78773f1590dec260b71eefd2ab5",
  governanceDigest: "4985a28f70bdca41ebd51cd4c12438ba783e8704485d2cb3ffb14b5525f55379",
};
assert.deepEqual(requirements.statuses, expectedStatuses);
assert.deepEqual(requirements.acceptanceDispositions, expectedDispositions);
assert.deepEqual(requirements.acceptanceTypes, expectedAcceptanceTypes);
assert.deepEqual(requirements.verifiedEvidenceSchema, expectedVerifiedEvidenceSchema);
assert.deepEqual(workstreams.lanes.map((lane) => lane.id), expectedLanes);
assert.deepEqual(workstreams.packetStatuses, expectedPacketStatuses);

const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
assert.equal(requirements.adoptionBaseline?.algorithm, adoptionBaseline.algorithm);
assert.equal(requirements.adoptionBaseline?.recordCount, adoptionBaseline.recordCount);
assert.equal(requirements.adoptionBaseline?.idDigest, adoptionBaseline.idDigest);
assert.equal(requirements.adoptionBaseline?.originalRequirementDigest, adoptionBaseline.originalRequirementDigest);
assert.equal(requirements.adoptionBaseline?.governanceMetadataDigest, adoptionBaseline.governanceMetadataDigest);
assert.equal(requirements.requirements.length, adoptionBaseline.recordCount, "Every adopted requirement must be included in the immutable baseline count and digests");
const baselineRecords = requirements.requirements.slice(0, adoptionBaseline.recordCount);
assert.equal(digest(baselineRecords.map((record) => record.id)), adoptionBaseline.idDigest, "Immutable adoption requirement IDs were deleted, substituted, or reordered");
assert.equal(
  digest(baselineRecords.map(({ id, originalRequirement }) => ({ id, originalRequirement }))),
  adoptionBaseline.originalRequirementDigest,
  "Immutable adoption requirement text was deleted, substituted, reordered, or rewritten",
);
assert.equal(
  digest(baselineRecords.map(({ id, source, lane, dependentLanes, dependencies, acceptanceTypes }) => ({ id, source, lane, dependentLanes, dependencies, acceptanceTypes }))),
  adoptionBaseline.governanceMetadataDigest,
  "Immutable adoption governance source, ownership, dependency, or acceptance obligations were rewritten",
);

assert.equal(workstreams.adoptionPacketBaseline?.algorithm, adoptionPacketBaseline.algorithm);
assert.equal(workstreams.adoptionPacketBaseline?.recordCount, adoptionPacketBaseline.recordCount);
assert.equal(workstreams.adoptionPacketBaseline?.idDigest, adoptionPacketBaseline.idDigest);
assert.equal(workstreams.adoptionPacketBaseline?.governanceDigest, adoptionPacketBaseline.governanceDigest);
assert.equal(workstreams.workPackets.length, adoptionPacketBaseline.recordCount, "Every adopted packet must be included in the immutable baseline count and digests");
const baselinePackets = workstreams.workPackets.slice(0, adoptionPacketBaseline.recordCount);
const packetGovernance = baselinePackets.map(({ id, lane, owner, branch, basePolicy = null, requirementIds, sources, dependencies, ownedPaths, nonOwnedPaths, acceptanceRequired, expectedOutput, stopBoundary }) => ({ id, lane, owner, branch, basePolicy, requirementIds, sources, dependencies, ownedPaths, nonOwnedPaths, acceptanceRequired, expectedOutput, stopBoundary }));
assert.equal(digest(baselinePackets.map((packet) => packet.id)), adoptionPacketBaseline.idDigest, "Immutable adoption packet IDs were deleted, substituted, or reordered");
assert.equal(digest(packetGovernance), adoptionPacketBaseline.governanceDigest, "Immutable adoption packet ownership, dependency edges, scope, or acceptance obligations were rewritten");

assert.match(authority, /Parallelize production\. Centralize product intent\. Independently certify acceptance\./);
assert.match(authority, /No builder may certify its own work as complete/);
assert.match(authority, /Build may proceed in parallel\. Merge order remains dependency-aware\. Completion remains independently certified\./);
assert.match(agents, /FOUR_LENS_PROGRAM_AUTHORITY\.md/);
assert.match(agents, /only the Independent Acceptance lane may record `Verified`/);

const allowedStatuses = new Set(expectedStatuses);
const allowedDispositions = new Set(expectedDispositions);
const allowedTypes = new Set(expectedAcceptanceTypes);
const allowedRequirementLanes = new Set(expectedLanes.slice(1));
const ids = new Set();
const shaPattern = /^[0-9a-f]{40}$/;
const actorIdentityPattern = /^(?:github|github-app):[A-Za-z0-9](?:[A-Za-z0-9-]{0,100})$/;

for (const requirement of requirements.requirements) {
  assert.match(requirement.id, /^[A-Z][A-Z0-9-]+$/, `Invalid requirement ID: ${requirement.id}`);
  assert.ok(!ids.has(requirement.id), `Duplicate requirement ID: ${requirement.id}`);
  ids.add(requirement.id);
  assert.ok(requirement.originalRequirement?.trim(), `${requirement.id} has no original requirement`);
  assert.ok(requirement.source?.trim(), `${requirement.id} has no source`);
  if (requirement.source.startsWith("docs/")) {
    const sourceFile = requirement.source.split("#", 1)[0];
    assert.ok(exists(sourceFile), `${requirement.id} source does not exist: ${sourceFile}`);
  }
  assert.ok(allowedRequirementLanes.has(requirement.lane), `${requirement.id} has unknown lane ${requirement.lane}`);
  assert.ok(Array.isArray(requirement.dependentLanes), `${requirement.id} dependentLanes must be an array`);
  assert.ok(Array.isArray(requirement.dependencies), `${requirement.id} dependencies must be an array`);
  assert.ok(Array.isArray(requirement.acceptanceTypes) && requirement.acceptanceTypes.length > 0, `${requirement.id} needs acceptance types`);
  for (const type of requirement.acceptanceTypes) assert.ok(allowedTypes.has(type), `${requirement.id} has unknown acceptance type ${type}`);
  assert.ok(allowedStatuses.has(requirement.status), `${requirement.id} has unknown status ${requirement.status}`);
  assert.ok(requirement.implementation && Object.hasOwn(requirement.implementation, "actor") && Object.hasOwn(requirement.implementation, "pr") && Object.hasOwn(requirement.implementation, "sha"), `${requirement.id} needs implementation actor and identity fields`);
  assert.ok(requirement.acceptance && Object.hasOwn(requirement.acceptance, "lane") && Object.hasOwn(requirement.acceptance, "reviewer") && Object.hasOwn(requirement.acceptance, "sha") && Object.hasOwn(requirement.acceptance, "result") && Array.isArray(requirement.acceptance.evidence), `${requirement.id} needs acceptance identity and evidence fields`);
  assert.ok(Object.hasOwn(requirement, "deferral"), `${requirement.id} needs an explicit deferral field`);
  if (requirement.implementation.sha !== null) {
    assert.match(requirement.implementation.sha, shaPattern, `${requirement.id} implementation SHA must be exact`);
    assert.ok(requirement.implementation.actor?.trim(), `${requirement.id} has implementation evidence without an actor identity`);
    assert.match(requirement.implementation.actor, actorIdentityPattern, `${requirement.id} implementation actor is not a canonical GitHub identity`);
  } else {
    assert.equal(requirement.implementation.actor, null, `${requirement.id} has an implementation actor without an implementation SHA`);
  }
  if (requirement.acceptance.sha !== null) assert.match(requirement.acceptance.sha, shaPattern, `${requirement.id} acceptance SHA must be exact`);
  if (requirement.acceptance.result !== null) assert.ok(allowedDispositions.has(requirement.acceptance.result), `${requirement.id} has invalid disposition`);

  if (requirement.status === "Verified") {
    assert.equal(requirement.acceptance.result, "Verified", `${requirement.id} is Verified without a Verified disposition`);
    assert.equal(requirement.acceptance.lane, "independent-acceptance", `${requirement.id} was not accepted by Lane 06`);
    assert.ok(requirement.acceptance.reviewer?.trim(), `${requirement.id} has no independent reviewer identity`);
    assert.match(requirement.acceptance.reviewer, actorIdentityPattern, `${requirement.id} reviewer is not a canonical GitHub identity`);
    assert.ok(requirement.implementation.actor?.trim(), `${requirement.id} has no implementation actor identity`);
    assert.notEqual(requirement.acceptance.reviewer.trim().toLowerCase(), requirement.implementation.actor.trim().toLowerCase(), `${requirement.id} was self-certified by its implementation actor`);
    assert.ok(requirement.acceptance.sha, `${requirement.id} is Verified without an exact acceptance SHA`);
    assert.equal(requirement.acceptance.sha, requirement.implementation.sha, `${requirement.id} Verified acceptance does not bind to its exact implementation SHA`);
    assert.ok(requirement.acceptance.evidence.length > 0, `${requirement.id} is Verified without evidence`);
    const evidenceTypes = new Set();
    for (const evidence of requirement.acceptance.evidence) {
      assert.ok(evidence && typeof evidence === "object" && !Array.isArray(evidence), `${requirement.id} Verified evidence must use structured entries`);
      assert.ok(requirement.acceptanceTypes.includes(evidence.type), `${requirement.id} evidence has undeclared type ${evidence.type}`);
      assert.match(evidence.manifest ?? "", /^docs\/program\/evidence\/[0-9a-f]{40}\.json$/, `${requirement.id} ${evidence.type} evidence must reference a candidate-named Lane 06 manifest`);
      assert.equal(evidence.manifest, `docs/program/evidence/${requirement.acceptance.sha}.json`, `${requirement.id} ${evidence.type} manifest filename is not the accepted candidate SHA`);
      assert.ok(exists(evidence.manifest), `${requirement.id} ${evidence.type} evidence manifest does not exist`);
      const manifest = JSON.parse(read(evidence.manifest));
      assert.equal(manifest.schemaVersion, 1, `${requirement.id} ${evidence.type} evidence manifest has an unsupported schema`);
      assert.equal(manifest.candidateSha, requirement.acceptance.sha, `${requirement.id} ${evidence.type} manifest is not bound to the accepted candidate SHA`);
      assert.match(manifest.baseSha ?? "", shaPattern, `${requirement.id} ${evidence.type} manifest has no exact base SHA`);
      assert.notEqual(manifest.baseSha, manifest.candidateSha, `${requirement.id} ${evidence.type} manifest does not distinguish merged base from candidate`);
      const assignedAcceptancePackets = workstreams.workPackets.filter((packet) => packet.lane === "independent-acceptance" && packet.requirementIds.includes(requirement.id));
      assert.ok(assignedAcceptancePackets.some((packet) => packet.exactBaseSha === manifest.baseSha), `${requirement.id} ${evidence.type} manifest base SHA does not match a declared Lane 06 packet`);
      assert.equal(manifest.producer?.lane, "independent-acceptance", `${requirement.id} ${evidence.type} manifest was not produced by Lane 06`);
      assert.equal(manifest.producer?.reviewer, requirement.acceptance.reviewer, `${requirement.id} ${evidence.type} manifest reviewer differs from the acceptance reviewer`);
      assert.notEqual(manifest.producer?.reviewer?.trim().toLowerCase(), requirement.implementation.actor.trim().toLowerCase(), `${requirement.id} ${evidence.type} manifest was produced by the implementation actor`);
      assert.match(manifest.runUrl ?? "", /^https:\/\/github\.com\/AccelAnalysis\/RFxchange\/actions\/runs\/\d+(?:\/job\/\d+)?$/, `${requirement.id} ${evidence.type} manifest has no verifiable RFxchange Actions run`);
      assert.ok(typeof manifest.environment?.name === "string" && manifest.environment.name.trim(), `${requirement.id} ${evidence.type} manifest has no environment name`);
      assert.ok(typeof manifest.environment?.configurationReference === "string" && manifest.environment.configurationReference.trim(), `${requirement.id} ${evidence.type} manifest has no environment configuration reference`);
      const configurationReference = manifest.environment.configurationReference.split("#", 1)[0];
      assert.ok(/^https:\/\//.test(manifest.environment.configurationReference) || exists(configurationReference), `${requirement.id} ${evidence.type} environment configuration is not durable`);
      assert.ok(Array.isArray(manifest.checks), `${requirement.id} ${evidence.type} manifest checks must be an array`);
      const check = manifest.checks.find((entry) => entry.type === evidence.type);
      assert.ok(check, `${requirement.id} ${evidence.type} manifest has no matching execution check`);
      assert.ok(typeof check.method === "string" && check.method.trim().length >= 8, `${requirement.id} ${evidence.type} manifest has no executed command or journey`);
      assert.equal(check.result, "passed", `${requirement.id} ${evidence.type} manifest check did not pass`);
      const observedAt = Date.parse(check.observedAt);
      assert.ok(!Number.isNaN(observedAt) && observedAt <= Date.now() + 300_000, `${requirement.id} ${evidence.type} manifest has an invalid or future observation timestamp`);
      assert.ok(Array.isArray(check.artifacts) && check.artifacts.length > 0, `${requirement.id} ${evidence.type} manifest check has no durable artifacts`);
      for (const artifact of check.artifacts) {
        assert.ok(typeof artifact === "string" && artifact.trim(), `${requirement.id} ${evidence.type} manifest has an invalid artifact reference`);
        const localArtifact = artifact.split("#", 1)[0];
        assert.ok(/^https:\/\//.test(artifact) || exists(localArtifact), `${requirement.id} ${evidence.type} manifest artifact is not durable: ${artifact}`);
      }
      evidenceTypes.add(evidence.type);
    }
    for (const type of requirement.acceptanceTypes) assert.ok(evidenceTypes.has(type), `${requirement.id} is Verified without ${type} evidence`);
  }
  if (requirement.acceptance.result === "Verified") assert.equal(requirement.status, "Verified", `${requirement.id} has Verified acceptance but non-Verified status`);
  if (["Implemented — Not Verified", "Verified"].includes(requirement.status)) {
    assert.ok(requirement.implementation.sha, `${requirement.id} claims implementation without an exact SHA`);
    assert.ok(requirement.implementation.actor?.trim(), `${requirement.id} claims implementation without an actor identity`);
  }
  if (requirement.status === "Deferred — Explicitly Approved") {
    assert.equal(requirement.acceptance.result, "Deferred", `${requirement.id} defer needs Deferred disposition`);
    for (const field of ["reason", "missingDependency", "impact", "futureLane", "approvedBy"]) {
      assert.ok(requirement.deferral?.[field], `${requirement.id} defer lacks ${field}`);
    }
  } else if (requirement.status === "Not Applicable — Explicitly Approved") {
    assert.ok(requirement.deferral?.reason && requirement.deferral?.approvedBy, `${requirement.id} N/A needs explicit approval`);
    assert.equal(requirement.deferral.approval?.lane, "independent-acceptance", `${requirement.id} N/A was not approved by Lane 06`);
    assert.equal(requirement.deferral.approval?.reviewer, requirement.deferral.approvedBy, `${requirement.id} N/A reviewer differs from approvedBy`);
    assert.match(requirement.deferral.approvedBy, actorIdentityPattern, `${requirement.id} N/A approver is not a canonical GitHub identity`);
    if (requirement.implementation.actor) assert.notEqual(requirement.deferral.approvedBy.trim().toLowerCase(), requirement.implementation.actor.trim().toLowerCase(), `${requirement.id} N/A was self-approved by its implementation actor`);
    const approvedAt = Date.parse(requirement.deferral.approval?.approvedAt);
    assert.ok(!Number.isNaN(approvedAt) && approvedAt <= Date.now() + 300_000, `${requirement.id} N/A has an invalid or future approval timestamp`);
    assert.ok(Array.isArray(requirement.deferral.approval?.evidence) && requirement.deferral.approval.evidence.length > 0, `${requirement.id} N/A has no durable approval evidence`);
    for (const approvalEvidence of requirement.deferral.approval.evidence) {
      assert.ok(typeof approvalEvidence === "string" && approvalEvidence.trim(), `${requirement.id} N/A has an invalid approval evidence reference`);
      const localApproval = approvalEvidence.split("#", 1)[0];
      assert.ok(/^https:\/\//.test(approvalEvidence) || exists(localApproval), `${requirement.id} N/A approval evidence is not durable: ${approvalEvidence}`);
    }
  } else {
    assert.equal(requirement.deferral, null, `${requirement.id} has deferral data without explicit defer/N/A status`);
  }
}

for (const requirement of requirements.requirements) {
  for (const dependency of requirement.dependencies) {
    if (/^(SHARED-|RFX-FEATURE-|RES-LENS-|INTEL-|REF-LENS-)/.test(dependency)) {
      assert.ok(ids.has(dependency), `${requirement.id} references missing program dependency ${dependency}`);
    }
  }
}

const trackerRfxSection = tracker.match(/### 4 - RFx Core([\s\S]*?)### 5 - Trust & Engagement/)?.[1] ?? "";
const trackerRfxIds = [...trackerRfxSection.matchAll(/- \[[ x]\] `([A-Z]+-\d+)`/g)].map((match) => match[1]);
const programRfxIds = requirements.requirements
  .filter((requirement) => requirement.id.startsWith("RFX-FEATURE-"))
  .map((requirement) => requirement.id.replace("RFX-FEATURE-", ""));
assert.equal(trackerRfxIds.length, 41, "Canonical tracker must retain 41 Wave 4 RFx Core IDs");
assert.deepEqual([...programRfxIds].sort(), [...trackerRfxIds].sort(), "Program RFx requirements must cover each tracker RFx ID exactly once");

const checklist = [...tracker.matchAll(/^- \[([ x])\] `([A-Z]+-\d+)`/gm)];
const trackerDone = checklist.filter((match) => match[1] === "x").length;
const trackerNotStarted = checklist.length - trackerDone;
const trackerStatusById = new Map(checklist.map((match) => [match[2], match[1] === "x" ? "Done" : "Not Started"]));
const requirementById = new Map(requirements.requirements.map((requirement) => [requirement.id, requirement]));
const visitedRequirements = new Set();
const activeRequirementPath = new Set();
const visitRequirement = (requirementId) => {
  if (visitedRequirements.has(requirementId)) return;
  assert.ok(!activeRequirementPath.has(requirementId), `Requirement dependency cycle reaches ${requirementId}`);
  activeRequirementPath.add(requirementId);
  for (const dependency of requirementById.get(requirementId).dependencies) {
    if (requirementById.has(dependency)) visitRequirement(dependency);
  }
  activeRequirementPath.delete(requirementId);
  visitedRequirements.add(requirementId);
};
for (const requirementId of requirementById.keys()) visitRequirement(requirementId);
for (const requirement of requirements.requirements.filter((record) => record.status === "Verified")) {
  for (const dependency of requirement.dependencies) {
    if (requirementById.has(dependency)) {
      assert.ok(["Verified", "Not Applicable — Explicitly Approved"].includes(requirementById.get(dependency).status), `${requirement.id} cannot be Verified while requirement dependency ${dependency} is ${requirementById.get(dependency).status}`);
    } else if (trackerStatusById.has(dependency)) {
      assert.equal(trackerStatusById.get(dependency), "Done", `${requirement.id} cannot be Verified while tracker dependency ${dependency} is not Done`);
    } else {
      assert.fail(`${requirement.id} cannot be Verified while external dependency ${dependency} has no resolved governed state`);
    }
  }
}
const progress = tracker.match(/\*\*(\d+) total · (\d+) Done · (\d+) Not Started\*\*/);
assert.ok(progress, "Tracker progress line is missing");
assert.deepEqual([Number(progress[1]), Number(progress[2]), Number(progress[3])], [checklist.length, trackerDone, trackerNotStarted], "Tracker progress arithmetic is stale");
const rfxDone = [...trackerRfxSection.matchAll(/- \[x\] `/g)].length;
assert.match(tracker, new RegExp(`4 - RFx Core: \\*\\*${rfxDone}\\/${trackerRfxIds.length}\\*\\*`), "Tracker RFx progress is stale");

const experienceDefinitions = [
  ["Shared Exchange", (record) => record.lane === "shared-exchange" || record.lane === "independent-acceptance"],
  ["Opportunities/RFx", (record) => record.lane === "opportunities-rfx"],
  ["Resources", (record) => record.lane === "resources"],
  ["Intelligence", (record) => record.lane === "intelligence"],
  ["Referrals", (record) => record.lane === "referrals"],
];
for (const [label, select] of experienceDefinitions) {
  const records = requirements.requirements.filter(select);
  const count = (status) => records.filter((record) => status.includes(record.status)).length;
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
assert.deepEqual(workstreams.workPackets.map((packet) => packet.id), requiredPacketIds);
const packetById = new Map(workstreams.workPackets.map((packet) => [packet.id, packet]));
const lifecycleDependencyStatuses = new Set(["in-progress", "active", "reconciliation-authorized", "implemented-not-verified", "acceptance-pending", "verified", "completed", "closed"]);
for (const packet of workstreams.workPackets) {
  assert.ok(expectedLanes.includes(packet.lane), `${packet.id} has unknown lane`);
  assert.ok(expectedPacketStatuses.includes(packet.status), `${packet.id} has unknown status ${packet.status}`);
  assert.ok(packet.branch && packet.status && packet.expectedOutput && packet.stopBoundary, `${packet.id} is incomplete`);
  assert.ok(Array.isArray(packet.requirementIds) && Array.isArray(packet.sources) && Array.isArray(packet.dependencies), `${packet.id} needs arrays`);
  assert.ok(Array.isArray(packet.ownedPaths) && Array.isArray(packet.nonOwnedPaths) && Array.isArray(packet.acceptanceRequired), `${packet.id} needs ownership and acceptance arrays`);
  for (const requirementId of packet.requirementIds) assert.ok(ids.has(requirementId), `${packet.id} references missing requirement ${requirementId}`);
  if (packet.status === "verified") {
    assert.equal(packet.lane, "independent-acceptance", `${packet.id} cannot claim verified outside Lane 06`);
    assert.ok(packet.requirementIds.length > 0, `${packet.id} cannot claim verified without governed requirements`);
    for (const requirementId of packet.requirementIds) assert.equal(requirementById.get(requirementId).status, "Verified", `${packet.id} claims verified while ${requirementId} is ${requirementById.get(requirementId).status}`);
  }
  const dependencyIds = new Set();
  for (const dependency of packet.dependencies) {
    assert.ok(dependency && typeof dependency.packetId === "string" && Array.isArray(dependency.requiredStatuses) && dependency.requiredStatuses.length > 0, `${packet.id} has an incomplete packet dependency`);
    assert.ok(packetById.has(dependency.packetId), `${packet.id} references undeclared packet dependency ${dependency.packetId}`);
    assert.notEqual(dependency.packetId, packet.id, `${packet.id} cannot depend on itself`);
    assert.ok(!dependencyIds.has(dependency.packetId), `${packet.id} repeats packet dependency ${dependency.packetId}`);
    dependencyIds.add(dependency.packetId);
    for (const status of dependency.requiredStatuses) assert.ok(expectedPacketStatuses.includes(status), `${packet.id} allows unknown dependency status ${status}`);
    if (lifecycleDependencyStatuses.has(packet.status)) {
      assert.ok(dependency.requiredStatuses.includes(packetById.get(dependency.packetId).status), `${packet.id} is ${packet.status} before dependency ${dependency.packetId} reached one of: ${dependency.requiredStatuses.join(", ")}`);
    }
  }
  const preActivation = ["ready-after-authority-merge", "frozen-until-authority-merge"].includes(packet.status);
  if (preActivation) {
    assert.equal(packet.exactBaseSha, null, `${packet.id} must leave its exact base unset until activation`);
    assert.ok(packet.basePolicy, `${packet.id} needs a base policy before activation`);
  } else {
    assert.match(packet.exactBaseSha, shaPattern, `${packet.id} ${packet.status} state requires an exact base SHA`);
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

for (const packetId of wave4Assurance.matchAll(/`(WP-[A-Z0-9-]+)`/g)) {
  assert.ok(packetById.has(packetId[1]), `Wave 4 assurance ledger references undeclared packet ${packetId[1]}`);
}

console.log(`Four-Lens program governance validated: ${requirements.requirements.length} immutable requirements, ${workstreams.workPackets.length} bounded work packets, and ${trackerRfxIds.length} RFx Feature IDs.`);
