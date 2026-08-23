import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createProviderCanonicalComparison,
  createProviderPromotionApproval,
  createProviderPromotionCommand,
  createProviderPromotionEvent,
  createProviderSeedPromotionCandidate,
} from "../src/domain/provider-seeding/promotion.ts";

const now = "2026-08-23T23:30:00.000Z";

function candidate(overrides = {}) {
  return createProviderSeedPromotionCandidate({
    marketKey: "hampton-roads-va",
    seedKey: "provider-001",
    displayName: "Hampton Roads Business Center",
    providerClass: "community-institutional",
    participationPolicy: "free-standard",
    providerType: "business-support",
    resourceCategory: "technical-assistance",
    serviceName: "Business counseling",
    website: "https://example.org/",
    aliases: ["HR Business Center"],
    primarySourceId: "source-001",
    disposition: "ready_for_canonical_comparison",
    acceptedLocationKey: "location-001",
    acceptedPointFingerprint: "-76.3420000,37.0290000",
    geographyEnrichmentStatus: "ready_for_profile_materialization",
    geographyProfileFingerprint: "sha256:geography-profile-001",
    sourcePlanFingerprint: "sha256:provider-plan-001",
    sourceRecordFingerprint: "sha256:provider-record-001",
    donorRepository: "AccelAnalysis/TestRFx",
    donorCommit: "db19a0cc2171d0ddde4f34a20acc881ba7279248",
    preparedAt: now,
    ...overrides,
  });
}

function newComparison(value = candidate()) {
  return createProviderCanonicalComparison({
    id: "comparison-provider-001-v1",
    candidate: value,
    canonicalSearchFingerprint: "sha256:canonical-search-001",
    matches: [],
    outcome: "create-new-organization",
    rationale: "No canonical Organization matched the authoritative source, domain, address, name, or aliases.",
    comparisonFingerprint: "sha256:comparison-001",
    reviewedByAdministratorId: "admin-001",
    authorityContextId: "authority-context-001",
    reviewedAt: now,
  });
}

function newApproval(value = candidate(), comparison = newComparison(value)) {
  return createProviderPromotionApproval({
    id: "approval-provider-001-v1",
    candidate: value,
    comparison,
    decision: "approve-new-organization",
    targetOrganizationId: "seeded-org-provider-001",
    candidateRecordFingerprint: value.sourceRecordFingerprint,
    geographyProfileFingerprint: value.geographyProfileFingerprint,
    comparisonFingerprint: comparison.comparisonFingerprint,
    rationale: "Create an unclaimed canonical Organization and draft Resource for approved market seeding.",
    approvedByAdministratorId: "admin-001",
    authorityContextId: "authority-context-001",
    approvedAt: now,
  });
}

test("accepted provider candidates require complete geography enrichment before comparison", () => {
  assert.throws(
    () => candidate({ geographyEnrichmentStatus: "needs_geography_resolution", geographyProfileFingerprint: null }),
    /require completed geography enrichment/,
  );
  assert.throws(
    () =>
      candidate({
        disposition: "needs_geocode_review",
        acceptedLocationKey: null,
        acceptedPointFingerprint: null,
        geographyEnrichmentStatus: "ready_for_profile_materialization",
      }),
    /cannot be geography-promotion ready/,
  );
});

test("existing Organization attachment requires the selected Organization in recorded evidence", () => {
  const value = candidate();
  const match = Object.freeze({
    organizationId: "org-existing-001",
    displayName: "Hampton Roads Business Center",
    basis: Object.freeze(["website-domain", "accepted-address"]),
    confidence: 0.98,
    evidenceSummary: "Canonical Organization has the same domain and accepted physical address.",
  });
  const comparison = createProviderCanonicalComparison({
    id: "comparison-provider-001-existing",
    candidate: value,
    canonicalSearchFingerprint: "sha256:canonical-search-existing",
    matches: [match],
    outcome: "attach-to-existing-organization",
    selectedOrganizationId: "org-existing-001",
    rationale: "The provider candidate is the same legal/operating identity as the canonical Organization.",
    comparisonFingerprint: "sha256:comparison-existing",
    reviewedByAdministratorId: "admin-001",
    authorityContextId: "authority-context-001",
    reviewedAt: now,
  });
  const approval = createProviderPromotionApproval({
    id: "approval-provider-001-existing",
    candidate: value,
    comparison,
    decision: "approve-existing-organization",
    targetOrganizationId: "org-existing-001",
    candidateRecordFingerprint: value.sourceRecordFingerprint,
    geographyProfileFingerprint: value.geographyProfileFingerprint,
    comparisonFingerprint: comparison.comparisonFingerprint,
    rationale: "Attach the seeded provider profile and draft Resource to the confirmed canonical identity.",
    approvedByAdministratorId: "admin-001",
    authorityContextId: "authority-context-001",
    approvedAt: now,
  });
  assert.equal(approval.targetOrganizationMode, "attach-existing");
  assert.equal(approval.targetOrganizationId, "org-existing-001");

  assert.throws(
    () =>
      createProviderCanonicalComparison({
        id: "comparison-provider-001-missing-evidence",
        candidate: value,
        canonicalSearchFingerprint: "sha256:canonical-search-missing",
        matches: [match],
        outcome: "attach-to-existing-organization",
        selectedOrganizationId: "org-not-in-evidence",
        rationale: "Invalid fixture.",
        comparisonFingerprint: "sha256:comparison-missing",
        reviewedByAdministratorId: "admin-001",
        authorityContextId: "authority-context-001",
        reviewedAt: now,
      }),
    /in recorded match evidence/,
  );
});

