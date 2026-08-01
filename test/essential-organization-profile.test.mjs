import assert from "node:assert/strict";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import {
  EssentialOrganizationProfileError,
  EssentialOrganizationProfileService,
} from "../src/application/organization-profile/essential-profile.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../src/domain/authorization/organization-role-presets.ts";
import {
  projectPublicOrganizationLocation,
  structuredPostalAddress,
} from "../src/domain/organization-location/model.ts";
import {
  ORGANIZATION_CAPABILITY_CATEGORIES,
  createOrganizationCapability,
  evaluateOrganizationProfileCompletion,
  hydrateEssentialOrganizationProfile,
  projectPublicEssentialOrganizationProfile,
  updateEssentialOrganizationProfile,
} from "../src/domain/organization-profile/model.ts";
import {
  createOrganizationAccount,
  createOrganizationProfile,
} from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";
import { PORTSMOUTH_CONTROLLED_LOCALITY } from "../src/data/geography/hampton-roads-controlled-locality.ts";

const NOW = "2026-07-30T20:00:00.000Z";
const LATER = "2026-07-30T21:00:00.000Z";
const PHYSICAL_ADDRESS = structuredPostalAddress({
  addressLine1: "200 High St",
  locality: "Portsmouth",
  regionCode: "VA",
  postalCode: "23704",
});
const MAILING_ADDRESS = structuredPostalAddress({
  addressLine1: "PO Box 430",
  locality: "Portsmouth",
  regionCode: "VA",
  postalCode: "23705",
});

function capability(overrides = {}) {
  return createOrganizationCapability({
    id: overrides.id ?? "capability-metal-fabrication",
    kind: overrides.kind ?? "service",
    category: overrides.category ?? "manufacturing-fabrication",
    otherCategory: overrides.otherCategory,
    name: overrides.name ?? "Precision marine metal fabrication",
    description:
      overrides.description ??
      "Fabricates corrosion-resistant assemblies for marine and industrial equipment.",
  });
}

function profileFixture() {
  const organization = createOrganizationAccount({
    id: "org-essential-profile",
    now: NOW,
  });
  const profile = createOrganizationProfile(organization, {
    id: "profile-essential-profile",
    displayName: "Harborlight Fabrication",
    now: NOW,
  });
  return { organization, profile };
}

function updateProfile(profile, overrides = {}) {
  return updateEssentialOrganizationProfile(profile, {
    displayName: overrides.displayName ?? "Harborlight Fabrication",
    website: overrides.website ?? {
      disposition: "available",
      url: "harborlight.example/about#team",
    },
    mainContact: overrides.mainContact ?? {
      displayName: "Morgan Lee",
      roleTitle: "Operations Director",
      email: "OPERATIONS@HARBORLIGHT.EXAMPLE",
      phone: "+1 (757) 555-0186",
      publiclyVisible: false,
    },
    capabilities: overrides.capabilities ?? [capability()],
    now: overrides.now ?? NOW,
  });
}

function confirmedLocation(organizationId, visibility = "locality-only") {
  return Object.freeze({
    id: organizationId,
    organizationId,
    sourceDraftId: "location-draft-profile",
    geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    physicalAddress: PHYSICAL_ADDRESS,
    mailingAddress: MAILING_ADDRESS,
    isHomeOrPrivate: true,
    visibility,
    coordinate: Object.freeze([-76.297933263584, 36.835462854397]),
    geocodeQuality: "address-range",
    geocodeProvenance: Object.freeze({
      provider: "U.S. Census Geocoder",
      providerReference: "tiger-line:122199924",
      benchmark: "Public_AR_Current",
      retrievedAt: NOW,
    }),
    confirmedByUserId: "user-essential-profile",
    confirmedByMembershipId: "membership-essential-profile",
    confirmedAt: NOW,
    updatedAt: NOW,
  });
}

function serviceGeographies(organizationId) {
  return Object.freeze({
    id: organizationId,
    organizationId,
    primaryGeographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    serviceGeographyIds: Object.freeze([PORTSMOUTH_CONTROLLED_LOCALITY.id]),
    updatedByUserId: "user-essential-profile",
    updatedByMembershipId: "membership-essential-profile",
    updatedAt: NOW,
  });
}

test("essential profile captures carried identity and a categorized capability", () => {
  const { profile } = profileFixture();
  const updated = updateProfile(profile);
  assert.equal(updated.id, profile.id, "The durable profile identity must be reused.");
  assert.equal(updated.organizationType, null, "Organization type is not required at activation.");
  assert.equal(updated.website.url, "https://harborlight.example/about");
  assert.equal(updated.mainContact.email, "operations@harborlight.example");
  assert.equal(updated.capabilities[0].kind, "service");
  assert.equal(updated.capabilities[0].category, "manufacturing-fabrication");
  assert.ok(ORGANIZATION_CAPABILITY_CATEGORIES.includes("other"));

  const other = capability({
    id: "capability-other",
    category: "other",
    otherCategory: "Maritime compliance support",
  });
  assert.equal(other.otherCategory, "Maritime compliance support");
  assert.throws(
    () => capability({ id: "capability-other-missing", category: "other" }),
    /Other capability category is required/,
  );
  assert.throws(
    () => capability({ name: "Business services" }),
    /specific and meaningful/,
  );
  assert.throws(
    () => capability({ description: "Too generic" }),
    /at least 20 characters/,
  );
});

