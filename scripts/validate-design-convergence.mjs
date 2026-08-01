import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [
  workspace,
  workspaceStyles,
  mapCanvas,
  mapStyles,
  tokens,
  geographyRoute,
  resolutionRoute,
  authorityRoute,
  locationRoute,
  profileRoute,
  activationRoute,
  activationClient,
  designSystem,
  mapSystem,
  roadmap,
  architecture,
  tracker,
] = await Promise.all([
  read("src/components/participant/ParticipantWorkspace.tsx"),
  read("src/components/participant/ParticipantWorkspace.module.css"),
  read("src/components/map/ControlledLocalityCanvas.tsx"),
  read("src/components/map/ControlledLocalityCanvas.module.css"),
  read("src/design/tokens.ts"),
  read("app/geography/canvas/page.tsx"),
  read("app/organization-resolution/page.tsx"),
  read("app/organization-authority/page.tsx"),
  read("app/organization-location/page.tsx"),
  read("app/organization-profile/page.tsx"),
  read("app/organization-activation/page.tsx"),
  read("src/components/onboarding/ActivationJourneyClient.tsx"),
  read("docs/design/RFxchange_DESIGN_SYSTEM.md"),
  read("docs/design/MAP_VISUAL_SYSTEM.md"),
  read("docs/slices/WAVE_2_ROADMAP.md"),
  read("docs/architecture/DESIGN_CONVERGENCE_GATE.md"),
  read("docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md"),
]);

for (const primitive of [
  "ParticipantShell",
  "ParticipantTopNavigation",
  "SpatialWorkspace",
  "OperationalWorkspace",
  "MapOverlaySurface",
  "ResponsiveEdgeSheet",
  "MapControlGroup",
  "LocalityStatusOverlay",
  "SearchFilterOverlay",
]) {
  assert.ok(workspace.includes(`function ${primitive}`), `Shared primitive is missing: ${primitive}`);
}

for (const contract of [
  "data-participant-navigation",
  'data-participant-default="warm-ivory"',
  'data-participant-workspace="spatial"',
  'data-participant-workspace="operational"',
  'data-mobile-surface="sheet"',
]) {
  assert.ok(workspace.includes(contract), `Participant shell contract is missing: ${contract}`);
}

assert.ok(
  workspaceStyles.includes("height: calc(100dvh - var(--participant-nav-height))") &&
    workspaceStyles.includes("height: var(--participant-nav-height)") &&
    workspaceStyles.includes("background: var(--participant-canvas)") &&
    workspaceStyles.includes("background: var(--ivory-glass-strong)") &&
    workspaceStyles.includes('@media (max-width: 760px)') &&
    workspaceStyles.includes("max-height: min(68svh, 590px)"),
  "Shared workspaces must preserve one navigation, full-height spatial canvas, Warm Ivory defaults, and mobile-sheet behavior.",
);
assert.ok(
  !workspaceStyles.includes("grid-template-columns: 240px") &&
    !workspaceStyles.includes("grid-template-columns: 280px"),
  "Participant shell must not introduce a permanent left navigation rail.",
);

assert.ok(
  tokens.includes("participantSurfaces") &&
    tokens.includes("defaultCanvas: colors.warmIvory") &&
    tokens.includes("navigationHeight: 64"),
  "Participant palette/layout token relationships are not centralized.",
);

assert.ok(
  geographyRoute.includes("ParticipantShell") && geographyRoute.includes("SpatialWorkspace"),
  "Authenticated Intelligence must consume the shared Spatial Workspace.",
);
assert.ok(
  profileRoute.includes("ParticipantShell") && profileRoute.includes("OperationalWorkspace"),
  "Authenticated Account must consume the shared Operational Workspace.",
);

for (const [path, route] of [
  ["organization resolution", resolutionRoute],
  ["organization authority", authorityRoute],
  ["organization location", locationRoute],
  ["organization activation", activationRoute],
]) {
  assert.ok(
    route.includes("resolveParticipantRoute") && route.includes("redirect("),
    `Legacy ${path} URL must converge into canonical activation/workspace routing.`,
  );
  assert.equal(route.includes("ParticipantShell"), false, `Legacy ${path} must not remain a duplicate participant workspace.`);
  assert.equal(route.includes("createPortsmouth"), false, `Legacy ${path} must not expose deterministic preview state.`);
}

