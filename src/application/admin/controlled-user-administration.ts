import {
  authorizeConditionalScopedAdministrativeAction,
  type AdminSensitiveActionPolicy,
  type SensitiveActionEvidenceInput,
} from "../../domain/admin-authorization/conditions.ts";
import {
  createScopedAdministrativeActionRequirement,
  type AdminPermissionGrant,
} from "../../domain/admin-authorization/grants.ts";
import { createPlatformAdministrativeAuditEvent } from "../../domain/admin-authorization/admin-audit.ts";
import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import type { ControlledUserAdministrationUnitOfWork } from "../../domain/admin-authorization/controlled-user-administration-repository.ts";
import {
  defaultOrganizationRoleBundle,
  organizationRoleBundleKey,
  type OrganizationRoleBundle,
} from "../../domain/authorization/organization-role-bundles.ts";
import type { OrganizationRoleBundleRepository } from "../../domain/authorization/organization-role-bundle-repository.ts";
import {
  organizationPermission,
  type AuthorizationTimestamp,
  type OrganizationPermission,
  type OrganizationRoleKey,
  type OrganizationUserAuthorization,
} from "../../domain/authorization/model.ts";
import type { OrganizationUserAuthorizationRepository } from "../../domain/authorization/repository.ts";
import {
  createAccessRestriction,
  membershipRestrictionTarget,
  transitionAccessRestriction,
  type AccessRestrictionRecord,
} from "../../domain/lifecycle/model.ts";
import type { AccessRestrictionRepository } from "../../domain/lifecycle/repository.ts";
import type {
  OrganizationUserInvitation,
  OrganizationUserInvitationId,
  OrganizationUserInvitationTimestamp,
} from "../../domain/organization-invitations/model.ts";
import type { OrganizationUserInvitationRepository } from "../../domain/organization-invitations/repository.ts";
import type { OrganizationAccount } from "../../domain/organizations/model.ts";
import type { OrganizationMembership, UserIdentity } from "../../domain/users/model.ts";
import type { OrganizationMembershipRepository } from "../../domain/users/repository.ts";
import {
  DEFAULT_ORGANIZATION_INVITATION_TTL_DAYS,
  issueStandardOrganizationUserInvitation,
} from "../organization-access/invitations.ts";
import { planAdministrativeMembershipDeactivation } from "./membership-repair.ts";

const USER_ACCESS_MANAGE_PERMISSION = "user.access.manage" as const;

export interface ControlledUserAdministrationSecurityContext {
  readonly authenticationSubject?: string | null;
  readonly sessionId?: string | null;
  readonly deviceId?: string | null;
  readonly provider?: string | null;
  readonly mfaVerifiedAt?: string | null;
  readonly reauthenticatedAt: string;
  readonly networkContextHash?: string | null;
}

export interface ControlledUserAdministrationContext {
  readonly authority: PlatformAdministratorAuthorityContext;
  readonly grants: readonly AdminPermissionGrant[];
  readonly now: string;
  readonly auditEventId: string;
  readonly reason: string;
  readonly securityContext: ControlledUserAdministrationSecurityContext;
  readonly satisfiedGrantConditionKeys?: readonly string[];
  readonly sensitivePolicy?: AdminSensitiveActionPolicy | null;
  readonly sensitiveEvidence?: SensitiveActionEvidenceInput;
  readonly relatedCaseId?: string | null;
  readonly justification?: string | null;
  readonly evidenceReferences?: readonly string[];
  readonly approvalReferences?: readonly Readonly<{
    approvalId: string;
    approverAdministratorId: string;
  }>[];
}

type ControlledUserAdministrationDependencies = Readonly<{
  invitations: OrganizationUserInvitationRepository;
  memberships: OrganizationMembershipRepository;
  authorizations: OrganizationUserAuthorizationRepository;
  restrictions: AccessRestrictionRepository;
  roleBundles: OrganizationRoleBundleRepository;
  unitOfWork: ControlledUserAdministrationUnitOfWork;
}>;

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function timestamp(value: string, field: string): string {
  const parsed = Date.parse(required(value, field));
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString();
}

