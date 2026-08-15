import assert from "node:assert/strict";
import test from "node:test";

import {
  inspectAmbiguousFoundingReservation,
  RFXCHANGE_FOUNDING_AMBIGUOUS_RECONCILE_AFTER_MS,
  RFXCHANGE_FOUNDING_CHECKOUT_SESSION_LIFETIME_SECONDS,
  StripePaymentProvider,
} from "../src/infrastructure/commercial/stripe-payment-provider.ts";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_ENV = {
  mode: process.env.RFXCHANGE_STRIPE_MODE,
  secret: process.env.STRIPE_SECRET_KEY,
  livePrice: process.env.RFXCHANGE_FOUNDING_STRIPE_PRICE_ID,
  testPrice: process.env.RFXCHANGE_FOUNDING_STRIPE_TEST_PRICE_ID,
};
const TEST_PRICE = "price_test_founding";
const RESERVED_AT = "2026-08-15T00:00:00.000Z";

function configureTestStripe() {
  process.env.RFXCHANGE_STRIPE_MODE = "test";
  process.env.STRIPE_SECRET_KEY = "sk_test_local_only";
  process.env.RFXCHANGE_FOUNDING_STRIPE_TEST_PRICE_ID = TEST_PRICE;
}

function restore() {
  globalThis.fetch = ORIGINAL_FETCH;
  for (const [key, value] of [
    ["RFXCHANGE_STRIPE_MODE", ORIGINAL_ENV.mode],
    ["STRIPE_SECRET_KEY", ORIGINAL_ENV.secret],
    ["RFXCHANGE_FOUNDING_STRIPE_PRICE_ID", ORIGINAL_ENV.livePrice],
    ["RFXCHANGE_FOUNDING_STRIPE_TEST_PRICE_ID", ORIGINAL_ENV.testPrice],
  ]) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}

function ok(payload) {
  return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
}

function exactCheckoutSession({ id, status, subscription = null }) {
  return {
    id,
    url: status === "expired" ? null : "https://checkout.stripe.test/session",
    customer: "cus_founding",
    status,
    subscription,
    metadata: {
      organizationId: "org-founding",
      rfxchangePlan: "founding",
      rfxchangeReservationId: "reservation-123",
    },
  };
}

function exactSubscription({ id, status }) {
  return {
    id,
    customer: "cus_founding",
    status,
    metadata: {
      organizationId: "org-founding",
      rfxchangePlan: "founding",
      rfxchangeReservationId: "reservation-123",
    },
    items: { data: [{ quantity: 1, price: { id: TEST_PRICE } }] },
  };
}

const baseInput = {
  customerId: "cus_founding",
  organizationId: "org-founding",
  reservationId: "reservation-123",
  reservedAt: RESERVED_AT,
};

const afterLease = new Date(
  Date.parse(RESERVED_AT) + RFXCHANGE_FOUNDING_AMBIGUOUS_RECONCILE_AFTER_MS + 1,
).toISOString();

test.afterEach(restore);

test("ambiguous reservation remains held before the conservative reconciliation lease", async () => {
  configureTestStripe();
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error("provider should not be queried before lease"); };
  const result = await inspectAmbiguousFoundingReservation({
    ...baseInput,
    now: new Date(Date.parse(RESERVED_AT) + RFXCHANGE_FOUNDING_AMBIGUOUS_RECONCILE_AFTER_MS - 1).toISOString(),
  });
  assert.equal(result.eligibleForReconciliation, false);
  assert.equal(result.reclaimable, false);
  assert.equal(result.matchingCheckoutSessionId, null);
  assert.equal(result.matchingSubscriptionId, null);
  assert.equal(calls, 0);
});

test("stale ambiguous reservation is reclaimable only after provider truth shows no subscription or matching Session", async () => {
  configureTestStripe();
  const requests = [];
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    if (String(url).includes("/subscriptions?")) return ok({ data: [], has_more: false });
    if (String(url).includes("/checkout/sessions?")) return ok({ data: [], has_more: false });
    throw new Error(`unexpected Stripe request: ${url}`);
  };
  const result = await inspectAmbiguousFoundingReservation({ ...baseInput, now: afterLease });
  assert.equal(result.eligibleForReconciliation, true);
  assert.equal(result.hasNonTerminalSubscription, false);
  assert.equal(result.matchingCheckoutSessionId, null);
  assert.equal(result.matchingCheckoutStatus, null);
  assert.equal(result.matchingSubscriptionId, null);
  assert.equal(result.matchingSubscriptionStatus, null);
  assert.equal(result.reclaimable, true);
  assert.equal(requests.some((url) => url.includes("/subscriptions?")), true);
  assert.equal(requests.some((url) => url.includes("/checkout/sessions?")), true);
});

