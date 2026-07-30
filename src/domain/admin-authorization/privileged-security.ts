import type { PlatformAdministratorAuthorityContext, PlatformAdministratorId } from "./model.ts";
import {
  evaluatePrivilegedAdministratorAccess,
  type PlatformAdministratorAccount,
} from "./administrator-lifecycle.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type PrivilegedSessionId = Brand<string, "PrivilegedSessionId">;
export type PrivilegedDeviceId = Brand<string, "PrivilegedDeviceId">;
export type PrivilegedSecurityEventId = Brand<string, "PrivilegedSecurityEventId">;
export type PrivilegedSecurityTimestamp = Brand<string, "PrivilegedSecurityTimestamp">;
export type ProductionAuthorityGrantId = Brand<string, "ProductionAuthorityGrantId">;

export const DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY = Object.freeze({
  requireMfa: true,
  maxSessionAgeMinutes: 30,
  maxIdleMinutes: 15,
  sensitiveReauthenticationMaxAgeMinutes: 5,
  notifyOnEveryLogin: true,
  alertOnNewDevice: true,
  alertOnRiskSignals: true,
  requireExplicitProductionAuthority: true,
});

export type PrivilegedAdminSecurityPolicy = typeof DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY;

export type PrivilegedDeviceStatus = "trusted" | "revoked";
export type PrivilegedSessionStatus = "active" | "revoked";

export interface PrivilegedAdministratorDevice {
  readonly id: PrivilegedDeviceId;
  readonly administratorId: PlatformAdministratorId;
  readonly label: string;
  readonly status: PrivilegedDeviceStatus;
  readonly firstSeenAt: PrivilegedSecurityTimestamp;
  readonly lastSeenAt: PrivilegedSecurityTimestamp;
  readonly revokedAt: PrivilegedSecurityTimestamp | null;
}

export interface ProductionAuthorityEvidence {
  readonly grantId: ProductionAuthorityGrantId;
  readonly administratorId: PlatformAdministratorId;
  readonly grantedByAdministratorId: PlatformAdministratorId;
  readonly grantedAt: PrivilegedSecurityTimestamp;
  readonly expiresAt: PrivilegedSecurityTimestamp;
}

export interface PrivilegedAdministratorSession {
  readonly id: PrivilegedSessionId;
  readonly administratorId: PlatformAdministratorId;
  readonly deviceId: PrivilegedDeviceId;
  readonly status: PrivilegedSessionStatus;
  readonly createdAt: PrivilegedSecurityTimestamp;
  readonly authenticatedAt: PrivilegedSecurityTimestamp;
  readonly lastActivityAt: PrivilegedSecurityTimestamp;
  readonly mfaVerifiedAt: PrivilegedSecurityTimestamp;
  readonly revokedAt: PrivilegedSecurityTimestamp | null;
  readonly productionAuthority: ProductionAuthorityEvidence | null;
}

export type PrivilegedSecurityEventType =
  | "privileged.login"
  | "privileged.login.new-device"
  | "privileged.login.anomaly"
  | "privileged.session.revoked"
  | "privileged.device.revoked"
  | "privileged.access.denied";

export interface PrivilegedSecurityEvent {
  readonly id: PrivilegedSecurityEventId;
  readonly administratorId: PlatformAdministratorId;
  readonly sessionId: PrivilegedSessionId | null;
  readonly deviceId: PrivilegedDeviceId | null;
  readonly type: PrivilegedSecurityEventType;
  readonly occurredAt: PrivilegedSecurityTimestamp;
  readonly riskSignals: readonly PrivilegedRiskSignal[];
  readonly detail: string;
}

export type PrivilegedRiskSignal =
  | "new-device"
  | "impossible-travel"
  | "provider-risk"
  | "repeated-authentication-failure"
  | "unexpected-production-request";

export interface PrivilegedSecurityNotificationIntent {
  readonly administratorId: PlatformAdministratorId;
  readonly kind: "privileged-login" | "new-device" | "anomalous-access";
  readonly occurredAt: PrivilegedSecurityTimestamp;
  readonly detail: string;
}

