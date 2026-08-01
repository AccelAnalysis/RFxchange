import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";
import type { BoundAcquisitionContext } from "../acquisition/model.ts";

export const ORGANIZATION_RELATIONSHIPS = [
  "owner",
  "executive-officer",
  "employee",
  "authorized-representative",
  "advisor-contractor",
  "other",
] as const;
export type OrganizationRelationship = (typeof ORGANIZATION_RELATIONSHIPS)[number];

export interface ActivationLegalAcceptance {
  readonly acceptedTerms: true;
  readonly acceptedPlatformRules: true;
  readonly acknowledgedPrivacy: true;
  readonly capturedAt: string;
}

export interface ActivationOrganizationIdentitySeed {
  readonly websiteDisposition: "available" | "not-applicable" | null;
  readonly websiteUrl: string | null;
  readonly phone: string | null;
}

export interface ActivationJourneyContext {
  /** One current Wave 2 activation context per RFxchange user. */
  readonly id: string;
  readonly userId: UserId;
  readonly accessJourneyId: string;
  readonly provisionalOrganizationName: string;
  /**
   * Descriptive onboarding metadata only. This value never grants organization authority or any
   * permission; durable control continues to require membership + authorization establishment.
   */
  readonly organizationRelationship: OrganizationRelationship | null;
  /**
   * Reusable provisional identity captured during resolution. It is copied into the durable
   * organization profile after authority/location are established so registration never asks for
   * the same website or phone twice.
   */
  readonly organizationIdentitySeed: ActivationOrganizationIdentitySeed;
  /** Server-issued navigation intent, bound to this user and access journey. Never authority. */
  readonly acquisitionContext: BoundAcquisitionContext | null;
  readonly legalAcceptance: ActivationLegalAcceptance | null;
  /**
   * Temporary bridge only. It proves the user saw the canonical orientation position in the
   * journey while Slices 2.10/2.11 are still pending; it is never education completion.
   */
  readonly orientationBridgeAcknowledgedAt: string | null;
  readonly organizationId: OrganizationId | null;
  readonly membershipId: OrganizationMembershipId | null;
  readonly activeLocationDraftId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function required(value: string, label: string, maximum = 240): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximum) throw new Error(`${label} exceeds ${maximum} characters.`);
  return normalized;
}

function optional(value: string | null | undefined, label: string, maximum = 240): string | null {
  if (value == null || !value.trim()) return null;
  return required(value, label, maximum);
}

function timestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new Error("Activation timestamp must be valid.");
  return parsed.toISOString();
}

function normalizedWebsite(value: string | null | undefined): string | null {
  const raw = optional(value, "Organization website", 320);
  if (!raw) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  const parsed = new URL(candidate);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Organization website must use HTTP or HTTPS.");
  }
  parsed.hash = "";
  return parsed.toString();
}

function normalizedPhone(value: string | null | undefined): string | null {
  const phone = optional(value, "Organization phone", 40);
  if (phone && !/^[+0-9().\-\s]{7,40}$/.test(phone)) {
    throw new Error("Organization phone is malformed.");
  }
  return phone;
}

function identitySeed(
  input: Readonly<{
    websiteDisposition?: "available" | "not-applicable" | null;
    websiteUrl?: string | null;
    phone?: string | null;
  }> = {},
): ActivationOrganizationIdentitySeed {
  const websiteDisposition = input.websiteDisposition ?? null;
  const websiteUrl = websiteDisposition === "available"
    ? normalizedWebsite(input.websiteUrl)
    : null;
  if (websiteDisposition === "available" && !websiteUrl) {
    throw new Error("Organization website is required when website disposition is available.");
  }
  return Object.freeze({
    websiteDisposition,
    websiteUrl,
    phone: normalizedPhone(input.phone),
  });
}

export function organizationRelationship(value: string): OrganizationRelationship {
  const normalized = required(value, "Organization relationship", 64).toLowerCase();
  if (!ORGANIZATION_RELATIONSHIPS.includes(normalized as OrganizationRelationship)) {
    throw new Error(`Unsupported organization relationship: ${normalized}.`);
  }
  return normalized as OrganizationRelationship;
}

export function activationJourneyIdForUser(userId: UserId): string {
  return `activation-${String(userId)}`;
}