test("provider-authoritative non-terminal subscription prevents reclamation", async () => {
  configureTestStripe();
  globalThis.fetch = async (url) => {
    if (String(url).includes("/subscriptions?")) return ok({
      has_more: false,
      data: [{
        id: "sub_founding",
        status: "active",
        metadata: { organizationId: "org-founding", rfxchangePlan: "founding" },
        items: { data: [{ quantity: 1, price: { id: TEST_PRICE } }] },
      }],
    });
    throw new Error("Checkout Session lookup must not run when subscription truth already retains capacity");
  };
  const result = await inspectAmbiguousFoundingReservation({ ...baseInput, now: afterLease });
  assert.equal(result.hasNonTerminalSubscription, true);
  assert.equal(result.matchingCheckoutSessionId, null);
  assert.equal(result.matchingSubscriptionId, null);
  assert.equal(result.reclaimable, false);
});

test("subscription inspection paginates before deciding an ambiguous reservation is reclaimable", async () => {
  configureTestStripe();
  const subscriptionRequests = [];
  const firstPage = Array.from({ length: 100 }, (_, index) => ({
    id: `sub_history_${String(index + 1).padStart(3, "0")}`,
    status: "canceled",
  }));
  globalThis.fetch = async (url) => {
    const requestUrl = new URL(String(url));
    if (requestUrl.pathname.endsWith("/subscriptions")) {
      subscriptionRequests.push(requestUrl);
      if (!requestUrl.searchParams.has("starting_after")) return ok({ data: firstPage, has_more: true });
      assert.equal(requestUrl.searchParams.get("starting_after"), "sub_history_100");
      return ok({
        has_more: false,
        data: [{
          id: "sub_founding_later_page",
          status: "active",
          metadata: { organizationId: "org-founding", rfxchangePlan: "founding" },
          items: { data: [{ quantity: 1, price: { id: TEST_PRICE } }] },
        }],
      });
    }
    throw new Error("Checkout Session lookup must not run when a later subscription page retains capacity");
  };
  const result = await inspectAmbiguousFoundingReservation({ ...baseInput, now: afterLease });
  assert.equal(subscriptionRequests.length, 2);
  assert.equal(result.hasNonTerminalSubscription, true);
  assert.equal(result.reclaimable, false);
});

test("malformed application subscription pagination fails closed", async () => {
  configureTestStripe();
  for (const payload of [
    { has_more: false },
    { data: [], has_more: "yes" },
  ]) {
    globalThis.fetch = async (url) => {
      if (String(url).includes("/subscriptions?")) return ok(payload);
      throw new Error("Checkout Session lookup must not run after malformed subscription provider truth");
    };
    await assert.rejects(
      inspectAmbiguousFoundingReservation({ ...baseInput, now: afterLease }),
      /list payload is malformed|pagination state is malformed/,
    );
  }
});

test("expired matching Checkout Session returns exact identity and remains reclaimable", async () => {
  configureTestStripe();
  globalThis.fetch = async (url) => {
    if (String(url).includes("/subscriptions?")) return ok({ data: [], has_more: false });
    if (String(url).includes("/checkout/sessions?")) return ok({
      has_more: false,
      data: [exactCheckoutSession({ id: "cs_expired", status: "expired" })],
    });
    throw new Error(`unexpected Stripe request: ${url}`);
  };
  const result = await inspectAmbiguousFoundingReservation({ ...baseInput, now: afterLease });
  assert.equal(result.matchingCheckoutSessionId, "cs_expired");
  assert.equal(result.matchingCheckoutStatus, "expired");
  assert.equal(result.matchingSubscriptionId, null);
  assert.equal(result.matchingSubscriptionStatus, null);
  assert.equal(result.reclaimable, true);
});