function addDays(value: string, days: number): string {
  return new Date(Date.parse(timestamp(value, "Timestamp")) + days * 86_400_000).toISOString();
}

function assertAuthorized(
  context: ControlledUserAdministrationContext,
  organization: OrganizationAccount,
): void {
  const requirement = createScopedAdministrativeActionRequirement({
    permission: USER_ACCESS_MANAGE_PERMISSION,
    access: "write",
    scope: `ORGANIZATION:${organization.id}`,
  });
  const decision = authorizeConditionalScopedAdministrativeAction(
    context.authority,
    context.grants,
    requirement,
    context.sensitivePolicy ?? null,
    {
      now: context.now,
      satisfiedGrantConditionKeys: context.satisfiedGrantConditionKeys,
      evidence: context.sensitiveEvidence,
    },
  );
  if (decision.kind === "allow") return;
  const reason = decision.phase === "authorization" ? decision.authorization.reason : decision.reason;
  throw new Error(`Controlled user administration denied: ${reason}.`);
}

function membershipSnapshot(record: OrganizationMembership): Readonly<Record<string, unknown>> {
  return Object.freeze({
    membershipId: record.id,
    userId: record.userId,
    organizationId: record.organizationId,
    status: record.status,
  });
}

function authorizationSnapshot(record: OrganizationUserAuthorization): Readonly<Record<string, unknown>> {
  return Object.freeze({
    membershipId: record.membershipId,
    userId: record.userId,
    organizationId: record.organizationId,
    roleKey: record.roleKey,
    permissions: Object.freeze([...record.permissions]),
  });
}

function invitationSnapshot(record: OrganizationUserInvitation): Readonly<Record<string, unknown>> {
  return Object.freeze({
    invitationId: record.id,
    organizationId: record.organizationId,
    email: record.email,
    roleKey: record.roleKey,
    permissions: Object.freeze([...record.permissions]),
    status: record.status,
    expiresAt: record.expiresAt,
  });
}

function restrictionSnapshot(record: AccessRestrictionRecord): Readonly<Record<string, unknown>> {
  return Object.freeze({
    restrictionId: record.id,
    targetKind: record.target.kind,
    organizationId: record.target.organizationId,
    membershipId: record.target.kind === "membership" ? record.target.membershipId : null,
    userId: record.target.kind === "membership" ? record.target.userId : null,
    state: record.state,
  });
}

function audit(
  context: ControlledUserAdministrationContext,
  input: Readonly<{
    organization: OrganizationAccount;
    userId?: string | null;
    objectType: string;
    objectId: string;
    action: string;
    priorState: Readonly<Record<string, unknown>> | null;
    newState: Readonly<Record<string, unknown>> | null;
  }>,
) {
  return createPlatformAdministrativeAuditEvent(context.authority, {
    id: context.auditEventId,
    permissionsExercised: [USER_ACCESS_MANAGE_PERMISSION],
    target: {
      organizationId: input.organization.id,
      userId: input.userId ?? null,
      objectType: input.objectType,
      objectId: input.objectId,
    },
    action: input.action,
    sensitivity: "sensitive",
    priorState: input.priorState,
    newState: input.newState,
    reason: context.reason,
    relatedCaseId: context.relatedCaseId,
    occurredAt: context.now,
    securityContext: context.securityContext,
    justification: context.justification,
    evidenceReferences: context.evidenceReferences,
    approvalReferences: context.approvalReferences,
  });
}

function replaceAuthorization(
  prior: OrganizationUserAuthorization,
  roleKey: OrganizationRoleKey,
  permissions: readonly OrganizationPermission[],
  now: string,
): OrganizationUserAuthorization {
  return Object.freeze({
    ...prior,
    roleKey,
    permissions: Object.freeze([...new Set(permissions)]),
    updatedAt: timestamp(now, "Organization authorization timestamp") as AuthorizationTimestamp,
  });
}

