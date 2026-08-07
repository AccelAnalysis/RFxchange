import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [state, component, styles, page, runtime, networkRuntime, roadmap, networkCatalogText] = await Promise.all([
  read("src/application/participant/existing-workspace-state.ts"),
  read("src/components/participant/ExistingWorkspaceFoundation.tsx"),
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
  assert.ok(
    networkCatalog.status?.[status]?.title && networkCatalog.status?.[status]?.body,
    `Brand B6a localized state boundary is missing ${status}.`,
  );
  assert.ok(
    component.includes(`networkWorkspace.status.${status}`),
    `Brand B6a workspace component must resolve the localized ${status} state.`,
  );
}

for (const requirement of [
  "ExistingWorkspaceFoundation",
  "ExchangeSpatialScene",
  'workspaceOverlay={panelOpen ? "right" : "left"}',
  "ResponsiveEdgeSheet",
  "authorizedObjectIds",
  "window.localStorage",
  "UI state persistence is optional and never affects authority or domain state",
]) {
  assert.ok(component.includes(requirement), `Brand B6a workspace implementation is missing ${requirement}.`);
}

assert.equal(networkCatalog.home.eyebrow, "Organization home");
assert.equal(networkCatalog.provenance.eyebrow, "Data provenance");
assert.equal(networkCatalog.home.manageProfile, "Manage organization profile");
assert.match(
  networkCatalog.home.scopeBody,
  /permitted Network organization discovery/,
  "The B6a workspace must truthfully describe the authorized Slice 3.2 Network capability.",
);
assert.match(
  networkCatalog.home.scopeBody,
  /Opportunities, referrals, resource providers, credibility, and outcomes remain absent/,
  "Later-domain absence must remain explicit after Slice 3.2.",
);

assert.ok(
  page.includes("ExistingWorkspaceFoundation") &&
    page.includes("organizationId={authenticated.mapProjection.organizationId}") &&
    page.includes("loadAuthorizedNetworkDiscovery") &&
    !page.includes("<ExchangeSpatialScene"),
  "The authenticated map route must consume the B6a workspace foundation and server-authorized discovery rather than rebuilding the scene.",
);
assert.ok(
  runtime.includes("readonly organizationId: string") &&
    runtime.includes("organizationId,") &&
    runtime.includes("access.membership.organizationId"),
  "B6a must receive organization identity from the authenticated server projection.",
);
assert.ok(
  networkRuntime.includes('state.lifecycleState !== "open-platform"') &&
    networkRuntime.includes("evaluateGeographyParticipation") &&
    networkRuntime.includes('"network-participation"'),
  "Slice 3.2 must extend B6a only after current OPEN and geography authority are revalidated on the server.",
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
  assert.equal(networkRuntime.includes(fabricated), false, `Network runtime cannot fabricate ${fabricated}.`);
}

assert.ok(
  roadmap.includes("Brand Gate B6a — Existing workspace foundation") &&
    roadmap.includes("no modal dead ends") &&
    roadmap.includes("map state preservation is deterministic") &&
    roadmap.includes("no later-wave workflow or object fabricated"),
  "Brand B6a must remain aligned with canonical acceptance.",
);

console.log(
  "Brand Gate B6a existing workspace validated through Slice 3.2: authenticated organization home, deterministic UI-only state, responsive contextual sheets, provenance, recovery boundaries, server-authorized Network discovery and truthful absence of later RFx/provider/referral/credibility/outcome objects.",
);
