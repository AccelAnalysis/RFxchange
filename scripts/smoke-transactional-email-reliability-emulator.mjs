import assert from "node:assert/strict";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore as getClientFirestore,
  setDoc,
} from "firebase/firestore";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

import {
  createTransactionalEmailDeliveryIntent,
} from "../functions/lib/application/transactional-email-delivery-audit.js";
import {
  FirestoreTransactionalEmailDeliveryAuditStore,
  TRANSACTIONAL_EMAIL_DELIVERIES_COLLECTION,
  TRANSACTIONAL_EMAIL_DELIVERY_EVENTS_COLLECTION,
} from "../functions/lib/runtime/firestore-transactional-email-delivery-audit-store.js";
import { backgroundJobPayloadFingerprint } from "../functions/lib/runtime/background-job-identifiers.js";

assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099");
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");

const projectId = "demo-rfxchange";
const suffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
const now = new Date().toISOString();
const clientApp = initializeClientApp(
  {
    apiKey: "demo-api-key",
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    appId: `1:123:web:comms-${suffix}`,
  },
  `comms-client-${suffix}`,
);
const clientAuth = initializeAuth(clientApp, { persistence: inMemoryPersistence });
connectAuthEmulator(clientAuth, "http://127.0.0.1:9099", { disableWarnings: true });
const clientDb = getClientFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
const anonymousApp = initializeClientApp(
  {
    apiKey: "demo-api-key",
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    appId: `1:123:web:comms-anonymous-${suffix}`,
  },
  `comms-anonymous-${suffix}`,
);
const anonymousDb = getClientFirestore(anonymousApp);
connectFirestoreEmulator(anonymousDb, "127.0.0.1", 8080);
const adminApp = initializeAdminApp({ projectId }, `comms-admin-${suffix}`);
const adminAuth = getAdminAuth(adminApp);
const adminDb = getAdminFirestore(adminApp);
let uid = null;
let deliveryId = null;

async function expectDenied(operation, label) {
  await assert.rejects(
    operation,
    (error) => error?.code === "permission-denied" || error?.code === "firestore/permission-denied",
    label,
  );
}

try {
  const credential = await createUserWithEmailAndPassword(
    clientAuth,
    `comms-${suffix}@example.test`,
    "RFxchange-COMMS-005-Smoke-123!",
  );
  uid = credential.user.uid;

  const idempotencyKey = `comms-emulator-${suffix}`;
  const payloadFingerprint = backgroundJobPayloadFingerprint({
    event: `event-${suffix}`,
    template: "organization.invitation@1",
    recipient: "recipient@example.test",
  });
  const intent = createTransactionalEmailDeliveryIntent({
    messageId: `message-${suffix}`,
    idempotencyKey,
    payloadFingerprint,
    purpose: "administrative",
    eventKey: "organization.user-invited",
    eventVersion: 1,
    originatingEventId: `event-${suffix}`,
    templateKey: "organization.invitation",
    templateVersion: 1,
    recipientEmail: "Recipient@Example.Test",
    correlationId: `correlation-${suffix}`,
    environment: "development",
    projectId,
    organizationId: `organization-${suffix}`,
    userId: `user-${suffix}`,
    relatedObjectType: "organization-invitation",
    relatedObjectId: `invitation-${suffix}`,
    requestedAt: now,
  });
  const store = new FirestoreTransactionalEmailDeliveryAuditStore(adminDb);
  const queued = await store.ensureIntent(intent, now);
  deliveryId = queued.deliveryId;
  assert.equal(queued.status, "queued");
  assert.equal(queued.attemptCount, 0);

  await store.recordAttempt({
    intent,
    deliveryId,
    jobId: `job-${suffix}`,
    attemptNumber: 1,
    observedAt: now,
  });
  await store.recordFailure({
    intent,
    deliveryId,
    jobId: `job-${suffix}`,
    attemptNumber: 1,
    status: "terminal-failure",
    providerKey: "microsoft-graph",
    providerReference: `request-${suffix}`,
    errorCode: "transactional-email-microsoft-graph-access-denied",
    retryAfterSeconds: null,
    observedAt: now,
  });

  const terminal = await store.listTerminalFailures({
    environment: "development",
    projectId,
    organizationId: `organization-${suffix}`,
  });
  assert.equal(terminal.length, 1);
  assert.equal(terminal[0].deliveryId, deliveryId);
  assert.equal(terminal[0].status, "terminal-failure");
  assert.equal(terminal[0].attemptCount, 1);

  const adminSnapshot = await adminDb
    .collection(TRANSACTIONAL_EMAIL_DELIVERIES_COLLECTION)
    .doc(deliveryId)
    .get();
  assert.equal(adminSnapshot.exists, true);
  const persisted = adminSnapshot.data();
  assert.match(persisted.recipientAddressHash, /^[a-f0-9]{64}$/);
  assert.equal(persisted.recipientDomain, "example.test");
  for (const prohibited of [
    "recipientEmail",
    "subject",
    "text",
    "html",
    "variables",
    "clientSecret",
  ]) {
    assert.equal(Object.hasOwn(persisted, prohibited), false, `Audit record retained ${prohibited}.`);
  }

  for (const db of [anonymousDb, clientDb]) {
    await expectDenied(
      getDoc(doc(db, TRANSACTIONAL_EMAIL_DELIVERIES_COLLECTION, deliveryId)),
      "Direct client delivery read must remain denied.",
    );
    await expectDenied(
      setDoc(doc(db, TRANSACTIONAL_EMAIL_DELIVERIES_COLLECTION, `write-${suffix}`), {
        status: "accepted",
      }),
      "Direct client delivery write must remain denied.",
    );
    const eventSnapshot = await adminDb
      .collection(TRANSACTIONAL_EMAIL_DELIVERY_EVENTS_COLLECTION)
      .where("deliveryId", "==", deliveryId)
      .limit(1)
      .get();
    assert.equal(eventSnapshot.empty, false);
    await expectDenied(
      getDoc(doc(db, TRANSACTIONAL_EMAIL_DELIVERY_EVENTS_COLLECTION, eventSnapshot.docs[0].id)),
      "Direct client delivery-event read must remain denied.",
    );
  }

  console.log("COMMS-003/004/005 transactional email reliability emulator smoke passed.");
} finally {
  if (deliveryId) {
    const events = await adminDb
      .collection(TRANSACTIONAL_EMAIL_DELIVERY_EVENTS_COLLECTION)
      .where("deliveryId", "==", deliveryId)
      .get()
      .catch(() => null);
    if (events) {
      const batch = adminDb.batch();
      for (const event of events.docs) batch.delete(event.ref);
      batch.delete(adminDb.collection(TRANSACTIONAL_EMAIL_DELIVERIES_COLLECTION).doc(deliveryId));
      await batch.commit().catch(() => undefined);
    }
  }
  if (uid) await adminAuth.deleteUser(uid).catch(() => undefined);
  await deleteAdminApp(adminApp);
  await Promise.all([
    deleteClientApp(clientApp),
    deleteClientApp(anonymousApp),
  ]);
}
