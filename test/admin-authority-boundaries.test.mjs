import test from "node:test";
import assert from "node:assert/strict";

import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  createPlatformAdministratorAuthorityContext,
} from "../src/domain/admin-authorization/model.ts";
import {
  defaultAdminRolePreset,
  permissionsFromAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";
import {
  ADMINISTRATIVE_SEPARATION_INVARIANTS,
  CROSS_DOMAIN_ADMIN_PROHIBITED_ACTIONS,
  MARKETPLACE_ADMIN_PROHIBITED_ACTIONS,
  RESERVED_SUPER_ADMIN_ACTIONS,
  RESERVED_SUPER_ADMIN_REQUIREMENTS,
  authorizeAdministrativeBoundaryAction,
  evaluateAndRecordAdministrativeBoundary,
} from "../src/domain/admin-authorization/authority-boundaries.ts";

const superAdmin = resolveAuthorityContextFromAdminRolePreset("admin-root", defaultAdminRolePreset("super-admin"));
const platformAdmin = resolveAuthorityContextFromAdminRolePreset("admin-ops", defaultAdminRolePreset("platform-administrator"));
const marketplaceAdmin = resolveAuthorityContextFromAdminRolePreset("admin-market", defaultAdminRolePreset("rfx-marketplace-administrator"));
const technicalAdmin = resolveAuthorityContextFromAdminRolePreset("admin-tech", defaultAdminRolePreset("technical-system-administrator"));

function eventInput(id = "boundary-1") {
  return { eventId: id, reason: "Boundary acceptance test", occurredAt: "2026-07-30T14:00:00.000Z" };
}

test("all reserved actions require multiple named capabilities and Super Admin satisfies them by default", () => {
  assert.equal(RESERVED_SUPER_ADMIN_ACTIONS.length, 14);
  for (const action of RESERVED_SUPER_ADMIN_ACTIONS) {
    assert.ok(RESERVED_SUPER_ADMIN_REQUIREMENTS[action].length >= 3, `${action} must require composite reserved authority`);
    assert.equal(authorizeAdministrativeBoundaryAction(superAdmin, action).kind, "allow", action);
    const ordinary = authorizeAdministrativeBoundaryAction(platformAdmin, action);
    assert.equal(ordinary.kind, "deny", action);
    assert.equal(ordinary.reason, "reserved-authority-not-satisfied", action);
    assert.ok(ordinary.missingPermissions.length > 0, action);
  }
});

test("ordinary Platform Administrator can daily operations but not reserved powers", () => {
  for (const permission of [
    "organization.profile.update",
    "support.case.update",
    "rfx.moderation.review",
    "provider.application.review",
  ]) {
    assert.equal(
      authorizeAdministrativeAction(platformAdmin, createAdministrativeActionRequirement({ permission })).kind,
      "allow",
      permission,
    );
  }
  for (const action of [
    "super-admin.grant",
    "organization.permanent-terminate",
    "production-integration.manage",
    "destructive-data-operation.approve",
  ]) {
    assert.equal(authorizeAdministrativeBoundaryAction(platformAdmin, action).kind, "deny", action);
  }
});

test("marketplace administrator is support/repair authority and never issuer decision authority", () => {
  assert.ok(permissionsFromAdminRolePreset(defaultAdminRolePreset("rfx-marketplace-administrator")).includes("rfx.moderation.review"));
  for (const action of MARKETPLACE_ADMIN_PROHIBITED_ACTIONS) {
    const decision = authorizeAdministrativeBoundaryAction(marketplaceAdmin, action);
    assert.deepEqual(decision, {
      kind: "deny",
      administratorId: marketplaceAdmin.administratorId,
      action,
      reason: "issuer-authority-required",
      missingPermissions: [],
    });
  }
  // Even broad platform ownership authority does not turn the admin path into the issuer path.
  assert.equal(authorizeAdministrativeBoundaryAction(superAdmin, "rfx.winner.select").kind, "deny");
});

test("denied marketplace actions produce attributable immutable boundary events", () => {
  const result = evaluateAndRecordAdministrativeBoundary(
    marketplaceAdmin,
    "rfx.evaluator-score.change",
    eventInput("boundary-marketplace-denied"),
  );
  assert.equal(result.decision.kind, "deny");
  assert.equal(result.event.administratorId, marketplaceAdmin.administratorId);
  assert.equal(result.event.action, "rfx.evaluator-score.change");
  assert.equal(result.event.outcome, "denied");
  assert.ok(Object.isFrozen(result.event));
});

test("technical administrator can operate infrastructure without marketplace/governance authority", () => {
  const permissions = permissionsFromAdminRolePreset(defaultAdminRolePreset("technical-system-administrator"));
  assert.ok(permissions.includes("system.health.read"));
  assert.ok(permissions.includes("system.maintenance.request"));
  for (const protectedPermission of [
    "credibility.organization.verify",
    "credibility.badge.award",
    "commerce.adjustment.review",
    "rfx.moderation.review",
    "admin.lifecycle.remove",
  ]) {
    assert.equal(permissions.includes(protectedPermission), false, protectedPermission);
  }
  assert.equal(authorizeAdministrativeBoundaryAction(technicalAdmin, "organization.permanent-terminate").kind, "deny");
  assert.equal(authorizeAdministrativeBoundaryAction(technicalAdmin, "production-integration.manage").kind, "deny");
});

test("verification permission does not imply endorsement permission", () => {
  const verifierOnly = createPlatformAdministratorAuthorityContext({
    administratorId: "admin-verifier-only",
    rolePresetKeys: ["custom-verifier"],
    effectivePermissions: ["credibility.organization.verify"],
  });
  assert.equal(
    authorizeAdministrativeAction(
      verifierOnly,
      createAdministrativeActionRequirement({ permission: "credibility.organization.verify" }),
    ).kind,
    "allow",
  );
  assert.equal(
    authorizeAdministrativeAction(
      verifierOnly,
      createAdministrativeActionRequirement({ permission: "credibility.endorsement.issue" }),
    ).kind,
    "deny",
  );
});

test("cross-domain administrative assumptions are categorically denied", () => {
  for (const action of CROSS_DOMAIN_ADMIN_PROHIBITED_ACTIONS) {
    const result = authorizeAdministrativeBoundaryAction(superAdmin, action);
    assert.equal(result.kind, "deny", action);
    assert.equal(result.reason, "separation-of-authority", action);
  }
});

test("governing principle codifies all nine separation invariants", () => {
  assert.deepEqual(ADMINISTRATIVE_SEPARATION_INVARIANTS.map((item) => item.key), [
    "verification-not-endorsement",
    "membership-not-credibility",
    "payment-not-matching-rank",
    "admin-not-issuer",
    "institutional-admin-not-business-owner",
    "support-not-user-impersonation",
    "technical-not-marketplace",
    "access-removal-preserves-evidence",
    "admin-actions-attributable",
  ]);
});
