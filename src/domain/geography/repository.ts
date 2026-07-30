import type { AccessLifecycleRecord } from "../lifecycle/model";
import type { UserId } from "../users/model";
import type {
  GeographyDefinition,
  GeographyId,
  GeographyParticipationAuthorization,
  PrimaryOperatingGeographySelection,
} from "./model";

export interface GeographyDefinitionRepository {
  getById(id: GeographyId): Promise<GeographyDefinition | null>;
  save(definition: GeographyDefinition): Promise<void>;
}

export interface PrimaryOperatingGeographySelectionRepository {
  getByUserId(userId: UserId): Promise<PrimaryOperatingGeographySelection | null>;
}

export interface GeographyParticipationAuthorizationRepository {
  listByUserAndGeography(
    userId: UserId,
    geographyId: GeographyId,
  ): Promise<readonly GeographyParticipationAuthorization[]>;
  save(authorization: GeographyParticipationAuthorization): Promise<void>;
}

export interface PrimaryGeographySelectionUnitOfWork {
  commit(
    selection: PrimaryOperatingGeographySelection,
    lifecycle: AccessLifecycleRecord,
  ): Promise<void>;
}

export interface GeographyRepositories {
  readonly definitions: GeographyDefinitionRepository;
  readonly selections: PrimaryOperatingGeographySelectionRepository;
  readonly authorizations: GeographyParticipationAuthorizationRepository;
  readonly selectionUnitOfWork: PrimaryGeographySelectionUnitOfWork;
}
