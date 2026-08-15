import assert from "node:assert/strict";
import test from "node:test";

import { OrganizationCommercialAccountService } from "../src/application/commercial/organization-commercial-account.ts";
import { createPaymentProviderReference, paymentProviderKey } from "../src/domain/commercial/model.ts";

const STRIPE = paymentProviderKey("stripe");
const CUSTOMER = createPaymentProviderReference({ providerKey: STRIPE, kind: "customer", externalReference: "cus_recovered" });

function repository() {
  let value = null;
  return {
    port: {
      async getById() { return value; },
      async getByOrganizationId() { return value; },
      async create(next) { value = next; },
      async save(next) { value = next; },
    },
    current() { return value; },
  };
}

test("validated provider Customer is durably stored before a later Checkout failure", async () => {
  const store = repository();
  let ensureCalls = 0;
  const service = new OrganizationCommercialAccountService({
    repository: store.port,
    paymentProvider: {
      async ensureCustomer() {
        ensureCalls += 1;
        return { providerKey: STRIPE, customerReference: CUSTOMER };
      },
      async beginSubscriptionCheckout() {
        throw new Error("simulated checkout transport failure");
      },
      async createCustomerPortalSession() {
        throw new Error("not used");
      },
    },
  });

  await assert.rejects(
    service.beginSubscriptionCheckout({
      organization: { id: "org-customer-reuse" },
      planKey: "founding",
      billingEmail: "owner@example.test",
      successUrl: "https://example.test/commercial/founding?checkout=return",
      cancelUrl: "https://example.test/commercial/founding?checkout=cancel",
      idempotencyKey: "attempt-one",
      checkoutCorrelationId: "customer-reuse-correlation-one",
      now: "2026-08-14T00:00:00.000Z",
    }),
    /simulated checkout transport failure/,
  );

  assert.equal(ensureCalls, 1);
  assert.equal(store.current().providerReferences.length, 1);
  assert.equal(store.current().providerReferences[0].kind, "customer");
  assert.equal(String(store.current().providerReferences[0].externalReference), "cus_recovered");

  await assert.rejects(
    service.beginSubscriptionCheckout({
      organization: { id: "org-customer-reuse" },
      planKey: "founding",
      billingEmail: "owner@example.test",
      successUrl: "https://example.test/commercial/founding?checkout=return",
      cancelUrl: "https://example.test/commercial/founding?checkout=cancel",
      idempotencyKey: "attempt-two",
      checkoutCorrelationId: "customer-reuse-correlation-two",
      now: "2026-08-14T00:01:00.000Z",
    }),
    /simulated checkout transport failure/,
  );

  assert.equal(ensureCalls, 1, "retry must reuse the persisted opaque Customer reference");
});