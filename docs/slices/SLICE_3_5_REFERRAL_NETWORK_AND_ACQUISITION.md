# Slice 3.5 — Referral Network & Referral Acquisition

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `REF-001` — Send business referral
- `REF-002` — Receive and accept/decline referral
- `REF-003` — Basic referral status tracking
- `REF-004` — Structured referral context
- `REF-005` — Consent/minimum necessary sharing
- `EDU-014` — First referral education
- `ACQ-006` — Invite non-member to receive referral

## Objective

Create the first complete organization-to-organization Network transaction: a legitimate referral carrying useful context and explicit consent, received through a controlled lifecycle by an existing or newly acquired participant.

## Must read

- `/AGENTS.md`
- `docs/context/README.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/context/CREDIBILITY_SYSTEM.md`
- `docs/brand/README.md`
- `docs/brand/BRAND_GATE_B0_RECONCILIATION.md`
- `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md`
- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`
- `docs/brand/MOTION_SYSTEM.md`
- `docs/brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- `docs/design/MAP_VISUAL_SYSTEM.md`
- canonical tracker/dependency map
- merged Slice 3.1 communications and Slice 2.9 acquisition-context contracts
- merged Slices 3.2–3.4 organization/discovery/profile contracts
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

- A referral is organization-owned activity, not a personal DM.
- `REF-001` creates a legitimate referral from an authorized organization actor to a defined recipient/purpose.
- `REF-004` preserves need/reason, sender, recipient, urgency, preferred contact method and relevant opportunity/context.
- `REF-005` requires clear purpose/consent for nonpublic information and transfers only the minimum necessary information.
- `REF-002` notifies the recipient and supports explicit accept/decline without implying endorsement or sale.
- `REF-003` uses an explicit lifecycle covering proposed/sent, accepted/declined, contact/follow-up and closed/outcome states as applicable; later verified outcomes remain out of scope.
- `EDU-014` explains why the referral is being sent, what data is shared, to whom, consent and what happens next.
- `ACQ-006` may invite an external recipient, preserve the specific referral through registration/activation and land the legitimate new participant on that referral after required gates.

## Brand and interaction rules

- This slice is the first legitimate source for a live referral golden path. A path may render only from a real permitted referral record/event or a clearly labeled test fixture.
- Referral state must be shown with explicit labels and text equivalents; color or animation alone is insufficient.
- A sent, accepted or contacted referral remains an activity/connection state, not a sale, verified outcome, endorsement or credibility event.
- Growth Green may not be used merely because a referral was sent or accepted. Use it only for a later appropriate confirmed outcome state.
- Path motion is restrained, interruptible and reduced-motion compatible, then settles into a static relationship state.
- Empty, stalled, declined, expired, permission and recovery states follow the Content and Messaging System.
- External invitation messaging uses versioned Slice 3.1 communications and does not fabricate acceptance or activation.

## Acceptance intent

- authorized organizations can send referrals with structured context;
- nonpublic data cannot be shared without required consent and recipient purpose;
- recipient can accept/decline and both sides see permitted lifecycle state;
- external invitees receive a versioned transactional invitation and resume the exact referral after legitimate account/organization activation;
- retries do not create duplicate referrals/invitations;
- cross-organization/private referral details remain protected;
- referral paths correspond to real permitted state and have accessible textual equivalents;
- visual/copy treatment does not imply sale, endorsement, credibility or verified outcome.

## Expected implementation qualities

Explicit referral state machine, immutable event/history evidence, server-side organization authorization, communication correlation, idempotency, privacy projections, accessible first-use education, shared path/status primitives and emulator/security tests for wrong-user, wrong-org, replay, expiry and consent failures.

## Explicit non-scope

Do not implement managed paid referrals, referral fees, public provider routing (`REF-006`), credibility calculations/outcome verification, admin abuse/dispute tooling, CRM-style paid pipeline management, mass unsolicited referral messaging, Intelligence Dark, Presentation Mode, production sound or haptics.

## Exit checkpoint

Organizations can make and receive useful, consented and auditable referrals—and a referral can naturally acquire a new participant without bypassing activation or overstating the connection as an outcome.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.6.
