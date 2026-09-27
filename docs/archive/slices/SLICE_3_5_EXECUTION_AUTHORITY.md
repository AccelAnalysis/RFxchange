# Slice 3.5 — Referral Network & Referral Acquisition execution authority

**Status: AUTHORITY CONSUMED — SLICE 3.5 COMPLETE VIA PR #130**

## Recalculated merged baseline

Slice 3.5 authority is recalculated from merged `main` at `7f57cabf029edb0a0045b53d9f3339f170dc530c` after:

- Slice 3.4 passed exact-head production CI run `31291992746`;
- PR #128 merged the accepted Slice 3.4 implementation; and
- post-merge production CI run `31292086252` passed on `main`.

The canonical tracker remains **438 total · 132 Done · 306 Not Started**, Activation **43/43**, and Network **18/38**. The dependency map identifies Slice 3.5 as the earliest eligible product slice without requiring a dependency-edge correction. This authority update changes no Feature-ID status.

## Authorized Feature IDs

- `REF-001` — send business referral;
- `REF-002` — receive and accept or decline referral;
- `REF-003` — basic referral status tracking;
- `REF-004` — structured referral context;
- `REF-005` — consent and minimum necessary sharing;
- `EDU-014` — first referral education; and
- `ACQ-006` — invite a non-member to receive a referral.

Implementation must remain bounded by `SLICE_3_5_REFERRAL_NETWORK_AND_ACQUISITION.md`, the current organization/security/privacy/geography authorities, and the existing production abstractions inspected for this recalculation.

## Required production reuse

Slice 3.5 extends rather than replaces:

- the canonical organization identity, active membership/restriction resolution, and `referral.manage` server permission;
- Slice 3.1 versioned transactional event/template mapping, delivery evidence, replay suppression, deterministic retry, operations visibility, and provider-independent communications ports;
- Slice 2.9 signed, expiring, single-subject acquisition context and bind/resume contracts, including the existing `referral` acquisition kind;
- the OPEN/Profile Complete/marker activation gates and account-only participant runtime;
- Slice 3.2 privacy-safe organization discovery and map/list/detail projection;
- Slices 3.3 and 3.4 confirmed organization profile, preference, credential, media, and location projections; and
- the B3/B6a spatial and Operational Workspace primitives, including real-record-only relationship paths.

No Firebase UID, email address, route parameter, acquisition token, browser state, client-provided organization id, visual path, commercial status, or prior delivery event grants referral authority.

## Binding implementation decisions

### Organization-owned referral aggregate

A referral is one stable organization-owned aggregate with a sending organization and either a current recipient organization or one external intended recipient. It is not a personal direct message, public post, endorsement, contract, sale, credibility event, or verified outcome.

The aggregate records a controlled reason/need category, participant-authored summary, urgency, preferred contact method, optional opportunity/context reference only when that referenced object is authorized and real, purpose, the exact minimum data approved for transfer, consent evidence where any nonpublic data is shared, sender and recipient actors as they become authoritative, a correlation id, current version, expiry, timestamps, and append-only status history.

Use an explicit lifecycle:

```text
draft → sent → accepted → contacted → closed
              ↘ declined
sent/accepted/contacted → expired
```

Drafts are visible only to the sending organization. `sent` is consequential and immutable as evidence; later state changes append history and increment the current version. A recipient may accept or decline once while current. An authorized participant on either involved organization may record permitted follow-up/contact state; closure may record only a controlled, participant-reported, non-verified outcome category. Sent, accepted, contacted, closed, and expired meanings remain distinct. No transition may infer an endorsement, response promise, sale, contract, successful service, verified outcome, or credibility effect.

Every consequential command re-resolves current organization authority, validates the expected aggregate version and allowed transition, uses a stable idempotency key, and transactionally persists the current aggregate, append-only event/history, organization audit evidence, and command receipt. Replays return the prior result only after current authority succeeds. Stale versions fail with recoverable current-state guidance.

### Consent and minimum necessary sharing

The sender must identify one purpose and one recipient before sending. Public organization facts may be referenced without making the referral public. Any selected nonpublic sender, subject, contact, or context field requires an explicit, versioned consent acknowledgment that names the recipient and previews the exact data to be shared. Free-form summaries cannot silently import private profile, evidence, document, credential, location, member, administrator, or communications fields.

Sender and recipient projections are separate minimum-necessary typed outputs. Only the two involved organizations may read a sent referral. A draft or external-recipient referral never leaks through Network discovery or public APIs. Private source records, exact private coordinates, evidence assets, internal notes, membership details, email-delivery metadata, acquisition secrets, and unrelated profile fields are excluded. Recipient acceptance does not expand access beyond the referral projection.

One command addresses one recipient. Bulk recipients, distribution lists, automated matching blasts, scraping-derived addresses, referral fees, and unsolicited mass messaging are out of scope. Server-side throttling and deterministic recipient/referral correlation must prevent accidental duplicate send or invitation fan-out.

### Existing and external recipients

For an existing recipient organization, the referral targets its stable organization id and notifies only through the approved Slice 3.1 transactional communications boundary. Delivery state does not change referral state beyond recording notification evidence; a delivery failure leaves truthful retry/recovery state and never fabricates receipt or acceptance.

For an external recipient, the sender supplies a legitimate intended-recipient email and display label for the bounded invitation only. `ACQ-006` requires a real persisted `REF-001` referral before issuing one expiring referral acquisition context and one versioned transactional invitation correlated to that referral and normalized recipient. Retries reuse the same referral, acquisition context, invitation event, and communication intent rather than creating duplicates.

