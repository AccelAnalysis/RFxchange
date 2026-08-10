import assert from "node:assert/strict";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import { ReferralNetworkError, ReferralNetworkService } from "../src/application/referrals/referral-network.ts";
import { referralTransactionalEmailCatalog } from "../src/application/referrals/referral-templates.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../src/domain/authorization/organization-role-presets.ts";
import { createOrganizationAccount, createOrganizationProfile } from "../src/domain/organizations/model.ts";
import { createOrganizationMembership, createUserIdentity } from "../src/domain/users/model.ts";
import { createReferral, projectReferral, transitionReferral } from "../src/domain/referrals/model.ts";

const START = "2026-08-08T15:00:00.000Z";

function fixture() {
  let now = START;
  let sequence = 0;
  const senderOrganization = createOrganizationAccount({ id: "org-sender", now });
  const recipientOrganization = createOrganizationAccount({ id: "org-recipient", now });
  const strangerOrganization = createOrganizationAccount({ id: "org-stranger", now });
  const organizations = [senderOrganization, recipientOrganization, strangerOrganization];
  const profiles = organizations.map((organization) => createOrganizationProfile(organization, { id: `profile-${organization.id}`, displayName: organization === senderOrganization ? "Sender Works" : organization === recipientOrganization ? "Recipient Studio" : "Unrelated Group", now }));
  const senderUser = createUserIdentity({ id: "user-sender", name: "Sender Manager", primaryEmail: "sender@example.test", loginProvider: "firebase", loginSubject: "subject-sender", now });
  const recipientUser = createUserIdentity({ id: "user-recipient", name: "Recipient Manager", primaryEmail: "recipient@example.test", loginProvider: "firebase", loginSubject: "subject-recipient", now });
  const strangerUser = createUserIdentity({ id: "user-stranger", name: "Stranger Manager", primaryEmail: "stranger@example.test", loginProvider: "firebase", loginSubject: "subject-stranger", now });
  const users = [senderUser, recipientUser, strangerUser];
  const memberships = users.map((user, index) => createOrganizationMembership(user, organizations[index], { id: `membership-${index}`, now }));
  const authorizations = memberships.map((membership, index) => {
    const preset = standardOrganizationRolePreset(index === 2 ? "viewer" : "primary-administrator");
    return createOrganizationUserAuthorization(membership, organizations[index], { roleKey: preset.key, permissions: preset.permissions, now });
  });
  const contexts = users.map((user) => authenticatedServerContext({ user, claims: { provider: "firebase", subject: user.login.subject, email: user.primaryEmail, displayName: user.name, emailVerified: true, isAnonymous: false, authenticatedAt: now, issuedAt: now, expiresAt: "2026-08-09T15:00:00.000Z" }, source: "session-cookie" }));
  const state = { referrals: new Map(), commands: new Map(), education: new Map(), events: [], audits: [], communications: new Map(), acquisitionCalls: [] };
  const repository = {
    async getById(id) { return state.referrals.get(id) ?? null; },
    async listInvolvingOrganization(id) { return [...state.referrals.values()].filter((record) => record.senderOrganizationId === id || record.attachedRecipientOrganizationId === id); },
    async getCommand(id) { return state.commands.get(id) ?? null; },
    async getEducation(organizationId, actorUserId) { return state.education.get(`${organizationId}:${actorUserId}`) ?? null; },
    async acknowledgeEducation(input) { if (state.commands.has(input.command.id)) return; state.education.set(`${input.acknowledgement.organizationId}:${input.acknowledgement.actorUserId}`, input.acknowledgement); state.commands.set(input.command.id, input.command); state.audits.push(input.audit); },
    async save(bundle) { if (state.commands.has(bundle.command.id)) return; const current = state.referrals.get(bundle.referral.id); if (current && current.version + 1 !== bundle.referral.version) throw new Error(`Referral changed; current version is ${current.version}.`); state.referrals.set(bundle.referral.id, bundle.referral); state.commands.set(bundle.command.id, bundle.command); state.events.push(bundle.event); state.audits.push(...bundle.audits); if (bundle.communication) state.communications.set(bundle.communication.id, bundle.communication); },
    async attachInvitation(input) { return this.save({ ...input, audits: [input.audit], communication: null }); },
    async getCommunication(id) { return state.communications.get(id) ?? null; },
    async recordCommunicationResult(input) { const updated = { ...input.intent, status: input.receipt ? "accepted" : input.retryable ? "retryable-failure" : "terminal-failure", attemptCount: input.intent.attemptCount + 1, lastErrorCode: input.errorCode ?? null, updatedAt: now }; state.communications.set(updated.id, updated); return updated; },
  };
  const service = new ReferralNetworkService({
    authorization: {
      accountSecurity: { async inspect(subject) { const user = users.find((candidate) => candidate.login.subject === subject); if (!user) throw new Error("missing"); return { provider: "firebase", subject, email: user.primaryEmail, emailVerified: true, disabled: false, mfaEnrolled: false, tokensValidAfter: null, lastSignInAt: now }; } },
      organizations: { async getById(id) { return organizations.find((item) => item.id === id) ?? null; }, async create() {} },
      memberships: { async getById(id) { return memberships.find((item) => item.id === id) ?? null; }, async listByUserId() { return []; }, async listActiveByUserId() { return []; }, async listByOrganizationId() { return []; }, async create() {} },
      authorizations: { async getByMembershipId(id) { return authorizations.find((item) => item.membershipId === id) ?? null; }, async listByUserId() { return []; }, async listByOrganizationId() { return []; }, async save() {} },
      restrictions: { async getById() { return null; }, async getForOrganization() { return null; }, async getForMembership() { return null; }, async save() {} },
    },
    profiles: { async getById() { return null; }, async getByOrganizationId(id) { return profiles.find((item) => item.organizationId === id) ?? null; }, async create() {} },
    repository,
    acquisition: { async issue({ referralId }) { state.acquisitionCalls.push(referralId); return { contextId: `acq-${referralId}`, serializedToken: `v1.acq-${referralId}.abcdefghijklmnopqrstuvwxyzABCDEFGH12345678` }; } },
    publicOrigin: "https://rfxchange.example",
    now: () => now,
    id: () => `generated-${++sequence}`,
  });
  const scope = (index, commandId) => ({ context: contexts[index], organizationId: organizations[index].id, membershipId: memberships[index].id, commandId });
  const standardInput = { recipient: { kind: "organization", organizationId: recipientOrganization.id, displayName: "ignored", notificationEmail: null }, need: "introduction", summary: "A manufacturer needs a local accessibility consultant for an upcoming facility review.", urgency: "standard", preferredContactMethod: "email", purpose: "business-introduction", sharedFields: ["sender-organization", "summary"], consentAcknowledged: true };
  async function prepareAndSend(recipient = standardInput.recipient) {
    const label = recipient.kind === "organization" ? "Recipient Studio" : recipient.displayName;
    await service.acknowledgeEducation(scope(0, `education-${sequence}`), { recipientLabel: label, sharedFields: standardInput.sharedFields });
    const draft = await service.createDraft(scope(0, `create-${sequence}`), { ...standardInput, recipient });
    return service.send(scope(0, `send-${sequence}`), { referralId: draft.referral.id, expectedVersion: draft.referral.version });
  }
  return { service, state, scope, organizations, users, memberships, contexts, standardInput, prepareAndSend, setNow(value) { now = value; } };
}

