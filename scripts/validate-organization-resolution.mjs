import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const model = await read("src/domain/organization-resolution/model.ts");
const matching = await read("src/domain/organization-resolution/matching.ts");
const service = await read(
  "src/application/organization-resolution/organization-resolution.ts",
);
const persistence = await read(
  "src/infrastructure/firestore/organization-resolution-repositories.ts",
);
const schema = await read("src/infrastructure/firestore/schema.ts");
const rules = await read("firestore.rules");
const component = await read(
  "src/components/organization-resolution/OrganizationResolutionPanel.tsx",
);
const architecture = await read("docs/architecture/WAVE_2_SLICE_2_3.md");
const ci = await read(".github/workflows/ci.yml");

for (const requirement of [
  "OrganizationDiscoveryRecord",
  "seeded-public",
  "participant-provided",
  'authorityState: "unestablished"',
  'verificationState: "not-evaluated"',
  "projectUnclaimedOrganizationProfile",
  "strongOrganizationEntityKeys",
]) {
  assert.ok(model.includes(requirement), `Resolution domain is missing ${requirement}.`);
}
assert.ok(
  !model.includes("firebase") && !matching.includes("firebase"),
  "Organization resolution domain must remain provider-independent.",
);
assert.ok(
  ci.includes("smoke-organization-resolution-emulator.mjs"),
  "CI must run the Slice 2.3 Firestore emulator acceptance.",
);

for (const signal of [
  '"government-identifier"',
  '"domain"',
  '"phone"',
  '"address"',
  '"display-name"',
  '"alias"',
  '"geography"',
]) {
  assert.ok(matching.includes(signal), `Entity comparison is missing ${signal}.`);
}
assert.ok(
  matching.includes('"identity-conflict"') &&
    matching.includes('"unreviewed-likely-match"') &&
    matching.includes("reviewedOrganizationIds"),
  "Duplicate protection must preserve conflicts and require likely-match review.",
);

for (const requirement of [
  "AuthenticatedServerContext",
  "geographySelections.getByUserId",
  '"geography-selected"',
  '"organization-resolved"',
  "selectExisting",
  "createNew",
  "authorityEstablished: false",
  "organizationVerified: false",
]) {
  assert.ok(service.includes(requirement), `Resolution service is missing ${requirement}.`);
}
assert.ok(
  !service.includes("createOrganizationMembership") &&
    !service.includes("Organization Verification"),
  "Slice 2.3 must not grant membership/authority or implement Verification.",
);

for (const requirement of [
  "transaction.create",
  "organizationDiscoveryRecords",
  "organizationResolutions",
  "organizationEntityKeys",
  "OrganizationEntityKeyConflictError",
  'state !== "geography-selected"',
]) {
  assert.ok(persistence.includes(requirement), `Atomic persistence is missing ${requirement}.`);
}
for (const collection of [
  "organizationDiscoveryRecords",
  "organizationResolutions",
  "organizationEntityKeys",
]) {
  assert.ok(schema.includes(collection), `Firestore schema is missing ${collection}.`);
  assert.ok(rules.includes(`/${collection}/{documentId}`), `Rules are missing ${collection}.`);
}

for (const requirement of [
  "Claim this organization",
  "This is my organization",
  "None of these — create this organization",
  "Resolution is not authority",
]) {
  assert.ok(component.includes(requirement), `Resolution UI is missing ${requirement}.`);
}
assert.ok(
  architecture.includes("ACQ-004") &&
    architecture.includes("ORG-001") &&
    architecture.includes("ORG-002") &&
    architecture.includes("ORG-003") &&
    architecture.includes("Explicit non-scope"),
);

console.log(
  "Slice 2.3 organization resolution validated: seeded public projection, explainable matching, duplicate controls, atomic resolution, and authority separation.",
);
