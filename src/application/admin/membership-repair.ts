import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";
import {
  resolveUserOrganizationAccess,
  type OrganizationMembership,
  type UserIdentity,
  type UserTimestamp,
} from "../../domain/users/model.ts";

export type AdministrativeMembershipRepairDecision =
  | Readonly<{
      readonly kind: "allow-deactivation";
      readonly membership: OrganizationMembership;
      readonly remainingActiveMembershipIds: readonly string[];
    }>
  | Readonly<{
      readonly kind: "route-to-account-resolution";
      readonly userId: string;
      readonly membershipId: string;
      readonly reason: "last-active-organization-membership";
    }>;

function timestamp(value: string): UserTimestamp {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("Administrative membership repair timestamp must be valid.");
  return new Date(parsed).toISOString() as UserTimestamp;
}

export function planAdministrativeMembershipDeactivation(
  authority: PlatformAdministratorAuthorityContext,
  user: UserIdentity,
  memberships: readonly OrganizationMembership[],
  targetMembershipId: string,
  now: string,
): AdministrativeMembershipRepairDecision {
  const authorization = authorizeAdministrativeAction(
    authority,
    createAdministrativeActionRequirement({ permission: "user.access.manage" }),
  );
  if (authorization.kind !== "allow") {
    throw new Error(`Administrative membership repair denied: ${authorization.reason}.`);
  }

  const target = memberships.find(
    (membership) => membership.id === targetMembershipId && membership.userId === user.id,
  );
  if (!target) throw new Error("Target organization membership does not belong to the selected user.");
  if (target.status !== "active") throw new Error("Only an active organization membership can be deactivated.");

  const updated: OrganizationMembership = Object.freeze({
    ...target,
    status: "inactive" as const,
    updatedAt: timestamp(now),
  });
  const prospective = memberships.map((membership) =>
    membership.id === target.id ? updated : membership,
  );
  const access = resolveUserOrganizationAccess(user, prospective);
  if (access.kind === "account-resolution") {
    return Object.freeze({
      kind: "route-to-account-resolution" as const,
      userId: user.id,
      membershipId: target.id,
      reason: "last-active-organization-membership" as const,
    });
  }

  return Object.freeze({
    kind: "allow-deactivation" as const,
    membership: updated,
    remainingActiveMembershipIds: Object.freeze(
      access.activeMemberships.map((membership) => membership.id),
    ),
  });
}

export function assertAdministrativeMembershipDeactivationSafe(
  decision: AdministrativeMembershipRepairDecision,
): Extract<AdministrativeMembershipRepairDecision, { readonly kind: "allow-deactivation" }> {
  if (decision.kind !== "allow-deactivation") {
    throw new Error(
      "Administrative membership deactivation would orphan an active user; route the user through account resolution instead.",
    );
  }
  return decision;
}
