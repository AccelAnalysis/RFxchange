import assert from "node:assert/strict";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { createRfxDraft, changeRfxRequestFamily, requestFamilySnapshotFromAmacs } from "../src/domain/rfx/model.ts";
import { FirestoreRfxRepository } from "../src/infrastructure/firestore/rfx.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
const projectId = "demo-rfxchange";
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId }, `rfx-admin-${suffix}`);
const clientApp = initializeClientApp({ apiKey: "demo", authDomain: `${projectId}.firebaseapp.com`, projectId, appId: `1:123:web:rfx-${suffix}` }, `rfx-client-${suffix}`);
const adminDb = getAdminFirestore(adminApp);
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
const repository = new FirestoreRfxRepository(adminDb);
const now = "2026-08-12T12:00:00.000Z";
const organizationId = `org-rfx-${suffix}`;
const aggregateId = `rfx-${suffix}`;
const release = { version: "0.5.0", sourceCommit: "da7879f2609271b067ae6d02875e9388a02c4fe5", releasedAt: now, projectionVersion: "1" };
const record = (id, label) => ({ request_family_id: id, preferred_label: label, purpose: "Gather governed market information.", default_endpoint: "information_reviewed", supports_award: false, default_response_template_id: "AMACS-RSPT-000001", default_decision_template_id: "AMACS-DECT-000001", lifecycle: ["draft", "published", "responses_received", "closed"], status: "active", default_governance_profile_id: "AMACS-GOV-000002", allowed_governance_profile_ids: ["AMACS-GOV-000001", "AMACS-GOV-000002"], recommended_requirement_bundle_ids: ["AMACS-RBND-000001"] });
const firstFamily = requestFamilySnapshotFromAmacs({ release, record: record("AMACS-REQ-000001", "Request for Information"), selectedAt: now });
const secondFamily = requestFamilySnapshotFromAmacs({ release, record: record("AMACS-REQ-000002", "Request for Quotation"), selectedAt: now });
const created = createRfxDraft({ id: aggregateId, issuerOrganizationId: organizationId, requestFamily: firstFamily, actorUserId: `user-${suffix}`, actorMembershipId: `membership-${suffix}`, now });
const ids = { rfxAggregates: [aggregateId], rfxEvents: [`event-create-${suffix}`, `event-change-${suffix}`], rfxCommands: [`command-create-${suffix}`, `command-change-${suffix}`], organizationAuditEvents: [`audit-create-${suffix}`, `audit-change-${suffix}`] };
const event = (id, aggregate, kind, commandId, priorRequestFamily = null) => ({ id, rfxId: aggregate.id, issuerOrganizationId: aggregate.issuerOrganizationId, kind, aggregateVersion: aggregate.version, actorUserId: `user-${suffix}`, actorMembershipId: `membership-${suffix}`, commandId, requestFamily: aggregate.requestFamily, priorRequestFamily, occurredAt: now });
const command = (id, aggregate, action, fingerprint) => ({ id, issuerOrganizationId: aggregate.issuerOrganizationId, rfxId: aggregate.id, action, requestFingerprint: fingerprint, resultingVersion: aggregate.version, recordedAt: now });
const audit = (id, action) => ({ id, organizationId, actor: { userId: `user-${suffix}`, membershipId: `membership-${suffix}` }, action, target: null, occurredAt: now });

try {
  for (const collection of Object.keys(ids)) {
    await assert.rejects(getDoc(doc(clientDb, collection, `forged-${suffix}`)), (error) => /permission-denied/.test(error?.code));
    await assert.rejects(setDoc(doc(clientDb, collection, `forged-${suffix}`), { forged: true }), (error) => /permission-denied/.test(error?.code));
  }

  const createBundle = { aggregate: created, expectedVersion: null, event: event(ids.rfxEvents[0], created, "rfx-draft-created", ids.rfxCommands[0]), command: command(ids.rfxCommands[0], created, "create-draft", "a".repeat(64)), audit: audit(ids.organizationAuditEvents[0], "rfx.draft-created") };
  assert.equal(await repository.save(createBundle), "created");
  assert.equal(await repository.save(createBundle), "replayed");
  await assert.rejects(repository.save({ ...createBundle, command: { ...createBundle.command, requestFingerprint: "b".repeat(64) } }), /command identity collision/);

  const changed = changeRfxRequestFamily({ aggregate: created, expectedVersion: 1, requestFamily: secondFamily, actorUserId: `user-${suffix}`, actorMembershipId: `membership-${suffix}`, now });
  const changeBundle = { aggregate: changed, expectedVersion: 1, event: event(ids.rfxEvents[1], changed, "rfx-request-family-changed", ids.rfxCommands[1], firstFamily), command: command(ids.rfxCommands[1], changed, "change-request-family", "c".repeat(64)), audit: audit(ids.organizationAuditEvents[1], "rfx.request-family-changed") };
  assert.equal(await repository.save(changeBundle), "created");
  assert.equal((await repository.getById(changed.id)).version, 2);
  assert.equal((await repository.listByIssuerOrganizationId(organizationId)).length, 1);
  assert.equal((await repository.listByIssuerOrganizationId(`org-other-${suffix}`)).length, 0);
  await assert.rejects(repository.save({ ...changeBundle, expectedVersion: 1, command: { ...changeBundle.command, id: `command-stale-${suffix}`, requestFingerprint: "d".repeat(64) }, event: { ...changeBundle.event, id: `event-stale-${suffix}`, commandId: `command-stale-${suffix}` }, audit: { ...changeBundle.audit, id: `audit-stale-${suffix}` } }), /current version is 2/);

  for (const collection of ["rfxEvents", "rfxCommands", "organizationAuditEvents"]) {
    await assert.rejects(setDoc(doc(clientDb, collection, ids[collection][0]), { overwritten: true }), (error) => /permission-denied/.test(error?.code));
  }
} finally {
  for (const [collection, documentIds] of Object.entries(ids)) {
    await Promise.all(documentIds.map((id) => adminDb.collection(collection).doc(id).delete()));
  }
  for (const [collection, documentIds] of Object.entries(ids)) {
    const residuals = await Promise.all(documentIds.map((id) => adminDb.collection(collection).doc(id).get()));
    assert.equal(residuals.some((snapshot) => snapshot.exists), false, `${collection} fixture residue remains.`);
  }
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}

console.log("Slice 4.1 RFx Firestore atomicity, replay, conflict, tenant isolation, direct-client deny, immutability, and zero-residual acceptance passed.");
