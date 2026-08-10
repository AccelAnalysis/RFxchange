import { createHash, randomUUID } from "node:crypto";

import { authorizeOrganizationOperation } from "../auth/authorize-organization-operation.ts";
import type {
  AcquisitionContextEnvelope,
  AcquisitionContextEvent,
} from "../../domain/acquisition/model.ts";
import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import { createTransactionalEmailRequest } from "../../domain/communications/transactional-email.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import { hydrateEssentialOrganizationProfile } from "../../domain/organization-profile/model.ts";
import {
  createReferral,
  transitionReferral,
  type BusinessReferral,
  type ProviderReferralContext,
  type ReferralCommandReceipt,
  type ReferralCommunicationIntent,
  type ReferralContactMethod,
  type ReferralEducationAcknowledgement,
  type ReferralEvent,
  type ReferralNeed,
  type ReferralPurpose,
  type ReferralRecipient,
  type ReferralSharedField,
  type ReferralUrgency,
} from "../../domain/referrals/model.ts";
import type { ReferralCreateAndSendBundle } from "../../domain/referrals/repository.ts";
import { organizationMembershipId } from "../../domain/users/model.ts";
import {
  PROVIDER_REQUEST_EVENT,
  REFERRAL_INVITATION_EVENT,
  referralTransactionalEmailCatalog,
} from "./referral-templates.ts";
import {
  ReferralNetworkError,
  type ReferralCommandScope,
  type ReferralNetworkDependencies,
} from "./referral-network.ts";

const REFERRAL_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export interface CreateAndSendReferralInput {
  readonly referralId?: string;
  readonly recipient: ReferralRecipient;
  readonly need: ReferralNeed;
  readonly summary: string;
  readonly urgency: ReferralUrgency;
  readonly preferredContactMethod: ReferralContactMethod;
  readonly purpose: ReferralPurpose;
  readonly opportunityReference?: string | null;
  readonly providerContext?: ProviderReferralContext | null;
  readonly sharedFields: readonly ReferralSharedField[];
  readonly consentAcknowledged: boolean;
}

type AtomicReferralAcquisitionIssuer = ReferralNetworkDependencies["acquisition"] & Readonly<{
  prepare(input: Readonly<{
    referralId: string;
    commandId: string;
    issuedAt: string;
  }>): Readonly<{
    context: AcquisitionContextEnvelope;
    event: AcquisitionContextEvent;
    serializedToken: string;
  }>;
}>;

export type ReferralCreateAndSendDependencies = Omit<ReferralNetworkDependencies, "acquisition"> & Readonly<{
  acquisition: AtomicReferralAcquisitionIssuer;
}>;

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/** Mutable organization/provider display labels and notification projections are deliberately absent.
 * They are validated before the first write, but a later rename must not invalidate replay of an
 * already-committed command. External recipient name/email remain participant-authored business input.
 */
function fingerprintProjection(input: CreateAndSendReferralInput) {
  const recipient = input.recipient.kind === "organization"
    ? Object.freeze({
        kind: "organization" as const,
        organizationId: String(input.recipient.organizationId),
      })
    : Object.freeze({
        kind: "external" as const,
        displayName: input.recipient.displayName.trim(),
        email: input.recipient.email.trim().toLowerCase(),
      });
  return Object.freeze({
    referralId: input.referralId ?? null,
    recipient,
    need: input.need,
    summary: input.summary,
    urgency: input.urgency,
    preferredContactMethod: input.preferredContactMethod,
    purpose: input.purpose,
    opportunityReference: input.opportunityReference ?? null,
    providerContext: input.providerContext ?? null,
    sharedFields: Object.freeze([...input.sharedFields]),
    consentAcknowledged: input.consentAcknowledged,
  });
}

function expiry(now: string): string {
  return new Date(Date.parse(now) + REFERRAL_LIFETIME_MS).toISOString();
}

function command(input: Readonly<{
  id: string;
  referralId: string;
  organizationId: ReferralCommandReceipt["actorOrganizationId"];
  requestFingerprint: string;
  now: string;
}>): ReferralCommandReceipt {
  return Object.freeze({
    id: input.id,
    referralId: input.referralId,
    actorOrganizationId: input.organizationId,
    action: "sent" as const,
    requestFingerprint: input.requestFingerprint,
    resultingVersion: 2,
    recordedAt: input.now,
  });
}

