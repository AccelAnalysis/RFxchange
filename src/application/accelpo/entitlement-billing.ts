export const ACCELPO_ENTITLEMENT_BILLING_VERSION = 1 as const;

/**
 * Seat facts stay in the shared commercial account entitlement-key set. CP-10 interprets these
 * keys; it does not own plan quantities or prices and must never infer them from a plan name.
 */
export const SHARED_SEAT_ENTITLEMENT_KEYS = Object.freeze({
  includedSeatsPrefix: "organization.seats.included:",
  addOnAllowancePrefix: "organization.seats.addon.allowance:",
  addOnPurchaseAllowed: "organization.seats.addon.purchase",
  addOnPriceMinorPrefix: "organization.seats.addon.price-minor:",
  addOnCurrencyPrefix: "organization.seats.addon.currency:",
} as const);

const MAX_SEAT_COUNT = 1_000_000;
const ISO_CURRENCY = /^[a-z]{3}$/;

export interface AddOnSeatPricing {
  readonly amountMinor: number;
  readonly currency: string;
}

export interface SharedSeatEntitlementConfiguration {
  readonly includedSeats: number;
  readonly addOnSeatAllowance: number;
  readonly addOnPurchaseAllowed: boolean;
  readonly addOnSeatPricing: AddOnSeatPricing | null;
}

export interface SharedCommercialEntitlementSource {
  readonly plan: string;
  readonly entitlementKeys: readonly string[];
  /** The shared commercial source currently exposes its current billing-period end timestamp. */
  readonly billingPeriod: string | null;
  readonly entitlementVersion: string;
}

export interface SeatMembershipFact {
  readonly userId: string;
  readonly status: string;
}

export interface SeatInvitationFact {
  readonly id: string;
  readonly status: string;
  readonly expiresAt: string | null;
}

export interface EntitlementBillingProjection {
  readonly version: typeof ACCELPO_ENTITLEMENT_BILLING_VERSION;
  readonly organizationId: string;
  readonly status: "available" | "not-configured";
  readonly plan: string | null;
  readonly includedSeats: number | null;
  readonly activeSeats: number;
  readonly reservedSeats: number;
  readonly availableSeats: number | null;
  readonly addOnSeatAllowance: number | null;
  readonly addOnSeatPricing: AddOnSeatPricing | null;
  readonly billingPeriod: string | null;
  readonly entitlementVersion: string | null;
  readonly addSeatActionAllowed: boolean;
  /** Active memberships are never exempted from seat use merely because the member is the owner. */
  readonly ownerCountsAsSeat: true;
}

export interface AddSeatBillingHandoffRequest {
  readonly kind: "add-seat";
  readonly organizationId: string;
  readonly quantity: 1;
  readonly plan: string;
  readonly entitlementVersion: string;
  readonly returnTo: string;
  readonly quotedUnitPrice: AddOnSeatPricing | null;
}

export type ResponsibilityResolution =
  | Readonly<{ readonly kind: "resolved"; readonly openResponsibilityIds: readonly [] }>
  | Readonly<{ readonly kind: "open"; readonly openResponsibilityIds: readonly string[] }>
  | Readonly<{ readonly kind: "unavailable" }>;

/** P1/P6 bind this to trusted server-owned work data before member removal can be enabled. */
export interface MemberResponsibilityResolver {
  resolve(input: Readonly<{
    organizationId: string;
    membershipId: string;
    userId: string;
  }>): Promise<ResponsibilityResolution>;
}

export type MemberSeatReleasePlan =
  | Readonly<{ readonly kind: "allow" }>
  | Readonly<{
      readonly kind: "blocked";
      readonly reason:
        | "owner-transfer-required"
        | "open-responsibilities"
        | "responsibility-check-unavailable";
      readonly openResponsibilityIds: readonly string[];
    }>;

function integerToken(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= MAX_SEAT_COUNT ? parsed : null;
}

function singletonSuffix(keys: readonly string[], prefix: string): string | null {
  const values = keys
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length));
  return values.length === 1 ? values[0] ?? null : null;
}

/**
 * Interprets only explicit numeric seat entitlements from the shared commercial source.
 * A missing/ambiguous included-seat key is intentionally treated as not configured.
 */
export function parseSharedSeatEntitlements(
  entitlementKeys: readonly string[],
): SharedSeatEntitlementConfiguration | null {
  const keys = Object.freeze([...new Set(entitlementKeys.map((value) => value.trim()).filter(Boolean))]);
  const includedToken = singletonSuffix(keys, SHARED_SEAT_ENTITLEMENT_KEYS.includedSeatsPrefix);
  const includedSeats = includedToken === null ? null : integerToken(includedToken);
  if (includedSeats === null) return null;

  const allowanceToken = singletonSuffix(keys, SHARED_SEAT_ENTITLEMENT_KEYS.addOnAllowancePrefix);
  const addOnSeatAllowance = allowanceToken === null ? 0 : integerToken(allowanceToken);
  if (addOnSeatAllowance === null) return null;

  const amountToken = singletonSuffix(keys, SHARED_SEAT_ENTITLEMENT_KEYS.addOnPriceMinorPrefix);
  const currencyToken = singletonSuffix(keys, SHARED_SEAT_ENTITLEMENT_KEYS.addOnCurrencyPrefix);
  const amountMinor = amountToken === null ? null : integerToken(amountToken);
  const currency = currencyToken && ISO_CURRENCY.test(currencyToken) ? currencyToken.toUpperCase() : null;
  const addOnSeatPricing = amountMinor !== null && currency !== null
    ? Object.freeze({ amountMinor, currency })
    : null;

  return Object.freeze({
    includedSeats,
    addOnSeatAllowance,
    addOnPurchaseAllowed: keys.includes(SHARED_SEAT_ENTITLEMENT_KEYS.addOnPurchaseAllowed),
    addOnSeatPricing,
  });
}

