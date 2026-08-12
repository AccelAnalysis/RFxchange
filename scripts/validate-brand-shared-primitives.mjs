import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [
  primitives,
  primitiveCss,
  contracts,
  exportsFile,
  participant,
  participantNavigation,
  participantNavigationCss,
  persistentShell,
  persistentShellCss,
  participantRegistry,
  participantB2,
  roadmap,
] = await Promise.all([
  read("src/components/ui/Primitives.tsx"),
  read("src/components/ui/Primitives.module.css"),
  read("src/components/ui/object-contracts.ts"),
  read("src/components/ui/index.ts"),
  read("src/components/participant/ParticipantWorkspace.tsx"),
  read("src/components/participant/ParticipantTopNavigation.tsx"),
  read("src/components/participant/ParticipantTopNavigation.module.css"),
  read("src/components/participant/PersistentParticipantShell.tsx"),
  read("src/components/participant/PersistentParticipantShell.module.css"),
  read("src/application/participant/participant-lens-registry.ts"),
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
  primitiveCss.includes("focus-visible") &&
    participantB2.includes("focus-visible") &&
    participantNavigationCss.includes("focus-visible"),
  "Brand B2 shared primitives and the persistent participant shell must define keyboard focus behavior.",
);

const participantShellCss = [
  participantB2,
  participantNavigationCss,
  persistentShellCss,
].join("\n");
assert.equal(
  /#(?:0b0b0d|f7f3ea|252932|d6a23a|8a6418|2e5eaa|3b7b57)\b/i.test(`${primitiveCss}\n${participantShellCss}`),
  false,
  "Brand B2 and participant-shell styling must consume semantic tokens rather than approved raw palette literals.",
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
  assert.ok(
    contracts.includes(`interface ${visualContract}`) || contracts.includes(`type ${visualContract}`),
    `Brand B2 is missing ${visualContract}.`,
  );
  assert.ok(
    exportsFile.includes(visualContract),
    `Brand B2 public object contract exports are missing ${visualContract}.`,
  );
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

const participantComponents = `${participant}\n${participantNavigation}`;
for (const migration of [
  "OverlayPanel",
  "ResponsiveSheet",
  "ControlGroup",
  "SearchFilterFrame",
  "StatusSummary",
  "VisuallyHidden",
]) {
  assert.ok(
    participantComponents.includes(migration),
    `Participant workspace has not migrated to shared ${migration}.`,
  );
}

assert.ok(
  persistentShell.includes('data-participant-shell={authorizedParticipant ? "persistent" : undefined}') &&
    persistentShell.includes("ParticipantTopNavigation") &&
    persistentShell.includes("data-participant-content-region") &&
    participant.includes("usePersistentParticipantShellContext") &&
    participant.includes("if (persistent) return <>{children}</>"),
  "The participant header must be composed once by the persistent shell rather than recreated by each workspace.",
);
assert.ok(
  persistentShell.includes("reportAuthorizedOrganizationName") &&
    participant.includes("reportAuthorizedOrganizationName") &&
    !participantNavigation.includes('fetch("/api/participant-shell"'),
  "The persistent shell must reuse already-authorized page context instead of repeating session and organization hydration.",
);
assert.ok(
  participantRegistry.indexOf('id: "opportunities-rfx"') <
    participantRegistry.indexOf('id: "resources"') &&
    participantRegistry.indexOf('id: "resources"') <
      participantRegistry.indexOf('id: "intelligence"') &&
    participantRegistry.indexOf('id: "intelligence"') <
      participantRegistry.indexOf('id: "referrals"'),
  "The governed participant lenses are not in the required order.",
);
assert.ok(
  participantRegistry.includes('href: null') &&
    participantRegistry.includes('availability: "unavailable"') &&
    participantNavigation.includes('aria-disabled="true"') &&
    participantNavigation.includes("participantNavigation.notYetAvailable") &&
    !participantRegistry.includes('id: "network"'),
  "The persistent shell must expose Opportunities/RFx truthfully without restoring Network as a peer lens.",
);
assert.ok(
  participantNavigation.includes('role="menu"') &&
    participantNavigation.includes('role="menuitem"') &&
    participantNavigation.includes("PARTICIPANT_UTILITY_DESTINATIONS") &&
    participantNavigation.includes("/api/participant-shell/administration"),
  "Account utilities must remain separate, keyboard-operable, and server-authoritative for Administration.",
);
assert.ok(
  participantNavigation.includes('role="status"') &&
    participantNavigation.includes('aria-live="polite"') &&
    participantNavigation.includes('data-link-pending="true"') &&
    participantNavigation.includes("useLinkStatus"),
  "Warm participant navigation must expose immediate accessible pending state inside the persistent shell.",
);
assert.ok(
  !participantNavigationCss.includes("animation:") &&
    participantNavigationCss.includes("@media (max-width: 390px)"),
  "The persistent participant shell must keep transition feedback nonanimated and preserve 390px responsive acceptance.",
);
assert.ok(
  roadmap.includes("Brand Gate B2 — Shared component primitives") &&
    roadmap.includes("migrated components preserve current domain behavior"),
  "Brand B2 must remain aligned to the canonical gate acceptance.",
);

console.log(
  "Brand Gate B2 shared primitives and persistent participant-shell composition validated with semantic styling, keyboard focus, warm-navigation pending state, reduced motion, and authority-gated future objects.",
);
