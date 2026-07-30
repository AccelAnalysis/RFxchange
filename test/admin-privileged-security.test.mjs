import test from "node:test";
import assert from "node:assert/strict";

import { createPlatformAdministratorAccount, disablePlatformAdministrator } from "../src/domain/admin-authorization/administrator-lifecycle.ts";
import { defaultAdminRolePreset, resolveAuthorityContextFromAdminRolePreset } from "../src/domain/admin-authorization/role-presets.ts";
import {
  DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY,
  evaluatePrivilegedSessionAccess,
  revokePrivilegedDevice,
  revokePrivilegedSession,
  startPrivilegedAdministratorSession,
} from "../src/domain/admin-authorization/privileged-security.ts";

const root = resolveAuthorityContextFromAdminRolePreset("admin-root", defaultAdminRolePreset("super-admin"));
const authority = resolveAuthorityContextFromAdminRolePreset("admin-target", defaultAdminRolePreset("platform-administrator"));

function account() {
  return createPlatformAdministratorAccount(root, {
    administratorId: "admin-target",
    subject: "firebase-target",
    rolePresetKeys: ["platform-administrator"],
    eventId: "evt-create",
    reason: "Create admin",
    occurredAt: "2026-07-30T12:00:00.000Z",
  }).account;
}

function provider(overrides = {}) {
  return {
    provider: "firebase",
    subject: "firebase-target",
    email: "admin@example.com",
    emailVerified: true,
    disabled: false,
    mfaEnrolled: true,
    tokensValidAfter: null,
    lastSignInAt: "2026-07-30T12:01:00.000Z",
    ...overrides,
  };
}

function start(overrides = {}) {
  return startPrivilegedAdministratorSession(account(), provider(), {
    sessionId: "session-1",
    deviceId: "device-1",
    deviceLabel: "Admin MacBook",
    occurredAt: "2026-07-30T12:02:00.000Z",
    authenticatedAt: "2026-07-30T12:01:00.000Z",
    mfaVerifiedAt: "2026-07-30T12:01:30.000Z",
    loginEventId: "evt-login",
    newDeviceEventId: "evt-new-device",
    ...overrides,
  });
}

test("privileged baseline is stricter than normal authentication defaults", () => {
  assert.equal(DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY.requireMfa, true);
  assert.equal(DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY.maxSessionAgeMinutes, 30);
  assert.equal(DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY.maxIdleMinutes, 15);
  assert.equal(DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY.sensitiveReauthenticationMaxAgeMinutes, 5);
  assert.equal(DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY.requireExplicitProductionAuthority, true);
});

test("privileged login requires MFA and records login/new-device notification evidence", () => {
  assert.throws(
    () => startPrivilegedAdministratorSession(account(), provider({ mfaEnrolled: false }), {
      sessionId: "session-no-mfa",
      deviceId: "device-no-mfa",
      deviceLabel: "Unknown",
      occurredAt: "2026-07-30T12:02:00.000Z",
      authenticatedAt: "2026-07-30T12:01:00.000Z",
      mfaVerifiedAt: "2026-07-30T12:01:30.000Z",
      loginEventId: "evt-no-mfa",
      newDeviceEventId: "evt-no-mfa-device",
    }),
    /MFA|mfa/i,
  );

  const result = start();
  assert.equal(result.session.status, "active");
  assert.equal(result.device.status, "trusted");
  assert.deepEqual(result.events.map((event) => event.type), ["privileged.login", "privileged.login.new-device"]);
  assert.deepEqual(result.notifications.map((intent) => intent.kind), ["privileged-login", "new-device"]);
});

test("known device does not produce duplicate new-device alert", () => {
  const first = start();
  const result = start({
    sessionId: "session-2",
    loginEventId: "evt-login-2",
    knownDevice: first.device,
    newDeviceEventId: undefined,
  });
  assert.deepEqual(result.events.map((event) => event.type), ["privileged.login"]);
  assert.deepEqual(result.notifications.map((intent) => intent.kind), ["privileged-login"]);
});

test("anomalous-access risk signals create security event and alert intent", () => {
  const result = start({
    riskSignals: ["impossible-travel", "provider-risk"],
    anomalyEventId: "evt-anomaly",
  });
  assert.ok(result.events.some((event) => event.type === "privileged.login.anomaly"));
  assert.ok(result.notifications.some((intent) => intent.kind === "anomalous-access"));
});