function renewInvitation(
  invitation: OrganizationUserInvitation,
  now: string,
  expiresAt?: string,
): OrganizationUserInvitation {
  if (invitation.status !== "pending") throw new Error("Only a pending organization invitation can be resent.");
  const renewedAt = timestamp(now, "Invitation resend timestamp");
  const expiry = timestamp(
    expiresAt ?? addDays(renewedAt, DEFAULT_ORGANIZATION_INVITATION_TTL_DAYS),
    "Invitation resend expiration timestamp",
  );
  if (Date.parse(expiry) <= Date.parse(renewedAt)) {
    throw new Error("Resent invitation expiration must follow the resend timestamp.");
  }
  return Object.freeze({
    ...invitation,
    expiresAt: expiry as OrganizationUserInvitationTimestamp,
  });
}

export class ControlledUserAdministrationService {
  private readonly dependencies: ControlledUserAdministrationDependencies;

  constructor(dependencies: ControlledUserAdministrationDependencies) {
    this.dependencies = dependencies;
  }

  private async membership(
    organization: OrganizationAccount,
    user: UserIdentity,
    membershipId: string,
  ): Promise<OrganizationMembership> {
    const memberships = await this.dependencies.memberships.listByUserId(user.id);
    const membership = memberships.find((candidate) => candidate.id === membershipId);
    if (!membership) throw new Error("Target membership does not belong to the selected user.");
    if (membership.organizationId !== organization.id) throw new Error("Target membership belongs to another organization tenant.");
    return membership;
  }

  private async authorization(membership: OrganizationMembership): Promise<OrganizationUserAuthorization> {
    const authorization = await this.dependencies.authorizations.getByMembershipId(membership.id);
    if (!authorization) throw new Error("Target membership has no organization authorization.");
    if (
      authorization.membershipId !== membership.id ||
      authorization.userId !== membership.userId ||
      authorization.organizationId !== membership.organizationId
    ) {
      throw new Error("Organization authorization does not match the selected membership.");
    }
    return authorization;
  }

  private async roleBundle(key: string): Promise<OrganizationRoleBundle> {
    const normalized = organizationRoleBundleKey(key);
    return (await this.dependencies.roleBundles.getByKey(normalized)) ?? defaultOrganizationRoleBundle(normalized);
  }

  async invite(input: Readonly<{
    context: ControlledUserAdministrationContext;
    organization: OrganizationAccount;
    sponsor: UserIdentity;
    sponsorMembership: OrganizationMembership;
    sponsorAuthorization: OrganizationUserAuthorization;
    invitationId: string;
    inviteeEmail: string;
    rolePresetKey: string;
    expiresAt?: string;
  }>): Promise<OrganizationUserInvitation> {
    assertAuthorized(input.context, input.organization);
    const existing = await this.dependencies.invitations.findPendingByOrganizationAndEmail(
      input.organization.id,
      input.inviteeEmail,
    );
    if (existing) throw new Error("A pending invitation already exists for this organization and email.");
    const invitation = issueStandardOrganizationUserInvitation({
      id: input.invitationId,
      organization: input.organization,
      inviter: input.sponsor,
      inviterMembership: input.sponsorMembership,
      inviterAuthorization: input.sponsorAuthorization,
      inviteeEmail: input.inviteeEmail,
      rolePresetKey: input.rolePresetKey,
      now: input.context.now,
      expiresAt: input.expiresAt,
    });
    await this.dependencies.unitOfWork.commit({
      mutation: { kind: "invitation", mode: "create", record: invitation },
      auditEvent: audit(input.context, {
        organization: input.organization,
        objectType: "organization-user-invitation",
        objectId: invitation.id,
        action: "user.invitation.created",
        priorState: null,
        newState: invitationSnapshot(invitation),
      }),
    });
    return invitation;
  }

  async resendInvitation(input: Readonly<{
    context: ControlledUserAdministrationContext;
    organization: OrganizationAccount;
    invitationId: string;
    expiresAt?: string;
  }>): Promise<OrganizationUserInvitation> {
    assertAuthorized(input.context, input.organization);
    const prior = await this.dependencies.invitations.getById(
      input.invitationId as OrganizationUserInvitationId,
    );
    if (!prior) throw new Error("Organization invitation was not found.");
    if (prior.organizationId !== input.organization.id) throw new Error("Organization invitation belongs to another tenant.");
    const updated = renewInvitation(prior, input.context.now, input.expiresAt);
    await this.dependencies.unitOfWork.commit({
      mutation: { kind: "invitation", mode: "update", record: updated },
      auditEvent: audit(input.context, {
        organization: input.organization,
        objectType: "organization-user-invitation",
        objectId: updated.id,
        action: "user.invitation.resent",
        priorState: invitationSnapshot(prior),
        newState: invitationSnapshot(updated),
      }),
    });
    return updated;
  }

