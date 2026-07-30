import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [
  model,
  service,
  persistence,
  schema,
  rules,
  panel,
  route,
  tests,
  architecture,
  ci,
] = await Promise.all([
  read("src/domain/organization-profile/model.ts"),
  read("src/application/organization-profile/essential-profile.ts"),
  read("src/infrastructure/firestore/organization-profile.ts"),
  read("src/infrastructure/firestore/schema.ts"),
  read("firestore.rules"),
  read("src/components/organization-profile/EssentialProfilePanel.tsx"),
  read("app/organization-profile/page.tsx"),
  read("test/essential-organization-profile.test.mjs"),
  read("docs/architecture/WAVE_2_SLICE_2_7.md"),
  read(".github/workflows/ci.yml"),
]);

for (const required of [
  "EssentialOrganizationProfile extends OrganizationProfile",
  "ORGANIZATION_TYPES",
  "ORGANIZATION_PARTICIPATION_ROLES",
  "ORGANIZATION_BUSINESS_OBJECTIVES",
  "ORGANIZATION_CAPABILITY_KINDS",
  "PROFILE_COMPLETION_REQUIREMENTS",
  'credentialFamily: "active"',
  'credentialKey: "profile-complete"',
  "evaluateOrganizationProfileCompletion",
  "projectPublicEssentialOrganizationProfile",
]) {
  assert.ok(model.includes(required), `Essential-profile domain is missing ${required}.`);
}
for (const role of [
  "business", "supplier", "buyer", "issuer", "government", "edo",
  "resource-provider", "chamber", "lender", "university", "nonprofit", "other",
]) {
  assert.ok(model.includes(`"${role}"`), `Participation role is missing ${role}.`);
}
for (const objective of [
  "find-opportunities", "issue-opportunities", "find-customers", "find-suppliers",
  "find-teammates", "send-receive-referrals", "find-resources-support",
  "explore-local-network",
]) {
  assert.ok(model.includes(`"${objective}"`), `Business objective is missing ${objective}.`);
}
assert.ok(model.includes("GENERIC_CAPABILITY_NAMES"));
assert.equal(model.includes("commercialStatus"), false);
assert.equal(model.includes("verificationStatus"), false);

for (const required of [
  "authorizeOrganizationOperation",
  '"organization.profile.manage"',
  "currentInputs",
  "evaluateOrganizationProfileCompletion",
  "profile-completion-recalculated",
  "projectPublicOrganizationLocation",
]) {
  assert.ok(service.includes(required), `Essential-profile service is missing ${required}.`);
}
assert.equal(service.includes("organizationAuthorizations.save"), false);
for (const collection of [
  "organizationProfiles",
  "organizationProfileCompletions",
  "organizationProfileEvents",
  "organizationAuditEvents",
]) {
  assert.ok(persistence.includes(collection), `Profile persistence is missing ${collection}.`);
}
assert.ok(persistence.includes("runTransaction"));
assert.ok(persistence.includes("expectedProfileUpdatedAt"));
for (const collection of [
  "organizationProfileCompletions",
  "organizationProfileEvents",
]) {
  assert.ok(schema.includes(collection), `Firestore schema is missing ${collection}.`);
  assert.ok(rules.includes(`/${collection}/{documentId}`), `Firestore rules are missing ${collection}.`);
}

for (const required of [
  "Minimum organization identity",
  "One meaningful capability",
  "Participation roles",
  "Business objectives",
  "Active credential · automatically derived",
  "Profile Complete is not Organization Verified",
  "not an activated network marker",
]) {
  assert.ok(panel.includes(required), `Essential-profile UI is missing ${required}.`);
}
assert.ok(route.includes("createPortsmouthControlledLocalityPreview"));
for (const phrase of [
  "cannot bypass completion",
  "deactivates stale completion",
  "cross-organization update",
  "location and contact privacy",
]) {
  assert.ok(tests.includes(phrase), `Essential-profile tests are missing ${phrase}.`);
}
assert.ok(
  architecture.includes("ORG-007") &&
    architecture.includes("ORG-008") &&
    architecture.includes("ORG-010") &&
    architecture.includes("ORG-011") &&
    architecture.includes("ORG-012"),
);
assert.ok(
  ci.includes("smoke-essential-organization-profile-emulator.mjs"),
  "CI must run the Slice 2.7 Firestore emulator acceptance.",
);

console.log("Slice 2.7 essential organization profile and Profile Complete validated.");
