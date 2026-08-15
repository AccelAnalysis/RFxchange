import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";

import {
  parseVerifiedStripeEvent,
  providerHasNonTerminalFoundingSubscription,
  verifyStripeWebhookSignature,
} from "../lib/runtime/market-ready-founding-commerce-stripe.js";

const SECRET = "whsec_test_only_not_a_real_secret";
const NOW = 1_786_650_000;
const ORIGINAL_FETCH = globalThis.fetch;

function event(overrides = {}) {
  return {
    id: "evt_founding_001",
    type: "customer.subscription.updated",
    created: NOW,
    livemode: false,
    data: { object: { id: "sub_founding_001" } },
    ...overrides,
  };
}

function signed(value, timestamp = NOW) {
  const rawBody = Buffer.from(JSON.stringify(value));
  const digest = createHmac("sha256", SECRET).update(`${timestamp}.${rawBody.toString("utf8")}`).digest("hex");
  return { rawBody, signatureHeader: `t=${timestamp},v1=${digest}` };
}

function ok(payload) {
  return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
}

function foundingSubscription(id, status = "active") {
  return {
    id,
    customer: "cus_founding",
    status,
    metadata: { organizationId: "org-founding", rfxchangePlan: "founding" },
    items: { data: [{ quantity: 1, price: { id: "price_test_founding" } }] },
    current_period_end: NOW + 2_592_000,
    cancel_at_period_end: false,
  };
}

test.afterEach(() => { globalThis.fetch = ORIGINAL_FETCH; });

test("valid raw-body Stripe signature is accepted and mode-bound", () => {
  const input = signed(event());
  const parsed = parseVerifiedStripeEvent({
    ...input,
    webhookSecret: SECRET,
    expectedMode: "test",
    nowSeconds: NOW,
  });
  assert.equal(parsed.id, "evt_founding_001");
  assert.equal(parsed.type, "customer.subscription.updated");
  assert.equal(parsed.livemode, false);
});

test("tampered payload is rejected", () => {
  const input = signed(event());
  const tampered = Buffer.from(JSON.stringify(event({ type: "checkout.session.completed" })));
  assert.throws(() => verifyStripeWebhookSignature({
    rawBody: tampered,
    signatureHeader: input.signatureHeader,
    webhookSecret: SECRET,
    nowSeconds: NOW,
  }), /verification failed/);
});

test("stale webhook timestamp is rejected", () => {
  const input = signed(event(), NOW - 301);
  assert.throws(() => verifyStripeWebhookSignature({
    ...input,
    webhookSecret: SECRET,
    nowSeconds: NOW,
  }), /outside the accepted tolerance/);
});

test("live/test event mismatch fails closed", () => {
  const input = signed(event({ livemode: true }));
  assert.throws(() => parseVerifiedStripeEvent({
    ...input,
    webhookSecret: SECRET,
    expectedMode: "test",
    nowSeconds: NOW,
  }), /mode does not match/);
});

test("checkout-expiry provider inspection paginates before deciding a Founding slot may be released", async () => {
  const requests = [];
  const firstPage = Array.from({ length: 100 }, (_, index) => ({
    id: `sub_history_${String(index + 1).padStart(3, "0")}`,
    customer: "cus_founding",
    status: "canceled",
    metadata: { organizationId: "other-org", rfxchangePlan: "other-plan" },
    items: { data: [] },
  }));
  globalThis.fetch = async (url) => {
    const requestUrl = new URL(String(url));
    requests.push(requestUrl);
    assert.equal(requestUrl.pathname, "/v1/subscriptions");
    assert.equal(requestUrl.searchParams.get("customer"), "cus_founding");
    assert.equal(requestUrl.searchParams.get("status"), "all");
    assert.equal(requestUrl.searchParams.get("limit"), "100");
    if (!requestUrl.searchParams.has("starting_after")) return ok({ data: firstPage, has_more: true });
    assert.equal(requestUrl.searchParams.get("starting_after"), "sub_history_100");
    return ok({ data: [foundingSubscription("sub_founding_page_2")], has_more: false });
  };

  const retainsCapacity = await providerHasNonTerminalFoundingSubscription({
    secretKey: "sk_test_functions_only",
    customerId: "cus_founding",
    organizationId: "org-founding",
    expectedPriceId: "price_test_founding",
  });

  assert.equal(requests.length, 2);
  assert.equal(retainsCapacity, true);
});

test("uncorrelated non-terminal use of the approved Founding Price fails closed instead of releasing capacity", async () => {
  const anomalous = {
    ...foundingSubscription("sub_founding_uncorrelated"),
    metadata: { organizationId: "wrong-org", rfxchangePlan: "founding" },
  };
  globalThis.fetch = async () => ok({ data: [anomalous], has_more: false });

  await assert.rejects(
    providerHasNonTerminalFoundingSubscription({
      secretKey: "sk_test_functions_only",
      customerId: "cus_founding",
      organizationId: "org-founding",
      expectedPriceId: "price_test_founding",
    }),
    /approved Founding Price without exact organization correlation/,
  );
});

test("malformed webhook subscription pagination fails closed instead of releasing capacity", async () => {
  globalThis.fetch = async () => ok({ data: [foundingSubscription("sub_history_malformed", "canceled")], has_more: "yes" });
  await assert.rejects(
    providerHasNonTerminalFoundingSubscription({
      secretKey: "sk_test_functions_only",
      customerId: "cus_founding",
      organizationId: "org-founding",
      expectedPriceId: "price_test_founding",
    }),
    /pagination state is malformed/,
  );
});