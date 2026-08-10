import assert from "node:assert/strict";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import {
  ActivationJourneyService,
  ActivationRequestValidationError,
} from "../src/application/onboarding/activation-journey.ts";
import {
  createAccessLifecycle,
  advanceAccessLifecycle,
  associateAccessJourneyWithUser,
} from "../src/domain/lifecycle/model.ts";
import {
  createActivationJourneyContext,
  createActivationLegalAcceptance,
  updateActivationJourneyContext,
} from "../src/domain/onboarding/model.ts";
import {
  createOrganizationAccount,
  createOrganizationProfile,
} from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";
import { PORTSMOUTH_CONTROLLED_LOCALITY } from "../src/data/geography/hampton-roads-controlled-locality.ts";
import {
  parseSaveProfileBody,
  parseWebsiteIdentityFields,
} from "../app/api/onboarding/activation/request-boundary.ts";

const NOW = "2026-08-01T12:00:00.000Z";
const LATER = "2026-08-01T12:01:00.000Z";

function validProfileBody(overrides = {}) {
  return {
    action: "save-profile",
    contactRole: "Operations Director",
    contactPubliclyVisible: false,
    capabilityKind: "service",
    capabilityCategory: "manufacturing-fabrication",
    capabilityName: "Precision marine metal fabrication",
    capabilityDescription:
      "Fabricates corrosion-resistant assemblies for marine and industrial equipment.",
    ...overrides,
  };
}

function registeredLifecycle(activation, userId) {
  let lifecycle = createAccessLifecycle({
    id: activation.accessJourneyId,
    now: NOW,
  });
  lifecycle = advanceAccessLifecycle(lifecycle, "account-started", NOW);
  lifecycle = associateAccessJourneyWithUser(lifecycle, userId, NOW);
  for (const state of [
    "account-activated",
    "geography-selected",
    "organization-resolved",
    "organization-registered",
  ]) {
    lifecycle = advanceAccessLifecycle(lifecycle, state, NOW);
  }
  return lifecycle;
}

function fixture(seed) {
  const user = createUserIdentity({
    id: "user-website-carry-forward",
    name: "Morgan Lee",
    primaryEmail: "morgan@example.org",
    loginProvider: "firebase",
    loginSubject: "subject-website-carry-forward",
    now: NOW,
  });
  const organization = createOrganizationAccount({
    id: "org-website-carry-forward",
    now: NOW,
  });
  let durableProfile = createOrganizationProfile(organization, {
    id: "profile-website-carry-forward",
    displayName: "Harborlight Fabrication",
    now: NOW,
  });
  const membership = createOrganizationMembership(user, organization, {
    id: "membership-website-carry-forward",
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
      expiresAt: "2026-08-01T13:00:00.000Z",
    },
    source: "session-cookie",
  });

  let activation = createActivationJourneyContext({
    userId: user.id,
    provisionalOrganizationName: durableProfile.displayName,
    organizationIdentitySeed: seed,
    now: NOW,
  });
  activation = updateActivationJourneyContext(activation, {
    legalAcceptance: createActivationLegalAcceptance(NOW),
    orientationBridgeAcknowledgedAt: NOW,
    organizationId: organization.id,
    membershipId: membership.id,
    now: LATER,
  });

  let lifecycle = registeredLifecycle(activation, user.id);
  let completion = null;
  let markerActivation = null;
  let persistedWebsite = null;
  let markerRecalculations = 0;

  const location = Object.freeze({
    id: "location-website-carry-forward",
    organizationId: organization.id,
    geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    visibility: "locality-only",
  });

  const service = new ActivationJourneyService({
    contexts: {
      async getByUserId(value) {
        return value === user.id ? activation : null;
      },
      async save(value) {
        activation = value;
      },
    },
    lifecycle: {
      async getById(value) {
        return value === lifecycle.id ? lifecycle : null;
      },
      async save(value) {
        lifecycle = value;
      },
    },
    releasedGeographies: [PORTSMOUTH_CONTROLLED_LOCALITY],
    definitions: {
      async getById(value) {
        return value === PORTSMOUTH_CONTROLLED_LOCALITY.id
          ? PORTSMOUTH_CONTROLLED_LOCALITY
          : null;
      },
    },
    selections: {
      async getByUserId(value) {
        return value === user.id
          ? { geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id }
          : null;
      },
    },
    resolutions: {
      async getByAccessJourneyId(value) {
        return value === lifecycle.id
          ? { organizationId: organization.id }
          : null;
      },
    },
    locations: {
      async getByOrganizationId(value) {
        return value === organization.id ? location : null;
      },
    },
    completions: {
      async getByOrganizationId(value) {
        return value === organization.id ? completion : null;
      },
    },
    markerActivations: {
      async getByOrganizationId(value) {
        return value === organization.id ? markerActivation : null;
      },
    },
    accounts: {
      async getById(value) {
        return value === organization.id ? organization : null;
      },
    },
    profiles: {
      async getByOrganizationId(value) {
        return value === organization.id ? durableProfile : null;
      },
    },
    memberships: {
      async listActiveByUserId(value) {
        return value === user.id ? [membership] : [];
      },
    },
    accountSecurity: {
      async inspect() {
        return { emailVerified: true };
      },
    },
    profile: {
      async update(input) {
        persistedWebsite = input.profile.website;
        completion = Object.freeze({
          status: "active",
          missingRequirements: Object.freeze([]),
        });
        durableProfile = Object.freeze({
          ...durableProfile,
          website: input.profile.website,
        });
        return Object.freeze({
          profile: durableProfile,
          completion,
        });
      },
    },
    marker: {
      async recalculate() {
        markerRecalculations += 1;
        markerActivation = Object.freeze({
          id: "marker-website-carry-forward",
          organizationId: organization.id,
          geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
          status: "active",
        });
        return markerActivation;
      },
    },
    ids: {
      markerEvent: () => "marker-event-website-carry-forward",
      markerAudit: () => "marker-audit-website-carry-forward",
    },
    now: () => LATER,
  });

  return {
    context,
    service,
    activation: () => activation,
    lifecycle: () => lifecycle,
    persistedWebsite: () => persistedWebsite,
    markerRecalculations: () => markerRecalculations,
  };
}

