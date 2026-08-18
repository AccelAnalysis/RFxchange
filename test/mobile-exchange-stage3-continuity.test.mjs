import assert from "node:assert/strict";
import test from "node:test";

import {
  createExchangeGeographyContext,
  createExchangeMapObjectProjection,
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

function discovery() {
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
    canonicalHref: "/resources/resource-1",
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
    resultSetId: "set-1",
    focalIdentity: null,
    focalSubjectAuthorized: true,
    associatedOrganizationAuthorized: true,
    relationshipAuthorized: true,
    detailSubjectAuthorized: true,
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
  assert.equal(query.sheet.sheetSnapPoint, "partial");
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
  assert.equal(opened.detail.status, "open");
  assert.equal(opened.sheet.content, "detail");
  assert.equal(opened.selection.selectionKey, resourceIdentity.selectionKey);
  assert.equal(opened.detailNavigation.returnSnapshot.query.search, "resource");

  const closed = closeMobileExchangeDetail(opened, { currentScope: serverResult().expectedScope, stillAuthorized: true });
  assert.equal(closed.state.detail.status, "closed");
  assert.equal(closed.state.sheet.content, "results");
  assert.equal(closed.state.activeLens, "resources");
  assert.deepEqual(closed.state.mapCamera, context.camera);
  assert.deepEqual(closed.state.mapBounds, { west: -77, south: 36, east: -76, north: 37 });
  assert.equal(closed.state.lensState.resources.search, "resource");
  assert.equal(closed.state.lensState.resources.listScrollPosition, 20);
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
    serverResult({ focalIdentity: resourceIdentity }),
  );
  assert.equal(authorized.status, "accepted");
  assert.equal(authorized.state.detail.status, "open");
  assert.equal(authorized.state.selection.selectionKey, resourceIdentity.selectionKey);

  const denied = reconcileServerRevalidatedMobileExchangeProjection(
    pending,
    mobileExchangeQueryContext(pending, { queryId: "query-1" }),
    discovery(),
    serverResult({ focalIdentity: null, focalSubjectAuthorized: true, detailSubjectAuthorized: false }),
  );
  assert.equal(denied.status, "rejected");
  assert.equal(denied.reason, "detail-authority-changed");
  assert.equal(denied.safeState.selection.kind, "none");

  const changedScope = { ...serverResult().expectedScope, membershipId: "membership-2" };
  const safelyClosed = closeMobileExchangeDetail(pending, { currentScope: changedScope, stillAuthorized: true });
  assert.equal(safelyClosed.state.selection.kind, "none");
  assert.equal(safelyClosed.state.activeProjection, null);
  assert.equal(safelyClosed.returnHref, "/resources");
  assert.equal(safelyClosed.focusReturnKey, null);
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
  const incomplete = serverResult();
  delete incomplete.detailSubjectAuthorized;
  assert.throws(
    () => reconcileServerRevalidatedMobileExchangeProjection(state, query, discovery(), incomplete),
    /explicitly resolve detail subject authority/,
  );
});
