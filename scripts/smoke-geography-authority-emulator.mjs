import assert from "node:assert/strict";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore as getClientFirestore,
} from "firebase/firestore";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import { PrimaryOperatingGeographyService } from "../src/application/geography/primary-operating-geography.ts";
import { createGeographyDefinition } from "../src/domain/geography/model.ts";
import {
  advanceAccessLifecycle,
  associateAccessJourneyWithUser,
  createAccessLifecycle,
} from "../src/domain/lifecycle/model.ts";
import { createUserIdentity } from "../src/domain/users/model.ts";
import { createFirestoreGeographyRepositories } from "../src/infrastructure/firestore/geography-repositories.ts";
import { createFirestoreFoundationRepositories } from "../src/infrastructure/firestore/repositories.ts";

assert.equal(
  process.env.FIRESTORE_EMULATOR_HOST,
  "127.0.0.1:8080",
  "Slice 2.1 acceptance must use the Firestore emulator.",
);

const projectId = "demo-rfxchange";
const runId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const adminApp = initializeAdminApp({ projectId }, `geography-admin-${runId}`);
const adminDb = getAdminFirestore(adminApp);
const clientApp = initializeClientApp(
  {
    apiKey: "demo-api-key",
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    appId: `1:123:web:geography-${runId}`,
  },
  `geography-client-${runId}`,
);
const clientDb = getClientFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);

const now = new Date().toISOString();
const user = createUserIdentity({
  id: `usr_geo_${runId}`,
  name: "Geography Emulator User",
  primaryEmail: `geography-${runId}@example.test`,
  loginProvider: "firebase",
  loginSubject: `firebase-geography-${runId}`,
  now,
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
    authenticatedAt: now,
    issuedAt: now,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  },
  source: "session-cookie",
});
let journey = createAccessLifecycle({ id: `journey_geo_${runId}`, now });
journey = advanceAccessLifecycle(journey, "account-started", now);
journey = advanceAccessLifecycle(journey, "account-activated", now);
journey = associateAccessJourneyWithUser(journey, user.id, now);
const geography = createGeographyDefinition({
  id: `us-va-portsmouth-${runId}`,
  countryCode: "US",
  fipsCode: "51740",
  name: "Portsmouth",
  type: "independent-city",
  boundary: {
    authority: "United States Census Bureau",
    dataset: "TIGER/Line Places",
    vintage: "2025",
    sourceFeatureId: "51740",
  },
  releaseState: "released",
  parentGeographyId: "us-va",
  adjacentGeographyIds: ["us-va-norfolk", "us-va-suffolk"],
  bounds: { west: -76.42, south: 36.73, east: -76.21, north: 36.91 },
  defaultCamera: {
    center: { longitude: -76.31, latitude: 36.84 },
    pitchDegrees: 42,
    bearingDegrees: -12,
    paddingPixels: 48,
    maximumZoom: 13,
  },
  now,
});

const geographyRepositories = createFirestoreGeographyRepositories(adminDb);
const foundationRepositories = createFirestoreFoundationRepositories(adminDb);

try {
  await geographyRepositories.definitions.save(geography);
  await foundationRepositories.lifecycle.lifecycle.save(journey);
  const service = new PrimaryOperatingGeographyService({
    definitions: geographyRepositories.definitions,
    selections: geographyRepositories.selections,
    authorizations: geographyRepositories.authorizations,
    lifecycle: foundationRepositories.lifecycle.lifecycle,
    unitOfWork: geographyRepositories.selectionUnitOfWork,
    now: () => now,
  });

  const selected = await service.select({
    context,
    accessJourneyId: journey.id,
    geographyId: geography.id,
  });
  assert.equal(selected.lifecycle.state, "geography-selected");
  assert.equal(selected.geography.fipsCode, "51740");
  assert.equal(selected.camera.mode, "fit-authoritative-bounds");

  const orientation = await service.requireForOrientation({
    context,
    accessJourneyId: journey.id,
  });
  assert.equal(orientation.selection.geographyId, geography.id);

  for (const [collection, id] of [
    ["geographies", geography.id],
    ["primaryGeographySelections", user.id],
    ["accessJourneys", journey.id],
  ]) {
    const snapshot = await adminDb.collection(collection).doc(id).get();
    assert.equal(snapshot.exists, true, `${collection}/${id} must be persisted.`);
    assert.equal(snapshot.data()?.schemaVersion, 1, `${collection}/${id} must use schema version 1.`);
  }

  await assert.rejects(
    getDoc(doc(clientDb, "geographies", geography.id)),
    (error) => error?.code === "permission-denied",
    "Direct client geography reads must remain denied.",
  );

  console.log(
    "Slice 2.1 emulator acceptance passed: canonical geography -> server-authorized selection -> atomic lifecycle transition -> orientation gate; direct client authority denied.",
  );
} finally {
  await Promise.allSettled([
    adminDb.collection("primaryGeographySelections").doc(user.id).delete(),
    adminDb.collection("accessJourneys").doc(journey.id).delete(),
    adminDb.collection("geographies").doc(geography.id).delete(),
  ]);
  await deleteAdminApp(adminApp);
  await deleteClientApp(clientApp);
}
