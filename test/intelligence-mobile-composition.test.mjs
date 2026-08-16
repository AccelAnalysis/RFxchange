import assert from "node:assert/strict";
import test from "node:test";

import {
  CURRENT_INTELLIGENCE_ANALYTICAL_LAYER_IDS,
  INTELLIGENCE_MOBILE_COVERAGE_CAVEAT,
  projectIntelligenceMobileComposition,
} from "../src/application/intelligence/intelligence-mobile-composition.ts";
import {
  createExchangeSelectionState,
  selectionMatchesCard,
  selectionMatchesMapObject,
} from "../src/application/participant/mobile-exchange-contracts.ts";
import {
  migrateParticipantSpatialContextToMobileExchangeContinuity,
  withDomainRevalidatedMobileExchangeLayers,
} from "../src/application/participant/mobile-exchange-continuity.ts";

const lensState = (search, listScrollTop) => ({
  search,
  filters: {},
  resultPage: 1,
  resultIndex: 0,
  listScrollTop,
});

function sharedState() {
  return migrateParticipantSpatialContextToMobileExchangeContinuity({
    version: 1,
    scope: {
      participantId: "participant-1",
      membershipId: "membership-1",
      organizationId: "org-home",
      geographyId: "geo-1",
    },
    activeLens: "resources",
    selection: {
      organizationId: "org-home",
      markerId: "marker-home",
      relationshipId: null,
    },
    camera: {
      longitude: -76.7,
      latitude: 36.8,
      zoom: 11,
      pitch: 35,
      bearing: 0,
      viewMode: "perspective",
    },
    lensState: {
      "opportunities-rfx": lensState("", 10),
      resources: lensState("", 20),
      intelligence: lensState("cyber", 30),
      referrals: lensState("", 40),
    },
    panelOpen: true,
    originLens: "resources",
    returnHref: "/geography/canvas",
  }, { sessionContextId: "session-1" });
}

