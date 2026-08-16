import assert from "node:assert/strict";
import test from "node:test";

import {
  EXCHANGE_MEDIA_KINDS,
  EXCHANGE_SHEET_SNAP_POINTS,
  MOBILE_EXCHANGE_ACCOUNT_UTILITY,
  MOBILE_EXCHANGE_CLIENT_STATE_POLICY,
  MOBILE_EXCHANGE_COMPOSITION_POLICY,
  MOBILE_EXCHANGE_LENS_DEFINITIONS,
  MOBILE_EXCHANGE_UNAVAILABLE_EXPLANATION_KEY,
  createExchangeGeographyContext,
  createExchangeMapObjectProjection,
  createExchangeSelectionState,
  createExchangeSubjectIdentity,
  createLensResultCardModel,
  mobileExchangeStateFromParticipantSpatialContext,
  mobileLensActionRail,
  projectFavoriteState,
  projectRecordAction,
  resultCardIdentityIsCoherent,
  selectionMatchesCard,
  selectionMatchesMapObject,
  transitionMobileExchangeLens,
} from "../src/application/participant/mobile-exchange-contracts.ts";
import { EXCHANGE_ROOM_ACTION_IDS } from "../src/application/participant/exchange-room-actions.ts";
import { PARTICIPANT_LENS_IDS } from "../src/application/participant/participant-lens-registry.ts";

const lensState = (search, listScrollTop) => ({
  search,
  filters: { category: `${search}-category` },
  resultPage: 2,
  resultIndex: 3,
  listScrollTop,
});

function spatialContext() {
  return {
    version: 1,
    scope: {
      participantId: "participant-1",
      membershipId: "membership-1",
      organizationId: "org-home",
      geographyId: "geo-1",
    },
    activeLens: "intelligence",
    selection: {
      organizationId: "org-2",
      markerId: "marker-org-2",
      relationshipId: null,
    },
    camera: {
      longitude: -76.7,
      latitude: 36.8,
      zoom: 11,
      pitch: 0,
      bearing: 0,
      viewMode: "2d",
    },
    lensState: {
      "opportunities-rfx": lensState("opportunity", 10),
      resources: lensState("resource", 20),
      intelligence: lensState("organization", 30),
      referrals: lensState("referral", 40),
    },
    panelOpen: true,
    originLens: "resources",
    returnHref: "/resources",
  };
}

function projection(id, lens, order, overrides = {}) {
  return {
    id,
    lens,
    order,
    labelKey: `actions.${id}`,
    operational: true,
    applicable: true,
    authorized: true,
    availability: "active",
    disabledReason: null,
    resolvedHandler: { kind: "href", href: "/opportunities" },
    ...overrides,
  };
}

test("Stage 1 binds exactly four governed lenses and keeps Account outside the lens tuple", () => {
  assert.deepEqual(MOBILE_EXCHANGE_LENS_DEFINITIONS.map((lens) => lens.id), [...PARTICIPANT_LENS_IDS]);
  assert.equal(MOBILE_EXCHANGE_LENS_DEFINITIONS.length, 4);
  assert.deepEqual(MOBILE_EXCHANGE_LENS_DEFINITIONS.map((lens) => lens.order), [1, 2, 3, 4]);
  assert.equal(MOBILE_EXCHANGE_COMPOSITION_POLICY.shell, "map-first");
  assert.equal(MOBILE_EXCHANGE_COMPOSITION_POLICY.searchFilterPlacement, "map-overlay");
  assert.equal(MOBILE_EXCHANGE_COMPOSITION_POLICY.lensNavigationPlacement, "bottom");
  assert.equal(MOBILE_EXCHANGE_ACCOUNT_UTILITY.navigationRole, "utility");
  assert.equal(MOBILE_EXCHANGE_ACCOUNT_UTILITY.presentation, "menu");
  assert.ok(!MOBILE_EXCHANGE_LENS_DEFINITIONS.some((lens) => lens.id === "account"));
});

test("every governed lens exposes exactly four stable Phase 2 action positions", () => {
  const ids = MOBILE_EXCHANGE_LENS_DEFINITIONS.flatMap((lens) => {
    assert.equal(lens.actionIds.length, 4, lens.id);
    return [...lens.actionIds];
  });
  assert.equal(ids.length, 16);
  assert.deepEqual(ids, [...EXCHANGE_ROOM_ACTION_IDS]);
});

