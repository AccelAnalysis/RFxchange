import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import {
  OrganizationResolutionError,
  OrganizationResolutionService,
} from "../src/application/organization-resolution/organization-resolution.ts";
import {
  createPrimaryOperatingGeographySelection,
  geographyId,
} from "../src/domain/geography/model.ts";
import {
  advanceAccessLifecycle,
  associateAccessJourneyWithUser,
  createAccessLifecycle,
} from "../src/domain/lifecycle/model.ts";
import {
  createOrganizationAccount,
  createOrganizationProfile,
} from "../src/domain/organizations/model.ts";
import {
  createOrganizationDataProvenance,
  createOrganizationDiscoveryRecord,
  projectUnclaimedOrganizationProfile,
} from "../src/domain/organization-resolution/model.ts";
import {
  evaluateOrganizationCreationSafety,
  matchOrganizations,
} from "../src/domain/organization-resolution/matching.ts";
import { OrganizationEntityKeyConflictError } from "../src/domain/organization-resolution/repository.ts";
import { createUserIdentity } from "../src/domain/users/model.ts";

const NOW = "2026-07-30T15:00:00.000Z";
const PORTSMOUTH = geographyId("us-va-portsmouth");

function participantFixture() {
  const user = createUserIdentity({
    id: "usr-resolution",
    name: "Resolution Participant",
    primaryEmail: "participant@example.test",
    loginProvider: "firebase",
    loginSubject: "firebase-resolution",
    now: NOW,
  });
  const context = authenticatedServerContext({
    user,
    claims: {
      provider: "firebase",
      subject: "firebase-resolution",
      email: user.primaryEmail,
      displayName: user.name,
      emailVerified: true,
      isAnonymous: false,
      authenticatedAt: NOW,
      issuedAt: NOW,
      expiresAt: "2026-07-30T16:00:00.000Z",
    },
    source: "session-cookie",
  });
  let journey = createAccessLifecycle({ id: "journey-resolution", now: NOW });
  journey = advanceAccessLifecycle(journey, "account-started", NOW);
  journey = advanceAccessLifecycle(journey, "account-activated", NOW);
  journey = associateAccessJourneyWithUser(journey, user.id, NOW);
  journey = advanceAccessLifecycle(journey, "geography-selected", NOW);
  const selection = createPrimaryOperatingGeographySelection(
    user.id,
    journey.id,
    PORTSMOUTH,
    NOW,
  );
  return { user, context, journey, selection };
}

function seededOrganization({
  id = "org-harborlight",
  name = "Harborlight Fabrication LLC",
  aliases = ["Harborlight Fabrication"],
  domain = "harborlight.example",
  phone = "757-555-0100",
  governmentValue = "VA-SCC-019283",
} = {}) {
  const account = createOrganizationAccount({ id, now: NOW });
  const profile = createOrganizationProfile(account, {
    id: `profile-${id}`,
    displayName: name,
    now: NOW,
  });
  const provenance = createOrganizationDataProvenance({
    kind: "seeded-public",
    sourceLabel: "Portsmouth launch organization seed",
    sourceRecordId: `seed-${id}`,
    observedAt: NOW,
  });
  const discovery = createOrganizationDiscoveryRecord(account, profile, {
    id: `discovery-${id}`,
    origin: "seeded",
    identity: {
      displayName: name,
      aliases,
      categories: ["Metal Fabrication", "Marine Industrial"],
      geographyId: PORTSMOUTH,
      address: {
        line1: "100 Harbor Way",
        locality: "Portsmouth",
        region: "VA",
        postalCode: "23704",
        countryCode: "US",
      },
      domain,
      phone,
      governmentIdentifiers: [
        {
          scheme: "SCC",
          jurisdiction: "VA",
          value: governmentValue,
        },
      ],
    },
    provenance,
    publicAddress: true,
    publicDomain: true,
    publicPhone: false,
    publicGovernmentIdentifiers: false,
    now: NOW,
  });
  return { account, profile, discovery };
}

