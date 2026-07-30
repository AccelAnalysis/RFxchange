import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY } from "../src/domain/admin-authorization/privileged-security.ts";

assert.equal(DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY.requireMfa, true);
assert.ok(DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY.maxSessionAgeMinutes <= 30);
assert.ok(DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY.maxIdleMinutes <= 15);
assert.ok(DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY.sensitiveReauthenticationMaxAgeMinutes <= 5);
assert.equal(DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY.notifyOnEveryLogin, true);
assert.equal(DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY.alertOnNewDevice, true);
assert.equal(DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY.alertOnRiskSignals, true);
assert.equal(DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY.requireExplicitProductionAuthority, true);

const domain = await readFile("src/domain/admin-authorization/privileged-security.ts", "utf8");
assert.equal(/firebase-admin|firebase\//.test(domain), false, "privileged security domain must remain provider-independent");
for (const token of [
  "mfa-required",
  "session-expired",
  "session-idle-expired",
  "sensitive-reauthentication-required",
  "production-authority-required",
  "privileged.login.anomaly",
  "privileged.login.new-device",
]) assert.match(domain, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

const repository = await readFile("src/infrastructure/firestore/privileged-admin-security-repository.ts", "utf8");
assert.match(repository, /privilegedAdministratorSessions/);
assert.match(repository, /privilegedAdministratorDevices/);
assert.match(repository, /privilegedAdministratorSecurityEvents/);
assert.match(repository, /transaction\.create/);

const service = await readFile("src/application/admin/privileged-security-service.ts", "utf8");
assert.match(service, /PrivilegedSecurityNotificationPort/);
assert.match(service, /appendSecurityEvent/);
assert.match(service, /revokeDevice/);
assert.match(service, /authorize/);

console.log("ADM-088 privileged administrator security baseline guardrails validated.");
