import assert from "node:assert/strict";
import test from "node:test";

import {
  createExchangeGeographyContext,
  createExchangeMapObjectProjection,
  createExchangeSelectionState,
  createExchangeSubjectIdentity,
  createLensDiscoveryProjection,
  createLensMapProjection,
  createLensResultCardModel,
  createLensResultSetState,
  projectDomainOwnedSaveState,
} from "../src/application/participant/mobile-exchange-contracts.ts";
import {
  beginMobileExchangeDeepLink,
  closeMobileExchangeDetail,
  createMobileExchangeStage3ContinuityState,
  migrateParticipantSpatialContextToMobileExchangeContinuity,
  mobileExchangeDetailContext,
  mobileExchangeContinuityScope,
  mobileExchangeQueryContext,
  openMobileExchangeDetailFromProjection,
  reconcileServerRevalidatedMobileExchangeProjection,
  withDomainRevalidatedMobileExchangeLayers,
  withServerRevalidatedMobileExchangeGeography,
} from "../src/application/participant/mobile-exchange-continuity.ts";

const lensState = (search, scroll) => ({ search, filters: { category: "fabrication" }, resultPage: 2, resultIndex: 3, listScrollTop: scroll });
const context = {
  version: 2,
  scope: { participantId: "participant-1", membershipId: "membership-1", organizationId: "org-home", geographyId: "geo-1" },
  activeLens: "resources",
  selection: { organizationId: "org-home", markerId: "marker-home", relationshipId: null },
  camera: { longitude: -76.7, latitude: 36.8, zoom: 11, pitch: 0, bearing: 0, viewMode: "2d" },
  lensState: {
    "opportunities-rfx": lensState("opportunity", 10),
    resources: lensState("resource", 20),
    intelligence: lensState("intelligence", 30),
    capabilities: lensState("capability", 40),
  },
  workflowState: { referrals: lensState("referral", 50) },
  panelOpen: true,
  sheetSnapPoint: "expanded",
  sheetScrollTop: 999,
  originLens: "resources",
  returnHref: "/resources",
};

const resourceIdentity = createExchangeSubjectIdentity({
  subjectKind: "record",
  selectionKey: "record:resource-1",
  organizationId: "org-provider",
  recordType: "resource",
  recordId: "resource-1",
});

function stage3State() {
  let base = migrateParticipantSpatialContextToMobileExchangeContinuity(context, { sessionContextId: "session-1" });
  base = withServerRevalidatedMobileExchangeGeography(base, { geographyId: "geo-1", label: "Example" });
  base = withDomainRevalidatedMobileExchangeLayers(base, { lens: "resources", activeLayerIds: ["resources"], availableLayerIds: ["resources"] });
  base = Object.freeze({ ...base, mapBounds: Object.freeze({ west: -77, south: 36, east: -76, north: 37 }) });
  return createMobileExchangeStage3ContinuityState(base, { locale: "en-US" });
}

function discovery(canonicalHref = "/resources/resource-1") {
  const mapObject = createExchangeMapObjectProjection({
    identity: resourceIdentity,
    markerId: "marker-resource-1",
    coordinate: { longitude: -76.71, latitude: 36.81 },
    privacy: "approximate",
    accessibleLabel: "Resource record",
    selectable: true,
    layerIds: ["resources"],
  });
  const save = projectDomainOwnedSaveState({ visible: false, favorited: null, operational: false, applicable: false, authorized: false, handler: null });
  const card = createLensResultCardModel({
    lens: "resources",
    identity: resourceIdentity,
    title: "Resource record",
    favorite: save,
    canonicalHref,
    returnLens: "resources",
  });
  return createLensDiscoveryProjection({
    lens: "resources",
    queryId: "query-1",
    map: createLensMapProjection({
      lens: "resources",
      geography: createExchangeGeographyContext({ geographyId: "geo-1", serverRevalidated: true }),
      objects: [mapObject],
      activeLayerIds: ["resources"],
      layerStateAuthority: "domain-revalidated",
      camera: context.camera,
      bounds: { west: -77, south: 36, east: -76, north: 37 },
    }),
    results: createLensResultSetState({ status: "ready", lens: "resources", resultSetId: "set-1", cards: [card] }),
    spatialResults: [{ kind: "mapped", identity: resourceIdentity, markerId: "marker-resource-1" }],
  });
}

