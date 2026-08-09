import assert from "node:assert/strict";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { createTransactionalEmailRequest, createTransactionalEmailDeliveryReceipt } from "../src/domain/communications/transactional-email.ts";
import { createReferral, transitionReferral } from "../src/domain/referrals/model.ts";
import { FirestoreReferralRepository } from "../src/infrastructure/firestore/referrals.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
const projectId = "demo-rfxchange";
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId }, `referral-admin-${suffix}`);
const clientApp = initializeClientApp({ apiKey: "demo", authDomain: `${projectId}.firebaseapp.com`, projectId, appId: `1:123:web:referral-${suffix}` }, `referral-client-${suffix}`);
const adminDb = getAdminFirestore(adminApp);
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
const repository = new FirestoreReferralRepository(adminDb);
const now = "2026-08-08T15:00:00.000Z";
const referralId = `ref-${suffix}`;
const createdIds = {
  businessReferrals: [referralId],
  businessReferralEvents: [`event-created-${suffix}`, `event-sent-${suffix}`],
  businessReferralCommands: [`command-created-${suffix}`, `command-sent-${suffix}`],
  referralEducationAcknowledgements: [`education-${suffix}`],
  referralCommunicationIntents: [`message-${suffix}`],
  organizationAuditEvents: [`audit-education-${suffix}`, `audit-created-${suffix}`, `audit-sent-${suffix}`],
};
const command = (id, action, version) => ({ id, referralId, actorOrganizationId: `org-sender-${suffix}`, action, requestFingerprint: "f".repeat(64), resultingVersion: version, recordedAt: now });
const event = (id, kind, referral, commandId, fromStatus = null) => ({ id, referralId, senderOrganizationId: referral.senderOrganizationId, recipientOrganizationId: referral.attachedRecipientOrganizationId, kind, fromStatus, toStatus: referral.status, aggregateVersion: referral.version, actorUserId: `user-sender-${suffix}`, actorMembershipId: `membership-sender-${suffix}`, commandId, occurredAt: now });
const audit = (id, action) => ({ id, organizationId: `org-sender-${suffix}`, actor: { userId: `user-sender-${suffix}`, membershipId: `membership-sender-${suffix}` }, action, target: null, occurredAt: now });

try {
  for (const collection of Object.keys(createdIds).filter((name) => name !== "organizationAuditEvents")) {
    await assert.rejects(getDoc(doc(clientDb, collection, `forged-${suffix}`)), (error) => /permission-denied/.test(error?.code));
    await assert.rejects(setDoc(doc(clientDb, collection, `forged-${suffix}`), { forged: true }), (error) => /permission-denied/.test(error?.code));
  }
  const acknowledgement = { id: `education-${suffix}`, version: 1, organizationId: `org-sender-${suffix}`, actorUserId: `user-sender-${suffix}`, actorMembershipId: `membership-sender-${suffix}`, recipientLabel: "Recipient Studio", sharedFields: ["sender-organization", "summary"], acknowledgedAt: now };
  await repository.acknowledgeEducation({ acknowledgement, command: { ...command(`command-education-${suffix}`, "education-acknowledged", 1), referralId: acknowledgement.id }, audit: audit(`audit-education-${suffix}`, "referral.education.acknowledged") });
  createdIds.businessReferralCommands.push(`command-education-${suffix}`);
  const draft = createReferral({ id: referralId, senderOrganizationId: `org-sender-${suffix}`, senderOrganizationName: "Sender Works", recipient: { kind: "organization", organizationId: `org-recipient-${suffix}`, displayName: "Recipient Studio", notificationEmail: "recipient@example.test" }, need: "introduction", summary: "A real business introduction with minimum necessary context.", urgency: "standard", preferredContactMethod: "email", purpose: "business-introduction", sharedFields: ["sender-organization", "summary"], consentAcknowledged: true, correlationId: `correlation-${suffix}`, actorUserId: `user-sender-${suffix}`, actorMembershipId: `membership-sender-${suffix}`, now, expiresAt: "2026-09-07T15:00:00.000Z" });
  await repository.save({ referral: draft, event: event(`event-created-${suffix}`, "created", draft, `command-created-${suffix}`), command: command(`command-created-${suffix}`, "created", 1), audits: [audit(`audit-created-${suffix}`, "referral.created")], communication: null });
  const sent = transitionReferral({ referral: draft, expectedVersion: 1, to: "sent", actorUserId: `user-sender-${suffix}`, now, communicationMessageId: `message-${suffix}` });
  const request = createTransactionalEmailRequest({ id: `message-${suffix}`, purpose: "transactional", recipientEmail: "recipient@example.test", eventKey: "referral.invitation.sent", templateKey: "referral-invitation", variables: { recipient_name: "Recipient Studio" }, correlationId: sent.correlationId, idempotencyKey: `referral-invitation:${referralId}`, requestedAt: now, organizationId: sent.senderOrganizationId, relatedObjectType: "business-referral", relatedObjectId: referralId });
  const communication = { id: `message-${suffix}`, referralId, request, status: "queued", attemptCount: 0, lastErrorCode: null, updatedAt: now };
  await repository.save({ referral: sent, event: event(`event-sent-${suffix}`, "sent", sent, `command-sent-${suffix}`, "draft"), command: command(`command-sent-${suffix}`, "sent", 2), audits: [audit(`audit-sent-${suffix}`, "referral.sent")], communication });
  const stored = await repository.getById(referralId);
  assert.equal(stored?.status, "sent");
  assert.equal(stored?.version, 2);
  assert.equal((await repository.listInvolvingOrganization(`org-sender-${suffix}`)).length, 1);
  assert.equal((await repository.listInvolvingOrganization(`org-recipient-${suffix}`)).length, 1);
  await assert.rejects(repository.save({ referral: { ...sent, version: 4 }, event: { ...event(`event-stale-${suffix}`, "accepted", sent, `command-stale-${suffix}`, "sent"), id: `event-stale-${suffix}`, aggregateVersion: 4 }, command: command(`command-stale-${suffix}`, "accepted", 4), audits: [], communication: null }), /current version is 2/);
  const receipt = createTransactionalEmailDeliveryReceipt({ messageId: request.id, status: "accepted", providerKey: "emulator-fake", recordedAt: now });
  const delivered = await repository.recordCommunicationResult({ intent: communication, receipt });
  assert.equal(delivered.status, "accepted");
  assert.equal(delivered.attemptCount, 1);
  console.log("Referral Firestore atomicity, tenant queries, communication idempotency record, and direct-client denial emulator smoke passed.");
} finally {
  const paths = Object.entries(createdIds).flatMap(([collection, ids]) => ids.map((id) => [collection, id]));
  await Promise.allSettled(paths.map(([collection, id]) => adminDb.collection(collection).doc(id).delete()));
  const residuals = await Promise.all(paths.map(([collection, id]) => adminDb.collection(collection).doc(id).get()));
  assert.equal(residuals.filter((snapshot) => snapshot.exists).length, 0, "Referral emulator cleanup left residual records.");
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
