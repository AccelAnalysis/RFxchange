import type {
  BusinessReferral,
  ReferralCommunicationIntent,
} from "../../domain/referrals/model.ts";

export function referralInvitationDeliveryPermitted(
  referral: Pick<BusinessReferral, "status" | "recipient" | "attachedRecipientOrganizationId">,
  communication: ReferralCommunicationIntent | null,
): communication is ReferralCommunicationIntent {
  if (referral.status !== "sent") return false;
  if (
    referral.recipient.kind === "external" &&
    referral.attachedRecipientOrganizationId !== null
  ) {
    return false;
  }
  return Boolean(
    communication &&
    (communication.status === "queued" || communication.status === "retryable-failure"),
  );
}
