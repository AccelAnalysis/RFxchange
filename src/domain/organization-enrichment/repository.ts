import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type {
  OrganizationAdditionalLocation,
  OrganizationAdditionalLocationDraft,
  OrganizationCredential,
  OrganizationEnrichmentCommandReceipt,
  OrganizationEnrichmentEvent,
  OrganizationProfileAsset,
} from "./model.ts";

export class OrganizationEnrichmentPersistenceConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationEnrichmentPersistenceConflictError";
  }
}

export interface OrganizationEnrichmentRepository {
  listCredentials(organizationId: OrganizationId): Promise<readonly OrganizationCredential[]>;
  getCredential(id: string): Promise<OrganizationCredential | null>;
  listProfileAssets(organizationId: OrganizationId): Promise<readonly OrganizationProfileAsset[]>;
  getProfileAsset(id: string): Promise<OrganizationProfileAsset | null>;
  listAdditionalLocations(organizationId: OrganizationId): Promise<readonly OrganizationAdditionalLocation[]>;
  getAdditionalLocation(id: string): Promise<OrganizationAdditionalLocation | null>;
  getAdditionalLocationDraft(id: string): Promise<OrganizationAdditionalLocationDraft | null>;
  getCommand(id: string): Promise<OrganizationEnrichmentCommandReceipt | null>;
  save(input: Readonly<{
    command: OrganizationEnrichmentCommandReceipt;
    event: OrganizationEnrichmentEvent;
    auditEvent: OrganizationActionAuditEvent;
    record:
      | Readonly<{ kind: "credential"; value: OrganizationCredential }>
      | Readonly<{ kind: "profile-asset"; value: OrganizationProfileAsset }>
      | Readonly<{ kind: "location-draft"; value: OrganizationAdditionalLocationDraft }>
      | Readonly<{ kind: "location-confirmation"; draft: OrganizationAdditionalLocationDraft; value: OrganizationAdditionalLocation }>
      | Readonly<{ kind: "additional-location"; value: OrganizationAdditionalLocation }>;
  }>): Promise<void>;
}