test("open matching Checkout Session remains held without subscription inspection", async () => {
  configureTestStripe();
  globalThis.fetch = async (url) => {
    if (String(url).includes("/subscriptions?")) return ok({ data: [], has_more: false });
    if (String(url).includes("/checkout/sessions?")) return ok({
      has_more: false,
      data: [exactCheckoutSession({ id: "cs_open", status: "open" })],
    });
    throw new Error("Open Checkout Session must not trigger direct subscription inspection");
  };
  const result = await inspectAmbiguousFoundingReservation({ ...baseInput, now: afterLease });
  assert.equal(result.matchingCheckoutSessionId, "cs_open");
  assert.equal(result.matchingCheckoutStatus, "open");
  assert.equal(result.matchingSubscriptionId, null);
  assert.equal(result.matchingSubscriptionStatus, null);
  assert.equal(result.reclaimable, false);
});

test("completed matching Checkout Session remains held when its exact subscription is non-terminal", async () => {
  configureTestStripe();
  const subscription = exactSubscription({ id: "sub_active", status: "active" });
  globalThis.fetch = async (url) => {
    if (String(url).includes("/subscriptions?")) return ok({ data: [], has_more: false });
    if (String(url).includes("/checkout/sessions?")) return ok({
      has_more: false,
      data: [exactCheckoutSession({ id: "cs_complete_active", status: "complete", subscription: subscription.id })],
    });
    if (String(url).endsWith(`/subscriptions/${subscription.id}`)) return ok(subscription);
    throw new Error(`unexpected Stripe request: ${url}`);
  };
  const result = await inspectAmbiguousFoundingReservation({ ...baseInput, now: afterLease });
  assert.equal(result.matchingCheckoutSessionId, "cs_complete_active");
  assert.equal(result.matchingCheckoutStatus, "complete");
  assert.equal(result.matchingSubscriptionId, "sub_active");
  assert.equal(result.matchingSubscriptionStatus, "active");
  assert.equal(result.reclaimable, false);
});

test("completed matching Checkout Session becomes reclaimable only when its exact subscription is provider-terminal", async () => {
  configureTestStripe();
  for (const status of ["canceled", "incomplete_expired"]) {
    const subscription = exactSubscription({ id: `sub_${status}`, status });
    globalThis.fetch = async (url) => {
      if (String(url).includes("/subscriptions?")) return ok({ data: [subscription], has_more: false });
      if (String(url).includes("/checkout/sessions?")) return ok({
        has_more: false,
        data: [exactCheckoutSession({ id: `cs_complete_${status}`, status: "complete", subscription: subscription.id })],
      });
      if (String(url).endsWith(`/subscriptions/${subscription.id}`)) return ok(subscription);
      throw new Error(`unexpected Stripe request: ${url}`);
    };
    const result = await inspectAmbiguousFoundingReservation({ ...baseInput, now: afterLease });
    assert.equal(result.matchingCheckoutSessionId, `cs_complete_${status}`);
    assert.equal(result.matchingCheckoutStatus, "complete");
    assert.equal(result.matchingSubscriptionId, subscription.id);
    assert.equal(result.matchingSubscriptionStatus, status);
    assert.equal(result.reclaimable, true);
  }
});

test("completed Checkout Session without a subscription identity fails closed", async () => {
  configureTestStripe();
  globalThis.fetch = async (url) => {
    if (String(url).includes("/subscriptions?")) return ok({ data: [], has_more: false });
    if (String(url).includes("/checkout/sessions?")) return ok({
      has_more: false,
      data: [exactCheckoutSession({ id: "cs_complete_missing", status: "complete", subscription: null })],
    });
    throw new Error(`unexpected Stripe request: ${url}`);
  };
  await assert.rejects(
    inspectAmbiguousFoundingReservation({ ...baseInput, now: afterLease }),
    /missing its subscription identity/,
  );
});

