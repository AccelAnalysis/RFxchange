import test from "node:test";
import assert from "node:assert/strict";

import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  createOrganizationCommercialAccount,
  createPaymentProviderReference,
  evolveOrganizationCommercialAccount,
} from "../src/domain/commercial/model.ts";
import { OrganizationCommercialAccountService } from "../src/application/commercial/organization-commercial-account.ts";

const now = "2026-07-30T15:00:00.000Z";

class MemoryCommercialRepository {
  constructor() { this.records = new Map(); }
  async getById(id) { return this.records.get(id) ?? null; }
  async getByOrganizationId(organizationId) {
    return [...this.records.values()].find((account) => account.organizationId === organizationId) ?? null;
  }
  async create(account) {
    if (this.records.has(account.id)) throw new Error("duplicate commercial account");
    this.records.set(account.id, account);
  }
  async save(account) { this.records.set(account.id, account); }
}

class FakePaymentProvider {
  constructor() { this.customerRequests = []; this.checkoutRequests = []; }
  async ensureCustomer(request) {
    this.customerRequests.push(request);
    const customerReference = createPaymentProviderReference({
      providerKey: "test-payments",
      kind: "customer",
      externalReference: `cus_${request.organizationId}`,
    });
    return { providerKey: customerReference.providerKey, customerReference };
  }
  async beginSubscriptionCheckout(request) {
    this.checkoutRequests.push(request);
    const checkoutReference = createPaymentProviderReference({
      providerKey: "test-payments",
      kind: "checkout-session",
      externalReference: `checkout_${request.organizationId}`,
    });
    return {
      providerKey: checkoutReference.providerKey,
      checkoutReference,
      customerReference: request.customerReference,
      redirectUrl: "https://payments.example.test/checkout/session",
    };
  }
  async createCustomerPortalSession() { throw new Error("not used"); }
}

test("ARC-010 commercial state is owned by the organization account tenant, never an individual user", () => {
  const account = createOrganizationCommercialAccount({ organizationId: "org_001", now });
  assert.equal(account.id, "org_001");
  assert.equal(account.organizationId, "org_001");
  assert.equal(account.planKey, "free");
  assert.equal(account.subscription.status, "not-subscribed");
  assert.deepEqual(account.entitlementKeys, []);
  assert.deepEqual(account.providerReferences, []);
  assert.equal("userId" in account, false);
  assert.equal("membershipId" in account, false);
});

test("COM-038 keeps provider references opaque and separate from RFxchange commercial state", () => {
  const customer = createPaymentProviderReference({
    providerKey: "provider-a",
    kind: "customer",
    externalReference: "opaque-customer-781",
  });
  const subscription = createPaymentProviderReference({
    providerKey: "provider-a",
    kind: "subscription",
    externalReference: "opaque-subscription-942",
  });
  const base = createOrganizationCommercialAccount({ organizationId: "org_002", now });
  const paid = evolveOrganizationCommercialAccount(base, {
    planKey: "founding",
    entitlementKeys: ["opportunity.saved-searches", "opportunity.saved-searches", "profile.enhanced"],
    providerReferences: [customer, subscription],
    subscription: {
      status: "active",
      providerSubscriptionReference: subscription,
      currentPeriodEndsAt: "2026-08-30T15:00:00.000Z",
    },
    now: "2026-07-30T15:01:00.000Z",
  });
  assert.equal(paid.organizationId, "org_002");
  assert.equal(paid.planKey, "founding");
  assert.deepEqual(paid.entitlementKeys, ["opportunity.saved-searches", "profile.enhanced"]);
  assert.equal(paid.subscription.providerSubscriptionReference.externalReference, "opaque-subscription-942");
  assert.equal("stripeCustomer" in paid, false);
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
    now,
  });

  assert.equal(paymentProvider.customerRequests.length, 1);
  assert.equal(paymentProvider.customerRequests[0].organizationId, organization.id);
  assert.equal(paymentProvider.customerRequests[0].billingEmail, "owner@example.com");
  assert.equal(paymentProvider.checkoutRequests.length, 1);
  assert.equal(paymentProvider.checkoutRequests[0].planKey, "founding");
  assert.equal(paymentProvider.checkoutRequests[0].customerReference.kind, "customer");
  assert.equal(result.checkoutReference.kind, "checkout-session");
});
