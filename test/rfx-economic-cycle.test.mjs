import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createRfxResponseSectionAssignment,
  revokeRfxResponseSectionAssignment,
} from "../src/domain/rfx/collaboration.ts";
import {
  createRfxAddendum,
  createRfxResponse,
  createSelectedOutcome,
  decideRfxEvaluation,
  responseReadiness,
  submitRfxResponse,
  updateRfxOutcome,
  updateRfxResponse,
  upsertRfxEvaluationReview,
} from "../src/domain/rfx/cycle.ts";
import { STORED_ASSET_POLICIES } from "../src/domain/storage/model.ts";

const NOW = "2026-08-25T10:00:00.000Z";
const snapshot = Object.freeze({
  schemaVersion: 1,
  id: "publication-fixture",
  rfxId: "rfx-fixture",
  issuerOrganizationId: "org-issuer",
  reference: "opp-rfx-cycle-fixture",
  aggregateVersion: 7,
  projectionDigest: "a".repeat(64),
  aggregate: Object.freeze({
    lifecycleState: "published",
    definition: Object.freeze({
      responseStructure: Object.freeze({
        sections: Object.freeze([
          Object.freeze({ id: "section-narrative", order: 1, title: "Approach", instructions: "Describe the approach.", format: "narrative", required: true, characterLimit: 2000, itemLimit: null, attachmentsAllowed: true, linkedRequirementIds: Object.freeze(["req-1"]) }),
          Object.freeze({ id: "section-ack", order: 2, title: "Acknowledgment", instructions: "Acknowledge the conditions.", format: "acknowledgment", required: true, characterLimit: null, itemLimit: null, attachmentsAllowed: false, linkedRequirementIds: Object.freeze([]) }),
          Object.freeze({ id: "section-attachment", order: 3, title: "Supporting file", instructions: "Attach supporting material.", format: "attachment", required: false, characterLimit: null, itemLimit: 3, attachmentsAllowed: true, linkedRequirementIds: Object.freeze([]) }),
        ]),
      }),
      evaluationDefinition: Object.freeze({
        factors: Object.freeze([
          Object.freeze({ id: "factor-technical", order: 1, title: "Technical fit", description: "Evaluate technical fit.", treatment: "required-and-scored", weightBasisPoints: 10000 }),
        ]),
      }),
    }),
  }),
});

function update(response, item, acknowledgedAddendumIds) {
  return updateRfxResponse({
    current: response,
    expectedVersion: response.version,
    item,
    acknowledgedAddendumIds,
    actorUserId: "user-responder",
    actorMembershipId: "membership-responder",
    now: new Date(Date.parse(response.updatedAt) + 1000).toISOString(),
  });
}

function draftResponse() {
  return createRfxResponse({
    snapshot,
    responderOrganizationId: "org-responder",
    collaboratorOrganizationIds: ["org-teammate"],
    actorUserId: "user-responder",
    actorMembershipId: "membership-responder",
    now: NOW,
  });
}

test("RSP-009/RSP-010/RSP-017 response workspace derives stable items and readiness", () => {
  let response = draftResponse();
  const addendum = createRfxAddendum({
    id: "addendum-fixture",
    snapshot,
    title: "Clarification 1",
    body: "Acknowledge the revised delivery note.",
    requiresAcknowledgment: true,
    actorUserId: "user-issuer",
    actorMembershipId: "membership-issuer",
    now: NOW,
  });

  assert.deepEqual(response.items.map((item) => item.sectionId), ["section-narrative", "section-ack", "section-attachment"]);
  assert.deepEqual(response.collaboratorOrganizationIds, ["org-teammate"]);
  assert.equal(responseReadiness(response, [addendum]).status, "blocked");

  response = update(response, { sectionId: "section-narrative", text: "We will deliver the work in three governed phases.", attachmentAssetIds: [] });
  response = update(response, { sectionId: "section-ack", acknowledged: true });
  response = update(response, { sectionId: "section-narrative", text: "We will deliver the work in three governed phases.", attachmentAssetIds: [] }, [addendum.id]);
  const readiness = responseReadiness(response, [addendum]);
  assert.equal(readiness.status, "ready");
  assert.equal(readiness.completedRequiredCount, readiness.requiredCount);
});

