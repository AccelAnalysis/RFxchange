import type { TransactionalEmailRequest } from "../communications/transactional-email.ts";
import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";

export const REFERRAL_AGGREGATE_VERSION = 1 as const;
export const REFERRAL_EDUCATION_VERSION = 1 as const;

export const REFERRAL_STATUSES = [
  "draft", "sent", "accepted", "declined", "contacted", "closed", "expired",
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];
export type ReferralNeed = "capability" | "capacity" | "introduction" | "local-knowledge" | "other";
export type ReferralUrgency = "standard" | "soon" | "urgent";
export type ReferralContactMethod = "email" | "phone" | "platform";
export type ReferralPurpose = "business-introduction" | "opportunity-context" | "capability-connection";
export type ReferralOutcome = "connected" | "not-a-fit" | "no-response" | "other";
export type ReferralSharedField =
  | "sender-organization"
  | "sender-contact"
  | "sender-email"
  | "summary"
  | "opportunity-reference";

export type ReferralRecipient =
  | Readonly<{ kind: "organization"; organizationId: OrganizationId; displayName: string; notificationEmail: string | null }>
  | Readonly<{ kind: "external"; displayName: string; email: string }>;

export interface ReferralConsentEvidence {
  readonly version: 1;
  readonly acknowledged: boolean;
  readonly recipientLabel: string;
  readonly sharedFields: readonly ReferralSharedField[];
  readonly actorUserId: UserId;
  readonly acknowledgedAt: string;
}

export interface BusinessReferral {
  readonly id: string;
  readonly schemaVersion: typeof REFERRAL_AGGREGATE_VERSION;
  readonly version: number;
  readonly senderOrganizationId: OrganizationId;
  readonly senderOrganizationName: string;
  readonly recipient: ReferralRecipient;
  readonly attachedRecipientOrganizationId: OrganizationId | null;
  readonly need: ReferralNeed;
  readonly summary: string;
  readonly urgency: ReferralUrgency;
  readonly preferredContactMethod: ReferralContactMethod;
  readonly purpose: ReferralPurpose;
  readonly opportunityReference: string | null;
  readonly sharedFields: readonly ReferralSharedField[];
  readonly consent: ReferralConsentEvidence;
  readonly status: ReferralStatus;
  readonly outcome: ReferralOutcome | null;
  readonly correlationId: string;
  readonly acquisitionContextId: string | null;
  readonly communicationMessageId: string | null;
  readonly createdByUserId: UserId;
  readonly createdByMembershipId: OrganizationMembershipId;
  readonly recipientActorUserId: UserId | null;
  readonly createdAt: string;
  readonly sentAt: string | null;
  readonly expiresAt: string;
  readonly updatedAt: string;
}

export type ReferralEventKind =
  | "created" | "sent" | "accepted" | "declined" | "contacted" | "closed" | "expired" | "recipient-attached";

export interface ReferralEvent {
  readonly id: string;
  readonly referralId: string;
  readonly senderOrganizationId: OrganizationId;
  readonly recipientOrganizationId: OrganizationId | null;
  readonly kind: ReferralEventKind;
  readonly fromStatus: ReferralStatus | null;
  readonly toStatus: ReferralStatus;
  readonly aggregateVersion: number;
  readonly actorUserId: UserId;
  readonly actorMembershipId: OrganizationMembershipId;
  readonly commandId: string;
  readonly occurredAt: string;
}

export interface ReferralCommandReceipt {
  readonly id: string;
  readonly referralId: string;
  readonly actorOrganizationId: OrganizationId;
  readonly action: ReferralEventKind | "education-acknowledged";
  readonly requestFingerprint: string;
  readonly resultingVersion: number;
  readonly recordedAt: string;
}

export interface ReferralEducationAcknowledgement {
  readonly id: string;
  readonly version: typeof REFERRAL_EDUCATION_VERSION;
  readonly organizationId: OrganizationId;
  readonly actorUserId: UserId;
  readonly actorMembershipId: OrganizationMembershipId;
  readonly recipientLabel: string;
  readonly sharedFields: readonly ReferralSharedField[];
  readonly acknowledgedAt: string;
}

export interface ReferralCommunicationIntent {
  readonly id: string;
  readonly referralId: string;
  readonly request: TransactionalEmailRequest;
  readonly status: "queued" | "accepted" | "retryable-failure" | "terminal-failure";
  readonly attemptCount: number;
  readonly lastErrorCode: string | null;
  readonly updatedAt: string;
}

export interface ReferralPersistenceBundle {
  readonly referral: BusinessReferral;
  readonly event: ReferralEvent;
  readonly command: ReferralCommandReceipt;
  readonly audits: readonly OrganizationActionAuditEvent[];
  readonly communication: ReferralCommunicationIntent | null;
}

