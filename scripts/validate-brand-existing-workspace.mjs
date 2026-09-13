import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [state, spatialState, spatialHook, component, spatialScene, styles, page, runtime, networkRuntime, roadmap, networkCatalogText] = await Promise.all([
  read("src/application/participant/existing-workspace-state.ts"),
  read("src/application/participant/participant-spatial-context.ts"),
  read("src/components/participant/useParticipantSpatialContext.ts"),
  read("src/components/participant/ExistingWorkspaceFoundation.tsx"),
  read("src/components/map/ExchangeSpatialScene.tsx"),
  read("src/components/participant/ExistingWorkspaceFoundation.module.css"),
  read("app/geography/canvas/page.tsx"),
  read("src/infrastructure/geography/participant-map-runtime.ts"),
  read("src/infrastructure/network-discovery/runtime.ts"),
  read("docs/brand/BRAND_IMPLEMENTATION_ROADMAP.md"),
  read("src/i18n/messages/network/en-US.json"),
]);
const networkCatalog = JSON.parse(networkCatalogText);

for (const requirement of [
  "ExistingWorkspaceState",
  "EXISTING_WORKSPACE_STATE_VERSION = 1",
  'viewportIntent: "organization-home"',
  '"selected-object"',
  "existingWorkspaceStorageKey",
  "parseExistingWorkspaceState",
  "serializeExistingWorkspaceState",
]) {
  assert.ok(state.includes(requirement), `Brand B6a workspace-state contract is missing ${requirement}.`);
}
assert.ok(
  state.includes("storesAuthorization: false") &&
    state.includes("storesPrivateCoordinates: false") &&
    state.includes("storesDomainRecords: false") &&
    state.includes("selectedObjectMustBeAuthorizedProjection: true"),
  "Brand B6a browser persistence must remain UI-only and authority-safe.",
);

for (const status of ["loading", "empty", "error", "permission", "expired", "recovery"]) {
  assert.ok(networkCatalog.status?.[status]?.title && networkCatalog.status?.[status]?.body, `Brand B6a localized state boundary is missing ${status}.`);
}
assert.ok(
  component.includes('t(`networkWorkspace.status.${status}.title`)') &&
    component.includes('t(`networkWorkspace.status.${status}.body`)') &&
    component.includes('t(`networkWorkspace.status.${status}.action`)'),
  "Brand B6a workspace component must resolve localized status title/body/action from the bounded status state.",
);

for (const requirement of [
  "ExistingWorkspaceFoundation",
  "ExchangeSpatialScene",
  'workspaceOverlay="right"',
  "ExchangeBottomSheet",
  "desktopPanel",
  "authorizedObjectIds",
  "styles.markerPopover",
  'placement="popover"',
  "hideUnavailable",
]) {
  assert.ok(component.includes(requirement), `Brand B6a workspace implementation is missing ${requirement}.`);
}
assert.ok(
  component.includes("useParticipantSpatialContext") &&
    spatialHook.includes("window.sessionStorage") &&
    spatialState.includes("storesAuthorization: false") &&
    spatialState.includes("storesPrivateCoordinates: false") &&
    spatialState.includes("serverRevalidatesSelectedObjectsAndActions: true"),
  "Brand B6a workspace continuity must use the canonical authority-safe participant spatial context.",
);

assert.equal(networkCatalog.home.eyebrow, "Your organization");
assert.equal(networkCatalog.provenance.eyebrow, "Map information");
assert.equal(networkCatalog.home.manageProfile, "Manage profile");
assert.equal(networkCatalog.search.noResultsTitle, "No matches in this area");
assert.match(networkCatalog.home.scopeBody, /Find organizations and capabilities/);
assert.doesNotMatch(networkCatalog.home.scopeBody, /\b(?:Slice|Wave|authorized|permitted|governed|domain)\b/i);
assert.ok(!networkCatalog.match.disclaimer.includes("Matching explains profile overlap"));

assert.ok(
  component.includes("initialCamera={spatialContext.camera}") &&
    !component.includes('viewMode: "2d" as const') &&
    spatialScene.includes("const ORGANIZATION_ORBIT_PITCH = 75") &&
    spatialScene.includes('setViewMode("3d")'),
  "The ordinary Exchange must preserve the original default 3D organization orbit while restoring an explicitly chosen camera when present.",
);
assert.equal(component.includes("actionRail={contextualActions}"), false, "Record actions must not remain as a permanent floating bottom rail.");
assert.equal(component.includes("networkWorkspace.match.disclaimer"), false, "Matching caveats must not persist as ambient map copy.");
assert.match(styles, /\.markerPopover/);
assert.match(styles, /\.emptyResults/);

assert.ok(
  page.includes("ExistingWorkspaceFoundation") &&
    page.includes("organizationId={authenticated.mapProjection.organizationId}") &&
    page.includes("loadAuthorizedNetworkDiscovery") &&
    !page.includes("<ExchangeSpatialScene"),
  "The authenticated map route must consume the B6a workspace foundation and server-authorized discovery rather than rebuilding the scene.",
);
assert.ok(
  runtime.includes("readonly organizationId: string") && runtime.includes("organizationId,") && runtime.includes("access.membership.organizationId"),
  "B6a must receive organization identity from the authenticated server projection.",
);
assert.ok(
  !networkRuntime.includes("open-required") && networkRuntime.includes("evaluateGeographyParticipation") && networkRuntime.includes('"network-participation"'),
  "The map shell must remain available to controlled participants while geography authority is revalidated on the server.",
);

assert.equal(/#(?:0b0b0d|f7f3ea|252932|d6a23a|8a6418|2e5eaa|3b7b57)\b/i.test(styles), false, "Brand B6a workspace styling must consume semantic tokens rather than approved raw palette literals.");
assert.ok(
  styles.includes("focus-visible") &&
    styles.includes("(max-width: 1024px)") && styles.includes("(orientation: landscape) and (max-height: 520px)") &&
    styles.includes("@media (prefers-reduced-motion: reduce)") &&
    styles.includes("@media (prefers-reduced-transparency: reduce)"),
  "Brand B6a must preserve keyboard, mobile, reduced-motion and reduced-transparency behavior.",
);

for (const fabricated of [
  "OPPORTUNITY_BEACON_LAYER_ID",
  "PROVIDER_SERVICE_FIELD_LAYER_ID",
  "LIVE_REFERRAL_PATH_LAYER_ID",
  "CREDIBILITY_SEAL_LAYER_ID",
  "OUTCOME_PATH_LAYER_ID",
  "invented organization",
]) {
  assert.equal(component.includes(fabricated), false, `Brand B6a cannot fabricate ${fabricated}.`);
  assert.equal(networkRuntime.includes(fabricated), false, `Network runtime cannot fabricate ${fabricated}.`);
}

assert.ok(
  roadmap.includes("Brand Gate B6a — Existing workspace foundation") &&
    roadmap.includes("no modal dead ends") &&
    roadmap.includes("map state preservation is deterministic") &&
    roadmap.includes("no later-wave workflow or object fabricated"),
  "Brand B6a must remain aligned with canonical acceptance.",
);

console.log("Brand Gate B6a existing workspace validated with marker-context selection, restrained basemap labels, the original default 3D camera, contextual actions, authority-safe continuity, and simplified participant language.");
