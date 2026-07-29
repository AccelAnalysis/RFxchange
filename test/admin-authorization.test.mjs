import test from "node:test";
import assert from "node:assert/strict";

import {
  ADMIN_PERMISSION_CATALOG,
  ADMIN_PERMISSION_NAMESPACES,
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  createPlatformAdministratorAuthorityContext,
  requireCataloguedAdminPermission,
} from "../src/domain/admin-authorization/model.ts";

function context(overrides = {}) {
  return createPlatformAdministratorAuthorityContext({
    administratorId: "admin-alpha",
    rolePresetKeys: ["platform-administrator"],
    effectivePermissions: ["organization.profile.read", "credibility.organization.verify"],
    ...overrides,
  });
}

test("defines all required administrative permission namespaces", () => {
  assert.deepEqual(ADMIN_PERMISSION_NAMESPACES, [
    "platform",
    "admin",
    "config",
    "organization",
    "user",
    "rfx",
    "credibility",
    "provider",
    "referral",
    "commerce",
    "geography",
    "support",
    "trust",
    "analytics",
    "audit",
    "system",
  ]);

  const represented = new Set(ADMIN_PERMISSION_CATALOG.map((definition) => definition.namespace));
  for (const namespace of ADMIN_PERMISSION_NAMESPACES) {
    assert.ok(represented.has(namespace), `catalog must include ${namespace}`);
  }
});

test("permission keys are catalogued and unknown permissions are rejected", () => {
  assert.equal(requireCataloguedAdminPermission("organization.profile.read"), "organization.profile.read");
  assert.throws(
    () => requireCataloguedAdminPermission("organization.secret.superpower"),
    /not in the catalog/,
  );
  assert.throws(
    () => requireCataloguedAdminPermission("ORGANIZATION.profile.read"),
    /namespaced lowercase segments/,
  );
});

test("protected action authorizes from named permission rather than role name", () => {
  const requirement = createAdministrativeActionRequirement({
    permission: "organization.profile.read",
  });

  const platformAdmin = context({ rolePresetKeys: ["platform-administrator"] });
  const opaqueFutureRole = context({ rolePresetKeys: ["future-configurable-role"] });

  assert.equal(authorizeAdministrativeAction(platformAdmin, requirement).kind, "allow");
  assert.equal(authorizeAdministrativeAction(opaqueFutureRole, requirement).kind, "allow");
});

test("role preset reference alone never grants a protected action", () => {
  const noPermissions = context({
    rolePresetKeys: ["super-admin"],
    effectivePermissions: [],
  });
  const requirement = createAdministrativeActionRequirement({
    permission: "system.health.read",
  });

  assert.deepEqual(authorizeAdministrativeAction(noPermissions, requirement), {
    kind: "deny",
    administratorId: noPermissions.administratorId,
    permission: requirement.permission,
    reason: "permission-not-granted",
  });
});

test("administrative authority context cannot be created without role context", () => {
  assert.throws(
    () =>
      context({
        rolePresetKeys: [],
      }),
    /requires at least one role preset reference/,
  );
});

test("credibility powers are independently grantable per administrator", () => {
  const verifier = context({
    effectivePermissions: ["credibility.organization.verify"],
  });
  const verify = createAdministrativeActionRequirement({
    permission: "credibility.organization.verify",
  });
  const revoke = createAdministrativeActionRequirement({
    permission: "credibility.badge.revoke",
  });

  assert.equal(authorizeAdministrativeAction(verifier, verify).kind, "allow");
  assert.deepEqual(authorizeAdministrativeAction(verifier, revoke), {
    kind: "deny",
    administratorId: verifier.administratorId,
    permission: revoke.permission,
    reason: "permission-not-granted",
  });
});

test("explicit scope resolution participates in every authorization decision", () => {
  const requirement = createAdministrativeActionRequirement({
    permission: "organization.profile.read",
  });
  const denied = context({ scopeSatisfied: false });

  assert.deepEqual(authorizeAdministrativeAction(denied, requirement), {
    kind: "deny",
    administratorId: denied.administratorId,
    permission: requirement.permission,
    reason: "scope-not-satisfied",
  });
});

test("pre-resolved condition requirement must be satisfied before authorization", () => {
  const requirement = createAdministrativeActionRequirement({
    permission: "credibility.organization.verify",
    conditions: "pre-resolved",
  });
  const blocked = context({
    conditions: {
      requirement: "pre-resolved",
      status: "unsatisfied",
      evidenceKeys: ["justification"],
    },
  });
  const satisfied = context({
    conditions: {
      requirement: "pre-resolved",
      status: "satisfied",
      evidenceKeys: ["justification"],
    },
  });

  assert.equal(authorizeAdministrativeAction(blocked, requirement).kind, "deny");
  assert.equal(authorizeAdministrativeAction(satisfied, requirement).kind, "allow");
});

test("authority context is immutable and deduplicates roles and permissions", () => {
  const authority = context({
    rolePresetKeys: ["platform-administrator", "platform-administrator"],
    effectivePermissions: ["organization.profile.read", "organization.profile.read"],
  });

  assert.deepEqual(authority.rolePresetKeys, ["platform-administrator"]);
  assert.deepEqual(authority.effectivePermissions, ["organization.profile.read"]);
  assert.ok(Object.isFrozen(authority));
  assert.ok(Object.isFrozen(authority.rolePresetKeys));
  assert.ok(Object.isFrozen(authority.effectivePermissions));
  assert.ok(Object.isFrozen(authority.scope));
  assert.ok(Object.isFrozen(authority.conditions));
});
