import { createOrganizationUserAuthorization } from "../../domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../../domain/authorization/organization-role-presets.ts";
import {
  REQUIRED_ACKNOWLEDGEMENT_STATUS,
  REQUIRED_LEGAL_DOCUMENT_KINDS,
  createLegalAcknowledgement,
  type LegalAcknowledgement,
  type LegalDocumentKind,
  type LegalDocumentVersion,
} from "../../domain/legal/model.ts";
import {
  acceptOrganizationUserInvitation,
  createOrganizationUserInvitation,
  type OrganizationUserInvitation,
} from "../../domain/organization-invitations/model.ts";
import type { OrganizationAccount } from "../../domain/organizations/model.ts";
import {
  createOrganizationMembership,
  type OrganizationMembership,
  type UserIdentity,
} from "../../domain/users/model.ts";
import type { OrganizationUserAuthorization } from "../../domain/authorization/model.ts";

export const DEFAULT_ORGANIZATION_INVITATION_TTL_DAYS = 7 as const;

export interface OrganizationInvitationAcceptancePlan {
  readonly invitation: OrganizationUserInvitation;
  readonly membership: OrganizationMembership;
  readonly authorization: OrganizationUserAuthorization;
  readonly legalAcknowledgements: readonly LegalAcknowledgement[];
}

function addDays(iso: string, days: number): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) throw new Error("Invitation timestamp must be valid.");
  return new Date(parsed + days * 24 * 60 * 60 * 1000).toISOString();
}

export function issueStandardOrganizationUserInvitation(input: Readonly<{
  id: string;
  organization: OrganizationAccount;
  inviter: UserIdentity;
  inviterMembership: OrganizationMembership;
  inviterAuthorization: OrganizationUserAuthorization;
  inviteeEmail: string;
  rolePresetKey: string;
  now: string;
  expiresAt?: string;
}>): OrganizationUserInvitation {
  return createOrganizationUserInvitation({
    id: input.id,
    organization: input.organization,
    inviter: input.inviter,
    inviterMembership: input.inviterMembership,
    inviterAuthorization: input.inviterAuthorization,
    inviteeEmail: input.inviteeEmail,
    rolePreset: standardOrganizationRolePreset(input.rolePresetKey),
    now: input.now,
    expiresAt: input.expiresAt ?? addDays(input.now, DEFAULT_ORGANIZATION_INVITATION_TTL_DAYS),
  });
}

function currentLegalVersionsByKind(
  versions: readonly LegalDocumentVersion[],
): Readonly<Record<LegalDocumentKind, LegalDocumentVersion>> {
  if (versions.length !== REQUIRED_LEGAL_DOCUMENT_KINDS.length) {
    throw new Error("Invitation acceptance requires exactly one current version of every required legal document.");
  }
  const map = new Map<LegalDocumentKind, LegalDocumentVersion>();
  for (const version of versions) {
    if (map.has(version.kind)) throw new Error(`Duplicate current legal document kind: ${version.kind}.`);
    map.set(version.kind, version);
  }
  for (const kind of REQUIRED_LEGAL_DOCUMENT_KINDS) {
    if (!map.has(kind)) throw new Error(`Missing current legal document version for ${kind}.`);
  }
  return Object.freeze(Object.fromEntries(map) as Record<LegalDocumentKind, LegalDocumentVersion>);
}

export function planOrganizationInvitationAcceptance(input: Readonly<{
  invitation: OrganizationUserInvitation;
  user: UserIdentity;
  organization: OrganizationAccount;
  existingMemberships: readonly OrganizationMembership[];
  membershipId: string;
  legalAcknowledgementIds: Readonly<Record<LegalDocumentKind, string>>;
  currentLegalVersions: readonly LegalDocumentVersion[];
  now: string;
}>): OrganizationInvitationAcceptancePlan {
  if (input.invitation.organizationId !== input.organization.id) {
    throw new Error("Organization invitation belongs to a different organization tenant.");
  }
  if (
    input.existingMemberships.some(
      (membership) =>
        membership.userId === input.user.id && membership.organizationId === input.organization.id,
    )
  ) {
    throw new Error("User already has an organization membership; invitation acceptance will not create a duplicate membership.");
  }

  const acceptedInvitation = acceptOrganizationUserInvitation(
    input.invitation,
    input.user,
    input.now,
  );

  const membership = createOrganizationMembership(input.user, input.organization, {
    id: input.membershipId,
    status: "active",
    now: input.now,
  });

  const authorization = createOrganizationUserAuthorization(membership, input.organization, {
    roleKey: acceptedInvitation.roleKey,
    permissions: acceptedInvitation.permissions,
    now: input.now,
  });

  const versions = currentLegalVersionsByKind(input.currentLegalVersions);
  const legalAcknowledgements = REQUIRED_LEGAL_DOCUMENT_KINDS.map((kind) =>
    createLegalAcknowledgement(
      input.user,
      membership,
      input.organization,
      versions[kind],
      {
        id: input.legalAcknowledgementIds[kind],
        status: REQUIRED_ACKNOWLEDGEMENT_STATUS[kind],
        now: input.now,
      },
    ),
  );

  return Object.freeze({
    invitation: acceptedInvitation,
    membership,
    authorization,
    legalAcknowledgements: Object.freeze(legalAcknowledgements),
  });
}
