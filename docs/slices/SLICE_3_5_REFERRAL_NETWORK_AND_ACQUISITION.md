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
- `docs/context/ACQUISITION_AND_RETENTION.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/context/CREDIBILITY_SYSTEM.md`
- canonical tracker/dependency map
- merged Slice 3.1 communications and Slice 2.9 acquisition-context contracts
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

- A referral is organization-owned activity, not a personal DM.
- `REF-001` creates a legitimate referral from an authorized organization actor to a defined recipient/purpose.
- `REF-004` preserves need/reason, sender, recipient, urgency, preferred contact method and relevant opportunity/context.
- `REF-005` requires clear purpose/consent for nonpublic information and transfers only the minimum necessary information.
- `REF-002` notifies the recipient and supports explicit accept/decline without implying endorsement or sale.
- `REF-003` uses an explicit lifecycle covering proposed/sent, accepted/declined, contact/follow-up and closed/outcome states as applicable; later verified outcomes remain out of scope.
- `EDU-014` explains why the referral is being sent, what data is shared, to whom, consent and what happens next.
- `ACQ-006` may invite an external recipient, preserve the specific referral through registration/activation, and land the legitimate new participant on that referral after required gates.

## Acceptance intent

- authorized organizations can send referrals with structured context;
- nonpublic data cannot be shared without required consent and recipient purpose;
- recipient can accept/decline and both sides see permitted lifecycle state;
- external invitees receive a versioned transactional invitation and resume the exact referral after legitimate account/organization activation;
- retries do not create duplicate referrals/invitations;
- cross-organization/private referral details remain protected.

## Expected implementation qualities

Explicit referral state machine, immutable event/history evidence, server-side organization authorization, communication correlation, idempotency, privacy projections, accessible first-use education, and emulator/security tests for wrong-user/wrong-org/replay/consent failures.

## Explicit non-scope

Do not implement managed paid referrals, referral fees, public provider routing (`REF-006`), credibility calculations/outcome verification, admin abuse/dispute tooling, CRM-style paid pipeline management or mass unsolicited referral messaging.

## Exit checkpoint

Organizations can make and receive useful, consented, auditable referrals—and a referral can naturally acquire a new participant without bypassing activation.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.6.