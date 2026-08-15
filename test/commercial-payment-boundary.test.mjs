import assert from "node:assert/strict";
import test from "node:test";

import { OrganizationCommercialAccountService } from "../src/application/commercial/organization-commercial-account.ts";
import {
  createOrganizationCommercialAccount,
  createPaymentProviderReference,
  evolveOrganizationCommercialAccount,
  paymentProviderKey,
} from "../src/domain/commercial/model.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";

const now = "2026-03-03T00:00:00.000Z";

class MemoryCommercialRepository {
  constructor() { this.values = new Map(); }
  async getById(id) { return this.values.get(String(id)) ?? null; }
  async getByOrganizationId(organizationId) {
    return [...this.values.values()].find((value) => String(value.organizationId) === String(organizationId)) ?? null;
  }
  async create(account) { this.values.set(String(account.id), account); }
  async save(account) { this.values.set(String(account.id), account); }
}

class FakePaymentProvider {
  constructor() {
    this.providerKey = paymentProviderKey("fake-provider");
    this.customerRequests = [];
    this.checkoutRequests = [];
    this.portalRequests = [];
  }
  async ensureCustomer(request) {
    this.customerRequests.push(request);
    return {
      providerKey: this.providerKey,
      customerReference: createPaymentProviderReference({ providerKey: this.providerKey, kind: "customer", externalReference: "cus_demo" }),
    };
  }
  async beginSubscriptionCheckout(request) {
    this.checkoutRequests.push(request);
    return {
      providerKey: this.providerKey,
      customerReference: request.customerReference,
      checkoutReference: createPaymentProviderReference({ providerKey: this.providerKey, kind: "checkout-session", externalReference: "cs_demo" }),
      redirectUrl: "https://payments.example.test/checkout/cs_demo",
    };
  }
  async createCustomerPortalSession(request) {
    this.portalRequests.push(request);
    return {
      providerKey: this.providerKey,
      portalReference: createPaymentProviderReference({ providerKey: this.providerKey, kind: "customer-portal-session", externalReference: "bps_demo" }),
      redirectUrl: "https://payments.example.test/portal/bps_demo",
    };
  }
}

test("COM-038 organization commercial accounts are provider-neutral and default free", () => {
  const account = createOrganizationCommercialAccount({ organizationId: "org_001", now });
  assert.equal(account.planKey, "free");
  assert.deepEqual(account.entitlementKeys, []);
  assert.deepEqual(account.providerReferences, []);
  assert.equal(account.subscription.status, "not-subscribed");
  assert.equal("stripeCustomerId" in account, false);
  assert.equal("stripeSubscriptionId" in account, false);
  assert.equal("stripeCheckoutSessionId" in account, false);
});

test("COM-038 paid commercial state uses opaque provider references and generic subscription state", () => {
  const providerKey = paymentProviderKey("provider-a");
  const customer = createPaymentProviderReference({ providerKey, kind: "customer", externalReference: "customer-a" });
  const subscription = createPaymentProviderReference({ providerKey, kind: "subscription", externalReference: "subscription-a" });
  const base = createOrganizationCommercialAccount({ organizationId: "org_002", now });
  const paid = evolveOrganizationCommercialAccount(base, {
    planKey: "founding",
    entitlementKeys: ["founding.recognition"],
    providerReferences: [customer, subscription],
    subscription: {
      status: "active",
      providerSubscriptionReference: subscription,
      currentPeriodEndsAt: "2026-04-03T00:00:00.000Z",
      cancelAtPeriodEnd: false,
    },
    now: "2026-03-03T00:01:00.000Z",
  });
  assert.equal(paid.planKey, "founding");
  assert.equal(paid.subscription.status, "active");
  assert.equal(paid.subscription.providerSubscriptionReference.kind, "subscription");
  assert.equal("stripeCustomerId" in paid, false);
  assert.equal("stripeSubscription" in paid, false);
});

test("COM-038 rejects mixed-provider and malformed subscription references", () => {
  const customer = createPaymentProviderReference({ providerKey: "provider-a", kind: "customer", externalReference: "customer-a" });
  const subscription = createPaymentProviderReference({ providerKey: "provider-b", kind: "subscription", externalReference: "subscription-b" });
  assert.throws(() => createOrganizationCommercialAccount({
    organizationId: "org_003",
    providerReferences: [customer, subscription],
    subscription: { status: "active", providerSubscriptionReference: subscription },
    now,
  }), /one payment provider/);
  assert.throws(() => createOrganizationCommercialAccount({
    organizationId: "org_003",
    providerReferences: [customer],
    subscription: { status: "not-subscribed", providerSubscriptionReference: customer },
    now,
  }), /kind subscription|not-subscribed/);
});

test("COM-038 application service reaches payment infrastructure only through the provider-neutral port", async () => {
  const organization = createOrganizationAccount({ id: "org_004", now });
  const repository = new MemoryCommercialRepository();
  const paymentProvider = new FakePaymentProvider();
  const service = new OrganizationCommercialAccountService({ repository, paymentProvider });

  const free = await service.ensureFreeAccount(organization, now);
  assert.equal(free.organizationId, organization.id);
  assert.equal(free.planKey, "free");

  const result = await service.beginSubscriptionCheckout({
    organization,
    planKey: "founding",
    billingEmail: "Owner@Example.COM",
    successUrl: "https://rfxchange.example.test/account/billing/success",
    cancelUrl: "https://rfxchange.example.test/account/billing",
    idempotencyKey: "org-004-founding-checkout-1",
    checkoutCorrelationId: "checkout-correlation-org-004-1",
    now,
  });

  assert.equal(paymentProvider.customerRequests.length, 1);
  assert.equal(paymentProvider.customerRequests[0].organizationId, organization.id);
  assert.equal(paymentProvider.customerRequests[0].billingEmail, "owner@example.com");
  assert.equal(paymentProvider.checkoutRequests.length, 1);
  assert.equal(paymentProvider.checkoutRequests[0].planKey, "founding");
  assert.equal(paymentProvider.checkoutRequests[0].customerReference.kind, "customer");
  assert.equal(paymentProvider.checkoutRequests[0].checkoutCorrelationId, "checkout-correlation-org-004-1");
  assert.equal(result.checkoutReference.kind, "checkout-session");
});
