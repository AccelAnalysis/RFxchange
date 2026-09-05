import assert from "node:assert/strict";
import test from "node:test";
import { declaredParams } from "firebase-functions/params";
import { runtimeFoundationHealth, scheduledBackgroundJobHeartbeat, marketReadyFoundingCommerceWebhook } from "../lib/index.js";

test("deployment discovery binds payment secrets only to the payment endpoint", () => {
  assert.deepEqual(runtimeFoundationHealth.__endpoint.secretEnvironmentVariables ?? [], []);
  assert.deepEqual(scheduledBackgroundJobHeartbeat.__endpoint.secretEnvironmentVariables ?? [], []);
  assert.deepEqual(marketReadyFoundingCommerceWebhook.__endpoint.secretEnvironmentVariables.map((secret) => secret.key).sort(), ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]);
  assert.equal(declaredParams.some((param) => ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"].includes(param.name)), false);
});

test("an unconfigured payment webhook fails closed before provider or datastore work", async () => {
  const saved = { mode: process.env.RFXCHANGE_STRIPE_MODE, price: process.env.RFXCHANGE_FOUNDING_STRIPE_TEST_PRICE_ID, secret: process.env.STRIPE_WEBHOOK_SECRET, fetch: globalThis.fetch };
  process.env.RFXCHANGE_STRIPE_MODE = "test";
  process.env.RFXCHANGE_FOUNDING_STRIPE_TEST_PRICE_ID = "price_deployment_isolation_test";
  delete process.env.STRIPE_WEBHOOK_SECRET;
  let providerCalls = 0;
  globalThis.fetch = async () => { providerCalls++; throw new Error("No provider call is permitted."); };
  const response = { code: null, body: null, set() { return this; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  try {
    await marketReadyFoundingCommerceWebhook({ method: "POST", headers: {}, get: () => "t=1,v1=invalid", rawBody: Buffer.from("{}") }, response);
    assert.equal(response.code, 400);
    assert.deepEqual(response.body, { error: "invalid-webhook" });
    assert.equal(providerCalls, 0);
  } finally {
    for (const [key, value] of [["RFXCHANGE_STRIPE_MODE", saved.mode], ["RFXCHANGE_FOUNDING_STRIPE_TEST_PRICE_ID", saved.price], ["STRIPE_WEBHOOK_SECRET", saved.secret]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    globalThis.fetch = saved.fetch;
  }
});