async function saveProfile(seed, body) {
  const current = fixture(seed);
  const parsed = parseSaveProfileBody(body);
  const state = await current.service.saveProfile(current.context, parsed);
  return { current, parsed, state };
}

test("save-profile parser preserves genuine website omission", () => {
  const parsed = parseSaveProfileBody(validProfileBody());
  assert.equal(Object.hasOwn(parsed, "website"), false);
  assert.equal(Object.hasOwn(parsed, "websiteNotApplicable"), false);

  assert.deepEqual(parseWebsiteIdentityFields({}), {});
  assert.deepEqual(
    parseWebsiteIdentityFields({ websiteNotApplicable: false }),
    { websiteNotApplicable: false },
  );
  assert.deepEqual(
    parseWebsiteIdentityFields({ websiteNotApplicable: true }),
    { websiteNotApplicable: true },
  );
});

test("carried no-public-website disposition survives Profile Complete", async () => {
  const { current, parsed, state } = await saveProfile(
    {
      websiteDisposition: "not-applicable",
      websiteUrl: null,
      phone: "+1 757 555 0100",
    },
    validProfileBody(),
  );

  assert.equal(Object.hasOwn(parsed, "websiteNotApplicable"), false);
  assert.equal(
    current.activation().organizationIdentitySeed.websiteDisposition,
    "not-applicable",
  );
  assert.equal(current.activation().organizationIdentitySeed.websiteUrl, null);
  assert.equal(current.persistedWebsite().disposition, "not-applicable");
  assert.equal(typeof current.persistedWebsite().explanation, "string");
  assert.ok(current.persistedWebsite().explanation.length > 0);
  assert.equal(current.markerRecalculations(), 1);
  assert.equal(current.lifecycle().state, "controlled-platform");
  assert.equal(state.nextStep, "complete");
});

test("carried available website survives Profile Complete unchanged", async () => {
  const { current, parsed, state } = await saveProfile(
    {
      websiteDisposition: "available",
      websiteUrl: "https://example.org/",
      phone: "+1 757 555 0100",
    },
    validProfileBody(),
  );

  assert.equal(Object.hasOwn(parsed, "websiteNotApplicable"), false);
  assert.equal(
    current.activation().organizationIdentitySeed.websiteDisposition,
    "available",
  );
  assert.equal(
    current.activation().organizationIdentitySeed.websiteUrl,
    "https://example.org/",
  );
  assert.deepEqual(current.persistedWebsite(), {
    disposition: "available",
    url: "https://example.org/",
  });
  assert.equal(current.markerRecalculations(), 1);
  assert.equal(state.nextStep, "complete");
});

