import assert from "node:assert/strict";
import test from "node:test";

import { OpportunityPursuitService } from "../src/application/rfx/opportunity-pursuit-service.ts";
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
  assert.deepEqual(explanation.publishedFacts.estimatedValue, projection.payload.estimatedValue);
  assert.deepEqual(explanation.publishedFacts.engagementTerm, projection.payload.engagementTerm);
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
  const assessment = normalizePursuitAssessment({ fit: { state: "acceptable", note: "  confirmed\n  by team " }, capacity: { state: "unsupported", note: "x" } });
  assert.deepEqual(assessment.fit, { state: "acceptable", note: "  confirmed\n  by team " });
  assert.equal(assessment.capacity.state, "not-reviewed");
});

test("RSP-001/002 read-only participants can inspect fit and legacy publications use immutable snapshot semantics", async () => {
  const context = Object.freeze({
    user: Object.freeze({ id: "user", name: "Reader", primaryEmail: "reader@example.test", login: Object.freeze({ provider: "firebase", subject: "firebase-reader" }), security: Object.freeze({ mfaEnabled: false, credentialVersion: 1 }), createdAt: NOW, updatedAt: NOW }),
    authentication: Object.freeze({ provider: "firebase", subject: "firebase-reader", authenticatedAt: NOW, issuedAt: NOW, expiresAt: "2026-08-12T13:00:00.000Z", source: "id-token" }),
  });
  const organization = Object.freeze({ id: "org-responder", createdAt: NOW, updatedAt: NOW });
  const membership = Object.freeze({ id: "membership", userId: "user", organizationId: "org-responder", status: "active", createdAt: NOW, updatedAt: NOW });
  const authorization = Object.freeze({ membershipId: "membership", userId: "user", organizationId: "org-responder", roleKey: "viewer", permissions: Object.freeze([]), createdAt: NOW, updatedAt: NOW });
  const fitSnapshots = [];
  const legacyProjection = Object.freeze({ ...projection, issuerOrganizationIndexKey: undefined, requirementIndex: undefined });
  const service = new OpportunityPursuitService({
    now: () => NOW,
    authorization: {
      accountSecurity: { inspect: async () => Object.freeze({ provider: "firebase", subject: "firebase-reader", email: "reader@example.test", emailVerified: true, disabled: false, mfaEnrolled: false, tokensValidAfter: "2026-08-12T11:00:00.000Z", lastSignInAt: NOW }) },
      organizations: { getById: async () => organization },
      memberships: { getById: async () => membership },
      authorizations: { getByMembershipId: async () => authorization },
      restrictions: { getForOrganization: async () => null, getForMembership: async () => null },
    },
    repository: {
      getProjection: async () => legacyProjection,
      getPublicationSnapshotByReference: async () => Object.freeze({
        reference: projection.reference,
        aggregateVersion: projection.aggregateVersion,
        projectionDigest: projection.digest,
        aggregate: Object.freeze({
          issuerOrganizationId: "org-issuer",
          version: projection.aggregateVersion,
          lifecycleState: "published",
          definition: Object.freeze({
            requirements: Object.freeze(projection.requirementIndex.map((item, ordinal) => Object.freeze({
              id: item.requirementId,
              capability: Object.freeze({ id: item.capabilityId, amacsReleaseVersion: item.amacsReleaseVersion }),
              level: item.level,
              satisfyingParty: item.satisfyingParty,
              teamCoverageAllowed: item.teamCoverageAllowed,
              evidenceRequirementIds: ordinal === 0 ? Object.freeze(["evidence-1"]) : Object.freeze([]),
            }))),
          }),
        }),
      }),
      listCapabilityClaims: async () => Object.freeze([claim()]),
      getServiceGeographyIds: async () => Object.freeze(["county-51013"]),
      getPursuit: async () => null,
      getFitSnapshot: async () => null,
      recordFit: async (snapshot) => { fitSnapshots.push(snapshot); return "created"; },
      getCommand: async () => null,
      savePursuit: async () => { throw new Error("read-only test must not save pursuit"); },
    },
  });
  const workspace = await service.workspace({ context, organizationId: "org-responder", userId: "user", membershipId: "membership" }, projection.reference);
  assert.equal(workspace.canManage, false);
  assert.deepEqual(workspace.explanation.attribution, ["discovered", "potential-match"]);
  assert.equal(fitSnapshots.length, 1);
  assert.equal(fitSnapshots[0].explanation.opportunityProjectionDigest, projection.digest);
});