function memoryService({
  seeded = [seededOrganization()],
  failEntityKeysWith = [],
} = {}) {
  const fixture = participantFixture();
  const accounts = new Map(seeded.map((value) => [value.account.id, value.account]));
  const profiles = new Map(seeded.map((value) => [value.profile.id, value.profile]));
  const discovery = new Map(
    seeded.map((value) => [value.discovery.organizationId, value.discovery]),
  );
  const journeys = new Map([[fixture.journey.id, fixture.journey]]);
  const resolutions = new Map();
  const commits = [];
  let id = 0;
  const service = new OrganizationResolutionService({
    lifecycle: {
      async getById(journeyId) {
        return journeys.get(journeyId) ?? null;
      },
      async save(value) {
        journeys.set(value.id, value);
      },
    },
    geographySelections: {
      async getByUserId(userId) {
        return userId === fixture.user.id ? fixture.selection : null;
      },
    },
    accounts: {
      async getById(organizationId) {
        return accounts.get(organizationId) ?? null;
      },
      async create(value) {
        accounts.set(value.id, value);
      },
    },
    profiles: {
      async getById(profileId) {
        return profiles.get(profileId) ?? null;
      },
      async getByOrganizationId(organizationId) {
        return [...profiles.values()].find(
          (value) => value.organizationId === organizationId,
        ) ?? null;
      },
      async create(value) {
        profiles.set(value.id, value);
      },
    },
    discovery: {
      async getByOrganizationId(organizationId) {
        return discovery.get(organizationId) ?? null;
      },
      async listByGeographyId(selectedGeographyId) {
        return [...discovery.values()].filter(
          (value) => value.geographyId?.value === selectedGeographyId,
        );
      },
    },
    resolutions: {
      async getByAccessJourneyId(journeyId) {
        return [...resolutions.values()].find(
          (value) => value.accessJourneyId === journeyId,
        ) ?? null;
      },
      async listByUserId(userId) {
        return [...resolutions.values()].filter((value) => value.userId === userId);
      },
    },
    unitOfWork: {
      async selectExisting(commit) {
        resolutions.set(commit.resolution.id, commit.resolution);
        journeys.set(commit.lifecycle.id, commit.lifecycle);
        commits.push({ kind: "existing", ...commit });
      },
      async createNew(commit) {
        if (failEntityKeysWith.length > 0) {
          throw new OrganizationEntityKeyConflictError(failEntityKeysWith);
        }
        accounts.set(commit.account.id, commit.account);
        profiles.set(commit.profile.id, commit.profile);
        discovery.set(commit.discovery.organizationId, commit.discovery);
        resolutions.set(commit.resolution.id, commit.resolution);
        journeys.set(commit.lifecycle.id, commit.lifecycle);
        commits.push({ kind: "new", ...commit });
      },
    },
    ids: {
      resolution: () => `resolution-${++id}`,
      organization: () => `organization-${++id}`,
      profile: () => `profile-${++id}`,
      discovery: () => `discovery-${++id}`,
      entityKey: (value) => `entity-key-${value}`,
    },
    now: () => NOW,
  });
  return { ...fixture, accounts, profiles, discovery, journeys, resolutions, commits, service };
}

test("ACQ-004 publishes seeded unclaimed data and hides resolution-only identity evidence", async () => {
  const { service } = memoryService();
  const profile = await service.publicUnclaimedProfile("org-harborlight");
  assert.deepEqual(profile, {
    organizationId: "org-harborlight",
    profileId: "profile-org-harborlight",
    displayName: "Harborlight Fabrication LLC",
    status: "Unclaimed",
    provenanceLabel: "Portsmouth launch organization seed",
    categories: ["Metal Fabrication", "Marine Industrial"],
    geographyId: PORTSMOUTH,
    locality: "Portsmouth",
    region: "VA",
    claimAction: {
      label: "Claim this organization",
      organizationId: "org-harborlight",
    },
  });
  assert.equal(JSON.stringify(profile).includes("7575550100"), false);
  assert.equal(JSON.stringify(profile).includes("VASCC019283"), false);
});

