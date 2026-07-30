import assert from "node:assert/strict";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import {
  OrganizationLocationError,
  OrganizationLocationService,
} from "../src/application/organization-location/organization-location.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../src/domain/authorization/organization-role-presets.ts";
import { createPrimaryOperatingGeographySelection } from "../src/domain/geography/model.ts";
import { accessJourneyId } from "../src/domain/lifecycle/model.ts";
import {
  changeConfirmedLocationVisibility,
  projectPublicOrganizationLocation,
  structuredPostalAddress,
} from "../src/domain/organization-location/model.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";
import {
  HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS,
  PORTSMOUTH_CONTROLLED_LOCALITY,
} from "../src/data/geography/hampton-roads-controlled-locality.ts";
import { StaticGeographyDefinitionRepository } from "../src/infrastructure/geography/static-geography-definitions.ts";
import { TigerWebBoundarySnapshotRepository } from "../src/infrastructure/geography/tigerweb-boundary-snapshot.ts";
import {
  CensusOrganizationGeocodingProvider,
} from "../src/infrastructure/geocoding/census-geocoder.ts";

const NOW = "2026-07-30T20:00:00.000Z";
const PORTSMOUTH_COORDINATE = Object.freeze([-76.297933263584, 36.835462854397]);
const PHYSICAL = structuredPostalAddress({
  addressLine1: "200 High St",
  locality: "Portsmouth",
  regionCode: "VA",
  postalCode: "23704",
});
const MAILING = structuredPostalAddress({
  addressLine1: "PO Box 430",
  locality: "Portsmouth",
  regionCode: "VA",
  postalCode: "23705",
});

function fixture(options = {}) {
  const user = createUserIdentity({
    id: options.userId ?? "user-location",
    name: "Location Administrator",
    primaryEmail: "location@harborlight.example",
    loginProvider: "firebase",
    loginSubject: options.subject ?? "subject-location",
    now: NOW,
  });
  const context = authenticatedServerContext({
    user,
    claims: {
      provider: "firebase",
      subject: user.login.subject,
      email: user.primaryEmail,
      displayName: user.name,
      emailVerified: true,
      isAnonymous: false,
      authenticatedAt: NOW,
      issuedAt: NOW,
      expiresAt: "2026-07-30T21:00:00.000Z",
    },
    source: "session-cookie",
  });
  const organization = createOrganizationAccount({
    id: options.organizationId ?? "org-harborlight",
    now: NOW,
  });
  const membership = createOrganizationMembership(user, organization, {
    id: options.membershipId ?? "membership-location",
    now: NOW,
  });
  const preset = standardOrganizationRolePreset(options.role ?? "primary-administrator");
  const authorization = createOrganizationUserAuthorization(membership, organization, {
    roleKey: preset.key,
    permissions: preset.permissions,
    now: NOW,
  });
  const selection = createPrimaryOperatingGeographySelection(
    user.id,
    accessJourneyId("journey-location"),
    PORTSMOUTH_CONTROLLED_LOCALITY.id,
    NOW,
  );
  return { user, context, organization, membership, authorization, selection };
}

