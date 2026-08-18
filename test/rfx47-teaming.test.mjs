import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";

import { AcquisitionContextService } from "../src/application/acquisition/acquisition-context.ts";
import { OpportunityTeamingError, OpportunityTeamingService } from "../src/application/rfx/opportunity-teaming-service.ts";
import { calculateOpportunityFit, opportunityPursuitId } from "../src/domain/rfx/pursuit.ts";
import { TEAMING_BOUNDARY_COPY, TEAMING_BOUNDARY_COPY_BY_LOCALE, TEAMING_BOUNDARY_VERSION, createTeamInvitation, decideTeamInvitation, teamInvitationId, teamingBoundaryCopyDigest } from "../src/domain/rfx/teaming.ts";

const NOW = "2026-08-18T12:00:00.000Z";
const payload = Object.freeze({
  title: "Regional continuity support",
  summary: "Published need",
  issuerDisplayName: "Regional Buyer",
  requestFamilyLabel: "Request for Information",
  requestFamilyPurpose: "Gather information",
  timing: Object.freeze({ anticipatedStartDate: null, anticipatedCompletionDate: null, responseDeadline: "2026-09-18" }),
  localities: Object.freeze([{ id: "county-51013", label: "Arlington County, Virginia" }]),
  estimatedValue: Object.freeze({ mode: "not-disclosed" }),
  engagementTerm: Object.freeze({ mode: "fixed", duration: Object.freeze({ value: 3, unit: "months" }), note: null }),
  requestedOutputs: Object.freeze([]),
  foundationRequirements: Object.freeze([]),
  responseSections: Object.freeze([]),
  evaluation: Object.freeze({ methodLabel: null, weightingRequired: false, factors: Object.freeze([]) }),
  requirements: Object.freeze([{ title: "Exercise facilitation", description: "Facilitate a continuity exercise.", level: "required", requirementTypeLabel: "Capability", capabilityLabel: "Exercise facilitation", capabilityDefinition: "Facilitate exercises.", qualifiers: Object.freeze([]), evidence: Object.freeze([]) }]),
});
const projectionDigest = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
const projection = Object.freeze({
  schemaVersion: 1,
  reference: "opp_team_fixture",
  audience: "authenticated-participants",
  aggregateVersion: 3,
  mode: "published",
  digest: projectionDigest,
  publishedAt: NOW,
  issuerOrganizationIndexKey: "org-issuer",
  requestFamilyIndexKey: "AMACS-REQ-000001",
  localityIndexKeys: Object.freeze(["us:county-51013"]),
  capabilityIndexKeys: Object.freeze(["AMACS-CAP-000002"]),
  requirementIndex: Object.freeze([{ ordinal: 0, requirementId: "req-exercise", capabilityId: "AMACS-CAP-000002", amacsReleaseVersion: "0.5.0", level: "required", satisfyingParty: "any-accepted-team-member", teamCoverageAllowed: true, evidenceRequired: false }]),
  payload,
});
const publication = Object.freeze({
  reference: projection.reference,
  aggregateVersion: projection.aggregateVersion,
  projectionDigest: projection.digest,
  aggregate: Object.freeze({
    issuerOrganizationId: "org-issuer",
    version: projection.aggregateVersion,
    lifecycleState: "published",
    definition: Object.freeze({ requirements: Object.freeze([{ id: "req-exercise", capability: Object.freeze({ id: "AMACS-CAP-000002", amacsReleaseVersion: "0.5.0" }), level: "required", satisfyingParty: "any-accepted-team-member", teamCoverageAllowed: true, evidenceRequirementIds: Object.freeze([]) }]) }),
  }),
});

function context(userId, email) {
  return Object.freeze({
    user: Object.freeze({ id: userId, name: userId, primaryEmail: email, login: Object.freeze({ provider: "firebase", subject: `subject-${userId}` }), security: Object.freeze({ mfaEnabled: false, credentialVersion: 1 }), createdAt: NOW, updatedAt: NOW }),
    authentication: Object.freeze({ provider: "firebase", subject: `subject-${userId}`, authenticatedAt: NOW, issuedAt: NOW, expiresAt: "2026-08-18T13:00:00.000Z", source: "id-token" }),
  });
}

