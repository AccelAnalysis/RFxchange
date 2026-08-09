import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import { NetworkEducationService } from "../src/application/network-education/network-education.ts";
import { createUserIdentity } from "../src/domain/users/model.ts";
import { FirestoreNetworkEducationRepository } from "../src/infrastructure/firestore/network-education.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
const projectId = "demo-rfxchange";
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId }, `network-education-admin-${suffix}`);
const clientApp = initializeClientApp({ apiKey: "demo", authDomain: `${projectId}.firebaseapp.com`, projectId, appId: `1:123:web:network-education-${suffix}` }, `network-education-client-${suffix}`);
const adminDb = getAdminFirestore(adminApp);
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
const repository = new FirestoreNetworkEducationRepository(adminDb);
const service = new NetworkEducationService(repository, () => "2026-08-09T18:00:00.000Z");
const user = createUserIdentity({ id: `user-${suffix}`, name: "Education Emulator", primaryEmail: `education-${suffix}@example.test`, loginProvider: "firebase", loginSubject: `subject-${suffix}`, now: "2026-08-09T18:00:00.000Z" });
const context = authenticatedServerContext({ user, claims: { provider: "firebase", subject: user.login.subject, email: user.primaryEmail, displayName: user.name, emailVerified: true, isAnonymous: false, authenticatedAt: "2026-08-09T18:00:00.000Z", issuedAt: "2026-08-09T18:00:00.000Z", expiresAt: "2026-08-10T18:00:00.000Z" }, source: "session-cookie" });
const scope = (commandId) => ({ context, organizationId: `org-${suffix}`, membershipId: `membership-${suffix}`, commandId });
const created = { networkEducationProgress: [], networkEducationEvents: [], networkEducationCommands: [] };
const eventId = (commandId) => `network-education-event-${createHash("sha256").update(JSON.stringify(commandId)).digest("hex").slice(0, 40)}`;

try {
  for (const collection of Object.keys(created)) {
    await assert.rejects(getDoc(doc(clientDb, collection, `forged-${suffix}`)), (error) => /permission-denied/.test(error?.code));
    await assert.rejects(setDoc(doc(clientDb, collection, `forged-${suffix}`), { forged: true }), (error) => /permission-denied/.test(error?.code));
  }
  const selected = await service.mutate(scope(`select-${suffix}`), { action: "path-selected", expectedVersion: null, pathKey: "business" }, false);
  created.networkEducationProgress.push(selected.progress.id);
  created.networkEducationEvents.push(eventId(`select-${suffix}`));
  created.networkEducationCommands.push(`select-${suffix}`);
  const completed = await service.mutate(scope(`item-${suffix}`), { action: "item-completed", expectedVersion: selected.progress.version, pathKey: "business", itemKey: "business-profile" }, false);
  created.networkEducationEvents.push(eventId(`item-${suffix}`));
  created.networkEducationCommands.push(`item-${suffix}`);
  assert.deepEqual(completed.progress.completedItemKeys, ["business-profile"]);
  assert.equal((await service.mutate(scope(`item-${suffix}`), { action: "item-completed", expectedVersion: selected.progress.version, pathKey: "business", itemKey: "business-profile" }, false)).replayed, true);
  await assert.rejects(service.mutate(scope(`stale-${suffix}`), { action: "guide-dismissed", expectedVersion: selected.progress.version }, false), /current version is 2/);
  assert.equal((await repository.getProgress(completed.progress.id)).version, 2);
  console.log("Persistent Network Education Firestore atomicity, durable resume, idempotency, stale rejection, and direct-client denial emulator smoke passed.");
} finally {
  const paths = Object.entries(created).flatMap(([collection, ids]) => ids.map((id) => [collection, id]));
  await Promise.allSettled(paths.map(([collection, id]) => adminDb.collection(collection).doc(id).delete()));
  const residual = await Promise.all(paths.map(async ([collection, id]) => (await adminDb.collection(collection).doc(id).get()).exists));
  assert.equal(residual.some(Boolean), false, "Network education emulator cleanup must leave zero disposable records.");
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