test("the mobile action rail preserves operational, applicable, and authorized as separate facts", () => {
  const lens = "opportunities-rfx";
  const rail = mobileLensActionRail(lens, [
    projection("opportunities.find", lens, 1, {
      operational: false,
      availability: "disabled",
      disabledReason: "not-operational",
      resolvedHandler: null,
    }),
    projection("opportunities.create-rfx", lens, 2, {
      applicable: false,
      availability: "disabled",
      disabledReason: "not-applicable",
      resolvedHandler: null,
    }),
    projection("opportunities.pursue-respond", lens, 3, {
      authorized: false,
      availability: "disabled",
      disabledReason: "not-authorized",
      resolvedHandler: null,
    }),
    projection("opportunities.team", lens, 4),
  ]);

  assert.equal(rail.placement, "sheet-top");
  assert.deepEqual(rail.actions.map((action) => action.position), [1, 2, 3, 4]);
  assert.deepEqual(rail.actions.map((action) => action.operational), [false, true, true, true]);
  assert.deepEqual(rail.actions.map((action) => action.applicable), [true, false, true, true]);
  assert.deepEqual(rail.actions.map((action) => action.authorized), [true, true, false, true]);
  assert.deepEqual(
    rail.actions.map((action) => action.disabledReason),
    ["not-operational", "not-applicable", "not-authorized", null],
  );
  assert.equal(rail.actions[0].disabledExplanationKey, MOBILE_EXCHANGE_UNAVAILABLE_EXPLANATION_KEY);
  assert.equal(rail.actions[3].availability, "enabled");
  assert.deepEqual(rail.actions[3].handler, { kind: "href", href: "/opportunities" });
});

test("the mobile action rail rejects duplicate, substituted, or displaced registry entries", () => {
  const lens = "opportunities-rfx";
  const canonical = [
    projection("opportunities.find", lens, 1),
    projection("opportunities.create-rfx", lens, 2),
    projection("opportunities.pursue-respond", lens, 3),
    projection("opportunities.team", lens, 4),
  ];
  assert.equal(mobileLensActionRail(lens, canonical).actions.length, 4);

  assert.throws(
    () => mobileLensActionRail(lens, [canonical[0], canonical[0], canonical[2], canonical[3]]),
    /canonical action id and position|duplicate action ids/,
  );
  assert.throws(
    () => mobileLensActionRail(lens, [
      canonical[0],
      projection("opportunities.team", lens, 2),
      canonical[2],
      canonical[3],
    ]),
    /canonical action id and position/,
  );
  assert.throws(
    () => mobileLensActionRail(lens, [
      projection("opportunities.find", lens, 2),
      canonical[1],
      canonical[2],
      canonical[3],
    ]),
    /canonical action id and position/,
  );
});

test("map, card, keyboard, and detail selection converge on one validated subject identity", () => {
  const identity = createExchangeSubjectIdentity({
    subjectKind: "organization",
    selectionKey: "organization:org-2",
    organizationId: "org-2",
    recordType: null,
    recordId: null,
  });
  const selection = createExchangeSelectionState({
    kind: "organization",
    source: "keyboard",
    selectedOrganization: {
      selectionKey: identity.selectionKey,
      organizationId: identity.organizationId,
    },
    selectedMarker: {
      selectionKey: identity.selectionKey,
      markerId: "marker-org-2",
    },
  });
  const favorite = projectFavoriteState({
    visible: false,
    favorited: null,
    operational: false,
    applicable: false,
    authorized: false,
    handler: null,
  });
  const card = createLensResultCardModel({
    identity,
    title: "Organization 2",
    organizationIdentity: "Organization 2",
    locality: "Example locality",
    favorite,
    returnLens: "intelligence",
  });
  const marker = createExchangeMapObjectProjection({
    identity,
    markerId: "marker-org-2",
    coordinate: { longitude: -76.7, latitude: 36.8 },
    privacy: "approximate",
    accessibleLabel: "Organization 2",
    selectable: true,
  });

  assert.strictEqual(card.identity, card.detailContext.identity);
  assert.equal(resultCardIdentityIsCoherent(card), true);
  assert.equal(selectionMatchesCard(selection, card), true);
  assert.equal(selectionMatchesMapObject(selection, marker), true);
  assert.throws(
    () => createExchangeSelectionState({
      kind: "organization",
      source: "map",
      selectedOrganization: {
        selectionKey: "organization:org-2",
        organizationId: "org-2",
      },
      selectedMarker: {
        selectionKey: "organization:org-3",
        markerId: "marker-org-3",
      },
    }),
    /must share one selection key/,
  );
});

