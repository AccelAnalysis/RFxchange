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
  OrganizationUserInvitationTimestamp,
} from "../../domain/organization-invitations/model.ts";
import type { OrganizationUserInvitationRepository } from "../../domain/organization-invitations/repository.ts";
import type { OrganizationAccount } from "../../domain/organizations/model.ts";
import {
  type OrganizationMembership,
  type UserIdentity,
  type UserTimestamp,
} from "../../domain/users/model.ts";
import type { OrganizationMembershipRepository } from "../../domain/users/repository.ts";
import {
  DEFAULT_ORGANIZATION_INVITATION_TTL_DAYS,
  issueStandardOrganizationUserInvitation,
} from "../organization-access/invitations.ts";
import { planAdministrativeMembershipDeactivation } from "./membership-repair.ts";

const USER_ACCESS_MANAGE_PERMISSION = "user.access.manage" as const;

export interface ControlledUserAdministrationSecurityEvidence {
  readonly authenticationSubject?: string | null;
  readonly sessionId?: string | null;
  readonly deviceId?: string | null;
  readonly provider?: string | null;
  readonly mfaVerifiedAt?: string | null;
  readonly reauthenticatedAt: string;
  readonly networkContextHash?: string | null;
}

export interface ControlledUserAdministrationApprovalReference {
  readonly approvalId: string;
  readonly approverAdministratorId: string;
}

