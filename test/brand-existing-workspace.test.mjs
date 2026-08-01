import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const state = await read("src/application/participant/existing-workspace-state.ts");
const component = await read("src/components/participant/ExistingWorkspaceFoundation.tsx");
const styles = await read("src/components/participant/ExistingWorkspaceFoundation.module.css");
const page = await read("app/geography/canvas/page.tsx");
const runtime = await read("src/infrastructure/geography/participant-map-runtime.ts");

test("Brand B6a browser state is deterministic and stores no authority or coordinates", () => {
  assert.match(state, /viewportIntent: "organization-home"/);
  assert.match(state, /storesAuthorization: false/);
  assert.match(state, /storesPrivateCoordinates: false/);
  assert.match(state, /storesDomainRecords: false/);
  assert.match(state, /selectedObjectMustBeAuthorizedProjection: true/);
  assert.doesNotMatch(state, /longitude|latitude|permission|membership|sessionCookie/);
});

test("Brand B6a supports truthful loading and recovery boundaries", () => {
  for (const status of ["loading", "empty", "error", "permission", "expired", "recovery"]) {
    assert.match(component, new RegExp(`${status}: Object\\.freeze`));
  }
  assert.match(component, /StatePanel/);
  assert.match(component, /No organization or geography state was changed/);
  assert.match(component, /without creating a duplicate organization/);
});

test("Brand B6a exposes only current organization, geography, profile and provenance", () => {
  assert.match(component, /Organization home/);
  assert.match(component, /Active organization node/);
  assert.match(component, /Manage organization profile/);
  assert.match(component, /Data provenance/);
  assert.match(component, /Network discovery is not live yet/);
  assert.match(component, /remain absent until their authorized Wave 3 and Wave 4 slices are complete/);
});

test("Brand B6a authenticated route receives server-authorized organization identity", () => {
  assert.match(runtime, /readonly organizationId: string/);
  assert.match(runtime, /const organizationId = access\.membership\.organizationId/);
  assert.match(page, /ExistingWorkspaceFoundation/);
  assert.match(page, /organizationId=\{authenticated\.organizationId\}/);
  assert.doesNotMatch(page, /<ExchangeSpatialScene/);
});

test("Brand B6a workspace is responsive, keyboard-visible, and sensory-safe", () => {
  assert.match(styles, /focus-visible/);
  assert.match(styles, /max-width: 760px/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /prefers-reduced-transparency: reduce/);
  assert.doesNotMatch(styles, /#(?:0b0b0d|f7f3ea|252932|d6a23a|8a6418|2e5eaa|3b7b57)\b/i);
});