function serverResult(overrides = {}) {
  const queryIdentity = mobileExchangeQueryContext(stage3State(), { queryId: "query-1" }).query.requestIdentity;
  return {
    expectedVersion: 2,
    expectedScope: mobileExchangeContinuityScope({
      sessionContextId: "session-1",
      participantId: "participant-1",
      membershipId: "membership-1",
      viewerOrganizationId: "org-home",
      geographyId: "geo-1",
    }),
    lens: "resources",
    locale: "en-US",
    geographyId: "geo-1",
    queryId: "query-1",
    queryIdentity,
    resultSetId: "set-1",
    focalIdentity: stage3State().selection.focalIdentity,
    focalSubjectAuthorized: true,
    associatedOrganizationAuthorized: true,
    relationshipAuthorized: true,
    detailSubjectAuthorized: true,
    detailCanonicalHref: null,
    ...overrides,
  };
}

function closeRevalidation(selection, overrides = {}) {
  return {
    currentScope: serverResult().expectedScope,
    detailStillAuthorized: true,
    returnContextAuthorized: true,
    returnFocalSubjectAuthorized: true,
    returnAssociatedOrganizationAuthorized: true,
    returnRelationshipAuthorized: true,
    revalidatedReturnSelection: selection,
    ...overrides,
  };
}

test("the one query context carries exact scope, locale, spatial, list, selection, and sheet state without granting authority", () => {
  const state = stage3State();
  const query = mobileExchangeQueryContext(state, { queryId: "query-1" });
  assert.equal(query.query.locale, "en-US");
  assert.equal(query.query.lens, "resources");
  assert.equal(query.scope.membershipId, "membership-1");
  assert.deepEqual(query.query.camera, context.camera);
  assert.deepEqual(query.query.bounds, { west: -77, south: 36, east: -76, north: 37 });
  assert.equal(query.query.search, "resource");
  assert.deepEqual(query.query.filters, { category: "fabrication" });
  assert.equal(query.resultIndex, 3);
  assert.equal(query.listScrollPosition, 20);
  assert.equal(query.sheet.sheetSnapPoint, "expanded");
  assert.equal(query.sheet.sheetScrollPosition, 999);
  assert.equal(query.clientStateGrantsAuthority, false);
});

test("accepted server projection enables card/map/keyboard detail and close restores the full return snapshot", () => {
  const initial = stage3State();
  const query = mobileExchangeQueryContext(initial, { queryId: "query-1" });
  const accepted = reconcileServerRevalidatedMobileExchangeProjection(initial, query, discovery(), serverResult());
  assert.equal(accepted.status, "accepted");
  const opened = openMobileExchangeDetailFromProjection(accepted.state, {
    source: "keyboard",
    identity: resourceIdentity,
    queryId: "query-1",
    focusReturnKey: "card:record:resource-1",
    returnHref: "/resources?selected=resource-1",
  });
  assert.equal(opened.detail.status, "opening");
  assert.equal(opened.sheet.content, "detail");
  assert.equal(opened.selection.selectionKey, resourceIdentity.selectionKey);
  assert.equal(opened.detailNavigation.returnSnapshot.query.search, "resource");
  const crossLensReturn = openMobileExchangeDetailFromProjection(accepted.state, {
    source: "card",
    identity: resourceIdentity,
    queryId: "query-1",
    focusReturnKey: "card:record:resource-1",
    returnHref: "/opportunities?selected=resource-1",
  });
  assert.equal(crossLensReturn.detailNavigation.returnSnapshot.returnHref, "/resources");
  const intelligenceReturn = mobileExchangeDetailContext({
    identity: resourceIdentity,
    canonicalHref: "/geography/canvas?record=resource-1",
    returnLens: "intelligence",
  }, { returnHref: "/geography/canvas?lens=capabilities" });
  assert.equal(intelligenceReturn.returnHref, "/geography/canvas");
  const capabilitiesReturn = mobileExchangeDetailContext({
    identity: resourceIdentity,
    canonicalHref: "/geography/canvas?lens=capabilities&record=resource-1",
    returnLens: "capabilities",
  }, { returnHref: "/geography/canvas" });
  assert.equal(capabilitiesReturn.returnHref, "/geography/canvas?lens=capabilities");

  const detailAccepted = reconcileServerRevalidatedMobileExchangeProjection(
    opened,
    mobileExchangeQueryContext(opened, { queryId: "query-1" }),
    discovery(),
    serverResult({ focalIdentity: resourceIdentity, detailCanonicalHref: "/resources/resource-1" }),
  );
  assert.equal(detailAccepted.status, "accepted");
  assert.equal(detailAccepted.state.detail.status, "open");

  const closed = closeMobileExchangeDetail(detailAccepted.state, closeRevalidation(initial.selection));
  assert.equal(closed.state.detail.status, "closed");
  assert.equal(closed.state.sheet.content, "results");
  assert.equal(closed.state.activeLens, "resources");
  assert.deepEqual(closed.state.mapCamera, context.camera);
  assert.deepEqual(closed.state.mapBounds, { west: -77, south: 36, east: -76, north: 37 });
  assert.equal(closed.state.lensState.resources.search, "resource");
  assert.equal(closed.state.lensState.resources.listScrollPosition, 20);
  assert.equal(closed.state.lensState.resources.resultSetId, null);
  assert.equal(closed.state.activeProjection, null);
  assert.equal(closed.state.sheet.sheetSnapPoint, "expanded");
  assert.equal(closed.state.sheet.sheetScrollPosition, 999);
  assert.equal(closed.returnHref, "/resources?selected=resource-1");
  assert.equal(closed.focusReturnKey, "card:record:resource-1");
});

