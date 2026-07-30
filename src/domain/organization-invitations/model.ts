import type { OrganizationUserAuthorization } from "../authorization/model.ts";
import { assertOrganizationPermission, organizationPermission } from "../authorization/model.ts";
import type { StandardOrganizationRolePreset } from "../authorization/organization-role-presets.ts";
import type { OrganizationAccount, OrganizationId } from "../organizations/model.ts";
import type {
  OrganizationMembership,
  OrganizationMembershipId,
  UserId,
  UserIdentity,
} from "../users/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type OrganizationUserInvitationId = Brand<string, "OrganizationUserInvitationId">;
export type OrganizationUserInvitationTimestamp = Brand<string, "OrganizationUserInvitationTimestamp">;
export type OrganizationUserInvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface OrganizationUserInvitation {
  readonly id: OrganizationUserInvitationId;
  readonly organizationId: OrganizationId;
  readonly email: string;
  readonly invitedByUserId: UserId;
  readonly invitedByMembershipId: OrganizationMembershipId;
  readonly roleKey: StandardOrganizationRolePreset["key"];
  readonly permissions: StandardOrganizationRolePreset["permissions"];
  readonly status: OrganizationUserInvitationStatus;
  readonly createdAt: OrganizationUserInvitationTimestamp;
  readonly expiresAt: OrganizationUserInvitationTimestamp;
  readonly acceptedByUserId: UserId | null;
  readonly acceptedAt: OrganizationUserInvitationTimestamp | null;
  readonly revokedAt: OrganizationUserInvitationTimestamp | null;
}

function requiredValue(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function timestamp(value: string, label: string): OrganizationUserInvitationTimestamp {
  const normalized = requiredValue(value, label);
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid ISO-compatible date-time.`);
  return new Date(parsed).toISOString() as OrganizationUserInvitationTimestamp;
}

function normalizedEmail(value: string): string {
  const email = requiredValue(value, "Invitation email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invitation email must be valid.");
  }
  return email;
}

export function organizationUserInvitationId(value: string): OrganizationUserInvitationId {
  return requiredValue(value, "Organization invitation id") as OrganizationUserInvitationId;
}

export function createOrganizationUserInvitation(input: Readonly<{
  id: string;
  organization: OrganizationAccount;
  inviter: UserIdentity;
  inviterMembership: OrganizationMembership;
  inviterAuthorization: OrganizationUserAuthorization;
  inviteeEmail: string;
  rolePreset: StandardOrganizationRolePreset;
  now: string;
  expiresAt: string;
}>): OrganizationUserInvitation {
  assertOrganizationPermission(
    input.inviterMembership,
    input.inviterAuthorization,
    input.organization,
    organizationPermission("organization.users.manage"),
  );
  assertOrganizationPermission(
    input.inviterMembership,
    input.inviterAuthorization,
    input.organization,
    organizationPermission("organization.permissions.manage"),
  );
  if (input.inviterMembership.userId !== input.inviter.id) {
    throw new Error("Invitation actor does not match the authorized organization membership.");
  }

  const createdAt = timestamp(input.now, "Invitation creation timestamp");
  const expiresAt = timestamp(input.expiresAt, "Invitation expiration timestamp");
  if (Date.parse(expiresAt) <= Date.parse(createdAt)) {
    throw new Error("Invitation expiration must be after invitation creation.");
  }

  return Object.freeze({
    id: organizationUserInvitationId(input.id),
    organizationId: input.organization.id,
    email: normalizedEmail(input.inviteeEmail),
    invitedByUserId: input.inviter.id,
    invitedByMembershipId: input.inviterMembership.id,
    roleKey: input.rolePreset.key,
    permissions: Object.freeze([...input.rolePreset.permissions]),
    status: "pending" as const,
    createdAt,
    expiresAt,
    acceptedByUserId: null,
    acceptedAt: null,
    revokedAt: null,
  });
}

export function invitationIsUsable(
  invitation: OrganizationUserInvitation,
  user: UserIdentity,
  now: string,
): boolean {
  const current = timestamp(now, "Invitation evaluation timestamp");
  return (
    invitation.status === "pending" &&
    invitation.email === user.primaryEmail.trim().toLowerCase() &&
    Date.parse(current) < Date.parse(invitation.expiresAt)
  );
}

export function acceptOrganizationUserInvitation(
  invitation: OrganizationUserInvitation,
  user: UserIdentity,
  now: string,
): OrganizationUserInvitation {
  const acceptedAt = timestamp(now, "Invitation acceptance timestamp");
  if (invitation.status !== "pending") {
    throw new Error(`Only a pending invitation can be accepted; received ${invitation.status}.`);
  }
  if (invitation.email !== user.primaryEmail.trim().toLowerCase()) {
    throw new Error("Signed-in user email does not match the organization invitation.");
  }
  if (Date.parse(acceptedAt) >= Date.parse(invitation.expiresAt)) {
    throw new Error("Organization invitation has expired.");
  }

  return Object.freeze({
    ...invitation,
    status: "accepted" as const,
    acceptedByUserId: user.id,
    acceptedAt,
  });
}

export function revokeOrganizationUserInvitation(
  invitation: OrganizationUserInvitation,
  now: string,
): OrganizationUserInvitation {
  if (invitation.status !== "pending") {
    throw new Error("Only a pending organization invitation can be revoked.");
  }
  return Object.freeze({
    ...invitation,
    status: "revoked" as const,
    revokedAt: timestamp(now, "Invitation revocation timestamp"),
  });
}
