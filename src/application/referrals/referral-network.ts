import { createHash, randomUUID } from "node:crypto";

import { authorizeOrganizationOperation, type OrganizationOperationAuthorizationDependencies } from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import { createTransactionalEmailRequest } from "../../domain/communications/transactional-email.ts";
import { organizationId, type OrganizationId } from "../../domain/organizations/model.ts";
import type { OrganizationProfileRepository } from "../../domain/organizations/repository.ts";
import { hydrateEssentialOrganizationProfile } from "../../domain/organization-profile/model.ts";
import {
  attachReferralRecipient, createReferral, projectReferral, transitionReferral,
  type BusinessReferral, type ReferralCommandReceipt, type ReferralCommunicationIntent,
  type ReferralEducationAcknowledgement, type ReferralEvent, type ReferralEventKind,
  type ReferralNeed, type ReferralUrgency, type ReferralContactMethod, type ReferralPurpose,
  type ReferralOutcome, type ReferralRecipient, type ReferralSharedField, type ProviderReferralContext,
} from "../../domain/referrals/model.ts";
import type { ReferralRepository } from "../../domain/referrals/repository.ts";
import { organizationMembershipId } from "../../domain/users/model.ts";
import { PROVIDER_REQUEST_EVENT, REFERRAL_INVITATION_EVENT, referralTransactionalEmailCatalog } from "./referral-templates.ts";

const REFERRAL_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export class ReferralNetworkError extends Error {
  readonly code: "forbidden" | "invalid" | "not-found" | "conflict" | "education-required";
  constructor(code: ReferralNetworkError["code"], message: string) {
    super(message); this.name = "ReferralNetworkError"; this.code = code;
  }
}

export interface ReferralAcquisitionIssuer {
  issue(input: Readonly<{ referralId: string }>): Promise<Readonly<{ contextId: string; serializedToken: string }>>;
}

export interface ReferralNetworkDependencies {
  readonly authorization: OrganizationOperationAuthorizationDependencies;
  readonly repository: ReferralRepository;
  readonly profiles: OrganizationProfileRepository;
  readonly acquisition: ReferralAcquisitionIssuer;
  readonly providerEligibility?: Readonly<{
    inspect(input: Readonly<{ organizationId: OrganizationId; serviceId?: string | null; publicationVersion?: number | null }>): Promise<Readonly<{ eligible: boolean; displayName: string | null }>>;
  }>;
  readonly publicOrigin: string;
  readonly now?: () => string;
  readonly id?: () => string;
}

export interface ReferralCommandScope {
  readonly context: AuthenticatedServerContext | null;
  readonly organizationId: string;
  readonly membershipId: string;
  readonly commandId: string;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function expiry(now: string): string {
  return new Date(Date.parse(now) + REFERRAL_LIFETIME_MS).toISOString();
}

function command(input: Readonly<{ id: string; referralId: string; organizationId: OrganizationId; action: ReferralCommandReceipt["action"]; requestFingerprint: string; version: number; now: string }>): ReferralCommandReceipt {
  return Object.freeze({ id: input.id, referralId: input.referralId, actorOrganizationId: input.organizationId, action: input.action, requestFingerprint: input.requestFingerprint, resultingVersion: input.version, recordedAt: input.now });
}

function event(input: Readonly<{ id: string; referral: BusinessReferral; kind: ReferralEventKind; from: BusinessReferral["status"] | null; actorUserId: Parameters<typeof createReferral>[0]["actorUserId"]; actorMembershipId: Parameters<typeof createReferral>[0]["actorMembershipId"]; commandId: string; now: string }>): ReferralEvent {
  return Object.freeze({ id: input.id, referralId: input.referral.id, senderOrganizationId: input.referral.senderOrganizationId, recipientOrganizationId: input.referral.attachedRecipientOrganizationId, kind: input.kind, fromStatus: input.from, toStatus: input.referral.status, aggregateVersion: input.referral.version, actorUserId: input.actorUserId, actorMembershipId: input.actorMembershipId, commandId: input.commandId, occurredAt: input.now });
}

export class ReferralNetworkService {
  private readonly dependencies: ReferralNetworkDependencies;
  private readonly now: () => string;
  private readonly id: () => string;
  constructor(dependencies: ReferralNetworkDependencies) {
    this.dependencies = dependencies;
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.id = dependencies.id ?? randomUUID;
  }

