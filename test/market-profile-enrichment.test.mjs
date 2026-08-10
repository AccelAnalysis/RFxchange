import assert from "node:assert/strict";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import { MarketProfileError, MarketProfileService } from "../src/application/market-profile/market-profile.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../src/domain/authorization/organization-role-presets.ts";
import { projectOrganizationCapabilityClaim } from "../src/domain/market-profile/model.ts";
import { MarketProfilePersistenceConflictError } from "../src/domain/market-profile/repository.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import { createOrganizationMembership, createUserIdentity } from "../src/domain/users/model.ts";

const NOW = "2026-08-08T15:00:00.000Z";
const CAPABILITY = Object.freeze({
  conceptId: "AMACS-CAP-000002", preferredLabel: "General contracting",
  definition: "The organizational ability to provide or perform general contracting.",
  domainId: "AMACS-DOM-000001", domainLabel: "Built Environment and Facilities",
  familyId: "AMACS-FAM-000001", familyLabel: "General Construction and Renovation",
  aliases: ["general contractor"], status: "active", replacementConceptIds: [], releaseVersion: "0.5.0",
});
const MARKET_ROLE = Object.freeze({ market_role_id: "AMACS-MROLE-000003", preferred_label: "Service provider" });
const NAICS_INDUSTRY = Object.freeze({ code: "236220", title: "Commercial and Institutional Building Construction" });

