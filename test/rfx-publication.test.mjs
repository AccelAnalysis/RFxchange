import assert from "node:assert/strict";
import test from "node:test";

import { evaluateRfxCapability } from "../src/application/rfx/rfx-capability-policy.ts";
import {
  evaluatePublicationReadiness,
  projectResponderOpportunity,
  publishedAggregate,
  rfxPublicationReference,
  rfxPublicationSnapshotId,
} from "../src/domain/rfx/publication.ts";

const NOW = "2026-08-12T12:00:00.000Z";
const locality = Object.freeze({
  id: "county-51013",
  label: "Arlington County, Virginia",
  indexKey: "us:county-51013",
  authorityUpdatedAt: NOW,
});

function aggregate(overrides = {}) {
  return Object.freeze({
    id: "rfx_publication_fixture",
    schemaVersion: 1,
    issuerOrganizationId: "org-issuer",
    lifecycleState: "draft",
    version: 7,
    requestFamily: Object.freeze({
      amacsReleaseVersion: "0.5.0",
      amacsSourceCommit: "da7879f2609271b067ae6d02875e9388a02c4fe5",
      requestFamilyId: "AMACS-REQ-000001",
      labelSnapshot: "Request for Information",
      purposeSnapshot: "Gather governed market information.",
      lifecycleSnapshot: Object.freeze(["draft", "published"]),
      defaultEndpointSnapshot: "information_reviewed",
      supportsAwardSnapshot: false,
      defaultResponseTemplateIdSnapshot: "AMACS-RSPT-000001",
      defaultDecisionTemplateIdSnapshot: "AMACS-DECT-000001",
      defaultGovernanceProfileIdSnapshot: "AMACS-GOV-000001",
      allowedGovernanceProfileIdsSnapshot: Object.freeze(["AMACS-GOV-000001"]),
      recommendedRequirementBundleIdsSnapshot: Object.freeze(["AMACS-RBND-000001"]),
      selectedAt: NOW,
    }),
    package: Object.freeze({
      schemaVersion: 1,
      title: "Continuity planning partner search",
      marketNeed: Object.freeze({
        sourceStatement: "We need continuity planning support.",
        observedCondition: "Continuity plans require renewal.",
        desiredOutcome: "A tested operating plan is in place.",
        affectedContext: "Regional operations",
        successMeasures: Object.freeze(["Plan tested"]),
        knownFacts: Object.freeze([]),
        assumptions: Object.freeze([]),
        constraints: Object.freeze([]),
        solutionPosture: "solution-open",
        proposedApproaches: Object.freeze([]),
        prohibitedApproaches: Object.freeze([]),
        unresolvedQuestions: Object.freeze([]),
        interpretationRecordIds: Object.freeze(["private-interpretation"]),
      }),
      scope: "Develop and test a continuity plan.",
      requestedOutputs: Object.freeze([{ id: "output-1", title: "Continuity plan", description: "Tested plan", quantity: null, dueDate: "2026-10-15" }]),
      timing: Object.freeze({ anticipatedStartDate: "2026-09-15", anticipatedCompletionDate: "2026-11-15", responseDeadline: "2026-09-01" }),
      performanceLocation: Object.freeze({
        mode: "exact-address",
        normalizedAddress: "1101 Wilson Blvd, Arlington, VA 22209",
        localityId: locality.id,
        point: Object.freeze({ longitude: -77.09, latitude: 38.88 }),
        geocodeProvenance: Object.freeze({ provider: "private-provider", providerReference: "private-ref", benchmark: "private-benchmark", retrievedAt: NOW }),
      }),
      estimatedValue: Object.freeze({ mode: "not-disclosed" }),
      engagementTerm: Object.freeze({ mode: "fixed", duration: Object.freeze({ value: 3, unit: "months" }), note: null }),
      requirements: Object.freeze([{ id: "foundation-1", kind: "evidence", title: "Work sample", description: "Provide a relevant sample.", mandatory: true, quantity: null, dueDate: null, evidenceDescription: "Redacted work sample" }]),
      moduleStatus: Object.freeze({ need: "complete", "scope-outputs": "complete", timing: "complete", "performance-location": "complete", "value-term": "complete", requirements: "complete" }),
    }),
    definition: Object.freeze({
      schemaVersion: 1,
      requirements: Object.freeze([{ id: "requirement-1", requirementType: Object.freeze({ kind: "requirement-type", id: "AMACS-RTYP-000001", labelSnapshot: "Capability requirement", definitionSnapshot: "A governed capability requirement.", amacsReleaseVersion: "0.5.0", amacsSourceCommit: "da7879f2609271b067ae6d02875e9388a02c4fe5" }), requirementTypeCode: "CAPABILITY", allowedDecisionTreatments: Object.freeze(["scored_only"]), teamCoverageAllowed: true, capability: Object.freeze({ kind: "capability", id: "AMACS-CAP-000001", labelSnapshot: "Continuity planning", definitionSnapshot: "Plan operating continuity.", amacsReleaseVersion: "0.5.0", amacsSourceCommit: "da7879f2609271b067ae6d02875e9388a02c4fe5" }), capabilityBreadcrumb: "Operations / Resilience / Continuity planning", title: "Continuity planning", description: "Demonstrate continuity planning capability.", level: "required", decisionTreatment: "scored_only", satisfyingParty: "lead-organization", qualifiers: Object.freeze([{ kind: "boolean", label: "Available", requiredValue: true }]), evidenceRequirementIds: Object.freeze([]), linkedFoundationRequirementIds: Object.freeze(["foundation-1"]), linkedResponseSectionIds: Object.freeze(["section-1"]), linkedEvaluationFactorIds: Object.freeze(["factor-1"]) }]),
      responseStructure: Object.freeze({ sourceTemplate: null, sections: Object.freeze([{ id: "section-1", sourceSection: null, title: "Technical response", instructions: "Explain the approach.", format: "narrative", required: true, order: 1, characterLimit: 4000, itemLimit: null, attachmentsAllowed: false, linkedRequirementIds: Object.freeze(["requirement-1"]) }]) }),
      evaluationDefinition: Object.freeze({ sourceTemplate: null, weightingRequired: true, factors: Object.freeze([{ id: "factor-1", sourceFactor: null, sourceMethod: "scored", title: "Approach", description: "Compare the proposed approach.", treatment: "scored-factor", weightBasisPoints: 10000, order: 1, linkedRequirementIds: Object.freeze(["requirement-1"]), linkedResponseSectionIds: Object.freeze(["section-1"]), linkedEvidenceRequirementIds: Object.freeze([]) }]) }),
      interpretationRecordIds: Object.freeze(["private-definition-interpretation"]),
      moduleStatus: Object.freeze({ requirements: "complete", responseStructure: "complete", evaluationDefinition: "complete" }),
    }),
    creationSource: Object.freeze({ kind: "blank", schemaVersion: 1 }),
    createdByUserId: "private-user",
    createdByMembershipId: "private-membership",
    updatedByUserId: "private-user",
    updatedByMembershipId: "private-membership",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });
}

