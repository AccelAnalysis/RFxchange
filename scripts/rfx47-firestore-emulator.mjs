import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { AcquisitionContextService } from "../src/application/acquisition/acquisition-context.ts";
import { calculateOpportunityFit, opportunityPursuitId } from "../src/domain/rfx/pursuit.ts";
import { createTeamInvitation, createTeamParticipation, decideTeamInvitation, TEAMING_BOUNDARY_VERSION } from "../src/domain/rfx/teaming.ts";
import { FirestoreOpportunityTeamingRepository } from "../src/infrastructure/rfx/firestore-opportunity-teaming-repository.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
const projectId = "demo-rfxchange";
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId }, `rfx47-admin-${suffix}`);
const clientApp = initializeClientApp({ apiKey: "demo", authDomain: `${projectId}.firebaseapp.com`, projectId, appId: `1:123:web:rfx47-${suffix}` }, `rfx47-client-${suffix}`);
const db = getAdminFirestore(adminApp);
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
const repository = new FirestoreOpportunityTeamingRepository(db);
const NOW = "2026-08-18T12:00:00.000Z";
const ids = Object.freeze({
  lead: `org-lead-${suffix}`, candidate: `org-candidate-${suffix}`, issuer: `org-issuer-${suffix}`,
  leadUser: `user-lead-${suffix}`, candidateUser: `user-candidate-${suffix}`,
  leadMembership: `membership-lead-${suffix}`, candidateMembership: `membership-candidate-${suffix}`,
  reference: `opp-team-${suffix}`, geography: `county-${suffix}`.toLowerCase(),
  fit: `fit-team-${suffix}`, internal: `teaminv-internal-${suffix}`, external: `teaminv-external-${suffix}`,
});
const payload = Object.freeze({
  title: "Regional continuity support", summary: "Published need", issuerDisplayName: "Regional Buyer",
  requestFamilyLabel: "Request for Information", requestFamilyPurpose: "Gather information",
  timing: Object.freeze({ anticipatedStartDate: null, anticipatedCompletionDate: null, responseDeadline: "2026-09-18" }),
  localities: Object.freeze([{ id: ids.geography, label: "Released county" }]), estimatedValue: Object.freeze({ mode: "not-disclosed" }),
  engagementTerm: Object.freeze({ mode: "fixed", duration: Object.freeze({ value: 3, unit: "months" }), note: null }), requestedOutputs: Object.freeze([]), foundationRequirements: Object.freeze([]), responseSections: Object.freeze([]), evaluation: Object.freeze({ methodLabel: null, weightingRequired: false, factors: Object.freeze([]) }),
  requirements: Object.freeze([{ title: "Exercise facilitation", description: "Facilitate a continuity exercise.", level: "required", requirementTypeLabel: "Capability", capabilityLabel: "Exercise facilitation", capabilityDefinition: "Facilitate exercises.", qualifiers: Object.freeze([]), evidence: Object.freeze([]) }]),
});
const projection = Object.freeze({
  schemaVersion: 1, reference: ids.reference, audience: "authenticated-participants", aggregateVersion: 3, mode: "published",
  digest: createHash("sha256").update(JSON.stringify(payload)).digest("hex"), publishedAt: NOW, issuerOrganizationIndexKey: ids.issuer,
  requestFamilyIndexKey: "AMACS-REQ-000001", localityIndexKeys: Object.freeze([ids.geography]), capabilityIndexKeys: Object.freeze(["AMACS-CAP-000002"]),
  requirementIndex: Object.freeze([{ ordinal: 0, requirementId: "req-exercise", capabilityId: "AMACS-CAP-000002", amacsReleaseVersion: "0.5.0", level: "required", satisfyingParty: "any-accepted-team-member", teamCoverageAllowed: true, evidenceRequired: false }]), payload,
});
const publication = Object.freeze({
  id: `publication-${suffix}`, reference: ids.reference, aggregateVersion: projection.aggregateVersion, projectionDigest: projection.digest,
  aggregate: Object.freeze({ issuerOrganizationId: ids.issuer, version: projection.aggregateVersion, lifecycleState: "published", definition: Object.freeze({ requirements: Object.freeze([{ id: "req-exercise", capability: Object.freeze({ id: "AMACS-CAP-000002", amacsReleaseVersion: "0.5.0" }), level: "required", satisfyingParty: "any-accepted-team-member", teamCoverageAllowed: true, evidenceRequirementIds: Object.freeze([]) }]) }) }),
});
const explanation = calculateOpportunityFit({ organizationId: ids.lead, projection, claims: Object.freeze([]), serviceGeographyIds: Object.freeze([ids.geography]), calculatedAt: NOW });
const gap = explanation.gaps[0];
const fit = Object.freeze({ schemaVersion: 1, id: ids.fit, organizationId: ids.lead, opportunityReference: ids.reference, explanation, recordedAt: NOW });
const pursuit = Object.freeze({
  schemaVersion: 1, id: opportunityPursuitId(ids.lead, ids.reference), organizationId: ids.lead, opportunityReference: ids.reference, decision: "pursue",
  assessment: Object.freeze({ fit: Object.freeze({ state: "concern", note: "Gap" }), eligibility: Object.freeze({ state: "not-reviewed", note: "" }), capacity: Object.freeze({ state: "not-reviewed", note: "" }), economics: Object.freeze({ state: "not-reviewed", note: "" }), geography: Object.freeze({ state: "acceptable", note: "" }), gaps: Object.freeze({ state: "concern", note: "" }) }),
  gapAssessments: Object.freeze([{ reference: gap.reference, observationReference: gap.observationReference, kind: gap.kind, title: gap.title, capabilityLabel: gap.capabilityLabel, openedExplanationInputDigest: explanation.inputDigest, reviewedExplanationInputDigest: explanation.inputDigest, reviewedFitSnapshotId: fit.id, status: "open" }]),
  reviewedFitSnapshotId: fit.id, reviewedProjectionVersion: projection.aggregateVersion, reviewedProjectionDigest: projection.digest, reviewedCapabilityInputDigest: explanation.organizationCapabilityInputDigest, fitPolicyVersion: explanation.policyVersion,
  version: 1, createdByUserId: ids.leadUser, createdByMembershipId: ids.leadMembership, updatedByUserId: ids.leadUser, updatedByMembershipId: ids.leadMembership, createdAt: NOW, updatedAt: NOW,
});
const gapContext = Object.freeze({ schemaVersion: 1, organizationId: ids.lead, opportunityReference: ids.reference, opportunityTitle: payload.title, issuerOrganizationId: ids.issuer, issuerDisplayName: payload.issuerDisplayName, responseDeadline: "2026-09-18", pursuitId: pursuit.id, pursuitVersion: pursuit.version, fitSnapshotId: fit.id, explanationInputDigest: explanation.inputDigest, gapReference: gap.reference, gapKind: gap.kind, gapTitle: gap.title, observationReference: gap.observationReference, requirementReference: "req-exercise", capabilityLabel: "Exercise facilitation", teamCoverageAllowed: true, geographyIds: Object.freeze([ids.geography]), returnHref: `/opportunities/${ids.reference}/assess` });