test("RSP-004 exact command replay returns the originally committed pursuit version", async () => {
  const context = Object.freeze({
    user: Object.freeze({ id: "user", name: "Manager", primaryEmail: "manager@example.test", login: Object.freeze({ provider: "firebase", subject: "firebase-manager" }), security: Object.freeze({ mfaEnabled: false, credentialVersion: 1 }), createdAt: NOW, updatedAt: NOW }),
    authentication: Object.freeze({ provider: "firebase", subject: "firebase-manager", authenticatedAt: NOW, issuedAt: NOW, expiresAt: "2026-08-12T13:00:00.000Z", source: "id-token" }),
  });
  const organization = Object.freeze({ id: "org-responder", createdAt: NOW, updatedAt: NOW });
  const membership = Object.freeze({ id: "membership", userId: "user", organizationId: "org-responder", status: "active", createdAt: NOW, updatedAt: NOW });
  const authorization = Object.freeze({ membershipId: "membership", userId: "user", organizationId: "org-responder", roleKey: "response-manager", permissions: Object.freeze(["response.create"]), createdAt: NOW, updatedAt: NOW });
  let committedCommand = null;
  let currentPursuit = null;
  const service = new OpportunityPursuitService({
    now: () => NOW,
    authorization: {
      accountSecurity: { inspect: async () => Object.freeze({ provider: "firebase", subject: "firebase-manager", email: "manager@example.test", emailVerified: true, disabled: false, mfaEnrolled: false, tokensValidAfter: "2026-08-12T11:00:00.000Z", lastSignInAt: NOW }) },
      organizations: { getById: async () => organization },
      memberships: { getById: async () => membership },
      authorizations: { getByMembershipId: async () => authorization },
      restrictions: { getForOrganization: async () => null, getForMembership: async () => null },
    },
    repository: {
      getProjection: async () => projection,
      getPublicationSnapshotByReference: async () => null,
      listCapabilityClaims: async () => Object.freeze([claim()]),
      getServiceGeographyIds: async () => Object.freeze(["county-51013"]),
      getPursuit: async () => currentPursuit,
      getFitSnapshot: async () => null,
      recordFit: async () => "created",
      getCommand: async () => committedCommand,
      savePursuit: async (bundle) => {
        committedCommand = bundle.command;
        currentPursuit = bundle.record;
        return "created";
      },
    },
  });
  const scope = Object.freeze({ context, organizationId: "org-responder", userId: "user", membershipId: "membership" });
  const explained = await service.explain(scope, projection.reference);
  const input = Object.freeze({ commandId: "command-replay", reference: projection.reference, expectedVersion: null, expectedFitSnapshotId: explained.fitSnapshotId, decision: "pursue", assessment: Object.freeze({ fit: Object.freeze({ state: "acceptable", note: "Reviewed\nverbatim" }) }) });
  const first = await service.save(scope, input);
  assert.equal(first.replayed, false);
  assert.equal(first.pursuit.version, 1);
  currentPursuit = Object.freeze({ ...first.pursuit, decision: "decline", version: 2, updatedAt: "2026-08-12T12:01:00.000Z" });
  const replay = await service.save(scope, input);
  assert.equal(replay.replayed, true);
  assert.equal(replay.pursuit.version, 1);
  assert.equal(replay.pursuit.decision, "pursue");
  assert.equal(replay.pursuit.assessment.fit.note, "Reviewed\nverbatim");
});

test("RSP-003 revalidates current account authority at the pursuit commit boundary", async () => {
  const context = Object.freeze({
    user: Object.freeze({ id: "user", name: "Manager", primaryEmail: "manager@example.test", login: Object.freeze({ provider: "firebase", subject: "firebase-manager" }), security: Object.freeze({ mfaEnabled: false, credentialVersion: 1 }), createdAt: NOW, updatedAt: NOW }),
    authentication: Object.freeze({ provider: "firebase", subject: "firebase-manager", authenticatedAt: NOW, issuedAt: NOW, expiresAt: "2026-08-12T13:00:00.000Z", source: "id-token" }),
  });
  const organization = Object.freeze({ id: "org-responder", createdAt: NOW, updatedAt: NOW });
  const membership = Object.freeze({ id: "membership", userId: "user", organizationId: "org-responder", status: "active", createdAt: NOW, updatedAt: NOW });
  const authorization = Object.freeze({ membershipId: "membership", userId: "user", organizationId: "org-responder", roleKey: "response-manager", permissions: Object.freeze(["response.create"]), createdAt: NOW, updatedAt: NOW });
  let accountInspections = 0;
  let persistenceAttempted = false;
  const service = new OpportunityPursuitService({
    now: () => NOW,
    authorization: {
      accountSecurity: { inspect: async () => {
        accountInspections += 1;
        return Object.freeze({ provider: "firebase", subject: "firebase-manager", email: "manager@example.test", emailVerified: true, disabled: accountInspections > 1, mfaEnrolled: false, tokensValidAfter: "2026-08-12T11:00:00.000Z", lastSignInAt: NOW });
      } },
      organizations: { getById: async () => organization },
      memberships: { getById: async () => membership },
      authorizations: { getByMembershipId: async () => authorization },
      restrictions: { getForOrganization: async () => null, getForMembership: async () => null },
    },
    repository: {
      getProjection: async () => projection,
      getPublicationSnapshotByReference: async () => null,
      listCapabilityClaims: async () => Object.freeze([claim()]),
      getServiceGeographyIds: async () => Object.freeze(["county-51013"]),
      getPursuit: async () => null,
      getFitSnapshot: async () => null,
      recordFit: async () => "created",
      getCommand: async () => null,
      savePursuit: async () => { persistenceAttempted = true; return "created"; },
    },
  });
  const scope = Object.freeze({ context, organizationId: "org-responder", userId: "user", membershipId: "membership" });
  const explained = await service.explain(scope, projection.reference);
  accountInspections = 0;
  await assert.rejects(
    service.save(scope, { commandId: "command-authority-race", reference: projection.reference, expectedVersion: null, expectedFitSnapshotId: explained.fitSnapshotId, decision: "pursue", assessment: {} }),
    (error) => error?.code === "forbidden",
  );
  assert.equal(accountInspections, 2);
  assert.equal(persistenceAttempted, false);
});
