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

test("Brand B6a supports truthful localized loading and recovery boundaries", () => {
  for (const status of ["loading", "empty", "error", "permission", "expired", "recovery"]) {
    assert.ok(networkCatalog.status?.[status]?.title);
    assert.ok(networkCatalog.status?.[status]?.body);
  }
  assert.match(component, /StatePanel/);
  assert.match(component, /networkWorkspace\.status\.\$\{status\}\.title/);
  assert.equal(
    networkCatalog.status.error.body,
    "Your organization and location information were not changed. Retry or return to setup if you need to correct something.",
  );
  assert.match(networkCatalog.status.recovery.body, /without creating a duplicate organization/);
});

test("Brand B6a organization home presents the current bounded Exchange scope without internal delivery language", () => {
  assert.equal(networkCatalog.home.eyebrow, "Organization home");
  assert.equal(networkCatalog.home.activeNode, "Organization marker");
  assert.equal(networkCatalog.home.manageProfile, "Manage organization profile");
  assert.equal(networkCatalog.provenance.eyebrow, "Map information");
  assert.match(networkCatalog.home.scopeBody, /Explore organizations, capabilities, geography, and the Exchange tools currently available/);
  assert.match(networkCatalog.home.scopeBody, /Unavailable actions are identified where they appear/);
  assert.match(component, /networkWorkspace\.home\.scopeBody/);
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

test("Brand B6a workspace is responsive, keyboard-visible, and sensory-safe", () => {
  assert.match(styles, /focus-visible/);
  assert.match(styles, /max-width: 760px/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /prefers-reduced-transparency: reduce/);
  assert.doesNotMatch(styles, /#(?:0b0b0d|f7f3ea|252932|d6a23a|8a6418|2e5eaa|3b7b57)\b/i);
});
