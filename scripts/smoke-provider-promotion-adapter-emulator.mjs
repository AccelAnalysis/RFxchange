import assert from "node:assert/strict";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "firebase/firestore";

import { FirestoreProviderPromotionAdapter } from "../src/infrastructure/firestore/provider-promotion-adapter.ts";
import { FirestoreProviderPromotionEvidenceRepository } from "../src/infrastructure/firestore/provider-promotion-evidence-repository.ts";
import { PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS } from "../src/infrastructure/firestore/provider-promotion-schema.ts";
import { createProviderPromotionFixture, PROVIDER_PROMOTION_FIXTURE_NOW } from "../test/support/provider-promotion-fixture.mjs";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
const projectId = "demo-rfxchange";
const suffix = `critical-${Date.now()}-${Math.random().toString(16).slice(2)}`.toLowerCase();
const fixture = createProviderPromotionFixture(suffix);
const adminApp = initializeAdminApp({ projectId }, `provider-promotion-admin-${suffix}`);
const clientApp = initializeClientApp(
  {
    apiKey: "demo",
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    appId: `1:123:web:provider-promotion-${suffix}`,
  },
  `provider-promotion-client-${suffix}`,
);
const adminDb = getAdminFirestore(adminApp);
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
const evidenceRepository = new FirestoreProviderPromotionEvidenceRepository(adminDb);
const disabledAdapter = new FirestoreProviderPromotionAdapter(adminDb, {
  now: () => PROVIDER_PROMOTION_FIXTURE_NOW,
  releaseEnabled: () => false,
});
const enabledAdapter = new FirestoreProviderPromotionAdapter(adminDb, {
  now: () => PROVIDER_PROMOTION_FIXTURE_NOW,
  releaseEnabled: () => true,
});

const cleanupPaths = new Set();
const remember = (collection, id) => {
  cleanupPaths.add(`${collection}/${id}`);
  return adminDb.collection(collection).doc(id);
};