test("ISS-016 computes deterministic requirement-aware readiness without qualification claims", () => {
  const result = evaluatePublicationReadiness({ aggregate: aggregate(), audience: "public", evaluatedAt: NOW, localities: [locality], publishAuthorized: true, issuerDisplayNameAvailable: true });
  assert.equal(result.status, "ready");
  assert.deepEqual(result.requirementStatus, [{ requirementId: "requirement-1", status: "ready", findingCodes: [] }]);
  assert.doesNotMatch(JSON.stringify(result), /qualified|matched|satisfies/i);

  const incomplete = aggregate({
    definition: Object.freeze({ ...aggregate().definition, evaluationDefinition: Object.freeze({ ...aggregate().definition.evaluationDefinition, factors: Object.freeze([{ ...aggregate().definition.evaluationDefinition.factors[0], weightBasisPoints: 9999 }]) }) }),
  });
  const blocked = evaluatePublicationReadiness({ aggregate: incomplete, audience: "public", evaluatedAt: NOW, localities: [locality], publishAuthorized: true, issuerDisplayNameAvailable: true });
  assert.equal(blocked.status, "blocked");
  assert.ok(blocked.findings.some((item) => item.code === "evaluation.weights-not-10000" && item.workspaceTarget === "#rfx-definition-evaluationDefinition"));

  const sourceDefinition = aggregate().definition;
  const disconnected = aggregate({
    definition: Object.freeze({
      ...sourceDefinition,
      requirements: Object.freeze([{
        ...sourceDefinition.requirements[0],
        evidenceRequirementIds: Object.freeze([]),
        linkedFoundationRequirementIds: Object.freeze([]),
        linkedResponseSectionIds: Object.freeze([]),
      }]),
      evaluationDefinition: Object.freeze({
        ...sourceDefinition.evaluationDefinition,
        factors: Object.freeze([{
          ...sourceDefinition.evaluationDefinition.factors[0],
          treatment: "required-condition",
        }]),
      }),
    }),
  });
  const disconnectedResult = evaluatePublicationReadiness({ aggregate: disconnected, audience: "public", evaluatedAt: NOW, localities: [locality], publishAuthorized: true, issuerDisplayNameAvailable: true });
  assert.equal(disconnectedResult.status, "blocked");
  assert.deepEqual(disconnectedResult.requirementStatus[0].findingCodes, [
    "requirement.response-link-missing",
    "requirement.evaluation-link-missing",
  ]);
});

