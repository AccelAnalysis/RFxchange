import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [primitives, primitiveCss, contracts, exportsFile, participant, participantB2, roadmap] = await Promise.all([
  read("src/components/ui/Primitives.tsx"),
  read("src/components/ui/Primitives.module.css"),
  read("src/components/ui/object-contracts.ts"),
  read("src/components/ui/index.ts"),
  read("src/components/participant/ParticipantWorkspace.tsx"),
  read("src/components/participant/ParticipantWorkspaceB2.module.css"),
  read("docs/brand/BRAND_IMPLEMENTATION_ROADMAP.md"),
]);

for (const component of [
  "NavigationFrame",
  "OverlayPanel",
  "ResponsiveSheet",
  "ControlGroup",
  "SearchFilterFrame",
  "StatusSummary",
  "StatusPill",
  "AlertBanner",
  "StatePanel",
  "ObjectCard",
  "Timeline",
  "DataTable",
  "VisuallyHidden",
]) {
  assert.ok(primitives.includes(`export function ${component}`), `Brand B2 is missing ${component}.`);
  assert.ok(exportsFile.includes(component), `Brand B2 public UI barrel is missing ${component}.`);
}

for (const state of ["loading", "empty", "success", "error", "permission", "expired", "recovery"]) {
  assert.ok(primitives.includes(`\"${state}\"`), `Brand B2 state primitive is missing ${state}.`);
}

for (const accessibilityContract of [
  'role="search"',
  'role="group"',
  'aria-live={state === "loading" ? "polite" : undefined}',
  'aria-busy={state === "loading" ? true : undefined}',
  'aria-current={item.current ? "step" : undefined}',
  'scope="col"',
  'scope="row"',
]) {
  assert.ok(primitives.includes(accessibilityContract), `Brand B2 accessibility contract is missing ${accessibilityContract}.`);
}

assert.ok(
  primitiveCss.includes("@media (prefers-reduced-motion: reduce)") &&
    primitiveCss.includes("@media (prefers-reduced-transparency: reduce)"),
  "Brand B2 must include reduced-motion and reduced-transparency behavior.",
);
assert.ok(
  primitiveCss.includes("focus-visible") && participantB2.includes("focus-visible"),
  "Brand B2 shared primitives must define keyboard focus behavior.",
);
assert.equal(
  /#(?:0b0b0d|f7f3ea|252932|d6a23a|8a6418|2e5eaa|3b7b57)\b/i.test(`${primitiveCss}\n${participantB2}`),
  false,
  "Brand B2 shared primitive styling must consume semantic tokens rather than approved raw palette literals.",
);

for (const visualContract of [
  "OrganizationNodeVisualInput",
  "OpportunityBeaconVisualInput",
  "ServiceFieldVisualInput",
  "RelationshipPathVisualInput",
  "EvidenceSealVisualInput",
  "OutcomePathVisualInput",
  "VisualAuthorityReference",
]) {
  assert.ok(contracts.includes(`interface ${visualContract}`) || contracts.includes(`type ${visualContract}`), `Brand B2 is missing ${visualContract}.`);
  assert.ok(exportsFile.includes(visualContract), `Brand B2 public object contract exports are missing ${visualContract}.`);
}
assert.ok(
  contracts.includes("syntheticRuntimeObjectsAllowed: false") &&
    contracts.includes("plannedObjectsMayRenderAsLive: false") &&
    contracts.includes('missingAuthorityBehavior: "omit-and-explain"') &&
    contracts.includes("privacyPrecisionMustBePreserved: true"),
  "Brand B2 visual policy must fail closed on synthetic, planned, unauthorized, or privacy-expanded objects.",
);
assert.ok(
  contracts.includes("assertAuthorityGatedVisualInput") &&
    contracts.includes("projectionVersion") &&
    contracts.includes("observedAt"),
  "Brand B2 visual contracts must validate authoritative record/version/time provenance.",
);

for (const migration of [
  "NavigationFrame",
  "OverlayPanel",
  "ResponsiveSheet",
  "ControlGroup",
  "SearchFilterFrame",
  "StatusSummary",
  "VisuallyHidden",
]) {
  assert.ok(participant.includes(migration), `Participant workspace has not migrated to shared ${migration}.`);
}
assert.ok(
  participant.includes("Available in a later approved product slice") &&
    participant.includes("Opportunity and resource layers remain unavailable"),
  "Brand B2 must preserve truthful unavailable-layer language.",
);
assert.ok(
  roadmap.includes("Brand Gate B2 — Shared component primitives") &&
    roadmap.includes("migrated components preserve current domain behavior"),
  "Brand B2 must remain aligned to the canonical gate acceptance.",
);

console.log(
  "Brand Gate B2 shared primitives validated: reusable navigation, surfaces, search/filter, state, object, timeline and table contracts with accessibility, reduced motion, semantic styling and authority-gated future objects.",
);
