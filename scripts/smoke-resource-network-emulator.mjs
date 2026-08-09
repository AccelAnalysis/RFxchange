import assert from "node:assert/strict";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { createProviderPublication, createProviderRequestMessage, createProviderResource, updateProviderPublication, updateProviderResource } from "../src/domain/resource-network/model.ts";
import { FirestoreResourceNetworkRepository } from "../src/infrastructure/firestore/resource-network.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
const projectId = "demo-rfxchange";
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId }, `resource-network-admin-${suffix}`);
const clientApp = initializeClientApp({ apiKey: "demo", authDomain: `${projectId}.firebaseapp.com`, projectId, appId: `1:123:web:resource-network-${suffix}` }, `resource-network-client-${suffix}`);
const adminDb = getAdminFirestore(adminApp);
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
const repository = new FirestoreResourceNetworkRepository(adminDb);
const now = "2026-08-09T16:00:00.000Z";
const organizationId = `org-provider-${suffix}`;
const publicationId = organizationId;
const resourceId = `resource-${suffix}`;
const messageId = `message-${suffix}`;
const collections = ["providerDiscoveryPublications", "providerResources", "providerNetworkEvents", "providerNetworkCommands", "providerRequestMessages", "providerAcquisitionInvitations"];
const created = { providerDiscoveryPublications: [publicationId], providerResources: [resourceId], providerNetworkEvents: [], providerNetworkCommands: [], providerRequestMessages: [messageId], organizationAuditEvents: [] };
const evidence = (kind, objectType, objectId, version) => {
  const id = `${kind}-${suffix}`;
  const commandId = `command-${kind}-${suffix}`;
  const auditId = `audit-${kind}-${suffix}`;
  created.providerNetworkEvents.push(id); created.providerNetworkCommands.push(commandId); created.organizationAuditEvents.push(auditId);
  return { event: { id, organizationId, objectType, objectId, kind, aggregateVersion: version, actorUserId: `user-${suffix}`, actorMembershipId: `membership-${suffix}`, commandId, occurredAt: now }, command: { id: commandId, organizationId, objectId, action: kind, requestFingerprint: "f".repeat(64), resultingVersion: version, recordedAt: now }, audit: { id: auditId, organizationId, actor: { userId: `user-${suffix}`, membershipId: `membership-${suffix}` }, action: `resource-network.${kind}`, target: null, occurredAt: now } };
};

try {
  for (const collection of collections) {
    await assert.rejects(getDoc(doc(clientDb, collection, `forged-${suffix}`)), (error) => /permission-denied/.test(error?.code));
    await assert.rejects(setDoc(doc(clientDb, collection, `forged-${suffix}`), { forged: true }), (error) => /permission-denied/.test(error?.code));
  }
  const draft = createProviderPublication({ organizationId, sourceProfileVersion: 1, visibleServiceIds: ["service-1"], actorUserId: `user-${suffix}`, actorMembershipId: `membership-${suffix}`, now });
  await repository.savePublication({ publication: draft, expectedVersion: null, ...evidence("publication-saved", "provider-publication", publicationId, 1) });
  const published = updateProviderPublication({ current: draft, expectedVersion: 1, sourceProfileVersion: 1, visibleServiceIds: draft.visibleServiceIds, action: "publish", actorUserId: `user-${suffix}`, actorMembershipId: `membership-${suffix}`, now });
  await repository.savePublication({ publication: published, expectedVersion: 1, ...evidence("publication-published", "provider-publication", publicationId, 2) });
  assert.equal((await repository.listPublishedPublications()).some((item) => item.id === publicationId), true);
  const resourceDraft = createProviderResource({ id: resourceId, organizationId, kind: "program", title: "Provider program", summary: "Maintained resource summary.", description: "Maintained resource description for the emulator acceptance path.", serviceIds: ["service-1"], geographyIds: ["geo-1"], modalities: ["virtual"], eligibility: "Organizations in geo-1.", visibility: "network", actorUserId: `user-${suffix}`, now });
  await repository.saveResource({ resource: resourceDraft, expectedVersion: null, ...evidence("resource-saved", "provider-resource", resourceId, 1) });
  const resource = updateProviderResource({ current: resourceDraft, expectedVersion: 1, action: "publish", actorUserId: `user-${suffix}`, now });
  await repository.saveResource({ resource, expectedVersion: 1, ...evidence("resource-published", "provider-resource", resourceId, 2) });
  assert.equal((await repository.listPublishedResources()).some((item) => item.id === resourceId), true);
  const message = createProviderRequestMessage({ id: messageId, referralId: `ref-${suffix}`, requesterOrganizationId: `org-requester-${suffix}`, providerOrganizationId: organizationId, authorOrganizationId: organizationId, authorUserId: `user-${suffix}`, body: "Emulator request-scoped message.", now });
  await repository.appendMessage({ message, ...evidence("request-message-added", "provider-request", message.referralId, 1) });
  assert.equal((await repository.listMessages(message.referralId))[0]?.body, message.body);
  await assert.rejects(repository.saveResource({ resource: { ...resource, version: 4 }, expectedVersion: 1, ...evidence("resource-withdrawn", "provider-resource", resourceId, 4) }), /current version is 2/);
  console.log("Resource Network Firestore atomicity, publication/resource/message queries, and direct-client denial emulator smoke passed.");
} finally {
  const paths = Object.entries(created).flatMap(([collection, ids]) => ids.map((id) => [collection, id]));
  await Promise.allSettled(paths.map(([collection, id]) => adminDb.collection(collection).doc(id).delete()));
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
