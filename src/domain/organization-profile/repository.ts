import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type {
  EssentialOrganizationProfile,
  OrganizationProfileCompletion,
  OrganizationProfileEvent,
} from "./model.ts";

export interface OrganizationProfileCompletionRepository {
  getByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrganizationProfileCompletion | null>;
}

export interface EssentialOrganizationProfileUnitOfWork {
  save(input: Readonly<{
    profile: EssentialOrganizationProfile;
    expectedProfileUpdatedAt: string;
    completion: OrganizationProfileCompletion;
    event: OrganizationProfileEvent;
    auditEvent: OrganizationActionAuditEvent;
  }>): Promise<void>;
}

export interface EssentialOrganizationProfileRepositories {
  readonly completions: OrganizationProfileCompletionRepository;
  readonly unitOfWork: EssentialOrganizationProfileUnitOfWork;
}