test("initial website confirmation preserves explicit false and normalizes the URL", async () => {
  const { current, parsed, state } = await saveProfile(
    {
      websiteDisposition: null,
      websiteUrl: null,
      phone: "+1 757 555 0100",
    },
    validProfileBody({
      website: "example.org",
      websiteNotApplicable: false,
    }),
  );

  assert.equal(Object.hasOwn(parsed, "websiteNotApplicable"), true);
  assert.equal(parsed.websiteNotApplicable, false);
  assert.equal(
    current.activation().organizationIdentitySeed.websiteDisposition,
    "available",
  );
  assert.equal(
    current.activation().organizationIdentitySeed.websiteUrl,
    "https://example.org/",
  );
  assert.deepEqual(current.persistedWebsite(), {
    disposition: "available",
    url: "https://example.org/",
  });
  assert.equal(current.markerRecalculations(), 1);
  assert.equal(state.nextStep, "complete");
});

test("initial no-public-website confirmation preserves explicit true", async () => {
  const { current, parsed, state } = await saveProfile(
    {
      websiteDisposition: null,
      websiteUrl: null,
      phone: "+1 757 555 0100",
    },
    validProfileBody({ websiteNotApplicable: true }),
  );

  assert.equal(parsed.websiteNotApplicable, true);
  assert.equal(
    current.activation().organizationIdentitySeed.websiteDisposition,
    "not-applicable",
  );
  assert.equal(current.activation().organizationIdentitySeed.websiteUrl, null);
  assert.equal(current.persistedWebsite().disposition, "not-applicable");
  assert.equal(current.markerRecalculations(), 1);
  assert.equal(state.nextStep, "complete");
});

test("malformed supplied websiteNotApplicable values are rejected", () => {
  for (const value of [null, "false", 0, {}]) {
    assert.throws(
      () => parseSaveProfileBody(validProfileBody({ websiteNotApplicable: value })),
      (error) => error instanceof ActivationRequestValidationError &&
        /websiteNotApplicable must be a boolean when supplied/.test(error.message),
    );
  }
});

test("invalid activation websites retain typed request-validation semantics", async () => {
  for (const website of ["not a valid URL", "ftp://example.org"]) {
    await assert.rejects(
      () => saveProfile(
        {
          websiteDisposition: null,
          websiteUrl: null,
          phone: "+1 757 555 0100",
        },
        validProfileBody({ website, websiteNotApplicable: false }),
      ),
      (error) => error instanceof ActivationRequestValidationError &&
        error.code === "request-invalid",
    );
  }
});

test("profile contact, phone, and capability validation retain typed request semantics", async () => {
  assert.throws(
    () => parseSaveProfileBody(validProfileBody({ contactRole: "" })),
    (error) => error instanceof ActivationRequestValidationError &&
      error.code === "request-invalid",
  );

  const phoneFixture = fixture({
    websiteDisposition: "available",
    websiteUrl: "https://example.org/",
    phone: "+1 757 555 0100",
  });
  await assert.rejects(
    () => phoneFixture.service.searchOrganizations(phoneFixture.context, {
      displayName: "Harborlight Fabrication",
      website: "example.org",
      phone: "not-a-phone",
    }),
    (error) => error instanceof ActivationRequestValidationError &&
      error.code === "request-invalid",
  );

  await assert.rejects(
    () => saveProfile(
      {
        websiteDisposition: "available",
        websiteUrl: "https://example.org/",
        phone: "+1 757 555 0100",
      },
      validProfileBody({ capabilityName: "services" }),
    ),
    (error) => error instanceof ActivationRequestValidationError &&
      error.code === "request-invalid",
  );
});

test("activation location address validation retains typed request semantics", async () => {
  const current = fixture({
    websiteDisposition: "available",
    websiteUrl: "https://example.org/",
    phone: "+1 757 555 0100",
  });

  await assert.rejects(
    () => current.service.beginLocation(current.context, {
      addressLine1: "801 Crawford St",
      locality: "Portsmouth",
      regionCode: "VA",
      postalCode: "23@704",
      isHomeOrPrivate: false,
      visibility: "approximate",
    }),
    (error) => error instanceof ActivationRequestValidationError &&
      error.code === "request-invalid",
  );
});
