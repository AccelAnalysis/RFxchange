import { readFile } from "node:fs/promises";

const model = await readFile("src/domain/organizations/model.ts", "utf8");
const repository = await readFile("src/domain/organizations/repository.ts", "utf8");
const documentation = await readFile("docs/architecture/WAVE_1_SLICE_1_1.md", "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Organization tenancy validation failed: ${message}`);
  }
}

assert(model.includes("export interface OrganizationAccount"), "OrganizationAccount tenant model is missing");
assert(model.includes("export interface OrganizationProfile"), "OrganizationProfile network model is missing");
assert(model.includes('Brand<string, "OrganizationId">'), "OrganizationId must remain a distinct tenant identifier");
assert(model.includes('Brand<string, "OrganizationProfileId">'), "OrganizationProfileId must remain separate from OrganizationId");
assert(model.includes("readonly organizationId: OrganizationId"), "OrganizationProfile must link to the organization tenant");
assert(
  model.includes("createOrganizationProfile(\n  account: OrganizationAccount"),
  "profile creation must require an organization account",
);
assert(
  model.includes("organizationId: account.id"),
  "profile creation must derive tenant ownership from the organization account",
);
assert(
  model.includes("if (account.id !== profile.organizationId)"),
  "cross-tenant account/profile links must be rejected",
);
assert(
  repository.includes("export interface OrganizationAccountRepository") &&
    repository.includes("export interface OrganizationProfileRepository"),
  "account and profile persistence ports must remain separate",
);
assert(
  repository.includes("getByOrganizationId(organizationId: OrganizationId)"),
  "profile persistence must support lookup by tenant identifier",
);

const accountBlock = model.match(/export interface OrganizationAccount \{([\s\S]*?)\n\}/)?.[1] ?? "";
const profileBlock = model.match(/export interface OrganizationProfile \{([\s\S]*?)\n\}/)?.[1] ?? "";

for (const forbidden of ["userId", "email", "password", "role", "permission"]) {
  assert(!accountBlock.includes(forbidden), `OrganizationAccount must not absorb user field: ${forbidden}`);
}

for (const forbidden of ["password", "permission", "billing", "plan"]) {
  assert(!profileBlock.includes(forbidden), `OrganizationProfile must not absorb tenant/security field: ${forbidden}`);
}

assert(documentation.includes("ARC-001"), "architecture evidence must map ARC-001");
assert(documentation.includes("ARC-002"), "architecture evidence must map ARC-002");
assert(documentation.includes("Explicitly deferred"), "slice boundary must be documented");

console.log("Wave 1 Slice 1.1 organization tenancy validation passed.");
