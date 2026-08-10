import type {
  BusinessReferral,
  ReferralCommunicationIntent,
} from "../../domain/referrals/model.ts";
import { referralInvitationDeliveryPermitted } from "./referral-invitation-delivery.ts";

export interface ReferralCommunicationDeliveryAuthority {
  readonly communication: ReferralCommunicationIntent;
  readonly referral: BusinessReferral;
  readonly permitted: boolean;
}

export interface ReferralCommunicationDeliveryAuthorityDependencies {
  readonly getCommunication: (id: string) => Promise<ReferralCommunicationIntent | null>;
  readonly getReferral: (id: string) => Promise<BusinessReferral | null>;
}

/**
 * Resolves delivery authority from durable current state rather than trusting a route or replay
 * snapshot that may have become stale. Provider delivery must occur only after this resolver runs.
 */
export async function resolveReferralCommunicationDeliveryAuthority(
  intent: Pick<ReferralCommunicationIntent, "id">,
  dependencies: ReferralCommunicationDeliveryAuthorityDependencies,
): Promise<ReferralCommunicationDeliveryAuthority> {
  const communication = await dependencies.getCommunication(intent.id);
  if (!communication) throw new Error("Referral communication intent is unavailable.");
  const referral = await dependencies.getReferral(communication.referralId);
  if (!referral || referral.communicationMessageId !== communication.id) {
    throw new Error("Referral communication authority is unavailable.");
  }
  return Object.freeze({
    communication,
    referral,
    permitted: referralInvitationDeliveryPermitted(referral, communication),
  });
}
