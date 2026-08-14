import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";

import {
  parseVerifiedStripeEvent,
  verifyStripeWebhookSignature,
} from "../lib/runtime/market-ready-founding-commerce-stripe.js";

const SECRET = "whsec_test_only_not_a_real_secret";
const NOW = 1_786_650_000;

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