test("deep links disclose no record until exact affirmative revalidation and scope changes prevent stale restoration", () => {
  const initial = stage3State();
  const pending = beginMobileExchangeDeepLink(initial, {
    requestedIdentity: resourceIdentity,
    canonicalHref: "/resources/resource-1",
    returnLens: "resources",
    queryId: "query-1",
    returnHref: "https://example.com/not-allowed",
  });
  assert.equal(pending.detail.status, "opening");
  assert.strictEqual(pending.selection, initial.selection);
  assert.equal(pending.detail.detailContext.canonicalHref, "/resources/resource-1");
  assert.throws(() => beginMobileExchangeDeepLink(initial, {
    requestedIdentity: resourceIdentity,
    canonicalHref: "https://example.com/private",
    returnLens: "intelligence",
    queryId: "query-1",
  }), /preserve the active origin lens/);

  const authorized = reconcileServerRevalidatedMobileExchangeProjection(
    pending,
    mobileExchangeQueryContext(pending, { queryId: "query-1" }),
    discovery(),
    serverResult({ focalIdentity: resourceIdentity, detailCanonicalHref: "/resources/resource-1" }),
  );
  assert.equal(authorized.status, "accepted");
  assert.equal(authorized.state.detail.status, "open");
  assert.equal(authorized.state.selection.selectionKey, resourceIdentity.selectionKey);

  const revokedWhileOpen = reconcileServerRevalidatedMobileExchangeProjection(
    authorized.state,
    mobileExchangeQueryContext(authorized.state, { queryId: "query-1" }),
    discovery(),
    serverResult({
      focalIdentity: resourceIdentity,
      focalSubjectAuthorized: true,
      detailSubjectAuthorized: false,
      detailCanonicalHref: "/resources/resource-1",
    }),
  );
  assert.equal(revokedWhileOpen.status, "rejected");
  assert.equal(revokedWhileOpen.reason, "detail-authority-changed");
  assert.equal(revokedWhileOpen.safeState.selection.kind, "none");
  assert.equal(revokedWhileOpen.safeState.sheet.content, "results");
  assert.equal(revokedWhileOpen.safeState.detail.status, "error");

  for (const stateWithDetail of [pending, authorized.state]) {
    const focalRevoked = reconcileServerRevalidatedMobileExchangeProjection(
      stateWithDetail,
      mobileExchangeQueryContext(stateWithDetail, { queryId: "query-1" }),
      discovery(),
      serverResult({
        focalIdentity: resourceIdentity,
        focalSubjectAuthorized: false,
        detailSubjectAuthorized: true,
        detailCanonicalHref: "/resources/resource-1",
      }),
    );
    assert.equal(focalRevoked.status, "rejected");
    assert.equal(focalRevoked.safeState.detailNavigation.status, "closed");
    assert.equal(focalRevoked.safeState.detailNavigation.returnSnapshot, null);
    assert.equal(focalRevoked.safeState.detailNavigation.context, null);
  }

  const denied = reconcileServerRevalidatedMobileExchangeProjection(
    pending,
    mobileExchangeQueryContext(pending, { queryId: "query-1" }),
    discovery(),
    serverResult({ focalIdentity: null, focalSubjectAuthorized: true, detailSubjectAuthorized: false, detailCanonicalHref: "/resources/resource-1" }),
  );
  assert.equal(denied.status, "rejected");
  assert.equal(denied.reason, "detail-authority-changed");
  assert.equal(denied.safeState.selection.kind, "none");

  const wrongCanonical = reconcileServerRevalidatedMobileExchangeProjection(
    pending,
    mobileExchangeQueryContext(pending, { queryId: "query-1" }),
    discovery(),
    serverResult({ focalIdentity: resourceIdentity, detailCanonicalHref: "/resources/a-different-record" }),
  );
  assert.equal(wrongCanonical.status, "rejected");
  assert.equal(wrongCanonical.reason, "detail-authority-changed");

  const changedScope = { ...serverResult().expectedScope, membershipId: "membership-2" };
  const safelyClosed = closeMobileExchangeDetail(
    pending,
    closeRevalidation(initial.selection, { currentScope: changedScope }),
  );
  assert.equal(safelyClosed.state, null);
  assert.equal(safelyClosed.returnHref, "/resources");
  assert.equal(safelyClosed.focusReturnKey, null);
});

