import { createHash } from "node:crypto";
import fs from "node:fs";

const requirementPath = "governance/four-lens-requirements.json";
const workstreamPath = "governance/four-lens-workstreams.json";
const sidecarPath = "governance/exchange-room-phase2-activation.json";
const validatorPath = "scripts/validate-four-lens-program.mjs";
const matrixPath = "docs/program/PARALLEL_DELIVERY_MATRIX.md";
const controlPath = "docs/program/EXCHANGE_ROOM_PHASE2_CONTROL.md";

const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const successorId = "SHARED-LENS-CONTEXT-001";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function replaceOnce(text, before, after, label) {
  assert(text.includes(before), `Missing expected ${label}`);
  return text.replace(before, after);
}

// Append one immutable successor requirement while preserving the first 105 records semantically and in order.
const originalRaw = fs.readFileSync(requirementPath, "utf8");
const original = JSON.parse(originalRaw);
assert(original.requirements.length === 105, "Expected exactly 105 frozen requirements before Phase 2 successor append");
assert(!original.requirements.some((record) => record.id === successorId), `${successorId} already exists`);

const successor = {
  id: successorId,
  originalRequirement: "The permanent Opportunities/RFx, Resources, Intelligence and Referrals lenses are always visible and selectable as contexts of the same Exchange Room; each lens exposes exactly four stable action positions, and function availability is expressed only at the individual action level so a non-usable action remains normally labeled, gray/disabled and non-actionable without granting domain authority.",
  source: "docs/program/EXCHANGE_ROOM_PHASE2_CONTROL.md#authority-reconciliation--lens-container-versus-function-availability",
  lane: "shared-exchange",
  dependentLanes: ["opportunities-rfx", "resources", "intelligence", "referrals"],
  dependencies: ["SHARED-SPATIAL-001", "SHARED-ACTIONS-001"],
  acceptanceTypes: ["functional", "domain-security", "browser-visual", "responsive", "accessibility", "copy", "cross-lens"],
  status: "Not Started",
  implementation: { actor: null, pr: null, sha: null },
  acceptance: { lane: null, reviewer: null, sha: null, result: null, evidence: [] },
  deferral: null,
  clarification: "Phase 2 successor product decision for selectable lens containers. SHARED-TRUTH-001 remains immutable and separately dispositioned."
};

const next = structuredClone(original);
next.requirements.push(successor);
next.adoptionBaseline.recordCount = 106;
next.adoptionBaseline.idDigest = digest(next.requirements.map((record) => record.id));
next.adoptionBaseline.originalRequirementDigest = digest(next.requirements.map(({ id, originalRequirement }) => ({ id, originalRequirement })));
next.adoptionBaseline.governanceMetadataDigest = digest(next.requirements.map(({ id, source, lane, dependentLanes, dependencies, acceptanceTypes }) => ({ id, source, lane, dependentLanes, dependencies, acceptanceTypes })));
next.adoptionBaseline.policy = "All 106 adopted records are frozen in order. A newly authorized requirement must append while the same reviewed change advances the baseline count and digests; no appended record may exist outside the baseline.";

// Preserve existing formatting and frozen record text; append only the successor record and update baseline fields.
let requirementRaw = originalRaw;
requirementRaw = replaceOnce(requirementRaw, '"recordCount": 105', '"recordCount": 106', "requirements record count");
requirementRaw = replaceOnce(requirementRaw, original.adoptionBaseline.idDigest, next.adoptionBaseline.idDigest, "requirements id digest");
requirementRaw = replaceOnce(requirementRaw, original.adoptionBaseline.originalRequirementDigest, next.adoptionBaseline.originalRequirementDigest, "requirements text digest");
requirementRaw = replaceOnce(requirementRaw, original.adoptionBaseline.governanceMetadataDigest, next.adoptionBaseline.governanceMetadataDigest, "requirements governance digest");
requirementRaw = replaceOnce(
  requirementRaw,
  "All 105 adopted records are frozen in order. A newly authorized requirement must append while the same reviewed change advances the baseline count and digests; no appended record may exist outside the baseline.",
  next.adoptionBaseline.policy,
  "requirements baseline policy"
);
const closeMarker = "\n  ]\n}\n";
assert(requirementRaw.endsWith(closeMarker), "Unexpected requirements JSON closing format");
const successorLine = `    ${JSON.stringify(successor)}`;
requirementRaw = requirementRaw.slice(0, -closeMarker.length) + `,\n${successorLine}${closeMarker}`;
const parsedRequirementRaw = JSON.parse(requirementRaw);
assert(parsedRequirementRaw.requirements.length === 106, "Successor append failed");
assert(digest(parsedRequirementRaw.requirements.map((record) => record.id)) === next.adoptionBaseline.idDigest, "ID digest mismatch after textual append");
assert(digest(parsedRequirementRaw.requirements.map(({ id, originalRequirement }) => ({ id, originalRequirement }))) === next.adoptionBaseline.originalRequirementDigest, "Original-requirement digest mismatch after textual append");
assert(digest(parsedRequirementRaw.requirements.map(({ id, source, lane, dependentLanes, dependencies, acceptanceTypes }) => ({ id, source, lane, dependentLanes, dependencies, acceptanceTypes }))) === next.adoptionBaseline.governanceMetadataDigest, "Governance digest mismatch after textual append");
fs.writeFileSync(requirementPath, requirementRaw);

