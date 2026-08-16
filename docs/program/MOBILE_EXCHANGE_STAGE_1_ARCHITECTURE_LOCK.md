# Mobile Exchange Stage 1 — Architecture Lock

**Status:** COMPLETE — INTEGRATED

**Control Room owner:** 00 — RFxchange Control Room

**Implementation owner:** 01 — Shared Exchange Platform

**Domain consumers/reviewers:** 02 — Opportunities/RFx; 03 — Intelligence; 04 — Resources; 05 — Referrals

**Packet:** `WP-MOBILE-EXCHANGE-STAGE1-01`

**Activation epoch:** `mobile-exchange-stage1-2026-08-16`

**Immutable activation base:** `0b23a9f9b49468aab12609dea6116e1409c925fe`

**Control Room PR:** `#217`

**Lane 01 candidate:** PR `#218`, exact reviewed head `e6eaa7207b5610ab88f1847b2b7142335c713e7f`

**Candidate build:** production-ci `#1504` / run `31971663240` — SUCCESS

**Integrated main:** `9b97b37365b0e3cab1292cccb86ffe248d5734a2`

**Stage 1 exit gate:** SATISFIED

**Stage 2 authorization:** GRANTED

## 1. Purpose and closeout

This packet locked the shared mobile architecture required by `MOB-01 Mobile Experience Authority` without implementing Stage 2 production presentation. The shared contracts are now integrated on `main` through PR #218.

The controlling references remain:

- [`MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md`](MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md);
- [`../reference/screenshots/rfxchange-mobile-composition-reference.jpg`](../reference/screenshots/rfxchange-mobile-composition-reference.jpg);
- [`../reference/screenshots/README.md`](../reference/screenshots/README.md).

The governed permanent lens order is:

```text
Opportunities/RFx | Resources | Intelligence | Referrals
```

Account/Menu remains a utility, not a fifth lens.

## 2. Locked composition

Stage 2 must implement the already-established mobile Exchange composition rather than reinterpret it:

- map-first primary canvas;
- floating search/filter over the map;
- persistent four-lens bottom navigation;
- three-state `peek | partial | expanded` draggable sheet with a non-gesture control path;
- exactly four active-lens actions at the sheet top;
- Zillow-style result/business cards inside the sheet;
- optional logo/image/video media;
- record favorites and record-specific actions separate from the sixteen lens actions;
- marker/card/keyboard/detail focal-object synchronization;
- expanded detail without abandoning Exchange context;
- progressive availability with unavailable actions remaining individually visible/disabled as governed;
- map, selection, query, result-set/cursor, sheet, scroll, detail, layer, area, and relationship continuity where meaningful and authorized;
- safe-area, touch-target, keyboard, screen-reader, reduced-motion, software-keyboard, orientation, and resize obligations.

A Menu route does not satisfy persistent bottom navigation. A separate dashboard/list application does not satisfy the shared map/sheet composition.

## 3. Integrated Stage 1 shared contract family

PR #218 integrated the Stage 1 shared architecture on `main` at `9b97b37365b0e3cab1292cccb86ffe248d5734a2`.

The integrated family covers:

- shared mobile shell and persistent bottom navigation;
- three-position bottom sheet and four-position action rail;
- result cards, optional media, favorites, and record actions;
- focal subject identity plus separately keyed associated organization context;
- marker/card/detail identity validation;
- camera, bounds, geography, search/filter/sort, result-set/cursor, list/sheet scroll, and detail continuity;
- scoped, versioned, non-authorizing client continuity and fail-closed reconciliation;
- actual video-source semantics distinct from a poster image;
- per-lens analytical layer identity and domain revalidation;
- generic non-point area/field projection for governed service territory/geography;
- privacy-safe relationship identity/path/no-path projection;
- safe return context and responsive/accessibility policy.

The existing Phase 2 foundations remain controlling for the exact sixteen lens-action identities and positions, action truth, authorization, and progressive availability.

## 4. Final domain review dispositions

All domain lanes reviewed the same exact candidate head `e6eaa7207b5610ab88f1847b2b7142335c713e7f` after the final Lane 01 correction pass.

| Lane | Final disposition | Resolved findings |
| --- | --- | --- |
| 02 — Opportunities/RFx | CONCUR | `MOB1-FIND-02-001`, `MOB1-FIND-02-002`, `MOB1-FIND-02-003` |
| 03 — Intelligence | CONCUR | `MOB1-FIND-03-001` |
| 04 — Resources | CONCUR | `MOB1-FIND-04-001`, `MOB1-FIND-04-002` |
| 05 — Referrals | CONCUR | `MOB1-FIND-05-001`, `MOB1-FIND-05-002` |

No Stage 1 Shared Contract Request remains open.

## 5. Control Room findings

The original Control Room findings `MOB1-FIND-00-001` through `MOB1-FIND-00-006` and `BUILD-FIND-218-001` are resolved by accepted shared corrections and green exact-head CI. The original Codex inline review threads are resolved.

The final candidate preserved:

- four permanent lenses and Account/Menu utility separation;
- frozen `4 × 4 = 16` action registry;
- independent `operational`, `applicable`, and `authorized` facts;
- server-derived protected authority;
- progressive availability;
- tenant/geography/privacy boundaries;
- selected-object and map continuity;
- domain ownership of favorites and business behavior.

## 6. Completion governance

Stage 1 closes as **Implemented — Not Verified / integrated architecture** under the current completion-governance amendment. Independent Acceptance is optional assurance, not a universal prerequisite.

No claim of Lane 06 `Verified` status is made by this packet.

## 7. Stage 1 exit decision

**SATISFIED.**

Basis:

1. exact-head production-ci #1504 succeeded on `e6eaa7207b5610ab88f1847b2b7142335c713e7f`;
2. Lanes 02–05 all returned `CONCUR` on that exact head;
3. every substantive Stage 1 finding has a final shared disposition;
4. Codex inline threads are resolved;
5. PR #218 merged the reviewed contracts to `main` at `9b97b37365b0e3cab1292cccb86ffe248d5734a2`;
6. no mandatory Independent Acceptance gate has been reinstalled.

## 8. Stage 2 authorization

**GRANTED.**

The next program step is **Stage 2 — Restore the Shared Mobile Composition**. Stage 2 may now implement the mobile shell/presentation against the integrated shared contracts, while domain lanes consume those contracts and continue to own domain projections/business behavior.

Stage 2 must not reopen the architecture into competing shells, private lens navigation, private sheets, private selection stores, or domain-specific card frameworks. Any genuinely missing generalized shared capability discovered during implementation must use the installed shared-contract mechanism rather than a private workaround.
