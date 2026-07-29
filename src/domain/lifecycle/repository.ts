import type { OrganizationId } from "../organizations/model";
import type { OrganizationMembershipId } from "../users/model";
import type {
  AccessJourneyId,
  AccessLifecycleRecord,
  AccessRestrictionId,
  AccessRestrictionRecord,
} from "./model";

export interface AccessLifecycleRepository {
  getById(id: AccessJourneyId): Promise<AccessLifecycleRecord | null>;
  save(record: AccessLifecycleRecord): Promise<void>;
}

export interface AccessRestrictionRepository {
  getById(id: AccessRestrictionId): Promise<AccessRestrictionRecord | null>;
  getForOrganization(organizationId: OrganizationId): Promise<AccessRestrictionRecord | null>;
  getForMembership(membershipId: OrganizationMembershipId): Promise<AccessRestrictionRecord | null>;
  save(record: AccessRestrictionRecord): Promise<void>;
}

export interface AccessLifecycleRepositories {
  lifecycle: AccessLifecycleRepository;
  restrictions: AccessRestrictionRepository;
}