function fixture(rolePreset = "primary-administrator", options = {}) {
  const organization = createOrganizationAccount({ id: "org-market-profile", now: NOW });
  const user = createUserIdentity({ id: "user-market-profile", name: "Market Profile Manager", primaryEmail: "manager@example.test", loginProvider: "firebase", loginSubject: "subject-market-profile", now: NOW });
  const membership = createOrganizationMembership(user, organization, { id: "membership-market-profile", now: NOW });
  const preset = standardOrganizationRolePreset(rolePreset);
  const authorization = createOrganizationUserAuthorization(membership, organization, { roleKey: preset.key, permissions: preset.permissions, now: NOW });
  const context = authenticatedServerContext({ user, claims: { provider: "firebase", subject: user.login.subject, email: user.primaryEmail, displayName: user.name, emailVerified: true, isAnonymous: false, authenticatedAt: NOW, issuedAt: NOW, expiresAt: "2026-08-09T15:00:00.000Z" }, source: "session-cookie" });
  const state = { claims: [], industry: null, performance: [], preferences: null, terms: [], commands: new Map(), events: [], audits: [], interpretationRecord: null, interpretationCandidate: null };
  let sequence = 0;
  const repository = {
    claims: {
      async getById(id) { return state.claims.find((item) => item.id === id) ?? null; },
      async listByOrganizationId(id) { return id === organization.id ? state.claims : []; },
    },
    async getIndustryProfile() { return state.industry; },
    async listPastPerformance() { return state.performance; },
    async getPreferences() { return state.preferences; },
    async listProvisionalTerms() { return state.terms; },
    async getCommand(id) { return state.commands.get(id) ?? null; },
    async save(input) {
      if (options.persistenceError) throw options.persistenceError;
      if (options.beforeSave) await options.beforeSave({ state, input });
      if (
        input.record.kind === "industry" &&
        (state.industry?.revision ?? 0) !== input.expectedRecordRevision
      ) throw new MarketProfilePersistenceConflictError("Industry context changed before persistence.");
      if (state.commands.has(input.command.id)) return;
      state.commands.set(input.command.id, input.command); state.events.push(input.event); state.audits.push(input.auditEvent);
      if (input.record.kind === "capability") state.claims.push(input.record.value);
      if (input.record.kind === "industry") state.industry = input.record.value;
      if (input.record.kind === "past-performance") state.performance.push(input.record.value);
      if (input.record.kind === "preferences") state.preferences = input.record.value;
      if (input.record.kind === "provisional-term") state.terms.push(input.record.value);
    },
  };
  const service = new MarketProfileService({
    authorization: {
      accountSecurity: { async inspect() { return { provider: "firebase", subject: user.login.subject, email: user.primaryEmail, emailVerified: true, disabled: false, mfaEnrolled: false, tokensValidAfter: null, lastSignInAt: NOW }; } },
      organizations: { async getById(id) { return id === organization.id ? organization : null; }, async create() {} },
      memberships: { async getById(id) { return id === membership.id ? membership : null; }, async listByUserId() { return [membership]; }, async listActiveByUserId() { return [membership]; }, async listByOrganizationId() { return [membership]; }, async create() {} },
      authorizations: { async getByMembershipId(id) { return id === membership.id ? authorization : null; }, async listByUserId() { return [authorization]; }, async listByOrganizationId() { return [authorization]; }, async save() {} },
      restrictions: { async getById() { return null; }, async getForOrganization() { return null; }, async getForMembership() { return null; }, async save() {} },
    },
    catalog: {
      async getRelease() { return { version: "0.5.0", releasedAt: NOW, sourceCommit: "commit", projectionVersion: "projection" }; },
      async getCapability(id) { return id === CAPABILITY.conceptId ? CAPABILITY : null; },
      async hasCanonicalCapability(id) { return id === CAPABILITY.conceptId; },
      async listMarketRoles() { return [MARKET_ROLE]; },
      async listDomains() { return [{ domainId: CAPABILITY.domainId, preferredLabel: CAPABILITY.domainLabel, definition: "", status: "active" }]; },
      async listFamilies() { return []; }, async listCapabilities() { return [CAPABILITY]; }, async searchCapabilities() { throw new Error("unused"); },
      async getRequestFamily() { return null; }, async getRequirementType() { return null; }, async getResponseTemplate() { return null; }, async getDecisionTemplate() { return null; }, async getReadinessRules() { return []; }, async getConceptInterpretationGuidance() { return null; }, async resolveHistoricalCapability() { return null; },
    },
    naicsCatalog: {
      async getRelease() { return { version: "2022", sourceName: "U.S. Census Bureau", sourceUrl: "https://www.census.gov/naics/", retrievedAt: "2026-08-10", sourceSha256: "a".repeat(64), level: 6, entryCount: 1 }; },
      async listIndustries() { return [NAICS_INDUSTRY]; },
      async getIndustry(code, version) { return code === NAICS_INDUSTRY.code && version === "2022" ? NAICS_INDUSTRY : null; },
      async getProjection() { throw new Error("unused"); },
    },
    interpretations: {
      async getRecord() { return state.interpretationRecord; }, async getCandidate() { return state.interpretationCandidate; },
      async saveCompleted() {}, async saveFailureEvidence() {}, async applyCandidateDisposition() {}, async applyNoneOfThese() {},
    },
    serviceGeographies: { async getByOrganizationId() { return { id: organization.id, organizationId: organization.id, primaryGeographyId: "us-va-portsmouth", serviceGeographyIds: ["us-va-portsmouth"], updatedByUserId: user.id, updatedByMembershipId: membership.id, updatedAt: NOW }; } },
    repository, now: () => NOW, id: () => `id-${++sequence}`,
  });
  const scope = { context, organizationId: organization.id, membershipId: membership.id, commandId: "command-1" };
  const claimInput = { capabilityId: CAPABILITY.conceptId, entityScope: "reporting_entity", marketRoleIds: [MARKET_ROLE.market_role_id], deliveryRoles: ["prime"], serviceGeographyIds: ["us-va-portsmouth"], specialties: ["Public facilities"], capacity: { value: 4, unitId: "delivery-crew", period: "month", note: "Participant-reported planning capacity" }, visibility: "network", source: { kind: "manual" } };
  return { organization, user, membership, state, service, scope, claimInput };
}

test("manual AMACS selection creates a self-reported organization claim and idempotent evidence", async () => {
  const f = fixture();
  const first = await f.service.claimCapability(f.scope, f.claimInput);
  assert.equal(first.replayed, false);
  assert.equal(first.claim.amacsReleaseVersion, "0.5.0");
  assert.equal(first.claim.assertionStatus, "self_reported");
  assert.deepEqual(first.claim.marketRoleIds, [MARKET_ROLE.market_role_id]);
  assert.deepEqual(first.claim.serviceGeographyIds, ["us-va-portsmouth"]);
  assert.deepEqual(first.claim.capacity, { value: 4, unitId: "delivery-crew", period: "month", note: "Participant-reported planning capacity" });
  const replay = await f.service.claimCapability(f.scope, f.claimInput);
  assert.equal(replay.replayed, true);
  assert.equal(f.state.claims.length, 1);
  assert.equal(f.state.events.length, 1);
  assert.equal(f.state.audits[0].action, "organization.market-profile.capability-claimed");
});

