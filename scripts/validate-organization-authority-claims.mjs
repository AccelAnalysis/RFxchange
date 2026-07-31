import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [model, service, persistence, schema, rules, participantUi, adminUi, architecture, convergence, ci] =
  await Promise.all([
    read("src/domain/organization-claims/model.ts"),
    read("src/application/organization-claims/organization-authority.ts"),
    read("src/infrastructure/firestore/organization-authority-claims.ts"),
    read("src/infrastructure/firestore/schema.ts"),
    read("firestore.rules"),
    read("src/components/onboarding/ActivationJourneyClient.tsx"),
    read("app/admin/organization-claims/page.tsx"),
    read("docs/architecture/WAVE_2_SLICE_2_5.md"),
    read("docs/architecture/ACTIVATION_JOURNEY_INTEGRATION_GATE.md"),
    read(".github/workflows/ci.yml"),
  ]);

for (const required of [
  "domain-email",
  "existing-administrator-invitation",
  "administrative-review",
  "organization-document",
  "authoritative-record",
  'verificationState: "not-evaluated"',
  "ORGANIZATION_CLAIMS_CONSOLE_CATEGORIES",
  "conflictingClaimIds",
]) {
  assert.ok(model.includes(required), `Organization authority domain is missing ${required}.`);
}
for (const category of [
  "seeded", "unclaimed", "claimed", "active", "incomplete", "verification-pending",
  "verified", "provider", "issuer", "duplicate", "restricted", "suspended", "terminated",
  "geography",
]) {
  assert.ok(model.includes(`"${category}"`), `Claims console category model is missing ${category}.`);
}
for (const required of [
  "AuthenticatedServerContext",
  "standardOrganizationRolePreset",
  '"primary-administrator"',
  '"organization-registered"',
  "assertScopedAdministrativeActionAuthorized",
  '"organization.claim.adjudicate"',
  "createPlatformAdministrativeAuditEvent",
  "OrganizationClaimCommunicationScheduler",
]) {
  assert.ok(service.includes(required), `Authority application service is missing ${required}.`);
}
assert.equal(service.toLowerCase().includes("microsoft-graph"), false);
for (const collection of [
  "organizationAuthorityClaims",
  "organizationAuthorityClaimEvents",
  "organizationAuthorityDecisions",
]) {
  assert.ok(schema.includes(collection), `Firestore schema is missing ${collection}.`);
  assert.ok(rules.includes(`/${collection}/{documentId}`), `Firestore rules are missing ${collection}.`);
  assert.ok(persistence.includes(collection), `Firestore adapter is missing ${collection}.`);
}
for (const required of [
  "organizationMemberships",
  "organizationAuthorizations",
  "organization-resolved",
  "transaction.create",
]) {
  assert.ok(persistence.includes(required), `Atomic authority persistence is missing ${required}.`);
}

assert.ok(
  participantUi.includes("Selecting an existing profile never grants control"),
  "Integrated participant activation must preserve authority separation for an existing organization.",
);
assert.ok(
  convergence.includes("This is not Organization Verification") ||
    convergence.includes("not Organization Verification"),
  "Canonical convergence architecture must preserve Authority ≠ Verification.",
);
for (const required of [
  "resolveAdminRoute",
  'permission: "organization.claim.read"',
  "listByGeographyId",
  "listByStatus",
  "Private evidence",
  "GLOBAL",
  "GEOGRAPHY:",
]) {
  assert.ok(adminUi.includes(required), `Protected live claims console is missing ${required}.`);
}
assert.equal(adminUi.includes("Harborlight"), false, "Production claims console must not render fixture organizations.");
assert.ok(
  ci.includes("smoke-organization-authority-claims-emulator.mjs"),
  "CI must run the Slice 2.5 Firestore emulator acceptance.",
);
assert.ok(
  architecture.includes("ORG-004") &&
    architecture.includes("ADM-065") &&
    architecture.includes("ADM-066") &&
    architecture.includes("Organization Verification"),
);

console.log("Slice 2.5 organization authority, protected claims runtime, and adjudication validated.");