function event(input: Readonly<{
  id: string;
  referral: BusinessReferral;
  kind: "created" | "sent";
  from: "draft" | null;
  actorUserId: BusinessReferral["createdByUserId"];
  actorMembershipId: BusinessReferral["createdByMembershipId"];
  commandId: string;
  now: string;
}>): ReferralEvent {
  return Object.freeze({
    id: input.id,
    referralId: input.referral.id,
    senderOrganizationId: input.referral.senderOrganizationId,
    recipientOrganizationId: input.referral.attachedRecipientOrganizationId,
    kind: input.kind,
    fromStatus: input.from,
    toStatus: input.referral.status,
    aggregateVersion: input.referral.version,
    actorUserId: input.actorUserId,
    actorMembershipId: input.actorMembershipId,
    commandId: input.commandId,
    occurredAt: input.now,
  });
}

export class ReferralCreateAndSendService {
  private readonly dependencies: ReferralCreateAndSendDependencies;
  private readonly now: () => string;
  private readonly id: () => string;

  constructor(dependencies: ReferralCreateAndSendDependencies) {
    this.dependencies = dependencies;
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.id = dependencies.id ?? randomUUID;
  }

  private async authorize(scope: ReferralCommandScope) {
    const decision = await authorizeOrganizationOperation({
      context: scope.context,
      organizationId: organizationId(scope.organizationId),
      membershipId: organizationMembershipId(scope.membershipId),
      permission: "referral.manage",
    }, this.dependencies.authorization);
    if (!decision.allowed) {
      throw new ReferralNetworkError("forbidden", `Referral access denied: ${decision.reason}.`);
    }
    return decision;
  }

  private async replay(
    scope: ReferralCommandScope,
    requestFingerprint: string,
  ) {
    const prior = await this.dependencies.repository.getCommand(scope.commandId);
    if (!prior) return null;
    if (
      prior.actorOrganizationId !== scope.organizationId ||
      prior.action !== "sent" ||
      prior.requestFingerprint !== requestFingerprint ||
      prior.resultingVersion !== 2
    ) {
      throw new ReferralNetworkError(
        "conflict",
        "This command identity was already used for another referral action.",
      );
    }
    const referral = await this.dependencies.repository.getById(prior.referralId);
    if (
      !referral ||
      referral.senderOrganizationId !== scope.organizationId ||
      referral.version < prior.resultingVersion ||
      referral.status === "draft"
    ) {
      throw new ReferralNetworkError(
        "not-found",
        "The prior create-and-send referral result is unavailable.",
      );
    }
    const communication = referral.communicationMessageId
      ? await this.dependencies.repository.getCommunication(referral.communicationMessageId)
      : null;
    return Object.freeze({
      replayed: true as const,
      receipt: prior,
      referral,
      communication,
    });
  }