function createMemory(fx, geocoderCandidates = null) {
  const definitions = new StaticGeographyDefinitionRepository(
    HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS,
  );
  const drafts = [];
  const locations = [];
  const serviceGeographies = [];
  const events = [];
  const audits = [];
  let counter = 0;
  const repositories = {
    drafts: {
      async getById(id) { return drafts.find((entry) => entry.id === id) ?? null; },
      async save(draft, event) {
        drafts.push(draft);
        events.push(event);
      },
    },
    locations: {
      async getByOrganizationId(id) {
        return locations.find((entry) => entry.organizationId === id) ?? null;
      },
    },
    serviceGeographies: {
      async getByOrganizationId(id) {
        return serviceGeographies.find((entry) => entry.organizationId === id) ?? null;
      },
    },
    unitOfWork: {
      async confirm(input) {
        drafts.splice(drafts.findIndex((entry) => entry.id === input.draft.id), 1, input.draft);
        locations.splice(
          Math.max(0, locations.findIndex((entry) => entry.organizationId === input.location.organizationId)),
          locations.some((entry) => entry.organizationId === input.location.organizationId) ? 1 : 0,
          input.location,
        );
        events.push(input.event);
        audits.push(input.auditEvent);
      },
      async changeVisibility(input) {
        locations.splice(
          locations.findIndex((entry) => entry.organizationId === input.location.organizationId),
          1,
          input.location,
        );
        events.push(input.event);
        audits.push(input.auditEvent);
      },
      async saveServiceGeographies(input) {
        const index = serviceGeographies.findIndex(
          (entry) => entry.organizationId === input.serviceGeographies.organizationId,
        );
        if (index >= 0) serviceGeographies.splice(index, 1, input.serviceGeographies);
        else serviceGeographies.push(input.serviceGeographies);
        events.push(input.event);
        audits.push(input.auditEvent);
      },
    },
  };
  const candidates = geocoderCandidates ?? [
    {
      providerCandidateId: "tiger-122199924",
      coordinate: PORTSMOUTH_COORDINATE,
      matchedAddress: "200 HIGH ST, PORTSMOUTH, VA, 23704",
      quality: "address-range",
      provider: "U.S. Census Geocoder",
      providerReference: "tiger-line:122199924",
      benchmark: "Public_AR_Current",
      retrievedAt: NOW,
    },
  ];
  const dependencies = {
    authorization: {
      accountSecurity: {
        async inspect() {
          return {
            provider: "firebase",
            subject: fx.user.login.subject,
            email: fx.user.primaryEmail,
            emailVerified: true,
            disabled: false,
            mfaEnrolled: false,
            tokensValidAfter: null,
            lastSignInAt: NOW,
          };
        },
      },
      organizations: {
        async getById(id) { return id === fx.organization.id ? fx.organization : null; },
        async create() {},
      },
      memberships: {
        async getById(id) { return id === fx.membership.id ? fx.membership : null; },
        async listByUserId() { return [fx.membership]; },
        async listActiveByUserId() { return [fx.membership]; },
        async listByOrganizationId() { return [fx.membership]; },
        async create() {},
      },
      authorizations: {
        async getByMembershipId(id) { return id === fx.membership.id ? fx.authorization : null; },
        async listByUserId() { return [fx.authorization]; },
        async listByOrganizationId() { return [fx.authorization]; },
        async save() {},
      },
      restrictions: {
        async getById() { return null; },
        async getForOrganization() { return null; },
        async getForMembership() { return null; },
        async save() {},
      },
    },
    selections: {
      async getByUserId(id) { return id === fx.user.id ? fx.selection : null; },
    },
    geographies: definitions,
    geographyAuthorizations: {
      async listByUserAndGeography() { return []; },
      async save() {},
    },
    boundaries: new TigerWebBoundarySnapshotRepository(definitions),
    geocoder: {
      async locate() { return candidates; },
    },
    repositories,
    ids: {
      draft: () => `location-draft-${++counter}`,
      event: () => `location-event-${++counter}`,
      audit: () => `location-audit-${++counter}`,
    },
    now: () => NOW,
  };
  return {
    drafts,
    locations,
    serviceGeographies,
    events,
    audits,
    service: new OrganizationLocationService(dependencies),
  };
}

async function begin(memory, fx, overrides = {}) {
  return memory.service.beginConfirmation({
    context: fx.context,
    organizationId: fx.organization.id,
    membershipId: fx.membership.id,
    physicalAddress: PHYSICAL,
    mailingAddress: MAILING,
    isHomeOrPrivate: true,
    reason: "Prepare the canonical organization location.",
    ...overrides,
  });
}