test("concurrent identical capability commands converge on one deterministic claim", async () => {
  const f = fixture();
  const [first, second] = await Promise.all([
    f.service.claimCapability(f.scope, f.claimInput),
    f.service.claimCapability(f.scope, f.claimInput),
  ]);
  assert.equal(first.claim.id, second.claim.id);
  assert.equal(f.state.claims.length, 1);
  assert.equal(f.state.events.length, 1);
  assert.equal(f.state.audits.length, 1);
});

test("an active organization viewer without profile-management permission cannot write", async () => {
  const f = fixture("viewer");
  await assert.rejects(
    f.service.claimCapability(f.scope, f.claimInput),
    (error) => error instanceof MarketProfileError && error.code === "forbidden" && /missing-permission/.test(error.message),
  );
  assert.equal(f.state.claims.length, 0);
  assert.equal(f.state.events.length, 0);
});

test("accepted interpretation remains separate and is revalidated before a claim", async () => {
  const f = fixture();
  f.state.interpretationRecord = { id: "record-1", organizationId: f.organization.id, record: { amacs_release: "0.5.0", purpose: "seller_capability_declaration" } };
  f.state.interpretationCandidate = { id: "candidate-1", organizationId: f.organization.id, interpretationRecordId: "record-1", candidate: { amacs_release: "0.5.0", disposition: "accepted", candidate_value: { amacs_id: CAPABILITY.conceptId }, authoritative_effect: "none" }, createdAt: NOW, updatedAt: NOW };
  const result = await f.service.claimCapability({ ...f.scope, commandId: "command-assisted" }, { ...f.claimInput, source: { kind: "interpretation", interpretationRecordId: "record-1", interpretationCandidateId: "candidate-1", candidateUpdatedAt: NOW } });
  assert.equal(result.claim.source.kind, "interpretation");
  assert.equal(f.state.interpretationCandidate.candidate.authoritative_effect, "none");
  await assert.rejects(
    f.service.claimCapability({ ...f.scope, commandId: "command-stale" }, { ...f.claimInput, source: { kind: "interpretation", interpretationRecordId: "record-1", interpretationCandidateId: "candidate-1", candidateUpdatedAt: "2026-08-08T14:00:00.000Z" } }),
    (error) => error instanceof MarketProfileError && error.code === "conflict",
  );
});

test("wrong organization, invented catalog IDs, and out-of-scope geography fail closed", async () => {
  const f = fixture();
  await assert.rejects(f.service.claimCapability({ ...f.scope, organizationId: "org-other" }, f.claimInput), /wrong-organization/);
  await assert.rejects(f.service.claimCapability({ ...f.scope, commandId: "command-invented" }, { ...f.claimInput, capabilityId: "AMACS-CAP-999999" }), /current AMACS release/);
  await assert.rejects(f.service.claimCapability({ ...f.scope, commandId: "command-geography" }, { ...f.claimInput, serviceGeographyIds: ["us-va-norfolk"] }), /organization service geography/);
});

test("industry, past performance, preferences, and provisional terms preserve their boundaries", async () => {
  const f = fixture();
  const claim = await f.service.claimCapability(f.scope, f.claimInput);
  await f.service.updateIndustry({ ...f.scope, commandId: "command-industry" }, { industries: [{ id: "industry-construction", label: "Commercial construction", visibility: "network" }], naics: [{ code: "236220", version: "2022", visibility: "network" }], preserveExistingNaics: false, expectedIndustryRevision: 0 });
  await f.service.addPastPerformance({ ...f.scope, commandId: "command-performance" }, { id: "project-1", title: "Municipal facilities modernization", summary: "Renovated occupied municipal facilities through a phased construction plan.", role: "Prime contractor", value: { currency: "USD", exactMinorUnits: 125000000, disclosed: false }, outputs: ["Renovated facilities"], outcomesClaimed: ["Work completed on schedule"], supportingCapabilityClaimIds: [claim.claim.id], visibility: "private" });
  await f.service.updatePreferences({ ...f.scope, commandId: "command-preferences" }, { deliveryRoleInterests: ["prime", "subcontractor"], teamPreferences: ["Local specialty trades"], referralPreferences: ["Warm introductions"], resourceNeeds: ["Bonding support"], contactPreference: "structured_intake", intakeNotes: "Review fit before introduction.", visibility: "network" });
  await f.service.submitProvisionalTerm({ ...f.scope, commandId: "command-term" }, { id: "term-1", proposedLabel: "Resilient waterfront retrofit coordination", proposedDefinition: "Coordinates multi-disciplinary retrofit work for occupied waterfront facilities.", exampleWork: "Sequencing marine access, structural, and building systems work.", suggestedDomainId: CAPABILITY.domainId });
  assert.equal(f.state.industry.naics[0].code, "236220");
  assert.equal(f.state.industry.naics[0].title, NAICS_INDUSTRY.title);
  assert.equal(f.state.industry.naics[0].version, "2022");
  assert.equal(f.state.industry.naics[0].provenance, "Participant selected from U.S. Census Bureau 2022 NAICS");
  assert.equal(f.state.industry.revision, 1);
  assert.equal(f.state.performance[0].confirmationState, "self_reported");
  assert.equal(f.state.performance[0].value.disclosed, false);
  assert.deepEqual(f.state.preferences.deliveryRoleInterests, ["prime", "subcontractor"]);
  assert.equal(f.state.terms[0].status, "submitted");
});