export interface PrivilegedProviderSecuritySnapshot {
  readonly provider: string;
  readonly subject: string;
  readonly email: string | null;
  readonly emailVerified: boolean;
  readonly disabled: boolean;
  readonly mfaEnrolled: boolean;
  readonly tokensValidAfter: string | null;
  readonly lastSignInAt: string | null;
}

export interface StartPrivilegedAdministratorSessionInput {
  readonly sessionId: string;
  readonly deviceId: string;
  readonly deviceLabel: string;
  readonly occurredAt: string;
  readonly authenticatedAt: string;
  readonly mfaVerifiedAt: string;
  readonly knownDevice?: PrivilegedAdministratorDevice | null;
  readonly riskSignals?: readonly PrivilegedRiskSignal[];
  readonly productionAuthority?: ProductionAuthorityEvidence | null;
  readonly loginEventId: string;
  readonly newDeviceEventId?: string;
  readonly anomalyEventId?: string;
}

export interface StartPrivilegedAdministratorSessionResult {
  readonly device: PrivilegedAdministratorDevice;
  readonly session: PrivilegedAdministratorSession;
  readonly events: readonly PrivilegedSecurityEvent[];
  readonly notifications: readonly PrivilegedSecurityNotificationIntent[];
}

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function timestamp(value: string, field: string): PrivilegedSecurityTimestamp {
  const normalized = requiredValue(value, field);
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString() as PrivilegedSecurityTimestamp;
}

function sessionId(value: string): PrivilegedSessionId {
  return requiredValue(value, "Privileged session id") as PrivilegedSessionId;
}

function deviceId(value: string): PrivilegedDeviceId {
  return requiredValue(value, "Privileged device id") as PrivilegedDeviceId;
}

function eventId(value: string): PrivilegedSecurityEventId {
  return requiredValue(value, "Privileged security event id") as PrivilegedSecurityEventId;
}

function uniqueRiskSignals(values: readonly PrivilegedRiskSignal[] = []): readonly PrivilegedRiskSignal[] {
  return Object.freeze([...new Set(values)]);
}

function minutesBetween(earlier: string, later: string): number {
  return (Date.parse(later) - Date.parse(earlier)) / 60_000;
}

function validateProductionAuthority(
  evidence: ProductionAuthorityEvidence | null | undefined,
  administratorId: PlatformAdministratorId,
  now: PrivilegedSecurityTimestamp,
): ProductionAuthorityEvidence | null {
  if (!evidence) return null;
  if (evidence.administratorId !== administratorId) {
    throw new Error("Production authority belongs to a different administrator.");
  }
  if (evidence.grantedByAdministratorId === administratorId) {
    throw new Error("Production authority cannot be self-granted.");
  }
  if (Date.parse(evidence.grantedAt) > Date.parse(now)) {
    throw new Error("Production authority cannot begin in the future.");
  }
  if (Date.parse(evidence.expiresAt) <= Date.parse(now)) {
    throw new Error("Production authority is expired.");
  }
  return evidence;
}

function securityEvent(input: Readonly<{
  id: string;
  administratorId: PlatformAdministratorId;
  sessionId?: PrivilegedSessionId | null;
  deviceId?: PrivilegedDeviceId | null;
  type: PrivilegedSecurityEventType;
  occurredAt: PrivilegedSecurityTimestamp;
  riskSignals?: readonly PrivilegedRiskSignal[];
  detail: string;
}>): PrivilegedSecurityEvent {
  return Object.freeze({
    id: eventId(input.id),
    administratorId: input.administratorId,
    sessionId: input.sessionId ?? null,
    deviceId: input.deviceId ?? null,
    type: input.type,
    occurredAt: input.occurredAt,
    riskSignals: uniqueRiskSignals(input.riskSignals),
    detail: requiredValue(input.detail, "Privileged security event detail"),
  });
}

