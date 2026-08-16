import {
  createPaymentProviderReference,
  paymentProviderKey,
  type PaymentProviderReference,
} from "../../domain/commercial/model.ts";
import type {
  PaymentProvider,
  PaymentProviderCheckoutRequest,
  PaymentProviderCheckoutResult,
  PaymentProviderCustomerRequest,
  PaymentProviderCustomerResult,
  PaymentProviderPortalRequest,
  PaymentProviderPortalResult,
} from "../../domain/commercial/payment-provider.ts";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
export const RFXCHANGE_FOUNDING_LIVE_PRICE_ID = "price_1U44szPNrfGaFz2qxcWEKKRl";
export const RFXCHANGE_FOUNDING_PRICE_CENTS = 4_900;
export const RFXCHANGE_FOUNDING_CURRENCY = "usd";
export const RFXCHANGE_FOUNDING_INTERVAL = "month";
export const RFXCHANGE_FOUNDING_CAP = 250;
export const RFXCHANGE_FOUNDING_AMBIGUOUS_RECONCILE_AFTER_MS = 45 * 60 * 1000;
export const RFXCHANGE_FOUNDING_CHECKOUT_SESSION_LIFETIME_SECONDS = 35 * 60;
const PROVIDER_KEY = paymentProviderKey("stripe");
const GOVERNED_STRIPE_SUBSCRIPTION_STATUSES = Object.freeze([
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
  "canceled",
  "incomplete_expired",
] as const);
const TERMINAL_STRIPE_SUBSCRIPTION_STATUSES = new Set<string>(["canceled", "incomplete_expired"]);

type StripeMode = "live" | "test";
interface StripeRuntimeConfiguration { readonly mode: StripeMode; readonly secretKey: string; readonly priceId: string; }
interface StripeCustomer { readonly id: string; readonly deleted?: boolean; readonly metadata?: Readonly<Record<string, string>>; }
interface StripeCheckoutSession {
  readonly id: string;
  readonly url: string | null;
  readonly customer: string | null;
  readonly status?: string | null;
  readonly subscription?: string | null;
  readonly metadata?: Readonly<Record<string, string>>;
}
interface StripePortalSession { readonly id: string; readonly url: string; }
interface StripeSubscriptionItem { readonly quantity?: number | null; readonly price?: Readonly<{ readonly id?: string | null }> | null; }
interface StripeSubscription {
  readonly id: string;
  readonly customer?: string | null;
  readonly status: string;
  readonly metadata?: Readonly<Record<string, string>>;
  readonly items?: Readonly<{ readonly data?: readonly StripeSubscriptionItem[] }>;
}
interface StripeList<T> { readonly data: readonly T[]; readonly has_more?: boolean; }

/**
 * The Checkout POST may have reached Stripe even when RFxchange cannot observe its result.
 * Callers must retain the Founding capacity reservation for these outcomes until Stripe expiry or
 * later provider truth resolves it; releasing the slot here could oversubscribe the 250-org cap.
 */
export class StripeCheckoutOutcomeUnknownError extends Error {
  constructor(message = "Stripe Checkout outcome is unknown.") {
    super(message);
    this.name = "StripeCheckoutOutcomeUnknownError";
  }
}

function required(value: string | undefined, label: string): string {
  const normalized = value?.trim() ?? "";
  if (!normalized) throw new Error(`${label} is not configured.`);
  return normalized;
}

function configuration(): StripeRuntimeConfiguration {
  const mode = required(process.env.RFXCHANGE_STRIPE_MODE, "RFXCHANGE_STRIPE_MODE");
  if (mode !== "live" && mode !== "test") throw new Error("RFXCHANGE_STRIPE_MODE must be either live or test.");
  const secretKey = required(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY");
  const configuredPrice = mode === "live"
    ? required(process.env.RFXCHANGE_FOUNDING_STRIPE_PRICE_ID, "RFXCHANGE_FOUNDING_STRIPE_PRICE_ID")
    : required(process.env.RFXCHANGE_FOUNDING_STRIPE_TEST_PRICE_ID, "RFXCHANGE_FOUNDING_STRIPE_TEST_PRICE_ID");
  if (mode === "live" && configuredPrice !== RFXCHANGE_FOUNDING_LIVE_PRICE_ID) {
    throw new Error("Configured live Founding Price does not match the approved RFxchange catalog Price.");
  }
  return Object.freeze({ mode, secretKey, priceId: configuredPrice });
}

export function assertFoundingStripeConfiguration(): Readonly<{ mode: StripeMode; priceId: string }> {
  const config = configuration();
  return Object.freeze({ mode: config.mode, priceId: config.priceId });
}

function formBody(entries: Readonly<Record<string, string | number | boolean>>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) params.set(key, String(value));
  return params;
}