  private async authorize(scope: ReferralCommandScope) {
    const decision = await authorizeOrganizationOperation({ context: scope.context, organizationId: organizationId(scope.organizationId), membershipId: organizationMembershipId(scope.membershipId), permission: "referral.manage" }, this.dependencies.authorization);
    if (!decision.allowed) throw new ReferralNetworkError("forbidden", `Referral access denied: ${decision.reason}.`);
    return decision;
  }

  private async replay(scope: ReferralCommandScope, action: ReferralCommandReceipt["action"], requestFingerprint: string) {
    const prior = await this.dependencies.repository.getCommand(scope.commandId);
    if (!prior) return null;
    if (prior.actorOrganizationId !== scope.organizationId || prior.action !== action || prior.requestFingerprint !== requestFingerprint) throw new ReferralNetworkError("conflict", "This command identity was already used for another referral action.");
    const referral = await this.dependencies.repository.getById(prior.referralId);
    if (!referral) throw new ReferralNetworkError("not-found", "The prior referral result is unavailable.");
    return Object.freeze({ replayed: true as const, receipt: prior, referral });
  }

  async snapshot(scope: Omit<ReferralCommandScope, "commandId">) {
    const authorization = await this.authorize({ ...scope, commandId: "snapshot" });
    const referrals = await this.dependencies.repository.listInvolvingOrganization(authorization.organization.id);
    const projected = await Promise.all(referrals.map(async (record) => {
      const projection = projectReferral(record, authorization.organization.id);
      if (!projection) return null;
      const communication = record.communicationMessageId
        ? await this.dependencies.repository.getCommunication(record.communicationMessageId)
        : null;
      return Object.freeze({ ...projection, notificationStatus: communication?.status ?? projection.notificationStatus });
    }));
    return Object.freeze(projected.flatMap((projection) => projection ? [projection] : []));
  }

  async acknowledgeEducation(scope: ReferralCommandScope, input: Readonly<{ recipientLabel: string; sharedFields: readonly ReferralSharedField[] }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const prior = await this.dependencies.repository.getCommand(scope.commandId);
    if (prior) {
      if (prior.actorOrganizationId !== authorization.organization.id || prior.action !== "education-acknowledged" || prior.requestFingerprint !== requestFingerprint) throw new ReferralNetworkError("conflict", "This command identity was already used for another referral action.");
      const acknowledgement = await this.dependencies.repository.getEducation(authorization.organization.id, authorization.context.user.id);
      if (!acknowledgement) throw new ReferralNetworkError("not-found", "The prior education acknowledgement is unavailable.");
      return Object.freeze({ replayed: true as const, receipt: prior, acknowledgement });
    }
    const now = this.now();
    const acknowledgement: ReferralEducationAcknowledgement = Object.freeze({ id: `refedu_${scope.commandId}`, version: 1 as const, organizationId: authorization.organization.id, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, recipientLabel: input.recipientLabel.trim(), sharedFields: Object.freeze([...new Set(input.sharedFields)]), acknowledgedAt: now });
    if (!acknowledgement.recipientLabel || acknowledgement.sharedFields.length === 0) throw new ReferralNetworkError("invalid", "Education acknowledgement requires the named recipient and shared-data preview.");
    const receipt = command({ id: scope.commandId, referralId: acknowledgement.id, organizationId: authorization.organization.id, action: "education-acknowledged", requestFingerprint, version: acknowledgement.version, now });
    await this.dependencies.repository.acknowledgeEducation({ acknowledgement, command: receipt, audit: createOrganizationActionAuditEvent(authorization.context.user, authorization.membership, authorization.organization, { id: `audit_${this.id()}`, action: "referral.education.acknowledged", occurredAt: now }) });
    return Object.freeze({ replayed: false as const, receipt, acknowledgement });
  }

