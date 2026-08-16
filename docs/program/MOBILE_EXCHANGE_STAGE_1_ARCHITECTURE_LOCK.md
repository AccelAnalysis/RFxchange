# Mobile Exchange Stage 1 — Architecture Lock

**Status:** ACTIVE — CANDIDATE CORRECTION AND CROSS-LENS REVIEW

**Control Room owner:** 00 — RFxchange Control Room

**Implementation owner:** 01 — Shared Exchange Platform

**Domain consumers/reviewers:** 02 — Opportunities/RFx; 03 — Intelligence; 04 — Resources; 05 — Referrals

**Packet:** `WP-MOBILE-EXCHANGE-STAGE1-01`

**Activation epoch:** `mobile-exchange-stage1-2026-08-16`

**Immutable activation base:** `0b23a9f9b49468aab12609dea6116e1409c925fe`

**Control Room PR:** `#217`

**Lane 01 candidate:** PR `#218` at `f41b791644c6a3b372e28a1db7c32d16c1a25714`

**Candidate build:** production-ci `#1494` — SUCCESS

**Stage 1 exit gate:** NOT SATISFIED

**Stage 2 authorization:** NOT GRANTED

## 1. Purpose

This packet activates and coordinates the architecture-lock work required by `MOB-01 Mobile Experience Authority`. It does not redesign the established mobile Exchange and does not authorize Stage 2 production UI.

The controlling product/composition reference is installed on merged `main`:

- [`MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md`](MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md);
- [`../reference/screenshots/rfxchange-mobile-composition-reference.jpg`](../reference/screenshots/rfxchange-mobile-composition-reference.jpg);
- [`../reference/screenshots/README.md`](../reference/screenshots/README.md).

Historical labels in the visual source are non-authoritative. The governed lens order is:

```text
Opportunities/RFx | Resources | Intelligence | Referrals
```

Account/Menu is a utility, not a fifth lens.

## 2. Locked composition

Stage 1 contracts preserve:

- map-first primary canvas;
- floating search/filter;
- persistent bottom four-lens navigation;
- peek/collapsed, partial, and expanded sheet positions;
- exactly four active-lens action positions at the sheet top;
- Zillow-like result/business cards inside the sheet;
- optional logo, image, or video media;
- record favorites and record-specific actions;
- synchronized marker, card, keyboard, and detail focus;
- expanded detail without abandoning Exchange context;
- progressive availability with individually disabled actions;
- applicable map, selection, query, sheet, scroll, and detail continuity;
- safe-area, touch-target, keyboard, screen-reader, reduced-motion, orientation, and non-gesture requirements.

A Menu route does not satisfy persistent bottom navigation. Technical retrievability does not replace the governed sheet/card composition.

## 3. Compatibility foundation

Stage 1 extends, and must not replace:

1. `participant-lens-registry.ts` for four-lens identity/order and utility separation;
2. `exchange-room-actions.ts` for the frozen sixteen actions and independent `operational`, `applicable`, `authorized`, disabled-presentation, and handler facts;
3. `participant-spatial-context.ts` for scoped, versioned, non-authorizing continuity;
4. `EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md` for `4 lenses × 4 action positions`;
5. merged PR #191 and PR #212.

Stage 1 must not weaken lens-controller behavior, the sixteen-position registry, server authorization, progressive availability, selected-object continuity, map continuity, or tenant/geography/privacy boundaries.

## 4. Lane 01 bounded assignment

Lane 01 owns one shared family covering shell, persistent bottom navigation, three-position sheet, four-position lens action rail, cards, media, favorites, record actions, selected-object state, map projection, detail/safe-return state, and versioned continuity/reconciliation.

Where applicable, it represents:

- active lens;
- focal selected organization or record;
- associated organization context without collapsing distinct record identity;
- selected marker;
- camera and bounds;
- geography and validation source;
- search, filters, sort, result-set identity, opaque cursor, and scroll positions;
- sheet snap point;
- detail and return context;
- versioned session/participant/membership/viewer-organization/geography scope;
- fail-closed selected-object reconciliation.

The existing registry remains the source for exactly four active-lens positions. Record actions remain separate. Client continuity is presentation state only and never grants protected authority.

### Stop boundary

This packet does **not** authorize React/JSX, CSS, production rendering, map renderer changes, routes, domain handlers, lens-specific behavior, changes to the sixteen actions, tracker arithmetic, Stage 2, or mandatory Independent Acceptance.

## 5. Current Lane 01 candidate

PR #218 currently changes only:

- `src/application/participant/mobile-exchange-contracts.ts`;
- `src/application/participant/mobile-exchange-continuity.ts`;
- `test/mobile-exchange-stage1-contracts.test.mjs`;
- `test/mobile-exchange-stage1-continuity.test.mjs`;
- `docs/architecture/MOBILE_EXCHANGE_STAGE1_CONTRACTS.md`.

The candidate remains `Implemented — Not Verified`. Exact-head production-ci #1494 succeeded at `f41b791644c6a3b372e28a1db7c32d16c1a25714`.

It now provides scoped continuity, typed invalidation, selected-object narrowing, safe return context, responsive/accessibility policy, and focused tests. It also corrects the architecture record so Independent Acceptance is no longer a universal prerequisite. These are bounded Stage 1 improvements, not Stage 2 UI.

## 6. One-candidate domain review protocol

