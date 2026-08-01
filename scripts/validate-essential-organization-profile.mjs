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
  activationUi,
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
  read("src/components/onboarding/ActivationJourneyClient.tsx"),
  read("test/essential-organization-profile.test.mjs"),
  read("docs/architecture/WAVE_2_SLICE_2_7.md"),
  read(".github/workflows/ci.yml"),
]);

for (const required of [
  "EssentialOrganizationProfile extends OrganizationProfile",
  "ORGANIZATION_CAPABILITY_CATEGORIES",
  "ORGANIZATION_CAPABILITY_KINDS",
  "PROFILE_COMPLETION_REQUIREMENTS",
  'credentialFamily: "active"',
  'credentialKey: "profile-complete"',
  "evaluateOrganizationProfileCompletion",
  "projectPublicEssentialOrganizationProfile",
]) {
  assert.ok(model.includes(required), `Essential-profile domain is missing ${required}.`);
}
for (const category of [
  "professional-business-services",
  "construction-skilled-trades",
  "manufacturing-fabrication",
  "technology-data-cybersecurity",
  "transportation-logistics",
  "marketing-creative-services",
  "facilities-real-estate",
  "education-workforce-training",
  "health-safety-security",
  "food-hospitality-events",
  "other",
]) {
  assert.ok(model.includes(`"${category}"`), `Capability category is missing ${category}.`);
}
assert.ok(model.includes("GENERIC_CAPABILITY_NAMES"));
assert.equal(model.includes('missing.push("organization-type")'), false);
assert.equal(model.includes('missing.push("participation-role")'), false);
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
for (const collection of ["organizationProfileCompletions", "organizationProfileEvents"]) {
  assert.ok(schema.includes(collection), `Firestore schema is missing ${collection}.`);
  assert.ok(rules.includes(`/${collection}/{documentId}`), `Firestore rules are missing ${collection}.`);
}

for (const required of [
  "Carried-forward organization information",
  "One meaningful capability",
  "Capability category",
  "Other category",
  "Active credential · automatically derived",
  "Profile Complete is not Organization Verified",
  "not an activated network marker",
]) {
  assert.ok(panel.includes(required), `Reference essential-profile component is missing ${required}.`);
}
assert.equal(panel.includes("Participation roles"), false);
assert.equal(panel.includes("Business objectives"), false);

for (const required of [
  "resolveParticipantRoute",
  "hydrateEssentialOrganizationProfile",
  "getByOrganizationId",
  "Profile Complete",
  "Capabilities",
  "Opportunity participation",
  "Resource Provider status",
]) {
  assert.ok(route.includes(required), `Authenticated Account profile route is missing ${required}.`);
}
assert.equal(route.includes("EssentialProfilePanel"), false);
assert.equal(route.includes("Harborlight"), false);
assert.equal(route.includes("Controlled Exchange"), false);

for (const required of [
  "ORGANIZATION_CAPABILITY_CATEGORIES.map",
  '"save-profile"',
  "Complete profile and activate marker",
  "profileSeed",
]) {
  assert.ok(activationUi.includes(required), `Integrated essential-profile activation UI is missing ${required}.`);
}
assert.equal(activationUi.includes("ORGANIZATION_PARTICIPATION_ROLES.map"), false);
assert.equal(activationUi.includes("ORGANIZATION_BUSINESS_OBJECTIVES.map"), false);

for (const phrase of [
  "cannot bypass completion",
  "deactivates stale completion",
  "cross-organization update",
  "location and contact privacy",
]) {
  assert.ok(tests.includes(phrase), `Essential-profile tests are missing ${phrase}.`);
}
assert.ok(architecture.includes("categorized capability"));
assert.ok(architecture.includes("not collected during activation"));
assert.ok(architecture.includes("separate application"));
assert.ok(
  ci.includes("smoke-essential-organization-profile-emulator.mjs"),
  "CI must run the Slice 2.7 Firestore emulator acceptance.",
);

console.log("Amended Slice 2.7 essential organization profile and Profile Complete gate validated.");
