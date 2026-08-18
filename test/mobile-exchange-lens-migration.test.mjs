import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  LEGACY_PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX,
  PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX,
  PARTICIPANT_SPATIAL_CONTEXT_VERSION,
  legacyParticipantSpatialStorageKey,
  parseParticipantSpatialContext,
  participantSpatialStorageKey,
  serializeParticipantSpatialContext,
} from "../src/application/participant/participant-spatial-context.ts";
import { migrateLegacyParticipantLensId } from "../src/application/participant/participant-lens-registry.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const scope = Object.freeze({
  participantId: "participant-1",
  membershipId: "membership-1",
  organizationId: "organization-home",
  geographyId: "geography-1",
});
const state = (search, offset) => ({
  search,
  filters: { category: `${search}-category` },
  resultPage: 3,
  resultIndex: 7,
  listScrollTop: offset,
});

function legacyContext(overrides = {}) {
  return {
    version: 1,
    scope,
    activeLens: "referrals",
    selection: {
      organizationId: "organization-selected",
      markerId: "marker-selected",
      relationshipId: "referral-authorized",
    },
    camera: {
      longitude: -76.3,
      latitude: 36.9,
      zoom: 10,
      pitch: 35,
      bearing: 12,
      viewMode: "perspective",
    },
    lensState: {
      "opportunities-rfx": state("opportunity", 10),
      resources: state("resource", 20),
      intelligence: state("insight", 30),
      referrals: state("referral", 40),
    },
    panelOpen: false,
    sheetSnapPoint: "expanded",
    sheetScrollTop: 55,
    originLens: "referrals",
    returnHref: "/geography/canvas?q=steel&selectedOrganization=organization-selected",
    ...overrides,
  };
}

test("the scoped v1 browser key and active-pointer seam migrate to v2 instead of dropping state", () => {
  assert.equal(PARTICIPANT_SPATIAL_CONTEXT_VERSION, 2);
  assert.equal(LEGACY_PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX, "rfxchange:participant-spatial:v1:");
  assert.equal(PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX, "rfxchange:participant-spatial:v2:");
  assert.ok(legacyParticipantSpatialStorageKey(scope).startsWith(LEGACY_PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX));
  assert.ok(participantSpatialStorageKey(scope).startsWith(PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX));

  const hook = read("src/components/participant/useParticipantSpatialContext.ts");
  assert.match(hook, /sessionStorage\.getItem\(legacyStorageKey\)/);
  assert.match(hook, /parseParticipantSpatialContext\(legacyStored, input\.scope\)/);
  assert.match(hook, /sessionStorage\.setItem\(storageKey, serializeParticipantSpatialContext\(migrated\)\)/);
  assert.match(hook, /sessionStorage\.removeItem\(legacyStorageKey\)/);
  assert.match(hook, /sessionStorage\.setItem\(PARTICIPANT_SPATIAL_ACTIVE_KEY, storageKey\)/);
});

test("legacy fourth-lens state migrates deterministically to Capabilities and a separate referral workflow", () => {
  const migrated = parseParticipantSpatialContext(JSON.stringify(legacyContext()), scope);
  assert.ok(migrated);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.activeLens, "capabilities");
  assert.equal(migrated.originLens, "capabilities");
  assert.deepEqual(migrated.lensState.capabilities, state("referral", 40));
  assert.deepEqual(migrated.workflowState.referrals, state("referral", 40));
  assert.deepEqual(migrated.selection, legacyContext().selection);
  assert.deepEqual(migrated.camera, legacyContext().camera);
  assert.equal(migrated.panelOpen, false);
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