test("industry command replay remains idempotent after the profile revision advances", async () => {
  const f = fixture();
  const input = {
    industries: [{ id: "industry-construction", label: "Commercial construction", visibility: "network" }],
    naics: [{ code: "236220", version: "2022", visibility: "network" }],
    preserveExistingNaics: false,
    expectedIndustryRevision: 0,
  };
  const first = await f.service.updateIndustry(
    { ...f.scope, commandId: "command-idempotent-industry" },
    input,
  );
  const replay = await f.service.updateIndustry(
    { ...f.scope, commandId: "command-idempotent-industry" },
    input,
  );
  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(f.state.industry.revision, 1);
  assert.equal(f.state.commands.size, 1);
  assert.equal(f.state.events.length, 1);
});

test("industry updates independently preserve history and replace the governed NAICS selection", async () => {
  const f = fixture();
  const current = Object.freeze({
    id: "naics-236220",
    code: "236220",
    title: NAICS_INDUSTRY.title,
    version: "2022",
    source: "participant_selected",
    provenance: "Participant selected from U.S. Census Bureau 2022 NAICS",
    visibility: "network",
  });
  const legacy = Object.freeze({
    id: "naics-import-236220",
    code: "236220",
    title: "Commercial construction import",
    version: "2022",
    source: "authorized_import",
    provenance: "Authorized migration record",
    visibility: "network",
  });
  f.state.industry = Object.freeze({
    id: f.organization.id,
    organizationId: f.organization.id,
    revision: 7,
    industries: Object.freeze([]),
    naics: Object.freeze([current, legacy]),
    updatedByUserId: f.user.id,
    updatedByMembershipId: f.membership.id,
    updatedAt: NOW,
  });

  await f.service.updateIndustry(
    { ...f.scope, commandId: "command-preserve-legacy-naics" },
    {
      industries: [{ id: "industry-renovation", label: "Renovation", visibility: "network" }],
      naics: [],
      preserveExistingNaics: true,
      expectedIndustryRevision: 7,
    },
  );
  assert.deepEqual(f.state.industry.naics, [legacy]);

  await f.service.updateIndustry(
    { ...f.scope, commandId: "command-replace-governed-naics" },
    {
      industries: [{ id: "industry-renovation", label: "Renovation", visibility: "network" }],
      naics: [{ code: "236220", version: "2022", visibility: "network" }],
      preserveExistingNaics: true,
      expectedIndustryRevision: 8,
    },
  );
  assert.deepEqual(f.state.industry.naics.map((descriptor) => descriptor.code), ["236220", "236220"]);
  assert.equal(f.state.industry.naics[0].source, "authorized_import");
  assert.equal(f.state.industry.naics[1].source, "participant_selected");

  await f.service.updateIndustry(
    { ...f.scope, commandId: "command-remove-legacy-naics" },
    {
      industries: [{ id: "industry-renovation", label: "Renovation", visibility: "network" }],
      naics: [{ code: "236220", version: "2022", visibility: "network" }],
      preserveExistingNaics: false,
      expectedIndustryRevision: 9,
    },
  );
  assert.deepEqual(f.state.industry.naics.map((descriptor) => descriptor.code), ["236220"]);
});

