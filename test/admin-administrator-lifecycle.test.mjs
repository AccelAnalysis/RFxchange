import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";
import {
  createPlatformAdministratorAccount,
  disablePlatformAdministrator,
  evaluatePrivilegedAdministratorAccess,
  lifecyclePermissionKeys,
  lockPlatformAdministrator,
  removePlatformAdministrator,
  requirePlatformAdministratorCredentialReset,
  requirePlatformAdministratorMfa,
  requirePlatformAdministratorReauthentication,
  terminatePlatformAdministratorSessions,
  updatePlatformAdministratorAccess,
} from "../src/domain/admin-authorization/administrator-lifecycle.ts";

const t0 = "2026-07-30T10:00:00.000Z";
const superAdmin = resolveAuthorityContextFromAdminRolePreset(
  "admin-root",
  defaultAdminRolePreset("super-admin"),
);
const platformAdmin = resolveAuthorityContextFromAdminRolePreset(
  "admin-ops",
  defaultAdminRolePreset("platform-administrator"),
);

function create(overrides = {}) {
  return createPlatformAdministratorAccount(superAdmin, {
    administratorId: "admin-target",
    subject: "firebase-uid-target",
    rolePresetKeys: ["platform-administrator"],
    scopeLimits: ["GEOGRAPHY:51095"],
    eventId: "evt-create",
    reason: "Create delegated administrator",
    occurredAt: t0,
    ...overrides,
  });
}

function provider(overrides = {}) {
  return {
    provider: "firebase",
    subject: "firebase-uid-target",
    email: "admin@example.com",
    emailVerified: true,
    disabled: false,
    mfaEnrolled: true,
    tokensValidAfter: null,
    lastSignInAt: "2026-07-30T10:10:00.000Z",
    ...overrides,
  };
}

test("Slice 1.15 permissions are catalogued and default only to Super Admin", () => {
  const permissions = lifecyclePermissionKeys();
  assert.equal(permissions.length, 9);
  for (const permission of permissions) {
    assert.ok(superAdmin.effectivePermissions.includes(permission), `${permission} must be in Super Admin`);
    assert.equal(platformAdmin.effectivePermissions.includes(permission), false, `${permission} must not default to Platform Administrator`);
  }
});

test("Super Admin creates a scoped non-protected administrator with immutable audit evidence", () => {
  const result = create();
  assert.equal(result.account.status, "active");
  assert.equal(result.account.scopeLimits[0].value, "GEOGRAPHY:51095");
  assert.deepEqual(result.account.access.rolePresetKeys, ["platform-administrator"]);
  assert.equal(result.event.action, "administrator.created");
  assert.equal(result.event.permission, "admin.lifecycle.create");
  assert.equal(result.event.before, null);
  assert.equal(result.event.after.scopeLimits[0], "GEOGRAPHY:51095");
  assert.ok(Object.isFrozen(result.account));
  assert.ok(Object.isFrozen(result.event));
});

test("ordinary Platform Administrator cannot administer administrator lifecycle", () => {
  assert.throws(
    () =>
      createPlatformAdministratorAccount(platformAdmin, {
        administratorId: "admin-nope",
        subject: "firebase-nope",
        rolePresetKeys: ["platform-administrator"],
        eventId: "evt-nope",
        reason: "Should be denied",
        occurredAt: t0,
      }),
    /permission-not-granted/,
  );
});

test("access review state supports role, permission and scope changes with before/after evidence", () => {
  const current = create().account;
  const result = updatePlatformAdministratorAccess(superAdmin, current, {
    rolePresetKeys: ["member-success-support-administrator", "platform-administrator"],
    addedPermissions: ["system.health.read"],
    removedPermissions: ["rfx.moderation.review"],
    scopeLimits: ["ORGANIZATION:org-alpha", "CASE:case-17"],
    eventId: "evt-access",
    reason: "Limit support access to assigned records",
    occurredAt: "2026-07-30T10:05:00.000Z",
  });
  assert.deepEqual(result.account.access.rolePresetKeys, [
    "member-success-support-administrator",
    "platform-administrator",
  ]);
  assert.deepEqual(result.account.scopeLimits.map((scope) => scope.value), [
    "ORGANIZATION:org-alpha",
    "CASE:case-17",
  ]);
  assert.equal(result.event.before.scopeLimits[0], "GEOGRAPHY:51095");
  assert.equal(result.event.after.scopeLimits[0], "ORGANIZATION:org-alpha");
});

test("protected accounts cannot be disabled, removed, access-edited or security-locked", () => {
  const protectedAccount = create({ administratorId: "admin-bootstrap", subject: "bootstrap", protectedAccount: true }).account;
  const command = { eventId: "evt-protected", reason: "Attempt protected mutation", occurredAt: "2026-07-30T10:05:00.000Z" };
  assert.throws(() => disablePlatformAdministrator(superAdmin, protectedAccount, command), /Protected administrator accounts/);
  assert.throws(() => updatePlatformAdministratorAccess(superAdmin, protectedAccount, { rolePresetKeys: ["analyst-auditor"], ...command }), /Protected administrator accounts/);
  assert.throws(() => lockPlatformAdministrator(superAdmin, protectedAccount, command), /Protected administrator accounts/);
});