test("external teammates receive response authority only through an explicit section assignment", () => {
  const response = draftResponse();
  const participation = Object.freeze({
    schemaVersion: 1,
    id: "participation-fixture",
    invitationId: "invitation-fixture",
    opportunityReference: snapshot.reference,
    leadOrganizationId: "org-responder",
    participantOrganizationId: "org-teammate",
    proposedCapacity: "capability-contributor",
    capabilityLabelSnapshot: "Systems integration",
    boundaryVersion: 1,
    boundaryCopyDigest: "b".repeat(64),
    boundaryLocale: "en-US",
    acceptedByUserId: "user-teammate",
    acceptedByMembershipId: "membership-teammate",
    acceptedAt: NOW,
  });

  const assignment = createRfxResponseSectionAssignment({
    response,
    participation,
    sectionId: "section-narrative",
    responsibilitySummary: "Draft the systems integration approach.",
    actorUserId: "user-responder",
    actorMembershipId: "membership-responder",
    now: NOW,
  });
  assert.equal(assignment.leadOrganizationId, "org-responder");
  assert.equal(assignment.participantOrganizationId, "org-teammate");
  assert.equal(assignment.sectionId, "section-narrative");
  assert.equal(assignment.status, "active");

  assert.throws(() => createRfxResponseSectionAssignment({
    response,
    participation: { ...participation, leadOrganizationId: "org-other" },
    sectionId: "section-narrative",
    responsibilitySummary: "Attempt cross-tenant edit.",
    actorUserId: "user-responder",
    actorMembershipId: "membership-responder",
    now: NOW,
  }), /does not belong to this response/i);

  const revoked = revokeRfxResponseSectionAssignment({
    current: assignment,
    expectedVersion: assignment.version,
    actorUserId: "user-responder",
    actorMembershipId: "membership-responder",
    now: "2026-08-25T10:01:00.000Z",
  });
  assert.equal(revoked.status, "revoked");
  assert.equal(revoked.version, 2);
});

test("RSP-018/RSP-019/RSP-020/RSP-021 hosted submission locks response and emits an immutable receipt", () => {
  let response = createRfxResponse({ snapshot, responderOrganizationId: "org-responder", actorUserId: "user-responder", actorMembershipId: "membership-responder", now: NOW });
  const addendum = createRfxAddendum({ id: "addendum-fixture", snapshot, title: "Clarification 1", body: "Acknowledge this clarification.", requiresAcknowledgment: true, actorUserId: "user-issuer", actorMembershipId: "membership-issuer", now: NOW });
  response = update(response, { sectionId: "section-narrative", text: "Complete response.", attachmentAssetIds: [] });
  response = update(response, { sectionId: "section-ack", acknowledged: true });
  response = update(response, { sectionId: "section-narrative", text: "Complete response.", attachmentAssetIds: [] }, [addendum.id]);
  const submitted = submitRfxResponse({ current: response, expectedVersion: response.version, readiness: responseReadiness(response, [addendum]), actorUserId: "user-responder", actorMembershipId: "membership-responder", now: "2026-08-25T10:05:00.000Z" });
  assert.equal(submitted.response.status, "submitted");
  assert.equal(submitted.response.submissionReceiptId, submitted.receipt.id);
  assert.equal(submitted.receipt.responseVersion, submitted.response.version);
  assert.match(submitted.receipt.responseDigest, /^[a-f0-9]{64}$/);
  assert.throws(() => update(submitted.response, { sectionId: "section-narrative", text: "late edit" }), /changed before this save/i);
});

