import assert from "node:assert/strict";
import test from "node:test";

import {
  CONTROLLED_MAP_SEMANTIC_LAYER_ORDER,
} from "../src/application/geography/controlled-locality-map.ts";
import {
  buildOrganization360,
  ORGANIZATION_360_TAB_KEYS,
} from "../src/application/admin/organization-360.ts";
import {
  createMapViewport,
  projectGeographicPosition,
} from "../src/application/geography/geographic-projection.ts";
import {
  createAdminPermissionGrant,
} from "../src/domain/admin-authorization/grants.ts";
import {
  createPlatformAdministratorAuthorityContext,
} from "../src/domain/admin-authorization/model.ts";
import {
  createAdministrativeCase,
} from "../src/domain/admin-cases/model.ts";
import {
  createAccessRestriction,
  organizationRestrictionTarget,
} from "../src/domain/lifecycle/model.ts";
import {
  geographicPosition,
  projectPublicOrganizationLocation,
  structuredPostalAddress,
} from "../src/domain/organization-location/model.ts";
import {
  createOrganizationCapability,
  evaluateOrganizationProfileCompletion,
  updateEssentialOrganizationProfile,
} from "../src/domain/organization-profile/model.ts";
import {
  createOrganizationMarkerEvent,
  evaluateOrganizationMarkerActivation,
  projectPublicOrganizationMarker,
} from "../src/domain/organization-markers/model.ts";
import {
  createOrganizationAccount,
  createOrganizationProfile,
} from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";
import {
  PORTSMOUTH_CONTROLLED_LOCALITY,
} from "../src/data/geography/hampton-roads-controlled-locality.ts";
import {
  TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES,
} from "../src/data/geography/tigerweb-2025-hampton-roads-boundaries.ts";

const NOW = "2026-07-30T18:00:00.000Z";
const LATER = "2026-07-30T19:00:00.000Z";
const ORG_ID = "org-marker-360";
const address = structuredPostalAddress({
  addressLine1: "200 High St",
  locality: "Portsmouth",
  regionCode: "VA",
  postalCode: "23704",
});
const portsmouthBoundary =
  TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES.features.find(
    (feature) =>
      feature.properties.geographyId === PORTSMOUTH_CONTROLLED_LOCALITY.id,
  )?.geometry;
if (!portsmouthBoundary) throw new Error("Portsmouth test boundary is missing.");

function fixture(visibility = "exact", coordinate = [-76.297933263584, 36.835462854397]) {
  const organization = createOrganizationAccount({ id: ORG_ID, now: NOW });
  const baseProfile = createOrganizationProfile(organization, {
    id: "profile-marker-360",
    displayName: "Harborlight Fabrication",
    now: NOW,
  });
  const profile = updateEssentialOrganizationProfile(baseProfile, {
    displayName: "Harborlight Fabrication",
    organizationType: "for-profit-business",
    website: { disposition: "available", url: "https://harborlight.example" },
    mainContact: {
      displayName: "Morgan Lee",
      roleTitle: "Operations Director",
      email: "operations@harborlight.example",
      publiclyVisible: false,
    },
    capabilities: [
      createOrganizationCapability({
        id: "capability-marine-fabrication",
        kind: "service",
        name: "Precision marine metal fabrication",
        description:
          "Fabricates corrosion-resistant assemblies for marine and industrial equipment.",
      }),
    ],
    participationRoles: ["business", "supplier"],
    businessObjectives: ["find-opportunities"],
    now: NOW,
  });
  const location = Object.freeze({
    id: organization.id,
    organizationId: organization.id,
    sourceDraftId: "draft-marker-360",
    geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    physicalAddress: address,
    mailingAddress: null,
    isHomeOrPrivate: visibility === "locality-only",
    visibility,
    coordinate: geographicPosition(coordinate),
    geocodeQuality: "address-range",
    geocodeProvenance: Object.freeze({
      provider: "U.S. Census Geocoder",
      providerReference: "122199924",
      benchmark: "Public_AR_Current",
      retrievedAt: NOW,
    }),
    confirmedByUserId: "user-marker-360",
    confirmedByMembershipId: "membership-marker-360",
    confirmedAt: NOW,
    updatedAt: NOW,
  });
  const serviceGeography = Object.freeze({
    id: organization.id,
    organizationId: organization.id,
    primaryGeographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    serviceGeographyIds: Object.freeze([PORTSMOUTH_CONTROLLED_LOCALITY.id]),
    updatedByUserId: "user-marker-360",
    updatedByMembershipId: "membership-marker-360",
    updatedAt: NOW,
  });
  const completion = evaluateOrganizationProfileCompletion({
    profile,
    location,
    serviceGeographies: serviceGeography,
    now: NOW,
  });
  return { organization, profile, location, serviceGeography, completion };
}

