# Wave 4 Slice 4.6 — Fit, Go/No-Go and pursuit

**Four-Lens status: Implemented — Not Verified. Independent Acceptance pending.**

## Reconciliation provenance

This is the preserved Slice 4.6 candidate reconciled under Control Room work packet `WP-RFX-46-RECONCILE`; it is not a replacement implementation.

- activation base: `347015829d64cfc596cdef1010601d8bda447818`
- activation epoch: `rfx-46-reconciliation-2026-08-12`
- preserved candidate entering reconciliation: PR #171 head `e70413e2e45db4b75517376acdc0700f9838a963`
- reconciliation authority: Control Room PR #173 and the installed Four-Lens Program
- authorized Feature IDs only: `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004`, `RSP-006`

The exact reconciled head is the PR #171 head containing this document and is recorded in the PR/Control Room handoff after exact-head validation and fresh review. Lane 06 remains separately frozen until that handoff.

## Result

The candidate implements `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004` and `RSP-006` at the boundary defined by `docs/slices/SLICE_4_6_EXECUTION_AUTHORITY.md`.

A currently authorized responder organization can open a real permitted published opportunity in an Operational Workspace, inspect exact canonical capability alignments and explicit gaps, record its private six-dimension assessment and choose one organization-owned Watch, Pursue or Decline state. This is decision support, not qualification, eligibility, endorsement, profitability or award prediction.

## Deterministic fit and privacy

- Publication persists a trusted-server issuer key and stable requirement index beside the minimized responder payload.
- Every fit read and pursuit write binds the persisted responder projection to immutable publication evidence. The stored payload itself is re-hashed and must match the governed projection digest before requirements, deadline, value, term or location may be consumed. Missing legacy indexes are derived from the immutable publication snapshot; present inconsistent indexes or payloads fail closed.
- Participant publication, public opportunity and discovery API/HTML envelopes omit server-only fit indexes and audit metadata.
- Fit policy v1 requires the same canonical AMACS capability identifier and release on a current non-suspended, non-legacy organization claim. One exact alignment permits `Potential Match`; missing and unconfirmed requirements remain gaps. Saved-search matching remains only `Discovered`, and `Invited` remains unavailable.
- Geography is a separate controlled service-area observation. No score, percentage, ranking, probability or system Go/No-Go is computed.
- Immutable fit snapshots identify exact opportunity version/digest, organization capability-input digest and policy version.

## Assessment, stale review and pursuit authority

The private organization-owned assessment covers fit, eligibility review, capacity, economics, geography and gaps using explicit participant states and bounded verbatim notes. Stable requirement-linked gap assessments retain participant-confirmed `open`, `acknowledged` or `deferred` status; only a current authoritative profile recomputation can derive `resolved-by-current-profile`.

One pursuit record exists for `(organization, opportunity reference)` in `watch | pursue | decline`; actor user and membership are evidence, not ownership. Fit inspection uses the current organization-participation boundary without treating `response.create` as a read permission. Assessment, gap and pursuit mutations require current consequential authority.

When a persisted pursuit was reviewed against an older fit snapshot, opportunity projection, capability input or fit policy, the workspace is stale. The retained assessment remains visible/editable for review, but consequential Watch/Pursue/Decline controls remain disabled until the participant explicitly reconfirms the current fit inputs. The server independently rejects a stale write without that explicit reconfirmation, so client state cannot bypass the review requirement. Reconfirmation is review evidence rather than business intent and therefore does not change historical command fingerprints or break exact replay of previously committed commands.

Persistence also rechecks membership, restrictions, explicit `response.create` permission, current open publication/version/digest, issuer separation, released geography and current organization capability/service-geography input at the trusted boundary. Expected versions and stable command fingerprints provide conflict and exact replay behavior; each command receipt retains its exact committed pursuit result.

When the acting user has an active Slice 4.5 bookmark, pursuit persistence removes that personal watch atomically. Other users' bookmarks remain distinct and non-authorizing. No response aggregate, issuer notification, team, invitation or submission is created.

## Workspace and recovery

`/opportunities/[reference]/assess` is a bounded Operational Workspace inside the persistent participant shell. It presents source attribution, published facts, continuous requirement observations, typed gaps, assessment controls and Watch/Pursue/Decline actions. It preserves validated discovery return context and truthfully states that response construction/submission is unavailable.

Stale opportunity, capability profile, fit snapshot or pursuit versions fail with refresh-and-review recovery. Issuers cannot assess their own opportunity. Withdrawn/unreleased/unsupported opportunities and missing/inconsistent governed fit evidence render bounded unavailable/retry recovery rather than root application failure or fabricated fit.

## Preserved pre-reconciliation evidence

The preserved PR #171 history already contains focused tests, Firestore RFx emulator acceptance, configured-browser acceptance across five locales/mobile/keyboard/reduced motion, accessibility semantics, privacy projection checks, exact historical command replay, gap persistence/resolution, authority-race handling and clean browser-console evidence. That evidence remains provenance for the candidate history; it does not by itself verify the reconciled exact head under the Four-Lens Program.

Fresh exact-head CI, emulator, configured-browser, accessibility, five-locale validation and fresh code review are required by `WP-RFX-46-RECONCILE` before the Lane 02 handoff may be reported acceptance-pending.

## Four-Lens accounting and stop boundary

The canonical Master Build Tracker remains **438 total · 170 Done · 268 Not Started**, with Wave 4 RFx Core **18/41**. The five Slice 4.6 tracker Feature IDs remain unchecked until Independent Acceptance. Their Four-Lens requirement records are `Implemented — Not Verified`, with Independent Acceptance as the acceptance lane.

Lane 02 does not promote these features to `Verified`, does not change tracker completion, and does not activate Lane 06. Slice 4.7 gap-resolution/teaming runtime, Slice 4.8 response runtime, Slice 4.9 submission/handoff, Slice 4.10 education and later RFx lifecycle work remain outside this reconciliation.
