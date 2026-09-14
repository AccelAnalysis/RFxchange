import type { AuthenticationAccountSecurityReader } from "../../application/auth/authorize-organization-operation.ts";
import { authorizeOrganizationParticipation } from "../../application/auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../../application/auth/server-session.ts";
import type { OrganizationUserAuthorizationRepository } from "../../domain/authorization/repository.ts";
import type { AccessRestrictionRepository } from "../../domain/lifecycle/repository.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import type { OrganizationAccountRepository, OrganizationProfileRepository } from "../../domain/organizations/repository.ts";
import type { OrganizationCommercialAccountRepository } from "../../domain/commercial/repository.ts";
import type { OrganizationMembership, OrganizationMembershipRepository } from "../../domain/users";
import type { IdentityProjectionResponse, IdentityOrganizationOption, IdentityMembershipProjection, IdentityForbiddenReason, AccelPOCapability } from "./identity-context.ts";

export interface IdentityProjectionDependencies {
  readonly accountSecurity: AuthenticationAccountSecurityReader;
  readonly organizations: OrganizationAccountRepository;
  readonly profiles: OrganizationProfileRepository;
  readonly memberships: OrganizationMembershipRepository;
  readonly authorizations: OrganizationUserAuthorizationRepository;
  readonly restrictions: AccessRestrictionRepository;
  readonly commercialAccounts?: OrganizationCommercialAccountRepository;
}

function forbidden(reason: IdentityForbiddenReason): IdentityProjectionResponse {
  return Object.freeze({ kind: "forbidden" as const, reason });
}

function mapParticipationDenial(
  reason: string,
): IdentityForbiddenReason {
  const known: readonly string[] = [
    "membership-not-found",
    "wrong-user",
    "wrong-organization",
    "organization-not-found",
    "account-unavailable",
    "authentication-subject-mismatch",
    "account-disabled",
    "credential-revoked",
    "email-verification-required",
    "membership-inactive",
    "organization-access-restricted",
  ];
  return known.includes(reason) ? reason as IdentityForbiddenReason : "account-unavailable";
}

function option(
  membership: { readonly id: string; readonly organizationId: string },
  displayName: string | null,
): IdentityOrganizationOption {
  return Object.freeze({
    organizationId: String(membership.organizationId),
    membershipId: String(membership.id),
    displayName,
  });
}

async function organizationOptions(
  memberships: readonly OrganizationMembership[],
  profiles: OrganizationProfileRepository,
): Promise<readonly IdentityOrganizationOption[]> {
  const values = await Promise.all(memberships.map(async (membership) => {
    const profile = await profiles.getByOrganizationId(membership.organizationId);
    return option(membership, profile?.displayName ?? null);
  }));
  return Object.freeze(values);
}

function capabilities(authorization: { readonly permissions: readonly string[] }): readonly AccelPOCapability[] {
  return Object.freeze([...new Set(authorization.permissions)] as AccelPOCapability[]);
}

async function planSummary(
  organizationId: string,
  repository: OrganizationCommercialAccountRepository | undefined,
) {
  if (!repository) {
    return Object.freeze({
      status: "not-configured" as const,
      plan: null,
      entitlementKeys: Object.freeze([]),
      billingPeriodEndsAt: null,
      entitlementVersion: null,
    });
  }

  const account = await repository.getByOrganizationId(organizationId as OrganizationId);
  if (!account) {
    return Object.freeze({
      status: "not-configured" as const,
      plan: null,
      entitlementKeys: Object.freeze([]),
      billingPeriodEndsAt: null,
      entitlementVersion: null,
    });
  }
  return Object.freeze({
    status: "available" as const,
    plan: String(account.planKey),
    entitlementKeys: Object.freeze(account.entitlementKeys.map(String)),
    billingPeriodEndsAt: account.subscription.currentPeriodEndsAt
      ? String(account.subscription.currentPeriodEndsAt)
      : null,
    entitlementVersion: String(account.updatedAt),
  });
}

/**
 * Server-authorized identity projection used by CP-01. The requested organization is only a
 * selection hint; every membership and organization is re-read from trusted repositories.
 */
export async function projectIdentityContext(
  context: AuthenticatedServerContext,
  requestedOrganizationId: string | null | undefined,
  dependencies: IdentityProjectionDependencies,
): Promise<IdentityProjectionResponse> {
  const listedMemberships = await dependencies.memberships.listActiveByUserId(context.user.id);
  const activeMemberships = listedMemberships.filter(
    (membership) => membership.status === "active" && membership.userId === context.user.id,
  );
  const options = await organizationOptions(activeMemberships, dependencies.profiles);
  if (options.length === 0) return forbidden("no-active-membership");

  const requested = requestedOrganizationId?.trim() || null;
  const selectedMembership = requested
    ? activeMemberships.find((membership) => String(membership.organizationId) === requested) ?? null
    : activeMemberships.length === 1
      ? activeMemberships[0]
      : null;

  if (!selectedMembership) {
    return Object.freeze({ kind: "organization-selection-required" as const, options });
  }

  const participation = await authorizeOrganizationParticipation(
    {
      context,
      organizationId: selectedMembership.organizationId,
      membershipId: selectedMembership.id,
    },
    dependencies,
  );
  if (!participation.allowed) return forbidden(mapParticipationDenial(participation.reason));

  const authorization = await dependencies.authorizations.getByMembershipId(selectedMembership.id);
  if (!authorization) return forbidden("authorization-missing");
  if (
    authorization.userId !== context.user.id ||
    authorization.organizationId !== selectedMembership.organizationId ||
    authorization.membershipId !== selectedMembership.id
  ) {
    return forbidden("authorization-missing");
  }

  const activeOrganization = option(selectedMembership, (
    await dependencies.profiles.getByOrganizationId(selectedMembership.organizationId)
  )?.displayName ?? null);
  const selectedCapabilities = capabilities(authorization);
  const membership: IdentityMembershipProjection = Object.freeze({
    ...activeOrganization,
    status: "active" as const,
    roleKey: String(authorization.roleKey),
    capabilities: selectedCapabilities,
  });
  const plan = await planSummary(
    String(selectedMembership.organizationId),
    dependencies.commercialAccounts,
  );

  return Object.freeze({
    kind: "ready" as const,
    projection: Object.freeze({
      user: Object.freeze({
        userId: String(context.user.id),
        email: context.user.primaryEmail,
        displayName: context.user.name || null,
      }),
      activeOrganization,
      membership,
      activeMemberships: options,
      permissions: selectedCapabilities,
      seat: Object.freeze({
        ownerCountsAsSeat: true as const,
        activeSeats: activeMemberships.length,
        reservedSeats: null,
        availableSeats: null,
        source: "shared-membership-count" as const,
      }),
      plan,
    }),
  });
}