test("ISS-018 uses one minimized projector with exact preview/publication payload parity", () => {
  const draft = aggregate();
  const reference = rfxPublicationReference(draft.id);
  const preview = projectResponderOpportunity({ aggregate: draft, issuerDisplayName: "Issuer Organization", localities: [locality], audience: "public", reference, mode: "preview" });
  const committed = publishedAggregate(draft, { userId: "private-user", membershipId: "private-membership" }, NOW);
  const published = projectResponderOpportunity({ aggregate: committed, issuerDisplayName: "Issuer Organization", localities: [locality], audience: "public", reference, mode: "published", publishedAt: NOW });
  assert.equal(preview.digest, published.digest);
  assert.deepEqual(preview.payload, published.payload);
  assert.equal(preview.aggregateVersion, 7);
  assert.equal(published.aggregateVersion, 8);
  assert.equal("rfxId" in published, false);
  const visible = JSON.stringify(published.payload);
  assert.doesNotMatch(visible, /1101 Wilson|private-user|private-membership|private-provider|private-interpretation|longitude|latitude|geocode/i);
  assert.match(visible, /Arlington County/);
  assert.match(visible, /Continuity planning/);
});

test("ISS-019 lifecycle and share identities are one-way, opaque, and stable", () => {
  const draft = aggregate();
  const committed = publishedAggregate(draft, { userId: "user-issuer", membershipId: "membership-issuer" }, NOW);
  assert.equal(committed.lifecycleState, "published");
  assert.equal(committed.version, draft.version + 1);
  assert.throws(() => publishedAggregate(committed, { userId: "user-issuer", membershipId: "membership-issuer" }, NOW), /Only a draft/);
  assert.match(rfxPublicationReference(draft.id), /^opp_[a-f0-9]{40}$/);
  assert.equal(rfxPublicationReference(draft.id), rfxPublicationReference(draft.id));
  assert.match(rfxPublicationSnapshotId(draft.id), /^rfxpublication_[a-f0-9]{40}$/);
});

test("ISS-020 basic issuance is free while unknown advanced capability fails closed", () => {
  assert.deepEqual(evaluateRfxCapability("basic-issuance"), { allowed: true, authority: "free-participation-policy" });
  assert.deepEqual(evaluateRfxCapability("advanced:issuance-tools"), { allowed: false, authority: "unavailable" });
});