function activeInput(overrides = {}) {
  const f = fixture(overrides.visibility, overrides.coordinate);
  return {
    ...f,
    input: {
      organization: f.organization,
      relationshipAuthorized: true,
      geography: PORTSMOUTH_CONTROLLED_LOCALITY,
      participation: { allowed: true, authority: "released" },
      location: f.location,
      profileCompletion: f.completion,
      restriction: null,
      now: NOW,
      ...overrides,
    },
  };
}

test("GEO-011 requires every canonical, server-authoritative marker gate", () => {
  const { input } = activeInput();
  const active = evaluateOrganizationMarkerActivation(input);
  assert.equal(active.status, "active");
  assert.deepEqual(active.blockingReasons, []);
  assert.equal(active.coordinateSource, "confirmed-canonical-location");

  const checks = [
    ["relationshipAuthorized", false, "relationship-authority-missing"],
    [
      "participation",
      { allowed: false, reason: "visible-unreleased" },
      "geography-participation-denied",
    ],
    ["location", null, "confirmed-location-missing"],
    ["profileCompletion", null, "profile-incomplete"],
  ];
  for (const [key, value, reason] of checks) {
    const candidate = evaluateOrganizationMarkerActivation({
      ...input,
      [key]: value,
    });
    assert.equal(candidate.status, "inactive");
    assert.ok(candidate.blockingReasons.includes(reason), `${key} must block activation`);
  }
});

test("GEO-011 restrictions deactivate map presence without erasing first activation history", () => {
  const { organization, input } = activeInput();
  const active = evaluateOrganizationMarkerActivation(input);
  const restriction = createAccessRestriction(
    organizationRestrictionTarget(organization),
    { id: "restriction-marker", state: "integrity-hold", now: LATER },
  );
  const inactive = evaluateOrganizationMarkerActivation({
    ...input,
    prior: active,
    restriction,
    now: LATER,
  });
  assert.equal(inactive.status, "inactive");
  assert.deepEqual(inactive.blockingReasons, ["organization-blocked"]);
  assert.equal(inactive.firstActivatedAt, active.firstActivatedAt);
  assert.notEqual(inactive.lastTransitionAt, active.lastTransitionAt);
});

test("GEO-011 activation is idempotent and transition evidence is not UI animation state", () => {
  const { input } = activeInput();
  const first = evaluateOrganizationMarkerActivation(input);
  const repeated = evaluateOrganizationMarkerActivation({
    ...input,
    prior: first,
    now: LATER,
  });
  assert.equal(repeated.status, "active");
  assert.equal(repeated.firstActivatedAt, first.firstActivatedAt);
  assert.equal(repeated.lastTransitionAt, first.lastTransitionAt);
  assert.throws(
    () =>
      createOrganizationMarkerEvent({
        id: "event-no-transition",
        activation: repeated,
        priorStatus: "active",
        reason: "Browser refreshed.",
        now: LATER,
      }),
    /only created for lifecycle transitions/,
  );
  assert.equal(
    createOrganizationMarkerEvent({
      id: "event-first-activation",
      activation: first,
      priorStatus: null,
      reason: "All authoritative gates passed.",
      now: NOW,
    }).kind,
    "marker-activated",
  );
});