const actors = Object.freeze({
  lead: Object.freeze({ userId: "user-lead", email: "lead@example.test", organizationId: "org-lead", membershipId: "membership-lead" }),
  invitee: Object.freeze({ userId: "user-invitee", email: "invitee@example.test", organizationId: "org-candidate", membershipId: "membership-invitee" }),
  other: Object.freeze({ userId: "user-other", email: "other@example.test", organizationId: "org-other", membershipId: "membership-other" }),
});

function authorization() {
  const byMembership = new Map(Object.values(actors).map((actor) => [actor.membershipId, actor]));
  return Object.freeze({
    accountSecurity: { inspect: async (subject) => Object.freeze({ provider: "firebase", subject, email: Object.values(actors).find((actor) => `subject-${actor.userId}` === subject)?.email ?? "unknown@example.test", emailVerified: true, disabled: false, mfaEnrolled: false, tokensValidAfter: "2026-08-18T11:00:00.000Z", lastSignInAt: NOW }) },
    organizations: { getById: async (id) => Object.freeze({ id, createdAt: NOW, updatedAt: NOW }) },
    memberships: { getById: async (id) => { const actor = byMembership.get(String(id)); return actor ? Object.freeze({ id, userId: actor.userId, organizationId: actor.organizationId, status: "active", createdAt: NOW, updatedAt: NOW }) : null; } },
    authorizations: { getByMembershipId: async (id) => { const actor = byMembership.get(String(id)); return actor ? Object.freeze({ membershipId: id, userId: actor.userId, organizationId: actor.organizationId, roleKey: "response-manager", permissions: Object.freeze(["response.create"]), createdAt: NOW, updatedAt: NOW }) : null; } },
    restrictions: { getForOrganization: async () => null, getForMembership: async () => null },
  });
}