test("ORG-001 matching is explainable, locality-aware, deterministic, and does not auto-merge", async () => {
  const alternate = seededOrganization({
    id: "org-harbor-works",
    name: "Harbor Works Inc",
    aliases: ["Harborlight Works"],
    domain: "other.example",
    phone: "757-555-0199",
    governmentValue: "VA-SCC-999999",
  });
  const values = [seededOrganization(), alternate].map((value) => value.discovery);
  const candidates = matchOrganizations(
    {
      displayName: "Harborlight Fabrication",
      geographyId: PORTSMOUTH,
      domain: "https://www.harborlight.example/about",
      phone: "(757) 555-0100",
    },
    values,
  );
  assert.equal(candidates[0].organizationId, "org-harborlight");
  assert.equal(candidates[0].classification, "likely-match");
  assert.deepEqual(
    candidates[0].evidence.map((value) => value.kind),
    ["domain", "phone", "display-name", "geography"],
  );
  assert.equal(candidates[0].claimAction.label, "This is my organization");
  assert.equal(candidates.some((value) => "mergedOrganizationId" in value), false);
  assert.equal(
    candidates.flatMap((value) => value.evidence).some(
      (value) => value.explanation.includes("7575550100"),
    ),
    false,
  );
});

test("ORG-002 selecting an existing match advances resolution without granting membership, authority, or Verification", async () => {
  const memory = memoryService();
  const result = await memory.service.selectExisting({
    context: memory.context,
    accessJourneyId: memory.journey.id,
    organizationId: "org-harborlight",
    provisionalIdentity: {
      displayName: "Harborlight Fabrication",
      domain: "harborlight.example",
    },
    decisionReason: "Participant recognized the seeded organization.",
  });
  assert.equal(result.lifecycle.state, "organization-resolved");
  assert.equal(result.resolution.disposition, "existing-organization-selected");
  assert.equal(result.resolution.relationshipState, "authority-pending");
  assert.equal(result.authorityEstablished, false);
  assert.equal(result.organizationVerified, false);
  assert.equal(memory.commits[0].kind, "existing");
  assert.equal("membership" in result, false);
});

test("ORG-003 blocks new creation until likely matches are reviewed and blocks definitive identity conflicts", async () => {
  const record = seededOrganization().discovery;
  const likely = matchOrganizations(
    {
      displayName: "Harborlight Fabrication",
      geographyId: PORTSMOUTH,
      domain: "harborlight.example",
    },
    [record],
  );
  assert.deepEqual(evaluateOrganizationCreationSafety(likely, []), {
    allowed: false,
    reason: "unreviewed-likely-match",
    organizationIds: ["org-harborlight"],
  });
  assert.deepEqual(
    evaluateOrganizationCreationSafety(likely, ["org-harborlight"]),
    { allowed: true },
  );

  const conflict = matchOrganizations(
    {
      displayName: "Unrelated Company",
      geographyId: PORTSMOUTH,
      governmentIdentifiers: [
        { scheme: "SCC", jurisdiction: "VA", value: "VA-SCC-019283" },
      ],
    },
    [record],
  );
  assert.equal(conflict[0].classification, "identity-conflict");
  assert.deepEqual(
    evaluateOrganizationCreationSafety(conflict, ["org-harborlight"]),
    {
      allowed: false,
      reason: "identity-conflict",
      organizationIds: ["org-harborlight"],
    },
  );
});

