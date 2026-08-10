import assert from "node:assert/strict";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { FirestoreOrganizationMarketProfileRepository } from "../src/infrastructure/firestore/market-profile.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080", "Slice 3.3 acceptance must use the Firestore emulator.");
const projectId = "demo-rfxchange";
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId }, `market-profile-admin-${suffix}`);
const clientApp = initializeClientApp({ apiKey: "demo-api-key", authDomain: `${projectId}.firebaseapp.com`, projectId, appId: `1:123:web:market-profile-${suffix}` }, `market-profile-client-${suffix}`);
const adminDb = getAdminFirestore(adminApp);
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
const repository = new FirestoreOrganizationMarketProfileRepository(adminDb);
const organizationId = `org-market-${suffix}`;
const now = "2026-08-08T16:00:00.000Z";
const collections = ["organizationCapabilityClaims", "organizationIndustryProfiles", "organizationPastPerformance", "organizationMarketPreferences", "organizationProvisionalTerms", "organizationMarketProfileEvents", "organizationMarketProfileCommands"];
const created = [];

function persistenceInput(commandId, eventId, auditId, record) {
  const action = record.kind === "capability" ? "capability-claimed" : record.kind === "industry" ? "industry-context-updated" : record.kind === "past-performance" ? "past-performance-added" : record.kind === "preferences" ? "preferences-updated" : "provisional-term-submitted";
  return {
    command: { id: commandId, organizationId, action, resultId: record.value.id, requestFingerprint: "f".repeat(64), actorUserId: `user-${suffix}`, recordedAt: now },
    event: { id: eventId, organizationId, actorUserId: `user-${suffix}`, actorMembershipId: `membership-${suffix}`, kind: action, subjectId: record.value.id, commandId, occurredAt: now },
    auditEvent: { id: auditId, organizationId, actor: { userId: `user-${suffix}`, membershipId: `membership-${suffix}` }, action: `organization.market-profile.${action}`, target: null, occurredAt: now },
    record,
  };
}

try {
  for (const collection of collections) {
    await assert.rejects(getDoc(doc(clientDb, collection, `forged-${suffix}`)), (error) => /permission-denied/.test(error?.code));
    await assert.rejects(setDoc(doc(clientDb, collection, `forged-${suffix}`), { organizationId, forged: true }), (error) => /permission-denied/.test(error?.code));
  }

  const claim = { id: `claim-${suffix}`, organizationId, capabilityId: "AMACS-CAP-000002", amacsReleaseVersion: "0.5.0", labelSnapshot: "General contracting", definitionSnapshot: "The organizational ability to provide or perform general contracting.", domainId: "AMACS-DOM-000001", domainLabelSnapshot: "Built Environment and Facilities", familyId: "AMACS-FAM-000001", familyLabelSnapshot: "General Construction and Renovation", entityScope: "reporting_entity", marketRoleIds: ["AMACS-MROLE-000003"], deliveryRoles: ["prime"], serviceGeographyIds: ["us-va-portsmouth"], specialties: ["Public facilities"], capacity: null, evidenceIds: [], assertionStatus: "self_reported", visibility: "network", source: { kind: "manual" }, assertedByUserId: `user-${suffix}`, assertedByMembershipId: `membership-${suffix}`, createdAt: now, updatedAt: now };
  const claimWrite = persistenceInput(`command-claim-${suffix}`, `event-claim-${suffix}`, `audit-claim-${suffix}`, { kind: "capability", value: claim });
  await repository.save(claimWrite);
  await repository.save(claimWrite);
  created.push(["organizationCapabilityClaims", claim.id], ["organizationMarketProfileCommands", claimWrite.command.id], ["organizationMarketProfileEvents", claimWrite.event.id], ["organizationAuditEvents", claimWrite.auditEvent.id]);
  const claims = await repository.claims.listByOrganizationId(organizationId);
  assert.equal(claims.length, 1, "Idempotent replay must not duplicate the capability claim.");
  assert.equal(claims[0].assertionStatus, "self_reported");

  const industry = { id: organizationId, organizationId, revision: 1, industries: [{ id: "industry-construction", label: "Commercial construction", visibility: "network" }], naics: [{ id: "naics-236220", code: "236220", title: "Commercial and Institutional Building Construction", version: "2022", source: "participant_selected", provenance: "Participant selected", visibility: "network" }], updatedByUserId: `user-${suffix}`, updatedByMembershipId: `membership-${suffix}`, updatedAt: now };
  const industryWrite = persistenceInput(`command-industry-${suffix}`, `event-industry-${suffix}`, `audit-industry-${suffix}`, { kind: "industry", value: industry });
  await repository.save({ ...industryWrite, expectedRecordRevision: 0 });
  created.push(["organizationIndustryProfiles", industry.id], ["organizationMarketProfileCommands", industryWrite.command.id], ["organizationMarketProfileEvents", industryWrite.event.id], ["organizationAuditEvents", industryWrite.auditEvent.id]);
  assert.equal((await repository.getIndustryProfile(organizationId))?.naics[0].code, "236220");

  const project = { id: `project-${suffix}`, organizationId, title: "Municipal facilities modernization", summary: "Renovated occupied municipal facilities through a phased construction plan.", customerOrSector: null, role: "Prime contractor", startedOn: null, endedOn: null, contractType: null, value: { currency: "USD", exactMinorUnits: 125000000, minimumMinorUnits: null, maximumMinorUnits: null, disclosed: false }, location: null, outputs: ["Renovated facilities"], outcomesClaimed: [], supportingCapabilityClaimIds: [claim.id], evidenceIds: [], confirmationState: "self_reported", visibility: "private", authoredByUserId: `user-${suffix}`, authoredByMembershipId: `membership-${suffix}`, createdAt: now, updatedAt: now };
  const projectWrite = persistenceInput(`command-project-${suffix}`, `event-project-${suffix}`, `audit-project-${suffix}`, { kind: "past-performance", value: project });
  await repository.save(projectWrite);
  created.push(["organizationPastPerformance", project.id], ["organizationMarketProfileCommands", projectWrite.command.id], ["organizationMarketProfileEvents", projectWrite.event.id], ["organizationAuditEvents", projectWrite.auditEvent.id]);
  assert.equal((await repository.listPastPerformance(organizationId))[0].confirmationState, "self_reported");

  const crossScope = persistenceInput(`command-cross-${suffix}`, `event-cross-${suffix}`, `audit-cross-${suffix}`, { kind: "provisional-term", value: { id: `term-cross-${suffix}`, organizationId: `org-other-${suffix}`, proposedLabel: "Wrong scope", proposedDefinition: "This record deliberately belongs to the wrong organization scope.", exampleWork: "Cross-tenant data must fail closed.", suggestedDomainId: null, status: "submitted", sourceContext: "organization_profile", submittedByUserId: `user-${suffix}`, submittedByMembershipId: `membership-${suffix}`, submittedAt: now } });
  await assert.rejects(repository.save(crossScope), /mismatched organization scope/);

  const eventCount = await adminDb.collection("organizationMarketProfileEvents").where("organizationId", "==", organizationId).get();
  assert.equal(eventCount.size, 3, "Each accepted write must have one immutable market-profile event.");
  console.log("Slice 3.3 market-profile direct-client denial, atomic persistence, idempotency, scope, and provenance emulator smoke passed.");
} finally {
  await Promise.allSettled(created.map(([collection, id]) => adminDb.collection(collection).doc(id).delete()));
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