function fixture() {
  const explanation = calculateOpportunityFit({ organizationId: "org-lead", projection, claims: Object.freeze([]), serviceGeographyIds: Object.freeze(["county-51013"]), calculatedAt: NOW });
  const gap = explanation.gaps[0];
  const fit = Object.freeze({ schemaVersion: 1, id: "fit-team", organizationId: "org-lead", opportunityReference: projection.reference, explanation, recordedAt: NOW });
  let pursuit = Object.freeze({
    schemaVersion: 1,
    id: opportunityPursuitId("org-lead", projection.reference),
    organizationId: "org-lead",
    opportunityReference: projection.reference,
    decision: "pursue",
    assessment: Object.freeze({ fit: Object.freeze({ state: "concern", note: "Gap" }), eligibility: Object.freeze({ state: "not-reviewed", note: "" }), capacity: Object.freeze({ state: "not-reviewed", note: "" }), economics: Object.freeze({ state: "not-reviewed", note: "" }), geography: Object.freeze({ state: "acceptable", note: "" }), gaps: Object.freeze({ state: "concern", note: "" }) }),
    gapAssessments: Object.freeze([{ reference: gap.reference, observationReference: gap.observationReference, kind: gap.kind, title: gap.title, capabilityLabel: gap.capabilityLabel, openedExplanationInputDigest: explanation.inputDigest, reviewedExplanationInputDigest: explanation.inputDigest, reviewedFitSnapshotId: fit.id, status: "open" }]),
    reviewedFitSnapshotId: fit.id,
    reviewedProjectionVersion: projection.aggregateVersion,
    reviewedProjectionDigest: projection.digest,
    reviewedCapabilityInputDigest: explanation.organizationCapabilityInputDigest,
    fitPolicyVersion: explanation.policyVersion,
    version: 1,
    createdByUserId: "user-lead",
    createdByMembershipId: "membership-lead",
    updatedByUserId: "user-lead",
    updatedByMembershipId: "membership-lead",
    createdAt: NOW,
    updatedAt: NOW,
  });
  const invitations = new Map();
  const commands = new Map();
  const participations = [];
  const acquisitions = [];
  const repository = {
    getInvitation: async (id) => invitations.get(id) ?? null,
    listByLeadOrganization: async (organizationId, reference) => Object.freeze([...invitations.values()].filter((item) => item.leadOrganizationId === organizationId && item.opportunityReference === reference)),
    listByTargetOrganization: async (organizationId) => Object.freeze([...invitations.values()].filter((item) => item.attachedOrganizationId === organizationId)),
    getCommand: async (id) => commands.get(id) ?? null,
    createInvitation: async (bundle) => {
      const prior = commands.get(bundle.command.id);
      if (prior) return prior.requestFingerprint === bundle.command.requestFingerprint ? "replayed" : Promise.reject(new Error("collision"));
      invitations.set(bundle.invitation.id, bundle.invitation);
      commands.set(bundle.command.id, bundle.command);
      if (bundle.acquisition) acquisitions.push(bundle.acquisition);
      return "created";
    },
    decideInvitation: async (bundle) => {
      const prior = commands.get(bundle.command.id);
      if (prior) return prior.requestFingerprint === bundle.command.requestFingerprint ? "replayed" : Promise.reject(new Error("collision"));
      invitations.set(bundle.invitation.id, bundle.invitation);
      commands.set(bundle.command.id, bundle.command);
      if (bundle.participation) participations.push(bundle.participation);
      return "created";
    },
    recordCommunicationResult: async () => { throw new Error("not used"); },
  };
  const acquisition = new AcquisitionContextService({
    contexts: { create: async () => {}, getById: async () => null, bind: async () => { throw new Error("not used"); }, resume: async () => { throw new Error("not used"); } },
    opportunities: { getByReference: async () => null },
    ids: { context: () => "unused-context", event: () => "unused-event" },
    secrets: { create: () => "unused-secret-value-with-32-characters", digest: (value) => (value === "external-secret-value-with-more-than-32-characters" ? "a" : "b").repeat(64) },
    now: () => NOW,
  });
  const service = new OpportunityTeamingService({
    authorization: authorization(),
    pursuits: {
      getProjection: async () => projection,
      getPublicationSnapshotByReference: async () => publication,
      listCapabilityClaims: async () => Object.freeze([]),
      getServiceGeographyIds: async () => Object.freeze(["county-51013"]),
      getPursuit: async () => pursuit,
      getFitSnapshot: async () => fit,
      recordFit: async () => "created",
      getCommand: async () => null,
      savePursuit: async () => { throw new Error("not used"); },
    },
    teaming: repository,
    profiles: { getByOrganizationId: async (id) => Object.freeze({ id, organizationId: id, displayName: id === "org-lead" ? "Lead Organization" : "Candidate Organization" }) },
    acquisition: { prepareTrusted: acquisition.prepareTrusted.bind(acquisition) },
    publicOrigin: "https://exchange.example.test",
    now: () => NOW,
    id: () => "fixture-id",
    secret: () => "external-secret-value-with-more-than-32-characters",
  });
  const scope = (actor, acquisitionContext = null) => Object.freeze({ context: context(actor.userId, actor.email), organizationId: actor.organizationId, userId: actor.userId, membershipId: actor.membershipId, acquisitionContext });
  return { service, scope, gap, fit, explanation, invitations, commands, participations, acquisitions, setPursuit: (value) => { pursuit = value; }, getPursuit: () => pursuit };
}

test("TEM-004 boundary and deterministic invitation identity remain nonbinding", () => {
  assert.match(TEAMING_BOUNDARY_COPY, /does not create a subcontract, joint venture, teaming agreement/i);
  assert.equal(TEAMING_BOUNDARY_VERSION, 1);
  assert.match(teamingBoundaryCopyDigest(), /^[a-f0-9]{64}$/);
  assert.equal(Object.keys(TEAMING_BOUNDARY_COPY_BY_LOCALE).length, 5);
  assert.equal(
    teamInvitationId({ leadOrganizationId: "org-lead", opportunityReference: "opp", gapReference: "gap", targetReference: "Target@Example.test", proposedCapacity: "capability-contributor" }),
    teamInvitationId({ leadOrganizationId: "org-lead", opportunityReference: "opp", gapReference: "gap", targetReference: "target@example.test", proposedCapacity: "capability-contributor" }),
  );
});