export interface SenderReferralProjection {
  readonly role: "sender";
  readonly id: string;
  readonly version: number;
  readonly recipientLabel: string;
  readonly recipientKind: ReferralRecipient["kind"];
  readonly recipientOrganizationId: OrganizationId | null;
  readonly need: ReferralNeed;
  readonly summary: string;
  readonly urgency: ReferralUrgency;
  readonly preferredContactMethod: ReferralContactMethod;
  readonly purpose: ReferralPurpose;
  readonly opportunityReference: string | null;
  readonly sharedFields: readonly ReferralSharedField[];
  readonly status: ReferralStatus;
  readonly outcome: ReferralOutcome | null;
  readonly correlationId: string;
  readonly notificationStatus: "unavailable" | "queued" | "accepted" | "retryable-failure" | "terminal-failure";
  readonly createdAt: string;
  readonly sentAt: string | null;
  readonly expiresAt: string;
  readonly updatedAt: string;
}

export interface RecipientReferralProjection extends Omit<SenderReferralProjection, "role" | "recipientKind" | "recipientOrganizationId"> {
  readonly role: "recipient";
  readonly senderOrganizationName: string;
}

function required(value: string, label: string, maximum: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximum) throw new Error(`${label} cannot exceed ${maximum} characters.`);
  return normalized;
}

function stable(value: string, label: string): string {
  const normalized = required(value, label, 191);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) throw new Error(`${label} is malformed.`);
  return normalized;
}