test("Profile Complete does not require organization type or participant roles", () => {
  const { organization, profile } = profileFixture();
  const incomplete = evaluateOrganizationProfileCompletion({
    profile: hydrateEssentialOrganizationProfile(profile),
    location: null,
    serviceGeographies: null,
    now: NOW,
  });
  assert.equal(incomplete.status, "inactive");
  assert.deepEqual(incomplete.missingRequirements, [
    "website-disposition",
    "main-contact",
    "meaningful-capability",
    "service-geography",
    "location-visibility",
    "confirmed-primary-location",
  ]);
  assert.equal(incomplete.missingRequirements.includes("organization-type"), false);
  assert.equal(incomplete.missingRequirements.includes("participation-role"), false);

  const completeProfile = updateProfile(profile);
  assert.equal(completeProfile.organizationType, null);
  assert.deepEqual(completeProfile.participationRoles, []);
  assert.deepEqual(completeProfile.businessObjectives, []);
  const complete = evaluateOrganizationProfileCompletion({
    profile: completeProfile,
    location: confirmedLocation(organization.id),
    serviceGeographies: serviceGeographies(organization.id),
    prior: incomplete,
    now: LATER,
  });
  assert.equal(complete.credentialFamily, "active");
  assert.equal(complete.credentialKey, "profile-complete");
  assert.equal(complete.status, "active");
  assert.deepEqual(complete.missingRequirements, []);
  assert.equal(complete.firstActivatedAt, LATER);
});

test("commercial, founder, provider, and Verification claims cannot bypass completion", () => {
  const { organization, profile } = profileFixture();
  const withoutCapability = updateProfile(profile, { capabilities: [] });
  const decorated = {
    ...withoutCapability,
    commercialStatus: "paid",
    foundingOrganization: true,
    officialResourceProvider: true,
    verificationStatus: "verified",
  };
  const completion = evaluateOrganizationProfileCompletion({
    profile: decorated,
    location: confirmedLocation(organization.id),
    serviceGeographies: serviceGeographies(organization.id),
    now: NOW,
  });
  assert.equal(completion.status, "inactive");
  assert.deepEqual(completion.missingRequirements, ["meaningful-capability"]);
});

test("recalculation deactivates stale completion while preserving activation history", () => {
  const { organization, profile } = profileFixture();
  const completeProfile = updateProfile(profile);
  const active = evaluateOrganizationProfileCompletion({
    profile: completeProfile,
    location: confirmedLocation(organization.id),
    serviceGeographies: serviceGeographies(organization.id),
    now: NOW,
  });
  const reduced = updateProfile(completeProfile, {
    capabilities: [],
    now: LATER,
  });
  const inactive = evaluateOrganizationProfileCompletion({
    profile: reduced,
    location: confirmedLocation(organization.id),
    serviceGeographies: serviceGeographies(organization.id),
    prior: active,
    now: LATER,
  });
  assert.equal(inactive.status, "inactive");
  assert.deepEqual(inactive.missingRequirements, ["meaningful-capability"]);
  assert.equal(inactive.firstActivatedAt, active.firstActivatedAt);
  assert.equal(inactive.lastTransitionAt, LATER);
});

test("public essential profile honors location and contact privacy", () => {
  const { organization, profile } = profileFixture();
  const essential = updateProfile(profile);
  const location = confirmedLocation(organization.id, "locality-only");
  const completion = evaluateOrganizationProfileCompletion({
    profile: essential,
    location,
    serviceGeographies: serviceGeographies(organization.id),
    now: NOW,
  });
  const projected = projectPublicEssentialOrganizationProfile({
    profile: essential,
    completion,
    location: projectPublicOrganizationLocation(location, PORTSMOUTH_CONTROLLED_LOCALITY),
  });
  assert.equal(projected.profileComplete, true);
  assert.equal(projected.organizationType, null);
  assert.equal(projected.location.visibility, "locality-only");
  assert.equal(projected.mainContact, null);
  assert.equal("coordinate" in projected.location, false);
  assert.doesNotMatch(
    JSON.stringify(projected),
    /200 High|PO Box|operations@harborlight|-76\.297933/,
  );
});

