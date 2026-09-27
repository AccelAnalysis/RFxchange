import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const state = await read("src/application/participant/participant-spatial-context.ts");
const component = await read("src/components/participant/ExistingWorkspaceFoundation.tsx");
const styles = await read("src/components/participant/ExistingWorkspaceFoundation.module.css");
const page = await read("app/geography/canvas/page.tsx");
const runtime = await read("src/infrastructure/geography/participant-map-runtime.ts");
const networkRuntime = await read("src/infrastructure/network-discovery/runtime.ts");
const networkCatalog = JSON.parse(
  await read("src/i18n/messages/network/en-US.json"),
);

test("Brand B6a browser state is deterministic, scoped, and non-authorizing", () => {
  assert.match(state, /participantId/);
  assert.match(state, /membershipId/);
  assert.match(state, /geographyId/);
  assert.match(state, /storesAuthorization: false/);
  assert.match(state, /storesPrivateCoordinates: false/);
  assert.match(state, /storesDomainRecords: false/);
  assert.match(state, /serverRevalidatesSelectedObjectsAndActions: true/);
  assert.doesNotMatch(state, /permission|sessionCookie/);
  assert.match(component, /authorizedObjectIds\.has\(spatialContext\.selection\.markerId\)/);
});

test("Brand B6a authenticated route receives server-authorized organization identity and Network projection", () => {
  assert.match(runtime, /readonly organizationId: string/);
  assert.match(runtime, /const organizationId = access\.membership\.organizationId/);
  assert.match(page, /ExistingWorkspaceFoundation/);
  assert.match(page, /organizationId=\{authenticated\.mapProjection\.organizationId\}/);
  assert.match(page, /loadAuthorizedNetworkDiscovery/);
  assert.match(networkRuntime, /evaluateGeographyParticipation/);
  assert.match(networkRuntime, /network-participation/);
  assert.doesNotMatch(page, /<ExchangeSpatialScene/);
});
