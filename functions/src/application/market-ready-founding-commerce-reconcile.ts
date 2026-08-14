export const FOUNDING_CAP = 250 as const;
export const FOUNDING_PRICE_ID = "price_1U44szPNrfGaFz2qxcWEKKRl" as const;

export const PROVIDER_SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
  "canceled",
  "incomplete_expired",
] as const;

export type ProviderSubscriptionStatus = (typeof PROVIDER_SUBSCRIPTION_STATUSES)[number];
export type CommercialProjectionStatus =
  | "trialing"
  | "active"
  | "past-due"
  | "suspended"
  | "canceled";

export interface ProviderSubscriptionSnapshot {
  readonly id: string;
  readonly customerId: string;
  readonly organizationId: string;
  readonly status: ProviderSubscriptionStatus;
  readonly priceId: string;
  readonly quantity: number;
  readonly currentPeriodEndsAt: string | null;
  readonly cancelAtPeriodEnd: boolean;
}

export interface FoundingCapacitySnapshot {
  readonly cap: number;
  readonly committedOrganizationIds: readonly string[];
  readonly reservedOrganizationIds: readonly string[];
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.map((value) => required(value, "Organization id")))]);
}

export function hasActiveFoundingRecognition(status: ProviderSubscriptionStatus): boolean {
  return status === "active" || status === "trialing";
}

export function subscriptionRetainsCapacity(status: ProviderSubscriptionStatus): boolean {
  return status !== "canceled" && status !== "incomplete_expired";
}

export function commercialProjectionStatus(status: ProviderSubscriptionStatus): CommercialProjectionStatus {
  if (status === "active" || status === "trialing") return status;
  if (status === "past_due") return "past-due";
  if (status === "canceled" || status === "incomplete_expired") return "canceled";
  return "suspended";
}

export function assertFoundingSubscriptionCorrelation(input: Readonly<{
  snapshot: ProviderSubscriptionSnapshot;
  organizationId: string;
  customerId: string;
}>): void {
  const organizationId = required(input.organizationId, "Expected organization id");
  const customerId = required(input.customerId, "Expected customer id");
  if (input.snapshot.organizationId !== organizationId) {
    throw new Error("Provider subscription organization metadata does not match RFxchange authority.");
  }
  if (input.snapshot.customerId !== customerId) {
    throw new Error("Provider subscription Customer does not match RFxchange authority.");
  }
  if (input.snapshot.priceId !== FOUNDING_PRICE_ID) {
    throw new Error("Provider subscription Price does not match the approved Founding Price.");
  }
  if (input.snapshot.quantity !== 1) {
    throw new Error("Provider subscription quantity must be exactly one organization.");
  }
}

export function normalizeFoundingCapacity(input: FoundingCapacitySnapshot): FoundingCapacitySnapshot {
  if (!Number.isInteger(input.cap) || input.cap !== FOUNDING_CAP) {
    throw new Error(`Founding capacity must equal ${FOUNDING_CAP}.`);
  }
  const committed = unique(input.committedOrganizationIds);
  const committedSet = new Set(committed);
  const reserved = unique(input.reservedOrganizationIds).filter((id) => !committedSet.has(id));
  if (committed.length + reserved.length > FOUNDING_CAP) {
    throw new Error("Founding committed organizations plus live reservations cannot exceed the cap.");
  }
  return Object.freeze({
    cap: FOUNDING_CAP,
    committedOrganizationIds: Object.freeze([...committed]),
    reservedOrganizationIds: Object.freeze([...reserved]),
  });
}

export function reserveFoundingCapacity(
  current: FoundingCapacitySnapshot,
  organizationIdValue: string,
): FoundingCapacitySnapshot {
  const organizationId = required(organizationIdValue, "Organization id");
  const state = normalizeFoundingCapacity(current);
  if (
    state.committedOrganizationIds.includes(organizationId) ||
    state.reservedOrganizationIds.includes(organizationId)
  ) {
    return state;
  }
  if (state.committedOrganizationIds.length + state.reservedOrganizationIds.length >= state.cap) {
    throw new Error("Founding organization capacity is full.");
  }
  return normalizeFoundingCapacity({
    ...state,
    reservedOrganizationIds: [...state.reservedOrganizationIds, organizationId],
  });
}

export function reconcileFoundingCapacity(
  current: FoundingCapacitySnapshot,
  organizationIdValue: string,
  providerStatus: ProviderSubscriptionStatus,
): FoundingCapacitySnapshot {
  const organizationId = required(organizationIdValue, "Organization id");
  const state = normalizeFoundingCapacity(current);

  if (!subscriptionRetainsCapacity(providerStatus)) {
    return normalizeFoundingCapacity({
      ...state,
      committedOrganizationIds: state.committedOrganizationIds.filter((id) => id !== organizationId),
      reservedOrganizationIds: state.reservedOrganizationIds.filter((id) => id !== organizationId),
    });
  }

  if (state.committedOrganizationIds.includes(organizationId)) return state;
  const reservedByOrganization = state.reservedOrganizationIds.includes(organizationId);
  if (
    !reservedByOrganization &&
    state.committedOrganizationIds.length + state.reservedOrganizationIds.length >= state.cap
  ) {
    throw new Error("A non-terminal Founding subscription cannot be admitted beyond the authoritative cap.");
  }

  return normalizeFoundingCapacity({
    ...state,
    committedOrganizationIds: [...state.committedOrganizationIds, organizationId],
    reservedOrganizationIds: state.reservedOrganizationIds.filter((id) => id !== organizationId),
  });
}

export function releaseExpiredCheckoutReservation(input: Readonly<{
  current: FoundingCapacitySnapshot;
  organizationId: string;
  providerHasNonTerminalFoundingSubscription: boolean;
}>): FoundingCapacitySnapshot {
  if (input.providerHasNonTerminalFoundingSubscription) {
    return reconcileFoundingCapacity(input.current, input.organizationId, "incomplete");
  }
  const organizationId = required(input.organizationId, "Organization id");
  const state = normalizeFoundingCapacity(input.current);
  if (state.committedOrganizationIds.includes(organizationId)) return state;
  return normalizeFoundingCapacity({
    ...state,
    reservedOrganizationIds: state.reservedOrganizationIds.filter((id) => id !== organizationId),
  });
}
