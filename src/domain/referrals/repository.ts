import type {
  AcquisitionContextEnvelope,
  AcquisitionContextEvent,
} from "../acquisition/model.ts";
import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { TransactionalEmailDeliveryReceipt } from "../communications/transactional-email.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type {
  BusinessReferral,
  ReferralCommandReceipt,
  ReferralCommunicationIntent,
  ReferralEducationAcknowledgement,
  ReferralEvent,
  ReferralPersistenceBundle,
} from "./model.ts";

export class ReferralPersistenceConflictError extends Error {
  readonly code = "persistence-conflict" as const;

  constructor(message: string) {
    super(message);
    this.name = "ReferralPersistenceConflictError";
  }
}

export interface ReferralCreateAndSendBundle {
  readonly referral: BusinessReferral;
  readonly events: readonly [ReferralEvent, ReferralEvent];
  readonly command: ReferralCommandReceipt;
  readonly education: ReferralEducationAcknowledgement;
  readonly audits: readonly OrganizationActionAuditEvent[];
  readonly communication: ReferralCommunicationIntent | null;
  readonly acquisition: Readonly<{
    context: AcquisitionContextEnvelope;
    event: AcquisitionContextEvent;
  }> | null;
}

export type ReferralCreateAndSendPersistenceResult = "created" | "replayed";

export interface ReferralCommunicationDeliveryClaimResult {
  readonly communication: ReferralCommunicationIntent;
  readonly referral: BusinessReferral;
  readonly claimed: boolean;
}

export interface ReferralRepository {
  getById(id: string): Promise<BusinessReferral | null>;
  listInvolvingOrganization(organizationId: OrganizationId): Promise<readonly BusinessReferral[]>;
  getCommand(id: string): Promise<ReferralCommandReceipt | null>;
  getEducation(organizationId: OrganizationId, actorUserId: string): Promise<ReferralEducationAcknowledgement | null>;
  acknowledgeEducation(input: Readonly<{ acknowledgement: ReferralEducationAcknowledgement; command: ReferralCommandReceipt; audit: OrganizationActionAuditEvent }>): Promise<void>;
  save(bundle: ReferralPersistenceBundle): Promise<void>;
  saveCreateAndSend(bundle: ReferralCreateAndSendBundle): Promise<ReferralCreateAndSendPersistenceResult>;
  attachInvitation(input: Readonly<{ referral: BusinessReferral; event: ReferralEvent; command: ReferralCommandReceipt; audit: OrganizationActionAuditEvent }>): Promise<void>;
  getCommunication(id: string): Promise<ReferralCommunicationIntent | null>;
  claimCommunicationDelivery(input: Readonly<{ communicationId: string; claimId: string; claimedAt: string; expiresAt: string }>): Promise<ReferralCommunicationDeliveryClaimResult>;
  recordCommunicationResult(input: Readonly<{ intent: ReferralCommunicationIntent; claimId?: string | null; receipt?: TransactionalEmailDeliveryReceipt | null; errorCode?: string | null; retryable?: boolean }>): Promise<ReferralCommunicationIntent>;
}
