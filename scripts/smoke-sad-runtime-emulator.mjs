import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp as initializeClient, deleteApp as deleteClient } from "firebase/app";
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore as getClientFirestore, connectFirestoreEmulator, doc, getDoc, setDoc } from "firebase/firestore";
import { SAD_RUNTIME_COLLECTIONS } from "../src/infrastructure/firestore/sad-runtime-schema.ts";
import { runPersistedPublicEnrichment } from "../functions/lib/runtime/public-enrichment-store.js";
import { normalizeTelnyxEvent, persistTelnyxEvent, reconcileTelnyxEvent } from "../src/infrastructure/communications/telnyx-events.ts";
import { communicationAddressKey } from "../src/infrastructure/communications/address-key.ts";
import { dispatchLifecycleCommunications, currentLifecycleState } from "../src/infrastructure/communications/lifecycle-runtime.ts";
import { DEFAULT_LIFECYCLE_POLICY, COMMUNICATION_CONSENT_VERSION, chooseLifecycleJourney } from "../src/domain/communications/lifecycle.ts";
import { SmsProviderError } from "../src/infrastructure/communications/telnyx-sms.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099");
const projectId = "demo-rfxchange";
const suffix = randomUUID();
const app = initializeApp({ projectId }, `sad-${suffix}`);
const db = getFirestore(app);
const client = initializeClient({ projectId, apiKey: "demo-api-key", authDomain: `${projectId}.firebaseapp.com` }, `sad-client-${suffix}`);
const auth = getAuth(client);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
const clientDb = getClientFirestore(client);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
const touched = new Set();
const set = async (collection, id, value) => { touched.add(`${collection}/${id}`); await db.collection(collection).doc(id).set(value); };
const denied = promise => assert.rejects(promise, error => /permission-denied/.test(error?.code));