export function startPrivilegedAdministratorSession(
  account: PlatformAdministratorAccount,
  provider: PrivilegedProviderSecuritySnapshot,
  input: StartPrivilegedAdministratorSessionInput,
  policy: PrivilegedAdminSecurityPolicy = DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY,
): StartPrivilegedAdministratorSessionResult {
  const occurredAt = timestamp(input.occurredAt, "Privileged login timestamp");
  const authenticatedAt = timestamp(input.authenticatedAt, "Privileged authentication timestamp");
  const mfaVerifiedAt = timestamp(input.mfaVerifiedAt, "Privileged MFA verification timestamp");
  const baseAccess = evaluatePrivilegedAdministratorAccess({ account, provider, authenticatedAt });
  if (!baseAccess.allowed) throw new Error(`Privileged login denied: ${baseAccess.reason}.`);
  if (policy.requireMfa && !provider.mfaEnrolled) throw new Error("Privileged login requires enrolled MFA.");
  if (Date.parse(mfaVerifiedAt) > Date.parse(occurredAt)) throw new Error("MFA verification cannot occur after login issuance.");

  const id = deviceId(input.deviceId);
  const known = input.knownDevice ?? null;
  if (known && known.administratorId !== account.administratorId) throw new Error("Privileged device belongs to a different administrator.");
  if (known && known.id !== id) throw new Error("Known privileged device identity does not match the requested device.");
  if (known?.status === "revoked") throw new Error("Revoked privileged device cannot start a session.");

  const device: PrivilegedAdministratorDevice = known
    ? Object.freeze({ ...known, lastSeenAt: occurredAt })
    : Object.freeze({
        id,
        administratorId: account.administratorId,
        label: requiredValue(input.deviceLabel, "Privileged device label"),
        status: "trusted" as const,
        firstSeenAt: occurredAt,
        lastSeenAt: occurredAt,
        revokedAt: null,
      });

  const session: PrivilegedAdministratorSession = Object.freeze({
    id: sessionId(input.sessionId),
    administratorId: account.administratorId,
    deviceId: device.id,
    status: "active" as const,
    createdAt: occurredAt,
    authenticatedAt,
    lastActivityAt: occurredAt,
    mfaVerifiedAt,
    revokedAt: null,
    productionAuthority: validateProductionAuthority(input.productionAuthority, account.administratorId, occurredAt),
  });

  const risks = uniqueRiskSignals([
    ...(!known ? (["new-device"] as const) : []),
    ...(input.riskSignals ?? []),
  ]);
  const events: PrivilegedSecurityEvent[] = [
    securityEvent({
      id: input.loginEventId,
      administratorId: account.administratorId,
      sessionId: session.id,
      deviceId: device.id,
      type: "privileged.login",
      occurredAt,
      riskSignals: risks,
      detail: "Privileged administrator login established.",
    }),
  ];
  const notifications: PrivilegedSecurityNotificationIntent[] = [];
  if (policy.notifyOnEveryLogin) {
    notifications.push(Object.freeze({ administratorId: account.administratorId, kind: "privileged-login" as const, occurredAt, detail: "A privileged administrator session was established." }));
  }
  if (!known && policy.alertOnNewDevice) {
    if (!input.newDeviceEventId) throw new Error("New privileged device requires a security event id.");
    events.push(securityEvent({ id: input.newDeviceEventId, administratorId: account.administratorId, sessionId: session.id, deviceId: device.id, type: "privileged.login.new-device", occurredAt, riskSignals: ["new-device"], detail: "Privileged login used a newly registered device." }));
    notifications.push(Object.freeze({ administratorId: account.administratorId, kind: "new-device" as const, occurredAt, detail: "A new device was used for privileged administrator access." }));
  }
  const anomalous = risks.filter((risk) => risk !== "new-device");
  if (anomalous.length > 0 && policy.alertOnRiskSignals) {
    if (!input.anomalyEventId) throw new Error("Anomalous privileged access requires a security event id.");
    events.push(securityEvent({ id: input.anomalyEventId, administratorId: account.administratorId, sessionId: session.id, deviceId: device.id, type: "privileged.login.anomaly", occurredAt, riskSignals: anomalous, detail: "Privileged login contained anomalous-access risk signals." }));
    notifications.push(Object.freeze({ administratorId: account.administratorId, kind: "anomalous-access" as const, occurredAt, detail: "An anomalous privileged administrator login was detected." }));
  }
  return Object.freeze({ device, session, events: Object.freeze(events), notifications: Object.freeze(notifications) });
}

