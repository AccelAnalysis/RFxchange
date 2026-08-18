import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import test from "node:test";

import {
  INTELLIGENCE_PROJECTION_COPY,
  projectIntelligenceMobileExchange,
} from "../src/application/intelligence/mobile-exchange-intelligence.ts";
import {
  resultCardMatchesMapObject,
} from "../src/application/participant/mobile-exchange-contracts.ts";
import {
  CURRENT_APPROVED_INTELLIGENCE_LAYER_IDS,
  INTELLIGENCE_NETWORK_COVERAGE_CAVEAT,
} from "../src/domain/intelligence/mobile-exchange-intelligence.ts";
import { supportedLocales } from "../src/i18n/config.ts";

const PROJECTED_AT = "2026-08-18T17:00:00.000Z";

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
      sourceLayerUrl: "https://tigerweb.geo.census.gov/",
      vintage: "2025",
      retrievedAt: "2026-08-01T00:00:00.000Z",
    },
  };
}

function organization(id = "org-intel-1", overrides = {}) {
  return {
    organizationId: id,
    profile: {
      organizationId: id,
      profileId: `profile-${id}`,
      displayName: id === "org-intel-1" ? "Harbor Cyber LLC" : "Bay Systems Inc.",
      organizationType: "for-profit-business",
      website: `https://${id}.example/`,
      mainContact: null,
      capabilities: [],
      participationRoles: ["business"],
      businessObjectives: [],
      location: {
        visibility: "locality-only",
        organizationId: id,
        geographyId: "geo-1",
        localityName: "Isle of Wight County",
      },
      profileComplete: true,
    },
    baseGeographyId: "geo-1",
    serviceGeographyIds: ["geo-1"],
    marker: {
      id: `marker-${id}`,
      coordinate: id === "org-intel-1" ? [-76.62, 36.84] : [-76.58, 36.82],
      label: id === "org-intel-1" ? "Harbor Cyber LLC" : "Bay Systems Inc.",
      accessibleLocationLabel: "Locality presence in Isle of Wight County",
    },
    capabilities: [{
      id: `claim-${id}`,
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

function project(overrides = {}) {
  return projectIntelligenceMobileExchange({
    locale: "en-US",
    viewerUserId: "user-home",
    viewerOrganizationId: "org-home",
    mapModel: mapModel(),
    discovery: discovery(),
    selectedOrganizationId: "org-intel-1",
    projectedAt: PROJECTED_AT,
    ...overrides,
  });
}

test("projects current authorized organization truth through the whole-lens shared contract", () => {
  const result = project();
  assert.equal(result.discovery.lens, "intelligence");
  assert.match(result.discovery.queryId, /^intelligence-query:[a-z0-9]+$/);
  assert.ok(result.discovery.queryId.length < 240);
  assert.equal(result.discovery.authoritySource, "server-derived");
  assert.equal(result.discovery.map.geography.authority, "server-revalidated");
  assert.equal(result.discovery.map.layerStateAuthority, "domain-revalidated");
  assert.equal(result.discovery.results.status, "ready");
  assert.equal(result.discovery.results.cards.length, 1);
  assert.equal(result.discovery.spatialResults.length, 1);
  assert.equal(result.approvedLayerIds, CURRENT_APPROVED_INTELLIGENCE_LAYER_IDS);
  assert.deepEqual(result.discovery.map.activeLayerIds, []);

  const card = result.discovery.results.cards[0];
  const mapObject = result.discovery.map.objects[0];
  assert.equal(resultCardMatchesMapObject(card, mapObject), true);
  assert.equal(card.detailContext.canonicalHref, "/geography/canvas?selectedOrganization=org-intel-1&q=cyber");
  assert.equal(card.favorite.availability, "hidden");
  assert.deepEqual(card.recordActions, []);
  assert.equal(card.dates.updatedAt, PROJECTED_AT);
  assert.deepEqual(card.classifications.map(({ id }) => id), ["record-type", "visibility", "source"]);
  assert.deepEqual(card.metadata.map(({ id }) => id), ["geography", "vintage", "quality", "coverage"]);

  const truth = result.recordTruthBySelectionKey[card.identity.selectionKey];
  assert.equal(truth.recordType, "organization-network-result");
  assert.equal(truth.visibility.scope, "organization");
  assert.equal(truth.visibility.organizationId, "org-home");
  assert.equal(truth.source.authoritySource, "server-derived");
  assert.equal(truth.geography.geographyId, "geo-1");
  assert.equal(truth.geography.authority, "U.S. Census Bureau");
  assert.equal(truth.vintage.sourceVintage, "2025");
  assert.equal(truth.vintage.effectiveAt, PROJECTED_AT);
  assert.equal(truth.quality.status, "authoritative-projection");
  assert.equal(truth.coverage.fullMarketMeasure, false);
  assert.ok(truth.caveats.includes(INTELLIGENCE_NETWORK_COVERAGE_CAVEAT));
  assert.equal(result.sourceDisposition, "pr-220-reconciled-and-superseded");
});

test("keeps exactly four immutable current Intelligence action positions without inventing handlers", () => {
  const external = project();
  assert.deepEqual(external.actionRail.actions.map(({ id }) => id), [
    "intelligence.add-view",
    "intelligence.edit-note",
    "intelligence.compare",
    "intelligence.track",
  ]);
  assert.deepEqual(external.actionRail.actions.map(({ position }) => position), [1, 2, 3, 4]);
  assert.ok(external.actionRail.actions.every((action) =>
    action.availability === "disabled"
    && action.handler === null
    && action.disabledReason === "not-operational"
    && action.labelKey.endsWith(".external")));

  const own = project({ selectedOrganizationId: "org-home" });
  assert.ok(own.actionRail.actions.every((action) => action.labelKey.endsWith(".own")));
  assert.doesNotMatch(JSON.stringify(external), /intelligence\.(organizations|capabilities|locations|layers)/);
});

test("produces truthful empty, restricted, and focused-result states without retained disclosure", () => {
  const empty = project({ discovery: discovery([]), selectedOrganizationId: null });
  assert.equal(empty.discovery.results.status, "empty");
  assert.deepEqual(empty.discovery.map.objects, []);
  assert.deepEqual(empty.discovery.spatialResults, []);

  const restricted = project({
    discovery: null,
    unavailableReason: "geography-not-permitted",
    selectedOrganizationId: "org-intel-1",
  });
  assert.equal(restricted.discovery.results.status, "restricted");
  assert.equal(restricted.discovery.results.resultSetId, null);
  assert.deepEqual(restricted.discovery.map.objects, []);
  assert.deepEqual(restricted.recordTruthBySelectionKey, {});
  assert.equal(restricted.selectedOrganizationId, "org-home");

  const focus = organization("org-focus");
  const focused = project({
    discovery: discovery([organization()]),
    focusedOrganization: focus,
    selectedOrganizationId: "org-focus",
  });
  assert.equal(focused.discovery.results.cards.length, 2);
  assert.equal(focused.discovery.results.cards[0].identity.organizationId, "org-focus");
  assert.equal(focused.selectedOrganizationId, "org-focus");
  assert.ok(focused.actionRail.actions.every((action) => action.labelKey.endsWith(".external")));
});

test("projects localized card copy for all five supported locales with stable query and identity", () => {
  const identities = [];
  for (const locale of supportedLocales) {
    const result = project({ locale });
    const card = result.discovery.results.cards[0];
    identities.push(card.identity.selectionKey);
    assert.ok(card.accessibleLabel.startsWith(INTELLIGENCE_PROJECTION_COPY[locale].openOrganization));
    assert.equal(card.classifications[0].label, INTELLIGENCE_PROJECTION_COPY[locale].recordType);
    assert.equal(card.metadata[2].value, INTELLIGENCE_PROJECTION_COPY[locale].qualityValue);
    assert.ok(result.queryIdentity.includes(`\"locale\":\"${locale}\"`));
  }
  assert.deepEqual([...new Set(identities)], ["organization:org-intel-1"]);
});

test("reports bounded discovery coverage without converting counts into analytics", () => {
  const result = project();
  assert.equal(result.coverage.kind, "bounded-authorized-network-discovery");
  assert.equal(result.coverage.currentPageCount, 1);
  assert.equal(result.coverage.projectedCount, 1);
  assert.equal(result.coverage.totalMatched, 1);
  assert.equal(result.coverage.candidateLimit, 250);
  assert.equal(result.coverage.fullMarketMeasure, false);
  assert.match(result.coverage.caveat, /do not measure the full market/);
  assert.doesNotMatch(JSON.stringify(result.discovery), /market share|economic activity|density score|market gap/i);
});

test("keeps the maximum authorized discovery projection bounded and synchronous", () => {
  const organizations = Array.from({ length: 250 }, (_, index) =>
    organization(`org-bounded-${index}`));
  const boundedDiscovery = {
    ...discovery(organizations),
    totalMatched: 250,
    pageCount: 11,
    hasNextPage: true,
  };
  const startedAt = performance.now();
  const result = project({ discovery: boundedDiscovery, selectedOrganizationId: null });
  const elapsed = performance.now() - startedAt;
  assert.equal(result.discovery.results.cards.length, 250);
  assert.equal(result.discovery.map.objects.length, 250);
  assert.equal(result.coverage.candidateLimit, 250);
  assert.ok(elapsed < 500, `Expected bounded projection under 500ms; observed ${elapsed.toFixed(1)}ms.`);
});