  async createDraft(scope: ReferralCommandScope, input: Readonly<{ referralId?: string; recipient: ReferralRecipient; need: ReferralNeed; summary: string; urgency: ReferralUrgency; preferredContactMethod: ReferralContactMethod; purpose: ReferralPurpose; opportunityReference?: string | null; providerContext?: ProviderReferralContext | null; sharedFields: readonly ReferralSharedField[]; consentAcknowledged: boolean }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const prior = await this.replay(scope, "created", requestFingerprint);
    if (prior) return prior;
    const now = this.now();
    const senderProfile = await this.dependencies.profiles.getByOrganizationId(authorization.organization.id);
    if (!senderProfile) throw new ReferralNetworkError("not-found", "The sending organization profile is unavailable.");
    let recipient = input.recipient;
    if (recipient.kind === "organization") {
      const [recipientAccount, recipientProfile] = await Promise.all([
        this.dependencies.authorization.organizations.getById(recipient.organizationId),
        this.dependencies.profiles.getByOrganizationId(recipient.organizationId),
      ]);
      if (!recipientAccount || !recipientProfile) throw new ReferralNetworkError("not-found", "The recipient organization is unavailable.");
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
      if (recipient.kind !== "organization" || !input.providerContext || input.providerContext.providerOrganizationId !== recipient.organizationId) throw new ReferralNetworkError("invalid", "Provider request must target the exact selected provider organization.");
      if (!this.dependencies.providerEligibility) throw new ReferralNetworkError("forbidden", "Provider routing authority is unavailable.");
      const eligibility = await this.dependencies.providerEligibility.inspect({ organizationId: recipient.organizationId, serviceId: input.providerContext.serviceId, publicationVersion: input.providerContext.publicationVersion });
      if (!eligibility.eligible) throw new ReferralNetworkError("not-found", "The selected provider service is no longer available for requests.");
    }
    let referral: BusinessReferral;
    try {
      referral = createReferral({ ...input, recipient, id: input.referralId ?? `ref_${fingerprint(scope.commandId).slice(0, 40)}`, senderOrganizationId: authorization.organization.id, senderOrganizationName: senderProfile.displayName, correlationId: `referral:${scope.commandId}`, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, now, expiresAt: expiry(now) });
    } catch (error) {
      throw new ReferralNetworkError("invalid", error instanceof Error ? error.message : "Referral draft is invalid.");
    }
    const receipt = command({ id: scope.commandId, referralId: referral.id, organizationId: authorization.organization.id, action: "created", requestFingerprint, version: referral.version, now });
    await this.dependencies.repository.save({ referral, event: event({ id: `refevent_${this.id()}`, referral, kind: "created", from: null, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, commandId: scope.commandId, now }), command: receipt, audits: [createOrganizationActionAuditEvent(authorization.context.user, authorization.membership, authorization.organization, { id: `audit_${this.id()}`, action: "referral.created", occurredAt: now })], communication: null });
    return Object.freeze({ replayed: false as const, receipt, referral });
  }