export type PrivilegedSessionAccessDecision =
  | Readonly<{ readonly allowed: true }>
  | Readonly<{ readonly allowed: false; readonly reason: "administrator-security" | "session-revoked" | "device-revoked" | "session-expired" | "session-idle-expired" | "sensitive-reauthentication-required" | "production-authority-required" | "permission-not-granted" }>;

export function evaluatePrivilegedSessionAccess(input: Readonly<{
  account: PlatformAdministratorAccount;
  authority: PlatformAdministratorAuthorityContext;
  provider: PrivilegedProviderSecuritySnapshot;
  session: PrivilegedAdministratorSession;
  device: PrivilegedAdministratorDevice;
  now: string;
  sensitivity?: "normal" | "sensitive";
  production?: boolean;
  requiredPermission?: string;
  policy?: PrivilegedAdminSecurityPolicy;
}>): PrivilegedSessionAccessDecision {
  const policy = input.policy ?? DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY;
  const now = timestamp(input.now, "Privileged access evaluation timestamp");
  const base = evaluatePrivilegedAdministratorAccess({ account: input.account, provider: input.provider, authenticatedAt: input.session.authenticatedAt });
  if (!base.allowed) return Object.freeze({ allowed: false as const, reason: "administrator-security" as const });
  if (input.session.administratorId !== input.account.administratorId || input.device.administratorId !== input.account.administratorId || input.session.deviceId !== input.device.id) {
    return Object.freeze({ allowed: false as const, reason: "administrator-security" as const });
  }
  if (input.session.status === "revoked") return Object.freeze({ allowed: false as const, reason: "session-revoked" as const });
  if (input.device.status === "revoked") return Object.freeze({ allowed: false as const, reason: "device-revoked" as const });
  if (minutesBetween(input.session.createdAt, now) > policy.maxSessionAgeMinutes) return Object.freeze({ allowed: false as const, reason: "session-expired" as const });
  if (minutesBetween(input.session.lastActivityAt, now) > policy.maxIdleMinutes) return Object.freeze({ allowed: false as const, reason: "session-idle-expired" as const });
  if (input.sensitivity === "sensitive" && minutesBetween(input.session.authenticatedAt, now) > policy.sensitiveReauthenticationMaxAgeMinutes) {
    return Object.freeze({ allowed: false as const, reason: "sensitive-reauthentication-required" as const });
  }
  if (input.production && policy.requireExplicitProductionAuthority) {
    const grant = input.session.productionAuthority;
    if (!grant || Date.parse(grant.expiresAt) <= Date.parse(now)) return Object.freeze({ allowed: false as const, reason: "production-authority-required" as const });
  }
  if (input.requiredPermission && !input.authority.effectivePermissions.includes(input.requiredPermission as never)) {
    return Object.freeze({ allowed: false as const, reason: "permission-not-granted" as const });
  }
  return Object.freeze({ allowed: true as const });
}

export function revokePrivilegedSession(
  session: PrivilegedAdministratorSession,
  input: Readonly<{ eventId: string; occurredAt: string; detail: string }>,
): Readonly<{ session: PrivilegedAdministratorSession; event: PrivilegedSecurityEvent }> {
  const occurredAt = timestamp(input.occurredAt, "Privileged session revocation timestamp");
  const revoked = Object.freeze({ ...session, status: "revoked" as const, revokedAt: occurredAt });
  return Object.freeze({
    session: revoked,
    event: securityEvent({ id: input.eventId, administratorId: session.administratorId, sessionId: session.id, deviceId: session.deviceId, type: "privileged.session.revoked", occurredAt, detail: input.detail }),
  });
}

export function revokePrivilegedDevice(
  device: PrivilegedAdministratorDevice,
  input: Readonly<{ eventId: string; occurredAt: string; detail: string }>,
): Readonly<{ device: PrivilegedAdministratorDevice; event: PrivilegedSecurityEvent }> {
  const occurredAt = timestamp(input.occurredAt, "Privileged device revocation timestamp");
  const revoked = Object.freeze({ ...device, status: "revoked" as const, revokedAt: occurredAt, lastSeenAt: occurredAt });
  return Object.freeze({
    device: revoked,
    event: securityEvent({ id: input.eventId, administratorId: device.administratorId, deviceId: device.id, type: "privileged.device.revoked", occurredAt, detail: input.detail }),
  });
}
