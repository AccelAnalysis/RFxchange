import { createHash, randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";

import { serializeAcquisitionContextToken } from "../../application/acquisition/acquisition-context.ts";
import { TransactionalEmailProviderError, TransactionalEmailService } from "../../application/communications/transactional-email.ts";
import {
  ReferralCreateAndSendService,
  type ReferralCreateAndSendDependencies,
} from "../../application/referrals/referral-create-and-send.ts";
import { resolveReferralCommunicationDeliveryAuthority } from "../../application/referrals/referral-communication-delivery.ts";
import {
  ReferralNetworkService,
  type ReferralAcquisitionIssuer,
} from "../../application/referrals/referral-network.ts";
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

function referralAcquisitionIdentity(referralId: string, commandId: string) {
  const digest = createHash("sha256")
    .update(`${commandId}:${referralId}`, "utf8")
    .digest("hex")
    .slice(0, 48);
  return Object.freeze({
    contextId: `acq-referral-${digest}`,
    eventId: `acq-event-referral-${digest}`,
  });
}

function createServerReferralDependencies(
  db: Firestore,
): ReferralCreateAndSendDependencies {
  const foundation = createFirestoreFoundationRepositories(db);
  const acquisition = createServerAcquisitionContextService();
  return Object.freeze({
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
      async issue(input: Parameters<ReferralAcquisitionIssuer["issue"]>[0]) {
        const token = await acquisition.issueTrusted({
          kind: "referral",
          subjectReference: input.referralId,
          channel: "referral-link",
          sourceReference: input.referralId,
        });
        return Object.freeze({
          contextId: token.contextId,
          serializedToken: serializeAcquisitionContextToken(token),
        });
      },
      prepare(input: Parameters<ReferralCreateAndSendDependencies["acquisition"]["prepare"]>[0]) {
        const identity = referralAcquisitionIdentity(input.referralId, input.commandId);
        const prepared = acquisition.prepareTrusted({
          kind: "referral",
          subjectReference: input.referralId,
          channel: "referral-link",
          sourceReference: input.referralId,
          contextId: identity.contextId,
          eventId: identity.eventId,
          issuedAt: input.issuedAt,
        });
        return Object.freeze({
          context: prepared.context,
          event: prepared.event,
          serializedToken: serializeAcquisitionContextToken(prepared.token),
        });
      },
    },
    publicOrigin: publicOrigin(),
    providerEligibility: createServerProviderEligibilityReader(db),
  });
}

export function createServerReferralNetworkService(db: Firestore = getServerFirestore()) {
  return new ReferralNetworkService(createServerReferralDependencies(db));
}

export function createServerReferralCreateAndSendService(
  db: Firestore = getServerFirestore(),
) {
  return new ReferralCreateAndSendService(createServerReferralDependencies(db));
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

export interface ReferralCommunicationAttemptResult {
  readonly communication: ReferralCommunicationIntent;
  readonly blocked: boolean;
  readonly attempted: boolean;
}

/**
 * The route may perform an early presentation/response check, but this function is the delivery
 * authority boundary. When delivery is configured, it atomically claims the durable intent and
 * current referral before invoking the provider. Referral lifecycle and recipient-attachment
 * writes coordinate with that bounded claim, closing the gap between a current-state read and the
 * external provider request.
 */
export async function attemptReferralCommunication(
  intent: ReferralCommunicationIntent,
  db: Firestore = getServerFirestore(),
): Promise<ReferralCommunicationAttemptResult> {
  const repository = new FirestoreReferralRepository(db);
  if (!microsoftConfigured()) {
    const authority = await resolveReferralCommunicationDeliveryAuthority(intent, {
      getCommunication: (id) => repository.getCommunication(id),
      getReferral: (id) => repository.getById(id),
    });
    return Object.freeze({
      communication: authority.communication,
      blocked: !authority.permitted,
      attempted: false,
    });
  }
  const configuration = microsoftGraphTransactionalEmailConfigurationFromEnvironment();
  const claimedAt = new Date();
  const claimId = `referral-delivery-${randomUUID()}`;
  const claim = await repository.claimCommunicationDelivery({
    communicationId: intent.id,
    claimId,
    claimedAt: claimedAt.toISOString(),
    // Token acquisition and Graph delivery each use the configured timeout. The additional
    // margin keeps lifecycle writes serialized until both bounded provider calls settle.
    expiresAt: new Date(
      claimedAt.getTime() + configuration.timeoutMilliseconds * 2 + 30_000,
    ).toISOString(),
  });
  if (!claim.claimed) {
    return Object.freeze({ communication: claim.communication, blocked: true, attempted: false });
  }
  const current = claim.communication;
  try {
    const service = new TransactionalEmailService(new MicrosoftGraphTransactionalEmailProvider(
      configuration,
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
    const communication = await repository.recordCommunicationResult({ intent: current, claimId, receipt });
    return Object.freeze({ communication, blocked: false, attempted: true });
  } catch (error) {
    const providerError = error instanceof TransactionalEmailProviderError ? error : null;
    const communication = await repository.recordCommunicationResult({
      intent: current,
      claimId,
      errorCode: providerError?.code ?? "transactional-email-provider-unhandled",
      retryable: providerError?.retryable ?? true,
    });
    return Object.freeze({ communication, blocked: false, attempted: true });
  }
}