  async removeFromOrganization(input: Readonly<{
    context: ControlledUserAdministrationContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
  }>): Promise<OrganizationMembership> {
    assertAuthorized(input.context, input.organization);
    const memberships = await this.dependencies.memberships.listByUserId(input.user.id);
    const prior = memberships.find((candidate) => candidate.id === input.membershipId);
    if (!prior) throw new Error("Target membership does not belong to the selected user.");
    if (prior.organizationId !== input.organization.id) throw new Error("Target membership belongs to another organization tenant.");
    const decision = planAdministrativeMembershipDeactivation(
      input.context.authority,
      input.user,
      memberships,
      input.membershipId,
      input.context.now,
    );
    if (decision.kind !== "allow-deactivation") {
      throw new Error("Organization removal would orphan an active user; account resolution is required.");
    }
    await this.dependencies.unitOfWork.commit({
      mutation: { kind: "membership", mode: "update", record: decision.membership },
      auditEvent: audit(input.context, {
        organization: input.organization,
        userId: input.user.id,
        objectType: "organization-membership",
        objectId: decision.membership.id,
        action: "user.organization.removed",
        priorState: membershipSnapshot(prior),
        newState: membershipSnapshot(decision.membership),
      }),
    });
    return decision.membership;
  }

  async suspend(input: Readonly<{
    context: ControlledUserAdministrationContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
    restrictionId?: string;
  }>): Promise<AccessRestrictionRecord> {
    assertAuthorized(input.context, input.organization);
    const membership = await this.membership(input.organization, input.user, input.membershipId);
    const prior = await this.dependencies.restrictions.getForMembership(membership.id);
    const updated = prior
      ? transitionAccessRestriction(prior, "suspended", input.context.now)
      : createAccessRestriction(membershipRestrictionTarget(membership, input.organization), {
          id: required(input.restrictionId ?? "", "Access restriction id"),
          state: "suspended",
          now: input.context.now,
        });
    await this.dependencies.unitOfWork.commit({
      mutation: { kind: "restriction", mode: prior ? "update" : "create", record: updated },
      auditEvent: audit(input.context, {
        organization: input.organization,
        userId: input.user.id,
        objectType: "access-restriction",
        objectId: updated.id,
        action: "user.access.suspended",
        priorState: prior ? restrictionSnapshot(prior) : null,
        newState: restrictionSnapshot(updated),
      }),
    });
    return updated;
  }

  async restore(input: Readonly<{
    context: ControlledUserAdministrationContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
  }>): Promise<AccessRestrictionRecord> {
    assertAuthorized(input.context, input.organization);
    const membership = await this.membership(input.organization, input.user, input.membershipId);
    const prior = await this.dependencies.restrictions.getForMembership(membership.id);
    if (!prior || prior.state === "none") throw new Error("Selected membership has no active restriction to restore.");
    if (prior.state === "terminated") throw new Error("Terminated access cannot be restored through normal user administration.");
    const updated = transitionAccessRestriction(prior, "none", input.context.now);
    await this.dependencies.unitOfWork.commit({
      mutation: { kind: "restriction", mode: "update", record: updated },
      auditEvent: audit(input.context, {
        organization: input.organization,
        userId: input.user.id,
        objectType: "access-restriction",
        objectId: updated.id,
        action: "user.access.restored",
        priorState: restrictionSnapshot(prior),
        newState: restrictionSnapshot(updated),
      }),
    });
    return updated;
  }

