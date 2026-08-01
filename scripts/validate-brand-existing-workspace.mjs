import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [state, component, styles, page, runtime, roadmap] = await Promise.all([
  read("src/application/participant/existing-workspace-state.ts"),
  read("src/components/participant/ExistingWorkspaceFoundation.tsx"),
  read("src/components/participant/ExistingWorkspaceFoundation.module.css"),
  read("app/geography/canvas/page.tsx"),
  read("src/infrastructure/geography/participant-map-runtime.ts"),
  read("docs/brand/BRAND_IMPLEMENTATION_ROADMAP.md"),
]);

for (const requirement of [
  "ExistingWorkspaceState",
  "EXISTING_WORKSPACE_STATE_VERSION = 1",
  'viewportIntent: "organization-home"',
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
  "Brand B6a browser persistence must be UI-only and authority-safe.",
);

for (const status of ["loading", "empty", "error", "permission", "expired", "recovery"]) {
  assert.ok(component.includes(`${status}: Object.freeze`), `Brand B6a state boundary is missing ${status}.`);
}
for (const requirement of [
  "ExistingWorkspaceFoundation",
  "ExchangeSpatialScene",
  "workspaceOverlay={panelOpen ? \"right\" : null}",
  "ResponsiveEdgeSheet",
  "Organization home",
  "Data provenance",
  "Network discovery is not live yet",
  "Manage organization profile",
  "window.localStorage",
  "UI state persistence is optional and never affects authority or domain state",
]) {
  assert.ok(component.includes(requirement), `Brand B6a workspace implementation is missing ${requirement}.`);
}

assert.ok(
  page.includes("ExistingWorkspaceFoundation") &&
    page.includes("organizationId={authenticated.organizationId}") &&
    !page.includes("<ExchangeSpatialScene"),
  "The authenticated map route must consume the B6a workspace foundation rather than rebuilding the scene.",
);
assert.ok(
  runtime.includes("readonly organizationId: string") &&
    runtime.includes("organizationId,") &&
    runtime.includes("access.membership.organizationId"),
  "B6a must receive organization identity from the authenticated server projection.",
);

assert.equal(
  /#(?:0b0b0d|f7f3ea|252932|d6a23a|8a6418|2e5eaa|3b7b57)\b/i.test(styles),
  false,
  "Brand B6a workspace styling must consume semantic tokens rather than approved raw palette literals.",
);
assert.ok(
  styles.includes("focus-visible") &&
    styles.includes("@media (max-width: 760px)") &&
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
}

assert.ok(
  roadmap.includes("Brand Gate B6a — Existing workspace foundation") &&
    roadmap.includes("no modal dead ends") &&
    roadmap.includes("map state preservation is deterministic") &&
    roadmap.includes("no later-wave workflow or object fabricated"),
  "Brand B6a must remain aligned with canonical acceptance.",
);

console.log(
  "Brand Gate B6a existing workspace validated: authenticated organization home, deterministic UI-only state, responsive contextual sheet, provenance, recovery boundaries, current-domain scope and truthful absence of later Network/RFx objects.",
);
