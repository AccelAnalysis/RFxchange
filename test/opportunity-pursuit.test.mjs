import assert from "node:assert/strict";
import test from "node:test";

import { calculateOpportunityFit, normalizePursuitAssessment, opportunityCapabilityInputDigest, opportunityFitSnapshotId, opportunityPursuitId } from "../src/domain/rfx/pursuit.ts";

const NOW = "2026-08-12T12:00:00.000Z";
const projection = Object.freeze({
  schemaVersion: 1, reference: "opp_fit_fixture", audience: "authenticated-participants", aggregateVersion: 9,
  mode: "published", digest: "projection-digest", publishedAt: NOW, issuerOrganizationIndexKey: "org-issuer",
  requestFamilyIndexKey: "AMACS-REQ-000001", localityIndexKeys: Object.freeze(["us:county-51013"]), capabilityIndexKeys: Object.freeze(["AMACS-CAP-000001", "AMACS-CAP-000002"]),
  requirementIndex: Object.freeze([
    { ordinal: 0, requirementId: "req-1", capabilityId: "AMACS-CAP-000001", amacsReleaseVersion: "0.5.0", level: "required", satisfyingParty: "lead-organization", teamCoverageAllowed: false, evidenceRequired: true },
    { ordinal: 1, requirementId: "req-2", capabilityId: "AMACS-CAP-000002", amacsReleaseVersion: "0.5.0", level: "preferred", satisfyingParty: "any-accepted-team-member", teamCoverageAllowed: true, evidenceRequired: false },
  ]),
  payload: Object.freeze({
    title: "Continuity planning", summary: "Published summary", issuerDisplayName: "Issuer", requestFamilyLabel: "Request for Information", requestFamilyPurpose: "Gather information",
    timing: Object.freeze({ anticipatedStartDate: null, anticipatedCompletionDate: null, responseDeadline: "2026-09-12" }),
    localities: Object.freeze([{ id: "county-51013", label: "Arlington County, Virginia" }]), estimatedValue: Object.freeze({ mode: "not-disclosed" }), engagementTerm: Object.freeze({ mode: "fixed", duration: Object.freeze({ value: 3, unit: "months" }), note: null }),
    requestedOutputs: Object.freeze([]), foundationRequirements: Object.freeze([]), responseSections: Object.freeze([]), evaluation: Object.freeze({ methodLabel: null, weightingRequired: false, factors: Object.freeze([]) }),
    requirements: Object.freeze([
      { title: "Continuity planning", description: "Demonstrate continuity planning.", level: "required", requirementTypeLabel: "Capability", capabilityLabel: "Continuity planning", capabilityDefinition: "Plan continuity.", qualifiers: Object.freeze([]), evidence: Object.freeze(["Work sample"]) },
      { title: "Exercise facilitation", description: "Facilitate an exercise.", level: "preferred", requirementTypeLabel: "Capability", capabilityLabel: "Exercise facilitation", capabilityDefinition: "Facilitate exercises.", qualifiers: Object.freeze([]), evidence: Object.freeze([]) },
    ]),
  }),
});

function claim(overrides = {}) {
  return Object.freeze({ id: "claim-1", organizationId: "org-responder", capabilityId: "AMACS-CAP-000001", amacsReleaseVersion: "0.5.0", labelSnapshot: "Continuity planning", definitionSnapshot: "Plan continuity.", domainId: "domain", domainLabelSnapshot: "Operations", familyId: "family", familyLabelSnapshot: "Resilience", entityScope: "reporting_entity", marketRoleIds: Object.freeze([]), deliveryRoles: Object.freeze(["prime"]), serviceGeographyIds: Object.freeze(["county-51013"]), specialties: Object.freeze([]), capacity: null, evidenceIds: Object.freeze([]), assertionStatus: "self_reported", visibility: "network", source: Object.freeze({ kind: "manual" }), assertedByUserId: "user", assertedByMembershipId: "membership", createdAt: NOW, updatedAt: NOW, ...overrides });
}

test("RSP-001/002 requires exact confirmed AMACS alignment and explains gaps without a score", () => {
  const explanation = calculateOpportunityFit({ organizationId: "org-responder", projection, claims: [claim()], serviceGeographyIds: ["county-51013"], calculatedAt: NOW });
  assert.deepEqual(explanation.attribution, ["discovered", "potential-match"]);
  assert.deepEqual(explanation.requirementObservations.map((item) => item.state), ["aligned", "missing"]);
  assert.ok(explanation.gaps.some((item) => item.kind === "missing-capability"));
  assert.ok(explanation.gaps.some((item) => item.kind === "evidence-confirmation"));
  assert.equal(explanation.geographyObservation, "aligned");
  assert.doesNotMatch(JSON.stringify(explanation), /score|percent|qualified|award likelihood/i);
});

test("RSP-001 legacy, suspended, wrong-release, and nonmatching claims cannot create Potential Match", () => {
  for (const claims of [[claim({ source: { kind: "legacy_migration" } })], [claim({ assertionStatus: "suspended" })], [claim({ amacsReleaseVersion: "0.4.0" })], [claim({ capabilityId: "AMACS-CAP-999999" })]]) {
    const explanation = calculateOpportunityFit({ organizationId: "org-responder", projection, claims, serviceGeographyIds: [], calculatedAt: NOW });
    assert.deepEqual(explanation.attribution, ["discovered"]);
    assert.equal(explanation.requirementObservations.some((item) => item.state === "aligned"), false);
  }
});

test("RSP-003/004/006 identities, review normalization, and organization input digest are deterministic", () => {
  const digest = opportunityCapabilityInputDigest([claim()], ["county-51013", "county-51013"]);
  assert.equal(digest, opportunityCapabilityInputDigest([claim()], ["county-51013"]));
  assert.match(opportunityPursuitId("org-responder", projection.reference), /^opppursuit_[a-f0-9]{40}$/);
  assert.match(opportunityFitSnapshotId({ organizationId: "org-responder", reference: projection.reference, projectionVersion: 9, projectionDigest: projection.digest, capabilityInputDigest: digest }), /^oppfit_[a-f0-9]{40}$/);
  const assessment = normalizePursuitAssessment({ fit: { state: "acceptable", note: "  confirmed   by team " }, capacity: { state: "unsupported", note: "x" } });
  assert.deepEqual(assessment.fit, { state: "acceptable", note: "confirmed by team" });
  assert.equal(assessment.capacity.state, "not-reviewed");
});
