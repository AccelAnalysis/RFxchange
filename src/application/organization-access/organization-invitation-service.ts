import {
  REQUIRED_LEGAL_DOCUMENT_KINDS,
  type LegalDocumentKind,
  type LegalDocumentVersion,
} from "../../domain/legal/model.ts";
import type { LegalDocumentVersionRepository } from "../../domain/legal/repository.ts";
import {
  organizationUserInvitationId,
  type OrganizationUserInvitation,
} from "../../domain/organization-invitations/model.ts";
import type {
  OrganizationInvitationAcceptanceUnitOfWork,
  OrganizationUserInvitationRepository,
} from "../../domain/organization-invitations/repository.ts";
import type { OrganizationAccount } from "../../domain/organizations/model.ts";
import type {
  OrganizationMembership,
  UserIdentity,
} from "../../domain/users/model.ts";
import type { OrganizationMembershipRepository } from "../../domain/users/repository.ts";
import type { OrganizationUserAuthorization } from "../../domain/authorization/model.ts";
import {
  issueStandardOrganizationUserInvitation,
  planOrganizationInvitationAcceptance,
  type OrganizationInvitationAcceptancePlan,
} from "./invitations.ts";

function latestEffectiveVersion(
  kind: LegalDocumentKind,
  versions: readonly LegalDocumentVersion[],
  now: string,
): LegalDocumentVersion {
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new Error("Invitation workflow timestamp must be valid.");
  const eligible = versions
    .filter((version) => version.kind === kind && Date.parse(version.effectiveAt) <= nowMs)
    .sort((left, right) => Date.parse(right.effectiveAt) - Date.parse(left.effectiveAt));
  const current = eligible[0];
  if (!current) throw new Error(`No effective legal document version exists for ${kind}.`);
  return current;
}

export class OrganizationInvitationService {
  private readonly invitations: OrganizationUserInvitationRepository;
  private readonly memberships: OrganizationMembershipRepository;
  private readonly legalVersions: LegalDocumentVersionRepository;
  private readonly acceptance: OrganizationInvitationAcceptanceUnitOfWork;

  constructor(input: Readonly<{
    invitations: OrganizationUserInvitationRepository;
    memberships: OrganizationMembershipRepository;
    legalVersions: LegalDocumentVersionRepository;
    acceptance: OrganizationInvitationAcceptanceUnitOfWork;
  }>) {
    this.invitations = input.invitations;
    this.memberships = input.memberships;
    this.legalVersions = input.legalVersions;
    this.acceptance = input.acceptance;
  }

  async issue(input: Readonly<{
    id: string;
    organization: OrganizationAccount;
    inviter: UserIdentity;
    inviterMembership: OrganizationMembership;
    inviterAuthorization: OrganizationUserAuthorization;
    inviteeEmail: string;
    rolePresetKey: string;
    now: string;
    expiresAt?: string;
  }>): Promise<OrganizationUserInvitation> {
    const duplicate = await this.invitations.findPendingByOrganizationAndEmail(
      input.organization.id,
      input.inviteeEmail,
    );
    if (duplicate) {
      throw new Error("A pending invitation already exists for this email and organization.");
    }
    const invitation = issueStandardOrganizationUserInvitation(input);
    await this.invitations.create(invitation);
    return invitation;
  }

  async accept(input: Readonly<{
    invitationId: string;
    user: UserIdentity;
    organization: OrganizationAccount;
    membershipId: string;
    legalAcknowledgementIds: Readonly<Record<LegalDocumentKind, string>>;
    now: string;
  }>): Promise<OrganizationInvitationAcceptancePlan> {
    const invitation = await this.invitations.getById(
      organizationUserInvitationId(input.invitationId),
    );
    if (!invitation) throw new Error("Organization invitation was not found.");

    const existingMemberships = await this.memberships.listByUserId(input.user.id);
    const currentLegalVersions = await Promise.all(
      REQUIRED_LEGAL_DOCUMENT_KINDS.map(async (kind) =>
        latestEffectiveVersion(kind, await this.legalVersions.listByKind(kind), input.now),
      ),
    );

    const plan = planOrganizationInvitationAcceptance({
      invitation,
      user: input.user,
      organization: input.organization,
      existingMemberships,
      membershipId: input.membershipId,
      legalAcknowledgementIds: input.legalAcknowledgementIds,
      currentLegalVersions,
      now: input.now,
    });

    await this.acceptance.commitAcceptance({
      invitation: plan.invitation,
      acceptedByUserId: input.user.id,
      membership: plan.membership,
      authorization: plan.authorization,
      legalAcknowledgements: plan.legalAcknowledgements,
    });
    return plan;
  }
}