test("controlled referral lifecycle preserves append-only evidence and a non-verified outcome", async () => {
  const f = fixture();
  const sent = await f.prepareAndSend();
  const accepted = await f.service.transition(f.scope(1, "accept-1"), { referralId: sent.referral.id, expectedVersion: sent.referral.version, action: "accepted" });
  const contacted = await f.service.transition(f.scope(1, "contact-1"), { referralId: sent.referral.id, expectedVersion: accepted.referral.version, action: "contacted" });
  const closed = await f.service.transition(f.scope(0, "close-1"), { referralId: sent.referral.id, expectedVersion: contacted.referral.version, action: "closed", outcome: "connected" });
  assert.equal(closed.referral.status, "closed");
  assert.equal(closed.referral.outcome, "connected");
  assert.equal(closed.referral.version, 5);
  assert.deepEqual(f.state.events.map((item) => item.kind), ["created", "sent", "accepted", "contacted", "closed"]);
  assert.equal(f.state.audits.length, 6);
  assert.doesNotMatch(JSON.stringify(closed.referral), /verified|endorsement|contract|sale/);
});

test("first send requires a server acknowledgement for the exact recipient and shared fields", async () => {
  const f = fixture();
  const draft = await f.service.createDraft(f.scope(0, "create-no-education"), f.standardInput);
  await assert.rejects(f.service.send(f.scope(0, "send-no-education"), { referralId: draft.referral.id, expectedVersion: 1 }), (error) => error instanceof ReferralNetworkError && error.code === "education-required");
  await f.service.acknowledgeEducation(f.scope(0, "education-wrong"), { recipientLabel: "Another recipient", sharedFields: f.standardInput.sharedFields });
  await assert.rejects(f.service.send(f.scope(0, "send-wrong-education"), { referralId: draft.referral.id, expectedVersion: 1 }), /exact data/);
});

