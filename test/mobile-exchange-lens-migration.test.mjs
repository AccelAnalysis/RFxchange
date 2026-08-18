import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  LEGACY_PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX,
  PARTICIPANT_SPATIAL_ACTIVE_KEY,
  PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX,
  PARTICIPANT_SPATIAL_CONTEXT_VERSION,
  PARTICIPANT_SPATIAL_LEGACY_REFERRAL_INTENT_KEY,
  commitParticipantSpatialStorage,
  consumeLegacyReferralLensIntent,
  createParticipantSpatialContext,
  legacyParticipantSpatialStorageKey,
  parseParticipantSpatialContext,
  participantSpatialStorageKey,
  resolveParticipantSpatialStorage,
  serializeParticipantSpatialContext,
} from "../src/application/participant/participant-spatial-context.ts";
import { migrateLegacyParticipantLensId } from "../src/application/participant/participant-lens-registry.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const fixtureText = read("docs/program/evidence/mobile-exchange-lens-migration/v1-context-fixture.json");
const fixture = JSON.parse(fixtureText);
const scope = Object.freeze(fixture.scope);

function legacyContext(overrides = {}) {
  return {
    ...structuredClone(fixture),
    ...overrides,
  };
}

class MemoryStorage {
  #values = new Map();

  getItem(key) { return this.#values.get(key) ?? null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
}

function fallbackSerialized() {
  return serializeParticipantSpatialContext(createParticipantSpatialContext({
    scope,
    homeMarkerId: "home-marker",
    activeLens: "intelligence",
  }));
}

test("the scoped v1 browser key and active-pointer seam migrate to v2 instead of dropping state", () => {
  assert.equal(PARTICIPANT_SPATIAL_CONTEXT_VERSION, 2);
  assert.equal(LEGACY_PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX, "rfxchange:participant-spatial:v1:");
  assert.equal(PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX, "rfxchange:participant-spatial:v2:");
  assert.ok(legacyParticipantSpatialStorageKey(scope).startsWith(LEGACY_PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX));
  assert.ok(participantSpatialStorageKey(scope).startsWith(PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX));

  assert.equal(
    createHash("sha256").update(fixtureText).digest("hex"),
    "9834dc81d77d0596a15827abf40b327f51053aa9b80c92a31f7f8d5eae81c51c",
  );

  const storage = new MemoryStorage();
  const legacyKey = legacyParticipantSpatialStorageKey(scope);
  const successorKey = participantSpatialStorageKey(scope);
  storage.setItem(legacyKey, fixtureText);
  storage.setItem(PARTICIPANT_SPATIAL_ACTIVE_KEY, legacyKey);
  const resolution = resolveParticipantSpatialStorage(storage, scope, fallbackSerialized());
  assert.equal(resolution.source, "legacy");
  assert.equal(resolution.legacyReferralLensIntent, true);
  commitParticipantSpatialStorage(storage, scope, resolution);
  assert.ok(parseParticipantSpatialContext(storage.getItem(successorKey), scope));
  assert.equal(storage.getItem(legacyKey), null);
  assert.equal(storage.getItem(PARTICIPANT_SPATIAL_ACTIVE_KEY), successorKey);
  assert.equal(storage.getItem(PARTICIPANT_SPATIAL_LEGACY_REFERRAL_INTENT_KEY), successorKey);

  const reload = resolveParticipantSpatialStorage(storage, scope, fallbackSerialized());
  assert.equal(reload.source, "successor");
  commitParticipantSpatialStorage(storage, scope, reload);
  assert.equal(storage.getItem(PARTICIPANT_SPATIAL_ACTIVE_KEY), successorKey);
});

test("legacy fourth-lens state migrates deterministically to Capabilities and a separate referral workflow", () => {
  const migrated = parseParticipantSpatialContext(JSON.stringify(legacyContext()), scope);
  assert.ok(migrated);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.activeLens, "capabilities");
  assert.equal(migrated.originLens, "capabilities");
  assert.deepEqual(migrated.lensState.capabilities, fixture.lensState.referrals);
  assert.deepEqual(migrated.workflowState.referrals, fixture.lensState.referrals);
  assert.deepEqual(migrated.selection, legacyContext().selection);
  assert.deepEqual(migrated.camera, legacyContext().camera);
  assert.equal(migrated.panelOpen, true);
  assert.equal(migrated.sheetSnapPoint, "expanded");
  assert.equal(migrated.sheetScrollTop, 55);
  assert.equal(migrated.returnHref, legacyContext().returnHref);
});

