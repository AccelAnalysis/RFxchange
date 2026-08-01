import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { AcquisitionContextService } from "../src/application/acquisition/acquisition-context.ts";
import { accessJourneyId } from "../src/domain/lifecycle/model.ts";
import { userId } from "../src/domain/users/model.ts";
import { SeededPublicOpportunityProjectionRepository } from "../src/infrastructure/acquisition/seeded-public-opportunities.ts";
import { FirestoreAcquisitionContextRepository } from "../src/infrastructure/firestore/acquisition-context.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
const projectId = "demo-rfxchange";
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId }, `acq-admin-${suffix}`);
const clientApp = initializeClientApp({
  apiKey: "demo-api-key",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  appId: `1:123:web:acq-${suffix}`,
}, `acq-client-${suffix}`);
const adminDb = getAdminFirestore(adminApp);
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);

let sequence = 0;
const repository = new FirestoreAcquisitionContextRepository(adminDb);
const service = new AcquisitionContextService({
  contexts: repository,
  opportunities: new SeededPublicOpportunityProjectionRepository(),
  ids: {
    context: () => `acq-smoke-${suffix}-${++sequence}`,
    event: () => `acq-event-smoke-${suffix}-${++sequence}`,
  },
  secrets: {
    create: () => `smoke${"s".repeat(40)}${sequence}`,
    digest: (value) => createHash("sha256").update(value).digest("hex"),
  },
  now: () => "2026-08-01T12:00:00.000Z",
});

const createdIds = [];
try {
  const issued = await service.issuePublicOpportunity({
    reference: "portsmouth-facilities-partner-search",
  });
  createdIds.push(issued.token.contextId);
  const persisted = await repository.getById(issued.token.contextId);
  assert.equal(persisted?.status, "issued");
  assert.equal(persisted?.intent.kind, "opportunity");

  const bound = await service.bind({
    token: issued.token,
    userId: userId(`usr-acq-smoke-${suffix}`),
    accessJourneyId: accessJourneyId(`activation-acq-smoke-${suffix}`),
  });
  assert.equal(bound.intent.subjectReference, "portsmouth-facilities-partner-search");
  assert.equal((await repository.getById(bound.id))?.status, "bound");
  const resumed = await service.resume({
    contextId: bound.id,
    userId: bound.boundUserId,
    accessJourneyId: bound.boundAccessJourneyId,
  });
  assert.equal(resumed.resumeStatus, "resumed");

  await assert.rejects(
    getDoc(doc(clientDb, "acquisitionContexts", bound.id)),
    (error) => error?.code === "permission-denied" || error?.code === "firestore/permission-denied",
  );
  await assert.rejects(
    setDoc(doc(clientDb, "acquisitionContexts", `forged-${suffix}`), { status: "bound" }),
    (error) => error?.code === "permission-denied" || error?.code === "firestore/permission-denied",
  );
  await assert.rejects(
    getDoc(doc(clientDb, "acquisitionContextEvents", `event-${suffix}`)),
    (error) => error?.code === "permission-denied" || error?.code === "firestore/permission-denied",
  );

  const events = await adminDb.collection("acquisitionContextEvents")
    .where("acquisitionContextId", "==", bound.id)
    .get();
  assert.deepEqual(events.docs.map((snapshot) => snapshot.data().kind).sort(), ["bound", "issued", "resumed"]);
  for (const snapshot of events.docs) await snapshot.ref.delete();
  console.log("ACQ-002/003 acquisition continuity emulator smoke passed.");
} finally {
  for (const id of createdIds) await adminDb.collection("acquisitionContexts").doc(id).delete();
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