test("administrator removal requires prior disable and both transitions are audited", () => {
  const active = create().account;
  assert.throws(
    () => removePlatformAdministrator(superAdmin, active, { eventId: "evt-remove-early", reason: "Remove", occurredAt: "2026-07-30T10:05:00.000Z" }),
    /must be disabled before removal/,
  );
  const disabled = disablePlatformAdministrator(superAdmin, active, {
    eventId: "evt-disable",
    reason: "Employment ended",
    occurredAt: "2026-07-30T10:05:00.000Z",
  });
  assert.equal(disabled.account.status, "disabled");
  assert.equal(disabled.event.permission, "admin.lifecycle.disable");
  const removed = removePlatformAdministrator(superAdmin, disabled.account, {
    eventId: "evt-remove",
    reason: "Complete administrator removal",
    occurredAt: "2026-07-30T10:06:00.000Z",
  });
  assert.equal(removed.account.status, "removed");
  assert.equal(removed.event.before.status, "disabled");
  assert.equal(removed.event.after.status, "removed");
});

test("credential/session controls produce restrictive state and terminate current sessions", () => {
  const active = create().account;
  const reset = requirePlatformAdministratorCredentialReset(superAdmin, active, {
    eventId: "evt-reset",
    reason: "Suspected credential exposure",
    occurredAt: "2026-07-30T10:05:00.000Z",
  });
  assert.equal(reset.account.security.credentialResetRequired, true);
  assert.equal(reset.account.security.sessionsTerminatedAt, "2026-07-30T10:05:00.000Z");

  const mfa = requirePlatformAdministratorMfa(superAdmin, active, {
    eventId: "evt-mfa",
    reason: "Privileged account requires MFA",
    occurredAt: "2026-07-30T10:06:00.000Z",
  });
  assert.equal(mfa.account.security.mfaRequired, true);

  const reauth = requirePlatformAdministratorReauthentication(superAdmin, active, {
    eventId: "evt-reauth",
    reason: "Sensitive access requires fresh authentication",
    occurredAt: "2026-07-30T10:07:00.000Z",
  });
  assert.equal(reauth.account.security.reauthenticationRequiredAfter, "2026-07-30T10:07:00.000Z");

  const sessions = terminatePlatformAdministratorSessions(superAdmin, active, {
    eventId: "evt-session",
    reason: "Terminate all privileged sessions",
    occurredAt: "2026-07-30T10:08:00.000Z",
  });
  assert.equal(sessions.account.security.sessionsTerminatedAt, "2026-07-30T10:08:00.000Z");

  const locked = lockPlatformAdministrator(superAdmin, active, {
    eventId: "evt-lock",
    reason: "Security incident",
    occurredAt: "2026-07-30T10:09:00.000Z",
  });
  assert.equal(locked.account.security.locked, true);
  assert.equal(locked.account.security.sessionsTerminatedAt, "2026-07-30T10:09:00.000Z");
});

test("privileged access gate enforces lock/reset/MFA/re-auth/provider revocation", () => {
  const active = create().account;
  assert.deepEqual(evaluatePrivilegedAdministratorAccess({ account: active, provider: provider(), authenticatedAt: "2026-07-30T10:10:00.000Z" }), { allowed: true });

  const locked = lockPlatformAdministrator(superAdmin, active, { eventId: "evt-lock2", reason: "Incident", occurredAt: "2026-07-30T10:09:00.000Z" }).account;
  assert.equal(evaluatePrivilegedAdministratorAccess({ account: locked, provider: provider(), authenticatedAt: "2026-07-30T10:10:00.000Z" }).reason, "administrator-locked");

  const reset = requirePlatformAdministratorCredentialReset(superAdmin, active, { eventId: "evt-reset2", reason: "Reset", occurredAt: "2026-07-30T10:09:00.000Z" }).account;
  assert.equal(evaluatePrivilegedAdministratorAccess({ account: reset, provider: provider(), authenticatedAt: "2026-07-30T10:10:00.000Z" }).reason, "credential-reset-required");

  const mfa = requirePlatformAdministratorMfa(superAdmin, active, { eventId: "evt-mfa2", reason: "MFA", occurredAt: "2026-07-30T10:09:00.000Z" }).account;
  assert.equal(evaluatePrivilegedAdministratorAccess({ account: mfa, provider: provider({ mfaEnrolled: false }), authenticatedAt: "2026-07-30T10:10:00.000Z" }).reason, "mfa-required");

  const reauth = requirePlatformAdministratorReauthentication(superAdmin, active, { eventId: "evt-reauth2", reason: "Reauth", occurredAt: "2026-07-30T10:09:00.000Z" }).account;
  assert.equal(evaluatePrivilegedAdministratorAccess({ account: reauth, provider: provider(), authenticatedAt: "2026-07-30T10:09:00.000Z" }).reason, "recent-reauthentication-required");
  assert.deepEqual(evaluatePrivilegedAdministratorAccess({ account: reauth, provider: provider(), authenticatedAt: "2026-07-30T10:10:00.000Z" }), { allowed: true });

  assert.equal(evaluatePrivilegedAdministratorAccess({ account: active, provider: provider({ disabled: true }), authenticatedAt: "2026-07-30T10:10:00.000Z" }).reason, "provider-account-disabled");
  assert.equal(evaluatePrivilegedAdministratorAccess({ account: active, provider: provider({ tokensValidAfter: "2026-07-30T10:11:00.000Z" }), authenticatedAt: "2026-07-30T10:10:00.000Z" }).reason, "provider-credential-revoked");
});
