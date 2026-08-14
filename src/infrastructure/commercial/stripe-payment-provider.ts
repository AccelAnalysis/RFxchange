import {
  createPaymentProviderReference,
  paymentProviderKey,
  type PaymentProviderReference,
} from "../../domain/commercial/model";
import type {
  PaymentProvider,
  PaymentProviderCheckoutRequest,
  PaymentProviderCheckoutResult,
  PaymentProviderCustomerRequest,
  PaymentProviderCustomerResult,
  PaymentProviderPortalRequest,
  PaymentProviderPortalResult,
} from "../../domain/commercial/payment-provider";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
export const RFXCHANGE_FOUNDING_LIVE_PRICE_ID = "price_1U44szPNrfGaFz2qxcWEKKRl";
export const RFXCHANGE_FOUNDING_PRICE_CENTS = 4_900;
export const RFXCHANGE_FOUNDING_CURRENCY = "usd";
export const RFXCHANGE_FOUNDING_INTERVAL = "month";
export const RFXCHANGE_FOUNDING_CAP = 250;
const PROVIDER_KEY = paymentProviderKey("stripe");

type StripeMode = "live" | "test";
interface StripeRuntimeConfiguration { readonly mode: StripeMode; readonly secretKey: string; readonly priceId: string; }
interface StripeCustomer { readonly id: string; readonly deleted?: boolean; readonly metadata?: Readonly<Record<string, string>>; }
interface StripeCheckoutSession { readonly id: string; readonly url: string | null; readonly customer: string | null; }
interface StripePortalSession { readonly id: string; readonly url: string; }
interface StripeSubscriptionItem { readonly quantity?: number | null; readonly price?: Readonly<{ readonly id?: string | null }> | null; }
interface StripeSubscription {
  readonly id: string;
  readonly status: string;
  readonly metadata?: Readonly<Record<string, string>>;
  readonly items?: Readonly<{ readonly data?: readonly StripeSubscriptionItem[] }>;
}
interface StripeList<T> { readonly data: readonly T[]; }

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

async function stripeRequest<T>(path: string, input: Readonly<{ method?: "GET" | "POST"; body?: URLSearchParams; idempotencyKey?: string; }> = {}): Promise<T> {
  const config = configuration();
  const method = input.method ?? "GET";
  const headers: Record<string, string> = { Authorization: `Bearer ${config.secretKey}` };
  if (input.idempotencyKey) headers["Idempotency-Key"] = input.idempotencyKey;
  if (method === "POST") headers["Content-Type"] = "application/x-www-form-urlencoded";
  const response = await fetch(`${STRIPE_API_BASE}${path}`, { method, headers, body: method === "POST" ? input.body : undefined, cache: "no-store" });
  const payload = await response.json() as Record<string, unknown>;
  if (!response.ok) {
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

async function assertNoProviderSubscription(customerReference: string, organizationId: string): Promise<void> {
  const query = new URLSearchParams({ customer: customerReference, status: "all", limit: "100" });
  const subscriptions = await stripeRequest<StripeList<StripeSubscription>>(`/subscriptions?${query.toString()}`);
  const config = configuration();

  for (const subscription of subscriptions.data) {
    if (["canceled", "incomplete_expired"].includes(subscription.status)) continue;
    const items = subscriptionItems(subscription);
    const usesApprovedFoundingPrice = items.some((item) => item.price?.id === config.priceId);
    const correlated = subscription.metadata?.organizationId === organizationId && subscription.metadata?.rfxchangePlan === "founding";

    if (correlated) {
      if (items.length !== 1 || items[0]?.price?.id !== config.priceId || Number(items[0]?.quantity) !== 1) {
        throw new Error("Existing correlated Founding subscription does not match the approved Price and quantity; checkout fails closed.");
      }
      throw new Error("This organization already has a non-terminal Founding subscription at the payment provider.");
    }

    if (usesApprovedFoundingPrice) {
      throw new Error("A non-terminal subscription uses the approved Founding Price without exact organization correlation; checkout fails closed.");
    }
  }
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
    await assertNoProviderSubscription(customerId, organizationId);
    const config = configuration();
    const checkout = await stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
      method: "POST",
      idempotencyKey: request.idempotencyKey,
      body: formBody({
        mode: "subscription",
        customer: customerId,
        "line_items[0][price]": config.priceId,
        "line_items[0][quantity]": 1,
        success_url: request.successUrl,
        cancel_url: request.cancelUrl,
        client_reference_id: organizationId,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        "metadata[organizationId]": organizationId,
        "metadata[rfxchangePlan]": "founding",
        "subscription_data[metadata][organizationId]": organizationId,
        "subscription_data[metadata][rfxchangePlan]": "founding",
      }),
    });
    if (!checkout.url) throw new Error("Stripe did not return a Checkout URL.");
    if (checkout.customer && checkout.customer !== customerId) throw new Error("Stripe Checkout returned a different customer than RFxchange requested.");
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