import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type {
  ConfirmedOrganizationLocation,
  OrganizationLocationDraft,
  OrganizationLocationDraftId,
  OrganizationLocationEvent,
  OrganizationServiceGeography,
} from "./model.ts";

export interface OrganizationLocationDraftRepository {
  getById(id: OrganizationLocationDraftId): Promise<OrganizationLocationDraft | null>;
  save(draft: OrganizationLocationDraft, event: OrganizationLocationEvent): Promise<void>;
}

export interface ConfirmedOrganizationLocationRepository {
  getByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<ConfirmedOrganizationLocation | null>;
}

export interface OrganizationServiceGeographyRepository {
  getByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrganizationServiceGeography | null>;
}

export interface OrganizationLocationUnitOfWork {
  confirm(input: Readonly<{
    draft: OrganizationLocationDraft;
    location: ConfirmedOrganizationLocation;
    event: OrganizationLocationEvent;
    auditEvent: OrganizationActionAuditEvent;
  }>): Promise<void>;
  changeVisibility(input: Readonly<{
    location: ConfirmedOrganizationLocation;
    event: OrganizationLocationEvent;
    auditEvent: OrganizationActionAuditEvent;
  }>): Promise<void>;
  saveServiceGeographies(input: Readonly<{
    serviceGeographies: OrganizationServiceGeography;
    event: OrganizationLocationEvent;
    auditEvent: OrganizationActionAuditEvent;
  }>): Promise<void>;
}

export interface OrganizationLocationRepositories {
  readonly drafts: OrganizationLocationDraftRepository;
  readonly locations: ConfirmedOrganizationLocationRepository;
  readonly serviceGeographies: OrganizationServiceGeographyRepository;
  readonly unitOfWork: OrganizationLocationUnitOfWork;
}
