# Wave 4 Slice 4.6 — Fit, Go/No-Go and pursuit

## Result

Slice 4.6 implements `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004` and `RSP-006` at the boundary defined by `docs/slices/SLICE_4_6_EXECUTION_AUTHORITY.md` on baseline `21c4fc080a823ae03f33ae1e58dd2752f317dc67`.

A currently authorized responder organization can open a real permitted published opportunity in an Operational Workspace, inspect exact canonical capability alignments and explicit gaps, record its private six-dimension assessment and choose one organization-owned Watch, Pursue or Decline state. This is decision support, not qualification, eligibility, endorsement, profitability or award prediction.

## Deterministic fit and privacy

- Publication now persists a trusted-server issuer key and stable requirement index beside the unchanged minimized responder payload. The payload digest and exact preview/live substantive parity remain unchanged.
- Participant publication, public opportunity and discovery API/HTML envelopes omit the new server indices. They expose only governed labels, published facts and the responder-specific private explanation.
- Fit policy v1 requires the same canonical AMACS capability identifier and release on a current non-suspended, non-legacy organization claim. One exact alignment permits `Potential Match`; missing and unconfirmed requirements remain gaps. Saved-search matching remains only `Discovered`, and `Invited` remains unavailable.
- Geography is a separate controlled service-area observation. Deadline, value, term and location remain published facts for human review. No score, percent, ranking, probability or system Go/No-Go is computed.
- Immutable fit snapshots identify exact opportunity version/digest, organization capability-input digest and policy version. Current inputs are recomputed on entry and persistence; older assessment is visibly stale until reconfirmed.

## Assessment and pursuit authority

The private organization-owned assessment covers fit, eligibility review, capacity, economics, geography and gaps using explicit participant states and bounded notes. Stable requirement-linked gap assessments retain participant-confirmed `open`, `acknowledged` or `deferred` status; only a current authoritative profile recomputation can derive `resolved-by-current-profile`. One pursuit record exists for `(organization, opportunity reference)` in `watch | pursue | decline`; actor user and membership are evidence, not ownership.

Fit inspection uses the canonical current organization-participation boundary without treating `response.create` as a read permission. Assessment, gap and pursuit controls are visibly read-only when that consequential permission is absent. Every fit read and pursuit transaction binds responder-only issuer/requirement indexes to the immutable publication snapshot: legacy projections derive the canonical indexes, while present inconsistent indexes fail closed. Persistence also rechecks membership, restrictions, explicit `response.create` permission, current open publication/version/digest, issuer separation, released geography and the current organization capability/service-geography digest inside the transaction. Expected versions and stable command fingerprints provide conflict and exact replay behavior; each private command receipt retains its exact committed pursuit result so replay cannot substitute a later mutable version. Commands, fit snapshots, events and audit evidence are append-only and directly inaccessible to clients.

When the acting user has an active Slice 4.5 bookmark, pursuit persistence removes that personal watch in the same transaction. Other users' bookmarks remain distinct and non-authorizing. No response aggregate, issuer notification, team, invitation or submission is created.

## Workspace and recovery

`/opportunities/[reference]/assess` is a bounded Operational Workspace inside the persistent participant shell. It presents source attribution, published facts, continuous requirement observations, typed gaps, assessment controls and Watch/Pursue/Decline actions. It links back to the synchronized discovery selection and truthfully states that response construction/submission is unavailable.

Stale opportunity, capability profile, fit snapshot or pursuit versions conflict with refresh-and-review recovery. Issuers cannot assess their own opportunity. Publications created before Slice 4.6 derive the same fit indices from their immutable publication snapshot after exact reference, version, lifecycle and projection-digest checks; the accepted projection remains immutable. If that trusted source is unavailable or inconsistent, assessment fails truthfully rather than inventing alignment.

## Acceptance evidence

Focused tests prove exact alignment, missing/evidence gaps, legacy/suspended/wrong-release/nonmatching exclusion, deterministic identities/digests, immutable-snapshot validation of present and legacy fit indexes, bounded verbatim assessment notes, participant-confirmed gap statuses, authoritative profile-derived gap resolution, forged-resolution rejection and exact historical command replay after a later pursuit version exists. Published value and term facts remain structured until the active locale formats them, and absence renders as an explicit undecided state; a rejected mutation never changes the current-state label. Firestore acceptance extends the real draft-to-publication flow through responder capability input, immutable fit recording, corrupt-index rejection, transaction-derived legacy indexes, organization pursuit and gap assessment, exact replay, atomic user-watch transition, client denial and zero-residual cleanup. Configured-browser acceptance covers the persistent shell, discovery-to-assessment continuity, read-only assessment controls without management authority, `Discovered` plus `Potential Match` attribution, a version-1 organization `pursue` record, persisted gap acknowledgement after reload, private index/audit-field omission, keyboard/mobile/reduced-motion behavior, five locales and clean console/unhandled-rejection results.

The representative configured run used the merged shell baseline `7e61fd9` and the Slice 4.6 authority baseline `21c4fc080a823ae03f33ae1e58dd2752f317dc67`. It observed zero shell remounts, no root loading takeover, one document-navigation entry, 0 px assessment/mobile overflow, and no console errors or unhandled exceptions. Candidate lens/utility transitions had a 135 ms median and 150 ms p90 in the controlled local run; these measurements are diagnostic evidence, not a production-network promise. The workflow also proves read-only fit visibility with disabled management, permission restoration before pursuit, and exact preservation of validated discovery search/deadline/locality/selection context. Acceptance caught and corrected a Firestore `Timestamp` serialization regression after pursuit refresh by enforcing canonical repository normalization before a Server Component payload reaches the client.

Repository acceptance includes the Slice 4.6 architecture validator, focused tests, Firestore schema/security/repository checks, the RFx emulator, configured-browser acceptance, type checking, lint, production and Functions builds, and the canonical `npm run check`.

## Dependency and stop boundary

Acceptance supports marking only `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004` and `RSP-006` Done. The checkpoint is **438 total · 175 Done · 263 Not Started**, with Wave 4 RFx Core **23/41**.

Slice 4.7 documentation authority becomes eligible only after this runtime is merged and post-merge green. No Slice 4.7 invitation/team runtime, Slice 4.8 response runtime, submission, evaluation, award, outcome, B6c, B6b or Stabilization 2C work was begun.
