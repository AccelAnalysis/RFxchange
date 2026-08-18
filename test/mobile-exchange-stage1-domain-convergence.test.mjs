import assert from "node:assert/strict";
import test from "node:test";

import {
  createExchangeMapAreaProjection,
  createExchangeMapObjectProjection,
  createExchangeMapRelationshipProjection,
  createExchangeMediaModel,
  createExchangeSelectionState,
  createExchangeSubjectIdentity,
  selectionMatchesMapObject,
  transitionMobileExchangeLens,
} from "../src/application/participant/mobile-exchange-contracts.ts";
import {
  migrateParticipantSpatialContextToMobileExchangeContinuity,
  mobileExchangeContinuityScope,
  reconcileMobileExchangeContinuity,
  transitionMobileExchangeContinuityLens,
  withDomainRevalidatedMobileExchangeLayers,
} from "../src/application/participant/mobile-exchange-continuity.ts";

const lensState = (search, listScrollTop) => ({
  search,
  filters: {},
  resultPage: 1,
  resultIndex: 0,
  listScrollTop,
});

function spatialContext({ relationshipId = null } = {}) {
  return {
    version: 2,
    scope: {
      participantId: "participant-1",
      membershipId: "membership-1",
      organizationId: "org-home",
      geographyId: "geo-1",
    },
    activeLens: "capabilities",
    selection: {
      organizationId: "org-counterparty",
      markerId: "marker-org-counterparty",
      relationshipId,
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
      "opportunities-rfx": lensState("", 10),
      resources: lensState("", 20),
      intelligence: lensState("", 30),
      capabilities: lensState("", 40),
    },
    workflowState: { referrals: lensState("", 50) },
    panelOpen: true,
    originLens: "intelligence",
    returnHref: "/geography/canvas",
  };
}

function expectedScope() {
  return mobileExchangeContinuityScope({
    sessionContextId: "session-1",
    participantId: "participant-1",
    membershipId: "membership-1",
    viewerOrganizationId: "org-home",
    geographyId: "geo-1",
  });
}

test("Opportunity focal record and issuer organization retain distinct canonical identities", () => {
  const selection = createExchangeSelectionState({
    kind: "record",
    source: "card",
    selectedRecord: {
      selectionKey: "opportunity:opp-1",
      recordType: "opportunity",
      recordId: "opp-1",
      organizationId: "org-issuer",
    },
    selectedOrganization: {
      selectionKey: "organization:org-issuer",
      organizationId: "org-issuer",
      associationRole: "issuer",
    },
    selectedMarker: {
      selectionKey: "opportunity:opp-1",
      markerId: "marker-opp-1",
      role: "focal",
    },
  });

  assert.equal(selection.selectionKey, "opportunity:opp-1");
  assert.equal(selection.focalIdentity.selectionKey, "opportunity:opp-1");
  assert.equal(selection.selectedOrganization.selectionKey, "organization:org-issuer");
  assert.equal(selection.selectedOrganization.associationRole, "issuer");
  assert.notEqual(selection.selectionKey, selection.selectedOrganization.selectionKey);

  const base = migrateParticipantSpatialContextToMobileExchangeContinuity(spatialContext(), {
    sessionContextId: "session-1",
  });
  const state = Object.freeze({ ...base, activeLens: "opportunities-rfx", selection });
  const changed = transitionMobileExchangeContinuityLens(state, "intelligence");
  assert.strictEqual(changed.selection, selection);
  assert.strictEqual(changed.mapCamera, state.mapCamera);
  assert.equal(changed.selection.selectedOrganization.organizationId, "org-issuer");
});

test("Resource focal record and provider organization coexist while service territory remains a non-point field", () => {
  const selection = createExchangeSelectionState({
    kind: "record",
    source: "map",
    selectedRecord: {
      selectionKey: "resource:resource-1",
      recordType: "resource",
      recordId: "resource-1",
      organizationId: "org-provider",
    },
    selectedOrganization: {
      selectionKey: "organization:org-provider",
      organizationId: "org-provider",
      associationRole: "provider",
    },
  });
  assert.equal(selection.selectionKey, "resource:resource-1");
  assert.equal(selection.selectedOrganization.selectionKey, "organization:org-provider");

  const territory = createExchangeMapAreaProjection({
    areaId: "service-territory:resource-1",
    associationSelectionKey: "resource:resource-1",
    geographyId: "service-geo-7",
    geometryReference: "geography:service-geo-7",
    privacy: "locality-only",
    release: "released",
    accessibleLabel: "Provider service territory",
    selectable: true,
    selected: true,
    emphasized: false,
    layerIds: ["resources.service-territory"],
  });
  assert.equal(territory.kind, "area");
  assert.equal(territory.geographyId, "service-geo-7");
  assert.equal(territory.authoritySource, "server-derived");
  assert.ok(!("coordinate" in territory));
});

