import type {
  OrganizationAccount,
  OrganizationId,
  OrganizationProfile,
  OrganizationProfileId,
} from "./model";

export interface OrganizationAccountRepository {
  getById(id: OrganizationId): Promise<OrganizationAccount | null>;
  create(account: OrganizationAccount): Promise<void>;
}

export interface OrganizationProfileRepository {
  getById(id: OrganizationProfileId): Promise<OrganizationProfile | null>;
  getByOrganizationId(organizationId: OrganizationId): Promise<OrganizationProfile | null>;
  create(profile: OrganizationProfile): Promise<void>;
}

/**
 * Persistence adapters must keep account and profile records distinct while
 * preserving the profile.organizationId -> account.id relationship.
 */
export interface OrganizationRepositories {
  readonly accounts: OrganizationAccountRepository;
  readonly profiles: OrganizationProfileRepository;
}