test("ORG-002 creates a stable organization only after candidate review and carries provisional data forward", async () => {
  const memory = memoryService();
  const result = await memory.service.createNew({
    context: memory.context,
    accessJourneyId: memory.journey.id,
    provisionalIdentity: {
      displayName: "Harborlight Fabrication East",
      aliases: ["Harborlight East"],
      categories: ["Precision Machining"],
      domain: "harborlight-east.example",
      phone: "757-555-0200",
      governmentIdentifiers: [
        { scheme: "SCC", jurisdiction: "VA", value: "VA-SCC-020000" },
      ],
    },
    reviewedCandidateOrganizationIds: ["org-harborlight"],
    decisionReason: "Participant confirmed the similarly named record is a different entity.",
  });
  assert.equal(result.lifecycle.state, "organization-resolved");
  assert.equal(result.resolution.disposition, "new-organization-created");
  assert.equal(result.organization.id.startsWith("organization-"), true);
  assert.equal(result.organization.id.includes("Harborlight"), false);
  assert.equal(
    result.resolution.provisionalIdentity.categories[0],
    "Precision Machining",
  );
  assert.deepEqual(
    result.resolution.decisionEvidence.reviewedCandidateOrganizationIds,
    ["org-harborlight"],
  );
  assert.equal(memory.commits[0].entityKeys.length, 2);
  assert.equal(memory.commits[0].discovery.authorityState, "unestablished");
  assert.equal(memory.commits[0].discovery.verificationState, "not-evaluated");
});

test("server-owned journey/geography and atomic entity reservations fail closed", async () => {
  const mismatch = memoryService();
  await assert.rejects(
    mismatch.service.search({
      context: mismatch.context,
      accessJourneyId: mismatch.journey.id,
      provisionalIdentity: {
        displayName: "Harborlight Fabrication",
        geographyId: geographyId("us-va-norfolk"),
      },
    }),
    (error) =>
      error instanceof OrganizationResolutionError &&
      error.code === "provisional-geography-mismatch",
  );
  await assert.rejects(
    mismatch.service.search({
      context: mismatch.context,
      accessJourneyId: mismatch.journey.id,
      provisionalIdentity: {
        displayName: "Harborlight Fabrication",
      },
      reviewedCandidateOrganizationIds: ["org-not-in-current-results"],
    }),
    (error) =>
      error instanceof OrganizationResolutionError &&
      error.code === "candidate-review-invalid",
  );

  const conflicting = memoryService({ failEntityKeysWith: ["org-existing-key"] });
  await assert.rejects(
    conflicting.service.createNew({
      context: conflicting.context,
      accessJourneyId: conflicting.journey.id,
      provisionalIdentity: {
        displayName: "Completely New Entity",
        domain: "new-entity.example",
        phone: "757-555-0300",
      },
      reviewedCandidateOrganizationIds: [],
      decisionReason: "No appropriate match was found.",
    }),
    (error) =>
      error instanceof OrganizationResolutionError &&
      error.code === "strong-identity-conflict" &&
      error.conflictingOrganizationIds[0] === "org-existing-key",
  );
  assert.equal(conflicting.commits.length, 0);
});

test("public projection cannot expose a private address even when source data is seeded", () => {
  const seeded = seededOrganization();
  const privateAddressRecord = {
    ...seeded.discovery,
    address: {
      ...seeded.discovery.address,
      visibility: "resolution-only",
    },
  };
  const projected = projectUnclaimedOrganizationProfile(privateAddressRecord);
  assert.equal("locality" in projected, false);
  assert.equal("region" in projected, false);
});

test("resolution surface exposes the required claim/search/create choices and separation message", async () => {
  const component = await readFile(
    "src/components/organization-resolution/OrganizationResolutionPanel.tsx",
    "utf8",
  );
  for (const requirement of [
    "Claim this organization",
    "This is my organization",
    "None of these — create this organization",
    "Resolution is not authority",
    "server-authorized",
  ]) {
    assert.ok(component.includes(requirement), `Resolution surface is missing ${requirement}.`);
  }
  assert.ok(component.includes('autoComplete="organization"'));
  assert.ok(component.includes("model.publicProfile.categories.map"));
});
