import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import type { PlatformAdministratorLifecycleRepository } from "../../domain/admin-authorization/administrator-lifecycle-repository.ts";
import type { PlatformAdministrativeAuditRepository } from "../../domain/admin-authorization/admin-audit-repository.ts";
import {
  createLifecyclePlatformAdministrativeAuditEvent,
  type LifecycleAuditExecutionContext,
} from "../../domain/admin-authorization/admin-audit-mappers.ts";
import {
  createPlatformAdministratorAccount,
  disablePlatformAdministrator,
  lockPlatformAdministrator,
  removePlatformAdministrator,
  requirePlatformAdministratorCredentialReset,
  requirePlatformAdministratorMfa,
  requirePlatformAdministratorReauthentication,
  terminatePlatformAdministratorSessions,
  updatePlatformAdministratorAccess,
  type AdministratorMutationResult,
  type CreatePlatformAdministratorAccountInput,
  type PlatformAdministratorAccount,
  type PlatformAdministratorSecurityCommandInput,
  type UpdatePlatformAdministratorAccessInput,
} from "../../domain/admin-authorization/administrator-lifecycle.ts";

export interface PrivilegedAdministratorIdentitySecurityPort {
  disable(subject: string): Promise<void>;
  revokeSessions(subject: string): Promise<void>;
}

export class AdministratorLifecycleService {
  private readonly repository: PlatformAdministratorLifecycleRepository;
  private readonly identitySecurity: PrivilegedAdministratorIdentitySecurityPort;
  private readonly audit: PlatformAdministrativeAuditRepository;

  constructor(
    repository: PlatformAdministratorLifecycleRepository,
    identitySecurity: PrivilegedAdministratorIdentitySecurityPort,
    audit: PlatformAdministrativeAuditRepository,
  ) {
    this.repository = repository;
    this.identitySecurity = identitySecurity;
    this.audit = audit;
  }

  private async persist(
    actor: PlatformAdministratorAuthorityContext,
    result: AdministratorMutationResult,
    execution: LifecycleAuditExecutionContext,
    providerEffect?: () => Promise<void>,
  ): Promise<PlatformAdministratorAccount> {
    // Build/validate the canonical event before any provider or persistence side effect.
    const auditEvent = createLifecyclePlatformAdministrativeAuditEvent(actor, result.event, execution);
    if (providerEffect) await providerEffect();
    await this.repository.save(result.account);
    await this.repository.appendEvent(result.event);
    await this.audit.append(auditEvent);
    return result.account;
  }

  async create(
    actor: PlatformAdministratorAuthorityContext,
    input: CreatePlatformAdministratorAccountInput,
  ): Promise<PlatformAdministratorAccount> {
    const result = createPlatformAdministratorAccount(actor, input);
    const existingById = await this.repository.getByAdministratorId(result.account.administratorId);
    if (existingById) throw new Error("Platform administrator id already exists.");
    const existingBySubject = await this.repository.getBySubject(result.account.subject);
    if (existingBySubject) throw new Error("Authentication subject is already assigned to a platform administrator.");
    return this.persist(actor, result, { auditEventId: `audit-${result.event.id}` });
  }

  async updateAccess(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: UpdatePlatformAdministratorAccessInput,
    execution: LifecycleAuditExecutionContext,
  ): Promise<PlatformAdministratorAccount> {
    return this.persist(actor, updatePlatformAdministratorAccess(actor, current, input), execution);
  }

  async disable(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
    execution: LifecycleAuditExecutionContext,
  ): Promise<PlatformAdministratorAccount> {
    const result = disablePlatformAdministrator(actor, current, input);
    return this.persist(actor, result, execution, () => this.identitySecurity.disable(current.subject));
  }

  async remove(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
    execution: LifecycleAuditExecutionContext,
  ): Promise<PlatformAdministratorAccount> {
    const result = removePlatformAdministrator(actor, current, input);
    return this.persist(actor, result, execution, () => this.identitySecurity.disable(current.subject));
  }

  async lock(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
    execution: LifecycleAuditExecutionContext,
  ): Promise<PlatformAdministratorAccount> {
    const result = lockPlatformAdministrator(actor, current, input);
    return this.persist(actor, result, execution, () => this.identitySecurity.disable(current.subject));
  }

  async requireCredentialReset(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
    execution: LifecycleAuditExecutionContext,
  ): Promise<PlatformAdministratorAccount> {
    const result = requirePlatformAdministratorCredentialReset(actor, current, input);
    return this.persist(actor, result, execution, () => this.identitySecurity.revokeSessions(current.subject));
  }

  async requireMfa(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
    execution: LifecycleAuditExecutionContext,
  ): Promise<PlatformAdministratorAccount> {
    const result = requirePlatformAdministratorMfa(actor, current, input);
    return this.persist(actor, result, execution, () => this.identitySecurity.revokeSessions(current.subject));
  }

  async requireReauthentication(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
    execution: LifecycleAuditExecutionContext,
  ): Promise<PlatformAdministratorAccount> {
    const result = requirePlatformAdministratorReauthentication(actor, current, input);
    return this.persist(actor, result, execution, () => this.identitySecurity.revokeSessions(current.subject));
  }

  async terminateSessions(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
    execution: LifecycleAuditExecutionContext,
  ): Promise<PlatformAdministratorAccount> {
    const result = terminatePlatformAdministratorSessions(actor, current, input);
    return this.persist(actor, result, execution, () => this.identitySecurity.revokeSessions(current.subject));
  }
}
