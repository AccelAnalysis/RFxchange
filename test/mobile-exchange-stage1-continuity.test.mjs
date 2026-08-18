import assert from "node:assert/strict";
import test from "node:test";

import {
  MOBILE_EXCHANGE_ACCESSIBILITY_POLICY,
  MOBILE_EXCHANGE_STAGE1_AUTHORITY_POLICY,
  migrateParticipantSpatialContextToMobileExchangeContinuity,
  mobileExchangeContinuityScope,
  mobileExchangeDetailContext,
  mobileExchangeSearchFilter,
  reconcileMobileExchangeContinuity,
  transitionMobileExchangeContinuityLens,
  withServerRevalidatedMobileExchangeGeography,
} from "../src/application/participant/mobile-exchange-continuity.ts";
import { createExchangeSubjectIdentity } from "../src/application/participant/mobile-exchange-contracts.ts";

const lensState = (search, listScrollTop) => ({
  search,
  filters: { category: `${search}-category` },
  resultPage: 2,
  resultIndex: 3,
  listScrollTop,
});

function spatialContext() {
  return {
    version: 2,
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
      capabilities: lensState("capability", 40),
    },
    workflowState: { referrals: lensState("referral", 50) },
    panelOpen: true,
    originLens: "resources",
    returnHref: "/resources",
  };
}

test("the continuity adapter preserves current spatial state and adds exact scope and cursor seams", () => {
  const context = spatialContext();
  const state = migrateParticipantSpatialContextToMobileExchangeContinuity(context, {
    sessionContextId: "session-1",
  });

  assert.equal(state.scope.sessionContextId, "session-1");
  assert.equal(state.scope.participantId, "participant-1");
  assert.equal(state.scope.membershipId, "membership-1");
  assert.equal(state.scope.viewerOrganizationId, "org-home");
  assert.equal(state.scope.geographyId, "geo-1");
  assert.equal(state.activeLens, "intelligence");
  assert.equal(state.selection.selectedOrganization.organizationId, "org-2");
  assert.equal(state.selection.selectedMarker.markerId, "marker-org-2");
  assert.deepEqual(state.mapCamera, context.camera);
  assert.equal(state.sheet.sheetSnapPoint, "partial");
  assert.equal(state.sheet.sheetScrollPosition, 30);
  assert.equal(state.lensState.resources.search, "resource");
  assert.equal(state.lensState.resources.listScrollPosition, 20);
  assert.equal(state.lensState.resources.sheetScrollPosition, 20);
  assert.equal(state.lensState.resources.resultSetId, null);
  assert.equal(state.lensState.resources.cursor, null);
  assert.equal(state.geography.authority, "carried-unvalidated");

  const searchFilter = mobileExchangeSearchFilter(state);
  assert.equal(searchFilter.placement, "map-overlay");
  assert.equal(searchFilter.lens, "intelligence");
  assert.equal(searchFilter.search, "organization");
  assert.deepEqual(searchFilter.filters, { category: "organization-category" });
  assert.equal(searchFilter.sort, null);
  assert.equal(searchFilter.resultSetId, null);
  assert.equal(searchFilter.cursor, null);

  const changed = transitionMobileExchangeContinuityLens(state, "capabilities");
  assert.equal(changed.activeLens, "capabilities");
  assert.strictEqual(changed.scope, state.scope);
  assert.strictEqual(changed.selection, state.selection);
  assert.strictEqual(changed.mapCamera, state.mapCamera);
  assert.strictEqual(changed.lensState, state.lensState);
  assert.equal(changed.sheet.sheetScrollPosition, 40);
});

test("scope and schema changes invalidate the whole client continuity state", () => {
  const state = migrateParticipantSpatialContextToMobileExchangeContinuity(spatialContext(), {
    sessionContextId: "session-1",
  });
  const expectedScope = mobileExchangeContinuityScope({
    sessionContextId: "session-1",
    participantId: "participant-1",
    membershipId: "membership-1",
    viewerOrganizationId: "org-home",
    geographyId: "geo-1",
  });

  const valid = reconcileMobileExchangeContinuity(state, {
    expectedVersion: 2,
    expectedScope,
    selectedObjectAuthorized: true,
  });
  assert.equal(valid.status, "valid");
  assert.strictEqual(valid.safeState, state);

  for (const [field, value, reason] of [
    ["sessionContextId", "session-2", "session-changed"],
    ["participantId", "participant-2", "participant-changed"],
    ["membershipId", "membership-2", "membership-changed"],
    ["viewerOrganizationId", "org-other", "viewer-organization-changed"],
    ["geographyId", "geo-2", "geography-changed"],
  ]) {
    const decision = reconcileMobileExchangeContinuity(state, {
      expectedVersion: 2,
      expectedScope: { ...expectedScope, [field]: value },
      selectedObjectAuthorized: true,
    });
    assert.equal(decision.status, "invalid");
    assert.equal(decision.reason, reason);
    assert.equal(decision.safeState, null);
  }

  const schema = reconcileMobileExchangeContinuity(state, {
    expectedVersion: 3,
    expectedScope,
    selectedObjectAuthorized: true,
  });
  assert.equal(schema.status, "invalid");
  assert.equal(schema.reason, "schema-version-changed");
  assert.equal(schema.safeState, null);

  assert.throws(
    () => migrateParticipantSpatialContextToMobileExchangeContinuity({
      ...spatialContext(),
      version: 1,
    }),
    /Unsupported participant spatial context version/,
  );
});

