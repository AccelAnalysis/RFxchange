import type { OrganizationAccount } from "../../domain/organizations/model.ts";
import {
  commercialPlanKey,
  createOrganizationCommercialAccount,
  evolveOrganizationCommercialAccount,
  type OrganizationCommercialAccount,
  type PaymentProviderReference,
} from "../../domain/commercial/model.ts";
import type { OrganizationCommercialAccountRepository } from "../../domain/commercial/repository.ts";
import type {
  PaymentProvider,
  PaymentProviderCheckoutResult,
} from "../../domain/commercial/payment-provider.ts";

function normalizedEmail(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Billing email must be a valid email address.");
  }
  return normalized;
}

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function customerReference(account: OrganizationCommercialAccount): PaymentProviderReference | null {
  return account.providerReferences.find((reference) => reference.kind === "customer") ?? null;
}

function withCustomerReference(
  current: OrganizationCommercialAccount,
  customer: PaymentProviderReference,
  now: string,
): OrganizationCommercialAccount {
  const providerReferences = Object.freeze([
    ...current.providerReferences.filter((reference) => reference.kind !== "customer"),
    customer,
  ]);
  return evolveOrganizationCommercialAccount(current, {
    planKey: String(current.planKey),
    entitlementKeys: current.entitlementKeys.map(String),
    providerReferences,
    subscription: {
      status: current.subscription.status,
      providerSubscriptionReference: current.subscription.providerSubscriptionReference,
      currentPeriodEndsAt: current.subscription.currentPeriodEndsAt
        ? String(current.subscription.currentPeriodEndsAt)
        : null,
      cancelAtPeriodEnd: current.subscription.cancelAtPeriodEnd,
    },
    now,
  });
}

function assertCheckoutResult(result: PaymentProviderCheckoutResult): void {
  if (result.checkoutReference.kind !== "checkout-session") {
    throw new Error("Payment provider checkout result must return a checkout-session reference.");
  }
  if (result.customerReference.kind !== "customer") {
    throw new Error("Payment provider checkout result must return a customer reference.");
  }
  if (
    result.checkoutReference.providerKey !== result.providerKey ||
    result.customerReference.providerKey !== result.providerKey
  ) {
    throw new Error("Payment provider result references must belong to the reported provider.");
  }
  try {
    new URL(result.redirectUrl);
  } catch {
    throw new Error("Payment provider checkout result requires a valid redirect URL.");
  }
}

export class OrganizationCommercialAccountService {
  private readonly repository: OrganizationCommercialAccountRepository;
  private readonly paymentProvider: PaymentProvider;

  constructor(input: Readonly<{
    repository: OrganizationCommercialAccountRepository;
    paymentProvider: PaymentProvider;
  }>) {
    this.repository = input.repository;
    this.paymentProvider = input.paymentProvider;
  }

  async ensureFreeAccount(
    organization: OrganizationAccount,
    now: string,
  ): Promise<OrganizationCommercialAccount> {
    const existing = await this.repository.getByOrganizationId(organization.id);
    if (existing) return existing;
    const account = createOrganizationCommercialAccount({ organizationId: organization.id, now });
    await this.repository.create(account);
    return account;
  }

  async beginSubscriptionCheckout(input: Readonly<{
    organization: OrganizationAccount;
    planKey: string;
    billingEmail: string;
    successUrl: string;
    cancelUrl: string;
    idempotencyKey: string;
    now: string;
  }>): Promise<PaymentProviderCheckoutResult> {
    let account = await this.ensureFreeAccount(input.organization, input.now);
    const email = normalizedEmail(input.billingEmail);
    const idempotencyKey = required(input.idempotencyKey, "Payment idempotency key");
    const requestedPlan = commercialPlanKey(input.planKey);
    let customer = customerReference(account);

    if (!customer) {
      const ensured = await this.paymentProvider.ensureCustomer({
        organizationId: input.organization.id,
        billingEmail: email,
        idempotencyKey: `${idempotencyKey}:customer`,
      });
      if (ensured.customerReference.kind !== "customer") {
        throw new Error("Payment provider customer result must return a customer reference.");
      }
      if (ensured.customerReference.providerKey !== ensured.providerKey) {
        throw new Error("Payment provider customer reference must belong to the reported provider.");
      }
      account = withCustomerReference(account, ensured.customerReference, input.now);
      await this.repository.save(account);
      customer = ensured.customerReference;
    }

    const result = await this.paymentProvider.beginSubscriptionCheckout({
      organizationId: input.organization.id,
      planKey: requestedPlan,
      customerReference: customer,
      successUrl: required(input.successUrl, "Checkout success URL"),
      cancelUrl: required(input.cancelUrl, "Checkout cancel URL"),
      idempotencyKey,
    });
    assertCheckoutResult(result);
    return result;
  }
}
