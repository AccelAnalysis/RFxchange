import { isoTimestamp, organizationId, type IsoTimestamp, type OrganizationId } from "../organizations/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type CommercialAccountId = Brand<string, "CommercialAccountId">;
export type CommercialPlanKey = Brand<string, "CommercialPlanKey">;
export type CommercialEntitlementKey = Brand<string, "CommercialEntitlementKey">;
export type PaymentProviderKey = Brand<string, "PaymentProviderKey">;
export type PaymentProviderExternalReference = Brand<string, "PaymentProviderExternalReference">;

export const COMMERCIAL_SUBSCRIPTION_STATUSES = [
  "not-subscribed",
  "trialing",
  "active",
  "past-due",
  "canceled",
  "suspended",
] as const;

export type CommercialSubscriptionStatus = (typeof COMMERCIAL_SUBSCRIPTION_STATUSES)[number];

export const PAYMENT_PROVIDER_REFERENCE_KINDS = [
  "customer",
  "subscription",
  "checkout-session",
  "customer-portal-session",
  "payment",
] as const;

export type PaymentProviderReferenceKind = (typeof PAYMENT_PROVIDER_REFERENCE_KINDS)[number];

export interface PaymentProviderReference {
  readonly providerKey: PaymentProviderKey;
  readonly kind: PaymentProviderReferenceKind;
  readonly externalReference: PaymentProviderExternalReference;
}

export interface CommercialSubscriptionState {
  readonly status: CommercialSubscriptionStatus;
  readonly providerSubscriptionReference: PaymentProviderReference | null;
  readonly currentPeriodEndsAt: IsoTimestamp | null;
  readonly cancelAtPeriodEnd: boolean;
}

/**
 * One commercial aggregate belongs to exactly one Organization Account tenant.
 * Individual users can administer it through permissions, but no user owns plan,
 * subscription, entitlement, or provider-reference state.
 */
