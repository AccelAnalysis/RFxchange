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
  profileRoute,
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
  read("app/organization-profile/page.tsx"),
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
assert.ok(!workspaceStyles.includes("grid-template-columns: 240px") && !workspaceStyles.includes("grid-template-columns: 280px"));
assert.ok(tokens.includes("participantSurfaces") && tokens.includes("defaultCanvas: colors.warmIvory") && tokens.includes("navigationHeight: 64"));

assert.ok(geographyRoute.includes("ParticipantShell") && geographyRoute.includes("SpatialWorkspace"));
assert.ok(profileRoute.includes("ParticipantShell") && profileRoute.includes("OperationalWorkspace"));
assert.ok(
  activationClient.includes("MapboxLocalityCanvas") &&
    activationClient.includes("Confirm this map position") &&
    activationClient.includes("Enter the Exchange") &&
    activationClient.includes("Your organization is ready"),
  "Integrated activation must preserve geographic confirmation and customer-facing Exchange handoff.",
);
assert.equal(activationClient.toLowerCase().includes("controlled exchange"), false);

assert.ok(
  mapCanvas.includes("model.layers.map") &&
    mapCanvas.includes("projectGeographicPosition(overlay.position") &&
    mapCanvas.includes('preserveAspectRatio="xMidYMid slice"') &&
    mapCanvas.includes("MapControlGroup") &&
    mapCanvas.includes("<figcaption className={styles.srOnly}>"),
);
assert.ok(!mapCanvas.includes("styles.header") && !mapCanvas.includes("styles.caption"));
assert.ok(!mapStyles.includes(".header {") && !mapStyles.includes(".caption {"));
assert.ok(
  mapCanvas.includes("className={styles.markerVisual}") &&
    mapCanvas.includes('transform={`translate(${point.x} ${point.y})`}') &&
    mapStyles.includes('.markerVisual[data-marker-activated="true"]') &&
    mapStyles.includes(".organizationPin") &&
    mapStyles.includes("stroke: none"),
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
assert.ok(roadmap.includes("Design convergence authority for Slices 2.9–2.12"));
assert.ok(roadmap.includes("do not alter Feature-ID scope or completion status"));
assert.ok(architecture.includes("NO FEATURE-ID COMPLETION") && architecture.includes("Slice 2.9 has not begun"));
assert.ok(tracker.includes("**438 total · 106 Done · 332 Not Started**") && tracker.includes('2 - Activation: **31/43**'));

console.log(
  "Participant design convergence validated: shared light workspaces, integrated activation, full-viewport spatial map, responsive surfaces, marker anchoring, customer-facing Exchange copy, and unchanged feature counts.",
);