test("ORG-005/006 requires authority and explicit map-candidate confirmation", async () => {
  const fx = fixture();
  const memory = createMemory(fx);
  const draft = await begin(memory, fx);
  assert.equal(draft.visibility, "locality-only");
  assert.equal(memory.locations.length, 0, "A geocoder candidate is not canonical location.");
  assert.equal(draft.mailingAddress.addressLine1, "PO Box 430");
  await assert.rejects(
    () => memory.service.confirm({
      context: fx.context,
      organizationId: fx.organization.id,
      membershipId: fx.membership.id,
      draftId: draft.id,
      candidateId: "browser-injected-candidate",
      reason: "Invalid selection.",
    }),
    (error) => error instanceof OrganizationLocationError && error.code === "candidate-not-confirmed",
  );
  const location = await memory.service.confirm({
    context: fx.context,
    organizationId: fx.organization.id,
    membershipId: fx.membership.id,
    draftId: draft.id,
    candidateId: draft.candidates[0].id,
    reason: "Authorized user confirmed the map position.",
  });
  assert.equal(location.geographyId, PORTSMOUTH_CONTROLLED_LOCALITY.id);
  assert.deepEqual(location.coordinate, PORTSMOUTH_COORDINATE);
  assert.equal(memory.locations.length, 1);
  assert.equal(memory.audits[0].action, "organization.location.confirmed");

  const viewer = fixture({
    userId: "user-viewer",
    subject: "subject-viewer",
    membershipId: "membership-viewer",
    role: "viewer",
  });
  const denied = createMemory(viewer);
  await assert.rejects(
    () => begin(denied, viewer),
    (error) =>
      error instanceof OrganizationLocationError &&
      error.code === "organization-authority-required",
  );
});

test("ORG-005 fails closed for wrong organization and browser geography/geocode manipulation", async () => {
  const fx = fixture();
  const memory = createMemory(fx);
  await assert.rejects(
    () => begin(memory, fx, { organizationId: "org-other" }),
    (error) =>
      error instanceof OrganizationLocationError &&
      error.code === "organization-authority-required",
  );

  const outside = createMemory(fx, [{
    providerCandidateId: "outside",
    coordinate: Object.freeze([-77.436, 37.54]),
    matchedAddress: "RICHMOND, VA",
    quality: "locality",
    provider: "test",
    providerReference: "outside",
    benchmark: "test",
    retrievedAt: NOW,
  }]);
  await assert.rejects(
    () => begin(outside, fx),
    (error) =>
      error instanceof OrganizationLocationError &&
      error.code === "geocode-outside-primary-geography",
  );

  const empty = createMemory(fx, []);
  await assert.rejects(
    () => begin(empty, fx),
    (error) =>
      error instanceof OrganizationLocationError &&
      error.code === "geocode-no-candidates",
  );
});

test("GEO-010 public projections enforce exact, approximate, and locality-only privacy", async () => {
  const fx = fixture();
  const memory = createMemory(fx);
  const draft = await begin(memory, fx, { isHomeOrPrivate: false, visibility: "exact" });
  const exactLocation = await memory.service.confirm({
    context: fx.context,
    organizationId: fx.organization.id,
    membershipId: fx.membership.id,
    draftId: draft.id,
    candidateId: draft.candidates[0].id,
    reason: "Confirm exact-public business location.",
  });
  const exact = projectPublicOrganizationLocation(
    exactLocation,
    PORTSMOUTH_CONTROLLED_LOCALITY,
  );
  assert.deepEqual(exact.coordinate, exactLocation.coordinate);
  assert.equal(exact.displayAddress.addressLine1, "200 High St");
  assert.equal("mailingAddress" in exact, false);

  const approximateLocation = changeConfirmedLocationVisibility(
    exactLocation,
    "approximate",
    NOW,
  );
  const approximate = projectPublicOrganizationLocation(
    approximateLocation,
    PORTSMOUTH_CONTROLLED_LOCALITY,
  );
  assert.notDeepEqual(approximate.coordinate, exactLocation.coordinate);
  assert.equal("displayAddress" in approximate, false);
  assert.doesNotMatch(JSON.stringify(approximate), /PO Box|200 High|-76\\.297933/);
  assert.deepEqual(
    projectPublicOrganizationLocation(approximateLocation, PORTSMOUTH_CONTROLLED_LOCALITY),
    approximate,
    "Approximation must be deterministic.",
  );

  const localityOnly = projectPublicOrganizationLocation(
    changeConfirmedLocationVisibility(exactLocation, "locality-only", NOW),
    PORTSMOUTH_CONTROLLED_LOCALITY,
  );
  assert.equal("coordinate" in localityOnly, false);
  assert.equal("displayAddress" in localityOnly, false);
  assert.doesNotMatch(JSON.stringify(localityOnly), /PO Box|200 High|-76\\.297933/);
  assert.deepEqual(exactLocation.coordinate, PORTSMOUTH_COORDINATE);
});

