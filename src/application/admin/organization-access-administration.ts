import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";
import { createPlatformAdministrativeAuditEvent } from "../../domain/admin-authorization/admin-audit.ts";
import type { OrganizationAccessAdministrationUnitOfWork } from "../../domain/admin-authorization/organization-access-admin-repository.ts";
import {
  createOrganizationRoleBundle,
  DEFAULT_ORGANIZATION_ROLE_BUNDLES,
  organizationRoleBundleKey,
  type OrganizationRoleBundle,
} from "../../domain/authorization/organization-role-bundles.ts";
import type { OrganizationRoleBundleRepository } from "../../domain/authorization/organization-role-bundle-repository.ts";
import {
  organizationPermission,
  organizationRoleKey,
  type OrganizationUserAuthorization,
  type AuthorizationTimestamp,
} from "../../domain/authorization/model.ts";
import type { OrganizationUserAuthorizationRepository } from "../../domain/authorization/repository.ts";
import type { OrganizationAccount } from "../../domain/organizations/model.ts";
import type { OrganizationMembership, UserIdentity, UserTimestamp } from "../../domain/users/model.ts";
import type { OrganizationMembershipRepository } from "../../domain/users/repository.ts";
import { planAdministrativeMembershipDeactivation } from "./membership-repair.ts";

export interface OrganizationAccessAdministrationSnapshot {
  readonly userId: string;
  readonly memberships: readonly Readonly<{
    membership: OrganizationMembership;
    authorization: OrganizationUserAuthorization | null;
  }>[];
}

export interface AdministrativeAuditSecurityEvidence {
  readonly authenticationSubject?: string | null;
  readonly sessionId?: string | null;
  readonly deviceId?: string | null;
  readonly provider?: string | null;
  readonly mfaVerifiedAt?: string | null;
  readonly reauthenticatedAt: string;
  readonly networkContextHash?: string | null;
}

function assertAdminPermission(
  authority: PlatformAdministratorAuthorityContext,
  permission: "user.access.read" | "user.access.manage",
): void {
  const decision = authorizeAdministrativeAction(
    authority,
    createAdministrativeActionRequirement({ permission }),
  );
  if (decision.kind !== "allow") {
    throw new Error(`Organization access administration denied: ${decision.reason}.`);
  }
}

