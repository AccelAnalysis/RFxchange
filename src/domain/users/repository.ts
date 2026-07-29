import type { OrganizationId } from "../organizations/model";
import type {
  LoginSubject,
  OrganizationMembership,
  OrganizationMembershipId,
  UserId,
  UserIdentity,
} from "./model";

export interface UserIdentityRepository {
  getById(id: UserId): Promise<UserIdentity | null>;
  getByPrimaryEmail(primaryEmail: string): Promise<UserIdentity | null>;
  getByLogin(provider: string, subject: LoginSubject): Promise<UserIdentity | null>;
  create(user: UserIdentity): Promise<void>;
}

export interface OrganizationMembershipRepository {
  getById(id: OrganizationMembershipId): Promise<OrganizationMembership | null>;
  listByUserId(userId: UserId): Promise<readonly OrganizationMembership[]>;
  listActiveByUserId(userId: UserId): Promise<readonly OrganizationMembership[]>;
  listByOrganizationId(organizationId: OrganizationId): Promise<readonly OrganizationMembership[]>;
  create(membership: OrganizationMembership): Promise<void>;
}

export interface UserRepositories {
  readonly users: UserIdentityRepository;
  readonly memberships: OrganizationMembershipRepository;
}