test("GEO-011 exact, approximate, and locality-only projections preserve privacy", () => {
  const exactFixture = activeInput({ visibility: "exact" });
  const exactActivation = evaluateOrganizationMarkerActivation(exactFixture.input);
  const exact = projectPublicOrganizationMarker({
    activation: exactActivation,
    location: exactFixture.location,
    geography: PORTSMOUTH_CONTROLLED_LOCALITY,
    geographyGeometry: portsmouthBoundary,
  });
  assert.deepEqual(exact.coordinate, exactFixture.location.coordinate);
  assert.equal(exact.privacyTreatment, "exact");

  const approximateFixture = activeInput({ visibility: "approximate" });
  const approximate = projectPublicOrganizationMarker({
    activation: evaluateOrganizationMarkerActivation(approximateFixture.input),
    location: approximateFixture.location,
    geography: PORTSMOUTH_CONTROLLED_LOCALITY,
    geographyGeometry: portsmouthBoundary,
  });
  assert.notDeepEqual(approximate.coordinate, approximateFixture.location.coordinate);
  assert.equal(approximate.privacyTreatment, "approximate");

  const localityA = activeInput({ visibility: "locality-only" });
  const localityB = activeInput({
    visibility: "locality-only",
    coordinate: [-76.33, 36.82],
  });
  const projectedA = projectPublicOrganizationMarker({
    activation: evaluateOrganizationMarkerActivation(localityA.input),
    location: localityA.location,
    geography: PORTSMOUTH_CONTROLLED_LOCALITY,
    geographyGeometry: portsmouthBoundary,
  });
  const projectedB = projectPublicOrganizationMarker({
    activation: evaluateOrganizationMarkerActivation(localityB.input),
    location: localityB.location,
    geography: PORTSMOUTH_CONTROLLED_LOCALITY,
    geographyGeometry: portsmouthBoundary,
  });
  assert.equal(projectedA.privacyTreatment, "locality-presence");
  assert.deepEqual(
    projectedA.coordinate,
    projectedB.coordinate,
    "Locality-only public position must not be derived from either private coordinate.",
  );
  assert.match(projectedA.accessibleLocationLabel, /exact location is private/);
});

test("GEO-011 marker coordinates remain stable while projection follows camera/zoom", () => {
  const { location, input } = activeInput({ visibility: "approximate" });
  const marker = projectPublicOrganizationMarker({
    activation: evaluateOrganizationMarkerActivation(input),
    location,
    geography: PORTSMOUTH_CONTROLLED_LOCALITY,
    geographyGeometry: portsmouthBoundary,
  });
  const nearby = createMapViewport(
    PORTSMOUTH_CONTROLLED_LOCALITY.bounds,
    1100,
    700,
    0.4,
  );
  const focus = createMapViewport(
    PORTSMOUTH_CONTROLLED_LOCALITY.bounds,
    1100,
    700,
    0.04,
  );
  const nearbyPoint = projectGeographicPosition(marker.coordinate, nearby);
  const focusPoint = projectGeographicPosition(marker.coordinate, focus);
  assert.notDeepEqual(nearbyPoint, focusPoint);
  assert.deepEqual(
    marker.coordinate,
    projectPublicOrganizationLocation(location, PORTSMOUTH_CONTROLLED_LOCALITY).coordinate,
  );
  assert.ok(
    CONTROLLED_MAP_SEMANTIC_LAYER_ORDER["entity-marker"] >
      CONTROLLED_MAP_SEMANTIC_LAYER_ORDER["selected-outline-accent"],
  );
  assert.ok(
    CONTROLLED_MAP_SEMANTIC_LAYER_ORDER["marker-emphasis"] >
      CONTROLLED_MAP_SEMANTIC_LAYER_ORDER["entity-marker"],
  );
});

const tabPermissions = [
  "organization.profile.read",
  "user.access.read",
  "geography.definition.read",
  "rfx.record.read",
  "referral.record.read",
  "provider.application.read",
  "credibility.organization.verify",
  "commerce.account.read",
  "support.case.read",
  "audit.event.read",
  "trust.report.read",
];

function adminContext(organizationId, options = {}) {
  const permissions = [
    ...tabPermissions,
    ...(options.privateLocation ? ["organization.location.private.read"] : []),
  ];
  const authority = createPlatformAdministratorAuthorityContext({
    administratorId: "admin-360",
    rolePresetKeys: ["network-integrity-administrator"],
    effectivePermissions: permissions,
  });
  const grants = permissions.map((permission, index) =>
    createAdminPermissionGrant({
      id: `grant-org-360-${index}`,
      administratorId: "admin-360",
      permission,
      scope: `ORGANIZATION:${organizationId}`,
      createdAt: NOW,
    }),
  );
  if (options.caseId) {
    grants.push(
      createAdminPermissionGrant({
        id: "grant-case-360",
        administratorId: "admin-360",
        permission: "trust.report.read",
        scope: `CASE:${options.caseId}`,
        createdAt: NOW,
      }),
    );
  }
  return { authority, grants, now: LATER };
}

