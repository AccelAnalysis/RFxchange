import { createHmac, timingSafeEqual } from "node:crypto";

import {
  PROVIDER_SUBSCRIPTION_STATUSES,
  assertFoundingSubscriptionCorrelation,
  subscriptionRetainsCapacity,
  type ProviderSubscriptionSnapshot,
  type ProviderSubscriptionStatus,
} from "../application/market-ready-founding-commerce-reconcile.js";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
export const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300 as const;

interface StripePrice { readonly id?: unknown; }
interface StripeSubscriptionItem { readonly quantity?: unknown; readonly price?: StripePrice | null; }
interface StripeSubscription {
  readonly id?: unknown;
  readonly customer?: unknown;
  readonly status?: unknown;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly items?: Readonly<{ readonly data?: readonly StripeSubscriptionItem[] }>;
  readonly current_period_end?: unknown;
  readonly cancel_at_period_end?: unknown;
}
interface StripeList<T> { readonly data?: readonly T[]; }

export interface VerifiedStripeEvent {
  readonly id: string;
  readonly type: string;
  readonly createdAt: string;
  readonly livemode: boolean;
  readonly object: Readonly<Record<string, unknown>>;
}

function required(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}

function safeEqualHex(left: string, right: string): boolean {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right) || left.length !== right.length) return false;
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function signatureParts(header: string): Readonly<{ timestamp: number; signatures: readonly string[] }> {
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t" && value && /^\d+$/.test(value)) timestamp = Number(value);
    if (key === "v1" && value) signatures.push(value);
  }
  if (!timestamp || signatures.length === 0) throw new Error("Stripe signature header is malformed.");
  return Object.freeze({ timestamp, signatures: Object.freeze(signatures) });
}

export function verifyStripeWebhookSignature(input: Readonly<{
  rawBody: Buffer;
  signatureHeader: string;
  webhookSecret: string;
  nowSeconds?: number;
}>): void {
  const secret = required(input.webhookSecret, "Stripe webhook secret");
  const { timestamp, signatures } = signatureParts(required(input.signatureHeader, "Stripe-Signature header"));
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > STRIPE_WEBHOOK_TOLERANCE_SECONDS) {
    throw new Error("Stripe webhook signature timestamp is outside the accepted tolerance.");
  }
  const signedPayload = `${timestamp}.${input.rawBody.toString("utf8")}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");
  if (!signatures.some((signature) => safeEqualHex(signature, expected))) {
    throw new Error("Stripe webhook signature verification failed.");
  }
}

export function parseVerifiedStripeEvent(input: Readonly<{
  rawBody: Buffer;
  signatureHeader: string;
  webhookSecret: string;
  expectedMode: "live" | "test";
  nowSeconds?: number;
}>): VerifiedStripeEvent {
  verifyStripeWebhookSignature(input);
  const parsed = JSON.parse(input.rawBody.toString("utf8")) as Record<string, unknown>;
  const id = required(parsed.id, "Stripe event id");
  const type = required(parsed.type, "Stripe event type");
  if (typeof parsed.created !== "number" || !Number.isFinite(parsed.created)) throw new Error("Stripe event created timestamp is invalid.");
  if (typeof parsed.livemode !== "boolean") throw new Error("Stripe event livemode is invalid.");
  if ((input.expectedMode === "live") !== parsed.livemode) throw new Error("Stripe event mode does not match the configured RFxchange Stripe mode.");
  const data = parsed.data;
  if (!data || typeof data !== "object") throw new Error("Stripe event data is missing.");
  const object = (data as Record<string, unknown>).object;
  if (!object || typeof object !== "object") throw new Error("Stripe event object is missing.");
  return Object.freeze({
    id,
    type,
    createdAt: new Date(parsed.created * 1000).toISOString(),
    livemode: parsed.livemode,
    object: Object.freeze(object as Record<string, unknown>),
  });
}

async function stripeGet<T>(secretKey: string, path: string): Promise<T> {
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${required(secretKey, "Stripe secret key")}` },
  });
  const payload = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    const message = (payload.error as { message?: unknown } | undefined)?.message;
    throw new Error(typeof message === "string" ? message : "Stripe request failed.");
  }
  return payload as T;
}