Authentication binds the acquisition context to the user through the existing secure server flow. Registration and activation must still establish a legitimate user, organization relationship, required policy acceptance, Profile Complete state, real marker, orientation/first-value state, and OPEN status. Only after those gates and an explicit recipient-organization claim may the server attach the recipient organization to the referral. The participant then lands on that exact referral with the permitted recipient view; the token never auto-accepts the referral or grants organization membership, OPEN, profile, geography, marker, or referral authority.

Expired, already-bound-to-another-user, recipient-mismatched, revoked, consumed-for-another-subject, or superseded acquisition context fails closed with a restart/recovery path. The external email is not a public referral field and must be minimized after legitimate organization attachment subject to retention policy.

### First-use education

Before an actor can perform their first consequential send, `EDU-014` presents a server-backed, accessible education acknowledgment explaining:

- the referral's purpose and organization ownership;
- the named recipient;
- the exact public and nonpublic data that will be shared;
- why consent is required and how it is recorded;
- that sending, delivery, acceptance, contact, and outcome are different states; and
- what the sender and recipient can do next, including decline, expiry, recovery, and withdrawal limits.

The acknowledgment is versioned, organization/actor attributed, auditable, and checked again by the send command. It remains available after first use. It may not be satisfied by a client-only dismissal, and it does not authorize a referral independently of the current command.

### Spatial and participant experience

Use a dedicated referral workspace within the shared participant shell. Provide synchronized list, detail, and spatial views where both involved organizations have eligible privacy-safe marker projections. A path renders only for a real sent-or-later referral visible to the current organization and only between approved projected anchors. An external, declined, expired, unavailable, or geography-suppressed endpoint has a truthful textual alternative and no fabricated endpoint/path.

Path state has explicit text, non-color semantics, restrained one-time motion, static settled state, and reduced-motion behavior. Growth Green is not used merely for send, delivery, acceptance, or contact. Empty, draft, pending, declined, expired, delivery-failure, permission, stale-version, unavailable-map, and recovery states use the Content and Messaging System and one clear next action.

All platform-owned copy ships in `en-US`, Spanish, French, Italian, and German. Participant-authored summaries, names, contact details, and referral context remain verbatim and are not automatically translated. Desktop, intermediate, and mobile layouts require keyboard operation, visible focus, semantic state/status, screen-reader equivalents, reduced motion/transparency, and no horizontal overflow.

## Authorization and projection requirements

- Send, update, contact, close, invitation, and education commands require a current authenticated session, active matching organization membership, no blocking restriction, and `referral.manage`.
- Recipient accept/decline requires current `referral.manage` authority for the exact attached recipient organization; possession of an invitation or acquisition token is insufficient.
- Organization A cannot read or mutate an unrelated Organization B referral. The sender cannot act as the recipient and the recipient cannot edit sender-authored context.
- Direct Firestore client reads/writes remain default-deny for referral aggregates, history/events, commands, education acknowledgments, invitation correlation, and private projections.
- Commercial status, Founding recognition, sponsorship, membership tier, or payment cannot change permission, consent, lifecycle, discovery, path, delivery, acquisition, or outcome treatment.

## Acceptance evidence required before completion

Automated, emulator, and configured-browser acceptance must prove:

1. the complete controlled state machine, expected-version enforcement, expiry, append-only history/audit, retry/idempotency, and reported-non-verified outcome boundary;
2. authorized sender and recipient behavior plus wrong-user, wrong-organization, missing-permission, inactive/restricted/stale-context, token-only, and direct-client denial;
3. purpose, recipient, consent, exact-data preview, private-field suppression, projection minimization, and no public referral leakage;
4. existing-recipient communications correlation, delivery retry/failure recovery, and no duplicate communication or referral records;
5. external invitation issuance from a real referral, signed acquisition continuity through legitimate activation, exact-referral landing, recipient attachment, expiry/mismatch/replay denial, and no policy/Profile Complete/marker/OPEN bypass;
6. first-use education server acknowledgment before initial send and continued availability afterward;
7. real permitted path/list/detail parity, fixed privacy-safe endpoints, textual alternatives, non-color status, restrained/reduced motion, and no outcome/credibility implication;
8. loading, empty, validation, success, decline, expiry, permission, stale, communication-failure, recovery, responsive, accessibility, five-locale, and clean-console behavior; and
9. configured real-environment acceptance with disposable organizations, users, referral, communication, acquisition, and related records followed by exact and organization-scoped zero-residual cleanup.

Run focused validators and emulators plus the canonical full local gate:

```bash
npm run check
```

Production CI must pass on the exact PR head and again on merged `main` before dependency authority is recalculated.

## Explicit non-scope

This authority does not permit managed paid referrals, referral fees or payouts, bulk/mass messaging, public referral feeds, provider routing (`REF-006`), provider application or approval, teaming or RFx workflows, CRM replacement, automatic translation of participant content, verified outcomes, credibility changes or badges, Organization Verification, arbitrary map endpoints, B6b convergence, Wave 4, Intelligence Dark, Presentation Mode, production sound, or haptics.

Slice 3.5 implementation and acceptance are recorded in `docs/architecture/WAVE_3_SLICE_3_5.md`. PR #130 passed exact-head production CI run `31294774153` on `17e8e66fc11e29bc125bc739d5fad7141da14244`, merged at `516c49627aeff637b02982218f0682c1eea436ad`, and post-merge `main` CI run `31294884142` passed. Slice 3.6 was then recalculated and separately authorized; no later slice was begun by this authority.