  async createAndSend(
    scope: ReferralCommandScope,
    input: CreateAndSendReferralInput,
  ) {
    const requestFingerprint = fingerprint(fingerprintProjection(input));
    const authorization = await this.authorize(scope);
    const prior = await this.replay(scope, requestFingerprint);
    if (prior) return prior;

    const now = this.now();
    const senderProfile = await this.dependencies.profiles.getByOrganizationId(
      authorization.organization.id,
    );
    if (!senderProfile) {
      throw new ReferralNetworkError("not-found", "The sending organization profile is unavailable.");
    }

    const reviewedRecipientLabel = input.recipient.displayName.trim();
    let recipient = input.recipient;
    if (recipient.kind === "organization") {
      const [recipientAccount, recipientProfile] = await Promise.all([
        this.dependencies.authorization.organizations.getById(recipient.organizationId),
        this.dependencies.profiles.getByOrganizationId(recipient.organizationId),
      ]);
      if (!recipientAccount || !recipientProfile) {
        throw new ReferralNetworkError("not-found", "The recipient organization is unavailable.");
      }
      if (recipientProfile.displayName.trim() !== reviewedRecipientLabel) {
        throw new ReferralNetworkError(
          "conflict",
          "The recipient name changed after review. Refresh and review the recipient again before sending.",
        );
      }
      const essentialRecipient = hydrateEssentialOrganizationProfile(recipientProfile);
      recipient = Object.freeze({
        ...recipient,
        displayName: recipientProfile.displayName,
        notificationEmail: essentialRecipient.mainContact?.publiclyVisible
          ? essentialRecipient.mainContact.email
          : null,
      });
    }

    if (input.purpose === "provider-connection") {
      if (
        recipient.kind !== "organization" ||
        !input.providerContext ||
        input.providerContext.providerOrganizationId !== recipient.organizationId
      ) {
        throw new ReferralNetworkError(
          "invalid",
          "Provider request must target the exact selected provider organization.",
        );
      }
      if (!this.dependencies.providerEligibility) {
        throw new ReferralNetworkError("forbidden", "Provider routing authority is unavailable.");
      }
      const eligibility = await this.dependencies.providerEligibility.inspect({
        organizationId: recipient.organizationId,
        serviceId: input.providerContext.serviceId,
        publicationVersion: input.providerContext.publicationVersion,
      });
      if (!eligibility.eligible) {
        throw new ReferralNetworkError(
          "not-found",
          "The selected provider service is no longer available for requests.",
        );
      }
      if (eligibility.displayName?.trim() && eligibility.displayName.trim() !== reviewedRecipientLabel) {
        throw new ReferralNetworkError(
          "conflict",
          "The provider name changed after review. Refresh and review the provider again before sending.",
        );
      }
    }

    let draft: BusinessReferral;
    try {
      draft = createReferral({
        ...input,
        recipient,
        id: input.referralId ?? `ref_${fingerprint(scope.commandId).slice(0, 40)}`,
        senderOrganizationId: authorization.organization.id,
        senderOrganizationName: senderProfile.displayName,
        correlationId: `referral:${scope.commandId}`,
        actorUserId: authorization.context.user.id,
        actorMembershipId: authorization.membership.id,
        now,
        expiresAt: expiry(now),
      });
    } catch (error) {
      throw new ReferralNetworkError(
        "invalid",
        error instanceof Error ? error.message : "Referral is invalid.",
      );
    }

    try {
      transitionReferral({
        referral: draft,
        expectedVersion: 1,
        to: "sent",
        actorUserId: authorization.context.user.id,
        now,
      });
    } catch (error) {
      throw new ReferralNetworkError(
        "conflict",
        error instanceof Error ? error.message : "Referral could not be sent.",
      );
    }

    let acquisition: ReferralCreateAndSendBundle["acquisition"] = null;
    let acquisitionContextId: string | null = null;
    let serializedToken: string | null = null;
    if (draft.recipient.kind === "external") {
      const prepared = this.dependencies.acquisition.prepare({
        referralId: draft.id,
        commandId: scope.commandId,
        issuedAt: now,
      });
      acquisition = Object.freeze({
        context: prepared.context,
        event: prepared.event,
      });
      acquisitionContextId = prepared.context.id;
      serializedToken = prepared.serializedToken;
    }

    const recipientEmail = draft.recipient.kind === "external"
      ? draft.recipient.email
      : draft.recipient.notificationEmail;
    const messageId = recipientEmail
      ? `referral-${fingerprint(draft.id).slice(0, 40)}`
      : null;

    let sent: BusinessReferral;
    try {
      sent = transitionReferral({
        referral: draft,
        expectedVersion: 1,
        to: "sent",
        actorUserId: authorization.context.user.id,
        now,
        acquisitionContextId,
        communicationMessageId: messageId,
      });
    } catch (error) {
      throw new ReferralNetworkError(
        "conflict",
        error instanceof Error ? error.message : "Referral could not be sent.",
      );
    }

    let communication: ReferralCommunicationIntent | null = null;
    if (recipientEmail && messageId) {
      const reference = referralTransactionalEmailCatalog.referenceForEvent(
        draft.purpose === "provider-connection"
          ? PROVIDER_REQUEST_EVENT
          : REFERRAL_INVITATION_EVENT,
        1,
      );
      const continueUrl = serializedToken
        ? `${this.dependencies.publicOrigin}/api/acquisition/referral?token=${encodeURIComponent(serializedToken)}`
        : `${this.dependencies.publicOrigin}/referrals?referral=${encodeURIComponent(sent.id)}`;
      const request = createTransactionalEmailRequest({
        id: messageId,
        purpose: reference.purpose,
        recipientEmail,
        recipientDisplayName: draft.recipient.displayName,
        eventKey: reference.eventKey,
        eventVersion: reference.eventVersion,
        templateKey: reference.templateKey,
        templateVersion: reference.templateVersion,
        variables: {
          recipient_name: draft.recipient.displayName,
          sender_organization: draft.senderOrganizationName,
          referral_summary: draft.summary,
          continue_url: continueUrl,
        },
        correlationId: draft.correlationId,
        idempotencyKey: `referral-invitation:${draft.id}`,
        requestedAt: now,
        organizationId: String(draft.senderOrganizationId),
        userId: String(authorization.context.user.id),
        relatedObjectType: "business-referral",
        relatedObjectId: draft.id,
        tags: ["referral", draft.recipient.kind],
      });
      communication = Object.freeze({
        id: messageId,
        referralId: draft.id,
        request,
        status: "queued" as const,
        attemptCount: 0,
        lastErrorCode: null,
        deliveryClaim: null,
        updatedAt: now,
      });
    }

    const education: ReferralEducationAcknowledgement = Object.freeze({
      id: `refedu_${fingerprint(scope.commandId).slice(0, 40)}`,
      version: 1 as const,
      organizationId: authorization.organization.id,
      actorUserId: authorization.context.user.id,
      actorMembershipId: authorization.membership.id,
      recipientLabel: draft.recipient.displayName,
      sharedFields: Object.freeze([...draft.sharedFields]),
      acknowledgedAt: now,
    });
    const receipt = command({
      id: scope.commandId,
      referralId: sent.id,
      organizationId: authorization.organization.id,
      requestFingerprint,
      now,
    });
    const events = Object.freeze([
      event({
        id: `refevent_${this.id()}`,
        referral: draft,
        kind: "created",
        from: null,
        actorUserId: authorization.context.user.id,
        actorMembershipId: authorization.membership.id,
        commandId: scope.commandId,
        now,
      }),
      event({
        id: `refevent_${this.id()}`,
        referral: sent,
        kind: "sent",
        from: "draft",
        actorUserId: authorization.context.user.id,
        actorMembershipId: authorization.membership.id,
        commandId: scope.commandId,
        now,
      }),
    ] as const);
    const audits = Object.freeze([
      createOrganizationActionAuditEvent(
        authorization.context.user,
        authorization.membership,
        authorization.organization,
        {
          id: `audit_${this.id()}`,
          action: "referral.education.acknowledged",
          occurredAt: now,
        },
      ),
      createOrganizationActionAuditEvent(
        authorization.context.user,
        authorization.membership,
        authorization.organization,
        {
          id: `audit_${this.id()}`,
          action: "referral.created",
          occurredAt: now,
        },
      ),
      createOrganizationActionAuditEvent(
        authorization.context.user,
        authorization.membership,
        authorization.organization,
        {
          id: `audit_${this.id()}`,
          action: "referral.sent",
          occurredAt: now,
        },
      ),
    ]);

    let persistence: "created" | "replayed";
    try {
      persistence = await this.dependencies.repository.saveCreateAndSend({
        referral: sent,
        events,
        command: receipt,
        education,
        audits,
        communication,
        acquisition,
      });
    } catch (error) {
      throw new ReferralNetworkError(
        "conflict",
        error instanceof Error ? error.message : "Referral could not be created and sent.",
      );
    }
    if (persistence === "replayed") {
      const replayed = await this.replay(scope, requestFingerprint);
      if (!replayed) {
        throw new ReferralNetworkError("not-found", "The replayed referral result is unavailable.");
      }
      return replayed;
    }

    return Object.freeze({
      replayed: false as const,
      receipt,
      referral: sent,
      communication,
    });
  }
}