try {
  for (const authenticated of [false, true]) {
    if (authenticated) await createUserWithEmailAndPassword(auth, `sad-${suffix}@example.test`, "Emulator-only-password-123!");
    for (const collection of Object.keys(SAD_RUNTIME_COLLECTIONS)) {
      await denied(getDoc(doc(clientDb, collection, suffix)));
      await denied(setDoc(doc(clientDb, collection, suffix), { forged: true }));
    }
  }

  const subject = { organizationId: `org-${suffix}`, displayName: "Fixture Company", uei: "ABCDEFGHIJKL" };
  let lookups = 0;
  const adapter = { source: "sam", async lookup() { lookups++; return { source: "sam", status: "no-match", retrievedAt: new Date().toISOString(), findings: [], errorCode: null }; } };
  const first = await runPersistedPublicEnrichment(db, subject, "fixture-replay", [adapter]);
  await runPersistedPublicEnrichment(db, subject, "fixture-replay", [adapter]);
  assert.equal(lookups, 1, "A replay must not query providers again.");
  await assert.rejects(runPersistedPublicEnrichment(db, { ...subject, uei: "MNOPQRSTUVWX" }, "fixture-replay", [adapter]), /command-conflict/);
  const otherTenant = await runPersistedPublicEnrichment(db, { ...subject, organizationId: `other-${suffix}` }, "fixture-replay", [adapter]);
  assert.notEqual(otherTenant.id, first.id);
  let release;
  let entered;
  const started = new Promise(resolve => { entered = resolve; });
  const blocked = new Promise(resolve => { release = resolve; });
  let enrichmentClock = Date.now();
  const clock = () => new Date(enrichmentClock).toISOString();
  const old = runPersistedPublicEnrichment(db, subject, "fixture-lease", [{ source: "sam", async lookup() { entered(); await blocked; return adapter.lookup(); } }], clock);
  await started;
  await assert.rejects(runPersistedPublicEnrichment(db, subject, "fixture-lease", [adapter], clock), /in-progress/);
  enrichmentClock += 61_000;
  const newer = await runPersistedPublicEnrichment(db, subject, "fixture-lease", [adapter], clock);
  release();
  await assert.rejects(old, /lease-lost/);
  assert.equal((await db.collection("publicEnrichmentRuns").doc(newer.id).get()).get("completedAt"), newer.completedAt);

  const scope = { messagingProfileId: "profile-fixture", fromNumber: "+15555550100" };
  const inbound = (id, text, occurredAt) => ({ data: { id, event_type: "message.received", occurred_at: occurredAt, payload: {
    id: `message-${id}`, messaging_profile_id: scope.messagingProfileId, text, from: { phone_number: "+15555550101" }, to: [{ phone_number: scope.fromNumber, status: "queued" }],
  } } });
  const stop = normalizeTelnyxEvent(inbound(`stop-${suffix}`, "STOP", "2026-09-12T12:00:00Z"), scope);
  assert.equal(stop.deliveryStatus, null, "Inbound messages are not outgoing delivery receipts.");
  assert.equal(JSON.stringify(stop).includes("+1555555"), false, "Persisted callbacks omit phone numbers and message text.");
  assert.throws(() => normalizeTelnyxEvent(inbound(`wrong-${suffix}`, "STOP", "2026-09-12T12:00:00Z"), { ...scope, messagingProfileId: "another-profile" }), /outside-messaging-scope/);
  await persistTelnyxEvent(db, stop);
  await persistTelnyxEvent(db, stop);
  await assert.rejects(persistTelnyxEvent(db, { ...stop, suppression: false }), /identity-conflict/);
  await persistTelnyxEvent(db, normalizeTelnyxEvent(inbound(`start-${suffix}`, "START", "2026-09-12T11:00:00Z"), scope));
  assert.equal((await db.collection("communicationSuppressions").doc(stop.addressKey).get()).get("suppressed"), true);

  const callback = { id: `delivery-${suffix}`, type: "message.finalized", occurredAt: "2026-09-12T12:00:00.000Z", providerReference: `provider-${suffix}`, addressKey: null, suppression: null, deliveryStatus: "delivered" };
  await persistTelnyxEvent(db, callback);
  assert.equal((await db.collection("communicationWebhookEvents").doc(callback.id).get()).get("processed"), false);
  await set("lifecycleCommunicationJobs", `callback-${suffix}`, { status: "accepted" });
  await set("communicationProviderReferences", callback.providerReference, { jobId: `callback-${suffix}` });
  await reconcileTelnyxEvent(db, callback.id);
  await persistTelnyxEvent(db, { ...callback, id: `late-queued-${suffix}`, occurredAt: "2026-09-12T12:01:00.000Z", deliveryStatus: "queued" });
  assert.equal((await db.collection("lifecycleCommunicationJobs").doc(`callback-${suffix}`).get()).get("deliveryStatus"), "delivered");
  const orphan = { ...callback, id: `orphan-${suffix}`, providerReference: `unmapped-${suffix}` };
  await persistTelnyxEvent(db, orphan);
  await reconcileTelnyxEvent(db, orphan.id, Date.now() + 86_400_001);
  const orphanDoc = await db.collection("communicationWebhookEvents").doc(orphan.id).get();
  assert.equal(orphanDoc.get("status"), "needs-attention");
  assert.equal(orphanDoc.get("nextReconciliationAt"), undefined, "Unmapped events must not starve the reconciliation queue.");

  let now = Date.parse("2026-09-12T12:00:00Z");
  const accounts = new Map();
  const fakeAuth = { async getUser(subject) { return accounts.get(subject); } };
  const environment = { RFXCHANGE_LIFECYCLE_SEND_MODE: "enabled", RFXCHANGE_EXCHANGE_ORIGIN: "https://exchange.example.test" };
  let sends = 0;
  const deliver = async input => { sends++; assert.equal(input.request.purpose, "marketing"); return { providerKey: "fixture", externalReference: `receipt-${randomUUID()}` }; };
  const deps = { auth: fakeAuth, now: () => now, environment, deliver };
  await set("lifecycleConfiguration", "current", { policy: { ...DEFAULT_LIFECYCLE_POLICY, enabled: true }, version: 1 });
  const fixture = async name => {
    const userId = `${name}-${suffix}`;
    accounts.set(userId, { disabled: false, emailVerified: true, email: `${name}@example.test`, phoneNumber: "+15555550102", metadata: { lastSignInTime: "2026-09-01T12:00:00Z" } });
    await set("users", userId, { login: { subject: userId }, createdAt: "2026-09-01T12:00:00Z" });
    await set("communicationPreferences", userId, { userId, version: 1, email: true, sms: false, marketingConsent: true, consentTextVersion: COMMUNICATION_CONSENT_VERSION, timeZone: "UTC", phone: null, updatedAt: new Date(now).toISOString() });
    await set("lifecycleEnrollments", userId, { userId, nextEvaluationAt: new Date(now).toISOString() });
    return userId;
  };
  const once = await fixture("once");
  assert.equal((await dispatchLifecycleCommunications(db, { ...deps, environment: {} })).status, "disabled");
  await Promise.all([dispatchLifecycleCommunications(db, deps), dispatchLifecycleCommunications(db, deps)]);
  assert.equal(sends, 1, "Concurrent workers reserve only one provider call.");
  await db.collection("lifecycleEnrollments").doc(once).update({ nextEvaluationAt: new Date(now).toISOString() });
  await dispatchLifecycleCommunications(db, deps);
  assert.equal(sends, 1, "Accepted work is never resent on replay.");

  const revoked = await fixture("revoked");
  let reads = 0;
  await dispatchLifecycleCommunications(db, { ...deps, auth: { async getUser(subject) {
    if (subject === revoked && ++reads === 2) await db.collection("communicationPreferences").doc(revoked).update({ marketingConsent: false });
    return fakeAuth.getUser(subject);
  } } });
  assert.equal(sends, 1, "Consent withdrawal after reservation still prevents the provider call.");
  now = Date.parse("2026-09-12T22:00:00Z");
  const quiet = await fixture("quiet");
  await dispatchLifecycleCommunications(db, deps);
  assert.equal((await db.collection("lifecycleEnrollments").doc(quiet).get()).get("nextEvaluationAt"), "2026-09-12T23:00:00.000Z");
  await db.collection("lifecycleEnrollments").doc(quiet).delete();
  now = Date.parse("2026-09-13T12:00:00Z");
  const retry = await fixture("retry");
  let retryCalls = 0;
  const retryDeps = { ...deps, deliver: async () => { retryCalls++; if (retryCalls < 3) throw new SmsProviderError("sms-http-429", "known-failure", true); return { providerKey: "fixture", externalReference: "accepted-retry" }; } };
  for (let i = 0; i < 3; i++) { await dispatchLifecycleCommunications(db, retryDeps); now += 3_600_000; }
  assert.equal(retryCalls, 3, "Only known failures retry, with a fresh policy check.");
  const retryJobs = await db.collection("lifecycleCommunicationJobs").where("userId", "==", retry).get();
  assert.equal(retryJobs.docs[0].get("status"), "accepted");
  assert.equal(retryJobs.docs[0].get("attemptCount"), 3);
  const unknown = await fixture("unknown");
  let unknownCalls = 0;
  const unknownDeps = { ...deps, deliver: async () => { unknownCalls++; throw new SmsProviderError("sms-outcome-unknown", "unknown", false); } };
  await dispatchLifecycleCommunications(db, unknownDeps);
  await db.collection("lifecycleEnrollments").doc(unknown).update({ nextEvaluationAt: new Date(now).toISOString() });
  await dispatchLifecycleCommunications(db, unknownDeps);
  assert.equal(unknownCalls, 1, "Ambiguous outcomes need reconciliation and never retry blindly.");
  const unknownJobs = await db.collection("lifecycleCommunicationJobs").where("userId", "==", unknown).get();
  assert.equal(unknownJobs.docs[0].get("status"), "needs-reconciliation");
  await set("activationJourneyContexts", unknown, { userId: unknown, accessJourneyId: `journey-${suffix}`, organizationId: `org-${suffix}`, membershipId: `membership-${suffix}` });
  await set("organizations", `org-${suffix}`, { id: `org-${suffix}` });
  await set("accessJourneys", `journey-${suffix}`, { userId: unknown, state: "open-platform" });
  await set("organizationMemberships", `membership-${suffix}`, { userId: "another-user", organizationId: `org-${suffix}`, status: "active" });
  assert.equal((await currentLifecycleState(db, unknown, fakeAuth)).state.accountAvailable, false, "Stale or wrong-user organization context cannot authorize lifecycle messages.");
  await db.collection("organizationMemberships").doc(`membership-${suffix}`).update({ userId: unknown });
  await db.collection("lifecycleEnrollments").doc(unknown).update({ lastActivityAt: new Date(now).toISOString() });
  const active = await currentLifecycleState(db, unknown, fakeAuth);
  assert.equal(active.state.accountAvailable, true);
  assert.equal(active.state.active, true);
  assert.equal(active.state.lastActivityAt, new Date(now).toISOString(), "Canonical product events refresh activity without another sign-in.");
  await db.collection("lifecycleEnrollments").doc(unknown).update({ lastActivityAt: "2026-07-01T12:00:00Z" });
  accounts.get(unknown).metadata.lastSignInTime = "2026-07-01T12:00:00Z";
  await db.collection("accessJourneys").doc(`journey-${suffix}`).update({ updatedAt: new Date(now).toISOString() });
  const newlyActivated = await currentLifecycleState(db, unknown, fakeAuth);
  assert.equal(newlyActivated.state.lastActivityAt, new Date(now).toISOString());
  assert.equal(chooseLifecycleJourney(newlyActivated.state, { ...DEFAULT_LIFECYCLE_POLICY, enabled: true }, now), null, "Activation in a retained session must not immediately trigger retention/win-back.");
  assert.equal(communicationAddressKey("email", "UPPER@Example.test"), communicationAddressKey("email", "upper@example.test"));
  console.log("SAD runtime emulator acceptance passed: tenant boundaries, lease fencing, consent revocation, send replay, retries, quiet hours, webhook scope/dedup/order/reconciliation and direct-client denial.");
} finally {
  for (const path of touched) await db.doc(path).delete();
  for (const name of ["publicEnrichmentRuns", "publicEnrichmentEvents", "lifecycleCommunicationJobs", "lifecycleCommunicationEvents", "communicationWebhookEvents", "communicationProviderReferences"]) {
    const docs = await db.collection(name).get();
    for (const item of docs.docs) if (JSON.stringify(item.data()).includes(suffix)) await item.ref.delete();
  }
  await db.collection("communicationSuppressions").doc(communicationAddressKey("sms", "+15555550101")).delete();
  await Promise.all([deleteApp(app), deleteClient(client)]);
}
