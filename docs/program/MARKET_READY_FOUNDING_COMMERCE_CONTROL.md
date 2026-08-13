# Market-Ready Founding Membership / Live-Commerce Control

**Control owner:** 00 — RFxchange Control Room

**Implementation role:** Commercial Release Integrator — Founding Membership Baseline

**Packet:** `WP-MARKET-READY-FOUNDING-COMMERCE-01`

**Activation epoch:** `market-ready-founding-commerce-2026-08-13`

**Activation base:** `97b93f1d0f3405111b700e4d6ca9d443b9722833`

**Release class:** Critical

## Authority and execution model

This packet is a product-owner-authorized market-ready workstream that proceeds in parallel with the Four-Lens packet `WP-EXCHANGE-ROOM-PHASE2-01`.

It is intentionally **outside the Four-Lens lane ledger**. The permanent Four-Lens machine model accepts only Control Room, Shared Exchange, Opportunities/RFx, Intelligence, Resources, Referrals, Independent Acceptance and Integration. Commercial implementation does not belong to any permanent lens, and this packet must not falsify ownership by assigning payment/domain work to a lens merely to satisfy the Four-Lens validator.

`AGENTS.md` permits work outside the Four-Lens packet model to run under a separately explicit current task authorization. The product owner has explicitly authorized this Founding commerce work to proceed concurrently with Phase 2.

The Commercial Release Integrator is therefore a temporary packet-bound implementation role. It is not a fifth lens, not a permanent lane and not an independent acceptance authority.

## Market-opening objective

Produce the minimum trustworthy commercial journey required by `MARKET_READY_BASELINE.md`:

```text
legitimate organization
→ receives Exchange value
→ sees truthful Founding offer
→ elects Founding Membership
→ server creates/reuses the correct payment-provider customer
→ server creates approved recurring Checkout
→ participant completes live payment
→ browser return grants nothing by itself
→ authenticated provider event is reconciled
→ authoritative organization commercial state becomes paid Founding state
→ participant returns safely to the Exchange
→ logout/login or later re-entry preserves the paid organization state
```

The commercial objective is **not** merely a successful redirect from Stripe. The objective is that RFxchange can durably and securely know that the correct organization is a legitimately paid Founding Organization.

## Current commercial authority

`docs/context/COMMERCIAL_MODEL.md` governs the current normalized product model:

- free to enter;
- free to participate;
- pay to do more;
- commercial status never buys neutral market legitimacy, verification, credibility, qualification, endorsement or ranking;
- Founding Organization is organization-level;
- the current planned Founding model is **$49/month** with a **250-organization cap**, subject to approved commercial readiness/terms;
- commercial state remains separate from organization authority, verification, credibility and neutral matching.

These values are the current repository-planned terms, not permission to invent additional pricing, discounts, trials, annual tiers, credits, refunds, coupons or entitlement promises.

Before live configuration, the builder must reconcile the current marketing copy, repository authority and actual connected live Stripe catalog. Any discrepancy must be surfaced rather than silently changed.

## Existing foundation

`docs/architecture/WAVE_1_SLICE_1_30.md` establishes:

- organization-owned `OrganizationCommercialAccount` state;
- provider-neutral plan/subscription/entitlement concepts;
- opaque provider references;
- a provider-neutral `PaymentProvider` port;
- server validation for organization ownership, email, plan key, idempotency and provider-reference correlation.

That slice explicitly did **not** integrate Stripe, create Stripe customers/subscriptions/Checkout sessions, activate Founding membership, process payment webhooks or reconcile provider state.

The builder must reuse this architecture rather than creating a second commercial aggregate or bypassing the provider-neutral boundary.

## `COM-039`–`COM-041` source-authority finding

Current repository search finds the Feature IDs `COM-039`, `COM-040` and `COM-041` in the Master Build Tracker and the earlier commercial boundary's statement that later Commercial work owns Stripe/webhook/reconciliation behavior.

The repository does **not** contain the original source definitions for those three Feature IDs. Their precise individual requirement text therefore remains a source-authority gap.

Rules:

1. Preserve `COM-039`–`COM-041` as unchecked tracker IDs.
2. Do not invent or rewrite their original definitions.
3. If the original approved source is later recovered, reconcile implementation evidence against it before marking any ID Done.
4. This packet may implement the explicitly authorized market-ready behaviors below without claiming that any particular COM ID is complete until its original acceptance definition is available and satisfied.

## Commercial product invariants

A paid Founding plan may enhance tooling, recognition, early access, structured feedback or other approved benefits. It must not create:

- pay-to-rank;
- pay-to-verify;
- pay-to-qualify;
- pay-to-endorse;
- pay-to-appear in legitimate neutral discovery;
- payment as a substitute for Resource Provider approval;
- payment as a substitute for RFx requirements or credibility.

Founding recognition is commercial/historical recognition only.

## Free-entry invariant

Commercial conversion occurs after value. The packet must preserve:

```text
register → organization → Exchange/market → value → optional Founding offer
```

It must not introduce:

```text
register → payment wall → Exchange
```

The existing `/founding` and `/acquisition/founding` acquisition-intent seam should be reused and only corrected where the authenticated commercial handoff is genuinely missing.

## Organization ownership and billing authority

Commercial state belongs to the organization.

Every consequential commercial command must bind:

```text
authenticated participant
→ current server-authoritative membership
→ permitted billing authority
→ exact organization commercial account
→ opaque provider customer/subscription references
```

A client-supplied organization ID, email address, success URL, query parameter or browser state can never activate paid status.

Wrong-organization and stale-membership attempts must fail closed.

## Checkout contract

Checkout creation must be server-authoritative and idempotent.

Required behavior:

- authenticate the current session;
- revalidate current organization membership/authority;
- resolve the Founding plan and processor Price server-side;
- never accept price, currency, interval or paid-state declarations from the client;
- safely create or reuse the correct provider customer;
- avoid duplicate active Founding subscriptions;
- use stable idempotency semantics;
- return safe success/cancel locations;
- never mark an organization paid from the browser redirect alone.

## Stripe adapter boundary

Stripe is processor truth; RFxchange remains authoritative for RFxchange commercial state.

Implement Stripe behind the existing provider-neutral commercial boundary. Do not leak Stripe SDK types into the commercial domain model.

Production secrets must use the repository/deployment secret mechanism. Never commit Stripe secret keys, webhook signing secrets, card data or sensitive raw payload dumps.

## Webhook and reconciliation contract

Live recurring commerce is incomplete without authenticated reconciliation.

Require:

- Stripe webhook signature verification;
- correct raw-body/signature handling;
- live/test environment separation;
- idempotent event processing;
- replay safety;
- safe handling of out-of-order lifecycle evidence where applicable;
- exact customer/subscription/organization correlation;
- durable provider-neutral commercial-state updates;
- malformed or mixed provider references fail closed;
- duplicate webhook delivery cannot duplicate entitlement or capacity effects;
- a browser redirect never grants subscription state.

Subscribe only to processor event types required by the adopted recurring-subscription lifecycle.

## Founding cap

If the current 250-organization cap remains authoritative after commercial-term reconciliation, enforce it from server-authoritative state rather than static marketing copy.

The implementation must explicitly define:

- what consumes a Founding slot;
- when a slot becomes committed;
- concurrent checkout behavior near capacity;
- failed/abandoned Checkout behavior;
- cancellation/termination effect on capacity;
- how a successful provider event is handled if capacity changed while Checkout was open.

Do not knowingly oversell through race conditions and do not fabricate a remaining-spots count.

## Entitlements and recognition

Do not invent speculative entitlements merely to make Founding Membership look complete.

An entitlement may be activated only if its product meaning, runtime and enforcement boundary are already authorized. Future benefits may remain future benefits while the commercial membership itself is real.

Founding recognition must never imply verification, qualification, endorsement, preferred ranking or Resource Provider approval.

## Temporary implementation role

The Commercial Release Integrator is authorized only for this packet.

Suggested implementation branch:

`commercial/founding-live-commerce`

The builder must start from current merged `main` after this Control Room activation merges and must reconcile again before its own PR.

