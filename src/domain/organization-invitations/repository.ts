import type { OrganizationUserAuthorization } from "../authorization/model.ts";
import type { LegalAcknowledgement } from "../legal/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembership, UserId } from "../users/model.ts";
import type {
  OrganizationUserInvitation,
  OrganizationUserInvitationId,
} from "./model.ts";

export interface OrganizationUserInvitationRepository {
  getById(id: OrganizationUserInvitationId): Promise<OrganizationUserInvitation | null>;
  listByOrganizationId(organizationId: OrganizationId): Promise<readonly OrganizationUserInvitation[]>;
  findPendingByOrganizationAndEmail(
    organizationId: OrganizationId,
    email: string,
  ): Promise<OrganizationUserInvitation | null>;
  create(invitation: OrganizationUserInvitation): Promise<void>;
  save(invitation: OrganizationUserInvitation): Promise<void>;
}

export interface OrganizationInvitationAcceptanceCommit {
  readonly invitation: OrganizationUserInvitation;
  readonly acceptedByUserId: UserId;
  readonly membership: OrganizationMembership;
  readonly authorization: OrganizationUserAuthorization;
  readonly legalAcknowledgements: readonly LegalAcknowledgement[];
}

/**
 * Provider-neutral atomic persistence port. Implementations must make invitation acceptance,
 * organization membership, authorization, and legal acknowledgement evidence visible together.
 */
export interface OrganizationInvitationAcceptanceUnitOfWork {
  commitAcceptance(input: OrganizationInvitationAcceptanceCommit): Promise<void>;
}