// Advance the validator's canonical immutable baseline in the same reviewed change.
let validator = fs.readFileSync(validatorPath, "utf8");
validator = replaceOnce(validator, "recordCount: 105,", "recordCount: 106,", "validator record count");
validator = replaceOnce(validator, original.adoptionBaseline.idDigest, next.adoptionBaseline.idDigest, "validator id digest");
validator = replaceOnce(validator, original.adoptionBaseline.originalRequirementDigest, next.adoptionBaseline.originalRequirementDigest, "validator text digest");
validator = replaceOnce(validator, original.adoptionBaseline.governanceMetadataDigest, next.adoptionBaseline.governanceMetadataDigest, "validator governance digest");
fs.writeFileSync(validatorPath, validator);

// Reconcile the canonical workstream ledger.
const workstreams = JSON.parse(fs.readFileSync(workstreamPath, "utf8"));
const phase2 = workstreams.workPackets.find((packet) => packet.id === "WP-EXCHANGE-ROOM-PHASE2-01");
assert(phase2, "Missing Phase 2 packet");
phase2.requirementIds = phase2.requirementIds.map((id) => id === "SHARED-TRUTH-001" ? successorId : id);
assert(phase2.requirementIds.includes(successorId), "Successor requirement not bound to Phase 2");
assert(!phase2.requirementIds.includes("SHARED-TRUTH-001"), "Historical SHARED-TRUTH-001 must not be Phase 2 acceptance identity");
const phase1Dependency = phase2.dependencies.find((dependency) => dependency.packetId === "WP-EXCHANGE-ROOM-PHASE1-01");
assert(phase1Dependency, "Missing Phase 1 dependency");
for (const status of ["completed", "closed"]) {
  if (!phase1Dependency.requiredStatuses.includes(status)) phase1Dependency.requiredStatuses.push(status);
}
phase2.ownedPaths = [
  "src/application/participant/**",
  "src/components/participant/**",
  "app/geography/canvas/**",
  "src/i18n/messages/network/**",
  "test/**",
  "scripts/**",
  "docs/program/evidence/exchange-room-phase2/**"
];
fs.writeFileSync(workstreamPath, `${JSON.stringify(workstreams, null, 2)}\n`);

// Keep the additive activation sidecar aligned with the canonical packet identity and terminal dependency states.
const sidecar = JSON.parse(fs.readFileSync(sidecarPath, "utf8"));
sidecar.workPacket.requirementIds = sidecar.workPacket.requirementIds.map((id) => id === "SHARED-TRUTH-001" ? successorId : id);
const sidecarDependency = sidecar.workPacket.dependencies.find((dependency) => dependency.packetId === "WP-EXCHANGE-ROOM-PHASE1-01");
if (sidecarDependency?.requiredStatuses) {
  for (const status of ["completed", "closed"]) {
    if (!sidecarDependency.requiredStatuses.includes(status)) sidecarDependency.requiredStatuses.push(status);
  }
}
sidecar.workPacket.ownedPaths = [...phase2.ownedPaths];
fs.writeFileSync(sidecarPath, `${JSON.stringify(sidecar, null, 2)}\n`);

