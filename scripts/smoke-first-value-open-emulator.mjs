import assert from "node:assert/strict";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { FirstValueAndOpenReleaseService } from "../src/application/activation/open-release.ts";
import { accessJourneyId, advanceAccessLifecycle, associateAccessJourneyWithUser, createAccessLifecycle } from "../src/domain/lifecycle/model.ts";
import { organizationId } from "../src/domain/organizations/model.ts";
import { userId } from "../src/domain/users/model.ts";
import { FirestoreFirstValueSelectionRepository } from "../src/infrastructure/firestore/first-value.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
const projectId = "demo-rfxchange";
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId }, `first-value-admin-${suffix}`);
const clientApp = initializeClientApp({
  apiKey: "demo-api-key", authDomain: `${projectId}.firebaseapp.com`, projectId,
  appId: `1:123:web:first-value-${suffix}`,
}, `first-value-client-${suffix}`);
const adminDb = getAdminFirestore(adminApp);
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);

const scope = Object.freeze({
  accessJourneyId: accessJourneyId(`activation-open-${suffix}`),
  userId: userId(`usr-open-${suffix}`),
  organizationId: organizationId(`org-open-${suffix}`),
});
const repository = new FirestoreFirstValueSelectionRepository(adminDb);
let sequence = 0;

function lifecycleToControlled() {
  let lifecycle = createAccessLifecycle({ id: scope.accessJourneyId, now: "2026-08-01T19:10:00.000Z" });
  lifecycle = advanceAccessLifecycle(lifecycle, "account-started", "2026-08-01T19:10:00.000Z");
  lifecycle = associateAccessJourneyWithUser(lifecycle, scope.userId, "2026-08-01T19:10:00.000Z");
  for (const state of [
    "account-activated", "geography-selected", "organization-resolved", "organization-registered",
    "organization-activated", "controlled-platform",
  ]) lifecycle = advanceAccessLifecycle(lifecycle, state, "2026-08-01T19:10:00.000Z");
  return lifecycle;
}

const lifecycleRef = adminDb.collection("accessJourneys").doc(String(scope.accessJourneyId));
const selectionRef = adminDb.collection("firstValueSelections").doc(String(scope.accessJourneyId));
try {
  await lifecycleRef.set({ ...lifecycleToControlled(), schemaVersion: 1 });
  const snapshots = {
    async read(requested) {
      if (requested.userId !== scope.userId || requested.organizationId !== scope.organizationId) {
        throw new Error("OPEN release scope belongs to another participant.");
      }
      const lifecycle = (await lifecycleRef.get()).data();
      return Object.freeze({
        scope, lifecycle, accountUsable: true, authenticationCurrent: true, membershipActive: true,
        restrictionState: "none", policiesCurrent: true, organizationAuthorityEstablished: true,
        profileComplete: true, markerActiveInAllowedGeography: true, orientationComplete: true,
        selection: await repository.getByAccessJourneyId(String(scope.accessJourneyId)),
      });
    },
  };
  const service = new FirstValueAndOpenReleaseService({
    selections: repository,
    snapshots,
    ids: { event: () => `activation-release-event-${suffix}-${++sequence}` },
    now: () => "2026-08-01T19:10:00.000Z",
  });
  const opened = await service.selectAndRelease({
    scope, selectedIntent: "find-teammate", acquisitionIntentKind: "team-invitation",
  });
  assert.equal(opened.lifecycleState, "open-platform");
  assert.equal((await lifecycleRef.get()).data()?.state, "open-platform");
  assert.equal((await selectionRef.get()).data()?.selectedIntent, "find-teammate");
  const events = await adminDb.collection("activationReleaseEvents").get();
  const scopedEvents = events.docs.filter((snapshot) => snapshot.data().accessJourneyId === scope.accessJourneyId);
  assert.deepEqual(scopedEvents.map((snapshot) => snapshot.data().kind).sort(), ["first-value-selected", "open-released"]);

  await service.selectAndRelease({ scope, selectedIntent: "find-teammate", acquisitionIntentKind: "team-invitation" });
  const repeatedEvents = (await adminDb.collection("activationReleaseEvents").get()).docs.filter(
    (snapshot) => snapshot.data().accessJourneyId === scope.accessJourneyId,
  );
  assert.equal(repeatedEvents.length, 2);

  await assert.rejects(getDoc(doc(clientDb, "firstValueSelections", String(scope.accessJourneyId))), (error) => /permission-denied/.test(error?.code));
  await assert.rejects(setDoc(doc(clientDb, "firstValueSelections", `forged-${suffix}`), { selectedIntent: "explore-network" }), (error) => /permission-denied/.test(error?.code));
  await assert.rejects(getDoc(doc(clientDb, "activationReleaseEvents", `forged-${suffix}`)), (error) => /permission-denied/.test(error?.code));

  for (const snapshot of scopedEvents) await snapshot.ref.delete();
  console.log("EDU-009/010 first-value and OPEN emulator smoke passed.");
} finally {
  await Promise.allSettled([selectionRef.delete(), lifecycleRef.delete()]);
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
