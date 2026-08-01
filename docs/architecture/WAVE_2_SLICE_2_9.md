# Wave 2 Slice 2.9 — Acquisition-to-Activation Continuity

## Scope

This slice implements `ACQ-002` and `ACQ-003`. It gives an anonymous visitor a
privacy-safe public opportunity representation and preserves the semantic reason the
visitor arrived through authentication, activation, marker creation, and the first
authenticated continuation.

It does not implement RFx, referral, teaming, provider, or buyer workflows. Slice 2.10
was not begun.

## Eligibility

Implementation began from merged `main` at
`a767b6ef7dc1cd426547a214a9c9bc61bf7b4e49` after PR #99 passed its repaired
configured-browser acceptance, removed all disposable Firebase records, merged, and
left Activation at 31/43. `ACQ-002` and `ACQ-003` had no unsatisfied canonical
dependencies.

## Public opportunity projection

`PublicOpportunityProjectionPort` is the stable anonymous-publication boundary. Its
projection contains only an opaque reference, approved issuer display name,
geography label, public summary, capability categories, and publication state. The
public landing page fails closed unless the projection is both `published` and
`public`.

The bounded seeded adapter supplies one launch projection without creating a live
opportunity/RFx aggregate or a second RFx persistence model. A later canonical RFx
publication adapter can replace it behind the same port without changing acquisition
semantics. Restricted and malformed subjects return no public page or context.

## Acquisition-context envelope

The version-1 server-owned envelope supports `opportunity`, `organization-claim`,
`referral`, `team-invitation`, `provider`, `buyer-need`, and `direct` intents. It
records an opaque subject reference, paired source channel, issued/expiry timestamps,
semantic destination, browser-secret digest, user/access-journey binding, and
issued/bound/resumed state.

Anonymous issuance returns only an opaque context ID and random browser secret in an
HttpOnly, SameSite=Lax cookie. The server stores only its SHA-256 digest. Authentication
binds the envelope to the authoritative RFxchange user and deterministic activation
journey before activation bootstrapping. Resume rechecks both identities and expiry.
Cross-user, cross-journey, stale, malformed, and digest-mismatched contexts fail
closed; rejection clears the acquisition cookie but never blocks legitimate sign-in.
Binding and resume are idempotent so browser history, reload, and sign-in re-entry do
not duplicate evidence.

Acquisition intent remains navigation context only. It cannot grant organization
membership or authority, select geography, satisfy Profile Complete, activate a
marker, accept an invitation, create a referral/team/provider status, or release
OPEN. Unsupported later-wave destinations show a truthful saved-for-later state.

## Persistence and security

Two server-managed Firestore collections are added:

- `acquisitionContexts` stores the mutable current envelope;
- `acquisitionContextEvents` stores append-only issued/bound/resumed evidence.

Creation and each first state transition atomically write current state and evidence.
Direct Firestore clients cannot read or write either collection; event update/delete
is explicitly denied. The activation journey stores a minimum safe bound-context
snapshot so the reason for arrival is visible throughout the existing resumable
journey without making browser state authoritative.

## Participant continuation

The existing trusted participant-route resolver remains the entry authority. An
authenticated continuation requires the current user, active membership, activated
organization, unrestricted access, and controlled-platform lifecycle. The page then
records the idempotent resume event and presents the currently available semantic
destination. Direct registration retains the existing map destination.

## Validation evidence

- focused `ACQ-002`/`ACQ-003` tests cover all seven intent kinds, direct entry,
  public-projection minimization, expiry, tamper, wrong-user, cross-journey,
  wrong-organization neutrality, replay/idempotency, route authority, and responsive
  CSS contracts;
- Firestore emulator acceptance proves atomic issue/bind/resume evidence, one event
  per transition, server access, and direct-client denial;
- architecture, schema, security-rule, Functions, TypeScript, lint, and production
  build validation run through the canonical repository gate;
- configured-browser acceptance on 2026-08-01 used the real configured Firebase
  project plus Census/TIGERweb, Census geocoding, and Mapbox integrations;
- a fresh disposable participant entered through the public Portsmouth opportunity,
  completed real Norfolk activation, reached active Profile Complete and marker state,
  recovered the opportunity at `/acquisition/continue`, and recovered it again after
  history navigation, reload, sign-out, and password sign-in;
- authoritative inspection showed one version-1 resumed context with exactly one each
  of the issued, bound, and resumed events and no change to the controlled-platform
  lifecycle;
- responsive browser acceptance at 390×844 confirmed the public breakpoint, readable
  CTA/details, no horizontal overflow, and no console errors;
- all 29 disposable Firestore documents and the disposable Firebase Authentication
  user were removed; follow-up queries by recorded IDs returned no remaining records.

The browser proof used Firebase Admin only to establish the disposable user's
verified test state. It did not change application code or prove external delivery of
the verification email.

The two empty Mapbox `FeatureCollection` constants were narrowed from readonly to
mutable empty arrays solely to satisfy the repository's installed Mapbox type
contract under Node 24.18; this does not change map behavior or complete another
Feature ID.
