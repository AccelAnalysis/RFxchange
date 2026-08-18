import assert from "node:assert/strict";
import test from "node:test";

import {
  createCapabilitiesExchangeProjection,
  parseCapabilitiesQuery,
} from "../src/application/organizations/capabilities-exchange.ts";
import { capabilitiesLocaleCatalog } from "../src/application/organizations/capabilities-locale.ts";
import { supportedLocales } from "../src/i18n/config.ts";

const release = Object.freeze({ version: "0.5.0", releasedAt: "2026-08-01T00:00:00.000Z", sourceCommit: "da7879f2609271b067ae6d02875e9388a02c4fe5", projectionVersion: "1" });
const capability = Object.freeze({ conceptId: "AMACS-CAP-1", preferredLabel: "Precision machining", definition: "Produces precision components.", domainId: "AMACS-DOM-1", domainLabel: "Manufacturing", familyId: "AMACS-FAM-1", familyLabel: "Machining", aliases: [], status: "active", replacementConceptIds: [], releaseVersion: "0.5.0" });
const domain = Object.freeze({ domainId: "AMACS-DOM-1", preferredLabel: "Manufacturing", definition: "", status: "active" });

function claim(overrides = {}) {
  return Object.freeze({
    id: "claim-1", organizationId: "org-owner", capabilityId: capability.conceptId,
    amacsReleaseVersion: "0.5.0", labelSnapshot: capability.preferredLabel,
    definitionSnapshot: capability.definition, domainId: capability.domainId,
    domainLabelSnapshot: capability.domainLabel, familyId: capability.familyId,
    familyLabelSnapshot: capability.familyLabel, entityScope: "reporting_entity",
    marketRoleIds: ["service-provider"], deliveryRoles: ["supplier"],
    serviceGeographyIds: ["geo-1"], specialties: ["Tight tolerance"], capacity: null,
    evidenceIds: [], assertionStatus: "self_reported", visibility: "network",
    source: { kind: "manual" }, assertedByUserId: "user-1", assertedByMembershipId: "member-1",
    createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  });
}

function source(overrides = {}) {
  return Object.freeze({ organizationId: "org-owner", organizationName: "Owner Works", locality: "Norfolk", markerId: "marker-owner", coordinate: [-76.28, 36.85], ownOrganization: true, claims: [claim()], serviceGeographyIds: ["geo-1"], ...overrides });
}

function project(overrides = {}) {
  const locale = overrides.locale ?? "en-US";
  return createCapabilitiesExchangeProjection({
    locale, geographyId: "geo-1", geographyLabel: "Norfolk", query: parseCapabilitiesQuery({}),
    viewerOrganizationId: "org-owner", canManageProfile: true, sources: [source()],
    canonicalCapabilities: [capability], amacs: { release, domains: [domain], query: "", domainId: null, results: [] },
    cardCopy: capabilitiesLocaleCatalog(locale).card, ...overrides,
  });
}

test("Stage 4 parses bounded query state and rejects browser-selected enumerations fail closed", () => {
  const parsed = parseCapabilitiesQuery({ q: `  ${"x".repeat(300)}  `, evidence: "invented", view: "other", page: "-4", selectedOrganization: ["org-2", "org-3"] });
  assert.equal(parsed.search.length, 160);
  assert.equal(parsed.evidence, "all");
  assert.equal(parsed.view, "discover");
  assert.equal(parsed.page, 1);
  assert.equal(parsed.selectedOrganizationId, "org-2");
});

test("Stage 4 projects confirmed organization claims with one identity across card and map", () => {
  const result = project();
  assert.equal(result.organizations.length, 1);
  assert.equal(result.organizations[0].claims[0].provenanceLabel, "Organization claimed");
  assert.equal(result.organizations[0].claims[0].assertionStatus, "self_reported");
  assert.equal(result.organizations[0].card.identity.selectionKey, result.discovery.map.objects[0].identity.selectionKey);
  assert.equal(result.policy.assistanceCandidatesAffectProjection, false);
  assert.equal(result.policy.rfxMatchingImplemented, false);
  assert.equal(result.policy.savedRelationImplemented, false);
});

test("Stage 4 preserves exact four action positions and fails privileged handlers closed", () => {
  const allowed = project();
  assert.deepEqual(allowed.actionProjections.map((action) => action.id), ["capabilities.manage-view", "capabilities.classify-match", "capabilities.evidence-refer", "capabilities.gaps-save"]);
  assert.deepEqual(allowed.actionProjections.map((action) => action.availability), ["active", "active", "disabled", "active"]);
  const denied = project({ canManageProfile: false });
  assert.equal(denied.actionProjections[0].availability, "disabled");
  assert.equal(denied.actionProjections[0].disabledReason, "not-authorized");
  assert.equal(denied.actionProjections[1].availability, "disabled");
  assert.equal(denied.actionProjections[1].resolvedHandler, null);
  const emptyOwner = project({ sources: [source({ claims: [] })] });
  assert.equal(emptyOwner.actionProjections[3].availability, "active");
  assert.match(emptyOwner.actionProjections[3].resolvedHandler.href, /view=gaps/);
});

test("Stage 4 external selection enables view only and never fabricates match, referral, or save", () => {
  const publicClaim = Object.freeze({ id: "public-1", capabilityId: capability.conceptId, amacsReleaseVersion: "0.5.0", label: capability.preferredLabel, definition: capability.definition, domainLabel: capability.domainLabel, familyLabel: capability.familyLabel, specialties: [], assertionStatus: "evidence_submitted", provenanceLabel: "Organization claimed" });
  const result = project({ query: parseCapabilitiesQuery({ selectedOrganization: "org-external" }), sources: [source(), source({ organizationId: "org-external", organizationName: "External Works", markerId: "marker-external", coordinate: [-76.3, 36.87], ownOrganization: false, claims: [publicClaim] })] });
  assert.equal(result.selectedOrganizationId, "org-external");
  assert.deepEqual(result.actionProjections.map((action) => action.availability), ["active", "disabled", "disabled", "disabled"]);
  assert.equal(result.organizations[1].claims[0].evidenceCount, null);
  assert.equal(result.organizations[1].claims[0].assertionStatus, "evidence_submitted");
});

test("Stage 4 separates historical AMACS snapshots, evidence states, and structural gaps", () => {
  const result = project({ sources: [source({ claims: [claim({ capabilityId: "AMACS-HISTORICAL", amacsReleaseVersion: "0.1.0", evidenceIds: [], marketRoleIds: [], serviceGeographyIds: [] })] })] });
  const organization = result.organizations[0];
  assert.equal(organization.claims[0].currentAmacsConcept, false);
  assert.equal(organization.card.metadata[0].value, "Historical AMACS snapshot present");
  assert.deepEqual(organization.gaps.map((gap) => gap.id), ["historical-amacs", "coverage", "market-role", "evidence"]);
  assert.equal(organization.readiness, "needs-review");
});

test("Stage 4 supplies non-empty participant copy for all five supported locales", () => {
  assert.equal(supportedLocales.length, 5);
  for (const locale of supportedLocales) {
    const copy = capabilitiesLocaleCatalog(locale);
    assert.ok(copy.title.trim());
    assert.ok(copy.introduction.trim());
    assert.ok(copy.card.viewAccessible.includes("{organization}"));
    assert.ok(project({ locale }).organizations[0].card.accessibleLabel.includes("Owner Works"));
  }
});