  async resetAccess(input: Readonly<{
    context: ControlledUserAdministrationContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
    approvedRoleBundleKey: string;
  }>): Promise<OrganizationUserAuthorization> {
    assertAuthorized(input.context, input.organization);
    const hasDistinctApproval = (input.context.approvalReferences ?? []).some(
      (approval) => approval.approverAdministratorId !== input.context.authority.administratorId,
    );
    if (!hasDistinctApproval) throw new Error("Approved access reset requires a distinct administrative approval reference.");
    const membership = await this.membership(input.organization, input.user, input.membershipId);
    if (membership.status !== "active") throw new Error("Access reset requires an active organization membership.");
    const prior = await this.authorization(membership);
    const bundle = await this.roleBundle(input.approvedRoleBundleKey);
    const updated = replaceAuthorization(prior, bundle.key, bundle.permissions, input.context.now);
    await this.dependencies.unitOfWork.commit({
      mutation: { kind: "authorization", mode: "update", record: updated },
      auditEvent: audit(input.context, {
        organization: input.organization,
        userId: input.user.id,
        objectType: "organization-membership-access",
        objectId: membership.id,
        action: "user.access.reset",
        priorState: authorizationSnapshot(prior),
        newState: authorizationSnapshot(updated),
      }),
    });
    return updated;
  }

  async transferRole(input: Readonly<{
    context: ControlledUserAdministrationContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
    roleBundleKey: string;
  }>): Promise<OrganizationUserAuthorization> {
    assertAuthorized(input.context, input.organization);
    const membership = await this.membership(input.organization, input.user, input.membershipId);
    if (membership.status !== "active") throw new Error("Role transfer requires an active organization membership.");
    const prior = await this.authorization(membership);
    const bundle = await this.roleBundle(input.roleBundleKey);
    const updated = replaceAuthorization(prior, bundle.key, bundle.permissions, input.context.now);
    await this.dependencies.unitOfWork.commit({
      mutation: { kind: "authorization", mode: "update", record: updated },
      auditEvent: audit(input.context, {
        organization: input.organization,
        userId: input.user.id,
        objectType: "organization-membership-access",
        objectId: membership.id,
        action: "user.role.transferred",
        priorState: authorizationSnapshot(prior),
        newState: authorizationSnapshot(updated),
      }),
    });
    return updated;
  }

  async assignPermission(input: Readonly<{
    context: ControlledUserAdministrationContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
    permission: string;
  }>): Promise<OrganizationUserAuthorization> {
    return this.changePermission(input, "assign");
  }

  async revokePermission(input: Readonly<{
    context: ControlledUserAdministrationContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
    permission: string;
  }>): Promise<OrganizationUserAuthorization> {
    return this.changePermission(input, "revoke");
  }

  private async changePermission(
    input: Readonly<{
      context: ControlledUserAdministrationContext;
      organization: OrganizationAccount;
      user: UserIdentity;
      membershipId: string;
      permission: string;
    }>,
    mode: "assign" | "revoke",
  ): Promise<OrganizationUserAuthorization> {
    assertAuthorized(input.context, input.organization);
    const membership = await this.membership(input.organization, input.user, input.membershipId);
    if (membership.status !== "active") throw new Error("Permission changes require an active organization membership.");
    const prior = await this.authorization(membership);
    const permission = organizationPermission(input.permission);
    if (mode === "revoke" && !prior.permissions.includes(permission)) {
      throw new Error(`Organization permission is not currently assigned: ${permission}.`);
    }
    const permissions = mode === "assign"
      ? Object.freeze([...new Set([...prior.permissions, permission])])
      : prior.permissions.filter((candidate) => candidate !== permission);
    const updated = replaceAuthorization(prior, prior.roleKey, permissions, input.context.now);
    const action = mode === "assign" ? "user.permission.assigned" : "user.permission.revoked";
    await this.dependencies.unitOfWork.commit({
      mutation: { kind: "authorization", mode: "update", record: updated },
      auditEvent: audit(input.context, {
        organization: input.organization,
        userId: input.user.id,
        objectType: "organization-membership-access",
        objectId: membership.id,
        action,
        priorState: authorizationSnapshot(prior),
        newState: authorizationSnapshot(updated),
      }),
    });
    return updated;
  }
}