test("identity-review candidates cannot pass through ordinary approval", () => {
  const flagged = candidate({
    seedKey: "provider-identity-review",
    disposition: "needs_identity_review",
    sourceRecordFingerprint: "sha256:provider-identity-review",
  });
  const comparison = createProviderCanonicalComparison({
    id: "comparison-provider-identity-review",
    candidate: flagged,
    canonicalSearchFingerprint: "sha256:canonical-search-review",
    matches: [],
    outcome: "identity-review-required",
    rationale: "Candidate source record may represent a parent/subsidiary or program-level identity.",
    comparisonFingerprint: "sha256:comparison-review",
    reviewedByAdministratorId: "admin-001",
    authorityContextId: "authority-context-001",
    reviewedAt: now,
  });
  const approval = createProviderPromotionApproval({
    id: "approval-provider-identity-review",
    candidate: flagged,
    comparison,
    decision: "defer-identity-review",
    candidateRecordFingerprint: flagged.sourceRecordFingerprint,
    geographyProfileFingerprint: flagged.geographyProfileFingerprint,
    comparisonFingerprint: comparison.comparisonFingerprint,
    rationale: "Hold until the canonical parent and claim boundary are resolved.",
    approvedByAdministratorId: "admin-001",
    authorityContextId: "authority-context-001",
    approvedAt: now,
  });
  assert.equal(approval.state, "deferred");
  assert.equal(approval.targetOrganizationId, null);
  assert.throws(
    () =>
      createProviderPromotionCommand({
        id: "command-provider-identity-review",
        action: "preview-approved-provider-promotion",
        candidate: flagged,
        comparison,
        approval,
        targetLocationId: "location-identity-review",
        targetProviderResourceId: "resource-identity-review",
        geographyProfileId: "profile-identity-review",
        approvalFingerprint: "sha256:approval-review",
        requestFingerprint: "sha256:request-review",
        actorAdministratorId: "admin-001",
        authorityContextId: "authority-context-001",
        recordedAt: now,
      }),
    /Only an explicitly approved provider candidate/,
  );
});

test("promotion approval rejects stale candidate, geography, or comparison evidence", () => {
  const value = candidate();
  const comparison = newComparison(value);
  assert.throws(
    () =>
      createProviderPromotionApproval({
        id: "approval-provider-stale",
        candidate: value,
        comparison,
        decision: "approve-new-organization",
        targetOrganizationId: "seeded-org-provider-001",
        candidateRecordFingerprint: "sha256:stale-record",
        geographyProfileFingerprint: value.geographyProfileFingerprint,
        comparisonFingerprint: comparison.comparisonFingerprint,
        rationale: "Invalid stale fixture.",
        approvedByAdministratorId: "admin-001",
        authorityContextId: "authority-context-001",
        approvedAt: now,
      }),
    /is stale relative/,
  );
});

test("commit command requires exact confirmation and never auto-publishes seeded records", () => {
  const value = candidate();
  const comparison = newComparison(value);
  const approval = newApproval(value, comparison);
  const base = {
    id: "command-provider-001-commit",
    action: "commit-approved-provider-promotion",
    candidate: value,
    comparison,
    approval,
    targetLocationId: "seeded-location-provider-001",
    targetProviderResourceId: "seeded-resource-provider-001",
    geographyProfileId: "location-001",
    approvalFingerprint: "sha256:approval-001",
    requestFingerprint: "sha256:promotion-request-001",
    actorAdministratorId: "admin-001",
    authorityContextId: "authority-context-001",
    recordedAt: now,
  };
  assert.throws(
    () => createProviderPromotionCommand(base),
    /exact production confirmation phrase/,
  );
  const command = createProviderPromotionCommand({
    ...base,
    confirmation: "PROMOTE APPROVED PROVIDER",
  });
  assert.equal(command.targetOrganizationMode, "create");
  assert.equal(command.publishProviderDiscovery, false);
  assert.equal(command.publishResource, false);
  const event = createProviderPromotionEvent({
    id: "event-provider-001-commit",
    command,
    occurredAt: now,
  });
  assert.equal(event.kind, "provider-promotion-committed");
  assert.equal(event.commandId, command.id);
});

test("preview command is non-publishing but still bound to the approving authority context", () => {
  const value = candidate();
  const comparison = newComparison(value);
  const approval = newApproval(value, comparison);
  const command = createProviderPromotionCommand({
    id: "command-provider-001-preview",
    action: "preview-approved-provider-promotion",
    candidate: value,
    comparison,
    approval,
    targetLocationId: "seeded-location-provider-001",
    targetProviderResourceId: "seeded-resource-provider-001",
    geographyProfileId: "location-001",
    approvalFingerprint: "sha256:approval-001",
    requestFingerprint: "sha256:promotion-preview-001",
    actorAdministratorId: "admin-001",
    authorityContextId: "authority-context-001",
    recordedAt: now,
  });
  assert.equal(command.publishProviderDiscovery, false);
  assert.equal(command.publishResource, false);
  assert.throws(
    () =>
      createProviderPromotionCommand({
        ...command,
        id: "command-provider-001-wrong-authority",
        candidate: value,
        comparison,
        approval,
        approvalFingerprint: "sha256:approval-001",
        requestFingerprint: "sha256:promotion-preview-wrong-authority",
        actorAdministratorId: "admin-other",
        authorityContextId: "authority-context-001",
        recordedAt: now,
      }),
    /approving administrator authority context/,
  );
});

test("provider approval boundary is domain-only and cannot write Firebase", async () => {
  const source = await readFile(
    new URL("../src/domain/provider-seeding/promotion.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /firebase-admin|firebase\/firestore|getFirestore|\.set\(|transaction\.create|fetch\(/i,
  );
  assert.match(source, /publishProviderDiscovery: false/);
  assert.match(source, /publishResource: false/);
  assert.match(source, /PROMOTE APPROVED PROVIDER/);
});
