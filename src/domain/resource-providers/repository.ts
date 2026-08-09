import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { PlatformAdministrativeAuditEvent } from "../admin-authorization/admin-audit.ts";
import type {
  OfficialResourceProviderApplication,
  OfficialResourceProviderStatus,
  ProviderApplicationCommandReceipt,
  ProviderApplicationEvent,
  ProviderServiceProfile,
} from "./model.ts";

export interface ResourceProviderRepository {
  getApplicationByOrganizationId(organizationId: OrganizationId): Promise<OfficialResourceProviderApplication | null>;
  listApplications(): Promise<readonly OfficialResourceProviderApplication[]>;
  getCommand(id: string): Promise<ProviderApplicationCommandReceipt | null>;
  getStatusByOrganizationId(organizationId: OrganizationId): Promise<OfficialResourceProviderStatus | null>;
  getServiceProfileByOrganizationId(organizationId: OrganizationId): Promise<ProviderServiceProfile | null>;
  listEvents(applicationId: string): Promise<readonly ProviderApplicationEvent[]>;
  saveParticipant(input: Readonly<{ application: OfficialResourceProviderApplication; expectedVersion: number | null; event: ProviderApplicationEvent; command: ProviderApplicationCommandReceipt; audit: OrganizationActionAuditEvent; serviceProfile?: ProviderServiceProfile | null }>): Promise<void>;
  saveAdministrative(input: Readonly<{ application: OfficialResourceProviderApplication; expectedVersion: number; event: ProviderApplicationEvent; command: ProviderApplicationCommandReceipt; audit: PlatformAdministrativeAuditEvent; status?: OfficialResourceProviderStatus | null; serviceProfile?: ProviderServiceProfile | null }>): Promise<void>;
}