function serviceFixture() {
  const { organization, profile: initialProfile } = profileFixture();
  const user = createUserIdentity({
    id: "user-essential-profile",
    name: "Profile Administrator",
    primaryEmail: "admin@harborlight.example",
    loginProvider: "firebase",
    loginSubject: "subject-essential-profile",
    now: NOW,
  });
  const membership = createOrganizationMembership(user, organization, {
    id: "membership-essential-profile",
    now: NOW,
  });
  const preset = standardOrganizationRolePreset("primary-administrator");
  const authorization = createOrganizationUserAuthorization(membership, organization, {
    roleKey: preset.key,
    permissions: preset.permissions,
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
      expiresAt: LATER,
    },
    source: "session-cookie",
  });
  let storedProfile = initialProfile;
  let completion = null;
  const events = [];
  const audits = [];
  let id = 0;
  const service = new EssentialOrganizationProfileService({
    authorization: {
      accountSecurity: {
        async inspect() {
          return {
            provider: "firebase",
            subject: user.login.subject,
            email: user.primaryEmail,
            emailVerified: true,
            disabled: false,
            mfaEnrolled: false,
            tokensValidAfter: null,
            lastSignInAt: NOW,
          };
        },
      },
      organizations: {
        async getById(value) { return value === organization.id ? organization : null; },
        async create() {},
      },
      memberships: {
        async getById(value) { return value === membership.id ? membership : null; },
        async listByUserId() { return [membership]; },
        async listActiveByUserId() { return [membership]; },
        async listByOrganizationId() { return [membership]; },
        async create() {},
      },
      authorizations: {
        async getByMembershipId(value) { return value === membership.id ? authorization : null; },
        async listByUserId() { return [authorization]; },
        async listByOrganizationId() { return [authorization]; },
        async save() {},
      },
      restrictions: {
        async getById() { return null; },
        async getForOrganization() { return null; },
        async getForMembership() { return null; },
        async save() {},
      },
    },
    profiles: {
      async getById(value) { return value === storedProfile.id ? storedProfile : null; },
      async getByOrganizationId(value) { return value === organization.id ? storedProfile : null; },
      async create() {},
    },
    locations: {
      async getByOrganizationId(value) {
        return value === organization.id ? confirmedLocation(organization.id) : null;
      },
    },
    serviceGeographies: {
      async getByOrganizationId(value) {
        return value === organization.id ? serviceGeographies(organization.id) : null;
      },
    },
    geographies: {
      async getById(value) {
        return value === PORTSMOUTH_CONTROLLED_LOCALITY.id
          ? PORTSMOUTH_CONTROLLED_LOCALITY
          : null;
      },
      async listAll() { return [PORTSMOUTH_CONTROLLED_LOCALITY]; },
    },
    repositories: {
      completions: {
        async getByOrganizationId(value) { return value === organization.id ? completion : null; },
      },
      unitOfWork: {
        async save(input) {
          storedProfile = input.profile;
          completion = input.completion;
          events.push(input.event);
          audits.push(input.auditEvent);
        },
      },
    },
    ids: {
      event: () => `profile-event-${++id}`,
      audit: () => `profile-audit-${++id}`,
    },
    now: () => NOW,
  });
  return {
    organization,
    membership,
    authorization,
    context,
    events,
    audits,
    service,
  };
}

test("authorized application service updates the durable profile and derives completion", async () => {
  const fixture = serviceFixture();
  const result = await fixture.service.update({
    context: fixture.context,
    organizationId: fixture.organization.id,
    membershipId: fixture.membership.id,
    profile: {
      displayName: "Harborlight Fabrication",
      website: { disposition: "available", url: "harborlight.example" },
      mainContact: {
        displayName: "Morgan Lee",
        roleTitle: "Operations Director",
        email: "operations@harborlight.example",
        publiclyVisible: false,
      },
      capabilities: [capability()],
    },
    reason: "Complete the essential organization profile.",
  });
  assert.equal(result.profile.id, "profile-essential-profile");
  assert.equal(result.profile.organizationType, null);
  assert.deepEqual(result.profile.participationRoles, []);
  assert.deepEqual(result.profile.businessObjectives, []);
  assert.equal(result.completion.status, "active");
  assert.equal(fixture.events[0].kind, "essential-profile-updated");
  assert.equal(fixture.audits[0].action, "organization.profile.essential-updated");
  assert.ok(fixture.authorization.permissions.includes("organization.profile.manage"));
  assert.equal(
    fixture.authorization.permissions.includes("credibility.organization.verify"),
    false,
  );

  const publicProfile = await fixture.service.publicProfile(fixture.organization.id);
  assert.equal(publicProfile.location.visibility, "locality-only");
  assert.equal(publicProfile.mainContact, null);

  await assert.rejects(
    () => fixture.service.update({
      context: fixture.context,
      organizationId: "org-other",
      membershipId: fixture.membership.id,
      profile: {
        displayName: "Wrong tenant",
        website: { disposition: "not-applicable", explanation: "No public website." },
        mainContact: {
          displayName: "Wrong Tenant",
          roleTitle: "Administrator",
          email: "wrong@example.test",
          publiclyVisible: false,
        },
        capabilities: [capability()],
      },
      reason: "Attempt a cross-organization update.",
    }),
    (error) =>
      error instanceof EssentialOrganizationProfileError &&
      error.code === "organization-authority-required",
  );
});
