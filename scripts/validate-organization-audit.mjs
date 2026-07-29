import { readFile } from "node:fs/promises";

const model = await readFile("src/domain/audit/model.ts", "utf8");
const repository = await readFile("src/domain/audit/repository.ts", "utf8");
const documentation = await readFile("docs/architecture/WAVE_1_SLICE_1_5.md", "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Organization audit validation failed: ${message}`);
  }
}

assert(
  model.includes("export interface OrganizationActionAuditEvent"),
  "organization action audit event model is missing",
);
assert(
  model.includes("readonly organizationId: OrganizationId"),
  "audit history must retain organization attribution",
);
assert(
  model.includes("readonly userId: UserId") &&
    model.includes("readonly membershipId: OrganizationMembershipId"),
  "audit actor must retain exact user and membership attribution",
);
assert(
  model.includes("user: UserIdentity") &&
    model.includes("membership: OrganizationMembership") &&
    model.includes("organization: OrganizationAccount"),
  "audit event creation must bind user, membership and organization context",
);
assert(
  model.includes('membership.status !== "active"'),
  "inactive membership must not originate a normal attributed user action",
);
assert(
  model.includes("membership.userId !== user.id"),
  "audit attribution must reject a membership belonging to another user",
);
assert(
  model.includes("membership.organizationId !== organization.id"),
  "audit attribution must reject cross-tenant membership context",
);
assert(
  model.includes("input.target.organizationId !== organization.id"),
  "audit attribution must reject cross-tenant asset targets",
);

const eventBlock =
  model.match(/export interface OrganizationActionAuditEvent \{([\s\S]*?)\n\}/)?.[1] ?? "";

for (const forbidden of ["updatedAt", "deletedAt", "roleKey", "permissions", "password"]) {
  assert(!eventBlock.includes(forbidden), `audit event must not absorb mutable/deferred field: ${forbidden}`);
}

assert(
  repository.includes("append(event: OrganizationActionAuditEvent)"),
  "audit persistence must expose append semantics",
);
assert(
  repository.includes("listByOrganizationId") &&
    repository.includes("listByActorUserId") &&
    repository.includes("listByMembershipId"),
  "audit history must be queryable by organization and attributed actor",
);
assert(!/\bupdate\s*\(/.test(repository), "audit repository must not expose event update operations");
assert(!/\bdelete\s*\(/.test(repository), "audit repository must not expose event delete operations");

assert(documentation.includes("ARC-006"), "architecture evidence must map ARC-006");
assert(documentation.includes("Explicitly deferred"), "slice boundary must be documented");

console.log("Wave 1 Slice 1.5 organization audit validation passed.");
