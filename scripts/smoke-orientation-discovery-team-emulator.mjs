import assert from "node:assert/strict";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { OrientationJourneyService } from "../src/application/orientation/orientation-journey.ts";
import { accessJourneyId } from "../src/domain/lifecycle/model.ts";
import { ORIENTATION_STEP_SEQUENCE } from "../src/domain/orientation/model.ts";
import { organizationId } from "../src/domain/organizations/model.ts";
import { userId } from "../src/domain/users/model.ts";
import { FirestoreOrientationJourneyRepository } from "../src/infrastructure/firestore/orientation-journey.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
const projectId = "demo-rfxchange";
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId }, `orientation-admin-${suffix}`);
const clientApp = initializeClientApp({
  apiKey: "demo-api-key", authDomain: `${projectId}.firebaseapp.com`, projectId,
  appId: `1:123:web:orientation-${suffix}`,
}, `orientation-client-${suffix}`);
const adminDb = getAdminFirestore(adminApp);
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);

let sequence = 0;
const repository = new FirestoreOrientationJourneyRepository(adminDb);
const service = new OrientationJourneyService({
  journeys: repository,
  ids: { event: () => `orientation-event-smoke-${suffix}-${++sequence}` },
  now: () => "2026-08-01T12:00:00.000Z",
});
const scope = {
  userId: userId(`usr-orientation-${suffix}`),
  accessJourneyId: accessJourneyId(`activation-orientation-${suffix}`),
  organizationId: organizationId(`org-orientation-${suffix}`),
  geographyId: "us-va-portsmouth",
};

let journeyId;
try {
  const started = await service.start(scope);
  journeyId = started.id;
  for (const step of ORIENTATION_STEP_SEQUENCE.slice(0, 4)) await service.completeStep(scope, step.key);
  assert.equal((await repository.getById(started.id))?.completedThroughStep, 4);
  await assert.rejects(service.completeStep(scope, "joint-response"), /canonical order/);
  for (const step of ORIENTATION_STEP_SEQUENCE.slice(4)) await service.completeStep(scope, step.key);
  const completed = await repository.getById(started.id);
  assert.equal(completed?.completedThroughStep, 8);
  assert.equal(completed?.revision, 9);
  assert.equal(completed?.status, "completed");
  assert.ok(completed?.completedAt);
  const events = await adminDb.collection("orientationJourneyEvents").where("orientationJourneyId", "==", started.id).get();
  assert.equal(events.size, 9);
  assert.equal(events.docs.filter((snapshot) => snapshot.data().kind === "completed").length, 1);

  await assert.rejects(getDoc(doc(clientDb, "orientationJourneys", started.id)), (error) => /permission-denied/.test(error?.code));
  await assert.rejects(setDoc(doc(clientDb, "orientationJourneys", `forged-${suffix}`), { completedThroughStep: 8 }), (error) => /permission-denied/.test(error?.code));
  await assert.rejects(getDoc(doc(clientDb, "orientationJourneyEvents", `forged-${suffix}`)), (error) => /permission-denied/.test(error?.code));

  for (const snapshot of events.docs) await snapshot.ref.delete();
  console.log("EDU-001-008 orientation emulator smoke passed.");
} finally {
  if (journeyId) await adminDb.collection("orientationJourneys").doc(journeyId).delete();
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