test("industry persistence rejects a concurrent stale historical merge", async () => {
  let injectConcurrentChange = true;
  const f = fixture("primary-administrator", {
    async beforeSave({ state, input }) {
      if (injectConcurrentChange && input.record.kind === "industry") {
        injectConcurrentChange = false;
        state.industry = Object.freeze({ ...state.industry, naics: Object.freeze([]), revision: 8 });
      }
    },
  });
  f.state.industry = Object.freeze({
    id: f.organization.id,
    organizationId: f.organization.id,
    revision: 7,
    industries: Object.freeze([]),
    naics: Object.freeze([{
      id: "naics-import-236220",
      code: "236220",
      title: "Commercial construction import",
      version: "2022",
      source: "authorized_import",
      provenance: "Authorized migration record",
      visibility: "network",
    }]),
    updatedByUserId: f.user.id,
    updatedByMembershipId: f.membership.id,
    updatedAt: NOW,
  });

  await assert.rejects(
    f.service.updateIndustry(
      { ...f.scope, commandId: "command-stale-history-merge" },
      { industries: [], naics: [], preserveExistingNaics: true, expectedIndustryRevision: 7 },
    ),
    (error) => error instanceof MarketProfileError && error.code === "conflict",
  );
  assert.equal(f.state.industry.revision, 8);
  assert.deepEqual(f.state.industry.naics, []);
  assert.equal(f.state.commands.size, 0);
});

test("industry updates reject invented or stale NAICS identities before persistence", async () => {
  const f = fixture();
  await assert.rejects(
    f.service.updateIndustry(
      { ...f.scope, commandId: "command-invented-naics" },
      { industries: [], naics: [{ code: "999999", version: "2022", visibility: "network" }], preserveExistingNaics: false, expectedIndustryRevision: 0 },
    ),
    (error) => error instanceof MarketProfileError && error.code === "invalid",
  );
  await assert.rejects(
    f.service.updateIndustry(
      { ...f.scope, commandId: "command-stale-naics" },
      { industries: [], naics: [{ code: "236220", version: "2017", visibility: "network" }], preserveExistingNaics: false, expectedIndustryRevision: 0 },
    ),
    (error) => error instanceof MarketProfileError && error.code === "invalid",
  );
  await assert.rejects(
    f.service.updateIndustry(
      { ...f.scope, commandId: "command-duplicate-naics" },
      { industries: [], naics: [{ code: "236220", version: "2022", visibility: "network" }, { code: "236220", version: "2022", visibility: "network" }], preserveExistingNaics: false, expectedIndustryRevision: 0 },
    ),
    (error) => error instanceof MarketProfileError && error.code === "invalid",
  );
  assert.equal(f.state.industry, null);
});

test("market-profile model validation remains a typed participant input error", async () => {
  const f = fixture();
  const industries = Array.from({ length: 21 }, (_, index) => ({
    id: `industry-${index}`,
    label: `Industry ${index}`,
    visibility: "network",
  }));
  await assert.rejects(
    f.service.updateIndustry(
      { ...f.scope, commandId: "command-invalid-industry" },
      { industries, naics: [], preserveExistingNaics: false, expectedIndustryRevision: 0 },
    ),
    (error) => error instanceof MarketProfileError && error.code === "invalid",
  );
  assert.equal(f.state.commands.size, 0);
  assert.equal(f.state.industry, null);
});

test("market-profile persistence races are conflicts while operational failures propagate", async () => {
  const conflict = fixture("primary-administrator", {
    persistenceError: new MarketProfilePersistenceConflictError("Injected command collision."),
  });
  await assert.rejects(
    conflict.service.updateIndustry(
      { ...conflict.scope, commandId: "command-raced-industry" },
      { industries: [], naics: [], preserveExistingNaics: false, expectedIndustryRevision: 0 },
    ),
    (error) => error instanceof MarketProfileError && error.code === "conflict",
  );

  const outage = new Error("Injected market-profile storage outage.");
  const unavailable = fixture("primary-administrator", { persistenceError: outage });
  await assert.rejects(
    unavailable.service.updateIndustry(
      { ...unavailable.scope, commandId: "command-outage-industry" },
      { industries: [], naics: [], preserveExistingNaics: false, expectedIndustryRevision: 0 },
    ),
    (error) => error === outage,
  );
});

test("network/public capability projections enforce visibility without exposing private evidence", async () => {
  const f = fixture();
  const result = await f.service.claimCapability(f.scope, { ...f.claimInput, evidenceIds: ["private-evidence-1"], visibility: "network" });
  const network = projectOrganizationCapabilityClaim(result.claim, "network");
  assert.equal(network.provenanceLabel, "Organization claimed");
  assert.equal(projectOrganizationCapabilityClaim(result.claim, "public"), null);
  assert.doesNotMatch(JSON.stringify(network), /private-evidence-1|assertedBy/);
});