test("evaluation consensus, selection, execution, outcome, and intelligence handoff stay one canonical chain", () => {
  let response = createRfxResponse({ snapshot, responderOrganizationId: "org-responder", actorUserId: "user-responder", actorMembershipId: "membership-responder", now: NOW });
  response = update(response, { sectionId: "section-narrative", text: "Complete response.", attachmentAssetIds: [] });
  response = update(response, { sectionId: "section-ack", acknowledged: true });
  const submitted = submitRfxResponse({ current: response, expectedVersion: response.version, readiness: responseReadiness(response, []), actorUserId: "user-responder", actorMembershipId: "membership-responder", now: "2026-08-25T10:05:00.000Z" }).response;

  let evaluation = upsertRfxEvaluationReview({
    current: null,
    response: submitted,
    snapshot,
    factorInputs: [{ factorId: "factor-technical", gate: "pass", scoreBasisPoints: 8000, note: "Meets the requirement." }],
    overallNote: "Strong response.",
    actorUserId: "user-evaluator-1",
    actorMembershipId: "membership-evaluator-1",
    now: "2026-08-25T10:10:00.000Z",
  });
  evaluation = upsertRfxEvaluationReview({
    current: evaluation,
    response: submitted,
    snapshot,
    factorInputs: [{ factorId: "factor-technical", gate: "pass", scoreBasisPoints: 9000, note: "Clear delivery approach." }],
    overallNote: "Recommended.",
    actorUserId: "user-evaluator-2",
    actorMembershipId: "membership-evaluator-2",
    now: "2026-08-25T10:11:00.000Z",
  });
  assert.equal(evaluation.consensus[0].gate, "pass");
  assert.equal(evaluation.consensus[0].averageScoreBasisPoints, 8500);
  assert.equal(evaluation.consensus[0].reviewCount, 2);

  evaluation = decideRfxEvaluation({ current: evaluation, expectedVersion: evaluation.version, decision: "selected", consensusNote: "Best evaluated response.", connectionNote: "Connect issuer and responder leads for kickoff.", actorUserId: "user-evaluator-1", actorMembershipId: "membership-evaluator-1", now: "2026-08-25T10:12:00.000Z" });
  assert.equal(evaluation.decision, "selected");

  let outcome = createSelectedOutcome({ evaluation, actorUserId: "user-evaluator-1", actorMembershipId: "membership-evaluator-1", now: evaluation.updatedAt });
  assert.equal(outcome.status, "connected");
  outcome = updateRfxOutcome({ current: outcome, expectedVersion: outcome.version, status: "executing", executionNote: "Kickoff completed.", outcomeSummary: "", outcomeValue: "", actorUserId: "user-evaluator-1", actorMembershipId: "membership-evaluator-1", now: "2026-08-25T10:13:00.000Z" });
  outcome = updateRfxOutcome({ current: outcome, expectedVersion: outcome.version, status: "completed", executionNote: "Delivery complete.", outcomeSummary: "Issuer accepted final delivery.", outcomeValue: "Successful completion", actorUserId: "user-evaluator-1", actorMembershipId: "membership-evaluator-1", now: "2026-08-25T10:14:00.000Z" });
  assert.equal(outcome.status, "completed");
  assert.equal(outcome.completedAt, "2026-08-25T10:14:00.000Z");
});

test("response attachments are first-class private responder assets", () => {
  const policy = STORED_ASSET_POLICIES["rfx-response-attachment"];
  assert.equal(policy.organizationPermission, "response.create");
  assert.equal(policy.sensitivity, "standard");
  assert.ok(policy.permittedContentTypes.includes("image/jpeg"));
  assert.ok(policy.permittedContentTypes.includes("application/pdf"));
});

test("live RFx actions no longer hard-code Create RFx unavailable and Pursue exposes Respond", async () => {
  const discovery = await readFile(new URL("../src/components/rfx/OpportunityDiscoveryWorkspace.tsx", import.meta.url), "utf8");
  const assessment = await readFile(new URL("../src/components/rfx/OpportunityAssessmentWorkspace.tsx", import.meta.url), "utf8");
  const inbox = await readFile(new URL("../src/components/rfx/OpportunityTeamInvitationInbox.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(discovery, /rfxCreate:\s*false/);
  assert.match(discovery, /rfxCreate:\s*rfxCreateAuthorized/);
  assert.match(assessment, /data-opportunity-respond/);
  assert.match(assessment, /\/respond\?returnTo=/);
  assert.match(inbox, /data-rfx-collaboration-entry/);
  assert.match(inbox, /\/collaborate\?lead=/);
});
