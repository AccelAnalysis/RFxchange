import type { Firestore } from "firebase-admin/firestore";

import { serializeAcquisitionContextToken } from "../../application/acquisition/acquisition-context.ts";
import { TransactionalEmailProviderError, TransactionalEmailService } from "../../application/communications/transactional-email.ts";
import { ReferralNetworkService } from "../../application/referrals/referral-network.ts";
import { referralTransactionalEmailCatalog } from "../../application/referrals/referral-templates.ts";
import type { ReferralCommunicationIntent } from "../../domain/referrals/model.ts";
import { createServerAcquisitionContextService } from "../acquisition/runtime.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import {
  MicrosoftGraphTransactionalEmailProvider,
  microsoftGraphTransactionalEmailConfigurationFromEnvironment,
} from "../communications/microsoft-graph-transactional-email.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { FirestoreReferralRepository } from "../firestore/referrals.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { createServerProviderEligibilityReader } from "../resource-network/runtime.ts";

function publicOrigin(): string {
  const value = process.env.RFXCHANGE_PUBLIC_ORIGIN?.trim() || "http://localhost:3000";
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) throw new Error("RFXCHANGE_PUBLIC_ORIGIN must be an origin without a path.");
  return url.origin;
}

export function createServerReferralNetworkService(db: Firestore = getServerFirestore()) {
  const foundation = createFirestoreFoundationRepositories(db);
  const acquisition = createServerAcquisitionContextService();
  return new ReferralNetworkService({
    authorization: {
      accountSecurity: createServerFirebaseAccountSecurityService(),
      organizations: foundation.organizations.accounts,
      memberships: foundation.users.memberships,
      authorizations: foundation.organizationAuthorization,
      restrictions: foundation.lifecycle.restrictions,
    },
    profiles: foundation.organizations.profiles,
    repository: new FirestoreReferralRepository(db),
    acquisition: {
      async issue(input) {
        const token = await acquisition.issueTrusted({ kind: "referral", subjectReference: input.referralId, channel: "referral-link", sourceReference: input.referralId });
        return Object.freeze({ contextId: token.contextId, serializedToken: serializeAcquisitionContextToken(token) });
      },
    },
    publicOrigin: publicOrigin(),
    providerEligibility: createServerProviderEligibilityReader(db),
  });
}

function microsoftConfigured(): boolean {
  return [
    process.env.RFXCHANGE_ENV,
    process.env.RFXCHANGE_MICROSOFT_TENANT_ID,
    process.env.RFXCHANGE_MICROSOFT_CLIENT_ID,
    process.env.RFXCHANGE_MICROSOFT_CLIENT_SECRET,
    process.env.RFXCHANGE_MICROSOFT_APPROVED_SENDER,
  ].every((value) => Boolean(value?.trim()));
}

export async function attemptReferralCommunication(
  intent: ReferralCommunicationIntent,
  db: Firestore = getServerFirestore(),
): Promise<ReferralCommunicationIntent> {
  const repository = new FirestoreReferralRepository(db);
  const current = await repository.getCommunication(intent.id);
  if (!current) throw new Error("Referral communication intent is unavailable.");
  if (current.status === "accepted" || !microsoftConfigured()) return current;
  try {
    const service = new TransactionalEmailService(new MicrosoftGraphTransactionalEmailProvider(
      microsoftGraphTransactionalEmailConfigurationFromEnvironment(),
      referralTransactionalEmailCatalog,
    ));
    const receipt = await service.request({
      id: String(current.request.id), purpose: current.request.purpose,
      recipientEmail: String(current.request.recipient.email), recipientDisplayName: current.request.recipient.displayName,
      eventKey: String(current.request.eventKey), eventVersion: current.request.eventVersion,
      templateKey: String(current.request.templateKey), templateVersion: current.request.templateVersion,
      variables: current.request.variables, correlationId: String(current.request.metadata.correlationId),
      idempotencyKey: String(current.request.metadata.idempotencyKey), requestedAt: current.request.metadata.requestedAt,
      organizationId: current.request.metadata.organizationId, userId: current.request.metadata.userId,
      relatedObjectType: current.request.metadata.relatedObjectType, relatedObjectId: current.request.metadata.relatedObjectId,
      tags: current.request.metadata.tags,
    });
    return repository.recordCommunicationResult({ intent: current, receipt });
  } catch (error) {
    const providerError = error instanceof TransactionalEmailProviderError ? error : null;
    return repository.recordCommunicationResult({ intent: current, errorCode: providerError?.code ?? "transactional-email-provider-unhandled", retryable: providerError?.retryable ?? true });
  }
}