async function stripeRequest<T>(path: string, input: Readonly<{
  method?: "GET" | "POST";
  body?: URLSearchParams;
  idempotencyKey?: string;
  checkoutPost?: boolean;
}> = {}): Promise<T> {
  const config = configuration();
  const method = input.method ?? "GET";
  const headers: Record<string, string> = { Authorization: `Bearer ${config.secretKey}` };
  if (input.idempotencyKey) headers["Idempotency-Key"] = input.idempotencyKey;
  if (method === "POST") headers["Content-Type"] = "application/x-www-form-urlencoded";

  let response: Response;
  try {
    response = await fetch(`${STRIPE_API_BASE}${path}`, {
      method,
      headers,
      body: method === "POST" ? input.body : undefined,
      cache: "no-store",
    });
  } catch {
    if (input.checkoutPost) throw new StripeCheckoutOutcomeUnknownError();
    throw new Error("Stripe request failed before RFxchange received a provider response.");
  }

  let payload: Record<string, unknown>;
  try {
    payload = await response.json() as Record<string, unknown>;
  } catch {
    if (input.checkoutPost && response.ok) {
      throw new StripeCheckoutOutcomeUnknownError("Stripe Checkout returned an unreadable successful response.");
    }
    payload = {};
  }

  if (!response.ok) {
    if (input.checkoutPost && response.status >= 500) {
      throw new StripeCheckoutOutcomeUnknownError("Stripe Checkout returned an indeterminate server response.");
    }
    const error = payload.error as { message?: unknown } | undefined;
    throw new Error(typeof error?.message === "string" ? error.message : "Stripe request failed.");
  }
  return payload as T;
}

