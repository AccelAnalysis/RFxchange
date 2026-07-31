import type { AuthenticationAccountSecurityReader } from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import { createOrganizationUserAuthorization } from "../../domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../../domain/authorization/organization-role-presets.ts";
import {
  advanceAccessLifecycle,
  type AccessLifecycleRecord,
} from "../../domain/lifecycle/model.ts";
import type { OrganizationAccount } from "../../domain/organizations/model.ts";
import type { OrganizationAuthorityClaimUnitOfWork } from "../../domain/organization-claims/repository.ts";
import {
  createOrganizationMembership,
  type OrganizationMembership,
} from "../../domain/users/model.ts";

export class ParticipantCreatedOrganizationAuthorityService {
  constructor(
    private readonly unitOfWork: OrganizationAuthorityClaimUnitOfWork,
    private readonly accountSecurity: AuthenticationAccountSecurityReader,
    private readonly ids: Readonly<{ membership(): string; audit(): string }>,
    private readonly now: () => string,
  ) {}

  async establish(input: Readonly<{
    context: AuthenticatedServerContext;
    organization: OrganizationAccount;
    lifecycle: AccessLifecycleRecord;
  }>): Promise<Readonly<{
    membership: OrganizationMembership;
    lifecycle: AccessLifecycleRecord;
  }>> {
    if (
      input.lifecycle.userId !== input.context.user.id ||
      input.lifecycle.state !== "organization-resolved"
    ) {
      throw new Error(
        "Participant-created organization authority requires the creator's organization-resolved journey.",
      );
    }
    const account = await this.accountSecurity.inspect(input.context.authentication.subject);
    if (account.disabled) throw new Error("Firebase account is disabled.");
    if (!account.emailVerified) throw new Error("Email verification is required before organization authority is established.");

    const now = this.now();
    const membership = createOrganizationMembership(input.context.user, input.organization, {
      id: this.ids.membership(),
      now,
    });
    const preset = standardOrganizationRolePreset("primary-administrator");
    const authorization = createOrganizationUserAuthorization(membership, input.organization, {
      roleKey: preset.key,
      permissions: preset.permissions,
      now,
    });
    const lifecycle = advanceAccessLifecycle(
      input.lifecycle,
      "organization-registered",
      now,
    );
    const auditEvent = createOrganizationActionAuditEvent(
      input.context.user,
      membership,
      input.organization,
      {
        id: this.ids.audit(),
        action: "organization.authority.creator-established",
        occurredAt: now,
      },
    );
    await this.unitOfWork.establishParticipantCreated({
      membership,
      authorization,
      lifecycle,
      auditEvent,
    });
    return Object.freeze({ membership, lifecycle });
  }
}