const command = (id, organizationId, action, invitation) => Object.freeze({ schemaVersion: 1, id, organizationId, action, requestFingerprint: createHash("sha256").update(`${action}:${invitation.id}:${invitation.version}`).digest("hex"), invitationId: invitation.id, resultingVersion: invitation.version, resultingInvitation: invitation, recordedAt: invitation.updatedAt });
const event = (id, invitation, actorOrganizationId, actorUserId, actorMembershipId, kind, commandId) => Object.freeze({ schemaVersion: 1, id, invitationId: invitation.id, leadOrganizationId: invitation.leadOrganizationId, actorOrganizationId, actorUserId, actorMembershipId, kind, invitationVersion: invitation.version, commandId, occurredAt: invitation.updatedAt });
const audit = (id, organizationId, action) => Object.freeze({ id, organizationId, action, actorUserId: ids.leadUser, actorMembershipId: ids.leadMembership, occurredAt: NOW });
const baseCollections = ["rfxOpportunityProjections", "rfxPublicationSnapshots", "opportunityPursuits", "opportunityFitSnapshots", "organizationServiceGeographies", "geographies", "organizationMemberships", "organizationAuthorizations", "users", "organizationMarkerActivations", "organizationCapabilityClaims"];

try {
  await Promise.all([
    db.collection("rfxOpportunityProjections").doc(ids.reference).set(projection),
    db.collection("rfxPublicationSnapshots").doc(publication.id).set(publication),
    db.collection("opportunityPursuits").doc(pursuit.id).set(pursuit),
    db.collection("opportunityFitSnapshots").doc(fit.id).set(fit),
    db.collection("organizationServiceGeographies").doc(ids.lead).set({ organizationId: ids.lead, serviceGeographyIds: [ids.geography] }),
    db.collection("geographies").doc(ids.geography).set({ id: ids.geography, releaseState: "released" }),
    db.collection("organizationMemberships").doc(ids.leadMembership).set({ id: ids.leadMembership, userId: ids.leadUser, organizationId: ids.lead, status: "active" }),
    db.collection("organizationMemberships").doc(ids.candidateMembership).set({ id: ids.candidateMembership, userId: ids.candidateUser, organizationId: ids.candidate, status: "active" }),
    db.collection("organizationAuthorizations").doc(ids.leadMembership).set({ membershipId: ids.leadMembership, userId: ids.leadUser, organizationId: ids.lead, permissions: ["response.create"] }),
    db.collection("organizationAuthorizations").doc(ids.candidateMembership).set({ membershipId: ids.candidateMembership, userId: ids.candidateUser, organizationId: ids.candidate, permissions: ["response.create"] }),
    db.collection("users").doc(ids.leadUser).set({ id: ids.leadUser, primaryEmail: "lead@example.test" }),
    db.collection("users").doc(ids.candidateUser).set({ id: ids.candidateUser, primaryEmail: "invitee@example.test" }),
    db.collection("organizationMarkerActivations").doc(ids.candidate).set({ id: ids.candidate, organizationId: ids.candidate, geographyId: ids.geography, status: "active" }),
    db.collection("organizationCapabilityClaims").doc(`claim-${suffix}`).set({ id: `claim-${suffix}`, organizationId: ids.candidate, capabilityId: "AMACS-CAP-000002", labelSnapshot: "Exercise facilitation", assertionStatus: "self_reported", visibility: "network" }),
  ]);

  const internal = createTeamInvitation({ id: ids.internal, context: gapContext, target: { kind: "organization", organizationId: ids.candidate, displayNameSnapshot: "Candidate Organization" }, proposedCapacity: "capability-contributor", responsibilitySummary: "Support the current exercise facilitation gap.", actorUserId: ids.leadUser, actorMembershipId: ids.leadMembership, now: NOW });
  const internalCommand = command(`cmd-internal-${suffix}`, ids.lead, "invitation.create", internal);
  const internalEvent = event(`event-internal-${suffix}`, internal, ids.lead, ids.leadUser, ids.leadMembership, "invitation-created", internalCommand.id);
  assert.equal(await repository.createInvitation({ invitation: internal, command: internalCommand, event: internalEvent, audit: audit(`audit-internal-${suffix}`, ids.lead, "opportunity.team-invitation-created"), acquisition: null }), "created");
  assert.equal(await repository.createInvitation({ invitation: internal, command: internalCommand, event: internalEvent, audit: audit(`audit-internal-${suffix}`, ids.lead, "opportunity.team-invitation-created"), acquisition: null }), "replayed");

  const acquisitionService = new AcquisitionContextService({ contexts: { create: async () => {}, getById: async () => null, bind: async () => { throw new Error("unused"); }, resume: async () => { throw new Error("unused"); } }, opportunities: { getByReference: async () => null }, ids: { context: () => `acq-${suffix}`, event: () => `acq-event-${suffix}` }, secrets: { create: () => "unused-secret-with-more-than-thirty-two-characters", digest: (value) => createHash("sha256").update(value).digest("hex") }, now: () => NOW });
  const acquisition = acquisitionService.prepareTrusted({ kind: "team-invitation", subjectReference: ids.external, channel: "team-invitation-link", sourceReference: ids.reference, contextId: `acq-${suffix}`, eventId: `acq-event-${suffix}`, browserSecret: "external-secret-with-more-than-thirty-two-characters", issuedAt: NOW });
  const email = Object.freeze({ id: `message-${suffix}`, purpose: "transactional", recipient: Object.freeze({ email: "invitee@example.test", displayName: "Invitee" }), eventKey: "rfx.team-invitation.sent", eventVersion: 1, templateKey: "rfx-team-invitation", templateVersion: 1, variables: Object.freeze({}), metadata: Object.freeze({ correlationId: `team:${suffix}`, idempotencyKey: `team:${suffix}`, requestedAt: NOW, organizationId: ids.lead, userId: ids.leadUser, relatedObjectType: "rfx-team-invitation", relatedObjectId: ids.external, tags: Object.freeze(["rfx"]) }) });
  const external = createTeamInvitation({ id: ids.external, context: gapContext, target: { kind: "external", recipientEmail: "invitee@example.test", recipientDisplayName: "Invitee" }, proposedCapacity: "subject-matter-support", responsibilitySummary: "Support the current exercise facilitation gap.", acquisitionContextId: acquisition.context.id, communicationRequest: email, actorUserId: ids.leadUser, actorMembershipId: ids.leadMembership, now: NOW });
  const externalCommand = command(`cmd-external-${suffix}`, ids.lead, "invitation.create", external);
  await repository.createInvitation({ invitation: external, command: externalCommand, event: event(`event-external-${suffix}`, external, ids.lead, ids.leadUser, ids.leadMembership, "invitation-created", externalCommand.id), audit: audit(`audit-external-${suffix}`, ids.lead, "opportunity.team-invitation-created"), acquisition });
  const persistedAcquisition = (await db.collection("acquisitionContexts").doc(acquisition.context.id).get()).data();
  assert.equal(persistedAcquisition.status, "issued");
  assert.equal(persistedAcquisition.intent.subjectReference, ids.external);
  assert.equal((await repository.getInvitation(ids.external)).status, "pending");
  await db.collection("acquisitionContexts").doc(acquisition.context.id).update({ status: "bound", boundUserId: ids.candidateUser, boundAccessJourneyId: `journey-${suffix}` });
  const accepted = decideTeamInvitation({ current: external, expectedVersion: 1, action: "accept", actorOrganizationId: ids.candidate, actorUserId: ids.candidateUser, actorMembershipId: ids.candidateMembership, attachedOrganizationId: ids.candidate, boundaryVersion: TEAMING_BOUNDARY_VERSION, boundaryLocale: "en-US", now: "2026-08-18T12:10:00.000Z" });
  const acceptanceCommand = command(`cmd-accept-${suffix}`, ids.candidate, "invitation.accept", accepted);
  const participation = createTeamParticipation({ invitation: accepted, actorOrganizationId: ids.candidate, actorUserId: ids.candidateUser, actorMembershipId: ids.candidateMembership });
  assert.equal(await repository.decideInvitation({ invitation: accepted, expectedVersion: 1, command: acceptanceCommand, event: event(`event-accept-${suffix}`, accepted, ids.candidate, ids.candidateUser, ids.candidateMembership, "invitation-accepted", acceptanceCommand.id), audit: { ...audit(`audit-accept-${suffix}`, ids.candidate, "opportunity.team-invitation-accept"), actorUserId: ids.candidateUser, actorMembershipId: ids.candidateMembership }, participation }), "created");
  assert.equal((await repository.getInvitation(ids.external)).status, "accepted");
  assert.equal((await db.collection("rfxTeamParticipations").doc(participation.id).get()).exists, true);

  await assert.rejects(getDoc(doc(clientDb, "rfxTeamInvitations", ids.external)), (error) => /permission-denied/.test(error?.code));
  await assert.rejects(setDoc(doc(clientDb, "rfxTeamInvitations", `forged-${suffix}`), { status: "accepted" }), (error) => /permission-denied/.test(error?.code));
  console.log("Slice 4.7 teaming atomicity, replay, acquisition binding, decision evidence, and direct-client denial passed.");
} finally {
  for (const collection of ["rfxTeamInvitations", "rfxTeamParticipations", "rfxTeamInvitationCommands", "rfxTeamInvitationEvents", "organizationAuditEvents", "acquisitionContexts", "acquisitionContextEvents", ...baseCollections]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.filter((item) => item.id.includes(suffix) || String(item.data().invitationId ?? "").includes(suffix) || String(item.data().opportunityReference ?? "").includes(suffix)).map((item) => item.ref.delete()));
  }
  for (const collection of ["rfxTeamInvitations", "rfxTeamParticipations", "rfxTeamInvitationCommands", "rfxTeamInvitationEvents", "acquisitionContexts", "acquisitionContextEvents"]) {
    const residual = await db.collection(collection).get();
    assert.equal(residual.docs.some((item) => item.id.includes(suffix) || String(item.data().invitationId ?? "").includes(suffix)), false, `${collection} fixture residue remains.`);
  }
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