test("closing detail independently revalidates the return-snapshot selection", () => {
  const initial = stage3State();
  const accepted = reconcileServerRevalidatedMobileExchangeProjection(
    initial,
    mobileExchangeQueryContext(initial, { queryId: "query-1" }),
    discovery(),
    serverResult(),
  );
  assert.equal(accepted.status, "accepted");
  const opening = openMobileExchangeDetailFromProjection(accepted.state, {
    source: "card",
    identity: resourceIdentity,
    queryId: "query-1",
    focusReturnKey: "card:record:resource-1",
    returnHref: "/resources?selected=org-home",
  });
  const opened = reconcileServerRevalidatedMobileExchangeProjection(
    opening,
    mobileExchangeQueryContext(opening, { queryId: "query-1" }),
    discovery(),
    serverResult({ focalIdentity: resourceIdentity, detailCanonicalHref: "/resources/resource-1" }),
  );
  assert.equal(opened.status, "accepted");

  const mismatchedSelection = createExchangeSelectionState({
    kind: "record",
    source: "detail",
    selectedRecord: {
      selectionKey: resourceIdentity.selectionKey,
      recordType: resourceIdentity.recordType,
      recordId: resourceIdentity.recordId,
      organizationId: resourceIdentity.organizationId,
    },
  });
  const mismatchedReturnIdentity = closeMobileExchangeDetail(
    opened.state,
    closeRevalidation(mismatchedSelection),
  );
  assert.equal(mismatchedReturnIdentity.state.selection.kind, "none");
  assert.equal(mismatchedReturnIdentity.returnHref, "/resources");
  assert.equal(mismatchedReturnIdentity.focusReturnKey, null);

  const revokedReturnIdentity = closeMobileExchangeDetail(
    opened.state,
    closeRevalidation(initial.selection, {
      returnContextAuthorized: false,
      revalidatedReturnSelection: null,
    }),
  );
  assert.equal(revokedReturnIdentity.state.selection.kind, "none");
  assert.equal(revokedReturnIdentity.returnHref, "/resources");
  assert.equal(revokedReturnIdentity.focusReturnKey, null);

  assert.throws(
    () => closeMobileExchangeDetail(opened.state, {
      currentScope: serverResult().expectedScope,
      detailStillAuthorized: true,
    }),
    /explicit detail, return-context, and selection authorization results/,
  );
});