function iso(value: string, label: string): string {
  const parsed = Date.parse(required(value, label, 64));
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid timestamp.`);
  return new Date(parsed).toISOString();
}

function normalizedEmail(value: string): string {
  const email = required(value, "Recipient email", 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Recipient email is invalid.");
  return email;
}

function controlled<T extends string>(value: T, allowed: readonly T[], label: string): T {
  if (!allowed.includes(value)) throw new Error(`${label} is invalid.`);
  return value;
}

const SHARE_FIELDS: readonly ReferralSharedField[] = ["sender-organization", "sender-contact", "sender-email", "summary", "opportunity-reference"];

export function createReferral(input: Readonly<{
  id: string; senderOrganizationId: OrganizationId; senderOrganizationName: string;
  recipient: ReferralRecipient; need: ReferralNeed; summary: string; urgency: ReferralUrgency;
  preferredContactMethod: ReferralContactMethod; purpose: ReferralPurpose; opportunityReference?: string | null;
  sharedFields: readonly ReferralSharedField[]; consentAcknowledged: boolean;
  correlationId: string; actorUserId: UserId; actorMembershipId: OrganizationMembershipId;
  now: string; expiresAt: string;
}>): BusinessReferral {
  const now = iso(input.now, "Referral creation time");
  const expiresAt = iso(input.expiresAt, "Referral expiry time");
  if (expiresAt <= now) throw new Error("Referral expiry must follow creation.");
  const recipient: ReferralRecipient = input.recipient.kind === "organization"
    ? Object.freeze({ kind: "organization", organizationId: input.recipient.organizationId, displayName: required(input.recipient.displayName, "Recipient name", 160), notificationEmail: input.recipient.notificationEmail ? normalizedEmail(input.recipient.notificationEmail) : null })
    : Object.freeze({ kind: "external", displayName: required(input.recipient.displayName, "Recipient name", 160), email: normalizedEmail(input.recipient.email) });
  if (recipient.kind === "organization" && recipient.organizationId === input.senderOrganizationId) throw new Error("A referral recipient must be another organization.");
  const sharedFields = Object.freeze([...new Set(input.sharedFields)]);
  if (!sharedFields.includes("sender-organization") || !sharedFields.includes("summary") || sharedFields.some((field) => !SHARE_FIELDS.includes(field))) {
    throw new Error("Referral sharing must include only the approved minimum fields.");
  }
  if (!input.consentAcknowledged) throw new Error("Confirm the exact referral data before continuing.");
  const opportunityReference = input.opportunityReference?.trim() ? stable(input.opportunityReference, "Opportunity reference") : null;
  if (sharedFields.includes("opportunity-reference") !== Boolean(opportunityReference)) throw new Error("Opportunity sharing must match the referenced context.");
  return Object.freeze({
    id: stable(input.id, "Referral id"), schemaVersion: REFERRAL_AGGREGATE_VERSION, version: 1,
    senderOrganizationId: input.senderOrganizationId, senderOrganizationName: required(input.senderOrganizationName, "Sender organization name", 160),
    recipient, attachedRecipientOrganizationId: recipient.kind === "organization" ? recipient.organizationId : null,
    need: controlled(input.need, ["capability", "capacity", "introduction", "local-knowledge", "other"], "Referral need"),
    summary: required(input.summary, "Referral summary", 1200),
    urgency: controlled(input.urgency, ["standard", "soon", "urgent"], "Referral urgency"),
    preferredContactMethod: controlled(input.preferredContactMethod, ["email", "phone", "platform"], "Preferred contact method"),
    purpose: controlled(input.purpose, ["business-introduction", "opportunity-context", "capability-connection"], "Referral purpose"),
    opportunityReference, sharedFields,
    consent: Object.freeze({ version: 1 as const, acknowledged: true, recipientLabel: recipient.displayName, sharedFields, actorUserId: input.actorUserId, acknowledgedAt: now }),
    status: "draft" as const, outcome: null, correlationId: stable(input.correlationId, "Referral correlation id"),
    acquisitionContextId: null, communicationMessageId: null, createdByUserId: input.actorUserId,
    createdByMembershipId: input.actorMembershipId, recipientActorUserId: null,
    createdAt: now, sentAt: null, expiresAt, updatedAt: now,
  });
}

const TRANSITIONS: Readonly<Record<ReferralStatus, readonly ReferralStatus[]>> = Object.freeze({
  draft: ["sent"], sent: ["accepted", "declined", "expired"], accepted: ["contacted", "expired"],
  declined: [], contacted: ["closed", "expired"], closed: [], expired: [],
});

export function transitionReferral(input: Readonly<{
  referral: BusinessReferral; expectedVersion: number; to: ReferralStatus; actorUserId: UserId;
  now: string; outcome?: ReferralOutcome | null; acquisitionContextId?: string | null; communicationMessageId?: string | null;
}>): BusinessReferral {
  if (input.expectedVersion !== input.referral.version) throw new Error(`Referral changed; current version is ${input.referral.version}.`);
  const now = iso(input.now, "Referral transition time");
  if (input.to !== "expired" && input.referral.expiresAt <= now) throw new Error("Referral has expired; refresh to recover its current state.");
  if (!TRANSITIONS[input.referral.status].includes(input.to)) throw new Error(`Referral cannot move from ${input.referral.status} to ${input.to}.`);
  const outcome = input.to === "closed"
    ? controlled(input.outcome ?? "other", ["connected", "not-a-fit", "no-response", "other"], "Referral outcome")
    : null;
  return Object.freeze({
    ...input.referral, version: input.referral.version + 1, status: input.to, outcome,
    sentAt: input.to === "sent" ? now : input.referral.sentAt,
    acquisitionContextId: input.acquisitionContextId ?? input.referral.acquisitionContextId,
    communicationMessageId: input.communicationMessageId ?? input.referral.communicationMessageId,
    recipientActorUserId: ["accepted", "declined"].includes(input.to) ? input.actorUserId : input.referral.recipientActorUserId,
    updatedAt: now,
  });
}

export function attachReferralRecipient(input: Readonly<{
  referral: BusinessReferral; organizationId: OrganizationId; actorUserId: UserId; expectedVersion: number; now: string;
}>): BusinessReferral {
  if (input.referral.recipient.kind !== "external" || !input.referral.acquisitionContextId) throw new Error("Referral has no attachable external invitation.");
  if (input.referral.attachedRecipientOrganizationId) {
    if (input.referral.attachedRecipientOrganizationId !== input.organizationId) throw new Error("Referral is already attached to another organization.");
    return input.referral;
  }
  if (input.expectedVersion !== input.referral.version) throw new Error(`Referral changed; current version is ${input.referral.version}.`);
  const now = iso(input.now, "Recipient attachment time");
  if (input.referral.expiresAt <= now) throw new Error("Referral invitation has expired.");
  return Object.freeze({ ...input.referral, version: input.referral.version + 1, attachedRecipientOrganizationId: input.organizationId, recipientActorUserId: input.actorUserId, updatedAt: now });
}

export function projectReferral(referral: BusinessReferral, organizationId: OrganizationId): SenderReferralProjection | RecipientReferralProjection | null {
  const base = Object.freeze({ id: referral.id, version: referral.version, recipientLabel: referral.recipient.displayName, need: referral.need, summary: referral.summary, urgency: referral.urgency, preferredContactMethod: referral.preferredContactMethod, purpose: referral.purpose, opportunityReference: referral.opportunityReference, sharedFields: referral.sharedFields, status: referral.status, outcome: referral.outcome, correlationId: referral.correlationId, notificationStatus: referral.communicationMessageId ? "queued" as const : "unavailable" as const, createdAt: referral.createdAt, sentAt: referral.sentAt, expiresAt: referral.expiresAt, updatedAt: referral.updatedAt });
  if (organizationId === referral.senderOrganizationId) return Object.freeze({ ...base, role: "sender" as const, recipientKind: referral.recipient.kind, recipientOrganizationId: referral.attachedRecipientOrganizationId });
  if (referral.status !== "draft" && organizationId === referral.attachedRecipientOrganizationId) return Object.freeze({ ...base, role: "recipient" as const, senderOrganizationName: referral.senderOrganizationName });
  return null;
}
