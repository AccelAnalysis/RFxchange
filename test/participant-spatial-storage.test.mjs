import assert from "node:assert/strict";
import test from "node:test";
import { createParticipantSpatialContext, parseParticipantSpatialContext, serializeParticipantSpatialContext, resolveParticipantSpatialStorage, commitParticipantSpatialStorage, participantSpatialStorageKey, PARTICIPANT_SPATIAL_ACTIVE_KEY } from "../src/application/participant/participant-spatial-context.ts";
const scope = { participantId: "user-one", membershipId: "member-one", organizationId: "org-one", geographyId: "locality-one" };
function memory() { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) }; }
const fallback = serializeParticipantSpatialContext(createParticipantSpatialContext({ scope, homeMarkerId: "home-one" }));
test("current camera and lens state round-trip only in their exact participant scope", () => {
  const value = JSON.parse(fallback); value.lensState.resources.search = "plumber"; value.camera = { longitude: -76, latitude: 36, zoom: 10, pitch: 0, bearing: 0, viewMode: "2d" };
  assert.deepEqual(parseParticipantSpatialContext(JSON.stringify(value), scope), value);
  for (const key of Object.keys(scope)) assert.equal(parseParticipantSpatialContext(JSON.stringify(value), { ...scope, [key]: "other" }), null);
});
test("obsolete, corrupted and foreign-scope storage falls back without migrating old presentation state", () => {
  const storage = memory();
  for (const value of ["broken", JSON.stringify({ ...JSON.parse(fallback), version: 1 }), JSON.stringify({ ...JSON.parse(fallback), scope: { ...scope, organizationId: "other" } })]) {
    storage.setItem(participantSpatialStorageKey(scope), value);
    assert.equal(resolveParticipantSpatialStorage(storage, scope, fallback).source, "fallback");
  }
});
test("valid state is committed before its active pointer and foreign state cannot be committed", () => {
  const storage = memory();
  commitParticipantSpatialStorage(storage, scope, resolveParticipantSpatialStorage(storage, scope, fallback));
  assert.equal(storage.getItem(PARTICIPANT_SPATIAL_ACTIVE_KEY), participantSpatialStorageKey(scope));
  assert.equal(resolveParticipantSpatialStorage(storage, scope, fallback).source, "current");
  assert.throws(() => commitParticipantSpatialStorage(storage, { ...scope, membershipId: "other" }, { serialized: fallback, source: "current" }));
});
