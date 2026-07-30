import type { GeographyId } from "../geography/model.ts";
import type { AccessLifecycleRecord } from "../lifecycle/model.ts";
import type {
  OrganizationAccount,
  OrganizationId,
  OrganizationProfile,
} from "../organizations/model.ts";
import type { AccessJourneyId } from "../lifecycle/model.ts";
import type { UserId } from "../users/model.ts";
import type {
  OrganizationDiscoveryRecord,
  OrganizationEntityKeyReservation,
  OrganizationResolutionRecord,
} from "./model.ts";

export interface OrganizationDiscoveryRepository {
  getByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrganizationDiscoveryRecord | null>;
  listByGeographyId(
    geographyId: GeographyId,
  ): Promise<readonly OrganizationDiscoveryRecord[]>;
  save(record: OrganizationDiscoveryRecord): Promise<void>;
}

export interface OrganizationResolutionRepository {
  getByAccessJourneyId(
    accessJourneyId: AccessJourneyId,
  ): Promise<OrganizationResolutionRecord | null>;
  listByUserId(userId: UserId): Promise<readonly OrganizationResolutionRecord[]>;
}

export interface ExistingOrganizationResolutionCommit {
  readonly resolution: OrganizationResolutionRecord;
  readonly lifecycle: AccessLifecycleRecord;
}

export interface NewOrganizationResolutionCommit
  extends ExistingOrganizationResolutionCommit {
  readonly account: OrganizationAccount;
  readonly profile: OrganizationProfile;
  readonly discovery: OrganizationDiscoveryRecord;
  readonly entityKeys: readonly OrganizationEntityKeyReservation[];
}

export interface OrganizationResolutionUnitOfWork {
  selectExisting(commit: ExistingOrganizationResolutionCommit): Promise<void>;
  createNew(commit: NewOrganizationResolutionCommit): Promise<void>;
}

export interface OrganizationResolutionRepositories {
  readonly discovery: OrganizationDiscoveryRepository;
  readonly resolutions: OrganizationResolutionRepository;
  readonly unitOfWork: OrganizationResolutionUnitOfWork;
}

export class OrganizationEntityKeyConflictError extends Error {
  readonly conflictingOrganizationIds: readonly OrganizationId[];

  constructor(conflictingOrganizationIds: readonly OrganizationId[]) {
    super("Strong organization identity keys are already reserved.");
    this.name = "OrganizationEntityKeyConflictError";
    this.conflictingOrganizationIds = Object.freeze([...conflictingOrganizationIds]);
  }
}