export interface ControlledUserAdministrationActionContext {
  readonly authority: PlatformAdministratorAuthorityContext;
  readonly grants: readonly AdminPermissionGrant[];
  readonly now: string;
  readonly auditEventId: string;
  readonly reason: string;
  readonly security: ControlledUserAdministrationSecurityEvidence;
  readonly satisfiedGrantConditionKeys?: readonly string[];
  readonly sensitivePolicy?: AdminSensitiveActionPolicy | null;
  readonly sensitiveEvidence?: SensitiveActionEvidenceInput;
  readonly relatedCaseId?: string | null;
  readonly justification?: string | null;
  readonly evidenceReferences?: readonly string[];
  readonly approvalReferences?: readonly ControlledUserAdministrationApprovalReference[];
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function iso(value: string, label: string): string {
  const parsed = Date.parse(required(value, label));
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid date-time.`);
  return new Date(parsed).toISOString();
}

function addDays(value: string, days: number): string {
  const parsed = Date.parse(iso(value, "Controlled user administration timestamp"));
  return new Date(parsed + days * 24 * 60 * 60 * 1000).toISOString();
}

function organizationScope(organization: OrganizationAccount): `ORGANIZATION:${string}` {
  return `ORGANIZATION:${organization.id}`;
}

function assertOrganizationScopedAdministrationAuthorized(
  context: ControlledUserAdministrationActionContext,
  organization: OrganizationAccount,
): void {
  const requirement = createScopedAdministrativeActionRequirement({
    permission: USER_ACCESS_MANAGE_PERMISSION,
    access: "write",
    scope: organizationScope(organization),
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
  if (decision.kind === "deny") {
    const reason = decision.phase === "authorization"
      ? decision.authorization.reason
      : decision.reason;
    throw new Error(`Controlled user administration denied: ${reason}.`);
  }
}

function auditInput(
  context: ControlledUserAdministrationActionContext,
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
    securityContext: context.security,
    justification: context.justification,
    evidenceReferences: context.evidenceReferences,
    approvalReferences: context.approvalReferences,
  });
}

function membershipState(membership: OrganizationMembership): Readonly<Record<string, unknown>> {
  return Object.freeze({
    membershipId: membership.id,
    userId: membership.userId,
    organizationId: membership.organizationId,
    status: membership.status,
  });
}

function authorizationState(
  authorization: OrganizationUserAuthorization,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    membershipId: authorization.membershipId,
    userId: authorization.userId,
    organizationId: authorization.organizationId,
    roleKey: authorization.roleKey,
    permissions: Object.freeze([...authorization.permissions]),
  });
}

function invitationState(
  invitation: OrganizationUserInvitation,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    invitationId: invitation.id,
    organizationId: invitation.organizationId,
    email: invitation.email,
    roleKey: invitation.roleKey,
    permissions: Object.freeze([...invitation.permissions]),
    status: invitation.status,
    expiresAt: invitation.expiresAt,
  });
}

function restrictionState(
  restriction: AccessRestrictionRecord,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    restrictionId: restriction.id,
    targetKind: restriction.target.kind,
    organizationId: restriction.target.organizationId,
    membershipId: restriction.target.kind === "membership" ? restriction.target.membershipId : null,
    userId: restriction.target.kind === "membership" ? restriction.target.userId : null,
    state: restriction.state,
  });
}

function renewedInvitation(
  invitation: OrganizationUserInvitation,
  now: string,
  expiresAt?: string,
): OrganizationUserInvitation {
  if (invitation.status !== "pending") {
    throw new Error("Only a pending organization invitation can be resent.");
  }
  const resentAt = iso(now, "Invitation resend timestamp");
  const expiry = iso(
    expiresAt ?? addDays(resentAt, DEFAULT_ORGANIZATION_INVITATION_TTL_DAYS),
    "Invitation resend expiration timestamp",
  );
  if (Date.parse(expiry) <= Date.parse(resentAt)) {
    throw new Error("Resent invitation expiration must be after the resend timestamp.");
  }
  return Object.freeze({
    ...invitation,
    expiresAt: expiry as OrganizationUserInvitationTimestamp,
  });
}

function updatedAuthorization(
  prior: OrganizationUserAuthorization,
  input: Readonly<{
    roleKey?: string;
    permissions?: readonly OrganizationPermission[];
    now: string;
  }>,
): OrganizationUserAuthorization {
  return Object.freeze({
    ...prior,
    ...(input.roleKey ? { roleKey: organizationRoleBundleKey(input.roleKey) } : {}),
    ...(input.permissions ? { permissions: Object.freeze([...new Set(input.permissions)]) } : {}),
    updatedAt: iso(input.now, "Organization authorization update timestamp") as AuthorizationTimestamp,
  });
}

export class ControlledUserAdministrationService {
  private readonly invitations: OrganizationUserInvitationRepository;
  private readonly memberships: OrganizationMembershipRepository;
  private readonly authorizations: OrganizationUserAuthorizationRepository;
  private readonly restrictions: AccessRestrictionRepository;
  private readonly roleBundles: OrganizationRoleBundleRepository;
  private readonly unitOfWork: ControlledUserAdministrationUnitOfWork;

  constructor(input: Readonly<{
    invitations: OrganizationUserInvitationRepository;
    memberships: OrganizationMembershipRepository;
    authorizations: OrganizationUserAuthorizationRepository;
    restrictions: AccessRestrictionRepository;
    roleBundles: OrganizationRoleBundleRepository;
    unitOfWork: ControlledUserAdministrationUnitOfWork;
  }>) {
    this.invitations = input.invitations;
    this.memberships = input.memberships;
    this.authorizations = input.authorizations;
    this.restrictions = input.restrictions;
    this.roleBundles = input.roleBundles;
    this.unitOfWork = input.unitOfWork;
  }

  private async targetMembership(
    organization: OrganizationAccount,
    user: UserIdentity,
    membershipId: string,
  ): Promise<OrganizationMembership> {
    const memberships = await this.memberships.listByUserId(user.id);
    const membership = memberships.find((candidate) => candidate.id === membershipId);
    if (!membership) throw new Error("Target organization membership does not belong to the selected user.");
    if (membership.organizationId !== organization.id) {
      throw new Error("Target organization membership belongs to a different organization tenant.");
    }
    return membership;
  }

  private async targetAuthorization(
    membership: OrganizationMembership,
  ): Promise<OrganizationUserAuthorization> {
    const authorization = await this.authorizations.getByMembershipId(membership.id);
    if (!authorization) throw new Error("Target membership has no organization authorization record.");
    if (
      authorization.membershipId !== membership.id ||
      authorization.userId !== membership.userId ||
      authorization.organizationId !== membership.organizationId
    ) {
      throw new Error("Target organization authorization does not match the selected membership.");
    }
    return authorization;
  }

  private async resolveRoleBundle(key: string): Promise<OrganizationRoleBundle> {
    const normalized = organizationRoleBundleKey(key);
    return (await this.roleBundles.getByKey(normalized)) ?? defaultOrganizationRoleBundle(normalized);
  }

  async invite(input: Readonly<{
    context: ControlledUserAdministrationActionContext;
    organization: OrganizationAccount;
    sponsor: UserIdentity;
    sponsorMembership: OrganizationMembership;
    sponsorAuthorization: OrganizationUserAuthorization;
    invitationId: string;
    inviteeEmail: string;
    rolePresetKey: string;
    expiresAt?: string;
  }>): Promise<OrganizationUserInvitation> {
    assertOrganizationScopedAdministrationAuthorized(input.context, input.organization);
    const duplicate = await this.invitations.findPendingByOrganizationAndEmail(
      input.organization.id,
      input.inviteeEmail,
    );
    if (duplicate) throw new Error("A pending invitation already exists for this email and organization.");

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
    const auditEvent = auditInput(input.context, {
      organization: input.organization,
      objectType: "organization-user-invitation",
      objectId: invitation.id,
      action: "user.invitation.created",
      priorState: null,
      newState: invitationState(invitation),
    });
    await this.unitOfWork.commit({
      mutation: { kind: "invitation", mode: "create", record: invitation },
      auditEvent,
    });
    return invitation;
  }

  async resendInvitation(input: Readonly<{
    context: ControlledUserAdministrationActionContext;
    organization: OrganizationAccount;
    invitationId: string;
    expiresAt?: string;
  }>): Promise<OrganizationUserInvitation> {
    assertOrganizationScopedAdministrationAuthorized(input.context, input.organization);
    const invitation = await this.invitations.getById(input.invitationId as OrganizationUserInvitation["id"]);
    if (!invitation) throw new Error("Organization invitation was not found.");
    if (invitation.organizationId !== input.organization.id) {
      throw new Error("Organization invitation belongs to a different organization tenant.");
    }
    const updated = renewedInvitation(invitation, input.context.now, input.expiresAt);
    const auditEvent = auditInput(input.context, {
      organization: input.organization,
      objectType: "organization-user-invitation",
      objectId: updated.id,
      action: "user.invitation.resent",
      priorState: invitationState(invitation),
      newState: invitationState(updated),
    });
    await this.unitOfWork.commit({
      mutation: { kind: "invitation", mode: "update", record: updated },
      auditEvent,
    });
    return updated;
  }

  async removeFromOrganization(input: Readonly<{
    context: ControlledUserAdministrationActionContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
  }>): Promise<OrganizationMembership> {
    assertOrganizationScopedAdministrationAuthorized(input.context, input.organization);
    const memberships = await this.memberships.listByUserId(input.user.id);
    const target = memberships.find((candidate) => candidate.id === input.membershipId);
    if (!target) throw new Error("Target organization membership does not belong to the selected user.");
    if (target.organizationId !== input.organization.id) {
      throw new Error("Target organization membership belongs to a different organization tenant.");
    }
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
    const auditEvent = auditInput(input.context, {
      organization: input.organization,
      userId: input.user.id,
      objectType: "organization-membership",
      objectId: decision.membership.id,
      action: "user.organization.removed",
      priorState: membershipState(target),
      newState: membershipState(decision.membership),
    });
    await this.unitOfWork.commit({
      mutation: { kind: "membership", mode: "update", record: decision.membership },
      auditEvent,
    });
    return decision.membership;
  }

  async suspend(input: Readonly<{
    context: ControlledUserAdministrationActionContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
    restrictionId?: string;
  }>): Promise<AccessRestrictionRecord> {
    assertOrganizationScopedAdministrationAuthorized(input.context, input.organization);
    const membership = await this.targetMembership(input.organization, input.user, input.membershipId);
    const prior = await this.restrictions.getForMembership(membership.id);
    const updated = prior
      ? transitionAccessRestriction(prior, "suspended", input.context.now)
      : createAccessRestriction(membershipRestrictionTarget(membership, input.organization), {
          id: required(input.restrictionId ?? "", "Access restriction id"),
          state: "suspended",
          now: input.context.now,
        });
    const auditEvent = auditInput(input.context, {
      organization: input.organization,
      userId: input.user.id,
      objectType: "access-restriction",
      objectId: updated.id,
      action: "user.access.suspended",
      priorState: prior ? restrictionState(prior) : null,
      newState: restrictionState(updated),
    });
    await this.unitOfWork.commit({
      mutation: { kind: "restriction", mode: prior ? "update" : "create", record: updated },
      auditEvent,
    });
    return updated;
  }

  async restore(input: Readonly<{
    context: ControlledUserAdministrationActionContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
  }>): Promise<AccessRestrictionRecord> {
    assertOrganizationScopedAdministrationAuthorized(input.context, input.organization);
    const membership = await this.targetMembership(input.organization, input.user, input.membershipId);
    const prior = await this.restrictions.getForMembership(membership.id);
    if (!prior || prior.state === "none") {
      throw new Error("Selected user membership has no active restriction to restore.");
    }
    if (prior.state === "terminated") {
      throw new Error("Terminated access cannot be restored through normal user administration.");
    }
    const updated = transitionAccessRestriction(prior, "none", input.context.now);
    const auditEvent = auditInput(input.context, {
      organization: input.organization,
      userId: input.user.id,
      objectType: "access-restriction",
      objectId: updated.id,
      action: "user.access.restored",
      priorState: restrictionState(prior),
      newState: restrictionState(updated),
    });
    await this.unitOfWork.commit({
      mutation: { kind: "restriction", mode: "update", record: updated },
      auditEvent,
    });
    return updated;
  }

  async resetAccess(input: Readonly<{
    context: ControlledUserAdministrationActionContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
    approvedRoleBundleKey: string;
  }>): Promise<OrganizationUserAuthorization> {
    assertOrganizationScopedAdministrationAuthorized(input.context, input.organization);
    const approvals = input.context.approvalReferences ?? [];
    if (!approvals.some((approval) => approval.approverAdministratorId !== input.context.authority.administratorId)) {
      throw new Error("Approved access reset requires a distinct administrative approval reference.");
    }
    const membership = await this.targetMembership(input.organization, input.user, input.membershipId);
    if (membership.status !== "active") throw new Error("Access reset requires an active organization membership.");
    const prior = await this.targetAuthorization(membership);
    const bundle = await this.resolveRoleBundle(input.approvedRoleBundleKey);
    const updated = updatedAuthorization(prior, {
      roleKey: bundle.key,
      permissions: bundle.permissions,
      now: input.context.now,
    });
    const auditEvent = auditInput(input.context, {
      organization: input.organization,
      userId: input.user.id,
      objectType: "organization-membership-access",
      objectId: membership.id,
      action: "user.access.reset",
      priorState: authorizationState(prior),
      newState: authorizationState(updated),
    });
    await this.unitOfWork.commit({
      mutation: { kind: "authorization", mode: "update", record: updated },
      auditEvent,
    });
    return updated;
  }

  async transferRole(input: Readonly<{
    context: ControlledUserAdministrationActionContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
    roleBundleKey: string;
  }>): Promise<OrganizationUserAuthorization> {
    assertOrganizationScopedAdministrationAuthorized(input.context, input.organization);
    const membership = await this.targetMembership(input.organization, input.user, input.membershipId);
    if (membership.status !== "active") throw new Error("Role transfer requires an active organization membership.");
    const prior = await this.targetAuthorization(membership);
    const bundle = await this.resolveRoleBundle(input.roleBundleKey);
    const updated = updatedAuthorization(prior, {
      roleKey: bundle.key,
      permissions: bundle.permissions,
      now: input.context.now,
    });
    const auditEvent = auditInput(input.context, {
      organization: input.organization,
      userId: input.user.id,
      objectType: "organization-membership-access",
      objectId: membership.id,
      action: "user.role.transferred",
      priorState: authorizationState(prior),
      newState: authorizationState(updated),
    });
    await this.unitOfWork.commit({
      mutation: { kind: "authorization", mode: "update", record: updated },
      auditEvent,
    });
    return updated;
  }

  async assignPermission(input: Readonly<{
    context: ControlledUserAdministrationActionContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
    permission: string;
  }>): Promise<OrganizationUserAuthorization> {
    assertOrganizationScopedAdministrationAuthorized(input.context, input.organization);
    const membership = await this.targetMembership(input.organization, input.user, input.membershipId);
    if (membership.status !== "active") throw new Error("Permission assignment requires an active organization membership.");
    const prior = await this.targetAuthorization(membership);
    const permission = organizationPermission(input.permission);
    const updated = updatedAuthorization(prior, {
      permissions: Object.freeze([...new Set([...prior.permissions, permission])]),
      now: input.context.now,
    });
    const auditEvent = auditInput(input.context, {
      organization: input.organization,
      userId: input.user.id,
      objectType: "organization-membership-access",
      objectId: membership.id,
      action: "user.permission.assigned",
      priorState: authorizationState(prior),
      newState: authorizationState(updated),
    });
    await this.unitOfWork.commit({
      mutation: { kind: "authorization", mode: "update", record: updated },
      auditEvent,
    });
    return updated;
  }

  async revokePermission(input: Readonly<{
    context: ControlledUserAdministrationActionContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
    permission: string;
  }>): Promise<OrganizationUserAuthorization> {
    assertOrganizationScopedAdministrationAuthorized(input.context, input.organization);
    const membership = await this.targetMembership(input.organization, input.user, input.membershipId);
    if (membership.status !== "active") throw new Error("Permission revocation requires an active organization membership.");
    const prior = await this.targetAuthorization(membership);
    const permission = organizationPermission(input.permission);
    if (!prior.permissions.includes(permission)) {
      throw new Error(`Organization permission is not currently assigned: ${permission}.`);
    }
    const updated = updatedAuthorization(prior, {
      permissions: prior.permissions.filter((candidate) => candidate !== permission),
      now: input.context.now,
    });
    const auditEvent = auditInput(input.context, {
      organization: input.organization,
      userId: input.user.id,
      objectType: "organization-membership-access",
      objectId: membership.id,
      action: "user.permission.revoked",
      priorState: authorizationState(prior),
      newState: authorizationState(updated),
    });
    await this.unitOfWork.commit({
      mutation: { kind: "authorization", mode: "update", record: updated },
      auditEvent,
    });
    return updated;
  }
}
