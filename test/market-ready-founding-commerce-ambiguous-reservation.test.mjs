import assert from "node:assert/strict";
import test from "node:test";

import {
  inspectAmbiguousFoundingReservation,
  RFXCHANGE_FOUNDING_AMBIGUOUS_RECONCILE_AFTER_MS,
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

const baseInput = {
  customerId: "cus_founding",
  organizationId: "org-founding",
  reservationId: "reservation-123",
  reservedAt: RESERVED_AT,
};

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
  assert.equal(calls, 0);
});

test("stale ambiguous reservation is reclaimable only after provider truth shows no subscription or matching Session", async () => {
  configureTestStripe();
  const requests = [];
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    if (String(url).includes("/subscriptions?")) return ok({ data: [] });
    if (String(url).includes("/checkout/sessions?")) return ok({ data: [], has_more: false });
    throw new Error(`unexpected Stripe request: ${url}`);
  };
  const result = await inspectAmbiguousFoundingReservation({
    ...baseInput,
    now: new Date(Date.parse(RESERVED_AT) + RFXCHANGE_FOUNDING_AMBIGUOUS_RECONCILE_AFTER_MS + 1).toISOString(),
  });
  assert.equal(result.eligibleForReconciliation, true);
  assert.equal(result.hasNonTerminalSubscription, false);
  assert.equal(result.matchingCheckoutStatus, null);
  assert.equal(result.reclaimable, true);
  assert.equal(requests.some((url) => url.includes("/subscriptions?")), true);
  assert.equal(requests.some((url) => url.includes("/checkout/sessions?")), true);
});

test("provider-authoritative non-terminal subscription prevents reclamation", async () => {
  configureTestStripe();
  globalThis.fetch = async (url) => {
    if (String(url).includes("/subscriptions?")) return ok({
      data: [{
        id: "sub_founding",
        status: "active",
        metadata: { organizationId: "org-founding", rfxchangePlan: "founding" },
        items: { data: [{ quantity: 1, price: { id: TEST_PRICE } }] },
      }],
    });
    throw new Error("Checkout Session lookup must not run when subscription truth already retains capacity");
  };
  const result = await inspectAmbiguousFoundingReservation({
    ...baseInput,
    now: new Date(Date.parse(RESERVED_AT) + RFXCHANGE_FOUNDING_AMBIGUOUS_RECONCILE_AFTER_MS + 1).toISOString(),
  });
  assert.equal(result.hasNonTerminalSubscription, true);
  assert.equal(result.reclaimable, false);
});

test("expired matching Checkout Session permits reclamation only when no non-terminal subscription exists", async () => {
  configureTestStripe();
  globalThis.fetch = async (url) => {
    if (String(url).includes("/subscriptions?")) return ok({ data: [] });
    if (String(url).includes("/checkout/sessions?")) return ok({
      has_more: false,
      data: [{
        id: "cs_expired",
        url: null,
        customer: "cus_founding",
        status: "expired",
        subscription: null,
        metadata: {
          organizationId: "org-founding",
          rfxchangePlan: "founding",
          rfxchangeReservationId: "reservation-123",
        },
      }],
    });
    throw new Error(`unexpected Stripe request: ${url}`);
  };
  const result = await inspectAmbiguousFoundingReservation({
    ...baseInput,
    now: new Date(Date.parse(RESERVED_AT) + RFXCHANGE_FOUNDING_AMBIGUOUS_RECONCILE_AFTER_MS + 1).toISOString(),
  });
  assert.equal(result.matchingCheckoutStatus, "expired");
  assert.equal(result.reclaimable, true);
});

test("open or completed matching Checkout Session remains fail-closed", async () => {
  configureTestStripe();
  for (const status of ["open", "complete"]) {
    globalThis.fetch = async (url) => {
      if (String(url).includes("/subscriptions?")) return ok({ data: [] });
      if (String(url).includes("/checkout/sessions?")) return ok({
        has_more: false,
        data: [{
          id: `cs_${status}`,
          url: "https://checkout.stripe.test/session",
          customer: "cus_founding",
          status,
          subscription: status === "complete" ? "sub_pending_visibility" : null,
          metadata: {
            organizationId: "org-founding",
            rfxchangePlan: "founding",
            rfxchangeReservationId: "reservation-123",
          },
        }],
      });
      throw new Error(`unexpected Stripe request: ${url}`);
    };
    const result = await inspectAmbiguousFoundingReservation({
      ...baseInput,
      now: new Date(Date.parse(RESERVED_AT) + RFXCHANGE_FOUNDING_AMBIGUOUS_RECONCILE_AFTER_MS + 1).toISOString(),
    });
    assert.equal(result.matchingCheckoutStatus, status);
    assert.equal(result.reclaimable, false);
  }
});