test("DSC-010/RSP-007/TEM-001 derive only a current team-coverable pursue gap", async () => {
  const f = fixture();
  const contextResult = await f.service.gapContext(f.scope(actors.lead), projection.reference, f.gap.reference);
  assert.equal(contextResult.capabilityLabel, "Exercise facilitation");
  assert.equal(contextResult.teamCoverageAllowed, true);
  assert.deepEqual(contextResult.geographyIds, ["county-51013"]);
  assert.match(f.service.resourceHref(contextResult), /^\/resources\?/);
  assert.match(f.service.resourceHref(contextResult), /rfxReference=opp_team_fixture/);

  f.setPursuit(Object.freeze({ ...f.getPursuit(), decision: "watch" }));
  await assert.rejects(f.service.gapContext(f.scope(actors.lead), projection.reference, f.gap.reference), (error) => error instanceof OpportunityTeamingError && error.code === "not-found");
  f.setPursuit(Object.freeze({ ...f.getPursuit(), decision: "pursue", gapAssessments: Object.freeze(f.getPursuit().gapAssessments.map((gap) => Object.freeze({ ...gap, status: "deferred" }))) }));
  await assert.rejects(f.service.gapContext(f.scope(actors.lead), projection.reference, f.gap.reference), (error) => error instanceof OpportunityTeamingError && error.code === "conflict");
});

test("TEM-002/003 create one organization invitation, replay exactly, and require target authority plus boundary acknowledgment", async () => {
  const f = fixture();
  const candidate = Object.freeze({ organizationId: "org-candidate", displayName: "Candidate Organization", matchedCapabilityNames: Object.freeze(["Exercise facilitation"]) });
  const input = Object.freeze({ commandId: "create-internal", reference: projection.reference, gapReference: f.gap.reference, proposedCapacity: "capability-contributor", responsibilitySummary: "Support the continuity exercise requirement.", candidate });
  const created = await f.service.createInvitation(f.scope(actors.lead), input);
  assert.equal(created.replayed, false);
  assert.equal(created.invitation.target.kind, "organization");
  assert.equal(created.invitation.status, "pending");
  assert.equal(created.invitation.acquisitionContextId, null);
  assert.doesNotMatch(JSON.stringify(created.view), /assessment|economics|command|evidence/i);
  const replay = await f.service.createInvitation(f.scope(actors.lead), input);
  assert.equal(replay.replayed, true);
  assert.equal(f.invitations.size, 1);
  await assert.rejects(f.service.review(f.scope(actors.other), created.invitation.id), (error) => error?.code === "not-found");
  const review = await f.service.review(f.scope(actors.invitee), created.invitation.id);
  assert.equal(review.role, "invitee");
  assert.equal(review.canDecide, true);
  await assert.rejects(f.service.decide(f.scope(actors.invitee), { commandId: "accept-without-boundary", invitationId: created.invitation.id, expectedVersion: 1, action: "accept" }), (error) => error?.code === "conflict");
  const accepted = await f.service.decide(f.scope(actors.invitee), { commandId: "accept-internal", invitationId: created.invitation.id, expectedVersion: 1, action: "accept", boundaryVersion: TEAMING_BOUNDARY_VERSION, boundaryLocale: "en-US" });
  assert.equal(accepted.view.status, "accepted");
  assert.equal(f.participations.length, 1);
  assert.equal(f.participations[0].participantOrganizationId, "org-candidate");
  assert.equal(f.participations[0].boundaryCopyDigest, teamingBoundaryCopyDigest());
  assert.equal(f.participations[0].boundaryLocale, "en-US");
  assert.equal("responseId" in f.participations[0], false);
});