  async send(scope: ReferralCommandScope, input: Readonly<{ referralId: string; expectedVersion: number }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const prior = await this.replay(scope, "sent", requestFingerprint);
    if (prior) return prior;
    const current = await this.dependencies.repository.getById(input.referralId);
    if (!current || current.senderOrganizationId !== authorization.organization.id) throw new ReferralNetworkError("not-found", "Referral draft is unavailable to this organization.");
    if (current.purpose === "provider-connection") {
      const context = current.providerContext;
      if (!context || !this.dependencies.providerEligibility) throw new ReferralNetworkError("forbidden", "Provider routing authority is unavailable.");
      const eligibility = await this.dependencies.providerEligibility.inspect({ organizationId: context.providerOrganizationId, serviceId: context.serviceId, publicationVersion: context.publicationVersion });
      if (!eligibility.eligible) throw new ReferralNetworkError("conflict", "This provider service changed or is no longer accepting new requests; choose another provider.");
    }
    const education = await this.dependencies.repository.getEducation(authorization.organization.id, authorization.context.user.id);
    if (!education || education.version !== 1 || education.recipientLabel !== current.recipient.displayName || JSON.stringify(education.sharedFields) !== JSON.stringify(current.sharedFields)) throw new ReferralNetworkError("education-required", "Review and acknowledge the referral education for this recipient and exact data before sending.");
    const now = this.now();
    try {
      transitionReferral({ referral: current, expectedVersion: input.expectedVersion, to: "sent", actorUserId: authorization.context.user.id, now });
    } catch (error) {
      throw new ReferralNetworkError("conflict", error instanceof Error ? error.message : "Referral could not be sent.");
    }
    let acquisitionContextId: string | null = null;
    let serializedToken: string | null = null;
    if (current.recipient.kind === "external") {
      const issued = await this.dependencies.acquisition.issue({ referralId: current.id });
      acquisitionContextId = issued.contextId;
      serializedToken = issued.serializedToken;
    }
    const recipientEmail = current.recipient.kind === "external" ? current.recipient.email : current.recipient.notificationEmail;
    const messageId = recipientEmail ? `referral-${fingerprint(current.id).slice(0, 40)}` : null;
    let updated: BusinessReferral;
    try { updated = transitionReferral({ referral: current, expectedVersion: input.expectedVersion, to: "sent", actorUserId: authorization.context.user.id, now, acquisitionContextId, communicationMessageId: messageId }); }
    catch (error) { throw new ReferralNetworkError("conflict", error instanceof Error ? error.message : "Referral could not be sent."); }
    let communication: ReferralCommunicationIntent | null = null;
    if (recipientEmail && messageId) {
      const reference = referralTransactionalEmailCatalog.referenceForEvent(current.purpose === "provider-connection" ? PROVIDER_REQUEST_EVENT : REFERRAL_INVITATION_EVENT, 1);
      const continueUrl = serializedToken
        ? `${this.dependencies.publicOrigin}/api/acquisition/referral?token=${encodeURIComponent(serializedToken)}`
        : `${this.dependencies.publicOrigin}/referrals?referral=${encodeURIComponent(updated.id)}`;
      const request = createTransactionalEmailRequest({ id: messageId, purpose: reference.purpose, recipientEmail, recipientDisplayName: current.recipient.displayName, eventKey: reference.eventKey, eventVersion: reference.eventVersion, templateKey: reference.templateKey, templateVersion: reference.templateVersion, variables: { recipient_name: current.recipient.displayName, sender_organization: current.senderOrganizationName, referral_summary: current.summary, continue_url: continueUrl }, correlationId: current.correlationId, idempotencyKey: `referral-invitation:${current.id}`, requestedAt: now, organizationId: String(current.senderOrganizationId), userId: String(authorization.context.user.id), relatedObjectType: "business-referral", relatedObjectId: current.id, tags: ["referral", current.recipient.kind] });
      communication = Object.freeze({ id: messageId, referralId: current.id, request, status: "queued" as const, attemptCount: 0, lastErrorCode: null, deliveryClaim: null, updatedAt: now });
    }
    const receipt = command({ id: scope.commandId, referralId: updated.id, organizationId: authorization.organization.id, action: "sent", requestFingerprint, version: updated.version, now });
    await this.dependencies.repository.save({ referral: updated, event: event({ id: `refevent_${this.id()}`, referral: updated, kind: "sent", from: current.status, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, commandId: scope.commandId, now }), command: receipt, audits: [createOrganizationActionAuditEvent(authorization.context.user, authorization.membership, authorization.organization, { id: `audit_${this.id()}`, action: "referral.sent", occurredAt: now })], communication });
    return Object.freeze({ replayed: false as const, receipt, referral: updated, communication });
  }

