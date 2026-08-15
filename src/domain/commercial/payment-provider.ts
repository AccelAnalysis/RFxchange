import type { OrganizationId } from "../organizations/model.ts";
import type {
  CommercialPlanKey,
  PaymentProviderKey,
  PaymentProviderReference,
} from "./model.ts";

export interface PaymentProviderCustomerRequest {
  readonly organizationId: OrganizationId;
  readonly billingEmail: string;
  readonly idempotencyKey: string;
}

export interface PaymentProviderCheckoutRequest {
  readonly organizationId: OrganizationId;
  readonly planKey: CommercialPlanKey;
  readonly customerReference: PaymentProviderReference | null;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly idempotencyKey: string;
  /** Server-issued opaque correlation; never accepted from browser payment terms. */
  readonly checkoutCorrelationId: string;
}

export interface PaymentProviderPortalRequest {
  readonly organizationId: OrganizationId;
  readonly customerReference: PaymentProviderReference;
  readonly returnUrl: string;
  readonly idempotencyKey: string;
}

export interface PaymentProviderCustomerResult {
  readonly providerKey: PaymentProviderKey;
  readonly customerReference: PaymentProviderReference;
}

export interface PaymentProviderCheckoutResult {
  readonly providerKey: PaymentProviderKey;
  readonly checkoutReference: PaymentProviderReference;
  readonly customerReference: PaymentProviderReference;
  readonly redirectUrl: string;
}

export interface PaymentProviderPortalResult {
  readonly providerKey: PaymentProviderKey;
  readonly portalReference: PaymentProviderReference;
  readonly redirectUrl: string;
}

/** Provider-specific SDK/customer/subscription objects must remain behind this port. */
export interface PaymentProvider {
  ensureCustomer(request: PaymentProviderCustomerRequest): Promise<PaymentProviderCustomerResult>;
  beginSubscriptionCheckout(request: PaymentProviderCheckoutRequest): Promise<PaymentProviderCheckoutResult>;
  createCustomerPortalSession(request: PaymentProviderPortalRequest): Promise<PaymentProviderPortalResult>;
}