test("GEO-009/ORG-009 preserves service geography separately from home location", async () => {
  const fx = fixture();
  const memory = createMemory(fx);
  const draft = await begin(memory, fx);
  const location = await memory.service.confirm({
    context: fx.context,
    organizationId: fx.organization.id,
    membershipId: fx.membership.id,
    draftId: draft.id,
    candidateId: draft.candidates[0].id,
    reason: "Confirm home location.",
  });
  const serviceArea = await memory.service.saveServiceGeographies({
    context: fx.context,
    organizationId: fx.organization.id,
    membershipId: fx.membership.id,
    serviceGeographyIds: [PORTSMOUTH_CONTROLLED_LOCALITY.id],
    reason: "Organization serves the released Portsmouth locality.",
  });
  assert.deepEqual(serviceArea.serviceGeographyIds, [PORTSMOUTH_CONTROLLED_LOCALITY.id]);
  assert.deepEqual(memory.locations[0], location, "Service area must not rewrite home location.");

  await assert.rejects(
    () => memory.service.saveServiceGeographies({
      context: fx.context,
      organizationId: fx.organization.id,
      membershipId: fx.membership.id,
      serviceGeographyIds: ["us-va-norfolk"],
      reason: "Attempt unreleased service geography.",
    }),
    (error) =>
      error instanceof OrganizationLocationError &&
      error.code === "service-geography-invalid",
  );
});

test("ORG-006 Census adapter uses a fixed HTTPS endpoint and bounded provider-neutral output", async () => {
  let requestUrl = null;
  const provider = new CensusOrganizationGeocodingProvider({
    now: () => NOW,
    fetcher: async (url) => {
      requestUrl = new URL(url);
      return new Response(JSON.stringify({
        result: {
          input: { benchmark: { benchmarkName: "Public_AR_Current" } },
          addressMatches: [{
            tigerLine: { tigerLineId: "122199924", providerOnly: "discarded" },
            coordinates: { x: PORTSMOUTH_COORDINATE[0], y: PORTSMOUTH_COORDINATE[1] },
            matchedAddress: "200 HIGH ST, PORTSMOUTH, VA, 23704",
            privateProviderPayload: { mustNotEscape: true },
          }],
        },
      }), { status: 200, headers: { "content-type": "application/json" } });
    },
  });
  const candidates = await provider.locate({
    address: PHYSICAL,
    correlationId: "geocoder-test",
  });
  assert.equal(requestUrl.origin, "https://geocoding.geo.census.gov");
  assert.equal(requestUrl.pathname, "/geocoder/locations/onelineaddress");
  assert.equal(requestUrl.searchParams.get("benchmark"), "Public_AR_Current");
  assert.equal(candidates[0].quality, "address-range");
  assert.equal(candidates[0].providerReference, "tiger-line:122199924");
  assert.doesNotMatch(JSON.stringify(candidates), /privateProviderPayload|providerOnly/);
});