test("stale versions and illegal transitions fail with recoverable current-state guidance", async () => {
  const f = fixture();
  const sent = await f.prepareAndSend();
  await assert.rejects(f.service.transition(f.scope(1, "accept-stale"), { referralId: sent.referral.id, expectedVersion: 1, action: "accepted" }), /current version is 2/);
  await assert.rejects(f.service.transition(f.scope(0, "close-illegal"), { referralId: sent.referral.id, expectedVersion: 2, action: "closed", outcome: "connected" }), /cannot move from sent to closed/);
});

test("actors without referral permission fail closed before referral existence is disclosed", async () => {
  const f = fixture();
  const sent = await f.prepareAndSend();
  await assert.rejects(f.service.transition(f.scope(2, "stranger-contact"), { referralId: sent.referral.id, expectedVersion: 2, action: "contacted" }), (error) => error instanceof ReferralNetworkError && error.code === "forbidden" && /missing-permission/.test(error.message));
  await assert.rejects(f.service.snapshot({ context: f.contexts[2], organizationId: f.organizations[2].id, membershipId: f.memberships[2].id }), /missing-permission/);
});

test("sender and recipient projections minimize private invitation and actor data", async () => {
  const f = fixture();
  const sent = await f.prepareAndSend({ kind: "external", displayName: "External Recipient", email: "recipient@example.test" });
  const sender = projectReferral(sent.referral, f.organizations[0].id);
  assert.equal(sender.role, "sender");
  assert.equal(sender.senderOrganizationId, f.organizations[0].id);
  assert.equal(sender.recipientOrganizationId, null);
  assert.doesNotMatch(JSON.stringify(sender), /recipient@example\.test|acq-|membership-|user-/);
  assert.equal(projectReferral(sent.referral, f.organizations[1].id), null);
});

test("participant snapshot exposes a durable unknown delivery outcome without converting it to retryable failure", async () => {
  const f = fixture();
  const sent = await f.prepareAndSend({ kind: "external", displayName: "External Recipient", email: "recipient@example.test" });
  f.state.communications.set(sent.communication.id, Object.freeze({
    ...sent.communication,
    deliveryClaim: Object.freeze({
      id: "delivery-claim-unknown",
      claimedAt: START,
      expiresAt: "2026-08-08T15:01:00.000Z",
      outcome: "unknown",
    }),
  }));

  const snapshot = await f.service.snapshot({
    context: f.contexts[0],
    organizationId: f.organizations[0].id,
    membershipId: f.memberships[0].id,
  });
  assert.equal(snapshot.length, 1);
  assert.equal(snapshot[0].notificationStatus, "delivery-outcome-unknown");
});

test("external invitations reuse one referral, acquisition context, and versioned communication intent", async () => {
  const f = fixture();
  const sent = await f.prepareAndSend({ kind: "external", displayName: "External Recipient", email: "recipient@example.test" });
  assert.equal(f.state.acquisitionCalls.length, 1);
  assert.equal(f.state.referrals.size, 1);
  assert.equal(f.state.communications.size, 1);
  assert.equal(sent.communication.request.eventVersion, 1);
  assert.equal(sent.communication.request.templateVersion, 1);
  assert.equal(sent.communication.request.metadata.relatedObjectId, sent.referral.id);
  const rendered = await referralTransactionalEmailCatalog.render(sent.communication.request);
  assert.match(rendered.text, /Sending and delivery do not mean/);
  const replay = await f.service.send(f.scope(0, sent.receipt.id), { referralId: sent.referral.id, expectedVersion: 1 });
  assert.equal(replay.replayed, true);
  assert.equal(f.state.acquisitionCalls.length, 1);
});