function iso(value: string, label: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid date-time.`);
  return new Date(parsed).toISOString();
}

function accessState(
  membership: OrganizationMembership,
  authorization: OrganizationUserAuthorization | null,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    membershipId: membership.id,
    userId: membership.userId,
    organizationId: membership.organizationId,
    membershipStatus: membership.status,
    roleKey: authorization?.roleKey ?? null,
    permissions: authorization ? [...authorization.permissions] : [],
  });
}

export class OrganizationAccessAdministrationService {
  private readonly memberships: OrganizationMembershipRepository;
  private readonly authorizations: OrganizationUserAuthorizationRepository;
  private readonly roleBundles: OrganizationRoleBundleRepository;
  private readonly unitOfWork: OrganizationAccessAdministrationUnitOfWork;

  constructor(input: Readonly<{
    memberships: OrganizationMembershipRepository;
    authorizations: OrganizationUserAuthorizationRepository;
    roleBundles: OrganizationRoleBundleRepository;
    unitOfWork: OrganizationAccessAdministrationUnitOfWork;
  }>) {
    this.memberships = input.memberships;
    this.authorizations = input.authorizations;
    this.roleBundles = input.roleBundles;
    this.unitOfWork = input.unitOfWork;
  }

  async listRoleBundles(
    authority: PlatformAdministratorAuthorityContext,
  ): Promise<readonly OrganizationRoleBundle[]> {
    assertAdminPermission(authority, "user.access.read");
    const configured = await this.roleBundles.listAll();
    const byKey = new Map(configured.map((bundle) => [bundle.key, bundle]));
    return Object.freeze(
      DEFAULT_ORGANIZATION_ROLE_BUNDLES.map((fallback) => byKey.get(fallback.key) ?? fallback),
    );
  }

  async inspectUserAccess(
    authority: PlatformAdministratorAuthorityContext,
    user: UserIdentity,
  ): Promise<OrganizationAccessAdministrationSnapshot> {
    assertAdminPermission(authority, "user.access.read");
    const memberships = await this.memberships.listByUserId(user.id);
    const records = await Promise.all(
      memberships.map(async (membership) =>
        Object.freeze({
          membership,
          authorization: await this.authorizations.getByMembershipId(membership.id),
        }),
      ),
    );
    return Object.freeze({ userId: user.id, memberships: Object.freeze(records) });
  }

  async configureRoleBundle(input: Readonly<{
    authority: PlatformAdministratorAuthorityContext;
    key: string;
    displayName: string;
    description: string;
    permissions: readonly string[];
    now: string;
    auditEventId: string;
    reason: string;
    security: AdministrativeAuditSecurityEvidence;
  }>): Promise<OrganizationRoleBundle> {
    assertAdminPermission(input.authority, "user.access.manage");
    const key = organizationRoleBundleKey(input.key);
    const existing = await this.roleBundles.getByKey(key);
    const fallback = DEFAULT_ORGANIZATION_ROLE_BUNDLES.find((candidate) => candidate.key === key);
    if (!fallback) throw new Error(`Default organization role bundle is missing: ${key}.`);
    const createdAt = existing?.createdAt ?? fallback.createdAt;
    const bundle = createOrganizationRoleBundle({
      key,
      displayName: input.displayName,
      description: input.description,
      permissions: input.permissions,
      createdAt,
      updatedAt: input.now,
    });
    const auditEvent = createPlatformAdministrativeAuditEvent(input.authority, {
      id: input.auditEventId,
      permissionsExercised: ["user.access.manage"],
      target: { objectType: "organization-role-bundle", objectId: bundle.key },
      action: "organization.role-bundle.configured",
      sensitivity: "sensitive",
      priorState: existing
        ? { displayName: existing.displayName, description: existing.description, permissions: [...existing.permissions] }
        : null,
      newState: { displayName: bundle.displayName, description: bundle.description, permissions: [...bundle.permissions] },
      reason: input.reason,
      occurredAt: input.now,
      securityContext: input.security,
    });
    await this.unitOfWork.saveRoleBundle({ bundle, auditEvent });
    return bundle;
  }

  async assignMembershipAccess(input: Readonly<{
    authority: PlatformAdministratorAuthorityContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
    roleBundleKey?: string;
    roleKey?: string;
    permissions?: readonly string[];
    now: string;
    auditEventId: string;
    reason: string;
    security: AdministrativeAuditSecurityEvidence;
  }>): Promise<OrganizationUserAuthorization> {
    assertAdminPermission(input.authority, "user.access.manage");
    const memberships = await this.memberships.listByUserId(input.user.id);
    const membership = memberships.find((candidate) => candidate.id === input.membershipId);
    if (!membership) throw new Error("Target membership does not belong to the selected user.");
    if (membership.organizationId !== input.organization.id) {
      throw new Error("Target membership belongs to a different organization tenant.");
    }
    if (membership.status !== "active") {
      throw new Error("Organization role/permission changes require an active membership.");
    }
    const prior = await this.authorizations.getByMembershipId(membership.id);
    if (!prior) throw new Error("Target membership has no organization authorization record.");

    let roleKey = input.roleKey ?? prior.roleKey;
    let permissions = input.permissions ?? prior.permissions;
    if (input.roleBundleKey) {
      const bundleKey = organizationRoleBundleKey(input.roleBundleKey);
      const configured = await this.roleBundles.getByKey(bundleKey);
      const fallback = DEFAULT_ORGANIZATION_ROLE_BUNDLES.find((candidate) => candidate.key === bundleKey);
      const bundle = configured ?? fallback;
      if (!bundle) throw new Error(`Organization role bundle is missing: ${bundleKey}.`);
      roleKey = bundle.key;
      permissions = bundle.permissions;
    }

    const updatedAt = iso(input.now, "Organization access change timestamp") as AuthorizationTimestamp;
    const updated: OrganizationUserAuthorization = Object.freeze({
      ...prior,
      roleKey: organizationRoleKey(roleKey),
      permissions: Object.freeze([...new Set(permissions.map(organizationPermission))]),
      updatedAt,
    });
    const auditEvent = createPlatformAdministrativeAuditEvent(input.authority, {
      id: input.auditEventId,
      permissionsExercised: ["user.access.manage"],
      target: {
        organizationId: input.organization.id,
        userId: input.user.id,
        objectType: "organization-membership-access",
        objectId: membership.id,
      },
      action: "organization.membership.access-changed",
      sensitivity: "sensitive",
      priorState: accessState(membership, prior),
      newState: accessState(membership, updated),
      reason: input.reason,
      occurredAt: input.now,
      securityContext: input.security,
    });
    await this.unitOfWork.saveMembershipAccess({ authorization: updated, auditEvent });
    return updated;
  }

  async setMembershipStatus(input: Readonly<{
    authority: PlatformAdministratorAuthorityContext;
    organization: OrganizationAccount;
    user: UserIdentity;
    membershipId: string;
    status: "active" | "inactive";
    now: string;
    auditEventId: string;
    reason: string;
    security: AdministrativeAuditSecurityEvidence;
  }>): Promise<OrganizationMembership> {
    assertAdminPermission(input.authority, "user.access.manage");
    const memberships = await this.memberships.listByUserId(input.user.id);
    const target = memberships.find((membership) => membership.id === input.membershipId);
    if (!target) throw new Error("Target membership does not belong to the selected user.");
    if (target.organizationId !== input.organization.id) {
      throw new Error("Target membership belongs to a different organization tenant.");
    }
    if (target.status === input.status) return target;

    let updated: OrganizationMembership;
    if (input.status === "inactive") {
      const decision = planAdministrativeMembershipDeactivation(
        input.authority,
        input.user,
        memberships,
        input.membershipId,
        input.now,
      );
      if (decision.kind !== "allow-deactivation") {
        throw new Error("Membership change would orphan an active user; account resolution is required.");
      }
      updated = decision.membership;
    } else {
      updated = Object.freeze({
        ...target,
        status: "active" as const,
        updatedAt: iso(input.now, "Membership activation timestamp") as UserTimestamp,
      });
    }

    const authorization = await this.authorizations.getByMembershipId(target.id);
    const auditEvent = createPlatformAdministrativeAuditEvent(input.authority, {
      id: input.auditEventId,
      permissionsExercised: ["user.access.manage"],
      target: {
        organizationId: input.organization.id,
        userId: input.user.id,
        objectType: "organization-membership",
        objectId: target.id,
      },
      action: input.status === "active" ? "organization.membership.activated" : "organization.membership.deactivated",
      sensitivity: "sensitive",
      priorState: accessState(target, authorization),
      newState: accessState(updated, authorization),
      reason: input.reason,
      occurredAt: input.now,
      securityContext: input.security,
    });
    await this.unitOfWork.saveMembershipAccess({ membership: updated, auditEvent });
    return updated;
  }
}