try {
  await remember("adminAuthorityContexts", String(fixture.authority.administratorId)).set({
    ...fixture.authority,
    schemaVersion: 1,
  });
  await evidenceRepository.stage(fixture.evidence);
  for (const [collection, id] of [
    [PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.candidates, fixture.candidate.id],
    [PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.sourceRecords, fixture.source.id],
    [PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.geographyPreparations, fixture.geography.id],
    [PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.comparisons, fixture.comparison.id],
    [PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.approvals, fixture.approval.id],
  ]) remember(collection, id);

  for (const collection of Object.values(PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS)) {
    await assert.rejects(
      getDoc(doc(clientDb, collection, `forged-${suffix}`)),
      (error) => /permission-denied/.test(error?.code),
    );
    await assert.rejects(
      setDoc(doc(clientDb, collection, `forged-${suffix}`), { status: "approved" }),
      (error) => /permission-denied/.test(error?.code),
    );
  }

  const preview = await disabledAdapter.preview(fixture.previewCommand);
  assert.equal(preview.publishProviderDiscovery, false);
  assert.equal(preview.publishResource, false);
  assert.equal(
    (await adminDb.collection(PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.commands).get()).size,
    0,
    "Preview must not persist a promotion command.",
  );
  assert.equal(
    (await adminDb.collection(PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.receipts).get()).size,
    0,
    "Preview must not persist a promotion receipt.",
  );

  await assert.rejects(
    enabledAdapter.commit(fixture.commitCommand, "PROMOTE UNREVIEWED PROVIDER"),
    /exact production confirmation phrase/,
  );

  await assert.rejects(
    disabledAdapter.commit(fixture.commitCommand, "PROMOTE APPROVED PROVIDER"),
    /RFXCHANGE_PROVIDER_PROMOTION_ENABLED/,
  );

  const receipt = await enabledAdapter.commit(fixture.commitCommand, "PROMOTE APPROVED PROVIDER");
  assert.equal(receipt.commandId, fixture.commitCommand.id);
  assert.equal(receipt.targetOrganizationId, fixture.targetOrganizationId);
  assert.equal(receipt.publishProviderDiscovery, false);
  assert.equal(receipt.publishResource, false);

  const replay = await enabledAdapter.commit(fixture.commitCommand, "PROMOTE APPROVED PROVIDER");
  assert.deepEqual(replay, receipt, "Exact command replay must return the committed receipt.");
  await assert.rejects(
    enabledAdapter.commit({ ...fixture.commitCommand, requestFingerprint: "sha256:conflict" }, "PROMOTE APPROVED PROVIDER"),
    /conflicts with an existing receipt/,
  );

  const profileId = `provider-seed-profile:${fixture.targetOrganizationId}`;
  const discoveryId = `provider-seed-discovery:${fixture.targetOrganizationId}`;
  const reservationId = `${fixture.commitCommand.marketKey}:${fixture.commitCommand.candidateId}`;
  const promotionEventId = `${fixture.commitCommand.id}:event`;
  const receiptId = `${fixture.commitCommand.id}:receipt`;
  for (const [collection, id] of [
    ["organizations", fixture.targetOrganizationId],
    ["organizationProfiles", profileId],
    ["organizationDiscoveryRecords", discoveryId],
    [PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.identityReservations, reservationId],
    [PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.seededLocations, fixture.commitCommand.targetLocationId],
    [PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.classifications, fixture.targetOrganizationId],
    [PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.resourceDrafts, fixture.commitCommand.targetProviderResourceId],
    [PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.commands, fixture.commitCommand.id],
    [PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.events, promotionEventId],
    [PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.receipts, receiptId],
  ]) remember(collection, id);

  const discovery = await adminDb.collection("organizationDiscoveryRecords").doc(discoveryId).get();
  assert.equal(discovery.data()?.origin, "seeded");
  assert.equal(discovery.data()?.authorityState, "unestablished");
  assert.equal(discovery.data()?.verificationState, "not-evaluated");
  const seededLocation = await adminDb
    .collection(PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.seededLocations)
    .doc(fixture.commitCommand.targetLocationId)
    .get();
  assert.equal(seededLocation.data()?.participantConfirmed, false);
  assert.equal(seededLocation.data()?.publicProjection, "disabled");
  const classification = await adminDb
    .collection(PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.classifications)
    .doc(fixture.targetOrganizationId)
    .get();
  assert.equal(classification.data()?.claimState, "unclaimed");
  assert.equal(classification.data()?.providerDiscovery, "disabled");
  const resourceDraft = await adminDb
    .collection(PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.resourceDrafts)
    .doc(fixture.commitCommand.targetProviderResourceId)
    .get();
  assert.equal(resourceDraft.data()?.status, "draft");
  assert.equal(resourceDraft.data()?.publication, "disabled");
  assert.equal(
    (await adminDb.collection("providerResources").doc(fixture.commitCommand.targetProviderResourceId).get()).exists,
    false,
  );
  assert.equal(
    (await adminDb.collection("providerDiscoveryPublications").doc(fixture.targetOrganizationId).get()).exists,
    false,
  );
  assert.equal(
    (await adminDb.collection("officialResourceProviderStatuses").doc(fixture.targetOrganizationId).get()).exists,
    false,
  );

  const packet = fixture.geography.packet;
  for (const record of packet.datasetSources) remember("geographyDatasetSources", record.id);
  for (const record of packet.geographies) remember("canonicalGeographies", record.id);
  for (const record of packet.versions) remember("geographyVersions", record.id);
  for (const record of packet.memberships) remember("locationGeographyMemberships", record.id);
  remember("locationGeographyProfiles", packet.profile.id);
  remember("geographyFabricCommands", packet.command.id);
  remember("geographyFabricEvents", packet.event.id);
  const geographyProfile = await adminDb
    .collection("locationGeographyProfiles")
    .doc(packet.profile.id)
    .get();
  assert.equal(geographyProfile.data()?.organizationId, fixture.targetOrganizationId);
  assert.equal(
    geographyProfile.data()?.acceptedPointFingerprint,
    fixture.source.acceptedLocation.acceptedPointFingerprint,
  );

  await assert.rejects(
    getDoc(doc(clientDb, PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.receipts, receiptId)),
    (error) => /permission-denied/.test(error?.code),
  );

  console.log(
    "Provider seed promotion critical adapter preview, release gate, atomic commit, idempotency, unpublished staging, Geography Fabric materialization, and direct-client denial passed.",
  );
} finally {
  await Promise.allSettled(
    [...cleanupPaths].map((path) => adminDb.doc(path).delete()),
  );
  const residuals = await Promise.all(
    [...cleanupPaths].map((path) => adminDb.doc(path).get()),
  );
  assert.equal(
    residuals.filter((snapshot) => snapshot.exists).length,
    0,
    "Provider promotion emulator cleanup left residual records.",
  );
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
