# Market-Ready Founding Commerce — Packet Requirements

These are immutable **packet-local market-ready requirement IDs** for `WP-MARKET-READY-FOUNDING-COMMERCE-01`.

They do not replace, rename, infer, or satisfy the unresolved tracker Feature IDs `COM-039`, `COM-040`, or `COM-041`. Those Feature IDs remain governed by their original source definitions if/when recovered.

These IDs exist so implementation, evidence, findings, release decisions and later independent acceptance can bind exact obligations even while the original COM source definitions are unavailable.

## Immutable requirements

### `MRFC-OFFER-001` — Truthful post-value Founding offer

A legitimate organization can encounter the current approved Founding Organization offer after receiving Exchange value without payment becoming a prerequisite for legitimate Exchange entry or neutral market participation; the offer uses reconciled approved commercial terms and does not promise nonexistent operational entitlements or commercial advantages over verification, qualification, credibility, provider approval or neutral ranking.

Acceptance types: functional, copy, browser-visual, domain-security.

### `MRFC-AUTH-001` — Organization-owned billing authority

Every Founding checkout or consequential commercial command revalidates the authenticated participant's current server-authoritative membership and billing authority for the exact organization commercial account; client-supplied organization identity, email, query state, success URL or browser state never grants commercial authority, and stale/wrong-organization attempts fail closed.

Acceptance types: functional, domain-security.

### `MRFC-CHECKOUT-001` — Server-authoritative recurring checkout

RFxchange creates the Founding recurring Checkout session server-side using the approved configured plan/Price, safely creates or reuses the correct provider customer, enforces idempotency and duplicate-subscription protection, and never permits the client to declare amount, currency, billing interval, Founding status or payment success.

Acceptance types: functional, domain-security.

### `MRFC-RECON-001` — Authenticated provider reconciliation

Paid Founding state is established only from authenticated, signature-verified, replay-safe and idempotent provider event processing that correctly correlates provider customer/subscription evidence to the authoritative RFxchange organization commercial account; browser redirects alone grant no paid state and malformed/mixed provider references fail closed.

Acceptance types: functional, domain-security, governance.

### `MRFC-CAP-001` — Authoritative Founding capacity

If the current 250-organization Founding cap remains approved after commercial-term reconciliation, capacity is enforced from authoritative server state with defined concurrent-checkout, failed/abandoned-checkout, successful-payment and cancellation/termination behavior; RFxchange does not knowingly oversell through race conditions or fabricate remaining-capacity presentation.

Acceptance types: functional, domain-security.

### `MRFC-STATE-001` — Durable organization paid state

After accepted provider reconciliation, the correct organization projects the authorized Founding commercial state and only approved real entitlements/recognition; that state survives safe return, reload and later logout/login or re-entry without converting commercial recognition into verification, qualification, endorsement, provider approval, credibility or preferred neutral ranking.

Acceptance types: functional, domain-security, cross-lens.

### `MRFC-SEC-001` — Payment secret and data minimization boundary

RFxchange stores no card data, exposes no payment-provider secret or webhook signing secret, keeps processor-specific implementation behind the existing provider abstraction, denies direct-client authoritative commercial mutation, and retains only the provider data/evidence necessary for governed reconciliation and audit.

Acceptance types: domain-security, governance.

### `MRFC-LIVE-001` — Bounded production live-money proof

Before the market-ready Founding payment seam may be reported live, an explicitly authorized bounded live-mode production proof traces one known test/owner organization through approved Checkout amount, provider subscription/payment evidence, authenticated webhook reconciliation, authoritative RFxchange organization commercial state, safe Exchange return and later paid-state persistence without uncontrolled repeated charges or sensitive payment-data disclosure.

Acceptance types: functional, domain-security, browser-visual, governance.

## Packet disposition

The commercial builder may bind implementation evidence to these IDs and report no higher than `Implemented — Not Verified`.

These packet-local requirements do not enter the Four-Lens immutable requirement ledger and do not alter its denominator. They are governed by the direct market-ready Control Room authority for this separate commercial workstream.

Independent acceptance/release review must disposition each applicable ID against the exact implementation/deployment/evidence being evaluated.

## Critical reviewer-capacity rule

A Critical live-money release normally requires the applicable independent review/certification evidence.

If the only missing release evidence is independent reviewer availability, a reviewer-capacity exception is valid **only** when all of the following are true:

1. every required Critical safety/security/payment/integrity negative check has passed;
2. there is no known material payment, security, privacy, tenancy, authority, secret-handling, duplicate-charge or reconciliation defect;
3. exact deployment and rollback/containment evidence exist;
4. the bounded live-money proof required by `MRFC-LIVE-001` has passed when the release claim depends on live production operation;
5. Control Room records the reviewer-capacity debt explicitly; and
6. the product owner/participant provides **explicit Critical-risk acceptance for releasing with independent reviewer capacity unavailable**.

Ordinary Control Room authorization alone is not a substitute for item 6.

This exception can defer certification only. It cannot waive a known material Critical defect or any required safety evidence.
