import assert from "node:assert/strict";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import {
  acquisitionIntent,
  acquisitionSource,
  createAcquisitionContextEnvelope,
  createAcquisitionContextEvent,
} from "../src/domain/acquisition/model.ts";
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
const externalReferralId = `ref-external-${suffix}`;
const atomicCommandId = `command-create-send-${suffix}`;
const externalCommandId = `command-create-send-external-${suffix}`;
const acquisitionContextId = `acq-referral-${suffix}`;
const acquisitionEventId = `acq-event-referral-${suffix}`;
const createdIds = {
  businessReferrals: [referralId, externalReferralId],
  businessReferralEvents: [
    `event-created-${suffix}`,
    `event-sent-${suffix}`,
    `event-created-external-${suffix}`,
    `event-sent-external-${suffix}`,
  ],
  businessReferralCommands: [atomicCommandId, externalCommandId],
  referralEducationAcknowledgements: [`education-${suffix}`, `education-external-${suffix}`],
  referralCommunicationIntents: [`message-${suffix}`, `message-external-${suffix}`],
  organizationAuditEvents: [
    `audit-education-${suffix}`,
    `audit-created-${suffix}`,
    `audit-sent-${suffix}`,
    `audit-education-external-${suffix}`,
    `audit-created-external-${suffix}`,
    `audit-sent-external-${suffix}`,
  ],
  acquisitionContexts: [acquisitionContextId],
  acquisitionContextEvents: [acquisitionEventId],
};
const command = (id, referralReference, action, version, requestFingerprint = "f".repeat(64)) => ({ id, referralId: referralReference, actorOrganizationId: `org-sender-${suffix}`, action, requestFingerprint, resultingVersion: version, recordedAt: now });
const event = (id, kind, referral, commandId, fromStatus = null) => ({ id, referralId: referral.id, senderOrganizationId: referral.senderOrganizationId, recipientOrganizationId: referral.attachedRecipientOrganizationId, kind, fromStatus, toStatus: referral.status, aggregateVersion: referral.version, actorUserId: `user-sender-${suffix}`, actorMembershipId: `membership-sender-${suffix}`, commandId, occurredAt: now });
const audit = (id, action) => ({ id, organizationId: `org-sender-${suffix}`, actor: { userId: `user-sender-${suffix}`, membershipId: `membership-sender-${suffix}` }, action, target: null, occurredAt: now });

function communicationFor(referral, messageId, recipientEmail, recipientName) {
  const request = createTransactionalEmailRequest({
    id: messageId,
    purpose: "transactional",
    recipientEmail,
    eventKey: "referral.invitation.sent",
    templateKey: "referral-invitation",
    variables: { recipient_name: recipientName },
    correlationId: referral.correlationId,
    idempotencyKey: `referral-invitation:${referral.id}`,
    requestedAt: now,
    organizationId: referral.senderOrganizationId,
    relatedObjectType: "business-referral",
    relatedObjectId: referral.id,
  });
  return {
    request,
    intent: {
      id: messageId,
      referralId: referral.id,
      request,
      status: "queued",
      attemptCount: 0,
      lastErrorCode: null,
      deliveryClaim: null,
      updatedAt: now,
    },
  };
}

