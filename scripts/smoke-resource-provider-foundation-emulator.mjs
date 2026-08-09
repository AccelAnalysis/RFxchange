import assert from "node:assert/strict";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { createProviderApplication, createProviderServiceProfile, transitionProviderApplication } from "../src/domain/resource-providers/model.ts";
import { FirestoreResourceProviderRepository } from "../src/infrastructure/firestore/resource-providers.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
const projectId = "demo-rfxchange"; const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId }, `provider-admin-${suffix}`); const clientApp = initializeClientApp({ apiKey: "demo", authDomain: `${projectId}.firebaseapp.com`, projectId, appId: `1:123:web:provider-${suffix}` }, `provider-client-${suffix}`);
const adminDb = getAdminFirestore(adminApp); const clientDb = getFirestore(clientApp); connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
const repository = new FirestoreResourceProviderRepository(adminDb); const now = "2026-08-09T12:00:00.000Z"; const organizationId = `org-provider-${suffix}`;
const ids = { providerApplications: [organizationId], providerApplicationVersions: [], providerApplicationEvents: [], providerApplicationCommands: [], officialResourceProviderStatuses: [organizationId], providerServiceProfiles: [organizationId], organizationAuditEvents: [], platformAdministrativeAuditEvents: [] };
const content = { categories: ["technical-assistance", "professional-support"], otherCategoryDescription: null, services: [{ id: "service-1", name: "Contract readiness clinic", description: "A structured clinic with eligibility confirmed at intake.", availability: "unknown", capacityNote: null }], populationsServed: "Small organizations", eligibility: "Confirmed during intake", intakeMethod: "Official intake form", modalities: ["hybrid"], languages: ["English"], officialContact: { displayName: "Avery Rivera", roleTitle: "Program Director", email: "avery@example.test", phone: null }, evidenceAssetIds: [], authorityAttested: true };
const refs = { organizationId, profileId: `profile-${suffix}`, locationId: organizationId, serviceGeographyId: organizationId, sourceProfileUpdatedAt: now, sourceLocationUpdatedAt: now, sourceServiceGeographyUpdatedAt: now };
const participantAudit = (id, action) => ({ id, organizationId, actor: { userId: `user-${suffix}`, membershipId: `membership-${suffix}` }, action, target: null, occurredAt: now });
const command = (id, application, action) => ({ id, applicationId: application.id, organizationId, action, requestFingerprint: "f".repeat(64), resultingVersion: application.version, recordedAt: now });
const event = (id, application, kind, fromStatus, actorKind = "participant") => ({ id, applicationId: application.id, organizationId, kind, fromStatus, toStatus: application.status, aggregateVersion: application.version, actorKind, actorId: actorKind === "participant" ? `user-${suffix}` : `admin-${suffix}`, note: null, commandId: `command-${kind}-${suffix}`, occurredAt: now });

