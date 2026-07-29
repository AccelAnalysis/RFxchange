import { readFile } from "node:fs/promises";

const model = await readFile("src/domain/users/model.ts", "utf8");
const repository = await readFile("src/domain/users/repository.ts", "utf8");
const documentation = await readFile("docs/architecture/WAVE_1_SLICE_1_2.md", "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(`User membership validation failed: ${message}`);
  }
}

assert(model.includes("export interface UserIdentity"), "UserIdentity model is missing");
assert(model.includes("export interface OrganizationMembership"), "OrganizationMembership model is missing");
assert(model.includes("readonly primaryEmail: string"), "user identity must preserve an individual email");
assert(model.includes("readonly login: UserLoginIdentity"), "user identity must preserve an individual login binding");
assert(model.includes("readonly security: UserSecuritySettings"), "user identity must preserve individual security settings");
assert(model.includes("readonly userId: UserId"), "membership must link to the individual user");
assert(model.includes("readonly organizationId: OrganizationId"), "membership must link to the organization tenant");
assert(model.includes('membership.status === "active"'), "organization access must require active membership");
assert(model.includes('kind: "account-resolution"'), "orphan users must route to account resolution");
assert(
  model.includes('reason: "no-active-organization-membership"'),
  "account resolution must identify missing active organization membership",
);
assert(
  model.includes("organization: OrganizationAccount"),
  "membership creation must receive the organization tenant rather than an arbitrary tenant id",
);

const userBlock = model.match(/export interface UserIdentity \{([\s\S]*?)\n\}/)?.[1] ?? "";
const membershipBlock = model.match(/export interface OrganizationMembership \{([\s\S]*?)\n\}/)?.[1] ?? "";

for (const forbidden of ["organizationId", "role", "permission", "billing", "plan", "password"]) {
  assert(!userBlock.includes(forbidden), `UserIdentity must not absorb tenant/authorization field: ${forbidden}`);
}

for (const forbidden of ["role", "permission", "billing", "plan", "password"]) {
  assert(!membershipBlock.includes(forbidden), `OrganizationMembership must not absorb deferred field: ${forbidden}`);
}

assert(
  repository.includes("export interface UserIdentityRepository") &&
    repository.includes("export interface OrganizationMembershipRepository"),
  "user identity and organization membership persistence ports must remain explicit",
);
assert(
  repository.includes("listActiveByUserId(userId: UserId)"),
  "membership persistence must support active membership resolution by user",
);

assert(documentation.includes("ARC-003"), "architecture evidence must map ARC-003");
assert(documentation.includes("ARC-004"), "architecture evidence must map ARC-004");
assert(documentation.includes("Explicitly deferred"), "slice boundary must be documented");

console.log("Wave 1 Slice 1.2 user membership validation passed.");