function providerReference(kind: Parameters<typeof createPaymentProviderReference>[0]["kind"], value: string): PaymentProviderReference {
  return createPaymentProviderReference({ providerKey: PROVIDER_KEY, kind, externalReference: value });
}
function stripeSearchLiteral(value: string): string { return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'"); }

async function findCorrelatedCustomer(organizationId: string): Promise<StripeCustomer | null> {
  const query = `metadata['organizationId']:'${stripeSearchLiteral(organizationId)}' AND metadata['rfxchangePlan']:'founding'`;
  const params = new URLSearchParams({ query, limit: "10" });
  const result = await stripeRequest<StripeList<StripeCustomer>>(`/customers/search?${params.toString()}`);
  const exact = result.data.filter((customer) => customer.deleted !== true && customer.metadata?.organizationId === organizationId && customer.metadata?.rfxchangePlan === "founding");
  if (exact.length > 1) throw new Error("Multiple Stripe Customers are correlated to the same RFxchange organization; checkout fails closed.");
  return exact[0] ?? null;
}

function subscriptionItems(subscription: StripeSubscription): readonly StripeSubscriptionItem[] {
  return subscription.items?.data ?? [];
}

function isGovernedStripeSubscriptionStatus(status: string): boolean {
  return GOVERNED_STRIPE_SUBSCRIPTION_STATUSES.includes(status as (typeof GOVERNED_STRIPE_SUBSCRIPTION_STATUSES)[number]);
}

function isTerminalStripeSubscriptionStatus(status: string): boolean {
  return TERMINAL_STRIPE_SUBSCRIPTION_STATUSES.has(status);
}

function strictStripeListPage<T>(value: Record<string, unknown>, label: string): Readonly<{ data: readonly T[]; hasMore: boolean }> {
  if (!Array.isArray(value.data)) throw new Error(`${label} list payload is malformed; provider inspection fails closed.`);
  if (typeof value.has_more !== "boolean") throw new Error(`${label} pagination state is malformed; provider inspection fails closed.`);
  return Object.freeze({ data: Object.freeze(value.data as T[]), hasMore: value.has_more });
}

async function listAllCustomerSubscriptions(customerReference: string): Promise<readonly StripeSubscription[]> {
  const subscriptions: StripeSubscription[] = [];
  let startingAfter: string | null = null;
  do {
    const query = new URLSearchParams({ customer: customerReference, status: "all", limit: "100" });
    if (startingAfter) query.set("starting_after", startingAfter);
    const rawPage = await stripeRequest<Record<string, unknown>>(`/subscriptions?${query.toString()}`);
    const page = strictStripeListPage<StripeSubscription>(rawPage, "Stripe subscription");
    subscriptions.push(...page.data);
    if (!page.hasMore) break;
    const last = page.data.at(-1);
    if (!last?.id) throw new Error("Stripe subscription pagination is malformed; provider inspection fails closed.");
    startingAfter = last.id;
  } while (true);
  return Object.freeze(subscriptions);
}

async function hasCorrelatedNonTerminalFoundingSubscription(customerReference: string, organizationId: string): Promise<boolean> {
  const subscriptions = await listAllCustomerSubscriptions(customerReference);
  const config = configuration();
  let correlatedCount = 0;

  for (const subscription of subscriptions) {
    if (isTerminalStripeSubscriptionStatus(subscription.status)) continue;
    const items = subscriptionItems(subscription);
    const usesApprovedFoundingPrice = items.some((item) => item.price?.id === config.priceId);
    const correlated = subscription.metadata?.organizationId === organizationId && subscription.metadata?.rfxchangePlan === "founding";

    if (correlated) {
      if (items.length !== 1 || items[0]?.price?.id !== config.priceId || Number(items[0]?.quantity) !== 1) {
        throw new Error("Existing correlated Founding subscription does not match the approved Price and quantity; checkout fails closed.");
      }
      correlatedCount += 1;
      continue;
    }

    if (usesApprovedFoundingPrice) {
      throw new Error("A non-terminal subscription uses the approved Founding Price without exact organization correlation; checkout fails closed.");
    }
  }

  if (correlatedCount > 1) throw new Error("Multiple non-terminal Founding subscriptions exist for one RFxchange organization; checkout fails closed.");
  return correlatedCount === 1;
}

async function inspectCompletedCheckoutSubscription(input: Readonly<{
  subscriptionId: string;
  customerId: string;
  organizationId: string;
  reservationId: string;
}>): Promise<Readonly<{ id: string; status: string; terminal: boolean }>> {
  const subscriptionId = required(input.subscriptionId, "Completed Checkout subscription id");
  const subscription = await stripeRequest<StripeSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
  if (subscription.id !== subscriptionId) {
    throw new Error("Completed Checkout subscription identity is inconsistent; reservation reconciliation fails closed.");
  }
  if (subscription.customer !== input.customerId) {
    throw new Error("Completed Checkout subscription Customer does not match the exact reservation; reconciliation fails closed.");
  }
  if (
    subscription.metadata?.organizationId !== input.organizationId ||
    subscription.metadata?.rfxchangePlan !== "founding" ||
    subscription.metadata?.rfxchangeReservationId !== input.reservationId
  ) {
    throw new Error("Completed Checkout subscription metadata does not match the exact Founding reservation; reconciliation fails closed.");
  }
  if (!isGovernedStripeSubscriptionStatus(subscription.status)) {
    throw new Error("Completed Checkout subscription lifecycle state is not recognized; reconciliation fails closed.");
  }
  const config = configuration();
  const items = subscriptionItems(subscription);
  if (items.length !== 1 || items[0]?.price?.id !== config.priceId || Number(items[0]?.quantity) !== 1) {
    throw new Error("Completed Checkout subscription does not match the approved Founding Price and quantity; reconciliation fails closed.");
  }
  return Object.freeze({
    id: subscription.id,
    status: subscription.status,
    terminal: isTerminalStripeSubscriptionStatus(subscription.status),
  });
}

async function assertNoProviderSubscription(customerReference: string, organizationId: string): Promise<void> {
  if (await hasCorrelatedNonTerminalFoundingSubscription(customerReference, organizationId)) {
    throw new Error("This organization already has a non-terminal Founding subscription at the payment provider.");
  }
}

export async function inspectAmbiguousFoundingReservation(input: Readonly<{
  customerId: string;
  organizationId: string;
  reservationId: string;
  reservedAt: string;
  now?: string;
}>): Promise<Readonly<{
  eligibleForReconciliation: boolean;
  reclaimable: boolean;
  hasNonTerminalSubscription: boolean;
  matchingCheckoutSessionId: string | null;
  matchingCheckoutStatus: string | null;
  matchingSubscriptionId: string | null;
  matchingSubscriptionStatus: string | null;
}>> {
  const customerId = required(input.customerId, "Stripe Customer id");
  const organizationId = required(input.organizationId, "RFxchange organization id");
  const reservationId = required(input.reservationId, "Founding reservation id");
  const reservedAt = Date.parse(required(input.reservedAt, "Founding reservation timestamp"));
  const now = input.now ? Date.parse(required(input.now, "Reconciliation time")) : Date.now();
  if (!Number.isFinite(reservedAt) || !Number.isFinite(now)) throw new Error("Founding reservation reconciliation timestamp is invalid.");
  if (now - reservedAt < RFXCHANGE_FOUNDING_AMBIGUOUS_RECONCILE_AFTER_MS) {
    return Object.freeze({ eligibleForReconciliation: false, reclaimable: false, hasNonTerminalSubscription: false, matchingCheckoutSessionId: null, matchingCheckoutStatus: null, matchingSubscriptionId: null, matchingSubscriptionStatus: null });
  }

  const hasNonTerminalSubscription = await hasCorrelatedNonTerminalFoundingSubscription(customerId, organizationId);
  if (hasNonTerminalSubscription) {
    return Object.freeze({ eligibleForReconciliation: true, reclaimable: false, hasNonTerminalSubscription: true, matchingCheckoutSessionId: null, matchingCheckoutStatus: null, matchingSubscriptionId: null, matchingSubscriptionStatus: null });
  }

  const exactSessions: StripeCheckoutSession[] = [];
  let startingAfter: string | null = null;
  do {
    const params = new URLSearchParams({
      customer: customerId,
      "created[gte]": String(Math.max(0, Math.floor(reservedAt / 1000) - 60)),
      limit: "100",
    });
    if (startingAfter) params.set("starting_after", startingAfter);
    const rawPage = await stripeRequest<Record<string, unknown>>(`/checkout/sessions?${params.toString()}`);
    const page = strictStripeListPage<StripeCheckoutSession>(rawPage, "Stripe Checkout Session");
    for (const session of page.data) {
      if (
        session.customer === customerId &&
        session.metadata?.organizationId === organizationId &&
        session.metadata?.rfxchangePlan === "founding" &&
        session.metadata?.rfxchangeReservationId === reservationId
      ) exactSessions.push(session);
    }
    if (!page.hasMore) break;
    const last = page.data.at(-1);
    if (!last?.id) throw new Error("Stripe Checkout pagination is malformed; provider inspection fails closed.");
    startingAfter = last.id;
  } while (true);

  if (exactSessions.length > 1) throw new Error("Multiple Stripe Checkout Sessions are correlated to one Founding reservation; reconciliation fails closed.");
  const exact = exactSessions[0] ?? null;
  if (!exact) {
    return Object.freeze({ eligibleForReconciliation: true, reclaimable: true, hasNonTerminalSubscription: false, matchingCheckoutSessionId: null, matchingCheckoutStatus: null, matchingSubscriptionId: null, matchingSubscriptionStatus: null });
  }
  const status = exact.status ?? null;
  if (status !== "open" && status !== "complete" && status !== "expired") {
    throw new Error("Stripe Checkout Session lifecycle state is malformed; reservation reconciliation fails closed.");
  }

  let reclaimable = status === "expired";
  let matchingSubscriptionId: string | null = null;
  let matchingSubscriptionStatus: string | null = null;
  if (status === "complete") {
    if (!exact.subscription) {
      throw new Error("Completed Stripe Checkout Session is missing its subscription identity; reconciliation fails closed.");
    }
    const subscription = await inspectCompletedCheckoutSubscription({
      subscriptionId: exact.subscription,
      customerId,
      organizationId,
      reservationId,
    });
    matchingSubscriptionId = subscription.id;
    matchingSubscriptionStatus = subscription.status;
    reclaimable = subscription.terminal;
  }

  return Object.freeze({
    eligibleForReconciliation: true,
    reclaimable,
    hasNonTerminalSubscription: false,
    matchingCheckoutSessionId: exact.id,
    matchingCheckoutStatus: status,
    matchingSubscriptionId,
    matchingSubscriptionStatus,
  });
}

export class StripePaymentProvider implements PaymentProvider {
  async ensureCustomer(request: PaymentProviderCustomerRequest): Promise<PaymentProviderCustomerResult> {
    const organizationId = String(request.organizationId);
    const recovered = await findCorrelatedCustomer(organizationId);
    const customer = recovered ?? await stripeRequest<StripeCustomer>("/customers", {
      method: "POST",
      idempotencyKey: `founding-customer:${organizationId}`,
      body: formBody({ email: request.billingEmail, "metadata[organizationId]": organizationId, "metadata[rfxchangePlan]": "founding" }),
    });
    if (customer.metadata && (customer.metadata.organizationId !== organizationId || customer.metadata.rfxchangePlan !== "founding")) {
      throw new Error("Stripe Customer metadata does not match the RFxchange organization.");
    }
    return Object.freeze({ providerKey: PROVIDER_KEY, customerReference: providerReference("customer", customer.id) });
  }

  async beginSubscriptionCheckout(request: PaymentProviderCheckoutRequest): Promise<PaymentProviderCheckoutResult> {
    if (String(request.planKey) !== "founding") throw new Error("Only the approved Founding plan can enter Founding checkout.");
    if (!request.customerReference || request.customerReference.kind !== "customer") throw new Error("Founding checkout requires an existing provider customer reference.");
    if (request.customerReference.providerKey !== PROVIDER_KEY) throw new Error("Founding checkout customer belongs to a different payment provider.");
    const customerId = String(request.customerReference.externalReference);
    const organizationId = String(request.organizationId);
    const checkoutCorrelationId = required(request.checkoutCorrelationId, "Checkout correlation id");
    await assertNoProviderSubscription(customerId, organizationId);
    const config = configuration();
    const checkout = await stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
      method: "POST",
      checkoutPost: true,
      idempotencyKey: request.idempotencyKey,
      body: formBody({
        mode: "subscription",
        customer: customerId,
        "line_items[0][price]": config.priceId,
        "line_items[0][quantity]": 1,
        success_url: request.successUrl,
        cancel_url: request.cancelUrl,
        client_reference_id: organizationId,
        expires_at: Math.floor(Date.now() / 1000) + RFXCHANGE_FOUNDING_CHECKOUT_SESSION_LIFETIME_SECONDS,
        "metadata[organizationId]": organizationId,
        "metadata[rfxchangePlan]": "founding",
        "metadata[rfxchangeReservationId]": checkoutCorrelationId,
        "subscription_data[metadata][organizationId]": organizationId,
        "subscription_data[metadata][rfxchangePlan]": "founding",
        "subscription_data[metadata][rfxchangeReservationId]": checkoutCorrelationId,
      }),
    });
    if (!checkout.url) throw new StripeCheckoutOutcomeUnknownError("Stripe created a Checkout Session without a usable redirect URL.");
    if (checkout.customer && checkout.customer !== customerId) throw new StripeCheckoutOutcomeUnknownError("Stripe created a Checkout Session for a different Customer.");
    return Object.freeze({ providerKey: PROVIDER_KEY, checkoutReference: providerReference("checkout-session", checkout.id), customerReference: request.customerReference, redirectUrl: checkout.url });
  }

  async createCustomerPortalSession(request: PaymentProviderPortalRequest): Promise<PaymentProviderPortalResult> {
    if (request.customerReference.providerKey !== PROVIDER_KEY || request.customerReference.kind !== "customer") throw new Error("Customer portal requires a Stripe customer reference.");
    const portal = await stripeRequest<StripePortalSession>("/billing_portal/sessions", {
      method: "POST",
      idempotencyKey: request.idempotencyKey,
      body: formBody({ customer: String(request.customerReference.externalReference), return_url: request.returnUrl }),
    });
    return Object.freeze({ providerKey: PROVIDER_KEY, portalReference: providerReference("customer-portal-session", portal.id), redirectUrl: portal.url });
  }
}