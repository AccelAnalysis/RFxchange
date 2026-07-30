import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const service = await readFile(new URL("../src/application/admin/controlled-user-administration.ts", import.meta.url), "utf8");
const boundary = await readFile(new URL("../src/domain/admin-authorization/controlled-user-administration-repository.ts", import.meta.url), "utf8");
const firestore = await readFile(new URL("../src/infrastructure/firestore/controlled-user-administration-unit-of-work.ts", import.meta.url), "utf8");

assert.match(service, /user\.access\.manage/);
assert.match(service, /ORGANIZATION:/);
assert.match(service, /authorizeConditionalScopedAdministrativeAction/);
assert.match(service, /createScopedAdministrativeActionRequirement/);

for (const method of [
  "async invite(",
  "async resendInvitation(",
  "async removeFromOrganization(",
  "async suspend(",
  "async restore(",
  "async resetAccess(",
  "async transferRole(",
  "async assignPermission(",
  "async revokePermission(",
]) {
  assert.ok(service.includes(method), `ADM-068 service is missing ${method}.`);
}

for (const action of [
  "user.invitation.created",
  "user.invitation.resent",
  "user.organization.removed",
  "user.access.suspended",
  "user.access.restored",
  "user.access.reset",
  "user.role.transferred",
  "user.permission.assigned",
  "user.permission.revoked",
]) {
  assert.ok(service.includes(`action: \"${action}\"`), `ADM-068 is missing audit action ${action}.`);
}

assert.match(service, /priorState/);
assert.match(service, /newState/);
assert.match(service, /planAdministrativeMembershipDeactivation/);
assert.match(service, /membershipRestrictionTarget/);
assert.match(service, /transitionAccessRestriction/);
assert.match(service, /distinct administrative approval reference/);
assert.match(boundary, /ControlledUserAdministrationUnitOfWork/);
assert.match(boundary, /auditEvent: PlatformAdministrativeAuditEvent/);
assert.match(firestore, /runTransaction/);
assert.match(firestore, /transaction\.create\(auditRef/);
assert.match(firestore, /organizationUserInvitations/);
assert.match(firestore, /organizationMemberships/);
assert.match(firestore, /organizationAuthorizations/);
assert.match(firestore, /accessRestrictions/);

console.log("ADM-068 controlled user administration guardrails passed.");
