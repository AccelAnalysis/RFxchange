import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const route = read("app/geography/canvas/page.tsx");
const service = read("src/application/network-discovery/network-discovery.ts");
const runtime = read("src/infrastructure/network-discovery/runtime.ts");
const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
const map = read("src/components/map/ExchangeSpatialScene.tsx");
const state = read("src/application/participant/existing-workspace-state.ts");
const slice = read("docs/slices/SLICE_3_2_CONTROLLED_NETWORK_ENTRY_AND_DISCOVERY.md");

assert.match(slice, /GEO-012/);
assert.match(slice, /DSC-001/);
assert.match(slice, /DSC-002/);
assert.match(slice, /DSC-003/);

assert.match(route, /resolveParticipantRoute/);
assert.match(route, /loadAuthorizedParticipantMapProjection/);
assert.match(route, /loadAuthorizedNetworkDiscovery/);
assert.match(route, /serviceArea/);
assert.doesNotMatch(route, /firebase-admin|firebase\/firestore/);

assert.match(runtime, /state\.lifecycleState !== "open-platform"/);
assert.match(runtime, /evaluateGeographyParticipation/);
assert.match(runtime, /"network-participation"/);
assert.match(runtime, /listByUserAndGeography/);
assert.match(runtime, /getServerFirestore/);
assert.match(runtime, /organizationMarkerActivations/);
assert.match(runtime, /createServerFirestoreFoundationRepositories/);
assert.match(runtime, /createFirestoreOrganizationLocationRepositories/);
assert.match(runtime, /createFirestoreEssentialOrganizationProfileRepositories/);
assert.match(runtime, /releaseState === "restricted"/);

assert.match(service, /NETWORK_DISCOVERY_PAGE_SIZE = 24/);
assert.match(service, /NETWORK_DISCOVERY_MAX_CANDIDATES = 250/);
assert.match(service, /activation\.status === "active"/);
assert.match(service, /activation\.organizationId !== viewerOrganizationId/);
assert.match(service, /completion\?\.status !== "active"/);
assert.match(service, /restriction && restriction\.state !== "none"/);
assert.match(service, /projectPublicOrganizationLocation/);
assert.match(service, /projectPublicEssentialOrganizationProfile/);
assert.match(service, /projectPublicOrganizationMarker/);
assert.match(service, /serviceGeographyIds\.includes/);
assert.match(service, /kind: "capability"/);
assert.match(service, /kind: "organization-name"/);
assert.doesNotMatch(service, /qualified|endorsed|award likelihood/i);

assert.match(workspace, /authorizedObjectIds/);
assert.match(workspace, /authorizedObjectIds\.has\(restored\.selectedObjectId\)/);
assert.match(workspace, /organizationMarkers=\{networkMarkers\}/);
assert.match(workspace, /focusedMarkerId=\{workspaceState\.selectedObjectId\}/);
assert.match(workspace, /onOrganizationMarkerSelect/);
assert.match(workspace, /showSearch=\{false\}/);
assert.match(workspace, /role="search"/);
assert.match(workspace, /name="serviceArea"/);
assert.match(workspace, /aria-pressed=\{selected\}/);
assert.match(workspace, /networkWorkspace\.match\.disclaimer/);
assert.doesNotMatch(workspace, /firebase-admin|firebase\/firestore/);

assert.match(state, /"organization-home"/);
assert.match(state, /"selected-object"/);
assert.match(state, /storesAuthorization: false/);
assert.match(state, /storesPrivateCoordinates: false/);
assert.match(state, /storesDomainRecords: false/);
assert.match(state, /selectedObjectMustBeAuthorizedProjection: true/);

assert.match(map, /NETWORK_MARKER_SOURCE_ID/);
assert.match(map, /rfx-spatial-scene-network-organizations/);
assert.match(map, /NETWORK_MARKER_CORE_LAYER_ID/);
assert.match(map, /"circle-color": "#252932"/);
assert.match(map, /"circle-stroke-color": "#d6a23a"/);
assert.match(map, /onOrganizationMarkerSelectRef\.current/);
assert.doesNotMatch(map, /opportunity-beacon|provider-service-field|credibility-seal/);

for (const locale of ["en-US", "es", "fr", "it", "de"]) {
  const catalogPath = path.join(root, "src", "i18n", "messages", "network", `${locale}.json`);
  assert.ok(fs.existsSync(catalogPath), `Missing Slice 3.2 Network catalog for ${locale}`);
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  assert.ok(catalog.search?.capabilityLabel);
  assert.ok(catalog.search?.serviceArea);
  assert.ok(catalog.match?.disclaimer);
  assert.ok(catalog.detail?.profileEvidence);
}

assert.match(workspace, /useI18n/);
assert.match(workspace, /networkWorkspace\.search\.capabilityLabel/);
assert.match(workspace, /networkWorkspace\.detail\.profileEvidence/);

console.log("Slice 3.2 controlled Network discovery architecture validated.");