test("detail close binds the complete focal, association, relationship, marker, and return context", () => {
  const carriedSelection = createExchangeSelectionState({
    kind: "record",
    source: "list",
    selectedRecord: {
      selectionKey: resourceIdentity.selectionKey,
      recordType: resourceIdentity.recordType,
      recordId: resourceIdentity.recordId,
      organizationId: resourceIdentity.organizationId,
    },
    selectedOrganization: {
      selectionKey: "organization:org-provider",
      organizationId: "org-provider",
      associationRole: "associated",
    },
    selectedMarker: {
      selectionKey: "organization:org-provider",
      markerId: "marker-provider",
      role: "associated-organization",
    },
    selectedRelationship: {
      relationshipId: "relationship-private",
      authority: "carried-unvalidated",
    },
  });
  const revalidatedSelection = createExchangeSelectionState({
    kind: "record",
    source: "restored",
    selectedRecord: carriedSelection.selectedRecord,
    selectedOrganization: carriedSelection.selectedOrganization,
    selectedMarker: carriedSelection.selectedMarker,
    selectedRelationship: {
      relationshipId: "relationship-private",
      authority: "server-revalidated",
    },
  });
  const initial = Object.freeze({ ...stage3State(), selection: carriedSelection });
  const accepted = reconcileServerRevalidatedMobileExchangeProjection(
    initial,
    mobileExchangeQueryContext(initial, { queryId: "query-1" }),
    discovery(),
    serverResult({ focalIdentity: resourceIdentity }),
  );
  assert.equal(accepted.status, "accepted");
  const opening = openMobileExchangeDetailFromProjection(accepted.state, {
    source: "card",
    identity: resourceIdentity,
    queryId: "query-1",
    focusReturnKey: "card:record:resource-1",
    returnHref: "/resources?selected=resource-1",
  });
  const opened = reconcileServerRevalidatedMobileExchangeProjection(
    opening,
    mobileExchangeQueryContext(opening, { queryId: "query-1" }),
    discovery(),
    serverResult({ focalIdentity: resourceIdentity, detailCanonicalHref: "/resources/resource-1" }),
  );
  assert.equal(opened.status, "accepted");

  const restored = closeMobileExchangeDetail(opened.state, closeRevalidation(revalidatedSelection));
  assert.deepEqual(restored.state.selection, revalidatedSelection);
  assert.equal(restored.returnHref, "/resources?selected=resource-1");

  const changedMarker = createExchangeSelectionState({
    kind: "record",
    source: "restored",
    selectedRecord: carriedSelection.selectedRecord,
    selectedOrganization: carriedSelection.selectedOrganization,
    selectedMarker: {
      selectionKey: "organization:org-provider",
      markerId: "marker-different",
      role: "associated-organization",
    },
    selectedRelationship: revalidatedSelection.selectedRelationship,
  });
  for (const closeInput of [
    closeRevalidation(changedMarker),
    closeRevalidation(revalidatedSelection, { returnAssociatedOrganizationAuthorized: false }),
    closeRevalidation(revalidatedSelection, { returnRelationshipAuthorized: false }),
  ]) {
    const rejected = closeMobileExchangeDetail(opened.state, closeInput);
    assert.equal(rejected.state.selection.kind, "none");
    assert.equal(rejected.returnHref, "/resources");
    assert.equal(rejected.focusReturnKey, null);
  }
});

test("an explicitly denied return context is sanitized even when its snapshot selection is empty", () => {
  const emptySelection = createExchangeSelectionState({ kind: "none" });
  const initial = Object.freeze({ ...stage3State(), selection: emptySelection });
  const accepted = reconcileServerRevalidatedMobileExchangeProjection(
    initial,
    mobileExchangeQueryContext(initial, { queryId: "query-1" }),
    discovery(),
    serverResult({ focalIdentity: null }),
  );
  assert.equal(accepted.status, "accepted");
  const opening = openMobileExchangeDetailFromProjection(accepted.state, {
    source: "card",
    identity: resourceIdentity,
    queryId: "query-1",
    focusReturnKey: "card:private",
    returnHref: "/resources?selected=private",
  });
  const opened = reconcileServerRevalidatedMobileExchangeProjection(
    opening,
    mobileExchangeQueryContext(opening, { queryId: "query-1" }),
    discovery(),
    serverResult({ focalIdentity: resourceIdentity, detailCanonicalHref: "/resources/resource-1" }),
  );
  assert.equal(opened.status, "accepted");
  const closed = closeMobileExchangeDetail(
    opened.state,
    closeRevalidation(emptySelection, { returnContextAuthorized: false }),
  );
  assert.equal(closed.state.selection.kind, "none");
  assert.equal(closed.returnHref, "/resources");
  assert.equal(closed.focusReturnKey, null);
});