function providerStatus(value: unknown): ProviderSubscriptionStatus {
  const status = required(value, "Stripe subscription status");
  if (!(PROVIDER_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)) throw new Error(`Unsupported Stripe subscription status: ${status}.`);
  return status as ProviderSubscriptionStatus;
}

function subscriptionSnapshot(value: StripeSubscription, expectedPriceIdValue: string): ProviderSubscriptionSnapshot {
  const expectedPriceId = required(expectedPriceIdValue, "Expected Founding Price id");
  const items = value.items?.data ?? [];
  if (items.length !== 1) throw new Error("Founding subscription must contain exactly one line item.");
  const item = items[0]!;
  const customerId = typeof value.customer === "string"
    ? value.customer
    : required((value.customer as { id?: unknown } | null)?.id, "Stripe subscription Customer");
  const organizationId = required(value.metadata?.organizationId, "Stripe organization metadata");
  if (value.metadata?.rfxchangePlan !== "founding") throw new Error("Stripe subscription plan metadata does not identify Founding Membership.");
  const priceId = required(item.price?.id, "Stripe subscription Price");
  const quantity = Number(item.quantity);
  const currentPeriodEndsAt = typeof value.current_period_end === "number" && Number.isFinite(value.current_period_end)
    ? new Date(value.current_period_end * 1000).toISOString()
    : null;
  const snapshot = Object.freeze({
    id: required(value.id, "Stripe subscription id"),
    customerId,
    organizationId,
    status: providerStatus(value.status),
    priceId,
    quantity,
    currentPeriodEndsAt,
    cancelAtPeriodEnd: value.cancel_at_period_end === true,
  });
  assertFoundingSubscriptionCorrelation({ snapshot, organizationId, customerId, expectedPriceId });
  return snapshot;
}

export async function retrieveCurrentFoundingSubscription(
  secretKey: string,
  subscriptionId: string,
  expectedPriceId: string,
): Promise<ProviderSubscriptionSnapshot> {
  const encoded = encodeURIComponent(required(subscriptionId, "Stripe subscription id"));
  return subscriptionSnapshot(
    await stripeGet<StripeSubscription>(secretKey, `/subscriptions/${encoded}`),
    expectedPriceId,
  );
}

function belongsToFoundingOrganization(value: StripeSubscription, organizationId: string): boolean {
  return value.metadata?.rfxchangePlan === "founding" && value.metadata?.organizationId === organizationId;
}

export async function providerHasNonTerminalFoundingSubscription(input: Readonly<{
  secretKey: string;
  customerId: string;
  organizationId: string;
  expectedPriceId: string;
}>): Promise<boolean> {
  const customerId = required(input.customerId, "Stripe Customer id");
  const organizationId = required(input.organizationId, "RFxchange organization id");
  const expectedPriceId = required(input.expectedPriceId, "Expected Founding Price id");
  const query = new URLSearchParams({ customer: customerId, status: "all", limit: "100" });
  const result = await stripeGet<StripeList<StripeSubscription>>(input.secretKey, `/subscriptions?${query.toString()}`);
  const exact = (result.data ?? [])
    .filter((value) => belongsToFoundingOrganization(value, organizationId))
    .map((value) => subscriptionSnapshot(value, expectedPriceId))
    .filter((snapshot) => snapshot.customerId === customerId);
  const nonTerminal = exact.filter((snapshot) => subscriptionRetainsCapacity(snapshot.status));
  if (nonTerminal.length > 1) throw new Error("Multiple non-terminal Founding subscriptions exist for one RFxchange organization.");
  return nonTerminal.length === 1;
}

export function stripeObjectReference(object: Readonly<Record<string, unknown>>, field: string): string | null {
  const value = object[field];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    const id = (value as Record<string, unknown>).id;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  return null;
}

export function stripeObjectOrganizationId(object: Readonly<Record<string, unknown>>): string {
  const metadata = object.metadata;
  if (!metadata || typeof metadata !== "object") throw new Error("Stripe object organization metadata is missing.");
  return required((metadata as Record<string, unknown>).organizationId, "Stripe organization metadata");
}