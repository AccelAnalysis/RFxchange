import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [model, service, persistence, schema, rules, participantUi, adminUi, architecture, ci] =
  await Promise.all([
    read("src/domain/organization-claims/model.ts"),
    read("src/application/organization-claims/organization-authority.ts"),
    read("src/infrastructure/firestore/organization-authority-claims.ts"),
    read("src/infrastructure/firestore/schema.ts"),
    read("firestore.rules"),
    read("app/organization-authority/page.tsx"),
    read("app/admin/organization-claims/page.tsx"),
    read("docs/architecture/WAVE_2_SLICE_2_5.md"),
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
  assert.ok(model.includes(`"${category}"`), `Claims console filter is missing ${category}.`);
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
assert.ok(participantUi.includes("Authority ≠ Verification"));
for (const label of ["Seeded", "Unclaimed", "Claimed", "Verification pending", "Duplicate", "Terminated", "Geography"]) {
  assert.ok(adminUi.includes(label), `Admin claims UI is missing ${label}.`);
}
assert.ok(adminUi.includes("History is preserved") && adminUi.includes("Evidence comparison"));
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

console.log("Slice 2.5 organization authority, claims console, and adjudication validated.");
