import { readFile } from "node:fs/promises";

const model = await readFile("src/domain/authorization/model.ts", "utf8");
const repository = await readFile("src/domain/authorization/repository.ts", "utf8");
const membershipModel = await readFile("src/domain/users/model.ts", "utf8");
const documentation = await readFile("docs/architecture/WAVE_1_SLICE_1_4.md", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(`Organization permission validation failed: ${message}`);
}

assert(model.includes("export interface OrganizationUserAuthorization"), "authorization record is missing");
assert(model.includes("readonly membershipId: OrganizationMembershipId"), "authorization must attach to membership");
assert(model.includes("readonly userId: UserId"), "authorization must retain individual user identity");
assert(model.includes("readonly organizationId: OrganizationId"), "authorization must remain organization-scoped");
assert(model.includes("readonly roleKey: OrganizationRoleKey"), "organization role must be stored");
assert(model.includes("readonly permissions: readonly OrganizationPermission[]"), "granular permissions must be stored");
assert(model.includes('membership.status !== "active"'), "inactive membership must deny permission use");
assert(model.includes('reason: "wrong-organization"'), "cross-tenant permission denial is missing");
assert(model.includes('reason: "missing-permission"'), "capability denial is missing");
assert(model.includes("authorization.permissions.includes(permission)"), "permission decision must evaluate named capability");

const authorizationBlock = model.match(/export interface OrganizationUserAuthorization \{([\s\S]*?)\n\}/)?.[1] ?? "";
for (const forbidden of ["password", "billingPlan", "auditHistory"]) {
  assert(!authorizationBlock.includes(forbidden), `authorization record absorbed deferred field: ${forbidden}`);
}

assert(
  !model.includes('roleKey === "primary-admin"') && !model.includes('roleKey === "admin"'),
  "authorization must not depend on broad role-name conditionals",
);
assert(
  membershipModel.includes('export type OrganizationMembershipStatus = "active" | "inactive"'),
  "authorization must build on the existing membership status boundary",
);
assert(
  repository.includes("export interface OrganizationUserAuthorizationRepository"),
  "authorization persistence port is missing",
);
assert(
  repository.includes("getByMembershipId") && repository.includes("listByOrganizationId"),
  "authorization repository must support membership and tenant lookup",
);
assert(documentation.includes("ARC-005"), "architecture evidence must map ARC-005");
assert(documentation.includes("Explicitly deferred"), "slice boundary must be documented");

console.log("Wave 1 Slice 1.4 organization permission validation passed.");
