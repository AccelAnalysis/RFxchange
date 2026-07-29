import type { OrganizationId } from "../organizations/model";
import type { OrganizationMembershipId, UserId } from "../users/model";
import type { OrganizationUserAuthorization } from "./model";

export interface OrganizationUserAuthorizationRepository {
  getByMembershipId(
    membershipId: OrganizationMembershipId,
  ): Promise<OrganizationUserAuthorization | null>;
  listByUserId(userId: UserId): Promise<readonly OrganizationUserAuthorization[]>;
  listByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<readonly OrganizationUserAuthorization[]>;
  save(authorization: OrganizationUserAuthorization): Promise<void>;
}
