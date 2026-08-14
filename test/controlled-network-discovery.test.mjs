import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (filePath) => readFile(new URL(filePath, root), "utf8");

const service = await read("src/application/network-discovery/network-discovery.ts");
const runtime = await read("src/infrastructure/network-discovery/runtime.ts");
const route = await read("app/geography/canvas/page.tsx");
const workspace = await read("src/components/participant/ExistingWorkspaceFoundation.tsx");
const workspaceStyles = await read("src/components/participant/ExistingWorkspaceFoundation.module.css");
const map = await read("src/components/map/ExchangeSpatialScene.tsx");
const state = await read("src/application/participant/participant-spatial-context.ts");

test("Slice 3.2 revalidates controlled and OPEN participants plus geography authority on the server", () => {
  assert.match(route, /resolveParticipantRoute/);
  assert.match(route, /loadAuthorizedNetworkDiscovery/);
  assert.doesNotMatch(route, /lifecycleState !== "open-platform"/);
  assert.doesNotMatch(runtime, /open-required/);
  assert.match(runtime, /evaluateGeographyParticipation/);
  assert.match(runtime, /network-participation/);
  assert.match(runtime, /listByUserAndGeography/);
  assert.doesNotMatch(`${route}\n${workspace}`, /firebase\/firestore|firebase-admin/);
});

test("Slice 3.2 discovery projects only eligible real organization records", () => {
  assert.match(service, /activation\.status === "active"/);
  assert.match(service, /completion\?\.status !== "active"/);
  assert.match(service, /restriction && restriction\.state !== "none"/);
  assert.match(service, /activation\.organizationId !== viewerOrganizationId/);
  assert.match(service, /projectPublicOrganizationLocation/);
  assert.match(service, /projectPublicEssentialOrganizationProfile/);
  assert.match(service, /projectPublicOrganizationMarker/);
});

test("Slice 3.2 search is capability-first and service-area bounded", () => {
  assert.match(service, /capabilityCorpus/);
  assert.match(service, /kind: "capability"/);
  assert.match(service, /kind: "organization-name"/);
  assert.match(service, /serviceGeographyIds\.includes/);
  assert.match(route, /params\.serviceArea/);
  assert.match(workspace, /name="serviceArea"/);
  assert.match(workspace, /networkWorkspace\.match\.disclaimer/);
});

test("Slice 3.2 keeps map list and detail on one authorized selection identity", () => {
  assert.match(workspace, /authorizedObjectIds\.has\(spatialContext\.selection\.markerId\)/);
  assert.match(workspace, /organizationMarkers=\{networkMarkers\}/);
  assert.match(workspace, /focusedMarkerId=\{selectedObjectId\}/);
  assert.match(workspace, /onOrganizationMarkerSelect/);
  assert.match(map, /rfx-spatial-scene-network-organizations/);
  assert.match(map, /onOrganizationMarkerSelectRef\.current/);
});

test("Slice 3.2 browser persistence remains UI-only and fails closed for stale selection", () => {
  assert.match(state, /storesAuthorization: false/);
  assert.match(state, /storesPrivateCoordinates: false/);
  assert.match(state, /storesDomainRecords: false/);
  assert.match(state, /serverRevalidatesSelectedObjectsAndActions: true/);
  assert.match(workspace, /authorizedObjectIds/);
});

test("Slice 3.2 keeps the mobile search and result surface legible over the map", () => {
  assert.match(workspaceStyles, /@media \(max-width: 520px\)[\s\S]*\.networkSearch[\s\S]*semantic-surface-glass-strong/);
  assert.match(workspaceStyles, /\.networkSearch[\s\S]*elevation-overlay/);
  assert.match(workspaceStyles, /prefers-reduced-transparency[\s\S]*\.networkSearch[\s\S]*backdrop-filter: none/);
});

test("Slice 3.2 does not fabricate provider, referral, or credibility objects", () => {
  const implementation = `${runtime}\n${service}\n${workspace}\n${map}`;
  assert.doesNotMatch(implementation, /credibility-seal/);
  assert.doesNotMatch(implementation, /synthetic-provider|synthetic-referral/);
  assert.match(map, /relationshipPaths = \[\]/);
  assert.match(map, /serviceFields = \[\]/);
});