test("external recipient attachment requires exact acquisition subject, current email, and explicit organization authority", async () => {
  const f = fixture();
  const sent = await f.prepareAndSend({ kind: "external", displayName: "External Recipient", email: "recipient@example.test" });
  await assert.rejects(f.service.attachExternalRecipient(f.scope(0, "attach-wrong-email"), { referralId: sent.referral.id, acquisitionContextId: sent.referral.acquisitionContextId, expectedVersion: 2 }), /signed-in email/);
  await assert.rejects(f.service.attachExternalRecipient(f.scope(1, "attach-wrong-context"), { referralId: sent.referral.id, acquisitionContextId: "acq-another", expectedVersion: 2 }), /does not match/);
  const attached = await f.service.attachExternalRecipient(f.scope(1, "attach-correct"), { referralId: sent.referral.id, acquisitionContextId: sent.referral.acquisitionContextId, expectedVersion: 2 });
  assert.equal(attached.referral.attachedRecipientOrganizationId, f.organizations[1].id);
  const recipientProjection = projectReferral(attached.referral, f.organizations[1].id);
  assert.equal(recipientProjection.role, "recipient");
  assert.equal(recipientProjection.senderOrganizationId, f.organizations[0].id);
  assert.equal(recipientProjection.recipientOrganizationId, f.organizations[1].id);
  assert.equal(attached.referral.status, "sent");
});

test("expiry is explicit and cannot be bypassed by a later acceptance", () => {
  const f = fixture();
  const referral = createReferral({ id: "ref-expiry", senderOrganizationId: f.organizations[0].id, senderOrganizationName: "Sender Works", recipient: f.standardInput.recipient, need: "introduction", summary: f.standardInput.summary, urgency: "standard", preferredContactMethod: "email", purpose: "business-introduction", sharedFields: f.standardInput.sharedFields, consentAcknowledged: true, correlationId: "correlation-expiry", actorUserId: f.users[0].id, actorMembershipId: f.memberships[0].id, now: START, expiresAt: "2026-08-09T15:00:00.000Z" });
  const sent = transitionReferral({ referral, expectedVersion: 1, to: "sent", actorUserId: f.users[0].id, now: "2026-08-08T16:00:00.000Z" });
  const expired = transitionReferral({ referral: sent, expectedVersion: 2, to: "expired", actorUserId: f.users[0].id, now: "2026-08-10T15:00:00.000Z" });
  assert.equal(expired.status, "expired");
  assert.throws(() => transitionReferral({ referral: expired, expectedVersion: 3, to: "accepted", actorUserId: f.users[1].id, now: "2026-08-10T15:01:00.000Z" }), /expired|cannot move/);
});

test("minimum-sharing validation rejects missing consent, unknown fields, and mismatched opportunity context", () => {
  const f = fixture();
  const base = { id: "ref-invalid", senderOrganizationId: f.organizations[0].id, senderOrganizationName: "Sender Works", recipient: f.standardInput.recipient, need: "introduction", summary: f.standardInput.summary, urgency: "standard", preferredContactMethod: "email", purpose: "business-introduction", correlationId: "correlation-invalid", actorUserId: f.users[0].id, actorMembershipId: f.memberships[0].id, now: START, expiresAt: "2026-09-08T15:00:00.000Z" };
  assert.throws(() => createReferral({ ...base, sharedFields: ["sender-organization", "summary"], consentAcknowledged: false }), /Confirm the exact/);
  assert.throws(() => createReferral({ ...base, sharedFields: ["sender-organization", "summary", "private-evidence"], consentAcknowledged: true }), /approved minimum/);
  assert.throws(() => createReferral({ ...base, sharedFields: ["sender-organization", "summary", "opportunity-reference"], consentAcknowledged: true }), /must match/);
});
