import type { OrganizationAccount, OrganizationId } from "../organizations/model";
import type {
  OrganizationMembership,
  OrganizationMembershipId,
  UserId,
} from "../users/model";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type OrganizationRoleKey = Brand<string, "OrganizationRoleKey">;
export type AuthorizationTimestamp = Brand<string, "AuthorizationTimestamp">;

export const ORGANIZATION_PERMISSION_CATALOG = [
  "organization.profile.manage",
  "organization.users.manage",
  "organization.permissions.manage",
  "rfx.create",
  "rfx.publish",
  "response.create",
  "response.submit",
  "evaluation.review",
  "referral.manage",
  "teaming.manage",
  "document.manage",
  "resource.manage",
  "credibility.manage",
  "billing.manage",
] as const;

export type OrganizationPermission = (typeof ORGANIZATION_PERMISSION_CATALOG)[number];

export interface OrganizationUserAuthorization {
  /** Authorization is scoped to one membership, not to the global user identity. */
  readonly membershipId: OrganizationMembershipId;
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  /** Role is stored as organizational metadata; permission checks do not authorize by role name. */
  readonly roleKey: OrganizationRoleKey;
  /** Explicit capabilities effective for this membership. */
  readonly permissions: readonly OrganizationPermission[];
  readonly createdAt: AuthorizationTimestamp;
  readonly updatedAt: AuthorizationTimestamp;
}

export interface CreateOrganizationUserAuthorizationInput {
  readonly roleKey: string;
  readonly permissions: readonly string[];
  readonly now: string;
}

export type OrganizationPermissionDecision =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly reason:
        | "inactive-membership"
        | "authorization-membership-mismatch"
        | "wrong-organization"
        | "missing-permission";
    };

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function authorizationTimestamp(value: string): AuthorizationTimestamp {
  const normalized = requiredValue(value, "Authorization timestamp");
  const parsed = Date.parse(normalized);

  if (Number.isNaN(parsed)) {
    throw new Error("Authorization timestamp must be a valid ISO-compatible date-time value.");
  }

  return new Date(parsed).toISOString() as AuthorizationTimestamp;
}

export function organizationRoleKey(value: string): OrganizationRoleKey {
  const normalized = requiredValue(value, "Organization role key").toLowerCase();

  if (!/^[a-z][a-z0-9-]{1,63}$/.test(normalized)) {
    throw new Error("Organization role key must be a lowercase kebab-case identifier.");
  }

  return normalized as OrganizationRoleKey;
}

export function organizationPermission(value: string): OrganizationPermission {
  const normalized = requiredValue(value, "Organization permission");

  if (!(ORGANIZATION_PERMISSION_CATALOG as readonly string[]).includes(normalized)) {
    throw new Error(`Unknown organization permission: ${normalized}`);
  }

  return normalized as OrganizationPermission;
}

function normalizePermissions(values: readonly string[]): readonly OrganizationPermission[] {
  const permissions = values.map(organizationPermission);
  return Object.freeze([...new Set(permissions)]);
}

export function createOrganizationUserAuthorization(
  membership: OrganizationMembership,
  organization: OrganizationAccount,
  input: CreateOrganizationUserAuthorizationInput,
): OrganizationUserAuthorization {
  if (membership.organizationId !== organization.id) {
    throw new Error("Organization membership does not belong to the supplied organization tenant.");
  }

  const now = authorizationTimestamp(input.now);

  return Object.freeze({
    membershipId: membership.id,
    userId: membership.userId,
    organizationId: organization.id,
    roleKey: organizationRoleKey(input.roleKey),
    permissions: normalizePermissions(input.permissions),
    createdAt: now,
    updatedAt: now,
  });
}

export function evaluateOrganizationPermission(
  membership: OrganizationMembership,
  authorization: OrganizationUserAuthorization,
  organization: OrganizationAccount,
  permission: OrganizationPermission,
): OrganizationPermissionDecision {
  if (membership.status !== "active") {
    return Object.freeze({ allowed: false, reason: "inactive-membership" as const });
  }

  if (
    authorization.membershipId !== membership.id ||
    authorization.userId !== membership.userId ||
    authorization.organizationId !== membership.organizationId
  ) {
    return Object.freeze({
      allowed: false,
      reason: "authorization-membership-mismatch" as const,
    });
  }

  if (membership.organizationId !== organization.id) {
    return Object.freeze({ allowed: false, reason: "wrong-organization" as const });
  }

  if (!authorization.permissions.includes(permission)) {
    return Object.freeze({ allowed: false, reason: "missing-permission" as const });
  }

  return Object.freeze({ allowed: true as const });
}

export function assertOrganizationPermission(
  membership: OrganizationMembership,
  authorization: OrganizationUserAuthorization,
  organization: OrganizationAccount,
  permission: OrganizationPermission,
): void {
  const decision = evaluateOrganizationPermission(
    membership,
    authorization,
    organization,
    permission,
  );

  if (!decision.allowed) {
    throw new Error(`Organization permission denied: ${decision.reason}`);
  }
}