export function invitationReservesSeat(invitation: SeatInvitationFact, now: string): boolean {
  if (invitation.status !== "pending") return false;
  if (!invitation.expiresAt) return false;
  const expiresAt = Date.parse(invitation.expiresAt);
  const at = Date.parse(now);
  if (!Number.isFinite(expiresAt) || !Number.isFinite(at)) return false;
  return expiresAt > at;
}

export function resolveEntitlementBilling(input: Readonly<{
  organizationId: string;
  commercial: SharedCommercialEntitlementSource | null;
  memberships: readonly SeatMembershipFact[];
  invitations: readonly SeatInvitationFact[];
  now: string;
}>): EntitlementBillingProjection {
  const activeSeats = input.memberships.filter((membership) => membership.status === "active").length;
  const reservedSeats = input.invitations.filter((invitation) => invitationReservesSeat(invitation, input.now)).length;
  const configuration = input.commercial
    ? parseSharedSeatEntitlements(input.commercial.entitlementKeys)
    : null;

  if (!input.commercial || !configuration) {
    return Object.freeze({
      version: ACCELPO_ENTITLEMENT_BILLING_VERSION,
      organizationId: input.organizationId,
      status: "not-configured" as const,
      plan: input.commercial?.plan ?? null,
      includedSeats: null,
      activeSeats,
      reservedSeats,
      availableSeats: null,
      addOnSeatAllowance: null,
      addOnSeatPricing: null,
      billingPeriod: input.commercial?.billingPeriod ?? null,
      entitlementVersion: input.commercial?.entitlementVersion ?? null,
      addSeatActionAllowed: false,
      ownerCountsAsSeat: true as const,
    });
  }

  const entitledSeats = configuration.includedSeats + configuration.addOnSeatAllowance;
  const availableSeats = Math.max(0, entitledSeats - activeSeats - reservedSeats);
  return Object.freeze({
    version: ACCELPO_ENTITLEMENT_BILLING_VERSION,
    organizationId: input.organizationId,
    status: "available" as const,
    plan: input.commercial.plan,
    includedSeats: configuration.includedSeats,
    activeSeats,
    reservedSeats,
    availableSeats,
    addOnSeatAllowance: configuration.addOnSeatAllowance,
    addOnSeatPricing: configuration.addOnSeatPricing,
    billingPeriod: input.commercial.billingPeriod,
    entitlementVersion: input.commercial.entitlementVersion,
    addSeatActionAllowed: configuration.addOnPurchaseAllowed && availableSeats === 0,
    ownerCountsAsSeat: true as const,
  });
}

export function createAddSeatBillingHandoff(
  projection: EntitlementBillingProjection,
  returnTo: string,
): AddSeatBillingHandoffRequest | null {
  const safeReturnTo = returnTo.trim();
  if (
    projection.status !== "available" ||
    !projection.addSeatActionAllowed ||
    !projection.plan ||
    !projection.entitlementVersion ||
    !safeReturnTo.startsWith("/") ||
    safeReturnTo.startsWith("//")
  ) {
    return null;
  }
  return Object.freeze({
    kind: "add-seat" as const,
    organizationId: projection.organizationId,
    quantity: 1 as const,
    plan: projection.plan,
    entitlementVersion: projection.entitlementVersion,
    returnTo: safeReturnTo,
    quotedUnitPrice: projection.addOnSeatPricing,
  });
}

export function planMemberSeatRelease(input: Readonly<{
  roleKey: string;
  responsibilities: ResponsibilityResolution;
}>): MemberSeatReleasePlan {
  if (input.roleKey === "primary-admin-owner") {
    return Object.freeze({
      kind: "blocked" as const,
      reason: "owner-transfer-required" as const,
      openResponsibilityIds: Object.freeze([]),
    });
  }
  if (input.responsibilities.kind === "unavailable") {
    return Object.freeze({
      kind: "blocked" as const,
      reason: "responsibility-check-unavailable" as const,
      openResponsibilityIds: Object.freeze([]),
    });
  }
  if (input.responsibilities.kind === "open" && input.responsibilities.openResponsibilityIds.length > 0) {
    return Object.freeze({
      kind: "blocked" as const,
      reason: "open-responsibilities" as const,
      openResponsibilityIds: Object.freeze([...new Set(input.responsibilities.openResponsibilityIds)]),
    });
  }
  return Object.freeze({ kind: "allow" as const });
}
