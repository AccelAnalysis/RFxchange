import assert from "node:assert/strict";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import { ResourceProviderFoundationError, ResourceProviderFoundationService } from "../src/application/resource-providers/provider-foundation.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../src/domain/authorization/organization-role-presets.ts";
import { createOrganizationAccount, createOrganizationProfile } from "../src/domain/organizations/model.ts";
import { providerApplicationContent } from "../src/domain/resource-providers/model.ts";
import { createOrganizationMembership, createUserIdentity } from "../src/domain/users/model.ts";

const START = "2026-08-09T12:00:00.000Z";

function fixture(role = "primary-administrator") {
  let sequence = 0;
  const organization = createOrganizationAccount({ id: "org-provider", now: START });
  const profile = createOrganizationProfile(organization, { id: "profile-provider", displayName: "Neighborhood Enterprise Center", now: START });
  const user = createUserIdentity({ id: "user-provider", name: "Provider Manager", primaryEmail: "provider@example.test", loginProvider: "firebase", loginSubject: "subject-provider", now: START });
  const membership = createOrganizationMembership(user, organization, { id: "membership-provider", now: START });
  const preset = standardOrganizationRolePreset(role);
  const authorization = createOrganizationUserAuthorization(membership, organization, { roleKey: preset.key, permissions: preset.permissions, now: START });
  const context = authenticatedServerContext({ user, claims: { provider: "firebase", subject: user.login.subject, email: user.primaryEmail, displayName: user.name, emailVerified: true, isAnonymous: false, authenticatedAt: START, issuedAt: START, expiresAt: "2026-08-10T12:00:00.000Z" }, source: "session-cookie" });
  const completion = { id: organization.id, organizationId: organization.id, profileId: profile.id, status: "active" };
  const location = { id: organization.id, organizationId: organization.id, geographyId: "geo-boston", visibility: "approximate", updatedAt: START };
  const serviceGeography = { id: organization.id, organizationId: organization.id, primaryGeographyId: "geo-boston", serviceGeographyIds: ["geo-boston"], updatedAt: START };
  const state = { application: null, commands: new Map(), events: [], organizationAudits: [], adminAudits: [], status: null, profile: null };
  const repository = {
    async getApplicationByOrganizationId(id) { return state.application?.organizationId === id ? state.application : null; },
    async listApplications() { return state.application ? [state.application] : []; },
    async getCommand(id) { return state.commands.get(id) ?? null; },
    async getStatusByOrganizationId() { return state.status; },
    async getServiceProfileByOrganizationId() { return state.profile; },
    async listEvents() { return state.events; },
    async saveParticipant(input) { assert.equal(state.application?.version ?? null, input.expectedVersion); state.application = input.application; state.commands.set(input.command.id, input.command); state.events.push(input.event); state.organizationAudits.push(input.audit); if (input.serviceProfile) state.profile = input.serviceProfile; },
    async saveAdministrative(input) { assert.equal(state.application?.version, input.expectedVersion); state.application = input.application; state.commands.set(input.command.id, input.command); state.events.push(input.event); state.adminAudits.push(input.audit); if (input.status) state.status = input.status; if (input.serviceProfile) state.profile = input.serviceProfile; },
  };
  const service = new ResourceProviderFoundationService({
    authorization: { accountSecurity: { async inspect() { return { provider: "firebase", subject: user.login.subject, email: user.primaryEmail, emailVerified: true, disabled: false, mfaEnrolled: true, tokensValidAfter: null, lastSignInAt: START }; } }, organizations: { async getById(id) { return id === organization.id ? organization : null; }, async create() {} }, memberships: { async getById(id) { return id === membership.id ? membership : null; }, async listByUserId() { return []; }, async listActiveByUserId() { return []; }, async listByOrganizationId() { return []; }, async create() {} }, authorizations: { async getByMembershipId(id) { return id === membership.id ? authorization : null; }, async listByUserId() { return []; }, async listByOrganizationId() { return []; }, async save() {} }, restrictions: { async getById() { return null; }, async getForOrganization() { return null; }, async getForMembership() { return null; }, async save() {} } },
    profiles: { async getById() { return profile; }, async getByOrganizationId(id) { return id === organization.id ? profile : null; }, async create() {} },
    completions: { async getByOrganizationId() { return completion; } }, locations: { async getByOrganizationId() { return location; } }, serviceGeographies: { async getByOrganizationId() { return serviceGeography; } },
    evidence: { async allBelongToOrganization(_organizationId, ids) { return !ids.includes("foreign-evidence"); } }, repository, now: () => START, id: () => `generated-${++sequence}`,
  });
  const scope = (commandId) => ({ context, organizationId: organization.id, membershipId: membership.id, commandId });
  const adminAuthority = { administratorId: "admin-provider", rolePresetKeys: [], effectivePermissions: ["provider.application.read", "provider.application.review"], updatedAt: START };
  const adminScope = (permission, commandId) => ({ context, authority: adminAuthority, administratorId: "admin-provider", permission, scope: { kind: "GLOBAL", value: "GLOBAL" }, commandId });
  const content = providerApplicationContent({ categories: ["technical-assistance", "other"], otherCategoryDescription: "Digital-access navigation", services: [{ id: "service-1", name: "Contract readiness clinic", description: "Participant-authored weekly clinic for small organizations.", availability: "unknown", capacityNote: null }], populationsServed: "Small organizations preparing for institutional contracting.", eligibility: "Organizations based in the service geography; final eligibility is confirmed at intake.", intakeMethod: "Submit the provider intake form or call the official contact.", modalities: ["hybrid"], languages: ["English", "Spanish"], officialContact: { displayName: "Avery Rivera", roleTitle: "Program Director", email: "avery@example.test", phone: "+1 617 555 0110" }, evidenceAssetIds: [], authorityAttested: true });
  return { service, state, scope, adminScope, organization, content, completion };
}

