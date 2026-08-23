import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createIntelligenceCoverageTruth,
  createIntelligenceRecordTruth,
  intelligenceScopeIsAuthorized,
} from "../src/domain/intelligence/mobile-exchange-intelligence.ts";
import { projectAuthorizedIntelligenceMobileExchange } from "../src/infrastructure/intelligence/mobile-exchange-intelligence-runtime.ts";

const serverAuthority = Object.freeze({
  authoritySource: "server-derived",
  viewerUserId: "user-1",
  viewerOrganizationId: "org-1",
  permittedTeamIds: Object.freeze(["team-1"]),
  publicRecordsPermitted: true,
});

const visibility = Object.freeze({
  private: Object.freeze({ scope: "private", ownerUserId: "user-1", teamId: null, organizationId: "org-1" }),
  team: Object.freeze({ scope: "team", ownerUserId: null, teamId: "team-1", organizationId: "org-1" }),
  organization: Object.freeze({ scope: "organization", ownerUserId: null, teamId: null, organizationId: "org-1" }),
  public: Object.freeze({ scope: "public", ownerUserId: null, teamId: null, organizationId: null }),
});

function mapModel() {
  return {
    selectedGeography: {
      id: "geo-1",
      name: "Authorized locality",
    },
    camera: {
      bounds: { west: -77, south: 36, east: -76, north: 37 },
    },
    attribution: {
      label: "U.S. Census Bureau",
      sourceLayerUrl: "https://tigerweb.geo.census.gov/",
      vintage: "2025",
      retrievedAt: "2026-08-01T00:00:00.000Z",
    },
  };
}

function organization(id = "org-result") {
  return {
    organizationId: id,
    profile: {
      displayName: "Authorized result",
      capabilities: [],
      location: { visibility: "approximate", localityName: "Authorized locality" },
    },
    marker: {
      id: `marker-${id}`,
      coordinate: [-76.5, 36.5],
      label: "Authorized result",
      accessibleLocationLabel: "Near Authorized locality",
    },
    capabilities: [],
  };
}

function authenticatedDiscovery(geographyId = "geo-1", organizations = [organization()]) {
  return {
    available: true,
    projection: {
      query: { capability: "", baseGeographyId: geographyId, serviceGeographyId: null, page: 1 },
      organizations,
      totalMatched: organizations.length,
      page: 1,
      pageCount: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    },
    serviceAreaOptions: [],
  };
}

function runtimeInput(overrides = {}) {
  return {
    access: {
      kind: "authorized",
      context: { user: { id: "user-1" } },
      membership: { organizationId: "org-1" },
    },
    mapProjection: { organizationId: "org-1", model: mapModel() },
    discovery: authenticatedDiscovery(),
    selectedOrganizationId: "org-result",
    locale: "en-US",
    projectedAt: "2026-08-18T17:00:00.000Z",
    ...overrides,
  };
}

test("private, team, organization, and public Intelligence scopes require exact current server authority", () => {
  assert.ok(Object.values(visibility).every((value) => intelligenceScopeIsAuthorized(value, serverAuthority)));
  assert.equal(intelligenceScopeIsAuthorized(visibility.private, { ...serverAuthority, viewerUserId: "other-user" }), false);
  assert.equal(intelligenceScopeIsAuthorized(visibility.team, { ...serverAuthority, permittedTeamIds: [] }), false);
  assert.equal(intelligenceScopeIsAuthorized(visibility.team, { ...serverAuthority, viewerOrganizationId: "other-org" }), false);
  assert.equal(intelligenceScopeIsAuthorized(visibility.organization, { ...serverAuthority, viewerOrganizationId: "other-org" }), false);
  assert.equal(intelligenceScopeIsAuthorized(visibility.public, { ...serverAuthority, publicRecordsPermitted: false }), false);
  assert.equal(intelligenceScopeIsAuthorized(visibility.public, { ...serverAuthority, authoritySource: "client-derived" }), false);
});

test("record truth refuses unauthorized tenant context and invalid bounded coverage", () => {
  const coverage = createIntelligenceCoverageTruth({
    currentPageCount: 1,
    projectedCount: 1,
    totalMatched: 1,
    candidateLimit: 250,
    geographyId: "geo-1",
  });
  assert.throws(() => createIntelligenceRecordTruth({
    recordId: "record-1",
    organizationId: "org-result",
    visibility: visibility.organization,
    scopeAuthority: { ...serverAuthority, viewerOrganizationId: "other-org" },
    geographyId: "geo-1",
    geographyLabel: "Authorized locality",
    geographyAuthority: "U.S. Census Bureau",
    sourceLayerUrl: "https://tigerweb.geo.census.gov/",
    sourceVintage: "2025",
    projectedAt: "2026-08-18T17:00:00.000Z",
    coverage,
  }), /not authorized/);
  assert.throws(() => createIntelligenceCoverageTruth({
    currentPageCount: 2,
    projectedCount: 1,
    totalMatched: 2,
    candidateLimit: 250,
    geographyId: "geo-1",
  }), /Projected count/);
  assert.throws(() => createIntelligenceCoverageTruth({
    currentPageCount: 1,
    projectedCount: 1,
    totalMatched: 251,
    candidateLimit: 250,
    geographyId: "geo-1",
  }), /candidate limit/);
});

test("server runtime rejects geography drift and ignores unvalidated selected identities", () => {
  assert.throws(() => projectAuthorizedIntelligenceMobileExchange(runtimeInput({
    access: {
      kind: "authorized",
      context: { user: { id: "user-1" } },
      membership: { organizationId: "other-org" },
    },
  })), /must match the authorized participant membership/);
  assert.throws(() => projectAuthorizedIntelligenceMobileExchange(runtimeInput({
    discovery: authenticatedDiscovery("geo-other"),
  })), /must match the authorized map projection/);

  const stale = projectAuthorizedIntelligenceMobileExchange(runtimeInput({
    selectedOrganizationId: "org-stale",
  }));
  assert.equal(stale.selectedOrganizationId, "org-1");
  assert.ok(stale.actionRail.actions.every((action) => action.labelKey.endsWith(".own")));
  assert.equal(stale.authorizationBoundary, "authorized-participant-route-and-network-discovery");
});

test("focused detail identity is admitted only from independently authorized discovery", () => {
  const focused = projectAuthorizedIntelligenceMobileExchange(runtimeInput({
    selectedOrganizationId: "org-focused",
    focusedDiscovery: authenticatedDiscovery("geo-1", [organization("org-focused")]),
  }));
  assert.equal(focused.focusedOrganization.organizationId, "org-focused");
  assert.equal(focused.selectedOrganizationId, "org-focused");
  assert.equal(focused.discovery.results.cards[0].identity.organizationId, "org-focused");

  const wrongGeographyFocus = authenticatedDiscovery("geo-other", [organization("org-focused")]);
  assert.throws(() => projectAuthorizedIntelligenceMobileExchange(runtimeInput({
    selectedOrganizationId: "org-focused",
    focusedDiscovery: wrongGeographyFocus,
  })), /Focused Intelligence discovery geography/);
});

test("production route passes server-authorized discovery through the Stage 4 adapter", async () => {
  const source = await readFile(new URL("../app/geography/canvas/page.tsx", import.meta.url), "utf8");
  assert.match(source, /projectAuthorizedIntelligenceMobileExchange\(\{/);
  assert.match(source, /discovery,\s*focusedDiscovery,\s*selectedOrganizationId,/s);
  assert.match(source, /const authorizedDiscovery = intelligenceExchange\.sourceDiscovery/);
  assert.match(source, /discovery=\{authorizedDiscovery\.available/);
});
