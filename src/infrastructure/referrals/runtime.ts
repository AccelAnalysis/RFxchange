import { createHash } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";

import { serializeAcquisitionContextToken } from "../../application/acquisition/acquisition-context.ts";
import { TransactionalEmailProviderError, TransactionalEmailService } from "../../application/communications/transactional-email.ts";
import {
  ReferralCreateAndSendService,
  type ReferralCreateAndSendDependencies,
} from "../../application/referrals/referral-create-and-send.ts";
import { referralInvitationDeliveryPermitted } from "../../application/referrals/referral-invitation-delivery.ts";
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
 * authority boundary. It reloads both the durable intent and its current referral immediately
 * before provider delivery so a stale route snapshot cannot authorize an invitation after the
 * lifecycle advances or an external acquisition invitation is consumed.
 */
export async function attemptReferralCommunication(
  intent: ReferralCommunicationIntent,
  db: Firestore = getServerFirestore(),
): Promise<ReferralCommunicationAttemptResult> {
  const repository = new FirestoreReferralRepository(db);
  const current = await repository.getCommunication(intent.id);
  if (!current) throw new Error("Referral communication intent is unavailable.");
  const referral = await repository.getById(current.referralId);
  if (!referral || referral.communicationMessageId !== current.id) {
    throw new Error("Referral communication authority is unavailable.");
  }
  if (!referralInvitationDeliveryPermitted(referral, current)) {
    return Object.freeze({ communication: current, blocked: true, attempted: false });
  }
  if (!microsoftConfigured()) {
    return Object.freeze({ communication: current, blocked: false, attempted: false });
  }
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
    const communication = await repository.recordCommunicationResult({ intent: current, receipt });
    return Object.freeze({ communication, blocked: false, attempted: true });
  } catch (error) {
    const providerError = error instanceof TransactionalEmailProviderError ? error : null;
    const communication = await repository.recordCommunicationResult({
      intent: current,
      errorCode: providerError?.code ?? "transactional-email-provider-unhandled",
      retryable: providerError?.retryable ?? true,
    });
    return Object.freeze({ communication, blocked: false, attempted: true });
  }
}