test("Referral can narrow from focal record to independently valid counterparty organization without spatial reset", () => {
  const base = migrateParticipantSpatialContextToMobileExchangeContinuity(
    spatialContext({ relationshipId: "referral:relationship-1" }),
    { sessionContextId: "session-1" },
  );
  const referralSelection = createExchangeSelectionState({
    kind: "record",
    source: "detail",
    selectedRecord: {
      selectionKey: "referral:ref-1",
      recordType: "referral",
      recordId: "ref-1",
      organizationId: "org-counterparty",
    },
    selectedOrganization: {
      selectionKey: "organization:org-counterparty",
      organizationId: "org-counterparty",
      associationRole: "counterparty",
    },
    selectedMarker: {
      selectionKey: "organization:org-counterparty",
      markerId: "marker-org-counterparty",
      role: "associated-organization",
    },
    selectedRelationship: {
      relationshipId: "referral:relationship-1",
      authority: "carried-unvalidated",
    },
  });
  const state = Object.freeze({ ...base, selection: referralSelection });

  const marker = createExchangeMapObjectProjection({
    identity: createExchangeSubjectIdentity({
      subjectKind: "organization",
      selectionKey: "organization:org-counterparty",
      organizationId: "org-counterparty",
      recordType: null,
      recordId: null,
    }),
    markerId: "marker-org-counterparty",
    coordinate: { longitude: -76.7, latitude: 36.8 },
    privacy: "approximate",
    accessibleLabel: "Counterparty organization",
    selectable: true,
  });
  assert.equal(selectionMatchesMapObject(referralSelection, marker), true);

  const decision = reconcileMobileExchangeContinuity(state, {
    expectedVersion: 2,
    expectedScope: expectedScope(),
    focalSubjectAuthorized: false,
    associatedOrganizationAuthorized: true,
    relationshipAuthorized: false,
  });
  assert.equal(decision.status, "invalid");
  assert.equal(decision.reason, "selected-object-authority-changed");
  assert.equal(decision.safeState.selection.kind, "organization");
  assert.equal(decision.safeState.selection.selectionKey, "organization:org-counterparty");
  assert.equal(decision.safeState.selection.selectedMarker.markerId, "marker-org-counterparty");
  assert.equal(decision.safeState.selection.selectedRelationship, null);
  assert.strictEqual(decision.safeState.mapCamera, state.mapCamera);
  assert.strictEqual(decision.safeState.geography, state.geography);
});

test("actual video source is distinct from its poster presentation", () => {
  const media = createExchangeMediaModel({
    kind: "video-poster",
    assetReference: "image:poster-card",
    posterReference: "image:poster-frame",
    videoSource: { assetReference: "video:intro-asset" },
    alt: "Organization introduction video",
  });
  assert.equal(media.kind, "video-poster");
  assert.equal(media.posterReference, "image:poster-frame");
  assert.equal(media.videoSource.assetReference, "video:intro-asset");
  assert.equal(media.videoSource.authoritySource, "server-derived");
  assert.notEqual(media.videoSource.assetReference, media.posterReference);

  assert.throws(
    () => createExchangeMediaModel({
      kind: "business-photo",
      videoSource: { assetReference: "video:not-a-photo" },
      alt: "Invalid media",
    }),
    /actual video source must be represented separately/,
  );
});

test("analytical layer continuity is per-lens, domain-revalidated, and unknown IDs fail out", () => {
  const base = migrateParticipantSpatialContextToMobileExchangeContinuity(spatialContext(), {
    sessionContextId: "session-1",
  });
  const validated = withDomainRevalidatedMobileExchangeLayers(base, {
    lens: "intelligence",
    activeLayerIds: ["intelligence.capability-density", "intelligence.removed-layer"],
    availableLayerIds: ["intelligence.capability-density", "intelligence.locations"],
  });
  assert.deepEqual(validated.lensState.intelligence.activeLayerIds, ["intelligence.capability-density"]);
  assert.equal(validated.lensState.intelligence.layerStateAuthority, "domain-revalidated");
  assert.deepEqual(validated.lensState.resources.activeLayerIds, []);

  const changed = transitionMobileExchangeLens(validated, "resources");
  const returned = transitionMobileExchangeLens(changed, "intelligence");
  assert.deepEqual(returned.lensState.intelligence.activeLayerIds, ["intelligence.capability-density"]);

  const projected = createExchangeMapObjectProjection({
    identity: createExchangeSubjectIdentity({
      subjectKind: "organization",
      selectionKey: "organization:org-2",
      organizationId: "org-2",
      recordType: null,
      recordId: null,
    }),
    markerId: "marker-org-2",
    coordinate: { longitude: -76.8, latitude: 36.9 },
    privacy: "approximate",
    accessibleLabel: "Organization 2",
    selectable: true,
    layerIds: ["intelligence.capability-density"],
  });
  assert.deepEqual(projected.layerIds, ["intelligence.capability-density"]);
});

test("relationship projection supports an authorized privacy-safe path and an explicit no-path state", () => {
  const path = createExchangeMapRelationshipProjection({
    relationshipId: "referral:relationship-1",
    pathState: "authorized-path",
    endpointOrganizationIds: ["org-home", "org-counterparty"],
    geometryReference: "relationship-geometry:1",
    accessibleLabel: "Authorized referral relationship",
    layerIds: ["referrals.relationships"],
  });
  assert.equal(path.pathState, "authorized-path");
  assert.deepEqual(path.endpointOrganizationIds, ["org-home", "org-counterparty"]);
  assert.equal(path.privacy, "permitted");
  assert.equal(path.authoritySource, "server-derived");

  const noPath = createExchangeMapRelationshipProjection({
    relationshipId: "referral:relationship-2",
    pathState: "no-path",
    accessibleLabel: "No relationship path available",
  });
  assert.equal(noPath.pathState, "no-path");
  assert.equal(noPath.endpointOrganizationIds, null);
  assert.equal(noPath.geometryReference, null);
  assert.equal(noPath.privacy, "suppressed");

  assert.throws(
    () => createExchangeMapRelationshipProjection({
      relationshipId: "referral:relationship-3",
      pathState: "no-path",
      endpointOrganizationIds: ["org-home", "org-private"],
      accessibleLabel: "Invalid path",
    }),
    /cannot disclose endpoints or geometry/,
  );
});
