import assert from "node:assert/strict";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { FirestoreOrganizationEnrichmentRepository } from "../src/infrastructure/firestore/organization-enrichment.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
const projectId = "demo-rfxchange";
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId }, `organization-enrichment-admin-${suffix}`);
const clientApp = initializeClientApp({ apiKey: "demo-api-key", authDomain: `${projectId}.firebaseapp.com`, projectId, appId: `1:123:web:enrichment-${suffix}` }, `organization-enrichment-client-${suffix}`);
const adminDb = getAdminFirestore(adminApp);
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
const repository = new FirestoreOrganizationEnrichmentRepository(adminDb);
const organizationId = `org-enrichment-${suffix}`;
const userId = `user-${suffix}`;
const membershipId = `membership-${suffix}`;
const now = "2026-08-09T13:00:00.000Z";
const collections = ["organizationCredentials", "organizationProfileAssets", "organizationAdditionalLocationDrafts", "organizationAdditionalLocations", "organizationEnrichmentEvents", "organizationEnrichmentCommands"];
const created = [];

function persistence(action, record, sequence) {
  const value = record.kind === "location-confirmation" ? record.value : record.value;
  return {
    command: { id: `command-${sequence}-${suffix}`, organizationId, action, resultId: value.id, requestFingerprint: String(sequence).padStart(64, "f").slice(-64), actorUserId: userId, recordedAt: now },
    event: { id: `event-${sequence}-${suffix}`, organizationId, actorUserId: userId, actorMembershipId: membershipId, kind: action, subjectId: value.id, commandId: `command-${sequence}-${suffix}`, priorState: null, newState: { status: "accepted" }, occurredAt: now },
    auditEvent: { id: `audit-${sequence}-${suffix}`, organizationId, actor: { userId, membershipId }, action: `organization.enrichment.${action}`, target: null, occurredAt: now },
    record,
  };
}

try {
  for (const collection of collections) {
    await assert.rejects(getDoc(doc(clientDb, collection, `forged-${suffix}`)), (error) => /permission-denied/.test(error?.code));
    await assert.rejects(setDoc(doc(clientDb, collection, `forged-${suffix}`), { organizationId, forged: true }), (error) => /permission-denied/.test(error?.code));
  }

  const credential = { id: `credential-${suffix}`, organizationId, kind: "uei", label: "Unique Entity ID", issuer: "SAM.gov", identifierValue: "ABC123", issuedOn: null, effectiveOn: null, expiresOn: null, sourceLabel: "Organization record", sourceUrl: null, evidenceAssetIds: [], status: "self_reported", visibility: "public", recordedByUserId: userId, recordedByMembershipId: membershipId, createdAt: now, updatedAt: now, retiredAt: null };
  const credentialWrite = persistence("credential-upserted", { kind: "credential", value: credential }, 1);
  await repository.save(credentialWrite); await repository.save(credentialWrite);
  created.push(["organizationCredentials", credential.id], ["organizationEnrichmentEvents", credentialWrite.event.id], ["organizationEnrichmentCommands", credentialWrite.command.id], ["organizationAuditEvents", credentialWrite.auditEvent.id]);
  assert.equal((await repository.listCredentials(organizationId)).length, 1, "Idempotent credential persistence must converge.");

  const profileAsset = { id: `profile-asset-${suffix}`, organizationId, storedAssetId: `stored-${suffix}`, kind: "portfolio", title: "Waterfront retrofit", description: "Organization-provided work image.", altText: "Renovated waterfront building", publicationStatus: "published", recordedByUserId: userId, recordedByMembershipId: membershipId, createdAt: now, updatedAt: now, publishedAt: now, retiredAt: null };
  const assetWrite = persistence("asset-registered", { kind: "profile-asset", value: profileAsset }, 2);
  await repository.save(assetWrite);
  created.push(["organizationProfileAssets", profileAsset.id], ["organizationEnrichmentEvents", assetWrite.event.id], ["organizationEnrichmentCommands", assetWrite.command.id], ["organizationAuditEvents", assetWrite.auditEvent.id]);
  assert.equal((await repository.listProfileAssets(organizationId))[0].publicationStatus, "published");

  const draft = { id: `draft-${suffix}`, organizationId, locationId: `additional-location-${suffix}`, label: "Downtown office", requestedByUserId: userId, membershipId, geographyId: "us-va-portsmouth", physicalAddress: { addressLine1: "801 Crawford St", addressLine2: null, locality: "Portsmouth", regionCode: "VA", postalCode: "23704", countryCode: "US" }, isHomeOrPrivate: false, visibility: "approximate", candidates: [], selectedCandidateId: "candidate-1", state: "confirmed", createdAt: now, updatedAt: now };
  await adminDb.collection("organizationAdditionalLocationDrafts").doc(draft.id).set({ ...draft, schemaVersion: 1 });
  created.push(["organizationAdditionalLocationDrafts", draft.id]);
  const location = { id: draft.locationId, organizationId, sourceDraftId: draft.id, label: draft.label, geographyId: draft.geographyId, physicalAddress: draft.physicalAddress, isHomeOrPrivate: false, visibility: "approximate", coordinate: [-76.3021, 36.8354], geocodeQuality: "address-range", geocodeProvenance: { provider: "U.S. Census Geocoder", providerReference: "tiger-line:1", benchmark: "Public_AR_Current", retrievedAt: now }, publicationStatus: "published", lifecycleStatus: "active", confirmedByUserId: userId, confirmedByMembershipId: membershipId, confirmedAt: now, updatedAt: now, publishedAt: now, retiredAt: null };
  const locationWrite = persistence("additional-location-confirmed", { kind: "location-confirmation", draft, value: location }, 3);
  await repository.save(locationWrite);
  created.push(["organizationAdditionalLocations", location.id], ["organizationEnrichmentEvents", locationWrite.event.id], ["organizationEnrichmentCommands", locationWrite.command.id], ["organizationAuditEvents", locationWrite.auditEvent.id]);
  assert.equal((await repository.listAdditionalLocations(organizationId))[0].lifecycleStatus, "active");

  const crossScope = persistence("credential-upserted", { kind: "credential", value: { ...credential, id: `cross-${suffix}`, organizationId: `org-other-${suffix}` } }, 4);
  await assert.rejects(repository.save(crossScope), /mismatched organization scope/);
  const events = await adminDb.collection("organizationEnrichmentEvents").where("organizationId", "==", organizationId).get();
  assert.equal(events.size, 3);
  console.log("Slice 3.4 organization enrichment direct-client denial, atomic persistence, idempotency, scope, and lifecycle emulator smoke passed.");
} finally {
  await Promise.allSettled(created.map(([collection, id]) => adminDb.collection(collection).doc(id).delete()));
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