### Candidate owned paths

Freeze narrower actual paths after runtime inspection. Expected commercial ownership may include only where genuinely used:

- `src/domain/commercial/**`
- `src/application/commercial/**`
- `src/infrastructure/commercial/**`
- commercial-specific server/API routes under `app/api/**`
- a bounded authenticated Founding conversion surface;
- commercial-specific Functions/webhook code;
- commercial-specific persistence adapters;
- commercial-specific localization;
- commercial-specific tests, scripts and evidence.

### Explicit non-owned paths

The commercial packet does not own:

- `src/application/participant/**`
- `src/components/participant/**`
- `app/geography/canvas/**`
- Phase 2 lens/action registry tests/scripts/evidence;
- RFx domain internals;
- Resources domain internals;
- Intelligence analytical domain;
- Referrals domain internals;
- Four-Lens machine requirement/workstream ledgers;
- Independent Acceptance evidence/disposition.

If commerce requires a shared participant-shell seam, request it from Lane 01 rather than editing Phase 2's controller privately.

## Parallel execution with Phase 2

`WP-EXCHANGE-ROOM-PHASE2-01` continues independently.

```text
Lane 01 Phase 2
  persistent Room + four lenses + sixteen action positions

Commercial Release Integrator
  Founding offer + live Checkout + webhook reconciliation + durable organization paid state

later Control Room / Lane 07 convergence
  one market-ready customer journey
```

Neither workstream may absorb or reset the other.

## Release classification and merge/release gates

This packet is **Critical** because it touches payments, recurring subscriptions, secrets, organization commercial state and duplicate-charge risk.

Before production release require, at minimum:

- exact-head repository CI;
- focused commercial unit/integration tests;
- Firebase emulator evidence for direct-client denial and commercial persistence where applicable;
- billing-authority and wrong-organization negative evidence;
- duplicate/idempotency/replay evidence;
- secret-handling review;
- Stripe Test Mode mechanics where appropriate;
- configured browser checkout/cancel/error/return evidence;
- exact deployment provenance;
- explicit Control Room Critical release authorization;
- rollback/containment plan;
- bounded live-mode production payment proof before declaring the market-ready payment seam live.

Independent reviewer scarcity can leave certification debt, but it cannot waive a known material payment/security/integrity defect.

## Live-money proof

Test Mode may prove mechanics during development. It cannot substitute for a claim that production live payments work.

Before market opening, perform one explicitly authorized bounded live-mode proof using a known owner/test organization and the approved amount. Evidence must trace:

```text
Checkout → live Stripe subscription/payment evidence → authenticated webhook → RFxchange organization commercial state → safe return → later re-entry
```

Do not expose card data or sensitive payment details in evidence. Do not create uncontrolled repeated production charges.

## Acceptance and disposition

The builder's maximum self-reported disposition is:

`Implemented — Not Verified`

Implementation, merge, deployment, live-money proof and independent verification are separate facts.

Control Room will route the exact candidate to an independent reviewer/Lane 06-compatible program acceptance process for the shared market-ready journey and to appropriate payment/security review where required.

## Integration exit

The commercial packet is baseline-ready only when it can later converge with the Phase 2 release in the market-ready journey:

```text
register
→ establish organization
→ enter real Exchange market
→ use/select four permanent lenses
→ see sixteen stable action positions
→ choose Founding Membership after value
→ complete live recurring payment
→ authenticated webhook reconciliation
→ correct organization becomes paid Founding state
→ safe Exchange return
→ logout/login
→ paid state persists
```

All sixteen domain functions do not need to be complete.

## Stop boundary

Do not broaden this packet into:

- all 50 Commercial Feature IDs;
- referral-fee settlement;
- marketplace payouts;
- RFx award fees;
- Resource Provider billing;
- usage billing;
- enterprise invoicing;
- accounting integration;
- credits monetization;
- a general customer portal product;
- marketing redesign;
- Phase 2 lens/controller implementation.

The packet exists for one purpose: **allow a legitimate organization that has received RFxchange value to voluntarily become a real, correctly recognized paying Founding Organization.**
