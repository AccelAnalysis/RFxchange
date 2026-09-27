import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (filePath) => readFile(new URL(filePath, root), "utf8");

const service = await read("src/application/network-discovery/network-discovery.ts");
const runtime = await read("src/infrastructure/network-discovery/runtime.ts");
const route = await read("app/geography/canvas/page.tsx");
const workspace = await read("src/components/participant/ExistingWorkspaceFoundation.tsx");
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

test("Slice 3.2 browser persistence remains UI-only and fails closed for stale selection", () => {
  assert.match(state, /storesAuthorization: false/);
  assert.match(state, /storesPrivateCoordinates: false/);
  assert.match(state, /storesDomainRecords: false/);
  assert.match(state, /serverRevalidatesSelectedObjectsAndActions: true/);
  assert.match(workspace, /authorizedObjectIds/);
});
