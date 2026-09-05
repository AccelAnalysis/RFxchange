import type { AdminGrantScope } from "../../domain/admin-authorization/grants.ts";
import type { PlatformAdministratorAccount } from "../../domain/admin-authorization/administrator-lifecycle.ts";
import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";
import type { OrganizationUserAuthorization } from "../../domain/authorization/model.ts";
import type { LegalAcknowledgement } from "../../domain/legal/model.ts";
import type { AccessRestrictionRecord } from "../../domain/lifecycle/model.ts";
import type { OrganizationProfile } from "../../domain/organizations/model.ts";
import type { OrganizationMembership, UserIdentity } from "../../domain/users/model.ts";

export interface UserAccess360SecurityEvent {
  readonly type: string;
  readonly occurredAt: string;
  readonly detail: string;
}

export interface UserAccess360Invitation {
  readonly id: string;
  readonly organizationId: string;
  readonly status: string;
  readonly invitedAt: string;
}

export interface UserAccess360RecentAction {
  readonly action: string;
  readonly occurredAt: string;
  readonly target: string;
}

export interface UserAccess360Input {
  readonly user: UserIdentity;
  readonly memberships: readonly OrganizationMembership[];
  readonly organizationAuthorizations: readonly OrganizationUserAuthorization[];
  readonly organizationProfiles?: readonly OrganizationProfile[];
  readonly platformAdministrator?: PlatformAdministratorAccount | null;
  readonly lastLoginAt: string | null;
  readonly securityEvents?: readonly UserAccess360SecurityEvent[];
  readonly invitations?: readonly UserAccess360Invitation[];
  readonly restrictions?: readonly AccessRestrictionRecord[];
  readonly legalAcknowledgements?: readonly LegalAcknowledgement[];
  readonly recentActions?: readonly UserAccess360RecentAction[];
}

export interface UserAccess360MembershipView {
  readonly membershipId: string;
  readonly organizationId: string;
  readonly organizationName: string | null;
  readonly status: OrganizationMembership["status"];
  readonly roleKey: string | null;
  readonly permissions: readonly string[];
}

export interface UserAccess360Projection {
  readonly identity: Readonly<{
    id: string;
    name: string;
    email: string;
    authenticationProvider: string;
    authenticationSubject: string;
    mfaEnabled: boolean;
  }>;
  readonly authenticationState: Readonly<{
    lastLoginAt: string | null;
    credentialVersion: number;
  }>;
  readonly memberships: readonly UserAccess360MembershipView[];
  readonly platformRole: Readonly<{
    administratorId: string;
    status: string;
    rolePresetKeys: readonly string[];
    addedPermissions: readonly string[];
    removedPermissions: readonly string[];
    scopeLimits: readonly string[];
  }> | null;
  readonly granularPermissions: readonly string[];
  readonly securityEvents: readonly UserAccess360SecurityEvent[];
  readonly invitations: readonly UserAccess360Invitation[];
  readonly restrictions: readonly Readonly<{
    id: string;
    state: string;
    organizationId: string;
    membershipId: string | null;
  }>[];
  readonly termsVersionsAccepted: readonly Readonly<{
    kind: string;
    version: string;
    status: string;
    recordedAt: string;
    organizationId: string;
  }>[];
  readonly recentActions: readonly UserAccess360RecentAction[];
}

function assertUserAccess360Authorized(authority: PlatformAdministratorAuthorityContext): void {
  for (const permission of ["user.profile.read", "user.access.read"] as const) {
    const decision = authorizeAdministrativeAction(
      authority,
      createAdministrativeActionRequirement({ permission }),
    );
    if (decision.kind !== "allow") {
      throw new Error(`User & Access 360 denied: ${permission} is required.`);
    }
  }
}

function membershipView(
  membership: OrganizationMembership,
  authorizations: readonly OrganizationUserAuthorization[],
  profiles: readonly OrganizationProfile[],
): UserAccess360MembershipView {
  const authorization = authorizations.find(
    (candidate) => candidate.membershipId === membership.id && candidate.userId === membership.userId,
  );
  const profile = profiles.find((candidate) => candidate.organizationId === membership.organizationId);
  return Object.freeze({
    membershipId: membership.id,
    organizationId: membership.organizationId,
    organizationName: profile?.displayName ?? null,
    status: membership.status,
    roleKey: authorization?.roleKey ?? null,
    permissions: Object.freeze([...(authorization?.permissions ?? [])]),
  });
}