test("completed Checkout subscription mismatches and malformed authority fail closed", async () => {
  configureTestStripe();
  const valid = exactSubscription({ id: "sub_completed", status: "canceled" });
  const cases = [
    { label: "identity", payload: { ...valid, id: "sub_other" }, pattern: /identity is inconsistent/ },
    { label: "customer", payload: { ...valid, customer: "cus_other" }, pattern: /Customer does not match/ },
    { label: "organization", payload: { ...valid, metadata: { ...valid.metadata, organizationId: "org-other" } }, pattern: /metadata does not match/ },
    { label: "reservation", payload: { ...valid, metadata: { ...valid.metadata, rfxchangeReservationId: "reservation-other" } }, pattern: /metadata does not match/ },
    { label: "price", payload: { ...valid, items: { data: [{ quantity: 1, price: { id: "price_other" } }] } }, pattern: /approved Founding Price and quantity/ },
    { label: "quantity", payload: { ...valid, items: { data: [{ quantity: 2, price: { id: TEST_PRICE } }] } }, pattern: /approved Founding Price and quantity/ },
    { label: "status", payload: { ...valid, status: "unknown" }, pattern: /lifecycle state is not recognized/ },
  ];

  for (const testCase of cases) {
    globalThis.fetch = async (url) => {
      if (String(url).includes("/subscriptions?")) return ok({ data: [], has_more: false });
      if (String(url).includes("/checkout/sessions?")) return ok({
        has_more: false,
        data: [exactCheckoutSession({ id: `cs_complete_${testCase.label}`, status: "complete", subscription: valid.id })],
      });
      if (String(url).endsWith(`/subscriptions/${valid.id}`)) return ok(testCase.payload);
      throw new Error(`unexpected Stripe request: ${url}`);
    };
    await assert.rejects(
      inspectAmbiguousFoundingReservation({ ...baseInput, now: afterLease }),
      testCase.pattern,
      testCase.label,
    );
  }
});

test("provider failure remains fail-closed for stale reservation reconciliation", async () => {
  configureTestStripe();
  globalThis.fetch = async () => { throw new Error("provider unavailable"); };
  await assert.rejects(
    inspectAmbiguousFoundingReservation({ ...baseInput, now: afterLease }),
    /Stripe request failed/,
  );
});

test("malformed Checkout Session pagination fails closed before an ambiguous reservation can be released", async () => {
  configureTestStripe();
  globalThis.fetch = async (url) => {
    if (String(url).includes("/subscriptions?")) return ok({ data: [], has_more: false });
    if (String(url).includes("/checkout/sessions?")) return ok({ data: [], has_more: "yes" });
    throw new Error(`unexpected Stripe request: ${url}`);
  };
  await assert.rejects(
    inspectAmbiguousFoundingReservation({ ...baseInput, now: afterLease }),
    /pagination state is malformed/,
  );
});

test("Founding Checkout requests a Session lifetime with margin above Stripe's 30-minute minimum", async () => {
  configureTestStripe();
  let checkoutBody = null;
  globalThis.fetch = async (url, init = {}) => {
    if (String(url).includes("/subscriptions?")) return ok({ data: [], has_more: false });
    if (String(url).endsWith("/checkout/sessions") && init.method === "POST") {
      checkoutBody = init.body;
      return ok({
        id: "cs_margin",
        url: "https://checkout.stripe.test/session/cs_margin",
        customer: "cus_founding",
        status: "open",
      });
    }
    throw new Error(`unexpected Stripe request: ${url}`);
  };
  const startedAt = Math.floor(Date.now() / 1000);
  const provider = new StripePaymentProvider();
  await provider.beginSubscriptionCheckout({
    organizationId: "org-founding",
    planKey: "founding",
    customerReference: { providerKey: "stripe", kind: "customer", externalReference: "cus_founding" },
    successUrl: "https://example.test/commercial/founding?checkout=return",
    cancelUrl: "https://example.test/commercial/founding?checkout=cancel",
    idempotencyKey: "founding-checkout-margin-test",
    checkoutCorrelationId: "reservation-margin-test",
  });
  assert.ok(checkoutBody instanceof URLSearchParams);
  const expiresAt = Number(checkoutBody.get("expires_at"));
  assert.ok(Number.isFinite(expiresAt));
  assert.ok(
    expiresAt >= startedAt + RFXCHANGE_FOUNDING_CHECKOUT_SESSION_LIFETIME_SECONDS - 1,
    "Checkout Session expiry must retain the configured safety margin above Stripe's minimum",
  );
  assert.ok(
    RFXCHANGE_FOUNDING_CHECKOUT_SESSION_LIFETIME_SECONDS >= 35 * 60,
    "Founding Checkout Session lifetime must not sit on Stripe's exact 30-minute minimum boundary",
  );
});