Lanes 02–05 review the same exact Lane 01 PR head through GitHub:

```text
MOB1-DOMAIN-REVIEW
lane: 02 | 03 | 04 | 05
candidate-pr: 218
candidate-sha: <exact head>
disposition: CONCUR | FINDING
contracts-reviewed: <names>
representative-domain-records: <record kinds checked>
shared-findings: <finding IDs or none>
domain-notes: <domain facts that do not request private shared UI>
```

A concurrence applies only to the exact SHA and named surfaces. A later head requires renewed review for changed surfaces; unchanged surfaces may carry forward only by explicit SHA/diff reference. Conversation relay is not acceptance.

## 7. Findings and dispositions

Findings use `MOB1-FIND-<lane-number>-<sequence>`. Missing generalized capabilities that cannot be handled as candidate corrections use `SCR-<lane>-MOB1-<sequence>` on or linked from PR #218.

Allowed dispositions are `accepted-shared-correction`, `reuse-existing-shared-seam`, `domain-fact-no-shared-change`, `deferred-explicitly-approved`, `rejected-conflicts-with-authority`, and `superseded-by-candidate-sha`.

## 8. Current findings

### Control Room

| Finding | State at `f41b7916…` | Disposition / remaining correction |
| --- | --- | --- |
| `MOB1-FIND-00-001` | Resolved | `accepted-shared-correction`: mandatory Independent Acceptance wording removed. |
| `MOB1-FIND-00-002` | Partially addressed; open | Accessibility/responsive policy and tests exist. Add opaque result-set identity/cursor and explicit internal sheet/detail scroll state. |
| `MOB1-FIND-00-003` | Open | Enforce focal marker/card/detail subject parity and validate card detail identity. |
| `MOB1-FIND-00-004` | Open | Validate every action-rail projection against the canonical action ID for its lens and position. |
| `MOB1-FIND-00-005` | Open | Do not label browser-restored geography server-authoritative before revalidation. |
| `MOB1-FIND-00-006` | Open | Use the canonical supported-locale disabled-explanation key contract. |
| `BUILD-FIND-218-001` | Resolved | Exact-head production-ci #1494 succeeded. |

All four Codex threads remain unresolved and current.

### Lane 02 — Opportunities/RFx

| Finding | State at `f41b7916…` | Remaining correction |
| --- | --- | --- |
| `MOB1-FIND-02-001` | Open | Keep focal opportunity identity distinct from associated issuer-organization identity. |
| `MOB1-FIND-02-002` | Partially addressed; open | Scope/invalidation and negative tests exist; final disposition depends on resolving restored-geography authority. |
| `MOB1-FIND-02-003` | Open | Represent actual optional video separately from its poster image. |

No Shared Contract Request is open because these remain bounded corrections to PR #218.

## 9. Domain review state

| Lane | Current disposition | Review SHA | Required next review |
| --- | --- | --- | --- |
| 02 — Opportunities/RFx | FINDING | `3c67ef3dffeaa60aef761debb6cf76ea1c807789` | Re-review `f41b7916…`; prior findings remain applicable. |
| 03 — Intelligence | Not submitted | — | Review exact final head. |
| 04 — Resources | Not submitted | — | Review exact final head. |
| 05 — Referrals | Not submitted | — | Review exact final head. |

## 10. Convergence ledger

| Contract | Current state | Open conflict/review gap |
| --- | --- | --- |
| shell | Candidate present | Final-head reviews incomplete |
| bottom navigation | Candidate present | Final-head reviews incomplete |
| bottom sheet | Partially represented | `MOB1-FIND-00-002` |
| action rail | Candidate present | `MOB1-FIND-00-004` |
| card | Candidate present | `MOB1-FIND-00-003`, `MOB1-FIND-02-001` |
| media | Candidate present | `MOB1-FIND-02-003` |
| favorite | Candidate present | Final-head reviews incomplete |
| selected-object state | Candidate present | `MOB1-FIND-00-003`, `MOB1-FIND-02-001` |
| map projection | Candidate present | `MOB1-FIND-00-003`, `MOB1-FIND-00-005` |
| detail | Partially represented | `MOB1-FIND-00-002`, `MOB1-FIND-00-003` |
| continuity/invalidation | Partially represented and tested | `MOB1-FIND-00-002`, `MOB1-FIND-00-005`, `MOB1-FIND-02-002` |
| localization | Invalid namespace remains | `MOB1-FIND-00-006` |
| completion governance | Resolved | None |

## 11. Exit gate

A corrected candidate may retain `Implemented — Not Verified` when the shared family is complete, canonical actions remain preserved, record actions stay separate, focal/associated identities are truthful, continuity and responsive/accessibility obligations are represented and tested, exact-head CI passes, Lanes 02–05 review the final exact head, every substantive finding has a durable disposition, and no material unresolved conflict remains.

Independent Acceptance is optional assurance, not a universal Stage 1 completion gate.

The Stage 1 exit gate is **not satisfied**. Five Control Room findings remain open or partially addressed, three Lane 02 findings remain open or partially addressed, four Codex threads remain unresolved, Lane 02 must re-review the current head, and Lanes 03–05 have not submitted reviews.

## 12. Exact next action

Lane 01 completes the remaining shared corrections on PR #218, records exact-SHA dispositions, and obtains green CI on the final head. Lanes 02–05 then review or re-review that exact head through GitHub. Stage 2 remains unauthorized.