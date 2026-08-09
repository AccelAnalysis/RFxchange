import type { TransactionalEmailDeliveryReceipt } from "../communications/transactional-email.ts";
import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type {
  ProviderAcquisitionInvitation,
  ProviderDiscoveryPublication,
  ProviderNetworkCommandReceipt,
  ProviderNetworkEvent,
  ProviderRequestMessage,
  ProviderResource,
} from "./model.ts";

export interface ResourceNetworkRepository {
  getPublication(organizationId: OrganizationId): Promise<ProviderDiscoveryPublication | null>;
  listPublishedPublications(): Promise<readonly ProviderDiscoveryPublication[]>;
  getResource(id: string): Promise<ProviderResource | null>;
  listResourcesByOrganization(organizationId: OrganizationId): Promise<readonly ProviderResource[]>;
  listPublishedResources(): Promise<readonly ProviderResource[]>;
  listMessages(referralId: string): Promise<readonly ProviderRequestMessage[]>;
  getCommand(id: string): Promise<ProviderNetworkCommandReceipt | null>;
  getInvitation(id: string): Promise<ProviderAcquisitionInvitation | null>;
  listInvitationsByOrganization(organizationId: OrganizationId): Promise<readonly ProviderAcquisitionInvitation[]>;
  savePublication(input: Readonly<{ publication: ProviderDiscoveryPublication; expectedVersion: number | null; event: ProviderNetworkEvent; command: ProviderNetworkCommandReceipt; audit: OrganizationActionAuditEvent }>): Promise<void>;
  saveResource(input: Readonly<{ resource: ProviderResource; expectedVersion: number | null; event: ProviderNetworkEvent; command: ProviderNetworkCommandReceipt; audit: OrganizationActionAuditEvent }>): Promise<void>;
  appendMessage(input: Readonly<{ message: ProviderRequestMessage; event: ProviderNetworkEvent; command: ProviderNetworkCommandReceipt; audit: OrganizationActionAuditEvent }>): Promise<void>;
  saveInvitation(input: Readonly<{ invitation: ProviderAcquisitionInvitation; event: ProviderNetworkEvent; command: ProviderNetworkCommandReceipt; audit: OrganizationActionAuditEvent }>): Promise<void>;
  recordInvitationDelivery(input: Readonly<{ invitation: ProviderAcquisitionInvitation; receipt?: TransactionalEmailDeliveryReceipt | null; errorCode?: string | null; retryable?: boolean }>): Promise<ProviderAcquisitionInvitation>;
}
