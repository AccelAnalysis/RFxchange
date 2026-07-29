import { readFile } from "node:fs/promises";

const model = await readFile("src/domain/assets/model.ts", "utf8");
const repository = await readFile("src/domain/assets/repository.ts", "utf8");
const membershipModel = await readFile("src/domain/users/model.ts", "utf8");
const documentation = await readFile("docs/architecture/WAVE_1_SLICE_1_3.md", "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Organization asset validation failed: ${message}`);
  }
}

const requiredKinds = [
  "capability",
  "location",
  "service-area",
  "rfx",
  "response",
  "referral",
  "team",
  "document",
  "resource",
  "membership",
  "credibility",
];

assert(model.includes("export interface OrganizationScoped"), "OrganizationScoped contract is missing");
assert(
  model.includes("readonly organizationId: OrganizationId"),
  "organization-scoped records must carry the organization tenant id",
);
assert(
  model.includes("organizationId: organization.id"),
  "asset creation must derive ownership from OrganizationAccount",
);
assert(
  model.includes("if (asset.organizationId !== organization.id)"),
  "cross-tenant asset ownership must be rejected",
);

for (const kind of requiredKinds) {
  assert(model.includes(`\"${kind}\"`), `ARC-009 asset family is missing: ${kind}`);
}

const scopedBlock = model.match(/export interface OrganizationScoped \{([\s\S]*?)\n\}/)?.[1] ?? "";
const assetBlock = model.match(/export interface OrganizationScopedAsset[^{]*\{([\s\S]*?)\n\}/)?.[1] ?? "";

for (const forbidden of ["userId", "ownerUserId", "role", "permission", "billing", "plan"]) {
  assert(!scopedBlock.includes(forbidden), `OrganizationScoped must not absorb deferred/user ownership field: ${forbidden}`);
  assert(!assetBlock.includes(forbidden), `OrganizationScopedAsset must not absorb deferred/user ownership field: ${forbidden}`);
}

assert(
  repository.includes("listByOrganizationId(organizationId: OrganizationId)"),
  "organization-scoped persistence must support tenant-scoped lookup",
);
assert(
  membershipModel.includes("export interface OrganizationMembership") &&
    membershipModel.includes("readonly organizationId: OrganizationId"),
  "organization membership must remain organization-scoped",
);
assert(documentation.includes("ARC-009"), "architecture evidence must map ARC-009");
assert(documentation.includes("Explicitly deferred"), "slice boundary must be documented");

console.log("Wave 1 Slice 1.3 organization asset ownership validation passed.");
