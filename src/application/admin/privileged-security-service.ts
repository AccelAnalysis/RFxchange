import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import type { PlatformAdministratorAccount } from "../../domain/admin-authorization/administrator-lifecycle.ts";
import type { PrivilegedAdministratorSecurityRepository } from "../../domain/admin-authorization/privileged-security-repository.ts";
import {
  DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY,
  evaluatePrivilegedSessionAccess,
  revokePrivilegedDevice,
  revokePrivilegedSession,
  startPrivilegedAdministratorSession,
  type PrivilegedAdminSecurityPolicy,
  type PrivilegedAdministratorDevice,
  type PrivilegedAdministratorSession,
  type PrivilegedProviderSecuritySnapshot,
  type PrivilegedSecurityNotificationIntent,
  type StartPrivilegedAdministratorSessionInput,
} from "../../domain/admin-authorization/privileged-security.ts";

export interface PrivilegedSecurityNotificationPort {
  deliver(intent: PrivilegedSecurityNotificationIntent): Promise<void>;
}

export class PrivilegedAdministratorSecurityService {
  private readonly repository: PrivilegedAdministratorSecurityRepository;
  private readonly notifications: PrivilegedSecurityNotificationPort;
  private readonly policy: PrivilegedAdminSecurityPolicy;

  constructor(
    repository: PrivilegedAdministratorSecurityRepository,
    notifications: PrivilegedSecurityNotificationPort,
    policy: PrivilegedAdminSecurityPolicy = DEFAULT_PRIVILEGED_ADMIN_SECURITY_POLICY,
  ) {
    this.repository = repository;
    this.notifications = notifications;
    this.policy = policy;
  }

  async startSession(
    account: PlatformAdministratorAccount,
    provider: PrivilegedProviderSecuritySnapshot,
    input: StartPrivilegedAdministratorSessionInput,
  ): Promise<PrivilegedAdministratorSession> {
    const knownDevice = await this.repository.getDevice(input.deviceId as never);
    const result = startPrivilegedAdministratorSession(account, provider, {
      ...input,
      knownDevice,
    }, this.policy);
    await this.repository.saveDevice(result.device);
    await this.repository.saveSession(result.session);
    for (const event of result.events) await this.repository.appendSecurityEvent(event);
    for (const intent of result.notifications) await this.notifications.deliver(intent);
    return result.session;
  }

  async revokeSession(
    session: PrivilegedAdministratorSession,
    input: Readonly<{ eventId: string; occurredAt: string; detail: string }>,
  ): Promise<PrivilegedAdministratorSession> {
    const result = revokePrivilegedSession(session, input);
    await this.repository.saveSession(result.session);
    await this.repository.appendSecurityEvent(result.event);
    return result.session;
  }

  async revokeDevice(
    device: PrivilegedAdministratorDevice,
    activeSessions: readonly PrivilegedAdministratorSession[],
    input: Readonly<{ eventId: string; occurredAt: string; detail: string; sessionEventIdPrefix: string }>,
  ): Promise<PrivilegedAdministratorDevice> {
    const result = revokePrivilegedDevice(device, input);
    await this.repository.saveDevice(result.device);
    await this.repository.appendSecurityEvent(result.event);
    let index = 0;
    for (const session of activeSessions.filter((candidate) => candidate.deviceId === device.id && candidate.status === "active")) {
      index += 1;
      await this.revokeSession(session, {
        eventId: `${input.sessionEventIdPrefix}-${index}`,
        occurredAt: input.occurredAt,
        detail: "Session revoked because its privileged device was revoked.",
      });
    }
    return result.device;
  }

  authorize(input: Readonly<{
    account: PlatformAdministratorAccount;
    authority: PlatformAdministratorAuthorityContext;
    provider: PrivilegedProviderSecuritySnapshot;
    session: PrivilegedAdministratorSession;
    device: PrivilegedAdministratorDevice;
    now: string;
    sensitivity?: "normal" | "sensitive";
    production?: boolean;
    requiredPermission?: string;
  }>) {
    return evaluatePrivilegedSessionAccess({ ...input, policy: this.policy });
  }
}
