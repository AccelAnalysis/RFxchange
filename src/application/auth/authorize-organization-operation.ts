import type { OrganizationPermission, OrganizationUserAuthorization } from "../../domain/authorization/model.ts";
import { evaluateOrganizationPermission } from "../../domain/authorization/model.ts";
import type { OrganizationUserAuthorizationRepository } from "../../domain/authorization/repository.ts";
import type { AccessRestrictionRecord, AccessRestrictionState } from "../../domain/lifecycle/model.ts";
import type { AccessRestrictionRepository } from "../../domain/lifecycle/repository.ts";
import type { OrganizationAccount, OrganizationId } from "../../domain/organizations/model.ts";
import type { OrganizationAccountRepository } from "../../domain/organizations/repository.ts";
import type { OrganizationMembership, OrganizationMembershipId } from "../../domain/users/model.ts";
import type { OrganizationMembershipRepository } from "../../domain/users/repository.ts";
import {
  evaluateAuthenticatedOrganizationAccess,
  type AuthenticationAccountSecuritySnapshot,
} from "./account-security.ts";
import type { AuthenticatedServerContext } from "./server-session.ts";

export interface AuthenticationAccountSecurityReader {
  inspect(subject: string): Promise<AuthenticationAccountSecuritySnapshot>;
}

export interface OrganizationOperationAuthorizationDependencies {
  readonly accountSecurity: AuthenticationAccountSecurityReader;
  readonly organizations: OrganizationAccountRepository;
  readonly memberships: OrganizationMembershipRepository;
  readonly authorizations: OrganizationUserAuthorizationRepository;
  readonly restrictions: AccessRestrictionRepository;
}

export type OrganizationOperationDenialReason =
  | "unauthenticated"
  | "membership-not-found"
  | "wrong-user"
  | "wrong-organization"
  | "organization-not-found"
  | "account-unavailable"
  | "authentication-subject-mismatch"
  | "account-disabled"
  | "credential-revoked"
  | "email-verification-required"
  | "membership-inactive"
  | "organization-access-restricted"
  | "authorization-missing"
  | "authorization-membership-mismatch"
  | "missing-permission";

export type OrganizationOperationAuthorizationDecision =
  | Readonly<{
      readonly allowed: false;
      readonly reason: OrganizationOperationDenialReason;
      readonly restrictionState?: Exclude<AccessRestrictionState, "none">;
    }>
  | Readonly<{
      readonly allowed: true;
      readonly context: AuthenticatedServerContext;
      readonly organization: OrganizationAccount;
      readonly membership: OrganizationMembership;
      readonly authorization: OrganizationUserAuthorization;
      readonly permission: OrganizationPermission;
    }>;

export type OrganizationParticipationAuthorizationDecision =
  | Readonly<{
      readonly allowed: false;
      readonly reason: OrganizationOperationDenialReason;
      readonly restrictionState?: Exclude<AccessRestrictionState, "none">;
    }>
  | Readonly<{
      readonly allowed: true;
      readonly context: AuthenticatedServerContext;
      readonly organization: OrganizationAccount;
      readonly membership: OrganizationMembership;
    }>;

function denial(
  reason: OrganizationOperationDenialReason,
  restrictionState?: Exclude<AccessRestrictionState, "none">,
): OrganizationOperationAuthorizationDecision {
  return Object.freeze(
    restrictionState
      ? { allowed: false as const, reason, restrictionState }
      : { allowed: false as const, reason },
  );
}

function activeRestrictionState(
  organizationRestriction: AccessRestrictionRecord | null,
  membershipRestriction: AccessRestrictionRecord | null,
): AccessRestrictionState {
  if (membershipRestriction && membershipRestriction.state !== "none") {
    return membershipRestriction.state;
  }
  if (organizationRestriction && organizationRestriction.state !== "none") {
    return organizationRestriction.state;
  }
  return "none";
}

/**
 * Canonical server-side authorization boundary for organization-scoped operations.
 *
 * AUTH-003 establishes trusted identity. AUTH-004 may deny access based on provider account state,
 * credential revocation, membership status, or restrictions. Only then does the organization
 * permission engine evaluate the requested capability. A successful result authorizes exactly one
 * user, membership, organization, and permission tuple; it does not authorize another tenant.
 */
export async function authorizeOrganizationOperation(
  input: Readonly<{
    readonly context: AuthenticatedServerContext | null;
    readonly organizationId: OrganizationId;
    readonly membershipId: OrganizationMembershipId;
    readonly permission: OrganizationPermission;
  }>,
  dependencies: OrganizationOperationAuthorizationDependencies,
): Promise<OrganizationOperationAuthorizationDecision> {
  const participation = await authorizeOrganizationParticipation(input, dependencies);
  if (!participation.allowed) return participation;

  const authorization = await dependencies.authorizations.getByMembershipId(input.membershipId);
  if (!authorization) return denial("authorization-missing");

  const permission = evaluateOrganizationPermission(
    participation.membership,
    authorization,
    participation.organization,
    input.permission,
  );
  if (!permission.allowed) {
    if (permission.reason === "authorization-membership-mismatch") {
      return denial("authorization-membership-mismatch");
    }
    if (permission.reason === "missing-permission") return denial("missing-permission");
    if (permission.reason === "inactive-membership") return denial("membership-inactive");
    return denial("wrong-organization");
  }

  return Object.freeze({
    allowed: true as const,
    context: participation.context,
    organization: participation.organization,
    membership: participation.membership,
    authorization,
    permission: input.permission,
  });
}

/** Current authenticated organization participation without granting a consequential permission. */
export async function authorizeOrganizationParticipation(
  input: Readonly<{
    readonly context: AuthenticatedServerContext | null;
    readonly organizationId: OrganizationId;
    readonly membershipId: OrganizationMembershipId;
  }>,
  dependencies: OrganizationOperationAuthorizationDependencies,
): Promise<OrganizationParticipationAuthorizationDecision> {
  if (!input.context) return denial("unauthenticated");

  const membership = await dependencies.memberships.getById(input.membershipId);
  if (!membership) return denial("membership-not-found");
  if (membership.userId !== input.context.user.id) return denial("wrong-user");
  if (membership.organizationId !== input.organizationId) return denial("wrong-organization");

  const organization = await dependencies.organizations.getById(input.organizationId);
  if (!organization) return denial("organization-not-found");

  let account: AuthenticationAccountSecuritySnapshot;
  try {
    account = await dependencies.accountSecurity.inspect(input.context.authentication.subject);
  } catch {
    return denial("account-unavailable");
  }

  if (
    account.provider !== input.context.authentication.provider ||
    account.subject !== input.context.authentication.subject
  ) {
    return denial("authentication-subject-mismatch");
  }

  const [organizationRestriction, membershipRestriction] = await Promise.all([
    dependencies.restrictions.getForOrganization(input.organizationId),
    dependencies.restrictions.getForMembership(input.membershipId),
  ]);
  const restrictionState = activeRestrictionState(organizationRestriction, membershipRestriction);

  const eligibility = evaluateAuthenticatedOrganizationAccess({
    account,
    credentialAuthenticatedAt: input.context.authentication.authenticatedAt,
    membershipStatus: membership.status,
    restrictionState,
  });
  if (!eligibility.allowed) {
    return denial(eligibility.reason, eligibility.restrictionState);
  }

  return Object.freeze({
    allowed: true as const,
    context: input.context,
    organization,
    membership,
  });
}
