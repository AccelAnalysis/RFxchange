import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { TransactionalEmailDeliveryReceipt } from "../communications/transactional-email.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type {
  BusinessReferral, ReferralCommandReceipt, ReferralCommunicationIntent, ReferralEducationAcknowledgement,
  ReferralEvent, ReferralPersistenceBundle,
} from "./model.ts";

export interface ReferralRepository {
  getById(id: string): Promise<BusinessReferral | null>;
  listInvolvingOrganization(organizationId: OrganizationId): Promise<readonly BusinessReferral[]>;
  getCommand(id: string): Promise<ReferralCommandReceipt | null>;
  getEducation(organizationId: OrganizationId, actorUserId: string): Promise<ReferralEducationAcknowledgement | null>;
  acknowledgeEducation(input: Readonly<{ acknowledgement: ReferralEducationAcknowledgement; command: ReferralCommandReceipt; audit: OrganizationActionAuditEvent }>): Promise<void>;
  save(bundle: ReferralPersistenceBundle): Promise<void>;
  attachInvitation(input: Readonly<{ referral: BusinessReferral; event: ReferralEvent; command: ReferralCommandReceipt; audit: OrganizationActionAuditEvent }>): Promise<void>;
  getCommunication(id: string): Promise<ReferralCommunicationIntent | null>;
  recordCommunicationResult(input: Readonly<{ intent: ReferralCommunicationIntent; receipt?: TransactionalEmailDeliveryReceipt | null; errorCode?: string | null; retryable?: boolean }>): Promise<ReferralCommunicationIntent>;
}
