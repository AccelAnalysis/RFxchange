import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";

export interface ActivationLegalAcceptance {
  readonly acceptedTerms: true;
  readonly acceptedPlatformRules: true;
  readonly acknowledgedPrivacy: true;
  readonly capturedAt: string;
}

export interface ActivationJourneyContext {
  /** One current Wave 2 activation context per RFxchange user. */
  readonly id: string;
  readonly userId: UserId;
  readonly accessJourneyId: string;
  readonly provisionalOrganizationName: string;
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

function timestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new Error("Activation timestamp must be valid.");
  return parsed.toISOString();
}

export function activationJourneyIdForUser(userId: UserId): string {
  return `activation-${String(userId)}`;
}

export function createActivationJourneyContext(input: Readonly<{
  userId: UserId;
  provisionalOrganizationName: string;
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
    legalAcceptance?: ActivationLegalAcceptance | null;
    orientationBridgeAcknowledgedAt?: string | null;
    organizationId?: OrganizationId | null;
    membershipId?: OrganizationMembershipId | null;
    activeLocationDraftId?: string | null;
    now: string;
  }>,
): ActivationJourneyContext {
  const now = timestamp(input.now);
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