assert.ok(
  activationClient.includes("MapboxLocalityCanvas") &&
    activationClient.includes("Confirm this map position") &&
    activationClient.includes("Enter the Exchange") &&
    activationClient.includes("Your organization is ready"),
  "Integrated activation must preserve geographic confirmation and customer-facing Exchange handoff without recreating stacked participant shells.",
);
assert.equal(
  activationClient.toLowerCase().includes("controlled exchange"),
  false,
  "Customer-facing activation copy must not expose internal controlled-platform terminology.",
);

assert.ok(
  mapCanvas.includes("model.layers.map") &&
    mapCanvas.includes("projectGeographicPosition(overlay.position") &&
    mapCanvas.includes('preserveAspectRatio="xMidYMid slice"') &&
    mapCanvas.includes("MapControlGroup") &&
    mapCanvas.includes("<figcaption className={styles.srOnly}>"),
  "The map renderer must fill its parent while preserving projection, layer, controls, and structured access.",
);
assert.ok(
  !mapCanvas.includes("styles.header") &&
    !mapCanvas.includes("styles.caption") &&
    !mapStyles.includes(".header {") &&
    !mapStyles.includes(".caption {"),
  "Persistent map header/footer chrome must remain outside the geographic renderer.",
);
assert.ok(
  mapCanvas.includes("className={styles.markerVisual}") &&
    mapCanvas.includes('transform={`translate(${point.x} ${point.y})`}') &&
    mapStyles.includes('.markerVisual[data-marker-activated="true"]') &&
    !mapStyles.includes('.organizationMarker[data-marker-activated="true"]') &&
    mapStyles.includes(".organizationPin") &&
    mapStyles.includes("stroke: none"),
  "Marker animation must stay on the internal visual child and normal pins must remain unoutlined.",
);

for (const phrase of [
  "Warm Ivory is the default participant application canvas",
  "Spatial Workspace",
  "Operational Workspace",
  "must never be interpreted as “build the participant application",
  "permanent left rail",
]) {
  assert.ok(designSystem.includes(phrase), `Canonical design system is missing: ${phrase}`);
}
for (const phrase of [
  "edge-to-edge map filling the entire viewport",
  "renderer and application shell have separate responsibilities",
  "internal marker visual child",
]) {
  assert.ok(`${mapSystem}\n${designSystem}`.includes(phrase), `Canonical map authority is missing: ${phrase}`);
}
assert.ok(
  roadmap.includes("Design convergence authority for Slices 2.9–2.12") &&
    roadmap.includes("do not alter Feature-ID scope or completion status"),
  "Wave 2.9–2.12 must consume the shared shell without changing feature scope.",
);
assert.ok(
  roadmap.includes("Runtime Convergence Gate") && roadmap.includes("Public visitors receive the marketing/authentication surface only"),
  "Design convergence must now sit behind the account-only runtime convergence boundary.",
);
assert.ok(
  architecture.includes("NO FEATURE-ID COMPLETION") && architecture.includes("Slice 2.9 has not begun"),
  "Design-gate architecture evidence must preserve the non-feature boundary.",
);
assert.ok(
  tracker.includes("**438 total · 118 Done · 320 Not Started**") &&
    tracker.includes('2 - Activation: **43/43**') &&
    tracker.includes("[x] `ACQ-002`") &&
    tracker.includes("[x] `ACQ-003`") &&
    tracker.includes("[x] `EDU-001`") &&
    tracker.includes("[x] `EDU-004`") &&
    tracker.includes("[x] `EDU-005`") &&
    tracker.includes("[x] `EDU-008`") &&
    tracker.includes("[x] `EDU-009`") &&
    tracker.includes("[x] `EDU-010`"),
  "Design convergence must remain intact while later slices advance canonical Feature-ID counts.",
);

console.log(
  "Participant design convergence validated: shared light controlled workspaces, integrated activation, full-viewport spatial map, responsive surfaces, renderer separation, marker anchoring, and current canonical feature counts.",
);