try {
  for (const collection of Object.keys(ids).filter((name) => name !== "organizationAuditEvents" && name !== "platformAdministrativeAuditEvents")) {
    await assert.rejects(getDoc(doc(clientDb, collection, `forged-${suffix}`)), (error) => /permission-denied/.test(error?.code));
    await assert.rejects(setDoc(doc(clientDb, collection, `forged-${suffix}`), { organizationId, status: "approved" }), (error) => /permission-denied/.test(error?.code));
  }
  const draft = createProviderApplication({ organizationId, references: refs, content, applicant: { userId: `user-${suffix}`, membershipId: `membership-${suffix}` }, now });
  const draftEvent = event(`event-draft-${suffix}`, draft, "draft-saved", null); const draftCommand = command(`command-draft-${suffix}`, draft, "draft-saved"); const draftAudit = participantAudit(`audit-draft-${suffix}`, "resource-provider.application.saved");
  ids.providerApplicationVersions.push(`${draft.id}:${draftEvent.id}`); ids.providerApplicationEvents.push(draftEvent.id); ids.providerApplicationCommands.push(draftCommand.id); ids.organizationAuditEvents.push(draftAudit.id);
  await repository.saveParticipant({ application: draft, expectedVersion: null, event: draftEvent, command: draftCommand, audit: draftAudit });
  const submitted = transitionProviderApplication({ current: draft, expectedVersion: 1, action: "submitted", now }); const submittedEvent = event(`event-submitted-${suffix}`, submitted, "submitted", "draft"); const submittedCommand = command(`command-submitted-${suffix}`, submitted, "submitted"); const submittedAudit = participantAudit(`audit-submitted-${suffix}`, "resource-provider.application.submitted");
  ids.providerApplicationVersions.push(`${submitted.id}:${submittedEvent.id}`); ids.providerApplicationEvents.push(submittedEvent.id); ids.providerApplicationCommands.push(submittedCommand.id); ids.organizationAuditEvents.push(submittedAudit.id);
  await repository.saveParticipant({ application: submitted, expectedVersion: 1, event: submittedEvent, command: submittedCommand, audit: submittedAudit });
  await assert.rejects(repository.saveParticipant({ application: { ...submitted, version: 9 }, expectedVersion: 1, event: { ...submittedEvent, id: `event-stale-${suffix}` }, command: { ...submittedCommand, id: `command-stale-${suffix}` }, audit: { ...submittedAudit, id: `audit-stale-${suffix}` } }), /changed before/);
  const reviewing = transitionProviderApplication({ current: submitted, expectedVersion: 2, action: "review-started", administratorId: `admin-${suffix}`, now });
  const approved = transitionProviderApplication({ current: reviewing, expectedVersion: 3, action: "approved", administratorId: `admin-${suffix}`, note: "The governed provider criteria are satisfied.", now });
  const approvedEvent = event(`event-approved-${suffix}`, approved, "approved", "under-review", "administrator"); const approvedCommand = command(`command-approved-${suffix}`, approved, "approved"); const status = { id: organizationId, organizationId, status: "official-resource-provider", sourceApplicationId: approved.id, sourceApplicationVersion: approved.version, approvedAt: now, approvedByAdministratorId: `admin-${suffix}` }; const profile = createProviderServiceProfile(approved, now);
  const adminAudit = { id: `admin-audit-${suffix}`, actorAdministratorId: `admin-${suffix}`, actorRolePresetKeys: [], permissionsExercised: ["provider.application.review"], target: { organizationId, userId: null, objectType: "official-resource-provider-application", objectId: approved.id }, action: "provider.application.approved", outcome: "allowed", sensitivity: "ordinary", priorState: { status: "under-review" }, newState: { status: "approved" }, reason: "The governed provider criteria are satisfied.", relatedCaseId: null, occurredAt: now, securityContext: { authenticationSubject: `subject-admin-${suffix}`, sessionId: null, deviceId: null, provider: "firebase", mfaVerifiedAt: null, reauthenticatedAt: now, networkContextHash: null }, justification: null, evidenceReferences: [], approvalReferences: [] };
  ids.providerApplicationVersions.push(`${approved.id}:${approvedEvent.id}`); ids.providerApplicationEvents.push(approvedEvent.id); ids.providerApplicationCommands.push(approvedCommand.id); ids.platformAdministrativeAuditEvents.push(adminAudit.id);
  await adminDb.collection("providerApplications").doc(organizationId).set({ ...reviewing, schemaVersion: 1 });
  await repository.saveAdministrative({ application: approved, expectedVersion: 3, event: approvedEvent, command: approvedCommand, audit: adminAudit, status, serviceProfile: profile });
  assert.equal((await repository.getApplicationByOrganizationId(organizationId))?.status, "approved");
  assert.equal((await repository.getStatusByOrganizationId(organizationId))?.status, "official-resource-provider");
  assert.equal((await repository.getServiceProfileByOrganizationId(organizationId))?.availability, "unknown");
  assert.equal((await repository.listEvents(organizationId)).length, 3);
  assert.equal((await adminDb.collection("providerApplicationVersions").where("organizationId", "==", organizationId).get()).size, 3);
  console.log("Resource Provider Firestore atomic history, approval-only status/profile, stale-write rejection, and direct-client denial emulator smoke passed.");
} finally {
  const paths = Object.entries(ids).flatMap(([collection, values]) => values.map((id) => [collection, id]));
  await Promise.allSettled(paths.map(([collection, id]) => adminDb.collection(collection).doc(id).delete()));
  const residuals = await Promise.all(paths.map(([collection, id]) => adminDb.collection(collection).doc(id).get())); assert.equal(residuals.filter((record) => record.exists).length, 0, "Provider emulator cleanup left residual records.");
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