export function createActivationJourneyContext(input: Readonly<{
  userId: UserId;
  provisionalOrganizationName: string;
  organizationRelationship?: string | null;
  organizationIdentitySeed?: Readonly<{
    websiteDisposition?: "available" | "not-applicable" | null;
    websiteUrl?: string | null;
    phone?: string | null;
  }>;
  now: string;
}>): ActivationJourneyContext {
  const now = timestamp(input.now);
  const accessJourneyId = activationJourneyIdForUser(input.userId);
  return Object.freeze({
    id: String(input.userId),
    userId: input.userId,
    accessJourneyId,
    provisionalOrganizationName: required(
      input.provisionalOrganizationName,
      "Provisional organization name",
      160,
    ),
    organizationRelationship: input.organizationRelationship
      ? organizationRelationship(input.organizationRelationship)
      : null,
    organizationIdentitySeed: identitySeed(input.organizationIdentitySeed),
    acquisitionContext: null,
    legalAcceptance: null,
    orientationBridgeAcknowledgedAt: null,
    organizationId: null,
    membershipId: null,
    activeLocationDraftId: null,
    createdAt: now,
    updatedAt: now,
  });
}

export function updateActivationJourneyContext(
  current: ActivationJourneyContext,
  input: Readonly<{
    provisionalOrganizationName?: string;
    organizationRelationship?: string | null;
    organizationIdentitySeed?: Readonly<{
      websiteDisposition?: "available" | "not-applicable" | null;
      websiteUrl?: string | null;
      phone?: string | null;
    }>;
    acquisitionContext?: BoundAcquisitionContext | null;
    legalAcceptance?: ActivationLegalAcceptance | null;
    orientationBridgeAcknowledgedAt?: string | null;
    organizationId?: OrganizationId | null;
    membershipId?: OrganizationMembershipId | null;
    activeLocationDraftId?: string | null;
    now: string;
  }>,
): ActivationJourneyContext {
  const now = timestamp(input.now);
  if (
    input.acquisitionContext &&
    (
      input.acquisitionContext.boundUserId !== current.userId ||
      String(input.acquisitionContext.boundAccessJourneyId) !== current.accessJourneyId
    )
  ) {
    throw new Error("Acquisition context belongs to another participant journey.");
  }
  return Object.freeze({
    ...current,
    ...(input.provisionalOrganizationName !== undefined
      ? {
          provisionalOrganizationName: required(
            input.provisionalOrganizationName,
            "Provisional organization name",
            160,
          ),
        }
      : {}),
    ...(input.organizationRelationship !== undefined
      ? {
          organizationRelationship: input.organizationRelationship
            ? organizationRelationship(input.organizationRelationship)
            : null,
        }
      : {}),
    ...(input.organizationIdentitySeed !== undefined
      ? { organizationIdentitySeed: identitySeed(input.organizationIdentitySeed) }
      : {}),
    ...(input.acquisitionContext !== undefined
      ? {
          acquisitionContext: input.acquisitionContext
            ? Object.freeze({
                ...input.acquisitionContext,
                intent: Object.freeze({ ...input.acquisitionContext.intent }),
                source: Object.freeze({ ...input.acquisitionContext.source }),
              })
            : null,
        }
      : {}),
    ...(input.legalAcceptance !== undefined
      ? { legalAcceptance: input.legalAcceptance }
      : {}),
    ...(input.orientationBridgeAcknowledgedAt !== undefined
      ? {
          orientationBridgeAcknowledgedAt: input.orientationBridgeAcknowledgedAt
            ? timestamp(input.orientationBridgeAcknowledgedAt)
            : null,
        }
      : {}),
    ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {}),
    ...(input.membershipId !== undefined ? { membershipId: input.membershipId } : {}),
    ...(input.activeLocationDraftId !== undefined
      ? { activeLocationDraftId: input.activeLocationDraftId }
      : {}),
    updatedAt: now,
  });
}

export function createActivationLegalAcceptance(now: string): ActivationLegalAcceptance {
  return Object.freeze({
    acceptedTerms: true as const,
    acceptedPlatformRules: true as const,
    acknowledgedPrivacy: true as const,
    capturedAt: timestamp(now),
  });
}
