import assert from "node:assert/strict";
import test from "node:test";

import { resolveReferralCommunicationDeliveryAuthority } from "../src/application/referrals/referral-communication-delivery.ts";

const communication = Object.freeze({
  id: "message-1",
  referralId: "referral-1",
  request: Object.freeze({}),
  status: "retryable-failure",
  attemptCount: 1,
  lastErrorCode: "network",
  updatedAt: "2026-08-10T00:00:00.000Z",
});

function referral(overrides = {}) {
  return Object.freeze({
    id: "referral-1",
    schemaVersion: 1,
    version: 2,
    senderOrganizationId: "org-sender",
    senderOrganizationName: "Sender",
    recipient: Object.freeze({
      kind: "external",
      displayName: "Invitee",
      email: "invitee@example.test",
    }),
    attachedRecipientOrganizationId: null,
    need: "introduction",
    summary: "Introduction",
    urgency: "standard",
    preferredContactMethod: "email",
    purpose: "business-introduction",
    opportunityReference: null,
    providerContext: null,
    providerRedirect: null,
    sharedFields: Object.freeze(["sender-organization", "summary"]),
    consent: Object.freeze({}),
    status: "sent",
    outcome: null,
    correlationId: "referral:1",
    acquisitionContextId: "acq-1",
    communicationMessageId: communication.id,
    createdByUserId: "user-sender",
    createdByMembershipId: "membership-sender",
    recipientActorUserId: null,
    createdAt: "2026-08-10T00:00:00.000Z",
    sentAt: "2026-08-10T00:00:00.000Z",
    expiresAt: "2026-09-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
    ...overrides,
  });
}

test("delivery authority rechecks current referral instead of trusting stale route state", async () => {
  const staleRouteReferral = referral();
  assert.equal(staleRouteReferral.attachedRecipientOrganizationId, null);

  const currentReferral = referral({
    version: 3,
    attachedRecipientOrganizationId: "org-attached",
    recipientActorUserId: "user-attached",
    updatedAt: "2026-08-10T00:01:00.000Z",
  });
  const calls = [];
  const authority = await resolveReferralCommunicationDeliveryAuthority(communication, {
    async getCommunication(id) {
      calls.push(["communication", id]);
      return communication;
    },
    async getReferral(id) {
      calls.push(["referral", id]);
      return currentReferral;
    },
  });

  assert.deepEqual(calls, [["communication", communication.id], ["referral", communication.referralId]]);
  assert.equal(authority.referral.attachedRecipientOrganizationId, "org-attached");
  assert.equal(authority.permitted, false);
});

test("delivery authority rejects lifecycle advancement that occurred after route inspection", async () => {
  const authority = await resolveReferralCommunicationDeliveryAuthority(communication, {
    async getCommunication() { return communication; },
    async getReferral() { return referral({ version: 3, status: "accepted" }); },
  });
  assert.equal(authority.permitted, false);
});

test("delivery authority permits a still-current unconsumed retryable invitation", async () => {
  const authority = await resolveReferralCommunicationDeliveryAuthority(communication, {
    async getCommunication() { return communication; },
    async getReferral() { return referral(); },
  });
  assert.equal(authority.permitted, true);
});

test("delivery authority fails closed when communication no longer belongs to referral", async () => {
  await assert.rejects(
    resolveReferralCommunicationDeliveryAuthority(communication, {
      async getCommunication() { return communication; },
      async getReferral() { return referral({ communicationMessageId: "message-other" }); },
    }),
    /authority is unavailable/,
  );
});