test("negative selected-object revalidation removes stale focus but preserves safe continuity", () => {
  const state = migrateParticipantSpatialContextToMobileExchangeContinuity(spatialContext(), {
    sessionContextId: "session-1",
  });
  const expectedScope = mobileExchangeContinuityScope({
    sessionContextId: "session-1",
    participantId: "participant-1",
    membershipId: "membership-1",
    viewerOrganizationId: "org-home",
    geographyId: "geo-1",
  });

  const decision = reconcileMobileExchangeContinuity(state, {
    expectedVersion: 2,
    expectedScope,
    selectedObjectAuthorized: false,
  });
  assert.equal(decision.status, "invalid");
  assert.equal(decision.reason, "selected-object-authority-changed");
  assert.equal(decision.safeState.selection.kind, "none");
  assert.strictEqual(decision.safeState.mapCamera, state.mapCamera);
  assert.strictEqual(decision.safeState.lensState, state.lensState);
  assert.equal(decision.safeState.sheet.content, "results");
  assert.equal(decision.safeState.detail.status, "closed");
});

test("detail return context is same-origin, lens-bounded, identity-coherent, and focus-restorable", () => {
  const identity = createExchangeSubjectIdentity({
    subjectKind: "record",
    selectionKey: "record:opportunity-1",
    organizationId: "issuer-1",
    recordType: "opportunity",
    recordId: "opportunity-1",
  });
  const base = {
    identity,
    canonicalHref: "/opportunities/opportunity-1",
    returnLens: "opportunities-rfx",
  };

  const safe = mobileExchangeDetailContext(base, {
    returnHref: "/opportunities?selected=opportunity-1",
    focusReturnKey: "card:record:opportunity-1",
  });
  assert.strictEqual(safe.identity, identity);
  assert.equal(safe.returnHref, "/opportunities?selected=opportunity-1");
  assert.equal(safe.focusReturnKey, "card:record:opportunity-1");

  const external = mobileExchangeDetailContext(base, {
    returnHref: "https://example.com/private",
  });
  assert.equal(external.returnHref, "/opportunities");
  assert.equal(external.focusReturnKey, null);
});

test("server geography projection requires exact scope and never trusts carried geography", () => {
  const state = migrateParticipantSpatialContextToMobileExchangeContinuity(spatialContext(), {
    sessionContextId: "session-1",
  });
  assert.equal(state.geography.authority, "carried-unvalidated");

  const validated = withServerRevalidatedMobileExchangeGeography(state, {
    geographyId: "geo-1",
    label: "Example geography",
  });
  assert.equal(validated.geography.authority, "server-revalidated");
  assert.equal(validated.geography.label, "Example geography");

  assert.throws(
    () => withServerRevalidatedMobileExchangeGeography(state, {
      geographyId: "geo-other",
      label: "Wrong geography",
    }),
    /does not match the active continuity scope/,
  );
});

test("accessibility and authority policies bind Stage 2 without implementing it", () => {
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.minimumTouchTargetPx, 44);
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.safeAreaInsetsRequired, true);
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.bottomSheetClearsBottomNavigationSafeArea, true);
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.nonDragSheetPositionControlRequired, true);
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.keyboardSelectionUsesSharedState, true);
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.switchAccessUsesSharedState, true);
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.selectedAndCurrentStateNotColorOnly, true);
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.structuredListAlternativeRequired, true);
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.focusRestorationKeyRequiredForDetail, true);
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.reducedMotionRequired, true);
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.orientationResizePreservesContinuity, true);
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.softwareKeyboardPreservesReachability, true);
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.sheetScrollStateRequired, true);
  assert.equal(MOBILE_EXCHANGE_ACCESSIBILITY_POLICY.resultCursorContinuityRequired, true);

  assert.equal(MOBILE_EXCHANGE_STAGE1_AUTHORITY_POLICY.storesAuthorization, false);
  assert.equal(MOBILE_EXCHANGE_STAGE1_AUTHORITY_POLICY.grantsProtectedRouteAccess, false);
  assert.equal(MOBILE_EXCHANGE_STAGE1_AUTHORITY_POLICY.grantsActionPermission, false);
  assert.equal(MOBILE_EXCHANGE_STAGE1_AUTHORITY_POLICY.serverRevalidatesSelectedObjects, true);
  assert.equal(MOBILE_EXCHANGE_STAGE1_AUTHORITY_POLICY.scopeChangesInvalidateClientContinuity, true);
  assert.equal(MOBILE_EXCHANGE_STAGE1_AUTHORITY_POLICY.returnContextNeverGrantsAuthority, true);
  assert.equal(MOBILE_EXCHANGE_STAGE1_AUTHORITY_POLICY.carriedGeographyIsNotServerAuthority, true);
});
