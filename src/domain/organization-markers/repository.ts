import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type {
  OrganizationMarkerActivation,
  OrganizationMarkerEvent,
} from "./model.ts";

export interface OrganizationMarkerActivationRepository {
  getByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrganizationMarkerActivation | null>;
}

export interface OrganizationMarkerActivationUnitOfWork {
  save(input: Readonly<{
    activation: OrganizationMarkerActivation;
    event: OrganizationMarkerEvent | null;
    auditEvent: OrganizationActionAuditEvent | null;
  }>): Promise<void>;
}

export interface OrganizationMarkerRepositories {
  readonly activations: OrganizationMarkerActivationRepository;
  readonly unitOfWork: OrganizationMarkerActivationUnitOfWork;
}
