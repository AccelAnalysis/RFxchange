import type { OrganizationId } from "../organizations/model";
import type { OrganizationMembershipId, UserId } from "../users/model";
import type {
  OrganizationAuthorityRepresentation,
  OrganizationAuthorityRepresentationId,
  PlatformActorId,
  PlatformChangeDirective,
  PlatformChangeDirectiveId,
  PlatformChangeTargetKind,
} from "./model";

export interface OrganizationAuthorityRepresentationRepository {
  append(record: OrganizationAuthorityRepresentation): Promise<void>;
  findById(id: OrganizationAuthorityRepresentationId): Promise<OrganizationAuthorityRepresentation | null>;
  listByOrganizationId(organizationId: OrganizationId): Promise<readonly OrganizationAuthorityRepresentation[]>;
  listByUserId(userId: UserId): Promise<readonly OrganizationAuthorityRepresentation[]>;
  listByMembershipId(
    membershipId: OrganizationMembershipId,
  ): Promise<readonly OrganizationAuthorityRepresentation[]>;
}

export interface PlatformChangeDirectiveRepository {
  append(directive: PlatformChangeDirective): Promise<void>;
  findById(id: PlatformChangeDirectiveId): Promise<PlatformChangeDirective | null>;
  listByActorId(actorId: PlatformActorId): Promise<readonly PlatformChangeDirective[]>;
  listByTargetKind(targetKind: PlatformChangeTargetKind): Promise<readonly PlatformChangeDirective[]>;
}

export interface GovernanceRepositories {
  readonly organizationAuthorityRepresentations: OrganizationAuthorityRepresentationRepository;
  readonly platformChangeDirectives: PlatformChangeDirectiveRepository;
}
