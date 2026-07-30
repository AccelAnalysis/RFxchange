import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const service = await readFile(new URL("../src/application/admin/controlled-user-administration.ts", import.meta.url), "utf8");
const boundary = await readFile(new URL("../src/domain/admin-authorization/controlled-user-administration-repository.ts", import.meta.url), "utf8");
const firestore = await readFile(new URL("../src/infrastructure/firestore/controlled-user-administration-unit-of-work.ts", import.meta.url), "utf8");

for (const required of [
  "user.access.manage",
  "ORGANIZATION:",
  "authorizeConditionalScopedAdministrativeAction",
  "createScopedAdministrativeActionRequirement",
  "planAdministrativeMembershipDeactivation",
  "membershipRestrictionTarget",
  "transitionAccessRestriction",
  "priorState",
  "newState",
  "distinct administrative approval reference",
]) assert.ok(service.includes(required), `ADM-068 is missing ${required}.`);

for (const method of [
  "async invite(", "async resendInvitation(", "async removeFromOrganization(",
  "async suspend(", "async restore(", "async resetAccess(", "async transferRole(",
  "async assignPermission(", "async revokePermission(",
]) assert.ok(service.includes(method), `ADM-068 is missing ${method}.`);

for (const action of [
  "user.invitation.created", "user.invitation.resent", "user.organization.removed",
  "user.access.suspended", "user.access.restored", "user.access.reset",
  "user.role.transferred", "user.permission.assigned", "user.permission.revoked",
]) assert.ok(service.includes(action), `ADM-068 is missing audit action ${action}.`);

assert.ok(boundary.includes("ControlledUserAdministrationUnitOfWork"));
assert.ok(boundary.includes("PlatformAdministrativeAuditEvent"));
assert.ok(firestore.includes("runTransaction"));
assert.ok(firestore.includes("transaction.create(auditRef"));
for (const collection of [
  "organizationUserInvitations", "organizationMemberships", "organizationAuthorizations", "accessRestrictions",
]) assert.ok(firestore.includes(collection), `ADM-068 Firestore boundary is missing ${collection}.`);

console.log("ADM-068 controlled user administration guardrails passed.");