  async transition(scope: ReferralCommandScope, input: Readonly<{ referralId: string; expectedVersion: number; action: "accepted" | "declined" | "redirected" | "contacted" | "closed" | "expired"; outcome?: ReferralOutcome | null; suggestedProviderOrganizationId?: string | null; redirectReason?: string | null }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const prior = await this.replay(scope, input.action, requestFingerprint);
    if (prior) return prior;
    const current = await this.dependencies.repository.getById(input.referralId);
    if (!current) throw new ReferralNetworkError("not-found", "Referral is unavailable.");
    const isSender = current.senderOrganizationId === authorization.organization.id;
    const isRecipient = current.attachedRecipientOrganizationId === authorization.organization.id;
    if (!isSender && !isRecipient) throw new ReferralNetworkError("not-found", "Referral is unavailable.");
    if (["accepted", "declined", "redirected"].includes(input.action) && !isRecipient) throw new ReferralNetworkError("forbidden", "Only the recipient organization may respond to this referral.");
    if (input.action === "closed" && !isSender) throw new ReferralNetworkError("forbidden", "Only the sending organization may close this referral.");
    let providerRedirect: Parameters<typeof transitionReferral>[0]["providerRedirect"] = null;
    if (input.action === "redirected") {
      if (current.purpose !== "provider-connection" || !this.dependencies.providerEligibility) throw new ReferralNetworkError("invalid", "Only an eligible provider request can be redirected.");
      let suggestedId: OrganizationId;
      try { suggestedId = organizationId(input.suggestedProviderOrganizationId ?? ""); }
      catch { throw new ReferralNetworkError("invalid", "Choose an eligible provider for redirect."); }
      if (suggestedId === current.attachedRecipientOrganizationId || suggestedId === current.senderOrganizationId) throw new ReferralNetworkError("invalid", "Choose a different eligible provider for redirect.");
      const eligibility = await this.dependencies.providerEligibility.inspect({ organizationId: suggestedId });
      if (!eligibility.eligible || !eligibility.displayName) throw new ReferralNetworkError("not-found", "The suggested provider is unavailable.");
      providerRedirect = Object.freeze({ suggestedProviderOrganizationId: suggestedId, suggestedProviderDisplayName: eligibility.displayName, reason: input.redirectReason ?? "" });
    }
    const now = this.now();
    let updated: BusinessReferral;
    try { updated = transitionReferral({ referral: current, expectedVersion: input.expectedVersion, to: input.action, actorUserId: authorization.context.user.id, now, outcome: input.outcome, providerRedirect }); }
    catch (error) { throw new ReferralNetworkError("conflict", error instanceof Error ? error.message : "Referral transition failed."); }
    const receipt = command({ id: scope.commandId, referralId: updated.id, organizationId: authorization.organization.id, action: input.action, requestFingerprint, version: updated.version, now });
    await this.dependencies.repository.save({ referral: updated, event: event({ id: `refevent_${this.id()}`, referral: updated, kind: input.action, from: current.status, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, commandId: scope.commandId, now }), command: receipt, audits: [createOrganizationActionAuditEvent(authorization.context.user, authorization.membership, authorization.organization, { id: `audit_${this.id()}`, action: `referral.${input.action}`, occurredAt: now })], communication: null });
    return Object.freeze({ replayed: false as const, receipt, referral: updated });
  }

  async attachExternalRecipient(scope: ReferralCommandScope, input: Readonly<{ referralId: string; acquisitionContextId: string; expectedVersion: number }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const prior = await this.replay(scope, "recipient-attached", requestFingerprint);
    if (prior) return prior;
    const current = await this.dependencies.repository.getById(input.referralId);
    if (!current || current.acquisitionContextId !== input.acquisitionContextId) throw new ReferralNetworkError("not-found", "Referral invitation context does not match this referral.");
    if (current.recipient.kind !== "external" || current.recipient.email !== authorization.context.user.primaryEmail.trim().toLowerCase()) {
      throw new ReferralNetworkError("forbidden", "The signed-in email does not match the intended referral recipient.");
    }
    const now = this.now();
    let updated: BusinessReferral;
    try { updated = attachReferralRecipient({ referral: current, organizationId: authorization.organization.id, actorUserId: authorization.context.user.id, expectedVersion: input.expectedVersion, now }); }
    catch (error) { throw new ReferralNetworkError("conflict", error instanceof Error ? error.message : "Referral recipient could not be attached."); }
    const receipt = command({ id: scope.commandId, referralId: updated.id, organizationId: authorization.organization.id, action: "recipient-attached", requestFingerprint, version: updated.version, now });
    await this.dependencies.repository.attachInvitation({ referral: updated, event: event({ id: `refevent_${this.id()}`, referral: updated, kind: "recipient-attached", from: current.status, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, commandId: scope.commandId, now }), command: receipt, audit: createOrganizationActionAuditEvent(authorization.context.user, authorization.membership, authorization.organization, { id: `audit_${this.id()}`, action: "referral.recipient-attached", occurredAt: now }) });
    return Object.freeze({ replayed: false as const, receipt, referral: updated });
  }
}