test("governed provider lifecycle preserves response, decision, audit, status, and profile history", async () => {
  const f = fixture();
  const draft = await f.service.saveDraft(f.scope("draft-1"), { expectedVersion: null, content: f.content });
  const replay = await f.service.saveDraft(f.scope("draft-1"), { expectedVersion: null, content: f.content });
  assert.equal(replay.replayed, true);
  const submitted = await f.service.participantTransition(f.scope("submit-1"), { action: "submitted", expectedVersion: draft.application.version });
  const reviewing = await f.service.adminTransition(f.adminScope("provider.application.review", "review-1"), { organizationId: f.organization.id, action: "review-started", expectedVersion: submitted.application.version });
  const requested = await f.service.adminTransition(f.adminScope("provider.application.review", "request-1"), { organizationId: f.organization.id, action: "information-requested", expectedVersion: reviewing.application.version, note: "Clarify whether the clinic accepts virtual intake." });
  const responseText = "Virtual intake is available every Tuesday; final eligibility remains an intake decision.";
  const responded = await f.service.saveDraft(f.scope("response-1"), { expectedVersion: requested.application.version, content: f.content, response: responseText });
  assert.equal(responded.application.applicantResponse, responseText);
  const resubmitted = await f.service.participantTransition(f.scope("resubmit-1"), { action: "resubmitted", expectedVersion: responded.application.version });
  const approved = await f.service.adminTransition(f.adminScope("provider.application.review", "approve-1"), { organizationId: f.organization.id, action: "approved", expectedVersion: resubmitted.application.version, note: "Application and authoritative references satisfy the provider policy." });
  assert.equal(approved.providerStatus.status, "official-resource-provider");
  assert.equal(approved.serviceProfile.availability, "unknown");
  assert.doesNotMatch(JSON.stringify(approved.providerStatus), /verified|endorsed|paid|founding/i);
  assert.deepEqual(f.state.events.map((event) => event.kind), ["draft-saved", "submitted", "review-started", "information-requested", "response-saved", "resubmitted", "approved"]);
  assert.equal(f.state.organizationAudits.length, 4);
  assert.equal(f.state.adminAudits.length, 3);
  assert.equal(f.state.adminAudits.at(-1).permissionsExercised[0], "provider.application.review");
});

test("approved manager maintains a separate profile with explicit unknown capacity", async () => {
  const f = fixture();
  const draft = await f.service.saveDraft(f.scope("draft-profile"), { expectedVersion: null, content: f.content });
  const submitted = await f.service.participantTransition(f.scope("submit-profile"), { action: "submitted", expectedVersion: draft.application.version });
  const reviewing = await f.service.adminTransition(f.adminScope("provider.application.review", "review-profile"), { organizationId: f.organization.id, action: "review-started", expectedVersion: submitted.application.version });
  await f.service.adminTransition(f.adminScope("provider.application.review", "approve-profile"), { organizationId: f.organization.id, action: "approved", expectedVersion: reviewing.application.version, note: "Approved for controlled provider inventory." });
  const updated = await f.service.updateServiceProfile(f.scope("profile-update"), { expectedVersion: 1, categories: f.content.categories, otherCategoryDescription: f.content.otherCategoryDescription, services: f.content.services, populationsServed: f.content.populationsServed, eligibility: f.content.eligibility, intakeMethod: f.content.intakeMethod, modalities: f.content.modalities, languages: f.content.languages, officialContact: f.content.officialContact, availability: "limited" });
  assert.equal(updated.serviceProfile.version, 2);
  assert.equal(updated.serviceProfile.availability, "limited");
  assert.equal(updated.serviceProfile.visibility, "owner-and-administrators");
  assert.equal(f.state.application.version, 4, "profile maintenance does not rewrite the approved application version");
});

