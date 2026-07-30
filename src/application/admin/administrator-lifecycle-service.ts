import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import type { PlatformAdministratorLifecycleRepository } from "../../domain/admin-authorization/administrator-lifecycle-repository.ts";
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

  constructor(
    repository: PlatformAdministratorLifecycleRepository,
    identitySecurity: PrivilegedAdministratorIdentitySecurityPort,
  ) {
    this.repository = repository;
    this.identitySecurity = identitySecurity;
  }

  private async persist(result: AdministratorMutationResult): Promise<PlatformAdministratorAccount> {
    await this.repository.save(result.account);
    await this.repository.appendEvent(result.event);
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
    return this.persist(result);
  }

  async updateAccess(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: UpdatePlatformAdministratorAccessInput,
  ): Promise<PlatformAdministratorAccount> {
    return this.persist(updatePlatformAdministratorAccess(actor, current, input));
  }

  async disable(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
  ): Promise<PlatformAdministratorAccount> {
    const result = disablePlatformAdministrator(actor, current, input);
    await this.identitySecurity.disable(current.subject);
    return this.persist(result);
  }

  async remove(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
  ): Promise<PlatformAdministratorAccount> {
    const result = removePlatformAdministrator(actor, current, input);
    await this.identitySecurity.disable(current.subject);
    return this.persist(result);
  }

  async lock(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
  ): Promise<PlatformAdministratorAccount> {
    const result = lockPlatformAdministrator(actor, current, input);
    await this.identitySecurity.disable(current.subject);
    return this.persist(result);
  }

  async requireCredentialReset(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
  ): Promise<PlatformAdministratorAccount> {
    const result = requirePlatformAdministratorCredentialReset(actor, current, input);
    await this.identitySecurity.revokeSessions(current.subject);
    return this.persist(result);
  }

  async requireMfa(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
  ): Promise<PlatformAdministratorAccount> {
    const result = requirePlatformAdministratorMfa(actor, current, input);
    await this.identitySecurity.revokeSessions(current.subject);
    return this.persist(result);
  }

  async requireReauthentication(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
  ): Promise<PlatformAdministratorAccount> {
    const result = requirePlatformAdministratorReauthentication(actor, current, input);
    await this.identitySecurity.revokeSessions(current.subject);
    return this.persist(result);
  }

  async terminateSessions(
    actor: PlatformAdministratorAuthorityContext,
    current: PlatformAdministratorAccount,
    input: PlatformAdministratorSecurityCommandInput,
  ): Promise<PlatformAdministratorAccount> {
    const result = terminatePlatformAdministratorSessions(actor, current, input);
    await this.identitySecurity.revokeSessions(current.subject);
    return this.persist(result);
  }
}