function mapModel() {
  return {
    selectedGeography: {
      id: "geo-1",
      countryCode: "US",
      fipsCode: "51093",
      name: "Isle of Wight County",
      type: "county",
      boundary: {
        authority: "U.S. Census Bureau",
        dataset: "TIGER/Line",
        vintage: "2025",
        sourceFeatureId: "51093",
      },
      releaseState: "released",
      limitedParticipationActivities: [],
      parentGeographyId: null,
      adjacentGeographyIds: [],
      bounds: { west: -76.9, south: 36.7, east: -76.4, north: 37.0 },
      defaultCamera: {
        center: { longitude: -76.65, latitude: 36.85 },
        pitchDegrees: 35,
        bearingDegrees: 0,
        paddingPixels: 32,
        maximumZoom: 13,
      },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    camera: {
      mode: "fit-authoritative-bounds",
      geographyId: "geo-1",
      bounds: { west: -76.9, south: 36.7, east: -76.4, north: 37.0 },
      center: { longitude: -76.65, latitude: 36.85 },
      pitchDegrees: 35,
      bearingDegrees: 0,
      paddingPixels: 32,
      maximumZoom: 13,
    },
    features: [],
    layers: [],
    attribution: {
      label: "U.S. Census Bureau",
      sourceLayerUrl: "https://example.invalid/tiger",
      vintage: "2025",
      retrievedAt: "2026-08-01T00:00:00.000Z",
    },
  };
}

function organization(overrides = {}) {
  return {
    organizationId: "org-intel-1",
    profile: {
      organizationId: "org-intel-1",
      profileId: "profile-org-intel-1",
      displayName: "Harbor Cyber LLC",
      organizationType: "for-profit-business",
      website: "https://harbor.example/",
      mainContact: null,
      capabilities: [],
      participationRoles: ["business"],
      businessObjectives: [],
      location: {
        visibility: "locality-only",
        organizationId: "org-intel-1",
        geographyId: "geo-1",
        localityName: "Isle of Wight County",
      },
      profileComplete: true,
    },
    baseGeographyId: "geo-1",
    serviceGeographyIds: ["geo-1"],
    marker: {
      id: "marker-org-intel-1",
      coordinate: [-76.62, 36.84],
      label: "Harbor Cyber LLC",
      accessibleLocationLabel: "Locality presence in Isle of Wight County",
    },
    capabilities: [{
      id: "claim-1",
      capabilityId: "cap.cyber.assessment",
      amacsReleaseVersion: "0.5.0",
      label: "Cybersecurity Assessment",
      definition: "Assessment of cybersecurity controls and risk posture.",
      domainLabel: "Technology, Data & Cybersecurity",
      familyLabel: "Cybersecurity",
      specialties: ["CMMC"],
      assertionStatus: "self_reported",
      provenanceLabel: "Organization claimed",
    }],
    match: {
      kind: "capability",
      score: 100,
      matchedCapabilityIds: ["cap.cyber.assessment"],
      matchedCapabilityNames: ["Cybersecurity Assessment"],
      source: "confirmed-structured",
    },
    ...overrides,
  };
}

function discovery(organizations = [organization()]) {
  return {
    query: {
      capability: "cyber",
      baseGeographyId: "geo-1",
      serviceGeographyId: null,
      page: 1,
    },
    organizations,
    totalMatched: organizations.length,
    page: 1,
    pageCount: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

function publicEnrichment() {
  return {
    "org-intel-1": {
      assets: [{
        id: "asset-logo-1",
        organizationId: "org-intel-1",
        kind: "logo",
        title: "Harbor Cyber logo",
        description: null,
        altText: "Harbor Cyber LLC logo",
        deliveryPath: "/api/organization-enrichment/assets/asset-logo-1",
        provenanceLabel: "Organization published",
      }],
      additionalLocations: [
        {
          id: "location-1",
          organizationId: "org-intel-1",
          label: "Operations Center",
          geographyId: "geo-1",
          localityName: "Isle of Wight County",
          visibility: "approximate",
          coordinate: [-76.58, 36.86],
          relationship: "subordinate-location",
        },
        {
          id: "location-2",
          organizationId: "org-intel-1",
          label: "Private Home Office",
          geographyId: "geo-1",
          localityName: "Isle of Wight County",
          visibility: "locality-only",
          relationship: "subordinate-location",
        },
      ],
    },
  };
}

test("binds authorized organization, geography and AMACS capability context into shared mobile contracts", () => {
  const focus = organization();
  const composition = projectIntelligenceMobileComposition({
    state: sharedState(),
    viewerOrganizationId: "org-home",
    mapModel: mapModel(),
    discovery: discovery([focus]),
    focusedOrganization: focus,
    publicEnrichmentByOrganizationId: publicEnrichment(),
    intelligenceHref: "/geography/canvas?q=cyber&serviceArea=geo-1",
  });

  assert.equal(composition.lens, "intelligence");
  assert.equal(composition.state.activeLens, "intelligence");
  assert.equal(composition.mapProjection.geography.geographyId, "geo-1");
  assert.equal(composition.mapProjection.geography.authority, "server-revalidated");
  assert.deepEqual(composition.mapProjection.bounds, mapModel().selectedGeography.bounds);
  assert.equal(composition.cards.length, 1);
  assert.equal(composition.cards[0].title, "Harbor Cyber LLC");
  assert.equal(composition.cards[0].locality, "Isle of Wight County");
  assert.match(composition.cards[0].summary, /Cybersecurity Assessment/);
  assert.equal(composition.cards[0].favorite.visible, false);
  assert.equal(composition.cards[0].media.kind, "organization-logo");
  assert.equal(composition.cards[0].media.assetReference, "/api/organization-enrichment/assets/asset-logo-1");
  assert.equal(composition.cards[0].indicator, null);
  assert.deepEqual(composition.cards[0].recordActions, []);
  assert.match(composition.cards[0].detailContext.canonicalHref, /selectedOrganization=org-intel-1/);

  const metadata = Object.fromEntries(composition.cards[0].metadata.map((item) => [item.id, item.value]));
  assert.equal(metadata["capability-provenance"], "Organization claimed");
  assert.equal(metadata["amacs-release"], "0.5.0");
  assert.equal(metadata["capability-status"], "Self reported");

  assert.equal(composition.details[0].capabilities[0].source, "amacs-claim");
  assert.equal(composition.details[0].capabilities[0].provenanceLabel, "Organization claimed");
  assert.equal(composition.details[0].geographyProvenance.vintage, "2025");
  assert.equal(composition.details[0].publishedLocations.length, 2);
  assert.equal(composition.domainAvailability.locations, true);
  assert.equal(composition.actionRail.actions[2].availability, "disabled");
  assert.deepEqual(composition.details[0].caveats, [INTELLIGENCE_MOBILE_COVERAGE_CAVEAT]);
});

test("uses one shared selection key for focused organization map and card parity", () => {
  const focus = organization();
  const composition = projectIntelligenceMobileComposition({
    state: sharedState(),
    viewerOrganizationId: "org-home",
    mapModel: mapModel(),
    discovery: discovery([focus]),
    focusedOrganization: focus,
  });

  assert.equal(composition.selection.kind, "organization");
  assert.equal(composition.selection.selectionKey, "organization:org-intel-1");
  assert.equal(selectionMatchesCard(composition.selection, composition.cards[0]), true);
  assert.equal(
    selectionMatchesMapObject(composition.selection, composition.mapProjection.objects[0]),
    true,
  );
  assert.equal(composition.selection.selectedMarker.markerId, "marker-org-intel-1");
  assert.equal(composition.bottomSheet.state.sheetSnapPoint, "partial");
  assert.strictEqual(composition.bottomSheet.actionRail, composition.actionRail);
});

test("binds published additional locations through shared record selection without fabricating locality-only points", () => {
  const focus = organization();
  const base = sharedState();
  const locationSelection = createExchangeSelectionState({
    kind: "record",
    source: "map",
    selectedRecord: {
      selectionKey: "organization-location:location-1",
      recordType: "organization-additional-location",
      recordId: "location-1",
      organizationId: "org-intel-1",
    },
    selectedOrganization: {
      selectionKey: "organization:org-intel-1",
      organizationId: "org-intel-1",
      associationRole: "associated",
    },
    selectedMarker: {
      selectionKey: "organization-location:location-1",
      markerId: "additional-location:location-1",
      role: "focal",
    },
  });
  const state = Object.freeze({ ...base, activeLens: "intelligence", selection: locationSelection });
  const composition = projectIntelligenceMobileComposition({
    state,
    viewerOrganizationId: "org-home",
    mapModel: mapModel(),
    discovery: discovery([focus]),
    publicEnrichmentByOrganizationId: publicEnrichment(),
  });

  assert.equal(composition.selection.kind, "record");
  assert.equal(composition.selection.selectedRecord.recordType, "organization-additional-location");
  assert.equal(composition.cards[0].identity.selectionKey, "organization-location:location-1");
  assert.equal(selectionMatchesCard(composition.selection, composition.cards[0]), true);
  const selectedLocationProjection = composition.mapProjection.objects.find(
    (projection) => projection.kind === "record"
      && projection.identity.selectionKey === "organization-location:location-1",
  );
  assert.ok(selectedLocationProjection);
  assert.equal(selectionMatchesMapObject(composition.selection, selectedLocationProjection), true);
  assert.equal(selectedLocationProjection.privacy, "approximate");

  const localityOnlyProjection = composition.mapProjection.objects.find(
    (projection) => projection.kind === "record"
      && projection.identity.recordId === "location-2",
  );
  assert.equal(localityOnlyProjection, undefined);
  const localityOnlyDetail = composition.locationDetails.find((location) => location.identity.recordId === "location-2");
  assert.ok(localityOnlyDetail);
  assert.equal(localityOnlyDetail.visibility, "locality-only");
  assert.equal(localityOnlyDetail.mapProjected, false);
  assert.equal(localityOnlyDetail.displayAddress, null);
});

test("stale Intelligence location selection narrows to an independently authorized organization without camera reset", () => {
  const focus = organization();
  const base = sharedState();
  const staleSelection = createExchangeSelectionState({
    kind: "record",
    source: "restored",
    selectedRecord: {
      selectionKey: "organization-location:removed-location",
      recordType: "organization-additional-location",
      recordId: "removed-location",
      organizationId: "org-intel-1",
    },
    selectedOrganization: {
      selectionKey: "organization:org-intel-1",
      organizationId: "org-intel-1",
      associationRole: "associated",
    },
  });
  const state = Object.freeze({ ...base, activeLens: "intelligence", selection: staleSelection });
  const composition = projectIntelligenceMobileComposition({
    state,
    viewerOrganizationId: "org-home",
    mapModel: mapModel(),
    discovery: discovery([focus]),
    publicEnrichmentByOrganizationId: publicEnrichment(),
  });

  assert.equal(composition.selection.kind, "organization");
  assert.equal(composition.selection.selectedOrganization.organizationId, "org-intel-1");
  assert.equal(composition.selection.selectedMarker.markerId, "marker-org-intel-1");
  assert.strictEqual(composition.state.mapCamera, state.mapCamera);
});

test("preserves exactly four governed Intelligence actions and progressive unavailability", () => {
  const composition = projectIntelligenceMobileComposition({
    state: sharedState(),
    viewerOrganizationId: "org-home",
    mapModel: mapModel(),
    discovery: discovery(),
  });

  assert.deepEqual(
    composition.actionRail.actions.map((action) => action.id),
    [
      "intelligence.organizations",
      "intelligence.capabilities",
      "intelligence.locations",
      "intelligence.layers",
    ],
  );
  assert.equal(composition.actionRail.actions.length, 4);
  assert.deepEqual(
    composition.actionRail.actions.map((action) => action.availability),
    ["enabled", "enabled", "disabled", "disabled"],
  );
  assert.equal(composition.actionRail.actions[2].handler, null);
  assert.equal(composition.actionRail.actions[3].handler, null);
});

test("drops stale analytical layer ids and does not fabricate a current Intelligence layer", () => {
  const seeded = withDomainRevalidatedMobileExchangeLayers(sharedState(), {
    lens: "intelligence",
    activeLayerIds: ["intelligence.capability-density"],
    availableLayerIds: ["intelligence.capability-density"],
  });
  assert.deepEqual(seeded.lensState.intelligence.activeLayerIds, ["intelligence.capability-density"]);

  const composition = projectIntelligenceMobileComposition({
    state: seeded,
    viewerOrganizationId: "org-home",
    mapModel: mapModel(),
    discovery: discovery(),
  });

  assert.deepEqual(CURRENT_INTELLIGENCE_ANALYTICAL_LAYER_IDS, []);
  assert.deepEqual(composition.state.lensState.intelligence.activeLayerIds, []);
  assert.equal(composition.state.lensState.intelligence.layerStateAuthority, "domain-revalidated");
  assert.deepEqual(composition.mapProjection.activeLayerIds, []);
  assert.ok(composition.mapProjection.objects.every((projection) => projection.layerIds.length === 0));
  assert.equal(composition.domainAvailability.analyticalLayers, false);
  assert.equal(composition.actionRail.actions[3].availability, "disabled");
});

test("keeps locality-only details privacy-minimized while using the existing privacy-safe marker projection", () => {
  const composition = projectIntelligenceMobileComposition({
    state: sharedState(),
    viewerOrganizationId: "org-home",
    mapModel: mapModel(),
    discovery: discovery(),
  });

  assert.equal(composition.mapProjection.objects[0].privacy, "locality-only");
  assert.deepEqual(composition.mapProjection.objects[0].coordinate, {
    longitude: -76.62,
    latitude: 36.84,
  });
  assert.equal(composition.details[0].location.visibility, "locality-only");
  assert.equal(composition.details[0].location.coordinateIncluded, false);
  assert.equal(composition.details[0].location.addressIncluded, false);
  assert.equal("coordinate" in composition.details[0].location, false);
  assert.equal("displayAddress" in composition.details[0].location, false);
});

test("does not convert Network match scoring or result counts into analytical claims", () => {
  const composition = projectIntelligenceMobileComposition({
    state: sharedState(),
    viewerOrganizationId: "org-home",
    mapModel: mapModel(),
    discovery: discovery(),
  });
  const renderedDomainData = JSON.stringify({
    cards: composition.cards,
    details: composition.details,
    map: composition.mapProjection,
  }).toLocaleLowerCase("en-US");

  assert.equal(renderedDomainData.includes("\"score\""), false);
  assert.equal(renderedDomainData.includes("capability density"), false);
  assert.equal(renderedDomainData.includes("capability concentration"), false);
  assert.equal(renderedDomainData.includes("market gap"), false);
  assert.equal(composition.coverage.reportedTotalMatched, 1);
  assert.equal(composition.coverage.reportedTotalMatchedMeaning, "bounded-authorized-discovery-set");
  assert.equal(composition.coverage.caveat, INTELLIGENCE_MOBILE_COVERAGE_CAVEAT);
});

test("when Network discovery is unavailable, shared cards stay empty and all four Intelligence actions remain truthful", () => {
  const composition = projectIntelligenceMobileComposition({
    state: sharedState(),
    viewerOrganizationId: "org-home",
    mapModel: mapModel(),
    discovery: null,
  });

  assert.deepEqual(composition.cards, []);
  assert.deepEqual(composition.details, []);
  assert.deepEqual(composition.mapProjection.objects, []);
  assert.equal(composition.coverage.reportedTotalMatched, null);
  assert.equal(composition.domainAvailability.organizations, false);
  assert.equal(composition.domainAvailability.capabilityContext, false);
  assert.deepEqual(
    composition.actionRail.actions.map((action) => action.availability),
    ["disabled", "disabled", "disabled", "disabled"],
  );
});