// Make the successor requirement identity explicit in the control authority.
let control = fs.readFileSync(controlPath, "utf8");
control = replaceOnce(
  control,
  "The old `SHARED-TRUTH-001` text remains preserved in `governance/four-lens-requirements.json`; Independent Acceptance for this packet must evaluate the current explicit task plus this successor authority rather than silently changing the historical requirement text.",
  "The old `SHARED-TRUTH-001` text remains preserved in `governance/four-lens-requirements.json` and is separately dispositioned. Phase 2 appends `SHARED-LENS-CONTEXT-001` as the immutable successor requirement for selectable lens containers and individual-action availability. Independent Acceptance for this packet evaluates that successor ID rather than repurposing or silently changing the historical requirement.",
  "successor requirement authority paragraph"
);
fs.writeFileSync(controlPath, control);

// Reconcile the volatile delivery matrix with Phase 1 merged truth and active Phase 2.
let matrix = fs.readFileSync(matrixPath, "utf8");
matrix = replaceOnce(matrix, "| Shared Exchange | 26 | 0 | 0 | 21 | 0 | 4 | 1 |", "| Shared Exchange | 27 | 0 | 0 | 21 | 1 | 4 | 1 |", "Shared Exchange denominator");
matrix = replaceOnce(matrix, "| **Program total** | **105** | **0** | **0** | **64** | **27** | **13** | **1** |", "| **Program total** | **106** | **0** | **0** | **64** | **28** | **13** | **1** |", "program denominator");
matrix = replaceOnce(
  matrix,
  "**Snapshot basis:** operational Control Room transition `7d4deb37377c0ad7bd027dab64acd44a4d1d2e66`; initial operational activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`; Slice 4.6 reconciliation activation base `347015829d64cfc596cdef1010601d8bda447818`; ISS-006 correction activation base `69daa4bea80b39cc9d5ed04715aa6e2ac8e1f068`; Build → Release → Verify authority merge `4ca2a12f1d924ac559f87ebae0abc8fe42eac24b`; Exchange Room Phase 1 activation base `4ca2a12f1d924ac559f87ebae0abc8fe42eac24b` through Control Room PR #185",
  "**Snapshot basis:** operational Control Room transition `7d4deb37377c0ad7bd027dab64acd44a4d1d2e66`; initial operational activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`; Slice 4.6 reconciliation activation base `347015829d64cfc596cdef1010601d8bda447818`; ISS-006 correction activation base `69daa4bea80b39cc9d5ed04715aa6e2ac8e1f068`; Build → Release → Verify authority merge `4ca2a12f1d924ac559f87ebae0abc8fe42eac24b`; Exchange Room Phase 1 activation PR #185 and merged implementation `10150e66b4a1b37a0cda5381986c5599da96e632`; Exchange Room Phase 2 activation base `10150e66b4a1b37a0cda5381986c5599da96e632` through Control Room PR #187",
  "matrix snapshot basis"
);
const phase1Start = matrix.indexOf("## Exchange Room Phase 1");
const phase1End = matrix.indexOf("## Current participant lens availability");
assert(phase1Start >= 0 && phase1End > phase1Start, "Could not locate Phase 1 matrix section");
const phaseSections = `## Exchange Room Phase 1\n\nExchange Room Phase 1 is merged and released through the canonical App Hosting path as **Implemented — Not Verified**.\n\n- PR #186 converged the progressive Room source PR #183 with PR #174 selected-organization continuity.\n- Candidate head: \`6f160d84dd0f702e8546cbb421c17b2f3ac56dbd\`.\n- Merge/current Phase 1 production source: \`10150e66b4a1b37a0cda5381986c5599da96e632\`.\n- Post-merge production CI #951 / run \`31687342981\` passed on that exact SHA.\n- Firebase App Hosting rollout for \`rfxchange/us-east4/rfxchange\` succeeded on that exact SHA.\n- Authenticated real-Mapbox production health evidence remains explicit debt; this does not mark Phase 1 Verified or Stabilization 2C complete.\n\n## Exchange Room Phase 2\n\nPhase 2 is the active **Elevated** shared participant-surface packet \`WP-EXCHANGE-ROOM-PHASE2-01\` at activation base \`10150e66b4a1b37a0cda5381986c5599da96e632\`.\n\n- All four permanent lenses are visible/selectable contexts of the same Exchange Room.\n- Exactly four stable action positions appear per lens, sixteen total.\n- Capability truthfulness is expressed at the individual action level: only the non-usable action is gray/disabled and non-actionable while its normal function label remains visible.\n- The product surface does not add visible unavailable/coming-soon status prose merely to explain a disabled action; internal reason and assistive semantics remain distinct and non-color-only.\n- Lane 01 owns the shared controller/registry implementation only; missing RFx, Resources, Intelligence and Referrals domain functions remain with their domain lanes.\n- Independent certification remains separate; Phase 2 builder output may reach only Implemented — Not Verified.\n\n`;
matrix = matrix.slice(0, phase1Start) + phaseSections + matrix.slice(phase1End);
matrix = replaceOnce(
  matrix,
  "The Phase 1 Room may expose governed unavailable actions/lenses without making them reachable. Full RFx, Resources, Intelligence, Referrals, Teaming, messaging, notifications, billing expansion and the eventual 16-action registry do **not** block Room entry/release.",
  "Phase 2 makes every permanent lens selectable as a real context of the same Exchange Room. Function availability does not disable the parent lens: only the individual non-usable action is gray/disabled and non-actionable. Full RFx, Resources, Intelligence, Referrals, Teaming, messaging, notifications and billing expansion do **not** have to be complete for the value architecture to be visible.",
  "participant lens availability statement"
);
matrix = replaceOnce(
  matrix,
  "| Exchange Room Foundation Phase 1 | 01 | Active | activation base `4ca2a12f1d924ac559f87ebae0abc8fe42eac24b`; epoch `exchange-room-phase1-2026-08-12`; packet `WP-EXCHANGE-ROOM-PHASE1-01`; source PRs #183 `b15d737bcf5292206f8d7119034c848aa3d8f73d` + #174 `bc6d4f6dea158c7cdd359cc7bb64fd262e9bd7c1` | converge onto current main; merge as `Implemented — Not Verified` after Elevated merge gates; then post-merge CI + canonical production release/live verification; certification remains later debt |",
  "| Exchange Room Foundation Phase 1 | 01 | Implemented — Not Verified | activation base `4ca2a12f1d924ac559f87ebae0abc8fe42eac24b`; PR #186 candidate `6f160d84dd0f702e8546cbb421c17b2f3ac56dbd`; merge `10150e66b4a1b37a0cda5381986c5599da96e632`; post-merge CI #951 passed; App Hosting rollout succeeded | merged/released; authenticated real-map health and independent certification remain debt |\n| Exchange Room Phase 2 — Lens Controller + 16-Action Registry | 01 | Active | activation base `10150e66b4a1b37a0cda5381986c5599da96e632`; epoch `exchange-room-phase2-2026-08-13`; packet `WP-EXCHANGE-ROOM-PHASE2-01`; Control Room PR #187 | Lane 01 may implement the shared controller/registry only; max disposition `Implemented — Not Verified`; no domain completion or payment expansion in this packet |",
  "Phase 1 current workstream row"
);
matrix = replaceOnce(matrix, "| #183 | `b15d737bcf5292206f8d7119034c848aa3d8f73d` | canonical Phase 1 source candidate; must be reconciled with #174 and current main before merge/release; independent certification later |", "| #183 | `b15d737bcf5292206f8d7119034c848aa3d8f73d` | historical progressive Room source incorporated through PR #186; preserve provenance until supersession closure is reconciled |", "PR #183 debt row");
matrix = replaceOnce(matrix, "7. Exchange Room Phase 1 is **Elevated** and must satisfy the merge/release gates in `EXCHANGE_ROOM_PHASE1_CONTROL.md` and `WP-EXCHANGE-ROOM-PHASE1-01`.", "7. Exchange Room Phase 1 remains `Implemented — Not Verified`; Phase 2 is **Elevated** and must satisfy `EXCHANGE_ROOM_PHASE2_CONTROL.md` and `WP-EXCHANGE-ROOM-PHASE2-01` before its shared participant-surface implementation merges/releases.", "merge/release control item 7");
matrix = replaceOnce(matrix, "- No Feature ID, Four-Lens requirement status, tracker total or Verified numerator changes through Phase 1 activation.", "- The appended `SHARED-LENS-CONTEXT-001` requirement increases the Four-Lens program denominator to 106 but does not change the Verified numerator or Master Build Tracker arithmetic. No existing requirement is marked Verified by Phase 2 activation.", "matrix final Phase 1 note");
fs.writeFileSync(matrixPath, matrix);

console.log(JSON.stringify({
  successorId,
  recordCount: 106,
  idDigest: next.adoptionBaseline.idDigest,
  originalRequirementDigest: next.adoptionBaseline.originalRequirementDigest,
  governanceMetadataDigest: next.adoptionBaseline.governanceMetadataDigest
}, null, 2));