try {
  for (const collection of Object.keys(createdIds).filter((name) => name !== "organizationAuditEvents")) {
    await assert.rejects(getDoc(doc(clientDb, collection, `forged-${suffix}`)), (error) => /permission-denied/.test(error?.code));
    await assert.rejects(setDoc(doc(clientDb, collection, `forged-${suffix}`), { forged: true }), (error) => /permission-denied/.test(error?.code));
  }

  const acknowledgement = {
    id: `education-${suffix}`,
    version: 1,
    organizationId: `org-sender-${suffix}`,
    actorUserId: `user-sender-${suffix}`,
    actorMembershipId: `membership-sender-${suffix}`,
    recipientLabel: "Recipient Studio",
    sharedFields: ["sender-organization", "summary"],
    acknowledgedAt: now,
  };
  const draft = createReferral({
    id: referralId,
    senderOrganizationId: `org-sender-${suffix}`,
    senderOrganizationName: "Sender Works",
    recipient: {
      kind: "organization",
      organizationId: `org-recipient-${suffix}`,
      displayName: "Recipient Studio",
      notificationEmail: "recipient@example.test",
    },
    need: "introduction",
    summary: "A real business introduction with minimum necessary context.",
    urgency: "standard",
    preferredContactMethod: "email",
    purpose: "business-introduction",
    sharedFields: ["sender-organization", "summary"],
    consentAcknowledged: true,
    correlationId: `correlation-${suffix}`,
    actorUserId: `user-sender-${suffix}`,
    actorMembershipId: `membership-sender-${suffix}`,
    now,
    expiresAt: "2026-09-07T15:00:00.000Z",
  });
  const sent = transitionReferral({
    referral: draft,
    expectedVersion: 1,
    to: "sent",
    actorUserId: `user-sender-${suffix}`,
    now,
    communicationMessageId: `message-${suffix}`,
  });
  const primaryCommunication = communicationFor(
    sent,
    `message-${suffix}`,
    "recipient@example.test",
    "Recipient Studio",
  );
  const bundle = {
    referral: sent,
    events: [
      event(`event-created-${suffix}`, "created", draft, atomicCommandId),
      event(`event-sent-${suffix}`, "sent", sent, atomicCommandId, "draft"),
    ],
    command: command(atomicCommandId, referralId, "sent", 2),
    education: acknowledgement,
    audits: [
      audit(`audit-education-${suffix}`, "referral.education.acknowledged"),
      audit(`audit-created-${suffix}`, "referral.created"),
      audit(`audit-sent-${suffix}`, "referral.sent"),
    ],
    communication: primaryCommunication.intent,
    acquisition: null,
  };

  assert.equal(await repository.saveCreateAndSend(bundle), "created");
  assert.equal(await repository.saveCreateAndSend(bundle), "replayed");
  await assert.rejects(
    repository.saveCreateAndSend({
      ...bundle,
      command: command(atomicCommandId, referralId, "sent", 2, "a".repeat(64)),
    }),
    /command identity collision/,
  );

  const acquisitionContext = createAcquisitionContextEnvelope({
    id: acquisitionContextId,
    intent: acquisitionIntent({ kind: "referral", subjectReference: externalReferralId }),
    source: acquisitionSource({
      channel: "referral-link",
      sourceReference: externalReferralId,
    }),
    browserSecretDigest: "a".repeat(64),
    issuedAt: now,
    expiresAt: "2026-09-07T15:00:00.000Z",
  });
  const acquisitionEvent = createAcquisitionContextEvent({
    id: acquisitionEventId,
    context: acquisitionContext,
    kind: "issued",
    occurredAt: now,
  });
  const externalDraft = createReferral({
    id: externalReferralId,
    senderOrganizationId: `org-sender-${suffix}`,
    senderOrganizationName: "Sender Works",
    recipient: {
      kind: "external",
      displayName: "External Recipient",
      email: "external@example.test",
    },
    need: "introduction",
    summary: "An external invitation that must share one transaction with its acquisition context.",
    urgency: "standard",
    preferredContactMethod: "email",
    purpose: "business-introduction",
    sharedFields: ["sender-organization", "summary"],
    consentAcknowledged: true,
    correlationId: `correlation-external-${suffix}`,
    actorUserId: `user-sender-${suffix}`,
    actorMembershipId: `membership-sender-${suffix}`,
    now,
    expiresAt: "2026-09-07T15:00:00.000Z",
  });
  const externalSent = transitionReferral({
    referral: externalDraft,
    expectedVersion: 1,
    to: "sent",
    actorUserId: `user-sender-${suffix}`,
    now,
    acquisitionContextId,
    communicationMessageId: `message-external-${suffix}`,
  });
  const externalCommunication = communicationFor(
    externalSent,
    `message-external-${suffix}`,
    "external@example.test",
    "External Recipient",
  );
  const externalBundle = {
    referral: externalSent,
    events: [
      event(`event-created-external-${suffix}`, "created", externalDraft, externalCommandId),
      event(`event-sent-external-${suffix}`, "sent", externalSent, externalCommandId, "draft"),
    ],
    command: command(externalCommandId, externalReferralId, "sent", 2, "e".repeat(64)),
    education: {
      id: `education-external-${suffix}`,
      version: 1,
      organizationId: `org-sender-${suffix}`,
      actorUserId: `user-sender-${suffix}`,
      actorMembershipId: `membership-sender-${suffix}`,
      recipientLabel: "External Recipient",
      sharedFields: ["sender-organization", "summary"],
      acknowledgedAt: now,
    },
    audits: [
      audit(`audit-education-external-${suffix}`, "referral.education.acknowledged"),
      audit(`audit-created-external-${suffix}`, "referral.created"),
      audit(`audit-sent-external-${suffix}`, "referral.sent"),
    ],
    communication: externalCommunication.intent,
    acquisition: {
      context: acquisitionContext,
      event: acquisitionEvent,
    },
  };
  assert.equal(await repository.saveCreateAndSend(externalBundle), "created");
  assert.equal(await repository.saveCreateAndSend(externalBundle), "replayed");

  const stored = await repository.getById(referralId);
  assert.equal(stored?.status, "sent");
  assert.equal(stored?.version, 2);
  assert.equal((await repository.listInvolvingOrganization(`org-sender-${suffix}`)).length, 2);
  assert.equal((await repository.listInvolvingOrganization(`org-recipient-${suffix}`)).length, 1);
  assert.equal((await adminDb.collection("businessReferralEvents").where("senderOrganizationId", "==", `org-sender-${suffix}`).get()).size, 4);
  assert.equal((await adminDb.collection("referralEducationAcknowledgements").where("organizationId", "==", `org-sender-${suffix}`).get()).size, 2);
  assert.equal((await adminDb.collection("organizationAuditEvents").where("organizationId", "==", `org-sender-${suffix}`).get()).size, 6);
  assert.equal((await adminDb.collection("acquisitionContexts").doc(acquisitionContextId).get()).exists, true);
  assert.equal((await adminDb.collection("acquisitionContextEvents").doc(acquisitionEventId).get()).exists, true);

  await assert.rejects(
    repository.save({
      referral: { ...sent, version: 4 },
      event: {
        ...event(`event-stale-${suffix}`, "accepted", sent, `command-stale-${suffix}`, "sent"),
        id: `event-stale-${suffix}`,
        aggregateVersion: 4,
      },
      command: command(`command-stale-${suffix}`, referralId, "accepted", 4),
      audits: [],
      communication: null,
    }),
    /current version is 2/,
  );

  const receipt = createTransactionalEmailDeliveryReceipt({
    messageId: primaryCommunication.request.id,
    status: "accepted",
    providerKey: "emulator-fake",
    recordedAt: now,
  });
  const claimNow = new Date();
  const claimExpiresAt = new Date(claimNow.getTime() + 120_000).toISOString();
  const primaryClaim = await repository.claimCommunicationDelivery({
    communicationId: primaryCommunication.intent.id,
    claimId: `claim-primary-${suffix}`,
    claimedAt: claimNow.toISOString(),
    expiresAt: claimExpiresAt,
  });
  assert.equal(primaryClaim.claimed, true);
  assert.equal((await repository.claimCommunicationDelivery({
    communicationId: primaryCommunication.intent.id,
    claimId: `claim-primary-competing-${suffix}`,
    claimedAt: new Date(claimNow.getTime() + 1_000).toISOString(),
    expiresAt: claimExpiresAt,
  })).claimed, false);
  assert.equal((await repository.claimCommunicationDelivery({
    communicationId: primaryCommunication.intent.id,
    claimId: `claim-primary-after-deadline-${suffix}`,
    claimedAt: new Date(claimNow.getTime() + 121_000).toISOString(),
    expiresAt: new Date(claimNow.getTime() + 241_000).toISOString(),
  })).claimed, false);
  const acceptedWhileDelivering = transitionReferral({
    referral: sent,
    expectedVersion: 2,
    to: "accepted",
    actorUserId: `user-recipient-${suffix}`,
    now: new Date(claimNow.getTime() + 2_000).toISOString(),
  });
  await assert.rejects(
    repository.save({
      referral: acceptedWhileDelivering,
      event: event(`event-claimed-transition-${suffix}`, "accepted", acceptedWhileDelivering, `command-claimed-transition-${suffix}`, "sent"),
      command: command(`command-claimed-transition-${suffix}`, referralId, "accepted", 3),
      audits: [],
      communication: null,
    }),
    /delivery is in progress/,
  );
  const delivered = await repository.recordCommunicationResult({
    intent: primaryClaim.communication,
    claimId: `claim-primary-${suffix}`,
    receipt,
  });
  assert.equal(delivered.status, "accepted");
  assert.equal(delivered.attemptCount, 1);

  const externalClaim = await repository.claimCommunicationDelivery({
    communicationId: externalCommunication.intent.id,
    claimId: `claim-external-${suffix}`,
    claimedAt: claimNow.toISOString(),
    expiresAt: claimExpiresAt,
  });
  assert.equal(externalClaim.claimed, true);
  await assert.rejects(
    repository.save({
      referral: {
        ...externalSent,
        version: 3,
        attachedRecipientOrganizationId: `org-external-${suffix}`,
        recipientActorUserId: `user-external-${suffix}`,
        updatedAt: new Date(claimNow.getTime() + 2_000).toISOString(),
      },
      event: {
        ...event(`event-claimed-attachment-${suffix}`, "recipient-attached", externalSent, `command-claimed-attachment-${suffix}`, "sent"),
        aggregateVersion: 3,
      },
      command: command(`command-claimed-attachment-${suffix}`, externalReferralId, "recipient-attached", 3),
      audits: [],
      communication: null,
    }),
    /delivery is in progress/,
  );
  const retryable = await repository.recordCommunicationResult({
    intent: externalClaim.communication,
    claimId: `claim-external-${suffix}`,
    errorCode: "emulator-retryable",
    retryable: true,
  });
  assert.equal(retryable.status, "retryable-failure");
  assert.equal(retryable.deliveryClaim, null);
  console.log("Referral create-and-send atomicity, replay, acquisition context, non-reclaimable delivery-claim coordination, tenant queries, communication outbox, and direct-client denial emulator smoke passed.");
} finally {
  const paths = Object.entries(createdIds).flatMap(([collection, ids]) => ids.map((id) => [collection, id]));
  await Promise.allSettled(paths.map(([collection, id]) => adminDb.collection(collection).doc(id).delete()));
  const residuals = await Promise.all(paths.map(([collection, id]) => adminDb.collection(collection).doc(id).get()));
  assert.equal(residuals.filter((snapshot) => snapshot.exists).length, 0, "Referral emulator cleanup left residual records.");
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