export function buildUserAccess360(
  authority: PlatformAdministratorAuthorityContext,
  input: UserAccess360Input,
): UserAccess360Projection {
  assertUserAccess360Authorized(authority);
  const memberships = input.memberships.filter((membership) => membership.userId === input.user.id);
  const authorizations = input.organizationAuthorizations.filter(
    (authorization) => authorization.userId === input.user.id,
  );
  const platform = input.platformAdministrator ?? null;
  const granularPermissions = new Set<string>();
  for (const authorization of authorizations) {
    for (const permission of authorization.permissions) granularPermissions.add(permission);
  }
  if (platform) {
    for (const permission of platform.access.addedPermissions) granularPermissions.add(permission);
    for (const permission of platform.access.removedPermissions) granularPermissions.delete(permission);
  }

  return Object.freeze({
    identity: Object.freeze({
      id: input.user.id,
      name: input.user.name,
      email: input.user.primaryEmail,
      authenticationProvider: input.user.login.provider,
      authenticationSubject: input.user.login.subject,
      mfaEnabled: input.user.security.mfaEnabled,
    }),
    authenticationState: Object.freeze({
      lastLoginAt: input.lastLoginAt,
      credentialVersion: input.user.security.credentialVersion,
    }),
    memberships: Object.freeze(
      memberships.map((membership) =>
        membershipView(membership, authorizations, input.organizationProfiles ?? []),
      ),
    ),
    platformRole: platform
      ? Object.freeze({
          administratorId: platform.administratorId,
          status: platform.status,
          rolePresetKeys: Object.freeze([...platform.access.rolePresetKeys]),
          addedPermissions: Object.freeze([...platform.access.addedPermissions]),
          removedPermissions: Object.freeze([...platform.access.removedPermissions]),
          scopeLimits: Object.freeze(platform.scopeLimits.map((scope) => scope.value)),
        })
      : null,
    granularPermissions: Object.freeze([...granularPermissions].sort()),
    securityEvents: Object.freeze([...(input.securityEvents ?? [])]),
    invitations: Object.freeze([...(input.invitations ?? [])]),
    restrictions: Object.freeze(
      (input.restrictions ?? [])
        .filter((restriction) => restriction.target.kind !== "membership" || restriction.target.userId === input.user.id)
        .map((restriction) =>
          Object.freeze({
            id: restriction.id,
            state: restriction.state,
            organizationId: restriction.target.organizationId,
            membershipId: restriction.target.kind === "membership" ? restriction.target.membershipId : null,
          }),
        ),
    ),
    termsVersionsAccepted: Object.freeze(
      (input.legalAcknowledgements ?? [])
        .filter((acknowledgement) => acknowledgement.userId === input.user.id)
        .map((acknowledgement) =>
          Object.freeze({
            kind: acknowledgement.documentKind,
            version: acknowledgement.documentVersion,
            status: acknowledgement.status,
            recordedAt: acknowledgement.recordedAt,
            organizationId: acknowledgement.organizationId,
          }),
        ),
    ),
    recentActions: Object.freeze([...(input.recentActions ?? [])]),
  });
}

/** Limit User 360 organization data before any profile hydration or projection. */
export function scopeUserAccess360OrganizationData(
  input: Pick<UserAccess360Input, "memberships" | "organizationAuthorizations">,
  scope: AdminGrantScope,
): Pick<UserAccess360Input, "memberships" | "organizationAuthorizations"> {
  const memberships = input.memberships.filter((membership) =>
    scope.kind === "GLOBAL" || (scope.kind === "ORGANIZATION" && String(membership.organizationId) === String(scope.targetId)),
  );
  const membershipIds = new Set(memberships.map((membership) => membership.id));
  const organizationAuthorizations = input.organizationAuthorizations.filter((authorization) =>
    membershipIds.has(authorization.membershipId) && memberships.some((membership) =>
      membership.id === authorization.membershipId && membership.userId === authorization.userId && membership.organizationId === authorization.organizationId),
  );
  return Object.freeze({ memberships: Object.freeze(memberships), organizationAuthorizations: Object.freeze(organizationAuthorizations) });
}