test("subject identity rejects organization and record field drift", () => {
  assert.throws(
    () => createExchangeSubjectIdentity({
      subjectKind: "organization",
      selectionKey: "organization:org-2",
      organizationId: "org-2",
      recordType: "opportunity",
      recordId: "opportunity-1",
    }),
    /no domain record/,
  );
  assert.throws(
    () => createExchangeSubjectIdentity({
      subjectKind: "record",
      selectionKey: "record:1",
      organizationId: null,
      recordType: null,
      recordId: "record-1",
    }),
    /record type and record id/,
  );
});

test("the Stage 1 adapter preserves spatial continuity without claiming server geography authority", () => {
  const context = spatialContext();
  const state = mobileExchangeStateFromParticipantSpatialContext(context);
  assert.equal(state.activeLens, "intelligence");
  assert.equal(state.selection.selectedOrganization.organizationId, "org-2");
  assert.equal(state.selection.selectedMarker.markerId, "marker-org-2");
  assert.deepEqual(state.mapCamera, context.camera);
  assert.equal(state.geography.geographyId, "geo-1");
  assert.equal(state.geography.authority, "carried-unvalidated");
  assert.equal(state.lensState.resources.search, "resource");
  assert.deepEqual(state.lensState.resources.filters, { category: "resource-category" });
  assert.equal(state.lensState.resources.sort, null);
  assert.equal(state.lensState.resources.resultSetId, null);
  assert.equal(state.lensState.resources.cursor, null);
  assert.equal(state.lensState.resources.listScrollPosition, 20);
  assert.equal(state.lensState.resources.sheetScrollPosition, 20);
  assert.equal(state.sheet.sheetSnapPoint, "partial");
  assert.equal(state.sheet.sheetScrollPosition, 30);

  const changed = transitionMobileExchangeLens(state, "referrals");
  assert.equal(changed.activeLens, "referrals");
  assert.strictEqual(changed.selection, state.selection);
  assert.strictEqual(changed.mapCamera, state.mapCamera);
  assert.strictEqual(changed.lensState, state.lensState);
  assert.equal(changed.sheet.sheetScrollPosition, 40);

  const validated = createExchangeGeographyContext({
    geographyId: "geo-1",
    label: "Example geography",
    serverRevalidated: true,
  });
  assert.equal(validated.authority, "server-revalidated");

  assert.equal(MOBILE_EXCHANGE_CLIENT_STATE_POLICY.storesAuthorization, false);
  assert.equal(MOBILE_EXCHANGE_CLIENT_STATE_POLICY.grantsProtectedRouteAccess, false);
  assert.equal(MOBILE_EXCHANGE_CLIENT_STATE_POLICY.grantsActionPermission, false);
  assert.equal(MOBILE_EXCHANGE_CLIENT_STATE_POLICY.serverRevalidatesSelectedObjects, true);
});

test("sheet, media, favorite, and record-action contracts remain presentation-safe", () => {
  assert.deepEqual([...EXCHANGE_SHEET_SNAP_POINTS], ["peek", "partial", "expanded"]);
  assert.deepEqual([...EXCHANGE_MEDIA_KINDS], [
    "organization-logo",
    "business-photo",
    "facility-photo",
    "product-image",
    "service-image",
    "project-image",
    "branded-media",
    "video-poster",
    "fallback",
  ]);

  const disabledFavorite = projectFavoriteState({
    visible: true,
    favorited: null,
    operational: false,
    applicable: true,
    authorized: true,
    handler: null,
  });
  assert.equal(disabledFavorite.availability, "disabled");
  assert.equal(disabledFavorite.disabledReason, "not-operational");
  assert.equal(disabledFavorite.disabledExplanationKey, MOBILE_EXCHANGE_UNAVAILABLE_EXPLANATION_KEY);
  assert.equal(disabledFavorite.handler, null);
  assert.equal(disabledFavorite.persistenceOwner, "domain");

  const unauthorizedAction = projectRecordAction({
    id: "record.connect",
    labelKey: "recordActions.connect",
    operational: true,
    applicable: true,
    authorized: false,
    handler: { kind: "intent", intent: "connect" },
  });
  assert.equal(unauthorizedAction.authorized, false);
  assert.equal(unauthorizedAction.availability, "disabled");
  assert.equal(unauthorizedAction.disabledReason, "not-authorized");
  assert.equal(unauthorizedAction.disabledExplanationKey, MOBILE_EXCHANGE_UNAVAILABLE_EXPLANATION_KEY);
  assert.equal(unauthorizedAction.handler, null);
});
