import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type {
  OrganizationCapabilityClaim,
  OrganizationIndustryProfile,
  OrganizationMarketPreferences,
  OrganizationMarketProfileCommandReceipt,
  OrganizationMarketProfileEvent,
  OrganizationPastPerformance,
  OrganizationProvisionalTerm,
} from "./model.ts";

export interface OrganizationCapabilityClaimRepository {
  getById(id: string): Promise<OrganizationCapabilityClaim | null>;
  listByOrganizationId(organizationId: OrganizationId): Promise<readonly OrganizationCapabilityClaim[]>;
}

export interface OrganizationMarketProfileRepository {
  readonly claims: OrganizationCapabilityClaimRepository;
  getIndustryProfile(organizationId: OrganizationId): Promise<OrganizationIndustryProfile | null>;
  listPastPerformance(organizationId: OrganizationId): Promise<readonly OrganizationPastPerformance[]>;
  getPreferences(organizationId: OrganizationId): Promise<OrganizationMarketPreferences | null>;
  listProvisionalTerms(organizationId: OrganizationId): Promise<readonly OrganizationProvisionalTerm[]>;
  getCommand(id: string): Promise<OrganizationMarketProfileCommandReceipt | null>;
  save(input: Readonly<{
    command: OrganizationMarketProfileCommandReceipt;
    event: OrganizationMarketProfileEvent;
    auditEvent: OrganizationActionAuditEvent;
    record:
      | Readonly<{ kind: "capability"; value: OrganizationCapabilityClaim }>
      | Readonly<{ kind: "industry"; value: OrganizationIndustryProfile }>
      | Readonly<{ kind: "past-performance"; value: OrganizationPastPerformance }>
      | Readonly<{ kind: "preferences"; value: OrganizationMarketPreferences }>
      | Readonly<{ kind: "provisional-term"; value: OrganizationProvisionalTerm }>;
  }>): Promise<void>;
}