test("successor serialization is idempotent and emits no permanent Referrals lens state", () => {
  const first = parseParticipantSpatialContext(JSON.stringify(legacyContext()), scope);
  const serialized = serializeParticipantSpatialContext(first);
  const output = JSON.parse(serialized);
  assert.equal(output.version, 2);
  assert.equal(output.activeLens, "capabilities");
  assert.equal(output.lensState.referrals, undefined);
  assert.ok(output.lensState.capabilities);
  assert.ok(output.workflowState.referrals);

  const second = parseParticipantSpatialContext(serialized, scope);
  assert.deepEqual(second, first);
  assert.equal(serializeParticipantSpatialContext(second), serialized);
});

test("legacy query identity migrates but malformed and cross-scope state fail closed", () => {
  assert.equal(migrateLegacyParticipantLensId("referrals"), "capabilities");
  assert.equal(migrateLegacyParticipantLensId("capabilities"), "capabilities");
  assert.equal(migrateLegacyParticipantLensId("unknown"), null);
  assert.equal(parseParticipantSpatialContext("not-json", scope), null);
  assert.equal(parseParticipantSpatialContext(JSON.stringify(legacyContext({
    scope: { ...scope, organizationId: "organization-other" },
  })), scope), null);
  assert.equal(parseParticipantSpatialContext(JSON.stringify(legacyContext({
    selection: { organizationId: "", markerId: "marker", relationshipId: null },
  })), scope), null);
});

test("corrupt successor and invalid legacy storage recover without a dangling active pointer", () => {
  const successorKey = participantSpatialStorageKey(scope);
  const legacyKey = legacyParticipantSpatialStorageKey(scope);
  const storage = new MemoryStorage();
  storage.setItem(successorKey, "corrupt-v2");
  storage.setItem(legacyKey, fixtureText);
  let resolution = resolveParticipantSpatialStorage(storage, scope, fallbackSerialized());
  assert.equal(resolution.source, "legacy");
  commitParticipantSpatialStorage(storage, scope, resolution);
  assert.ok(parseParticipantSpatialContext(storage.getItem(successorKey), scope));
  assert.equal(storage.getItem(PARTICIPANT_SPATIAL_ACTIVE_KEY), successorKey);

  const invalid = new MemoryStorage();
  invalid.setItem(successorKey, "corrupt-v2");
  invalid.setItem(legacyKey, JSON.stringify(legacyContext({
    scope: { ...scope, organizationId: "cross-scope" },
  })));
  invalid.setItem(PARTICIPANT_SPATIAL_ACTIVE_KEY, legacyKey);
  resolution = resolveParticipantSpatialStorage(invalid, scope, fallbackSerialized());
  assert.equal(resolution.source, "fallback");
  commitParticipantSpatialStorage(invalid, scope, resolution);
  assert.ok(parseParticipantSpatialContext(invalid.getItem(successorKey), scope));
  assert.equal(invalid.getItem(legacyKey), null);
  assert.equal(invalid.getItem(PARTICIPANT_SPATIAL_ACTIVE_KEY), successorKey);
  assert.equal(invalid.getItem(PARTICIPANT_SPATIAL_LEGACY_REFERRAL_INTENT_KEY), null);
});

test("bare legacy Referrals intent is consumed once while explicit management remains Referrals", () => {
  const storage = new MemoryStorage();
  storage.setItem(legacyParticipantSpatialStorageKey(scope), fixtureText);
  const resolution = resolveParticipantSpatialStorage(storage, scope, fallbackSerialized());
  commitParticipantSpatialStorage(storage, scope, resolution);
  assert.equal(consumeLegacyReferralLensIntent(storage, scope), true);
  assert.equal(consumeLegacyReferralLensIntent(storage, scope), false);

  const referralPage = read("app/referrals/page.tsx");
  const referralWorkspace = read("src/components/referrals/ReferralWorkspace.tsx");
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  assert.match(referralPage, /legacyBareLensIntent=\{!managementIntent && !requestedReferralId && !requestedOrganizationId\}/);
  assert.match(referralWorkspace, /consumeLegacyReferralLensIntent\(storage, spatialScope\)/);
  assert.match(referralWorkspace, /router\.replace\("\/geography\/canvas\?lens=capabilities"/);
  assert.match(navigation, /PARTICIPANT_UTILITY_DESTINATIONS\.referrals\.managementHref/);
});

test("referral records remain a governed workflow and are never rewritten as capability records", () => {
  const referralPage = read("app/referrals/page.tsx");
  const referralWorkspace = read("src/components/referrals/ReferralWorkspace.tsx");
  const migration = read("src/application/participant/participant-spatial-context.ts");
  assert.match(referralPage, /requestedReferralId/);
  assert.match(referralPage, /createServerReferralNetworkService\(\)\.snapshot/);
  assert.match(referralWorkspace, /workflowState\.referrals/);
  assert.doesNotMatch(referralWorkspace, /activeLens: "referrals"/);
  assert.doesNotMatch(migration, /src\/domain\/referrals|repository|consent|audit/i);
});
