import fs from "node:fs";

const controlPath = "docs/program/EXCHANGE_ROOM_PHASE2_CONTROL.md";
const handoffPath = "docs/program/EXCHANGE_ROOM_PHASE2_LANE01_HANDOFF.md";
const workstreamsPath = "governance/four-lens-workstreams.json";
const sidecarPath = "governance/exchange-room-phase2-activation.json";
const registryPath = "docs/program/EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function replaceOnce(text, before, after, label) {
  assert(text.includes(before), `Missing expected ${label}`);
  return text.replace(before, after);
}

assert(fs.existsSync(registryPath), "Canonical Phase 2 action registry is missing");

let control = fs.readFileSync(controlPath, "utf8");
control = replaceOnce(
  control,
  "## Sixteen-action registry\n\nCreate one canonical registry containing exactly four governed action definitions for each permanent lens, for a total of sixteen stable action definitions.\n\nAction names and domain meaning must be sourced from current approved lens/domain authorities and current accepted product direction. Lane 01 must not invent missing RFx, Resource, Intelligence, or Referral domain behavior simply to make a button active.",
  "## Sixteen-action registry\n\nThe immutable Phase 2 action identities, participant-visible labels, lens order, action order and source authorities are frozen by [`EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md`](EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md). Lane 01 must implement **exactly those sixteen definitions**. It may not choose, rename, reorder, substitute, split, merge or invent action identities. A later change to an ID or visible label requires a Control Room product-authority amendment.\n\nThe production registry contains exactly four governed action definitions for each permanent lens, for a total of sixteen stable action definitions. Count alone is not acceptance: the exact IDs, labels and ordering in the canonical action registry are normative.\n\nLane 01 must not invent missing RFx, Resource, Intelligence, or Referral domain behavior simply to make a button active."
, "sixteen-action registry authority");
control = replaceOnce(
  control,
  "- exactly four action positions per lens / sixteen registry definitions total;",
  "- exactly the sixteen immutable action IDs, labels and ordering in `EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md`, four per lens;",
  "action registry acceptance gate"
);
fs.writeFileSync(controlPath, control);

let handoff = fs.readFileSync(handoffPath, "utf8");
handoff = replaceOnce(
  handoff,
  "Read `docs/program/EXCHANGE_ROOM_PHASE2_CONTROL.md` and `docs/program/MARKET_READY_BASELINE.md` before changing production code.",
  "Read `docs/program/EXCHANGE_ROOM_PHASE2_CONTROL.md`, `docs/program/EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md`, and `docs/program/MARKET_READY_BASELINE.md` before changing production code.\n\n## Frozen sixteen-action identity\n\nImplement the exact IDs, visible labels and ordering in `EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md`. Do **not** select or rename the four actions per lens during implementation. Runtime inspection determines only whether each fixed action has a truthful real handler for the current context or must remain gray/disabled."
, "Lane 01 action registry source");
handoff = replaceOnce(
  handoff,
  "3. Read all four current lens/domain authorities before naming the four actions per lens. Do not invent domain semantics.\n4. Create the canonical sixteen-action registry.",
  "3. Read all four current lens/domain authorities to understand the frozen action meanings and handler boundaries; do not rename or reinterpret the sixteen actions.\n4. Implement the canonical sixteen-action registry exactly as frozen by Control Room.",
  "Lane 01 implementation sequence"
);
fs.writeFileSync(handoffPath, handoff);

const exactOwnedPaths = [
  "src/application/participant/**",
  "src/components/participant/**",
  "app/geography/canvas/**",
  "src/i18n/messages/network/**",
  "test/exchange-room-phase2-*.test.mjs",
  "test/participant-lens-controller-phase2.test.mjs",
  "test/participant-action-registry-phase2.test.mjs",
  "scripts/acceptance-exchange-room-phase2*.mjs",
  "scripts/validate-exchange-room-phase2*.mjs",
  "docs/program/evidence/exchange-room-phase2/**"
];

const workstreams = JSON.parse(fs.readFileSync(workstreamsPath, "utf8"));
const packet = workstreams.workPackets.find((entry) => entry.id === "WP-EXCHANGE-ROOM-PHASE2-01");
assert(packet, "Canonical Phase 2 packet missing");
packet.ownedPaths = exactOwnedPaths;
if (!packet.sources.includes(registryPath)) packet.sources.unshift(registryPath);
packet.mergeGates = packet.mergeGates ?? [];
const identityGate = "exact immutable sixteen-action IDs, labels and ordering match EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md";
if (!packet.mergeGates.includes(identityGate)) packet.mergeGates.unshift(identityGate);
fs.writeFileSync(workstreamsPath, `${JSON.stringify(workstreams, null, 2)}\n`);

const sidecar = JSON.parse(fs.readFileSync(sidecarPath, "utf8"));
sidecar.workPacket.ownedPaths = exactOwnedPaths;
if (!sidecar.workPacket.sources.includes(registryPath)) sidecar.workPacket.sources.unshift(registryPath);
fs.writeFileSync(sidecarPath, `${JSON.stringify(sidecar, null, 2)}\n`);

console.log("Phase 2 action identities frozen and packet ownership narrowed.");
