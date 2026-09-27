# Wave 1 Slice 1.30 — ARC-010 + COM-038

## Purpose

Close the commercial-state prerequisite for the Foundation wave without activating paid commerce. RFxchange commercial state is owned by an Organization Account tenant, while payment processors remain replaceable infrastructure adapters.

## ARC-010 — Organization-level billing/membership state

`OrganizationCommercialAccount` is a one-to-one organization-owned aggregate. It contains:

- RFxchange plan key;
- provider-neutral subscription status;
- RFxchange entitlement keys;
- opaque payment-provider references;
- timestamps.

The aggregate contains no user or membership ownership fields. Individual users may later administer billing through permissioned application workflows, but the commercial state belongs to the organization.

The default state is `free` + `not-subscribed` with no payment-provider references.

## COM-038 — Payment provider abstraction

`PaymentProvider` defines provider-neutral operations for:

- ensuring a provider customer identity;
- beginning subscription checkout;
- creating a customer-portal session.

Provider references are represented as opaque `{ providerKey, kind, externalReference }` values. RFxchange does not store provider SDK objects as its commercial model.

The application service validates organization ownership, email, plan key, idempotency key and provider result/reference correlation. Starting checkout does **not** make an RFxchange subscription active; future Commercial-wave webhook/reconciliation work remains responsible for accepted commercial events and entitlement changes.

## Explicit boundary

This slice does not:

- integrate Stripe;
- create Stripe customers/subscriptions/checkout sessions;
- activate Founding membership;
- grant entitlements based on a redirect;
- process payment-provider webhooks;
- reconcile provider state.

Those remain COM-039 through COM-041 and related Commercial-wave work.

## Acceptance

- organization commercial state is modeled without individual ownership;
- plan, subscription and entitlements are RFxchange concepts;
- payment provider identifiers are opaque external references;
- domain/application code imports no Stripe/provider SDK types;
- a fake provider can satisfy the application port and receive an organization-scoped checkout request;
- malformed/mixed provider references fail closed;
- production validation, tests, typecheck, lint and build remain green.