test("list-only records remain card/keyboard targets and cannot masquerade as map entry", () => {
  const initial = stage3State();
  const mapped = discovery();
  const listOnlyObject = createExchangeMapObjectProjection({
    identity: resourceIdentity,
    markerId: "marker-resource-1",
    coordinate: null,
    privacy: "locality-only",
    accessibleLabel: "Resource available in list only",
    selectable: true,
    layerIds: ["resources"],
  });
  const listOnlyDiscovery = createLensDiscoveryProjection({
    lens: "resources",
    queryId: "query-1",
    map: createLensMapProjection({
      ...mapped.map,
      objects: [listOnlyObject],
    }),
    results: mapped.results,
    spatialResults: [{
      kind: "list-only",
      identity: resourceIdentity,
      reason: "missing-authoritative-coordinate",
      explanationKey: "resources.locationUnavailable",
    }],
  });
  const accepted = reconcileServerRevalidatedMobileExchangeProjection(
    initial,
    mobileExchangeQueryContext(initial, { queryId: "query-1" }),
    listOnlyDiscovery,
    serverResult(),
  );
  assert.equal(accepted.status, "accepted");
  assert.throws(() => openMobileExchangeDetailFromProjection(accepted.state, {
    source: "map",
    identity: resourceIdentity,
    queryId: "query-1",
    focusReturnKey: "map:record:resource-1",
  }), /visible selectable mapped disposition/);
  const fromCard = openMobileExchangeDetailFromProjection(accepted.state, {
    source: "card",
    identity: resourceIdentity,
    queryId: "query-1",
    focusReturnKey: "card:record:resource-1",
  });
  assert.equal(fromCard.detail.status, "opening");
  assert.equal(fromCard.selection.selectedMarker, null);
});

test("a card without a canonical detail destination cannot begin detail authorization", () => {
  const initial = stage3State();
  const projection = discovery(null);
  const accepted = reconcileServerRevalidatedMobileExchangeProjection(
    initial,
    mobileExchangeQueryContext(initial, { queryId: "query-1" }),
    projection,
    serverResult(),
  );
  assert.equal(accepted.status, "accepted");
  assert.throws(() => openMobileExchangeDetailFromProjection(accepted.state, {
    source: "card",
    identity: resourceIdentity,
    queryId: "query-1",
    focusReturnKey: "card:record:resource-1",
  }), /canonical destination/);
});

test("stale locale, query, result-set, and lens responses fail closed", () => {
  const state = stage3State();
  const query = mobileExchangeQueryContext(state, { queryId: "query-1" });
  for (const [overrides, reason] of [
    [{ locale: "fr" }, "locale-changed"],
    [{ queryId: "query-old" }, "query-changed"],
    [{ resultSetId: "set-old" }, "result-set-changed"],
    [{ lens: "intelligence" }, "lens-changed"],
  ]) {
    const result = reconcileServerRevalidatedMobileExchangeProjection(state, query, discovery(), serverResult(overrides));
    assert.equal(result.status, "rejected");
    assert.equal(result.reason, reason);
  }
  const withResourceState = (changes) => Object.freeze({
    ...state,
    lensState: Object.freeze({
      ...state.lensState,
      resources: Object.freeze({ ...state.lensState.resources, ...changes }),
    }),
  });
  const staleStates = [
    withResourceState({ search: "changed-after-request" }),
    withResourceState({ filters: Object.freeze({ category: "construction" }) }),
    withResourceState({ sort: Object.freeze({ id: "date", direction: "descending" }) }),
    withResourceState({ cursor: "next-page" }),
    withResourceState({ resultPage: 3 }),
    Object.freeze({ ...state, mapCamera: Object.freeze({ ...state.mapCamera, zoom: 12 }) }),
    Object.freeze({ ...state, mapBounds: Object.freeze({ ...state.mapBounds, west: -78 }) }),
  ];
  for (const staleState of staleStates) {
    const staleSameId = reconcileServerRevalidatedMobileExchangeProjection(
      staleState,
      query,
      discovery(),
      serverResult(),
    );
    assert.equal(staleSameId.status, "rejected");
    assert.equal(staleSameId.reason, "query-changed");
  }
  const missingSelectedIdentity = reconcileServerRevalidatedMobileExchangeProjection(
    state,
    query,
    discovery(),
    serverResult({ focalIdentity: null }),
  );
  assert.equal(missingSelectedIdentity.status, "rejected");
  assert.equal(missingSelectedIdentity.reason, "selected-object-authority-changed");
  const unselected = Object.freeze({ ...state, selection: createExchangeSelectionState({ kind: "none" }) });
  const unselectedAccepted = reconcileServerRevalidatedMobileExchangeProjection(
    unselected,
    mobileExchangeQueryContext(unselected, { queryId: "query-1" }),
    discovery(),
    serverResult({ focalIdentity: null }),
  );
  assert.equal(unselectedAccepted.status, "accepted");
  const incomplete = serverResult();
  delete incomplete.detailSubjectAuthorized;
  assert.throws(
    () => reconcileServerRevalidatedMobileExchangeProjection(state, query, discovery(), incomplete),
    /explicitly resolve detail subject authority/,
  );
});
