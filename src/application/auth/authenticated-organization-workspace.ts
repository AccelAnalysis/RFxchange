import {
  authorizeOrganizationOperation,
  type AuthenticationAccountSecurityReader,
  type OrganizationOperationDenialReason,
} from "./authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "./server-session.ts";
import {
  linkOrganizationAccountAndProfile,
  organizationId,
  type OrganizationContext,
  type OrganizationId,
} from "../../domain/organizations/model.ts";
import type {
  OrganizationAccountRepository,
  OrganizationProfileRepository,
} from "../../domain/organizations/repository.ts";
import type {
  OrganizationPermission,
  OrganizationUserAuthorization,
} from "../../domain/authorization/model.ts";
import type { OrganizationUserAuthorizationRepository } from "../../domain/authorization/repository.ts";
import type { AccessRestrictionRepository } from "../../domain/lifecycle/repository.ts";
import {
  resolveUserOrganizationAccess,
  type OrganizationMembership,
  type OrganizationMembershipId,
  type UserId,
} from "../../domain/users/model.ts";
import type { OrganizationMembershipRepository } from "../../domain/users/repository.ts";

export interface AuthenticatedOrganizationWorkspaceDependencies {
  readonly accountSecurity: AuthenticationAccountSecurityReader;
  readonly organizations: OrganizationAccountRepository;
  readonly profiles: OrganizationProfileRepository;
  readonly memberships: OrganizationMembershipRepository;
  readonly authorizations: OrganizationUserAuthorizationRepository;
  readonly restrictions: AccessRestrictionRepository;
}

export interface OrganizationWorkspaceSelectionOption {
  readonly organizationId: OrganizationId;
  readonly membershipId: OrganizationMembershipId;
}

export type AuthenticatedOrganizationWorkspaceResolution =
  | Readonly<{
      readonly kind: "account-resolution";
      readonly userId: UserId;
      readonly reason: "no-active-organization-membership";
    }>
  | Readonly<{
      readonly kind: "organization-selection-required";
      readonly userId: UserId;
      readonly options: readonly OrganizationWorkspaceSelectionOption[];
    }>
  | Readonly<{
      readonly kind: "access-denied";
      readonly reason: OrganizationOperationDenialReason;
    }>
  | Readonly<{
      readonly kind: "organization-profile-missing";
      readonly organizationId: OrganizationId;
      readonly membershipId: OrganizationMembershipId;
    }>
  | Readonly<{
      readonly kind: "authorized";
      readonly context: AuthenticatedServerContext;
      readonly organization: OrganizationContext;
      readonly membership: OrganizationMembership;
      readonly authorization: OrganizationUserAuthorization;
      readonly permission: OrganizationPermission;
    }>;

function selectionOptions(
  memberships: readonly OrganizationMembership[],
): readonly OrganizationWorkspaceSelectionOption[] {
  return Object.freeze(
    memberships.map((membership) =>
      Object.freeze({
        organizationId: membership.organizationId,
        membershipId: membership.id,
      }),
    ),
  );
}

/**
 * Resolve a trusted RFxchange server identity into one active, authorized organization workspace.
 *
 * This is intentionally provider-independent. Firebase owns credential verification; Firestore owns
 * persistence through adapters; this application service owns the RFxchange invariant that a user
 * operates through an active organization membership with an explicit permission grant.
 */
export class AuthenticatedOrganizationWorkspaceService {
  private readonly dependencies: AuthenticatedOrganizationWorkspaceDependencies;

  constructor(dependencies: AuthenticatedOrganizationWorkspaceDependencies) {
    this.dependencies = dependencies;
  }

  async resolve(input: Readonly<{
    context: AuthenticatedServerContext | null;
    requestedOrganizationId?: string | null;
    permission: OrganizationPermission;
  }>): Promise<AuthenticatedOrganizationWorkspaceResolution> {
    if (!input.context) {
      return Object.freeze({ kind: "access-denied" as const, reason: "unauthenticated" as const });
    }

    const activeMemberships = await this.dependencies.memberships.listActiveByUserId(input.context.user.id);
    const access = resolveUserOrganizationAccess(input.context.user, activeMemberships);
    if (access.kind === "account-resolution") return access;

    let selectedMembership: OrganizationMembership | undefined;
    const requested = input.requestedOrganizationId?.trim();
    if (requested) {
      const requestedId = organizationId(requested);
      selectedMembership = access.activeMemberships.find(
        (membership) => membership.organizationId === requestedId,
      );
      if (!selectedMembership) {
        return Object.freeze({ kind: "access-denied" as const, reason: "wrong-organization" as const });
      }
    } else if (access.activeMemberships.length === 1) {
      selectedMembership = access.activeMemberships[0];
    } else {
      return Object.freeze({
        kind: "organization-selection-required" as const,
        userId: input.context.user.id,
        options: selectionOptions(access.activeMemberships),
      });
    }

    const decision = await authorizeOrganizationOperation(
      {
        context: input.context,
        organizationId: selectedMembership.organizationId,
        membershipId: selectedMembership.id,
        permission: input.permission,
      },
      {
        accountSecurity: this.dependencies.accountSecurity,
        organizations: this.dependencies.organizations,
        memberships: this.dependencies.memberships,
        authorizations: this.dependencies.authorizations,
        restrictions: this.dependencies.restrictions,
      },
    );
    if (!decision.allowed) {
      return Object.freeze({ kind: "access-denied" as const, reason: decision.reason });
    }

    const profile = await this.dependencies.profiles.getByOrganizationId(decision.organization.id);
    if (!profile) {
      return Object.freeze({
        kind: "organization-profile-missing" as const,
        organizationId: decision.organization.id,
        membershipId: decision.membership.id,
      });
    }

    return Object.freeze({
      kind: "authorized" as const,
      context: decision.context,
      organization: linkOrganizationAccountAndProfile(decision.organization, profile),
      membership: decision.membership,
      authorization: decision.authorization,
      permission: decision.permission,
    });
  }
}
