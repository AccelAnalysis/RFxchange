# Mobile Exchange lens migration evidence

This directory records builder evidence for `WP-MOBILE-EXCHANGE-LENS-MIGRATION-01`, covering `MOB36-LENS-001` and `MOB36-MIGRATION-001`. The packet is implemented on branch `codex/mobile-exchange-lens-migration` from activation base `3455eaefe5978eeb713b161c139f9df1b0c7bfc7`, reconciled with the narrow consumer ownership amendment merged as `b291c81fdc078962cd4967d19b93e67318741866` and the existing referral-workflow producer amendment merged as `0ca6d8bbf034b1efcff4eb8132426b7b46662401`.

The implementation candidate is identified as `SELF` until the packet PR supplies its immutable exact-head SHA. The first post-merge Control Room reconciliation must replace that lifecycle state with the final candidate, merge SHA, exact-head CI, and post-merge CI before activating a dependent packet.

## Result

- Permanent authenticated order: `Opportunities/RFx | Resources | Intelligence | Capabilities`.
- Capabilities is structurally present but truthfully unavailable until the authorized Stage 4 Capabilities packet composes a real participant runtime.
- Referrals remains an authenticated persistent Account/Menu utility and governed workflow; it is never emitted or marked current as a permanent lens.
- The current action registry emits exactly the sixteen immutable successor IDs and contextual own/external labels in five locales.
- Stage 2 IDs, locale catalogs, control documents, and Phase 2 evidence remain unchanged as historical provenance. A frozen predecessor fixture keeps the Stage 2 tuple and action identities testable.
- Actual scoped `rfxchange:participant-spatial:v1:` keys and the active pointer migrate to v2. Generic fourth-lens state moves to `lensState.capabilities`, referral workflow continuity moves separately to `workflowState.referrals`, and v2 serialization emits no `lensState.referrals`.
- Malformed, cross-scope, and unknown legacy state resets to a valid scoped v2 fallback before the active pointer is published. A valid v1 context remains recoverable when a corrupt v2 value exists.
- A bare `/referrals` visit is treated as legacy fourth-lens intent only when the scoped v1 migration recorded that exact intent; the marker is consumed once and redirects to the successor Capabilities lens. Explicit referral-management and specific-record links stay in the referral workflow and never become capability authority.

The migration changes optional, non-authorizing session presentation state only. It does not mutate referral records, repositories, lifecycle, consent, authorization, audit history, Firestore data, or tracker state. Rollback may safely reset the v2 session context to the existing server-authorized default; no authoritative domain record requires reversal.

## Provenance

- Historical Stage 2 final candidate: `704718a4611e80f01937d2501e7621319bfd6353`
- Historical Stage 2 merge: `1fbf38e71747ac90c2f285e4934b22ea26312bec`
- Historical exact-head/post-merge CI: `32090477890` / `32090896211`
- Successor authority merge: `3455eaefe5978eeb713b161c139f9df1b0c7bfc7`
- Migration ownership amendment merge: `b291c81fdc078962cd4967d19b93e67318741866`
- Referral-workflow producer amendment merge: `0ca6d8bbf034b1efcff4eb8132426b7b46662401`
- v1 fixture: `v1-context-fixture.json` (digest recorded in `VERIFICATION.md`)

This is builder/repository evidence. No optional independent assurance event occurred, so the assurance state is **Implemented — Not Verified**.