function adminFixture() {
  const f = fixture("locality-only");
  const user = createUserIdentity({
    id: "user-marker-360",
    name: "Morgan Lee",
    primaryEmail: "morgan@harborlight.example",
    loginProvider: "microsoft-entra-id",
    loginSubject: "entra-marker-360",
    now: NOW,
  });
  const membership = createOrganizationMembership(user, f.organization, {
    id: "membership-marker-360",
    now: NOW,
  });
  const restriction = createAccessRestriction(
    organizationRestrictionTarget(f.organization),
    { id: "restriction-admin-360", state: "integrity-hold", now: NOW },
  );
  const marker = evaluateOrganizationMarkerActivation({
    ...activeInput({ visibility: "locality-only" }).input,
    restriction,
  });
  const caseRecord = createAdministrativeCase({
    id: "case-integrity-360",
    caseNumber: "CASE-360-001",
    objectType: "organization-integrity",
    objectId: f.organization.id,
    organizationId: f.organization.id,
    type: "integrity-review",
    severity: "high",
    source: "trust-safety",
    readPermission: "trust.report.read",
    actionPermission: "trust.case.review",
    now: NOW,
  });
  return {
    ...f,
    input: {
      organization: f.organization,
      profile: f.profile,
      completion: f.completion,
      marker,
      primaryGeography: PORTSMOUTH_CONTROLLED_LOCALITY,
      location: f.location,
      serviceGeography: f.serviceGeography,
      memberships: [membership],
      restriction,
      verificationState: "pending",
      officialProviderState: "not-evaluated",
      commercialAccount: null,
      administrativeCases: [caseRecord],
    },
    caseRecord,
  };
}

test("ADM-063 preserves exact organization scope across every permission-aware 360 context", () => {
  const f = adminFixture();
  const projection = buildOrganization360(
    adminContext(f.organization.id, { caseId: f.caseRecord.id }),
    f.input,
  );
  assert.deepEqual(
    projection.tabs.map((tab) => tab.key),
    ORGANIZATION_360_TAB_KEYS,
  );
  assert.ok(
    projection.tabs.every(
      (tab) => tab.organizationId === f.organization.id,
    ),
  );
  assert.equal(projection.scope.organizationId, f.organization.id);
  assert.equal(projection.tabs.find((tab) => tab.key === "rfx").state, "empty");

  const wrongScope = adminContext("org-someone-else");
  assert.throws(
    () => buildOrganization360(wrongScope, f.input),
    /scoped organization.profile.read is required/,
  );
});

test("ADM-064 distinguishes restriction, Verification, provider, commercial, geography, and case state", () => {
  const f = adminFixture();
  const projection = buildOrganization360(
    adminContext(f.organization.id, { caseId: f.caseRecord.id }),
    f.input,
  );
  assert.equal(projection.header.accountAccess, "integrity-hold");
  assert.equal(projection.header.restriction, "integrity-hold");
  assert.equal(projection.header.verification, "pending");
  assert.equal(projection.header.officialProvider, "not-evaluated");
  assert.equal(projection.header.commercial.foundingRecognition, false);
  assert.equal(projection.header.primaryGeography.releaseState, "released");
  assert.equal(projection.header.markerActivation, "inactive");
  assert.equal(projection.header.investigation, "active");
  assert.equal(projection.header.governingCase.caseNumber, "CASE-360-001");
  assert.equal(
    projection.header.governingCase.href,
    "/admin/cases/case-integrity-360",
  );
});

test("ADM-063/064 minimize private location and governing case detail independently", () => {
  const f = adminFixture();
  const restricted = buildOrganization360(
    adminContext(f.organization.id),
    f.input,
  );
  assert.deepEqual(restricted.overview.privateLocation, {
    visible: false,
    addressLine1: null,
    coordinate: null,
  });
  assert.deepEqual(restricted.header.governingCase, {
    visible: false,
    caseNumber: null,
    href: null,
  });
  assert.equal(
    restricted.tabs.find((tab) => tab.key === "resources").state,
    "empty",
  );

  const privileged = buildOrganization360(
    adminContext(f.organization.id, {
      privateLocation: true,
      caseId: f.caseRecord.id,
    }),
    f.input,
  );
  assert.equal(privileged.overview.privateLocation.visible, true);
  assert.equal(privileged.overview.privateLocation.addressLine1, "200 High St");
  assert.deepEqual(privileged.overview.privateLocation.coordinate, f.location.coordinate);
  assert.equal(privileged.header.governingCase.visible, true);
});