test("ACQ-007 external context is atomic, email-bound, and never auto-accepts", async () => {
  const f = fixture();
  const created = await f.service.createInvitation(f.scope(actors.lead), {
    commandId: "create-external",
    reference: projection.reference,
    gapReference: f.gap.reference,
    proposedCapacity: "subject-matter-support",
    responsibilitySummary: "Review and support the exercise facilitation need.",
    recipientDisplayName: "Invitee",
    recipientEmail: "INVITEE@example.test",
  });
  assert.equal(created.invitation.target.kind, "external");
  assert.equal(created.invitation.target.recipientEmail, "invitee@example.test");
  assert.equal(created.invitation.status, "pending");
  assert.equal(f.acquisitions.length, 1);
  assert.equal(f.acquisitions[0].context.intent.kind, "team-invitation");
  assert.equal(f.acquisitions[0].context.intent.subjectReference, created.invitation.id);
  assert.match(String(created.invitation.communicationRequest.variables.continue_url), new RegExp(`/api/opportunities/team-invitations/acquire\\?invitation=${created.invitation.id}&token=`));

  const acquisitionContext = Object.freeze({ id: created.invitation.acquisitionContextId, kind: "team-invitation", subjectReference: created.invitation.id });
  await assert.rejects(f.service.review(f.scope(actors.other, acquisitionContext), created.invitation.id), (error) => error?.code === "not-found");
  const review = await f.service.review(f.scope(actors.invitee, acquisitionContext), created.invitation.id);
  assert.equal(review.status, "pending");
  const accepted = await f.service.decide(f.scope(actors.invitee, acquisitionContext), { commandId: "accept-external", invitationId: created.invitation.id, expectedVersion: 1, action: "accept", boundaryVersion: TEAMING_BOUNDARY_VERSION, boundaryLocale: "en-US" });
  assert.equal(accepted.view.status, "accepted");
  assert.equal(f.invitations.get(created.invitation.id).attachedOrganizationId, "org-candidate");
});

test("domain transition rejects self/issuer targets and cannot accept by token-like state alone", () => {
  const f = fixture();
  const contextValue = Object.freeze({ schemaVersion: 1, organizationId: "org-lead", leadOrganizationDisplayName: "Lead Organization", opportunityReference: projection.reference, opportunityTitle: payload.title, issuerOrganizationId: "org-issuer", issuerDisplayName: payload.issuerDisplayName, responseDeadline: "2026-09-18", pursuitId: f.getPursuit().id, pursuitVersion: 1, fitSnapshotId: f.fit.id, explanationInputDigest: f.explanation.inputDigest, gapReference: f.gap.reference, gapKind: f.gap.kind, gapTitle: f.gap.title, observationReference: f.gap.observationReference, requirementReference: "req-exercise", capabilityLabel: "Exercise facilitation", teamCoverageAllowed: true, geographyIds: Object.freeze(["county-51013"]), returnHref: `/opportunities/${projection.reference}/assess` });
  assert.throws(() => createTeamInvitation({ id: "self-invite", context: contextValue, target: { kind: "organization", organizationId: "org-lead", displayNameSnapshot: "Lead" }, proposedCapacity: "capability-contributor", responsibilitySummary: "Support requirement.", actorUserId: "user-lead", actorMembershipId: "membership-lead", now: NOW }), /cannot invite itself/i);
  const invitation = createTeamInvitation({ id: "external-invite", context: contextValue, target: { kind: "external", recipientEmail: "invitee@example.test", recipientDisplayName: "Invitee" }, proposedCapacity: "capability-contributor", responsibilitySummary: "Support requirement.", acquisitionContextId: "acq-1", communicationRequest: { id: "message-1", purpose: "transactional", recipient: { email: "invitee@example.test", displayName: "Invitee" }, eventKey: "rfx.team-invitation.sent", eventVersion: 1, templateKey: "rfx-team-invitation", templateVersion: 1, variables: {}, metadata: { correlationId: "c", idempotencyKey: "i", requestedAt: NOW, organizationId: "org-lead", userId: "user-lead", relatedObjectType: "rfx-team-invitation", relatedObjectId: "external-invite", tags: [] } }, actorUserId: "user-lead", actorMembershipId: "membership-lead", now: NOW });
  assert.throws(() => decideTeamInvitation({ current: invitation, expectedVersion: 1, action: "accept", actorOrganizationId: "org-other", actorUserId: "user-other", actorMembershipId: "membership-other", boundaryVersion: 1, now: NOW }), /authority is unavailable/i);
});