test("denial preserves its reason and a later draft starts a numbered reapplication", async () => {
  const f = fixture();
  const draft = await f.service.saveDraft(f.scope("denial-draft"), { expectedVersion: null, content: f.content });
  const submitted = await f.service.participantTransition(f.scope("denial-submit"), { action: "submitted", expectedVersion: draft.application.version });
  const reviewing = await f.service.adminTransition(f.adminScope("provider.application.review", "denial-review"), { organizationId: f.organization.id, action: "review-started", expectedVersion: submitted.application.version });
  const denied = await f.service.adminTransition(f.adminScope("provider.application.review", "denial-decision"), { organizationId: f.organization.id, action: "denied", expectedVersion: reviewing.application.version, note: "The submitted intake path is not yet operational." });
  assert.equal(denied.application.status, "denied");
  assert.equal(denied.application.decisionReason, "The submitted intake path is not yet operational.");
  assert.equal(f.state.status, null);

  const reapplied = await f.service.saveDraft(f.scope("reapplication-draft"), { expectedVersion: denied.application.version, content: f.content });
  assert.equal(reapplied.application.status, "draft");
  assert.equal(reapplied.application.applicationNumber, 2);
  assert.equal(reapplied.application.version, denied.application.version + 1);
  assert.equal(f.state.events.at(-2).note, "The submitted intake path is not yet operational.");
});

test("idempotency receipts cannot be replayed across organization boundaries", async () => {
  const f = fixture();
  const draft = await f.service.saveDraft(f.scope("organization-bound-command"), { expectedVersion: null, content: f.content });
  const receipt = f.state.commands.get("organization-bound-command");
  f.state.commands.set("foreign-command", { ...receipt, id: "foreign-command", organizationId: "org-foreign" });
  await assert.rejects(
    f.service.saveDraft(f.scope("foreign-command"), { expectedVersion: null, content: f.content }),
    (error) => error instanceof ResourceProviderFoundationError && error.code === "forbidden",
  );
  assert.equal(f.state.application.version, draft.application.version);
});

test("Profile Complete, resource.manage, evidence ownership, expected version, and exact admin scope fail closed", async () => {
  const incomplete = fixture(); incomplete.completion.status = "inactive";
  await assert.rejects(incomplete.service.saveDraft(incomplete.scope("incomplete"), { expectedVersion: null, content: incomplete.content }), (error) => error instanceof ResourceProviderFoundationError && error.code === "profile-incomplete");
  const viewer = fixture("viewer");
  await assert.rejects(viewer.service.saveDraft(viewer.scope("viewer"), { expectedVersion: null, content: viewer.content }), /missing-permission/);
  const foreign = fixture();
  await assert.rejects(foreign.service.saveDraft(foreign.scope("foreign"), { expectedVersion: null, content: { ...foreign.content, evidenceAssetIds: ["foreign-evidence"] } }), /another organization/);
  const stale = fixture(); const draft = await stale.service.saveDraft(stale.scope("first"), { expectedVersion: null, content: stale.content });
  await assert.rejects(stale.service.participantTransition(stale.scope("stale"), { action: "submitted", expectedVersion: draft.application.version - 1 }), /reload the current version/);
  await assert.rejects(stale.service.adminDetail(stale.adminScope("provider.application.review", "wrong-permission"), stale.organization.id), /provider.application.read/);
  const wrongScope = { ...stale.adminScope("provider.application.read", "wrong-scope"), scope: { kind: "ORGANIZATION", targetId: "other", value: "ORGANIZATION:other" } };
  await assert.rejects(stale.service.adminDetail(wrongScope, stale.organization.id), /does not cover/);
});

test("category vocabulary is multi-select, Other requires explanation, and participant text stays verbatim", () => {
  assert.throws(() => providerApplicationContent({ ...fixture().content, otherCategoryDescription: "" }), /requires a description/);
  const authored = "Eligibility: 10–49 employees; call us before uploading anything.";
  const content = providerApplicationContent({ ...fixture().content, categories: ["capital-provider", "technical-assistance"], otherCategoryDescription: null, eligibility: authored });
  assert.deepEqual(content.categories, ["capital-provider", "technical-assistance"]);
  assert.equal(content.eligibility, authored);
});