export interface OrganizationCommercialAccount {
  readonly id: CommercialAccountId;
  readonly organizationId: OrganizationId;
  readonly planKey: CommercialPlanKey;
  readonly subscription: CommercialSubscriptionState;
  readonly entitlementKeys: readonly CommercialEntitlementKey[];
  readonly providerReferences: readonly PaymentProviderReference[];
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function stableKey(value: string, field: string): string {
  const normalized = required(value, field);
  if (!/^[a-z0-9][a-z0-9._:-]{0,127}$/.test(normalized)) {
    throw new Error(`${field} must be a stable lowercase identifier.`);
  }
  return normalized;
}

export function commercialAccountId(value: string): CommercialAccountId {
  return stableKey(value, "Commercial account id") as CommercialAccountId;
}

export function commercialPlanKey(value: string): CommercialPlanKey {
  return stableKey(value, "Commercial plan key") as CommercialPlanKey;
}

export function commercialEntitlementKey(value: string): CommercialEntitlementKey {
  return stableKey(value, "Commercial entitlement key") as CommercialEntitlementKey;
}

export function paymentProviderKey(value: string): PaymentProviderKey {
  return stableKey(value, "Payment provider key") as PaymentProviderKey;
}

export function paymentProviderExternalReference(value: string): PaymentProviderExternalReference {
  return required(value, "Payment provider external reference") as PaymentProviderExternalReference;
}

export function createPaymentProviderReference(input: Readonly<{
  providerKey: string;
  kind: PaymentProviderReferenceKind;
  externalReference: string;
}>): PaymentProviderReference {
  if (!PAYMENT_PROVIDER_REFERENCE_KINDS.includes(input.kind)) {
    throw new Error(`Unsupported payment provider reference kind: ${input.kind}.`);
  }
  return Object.freeze({
    providerKey: paymentProviderKey(input.providerKey),
    kind: input.kind,
    externalReference: paymentProviderExternalReference(input.externalReference),
  });
}

function normalizeProviderReferences(values: readonly PaymentProviderReference[]): readonly PaymentProviderReference[] {
  const byKind = new Map<PaymentProviderReferenceKind, PaymentProviderReference>();
  for (const reference of values) {
    if (byKind.has(reference.kind)) {
      throw new Error(`Commercial account cannot contain duplicate ${reference.kind} provider references.`);
    }
    byKind.set(reference.kind, reference);
  }
  const providerKeys = new Set(values.map((reference) => reference.providerKey));
  if (providerKeys.size > 1) {
    throw new Error("Commercial account provider references must belong to one payment provider at a time.");
  }
  return Object.freeze([...values]);
}

function subscriptionState(input?: Readonly<{
  status?: CommercialSubscriptionStatus;
  providerSubscriptionReference?: PaymentProviderReference | null;
  currentPeriodEndsAt?: string | null;
  cancelAtPeriodEnd?: boolean;
}>): CommercialSubscriptionState {
  const status = input?.status ?? "not-subscribed";
  if (!COMMERCIAL_SUBSCRIPTION_STATUSES.includes(status)) {
    throw new Error(`Unsupported commercial subscription status: ${status}.`);
  }
  const reference = input?.providerSubscriptionReference ?? null;
  if (reference && reference.kind !== "subscription") {
    throw new Error("Commercial subscription provider reference must have kind subscription.");
  }
  if (status === "not-subscribed" && reference) {
    throw new Error("A not-subscribed commercial account cannot retain a provider subscription reference.");
  }
  return Object.freeze({
    status,
    providerSubscriptionReference: reference,
    currentPeriodEndsAt: input?.currentPeriodEndsAt ? isoTimestamp(input.currentPeriodEndsAt) : null,
    cancelAtPeriodEnd: input?.cancelAtPeriodEnd ?? false,
  });
}

export function createOrganizationCommercialAccount(input: Readonly<{
  organizationId: string;
  planKey?: string;
  entitlementKeys?: readonly string[];
  providerReferences?: readonly PaymentProviderReference[];
  subscription?: Readonly<{
    status?: CommercialSubscriptionStatus;
    providerSubscriptionReference?: PaymentProviderReference | null;
    currentPeriodEndsAt?: string | null;
    cancelAtPeriodEnd?: boolean;
  }>;
  now: string;
}>): OrganizationCommercialAccount {
  const organization = organizationId(input.organizationId);
  const now = isoTimestamp(input.now);
  const entitlements = Object.freeze([
    ...new Set((input.entitlementKeys ?? []).map(commercialEntitlementKey)),
  ]);
  const providerReferences = normalizeProviderReferences(input.providerReferences ?? []);
  const subscription = subscriptionState(input.subscription);

  if (
    subscription.providerSubscriptionReference &&
    !providerReferences.some((reference) =>
      reference.kind === "subscription" &&
      reference.providerKey === subscription.providerSubscriptionReference?.providerKey &&
      reference.externalReference === subscription.providerSubscriptionReference?.externalReference)
  ) {
    throw new Error("Commercial subscription reference must also be present in providerReferences.");
  }

  return Object.freeze({
    id: commercialAccountId(organization),
    organizationId: organization,
    planKey: commercialPlanKey(input.planKey ?? "free"),
    subscription,
    entitlementKeys: entitlements,
    providerReferences,
    createdAt: now,
    updatedAt: now,
  });
}

export function evolveOrganizationCommercialAccount(
  current: OrganizationCommercialAccount,
  input: Readonly<{
    planKey: string;
    entitlementKeys: readonly string[];
    providerReferences: readonly PaymentProviderReference[];
    subscription: Readonly<{
      status: CommercialSubscriptionStatus;
      providerSubscriptionReference?: PaymentProviderReference | null;
      currentPeriodEndsAt?: string | null;
      cancelAtPeriodEnd?: boolean;
    }>;
    now: string;
  }>,
): OrganizationCommercialAccount {
  const updatedAt = isoTimestamp(input.now);
  if (Date.parse(updatedAt) < Date.parse(current.updatedAt)) {
    throw new Error("Commercial account update timestamp cannot precede current state.");
  }
  const providerReferences = normalizeProviderReferences(input.providerReferences);
  const subscription = subscriptionState(input.subscription);
  if (
    subscription.providerSubscriptionReference &&
    !providerReferences.some((reference) =>
      reference.kind === "subscription" &&
      reference.providerKey === subscription.providerSubscriptionReference?.providerKey &&
      reference.externalReference === subscription.providerSubscriptionReference?.externalReference)
  ) {
    throw new Error("Commercial subscription reference must also be present in providerReferences.");
  }
  return Object.freeze({
    ...current,
    planKey: commercialPlanKey(input.planKey),
    subscription,
    entitlementKeys: Object.freeze([...new Set(input.entitlementKeys.map(commercialEntitlementKey))]),
    providerReferences,
    updatedAt,
  });
}
