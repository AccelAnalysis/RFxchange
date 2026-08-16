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
  readonly checkoutReservationId?: string | null;
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

/**
 * Resolve the only Price that webhook reconciliation may accept for the configured provider mode.
 * Production is immutable. Test mode is still server-configured and never chosen by webhook data.
 */
export function foundingPriceIdForMode(mode: "live" | "test", testPriceId?: string): string {
  if (mode === "live") return FOUNDING_PRICE_ID;
  return required(testPriceId ?? "", "Test Founding Price id");
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

function lifecycleSafetyRank(status: ProviderSubscriptionStatus): number {
  if (status === "canceled" || status === "incomplete_expired") return 3;
  if (status === "past_due" || status === "unpaid" || status === "paused" || status === "incomplete") return 2;
  return 1;
}

/**
 * Decide whether a provider lifecycle observation may replace the persisted projection.
 * Stripe event creation time is the ordering token. When two lifecycle events share Stripe's
 * second-level timestamp, fail closed toward the observation that grants less recognition/capacity
 * authority so an overlapping older active snapshot cannot resurrect paid state after cancellation.
 */
export function shouldApplyProviderLifecycleObservation(input: Readonly<{
  incomingCreatedAt: string;
  incomingStatus: ProviderSubscriptionStatus;
  previousCreatedAt?: string | null;
  previousStatus?: ProviderSubscriptionStatus | null;
}>): boolean {
  const incoming = Date.parse(required(input.incomingCreatedAt, "Incoming provider event timestamp"));
  if (!Number.isFinite(incoming)) throw new Error("Incoming provider event timestamp is invalid.");
  if (!input.previousCreatedAt || !input.previousStatus) return true;
  const previous = Date.parse(required(input.previousCreatedAt, "Previous provider event timestamp"));
  if (!Number.isFinite(previous)) throw new Error("Previous provider event timestamp is invalid.");
  if (incoming > previous) return true;
  if (incoming < previous) return false;
  return lifecycleSafetyRank(input.incomingStatus) >= lifecycleSafetyRank(input.previousStatus);
}

export function assertFoundingSubscriptionCorrelation(input: Readonly<{
  snapshot: ProviderSubscriptionSnapshot;
  organizationId: string;
  customerId: string;
  expectedPriceId: string;
}>): void {
  const organizationId = required(input.organizationId, "Expected organization id");
  const customerId = required(input.customerId, "Expected customer id");
  const expectedPriceId = required(input.expectedPriceId, "Expected Founding Price id");
  if (input.snapshot.organizationId !== organizationId) {
    throw new Error("Provider subscription organization metadata does not match RFxchange authority.");
  }
  if (input.snapshot.customerId !== customerId) {
    throw new Error("Provider subscription Customer does not match RFxchange authority.");
  }
  if (input.snapshot.priceId !== expectedPriceId) {
    throw new Error("Provider subscription Price does not match the approved Founding Price for the configured mode.");
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