test("short session, idle and sensitive re-authentication limits are enforced", () => {
  const { session, device } = start();
  assert.deepEqual(evaluatePrivilegedSessionAccess({ account: account(), authority, provider: provider(), session, device, now: "2026-07-30T12:10:00.000Z" }), { allowed: true });
  assert.equal(evaluatePrivilegedSessionAccess({ account: account(), authority, provider: provider(), session, device, now: "2026-07-30T12:20:00.000Z" }).reason, "session-idle-expired");
  assert.equal(evaluatePrivilegedSessionAccess({ account: account(), authority, provider: provider(), session: { ...session, lastActivityAt: "2026-07-30T12:32:00.000Z" }, device, now: "2026-07-30T12:33:00.000Z" }).reason, "session-expired");
  assert.equal(evaluatePrivilegedSessionAccess({ account: account(), authority, provider: provider(), session, device, now: "2026-07-30T12:07:00.000Z", sensitivity: "sensitive" }).reason, "sensitive-reauthentication-required");
  assert.deepEqual(evaluatePrivilegedSessionAccess({ account: account(), authority, provider: provider(), session, device, now: "2026-07-30T12:05:00.000Z", sensitivity: "sensitive" }), { allowed: true });
});

test("device and session revocation immediately block privileged access and emit events", () => {
  const started = start();
  const revokedSession = revokePrivilegedSession(started.session, { eventId: "evt-revoke-session", occurredAt: "2026-07-30T12:03:00.000Z", detail: "Administrator terminated session." });
  assert.equal(evaluatePrivilegedSessionAccess({ account: account(), authority, provider: provider(), session: revokedSession.session, device: started.device, now: "2026-07-30T12:04:00.000Z" }).reason, "session-revoked");
  assert.equal(revokedSession.event.type, "privileged.session.revoked");

  const revokedDevice = revokePrivilegedDevice(started.device, { eventId: "evt-revoke-device", occurredAt: "2026-07-30T12:03:00.000Z", detail: "Device retired." });
  assert.equal(evaluatePrivilegedSessionAccess({ account: account(), authority, provider: provider(), session: started.session, device: revokedDevice.device, now: "2026-07-30T12:04:00.000Z" }).reason, "device-revoked");
  assert.equal(revokedDevice.event.type, "privileged.device.revoked");
});

test("immediate administrator disable is honored by every privileged session", () => {
  const started = start();
  const disabled = disablePlatformAdministrator(root, account(), {
    eventId: "evt-disable",
    reason: "Immediate security disable",
    occurredAt: "2026-07-30T12:03:00.000Z",
  }).account;
  assert.equal(evaluatePrivilegedSessionAccess({ account: disabled, authority, provider: provider(), session: started.session, device: started.device, now: "2026-07-30T12:04:00.000Z" }).reason, "administrator-security");
});

test("production access is separate from ordinary privileged authority", () => {
  const ordinary = start();
  assert.equal(evaluatePrivilegedSessionAccess({ account: account(), authority, provider: provider(), session: ordinary.session, device: ordinary.device, now: "2026-07-30T12:04:00.000Z", production: true }).reason, "production-authority-required");

  const evidence = {
    grantId: "prod-grant-1",
    administratorId: account().administratorId,
    grantedByAdministratorId: root.administratorId,
    grantedAt: "2026-07-30T12:00:00.000Z",
    expiresAt: "2026-07-30T12:20:00.000Z",
  };
  const elevated = start({ productionAuthority: evidence });
  assert.deepEqual(evaluatePrivilegedSessionAccess({ account: account(), authority, provider: provider(), session: elevated.session, device: elevated.device, now: "2026-07-30T12:04:00.000Z", production: true }), { allowed: true });

  assert.throws(() => start({ productionAuthority: { ...evidence, grantedByAdministratorId: account().administratorId } }), /cannot be self-granted/);
});

test("privileged session baseline never replaces named permission authorization", () => {
  const started = start();
  assert.equal(evaluatePrivilegedSessionAccess({ account: account(), authority, provider: provider(), session: started.session, device: started.device, now: "2026-07-30T12:04:00.000Z", requiredPermission: "credibility.organization.verify" }).reason, "permission-not-granted");
  assert.deepEqual(evaluatePrivilegedSessionAccess({ account: account(), authority, provider: provider(), session: started.session, device: started.device, now: "2026-07-30T12:04:00.000Z", requiredPermission: "organization.profile.read" }), { allowed: true });
});
