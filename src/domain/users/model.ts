import type { OrganizationAccount, OrganizationId } from "../organizations/model";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type UserId = Brand<string, "UserId">;
export type OrganizationMembershipId = Brand<string, "OrganizationMembershipId">;
export type LoginSubject = Brand<string, "LoginSubject">;
export type UserTimestamp = Brand<string, "UserTimestamp">;

export type OrganizationMembershipStatus = "active" | "inactive";

export interface UserLoginIdentity {
  /** Authentication provider name, such as the production identity provider. */
  readonly provider: string;
  /** Stable provider-side subject identifier. Passwords/secrets never belong here. */
  readonly subject: LoginSubject;
}

export interface UserSecuritySettings {
  readonly mfaEnabled: boolean;
  /** Incremented when credential/security material is rotated by the identity provider. */
  readonly credentialVersion: number;
}

export interface UserIdentity {
  /** Stable individual identity. This is not an organization tenant identifier. */
  readonly id: UserId;
  readonly name: string;
  readonly primaryEmail: string;
  readonly login: UserLoginIdentity;
  readonly security: UserSecuritySettings;
  readonly createdAt: UserTimestamp;
  readonly updatedAt: UserTimestamp;
}

export interface OrganizationMembership {
  readonly id: OrganizationMembershipId;
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly status: OrganizationMembershipStatus;
  readonly createdAt: UserTimestamp;
  readonly updatedAt: UserTimestamp;
}

export interface CreateUserIdentityInput {
  readonly id: string;
  readonly name: string;
  readonly primaryEmail: string;
  readonly loginProvider: string;
  readonly loginSubject: string;
  readonly mfaEnabled?: boolean;
  readonly credentialVersion?: number;
  readonly now: string;
}

export interface CreateOrganizationMembershipInput {
  readonly id: string;
  readonly status?: OrganizationMembershipStatus;
  readonly now: string;
}

export type UserOrganizationAccessResolution =
  | {
      readonly kind: "organization-access";
      readonly userId: UserId;
      readonly activeMemberships: readonly OrganizationMembership[];
    }
  | {
      readonly kind: "account-resolution";
      readonly userId: UserId;
      readonly reason: "no-active-organization-membership";
    };

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function timestamp(value: string): UserTimestamp {
  const normalized = requiredValue(value, "Timestamp");
  const parsed = Date.parse(normalized);

  if (Number.isNaN(parsed)) {
    throw new Error("Timestamp must be a valid ISO-compatible date-time value.");
  }

  return new Date(parsed).toISOString() as UserTimestamp;
}

function normalizedEmail(value: string): string {
  const email = requiredValue(value, "Primary email").toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Primary email must be valid.");
  }

  return email;
}

function credentialVersion(value: number): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("Credential version must be a positive integer.");
  }

  return value;
}

export function userId(value: string): UserId {
  return requiredValue(value, "User id") as UserId;
}

export function organizationMembershipId(value: string): OrganizationMembershipId {
  return requiredValue(value, "Organization membership id") as OrganizationMembershipId;
}

export function loginSubject(value: string): LoginSubject {
  return requiredValue(value, "Login subject") as LoginSubject;
}

export function createUserIdentity(input: CreateUserIdentityInput): UserIdentity {
  const now = timestamp(input.now);

  return Object.freeze({
    id: userId(input.id),
    name: requiredValue(input.name, "User name"),
    primaryEmail: normalizedEmail(input.primaryEmail),
    login: Object.freeze({
      provider: requiredValue(input.loginProvider, "Login provider"),
      subject: loginSubject(input.loginSubject),
    }),
    security: Object.freeze({
      mfaEnabled: input.mfaEnabled ?? false,
      credentialVersion: credentialVersion(input.credentialVersion ?? 1),
    }),
    createdAt: now,
    updatedAt: now,
  });
}

export function createOrganizationMembership(
  user: UserIdentity,
  organization: OrganizationAccount,
  input: CreateOrganizationMembershipInput,
): OrganizationMembership {
  const now = timestamp(input.now);

  return Object.freeze({
    id: organizationMembershipId(input.id),
    userId: user.id,
    organizationId: organization.id,
    status: input.status ?? "active",
    createdAt: now,
    updatedAt: now,
  });
}

export function resolveUserOrganizationAccess(
  user: UserIdentity,
  memberships: readonly OrganizationMembership[],
): UserOrganizationAccessResolution {
  const activeMemberships = memberships.filter(
    (membership) => membership.userId === user.id && membership.status === "active",
  );

  if (activeMemberships.length === 0) {
    return Object.freeze({
      kind: "account-resolution" as const,
      userId: user.id,
      reason: "no-active-organization-membership" as const,
    });
  }

  return Object.freeze({
    kind: "organization-access" as const,
    userId: user.id,
    activeMemberships: Object.freeze([...activeMemberships]),
  });
}
