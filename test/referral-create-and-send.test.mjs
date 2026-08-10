import assert from "node:assert/strict";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import { ReferralCreateAndSendService } from "../src/application/referrals/referral-create-and-send.ts";
import { ReferralNetworkError } from "../src/application/referrals/referral-network.ts";
import {
  acquisitionIntent,
  acquisitionSource,
  createAcquisitionContextEnvelope,
  createAcquisitionContextEvent,
} from "../src/domain/acquisition/model.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../src/domain/authorization/organization-role-presets.ts";
import { createOrganizationAccount, createOrganizationProfile } from "../src/domain/organizations/model.ts";
import { ReferralPersistenceConflictError } from "../src/domain/referrals/repository.ts";
import { createOrganizationMembership, createUserIdentity } from "../src/domain/users/model.ts";

const NOW = "2026-08-09T12:00:00.000Z";
const ACQUISITION_SECRET = "abcdefghijklmnopqrstuvwxyzABCDEFGH12345678";

function fixture() {
  let sequence = 0;
  const senderOrganization = createOrganizationAccount({ id: "org-atomic-sender", now: NOW });
  const recipientOrganization = createOrganizationAccount({ id: "org-atomic-recipient", now: NOW });
  const unavailableProvider = createOrganizationAccount({ id: "org-provider-unavailable", now: NOW });
  const organizations = [senderOrganization, recipientOrganization, unavailableProvider];
  const profiles = [
    createOrganizationProfile(senderOrganization, {
      id: "profile-atomic-sender",
      displayName: "Atomic Sender",
      now: NOW,
    }),
    createOrganizationProfile(recipientOrganization, {
      id: "profile-atomic-recipient",
      displayName: "Atomic Recipient",
      now: NOW,
    }),
    createOrganizationProfile(unavailableProvider, {
      id: "profile-provider-unavailable",
      displayName: "Unavailable Provider",
      now: NOW,
    }),
  ];
  const user = createUserIdentity({
    id: "user-atomic-sender",
    name: "Atomic Sender Manager",
    primaryEmail: "sender@example.test",
    loginProvider: "firebase",
    loginSubject: "subject-atomic-sender",
    now: NOW,
  });
  const membership = createOrganizationMembership(user, senderOrganization, {
    id: "membership-atomic-sender",
    now: NOW,
  });
  const preset = standardOrganizationRolePreset("primary-administrator");
  const authorization = createOrganizationUserAuthorization(membership, senderOrganization, {
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
      expiresAt: "2026-08-10T12:00:00.000Z",
    },
    source: "session-cookie",
  });
  const state = {
    referrals: new Map(),
    commands: new Map(),
    education: new Map(),
    events: new Map(),
    audits: new Map(),
    communications: new Map(),
    acquisitionContexts: new Map(),
    acquisitionEvents: new Map(),
    acquisitionCalls: [],
    providerInspections: [],
    failAtomicPersistence: false,
    failAtomicConflict: false,
  };

  const repository = {
    async getById(id) {
      return state.referrals.get(id) ?? null;
    },
    async getCommand(id) {
      return state.commands.get(id) ?? null;
    },
    async getCommunication(id) {
      return state.communications.get(id) ?? null;
    },
    async saveCreateAndSend(bundle) {
      if (state.failAtomicConflict) {
        throw new ReferralPersistenceConflictError("Injected referral transaction collision.");
      }
      const prior = state.commands.get(bundle.command.id);
      if (prior) {
        if (
          prior.referralId === bundle.command.referralId &&
          prior.action === bundle.command.action &&
          prior.requestFingerprint === bundle.command.requestFingerprint &&
          prior.resultingVersion === bundle.command.resultingVersion
        ) {
          return "replayed";
        }
        throw new Error("Referral command identity collision.");
      }
      if (state.failAtomicPersistence) throw new Error("Injected atomic persistence failure.");
      if (
        state.referrals.has(bundle.referral.id) ||
        state.education.has(bundle.education.id) ||
        bundle.events.some((item) => state.events.has(item.id)) ||
        bundle.audits.some((item) => state.audits.has(item.id)) ||
        (bundle.communication && state.communications.has(bundle.communication.id)) ||
        (bundle.acquisition && (
          state.acquisitionContexts.has(bundle.acquisition.context.id) ||
          state.acquisitionEvents.has(bundle.acquisition.event.id)
        ))
      ) throw new Error("Referral create-and-send identity collision.");

      state.referrals.set(bundle.referral.id, bundle.referral);
      state.commands.set(bundle.command.id, bundle.command);
      state.education.set(bundle.education.id, bundle.education);
      bundle.events.forEach((item) => state.events.set(item.id, item));
      bundle.audits.forEach((item) => state.audits.set(item.id, item));
      if (bundle.communication) state.communications.set(bundle.communication.id, bundle.communication);
      if (bundle.acquisition) {
        state.acquisitionContexts.set(bundle.acquisition.context.id, bundle.acquisition.context);
        state.acquisitionEvents.set(bundle.acquisition.event.id, bundle.acquisition.event);
      }
      return "created";
    },
  };

  const dependencies = {
    authorization: {
      accountSecurity: {
        async inspect(subject) {
          if (subject !== user.login.subject) throw new Error("missing account");
          return {
            provider: "firebase",
            subject,
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
        async getById(id) { return organizations.find((item) => item.id === id) ?? null; },
        async create() {},
      },
      memberships: {
        async getById(id) { return id === membership.id ? membership : null; },
        async listByUserId() { return []; },
        async listActiveByUserId() { return []; },
        async listByOrganizationId() { return []; },
        async create() {},
      },
      authorizations: {
        async getByMembershipId(id) { return id === membership.id ? authorization : null; },
        async listByUserId() { return []; },
        async listByOrganizationId() { return []; },
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
      async getById() { return null; },
      async getByOrganizationId(id) { return profiles.find((profile) => profile.organizationId === id) ?? null; },
      async create() {},
    },
    repository,
    acquisition: {
      async issue() { throw new Error("Legacy acquisition issuance must not run in atomic create-and-send."); },
      prepare({ referralId, commandId, issuedAt }) {
        state.acquisitionCalls.push({ referralId, commandId });
        const contextId = `acq-${commandId}`;
        const acquisitionContext = createAcquisitionContextEnvelope({
          id: contextId,
          intent: acquisitionIntent({ kind: "referral", subjectReference: referralId }),
          source: acquisitionSource({ channel: "referral-link", sourceReference: referralId }),
          browserSecretDigest: "a".repeat(64),
          issuedAt,
          expiresAt: "2026-09-08T12:00:00.000Z",
        });
        const acquisitionEvent = createAcquisitionContextEvent({
          id: `acq-event-${commandId}`,
          context: acquisitionContext,
          kind: "issued",
          occurredAt: issuedAt,
        });
        return {
          context: acquisitionContext,
          event: acquisitionEvent,
          serializedToken: `v1.${contextId}.${ACQUISITION_SECRET}`,
        };
      },
    },
    providerEligibility: {
      async inspect(input) {
        state.providerInspections.push(input);
        const eligible = input.organizationId === recipientOrganization.id &&
          (!input.serviceId || input.serviceId === "service-approved") &&
          (!input.publicationVersion || input.publicationVersion === 3);
        const profile = profiles.find((item) => item.organizationId === input.organizationId);
        return { eligible, displayName: eligible ? profile?.displayName ?? null : null };
      },
    },
    publicOrigin: "https://rfxchange.example",
    now: () => NOW,
    id: () => `generated-${++sequence}`,
  };
  const service = new ReferralCreateAndSendService(dependencies);
  const scope = (commandId) => ({
    context,
    organizationId: senderOrganization.id,
    membershipId: membership.id,
    commandId,
  });
  const standardInput = Object.freeze({
    recipient: Object.freeze({
      kind: "organization",
      organizationId: recipientOrganization.id,
      displayName: "Atomic Recipient",
      notificationEmail: null,
    }),
    need: "introduction",
    summary: "A manufacturer needs a local accessibility consultant for a facility review.",
    urgency: "standard",
    preferredContactMethod: "email",
    purpose: "business-introduction",
    sharedFields: Object.freeze(["sender-organization", "summary"]),
    consentAcknowledged: true,
  });
  function renameRecipient(displayName) {
    profiles[1] = createOrganizationProfile(recipientOrganization, {
      id: "profile-atomic-recipient",
      displayName,
      now: NOW,
    });
  }
  return { service, state, scope, standardInput, organizations, renameRecipient };
}

function externalInput(f) {
  return {
    ...f.standardInput,
    recipient: {
      kind: "external",
      displayName: "External Recipient",
      email: "external@example.test",
    },
  };
}

test("one command atomically persists reviewed education, created/sent evidence and final referral", async () => {
  const f = fixture();
  const result = await f.service.createAndSend(f.scope("atomic-create-send-1"), f.standardInput);

  assert.equal(result.replayed, false);
  assert.equal(result.referral.status, "sent");
  assert.equal(result.referral.version, 2);
  assert.equal(result.referral.recipient.displayName, "Atomic Recipient");
  assert.equal(f.state.referrals.size, 1);
  assert.equal(f.state.commands.size, 1);
  assert.equal(f.state.education.size, 1);
  assert.deepEqual([...f.state.events.values()].map((item) => [item.kind, item.aggregateVersion]), [["created", 1], ["sent", 2]]);
  assert.equal(f.state.audits.size, 3);
  assert.equal([...f.state.referrals.values()].some((item) => item.status === "draft"), false);
});

test("first write rejects an organization label that no longer matches authoritative review data", async () => {
  const f = fixture();
  f.renameRecipient("Renamed Recipient");
  await assert.rejects(
    f.service.createAndSend(f.scope("atomic-label-stale"), f.standardInput),
    (error) => error instanceof ReferralNetworkError && error.code === "conflict" && /name changed after review/i.test(error.message),
  );
  assert.equal(f.state.referrals.size, 0);
  assert.equal(f.state.education.size, 0);
});

test("post-commit organization rename does not invalidate replay because mutable label is not fingerprint identity", async () => {
  const f = fixture();
  const first = await f.service.createAndSend(f.scope("atomic-rename-replay"), f.standardInput);
  f.renameRecipient("Renamed After Commit");
  const replay = await f.service.createAndSend(f.scope("atomic-rename-replay"), f.standardInput);

  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(replay.referral.id, first.referral.id);
  assert.equal(f.state.referrals.size, 1);
  assert.equal(f.state.commands.size, 1);
});

test("replay returns latest authoritative aggregate after later lifecycle transition", async () => {
  const f = fixture();
  const first = await f.service.createAndSend(f.scope("atomic-later-state"), f.standardInput);
  const latest = Object.freeze({
    ...first.referral,
    version: 5,
    status: "closed",
    updatedAt: "2026-08-09T13:00:00.000Z",
  });
  f.state.referrals.set(first.referral.id, latest);

  const replay = await f.service.createAndSend(f.scope("atomic-later-state"), f.standardInput);
  assert.equal(replay.replayed, true);
  assert.equal(replay.referral.version, 5);
  assert.equal(replay.referral.status, "closed");
  assert.equal(f.state.referrals.size, 1);
});

test("replaying same external command keeps one referral, outbox and acquisition context", async () => {
  const f = fixture();
  const input = externalInput(f);
  const first = await f.service.createAndSend(f.scope("atomic-replay-1"), input);
  const replay = await f.service.createAndSend(f.scope("atomic-replay-1"), input);

  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(replay.referral.id, first.referral.id);
  assert.equal(f.state.referrals.size, 1);
  assert.equal(f.state.commands.size, 1);
  assert.equal(f.state.events.size, 2);
  assert.equal(f.state.audits.size, 3);
  assert.equal(f.state.education.size, 1);
  assert.equal(f.state.communications.size, 1);
  assert.equal(f.state.acquisitionContexts.size, 1);
  assert.equal(f.state.acquisitionEvents.size, 1);
  assert.equal(f.state.acquisitionCalls.length, 1);
  assert.equal(replay.communication.id, first.communication.id);
});

test("reused command with changed stable business input conflicts", async () => {
  const f = fixture();
  await f.service.createAndSend(f.scope("atomic-collision-1"), f.standardInput);
  await assert.rejects(
    f.service.createAndSend(f.scope("atomic-collision-1"), { ...f.standardInput, summary: "A materially different referral request." }),
    (error) => error instanceof ReferralNetworkError && error.code === "conflict",
  );
  assert.equal(f.state.referrals.size, 1);
});

test("atomic persistence outage remains a dependency failure and leaves no durable evidence", async () => {
  const f = fixture();
  f.state.failAtomicPersistence = true;
  await assert.rejects(
    f.service.createAndSend(f.scope("atomic-failure-1"), externalInput(f)),
    (error) => error instanceof Error && !(error instanceof ReferralNetworkError) && /Injected/.test(error.message),
  );
  assert.equal(f.state.referrals.size, 0);
  assert.equal(f.state.commands.size, 0);
  assert.equal(f.state.education.size, 0);
  assert.equal(f.state.events.size, 0);
  assert.equal(f.state.audits.size, 0);
  assert.equal(f.state.communications.size, 0);
  assert.equal(f.state.acquisitionContexts.size, 0);
  assert.equal(f.state.acquisitionEvents.size, 0);
  assert.equal(f.state.acquisitionCalls.length, 1);
});

test("atomic transaction command collisions remain domain conflicts and leave no partial evidence", async () => {
  const f = fixture();
  f.state.failAtomicConflict = true;
  await assert.rejects(
    f.service.createAndSend(f.scope("atomic-race-1"), externalInput(f)),
    (error) => error instanceof ReferralNetworkError && error.code === "conflict",
  );
  assert.equal(f.state.referrals.size, 0);
  assert.equal(f.state.commands.size, 0);
  assert.equal(f.state.events.size, 0);
  assert.equal(f.state.acquisitionCalls.length, 1);
});

test("provider requests use the same atomic command and exact eligible provider publication", async () => {
  const f = fixture();
  const providerInput = {
    ...f.standardInput,
    preferredContactMethod: "platform",
    purpose: "provider-connection",
    providerContext: {
      providerOrganizationId: f.organizations[1].id,
      serviceId: "service-approved",
      publicationVersion: 3,
    },
  };
  const result = await f.service.createAndSend(f.scope("atomic-provider-1"), providerInput);
  assert.equal(result.referral.status, "sent");
  assert.equal(result.referral.purpose, "provider-connection");
  assert.equal(f.state.providerInspections.length, 1);

  const unavailable = fixture();
  await assert.rejects(
    unavailable.service.createAndSend(unavailable.scope("atomic-provider-unavailable"), {
      ...unavailable.standardInput,
      preferredContactMethod: "platform",
      purpose: "provider-connection",
      providerContext: {
        providerOrganizationId: unavailable.organizations[2].id,
        serviceId: "service-unavailable",
        publicationVersion: 1,
      },
      recipient: {
        kind: "organization",
        organizationId: unavailable.organizations[2].id,
        displayName: "Unavailable Provider",
        notificationEmail: null,
      },
    }),
    (error) => error instanceof ReferralNetworkError && error.code === "not-found",
  );
  assert.equal(unavailable.state.referrals.size, 0);
});
