# Mobile Exchange Stage 1 — Architecture Lock

**Status:** ACTIVE — CANDIDATE CORRECTION AND CROSS-LENS REVIEW

**Control Room owner:** 00 — RFxchange Control Room

**Implementation owner:** 01 — Shared Exchange Platform

**Domain consumers/reviewers:** 02 — Opportunities/RFx; 03 — Intelligence; 04 — Resources; 05 — Referrals

**Packet:** `WP-MOBILE-EXCHANGE-STAGE1-01`

**Activation epoch:** `mobile-exchange-stage1-2026-08-16`

**Immutable activation base:** `0b23a9f9b49468aab12609dea6116e1409c925fe`

**Control Room PR:** `#217`

**Lane 01 candidate:** PR `#218` at `3c67ef3dffeaa60aef761debb6cf76ea1c807789`

**Candidate build:** production-ci `#1483` — SUCCESS

**Stage 1 exit gate:** NOT SATISFIED

**Stage 2 authorization:** NOT GRANTED

## 1. Purpose

This packet activates and coordinates the architecture-lock work required by `MOB-01 Mobile Experience Authority`. It does not redesign the established mobile Exchange and it does not authorize Stage 2 production UI.

The controlling product/composition reference is already installed on merged `main`:

- [`MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md`](MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md);
- [`../reference/screenshots/rfxchange-mobile-composition-reference.jpg`](../reference/screenshots/rfxchange-mobile-composition-reference.jpg);
- [`../reference/screenshots/README.md`](../reference/screenshots/README.md).

Historical labels in the visual source are non-authoritative. The permanent governed mobile lens order is:

```text
Opportunities/RFx | Resources | Intelligence | Referrals
```

Account/Menu is a utility, not a fifth lens.

## 2. Locked product composition

Stage 1 contracts must preserve the established composition without weakening visual placement into mere reachability:

- map-first primary canvas;
- floating search and filter over the map;
- four permanent lenses persistently thumb-accessible at the bottom;
- draggable sheet with peek/collapsed, partial, and expanded positions;
- exactly four active-lens action positions at the top of the sheet;
- Zillow-like result/business cards inside the sheet;
- optional logo, image, or video media region;
- record favorite/star and record-specific actions;
- marker, card, keyboard, and detail synchronization through one focal selected-object identity;
- expanded detail without abandoning Exchange context;
- progressive availability with individually visible disabled actions;
- applicable map, selection, search/filter, sheet, scroll, and detail continuity across lens changes;
- safe-area, touch-target, keyboard, screen-reader, reduced-motion, orientation, and non-gesture requirements as first-class architecture facts.

A Menu route to a lens does not satisfy persistent bottom navigation. A technically retrievable card does not satisfy the governed sheet/card composition.

## 3. Merged foundations that remain controlling

Stage 1 extends, and must not replace, the merged Exchange Room architecture:

1. `participant-lens-registry.ts` preserves the exact four-lens identity/order and separates Account/Quick Start utilities.
2. `exchange-room-actions.ts` preserves the canonical sixteen action identities and independently projects `operational`, `applicable`, `authorized`, disabled presentation, and a truthful handler.
3. `participant-spatial-context.ts` preserves a scoped, versioned, and non-authorizing continuity context.
4. `EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md` freezes `4 lenses × 4 action positions` and the distinction between lens existence and action availability.
5. PR #191 merged the Phase 2 controller/registry; PR #212 merged the bounded `New Referral` truth correction.

Stage 1 must not weaken current lens-controller behavior, the sixteen-position registry, server-derived authorization, progressive availability, selected-object continuity, map continuity, or tenant/geography/privacy boundaries.

## 4. Lane 01 bounded assignment

Lane 01 owns one shared contract family conceptually covering:

- `MobileExchangeShell`;
- `MobileLensNavigation`;
- `ExchangeBottomSheet`;
- `LensActionRail`;
- `ExchangeResultCard`;
- `ExchangeMedia`;
- `ExchangeFavorite`;
- `ExchangeSelectionState`;
- `ExchangeMapProjection`;
- `ExchangeDetailState`.

The domain-facing model must be conceptually equivalent to:

- `LensDefinition`;
- exactly four `LensActionDefinition` positions for each lens;
- `LensMapProjection`;
- `LensResultCardModel`;
- `RecordActionDefinition`;
- `SelectionState`;
- `SheetState`;
- `FavoriteState`;
- `DetailState`;
- one versioned continuity contract or an equally explicit composition of those contracts.

### Required state coverage

The shared contract must represent, where applicable:

- active lens;
- focal selected organization or record;
- associated organization context without collapsing it into a distinct record identity;
- selected marker;
- map camera and bounds;
- geography and its validation source;
- search, filters, and sort;
- result-set identity and cursor;
- sheet snap point;
- list, sheet, and detail scroll position;
- detail context and return context;
- versioned participant, membership, viewer-organization, and geography scope for fail-closed reconciliation.

### Action-state compatibility

The existing action definitions remain the source for the four active-lens positions. The Stage 1 contract must preserve separately:

- stable action identity and order;
- owning lens and canonical position;
- `operational`;
- `applicable`;
- `authorized`;
- enabled/disabled presentation;
- supported-locale disabled explanation;
- handler presence only when truthful;
- server-derived permission inputs where required.

Record actions use a separate `RecordActionDefinition` family. They may not consume, rename, or expand the sixteen lens-level positions.

### Security and privacy

All Stage 1 state is client/presentation continuity only. It must never authorize a protected operation, widen organization membership, grant geography access, disclose a private coordinate, or persist protected domain records merely for convenience.

The contract must fail closed or narrow safely for session, participant, membership, viewer organization, geography, schema/version, and selected-object authority changes. Browser-restored geography may not be represented as server-authoritative until an authoritative projection revalidates it.

### Accessibility and responsive architecture

The contract must represent or explicitly require:

- persistent bottom navigation as a four-item lens control;
- safe-area inset accommodation above bottom navigation;
- touch targets generally 44px or larger;
- keyboard and switch-access operation;
- a non-drag control for all three sheet positions;
- software-keyboard and orientation changes;
- focus movement/restoration for detail and sheet transitions;
- selected/current semantics that do not rely on color alone;
- structured list alternatives and accessible selected-object descriptions;
- reduced-motion and orientation/resize continuity.

### Stop boundary

This packet does **not** authorize React/JSX, CSS, production bottom navigation, sheet/card/detail rendering, map renderer changes, routes, domain handlers, lens-specific behavior, changes to the sixteen action identities/order, tracker arithmetic, Stage 2, or mandatory Independent Acceptance.

## 5. Current Lane 01 candidate

PR #218 supplies only:

- `src/application/participant/mobile-exchange-contracts.ts`;
- `test/mobile-exchange-stage1-contracts.test.mjs`;
- `docs/architecture/MOBILE_EXCHANGE_STAGE1_CONTRACTS.md`.

Its current disposition is `Implemented — Not Verified`. It correctly reuses the current lens registry, Phase 2 action registry, participant spatial context, and map-camera contract rather than creating a second mobile store or production UI implementation.

Exact-head production-ci #1483 succeeded at `3c67ef3dffeaa60aef761debb6cf76ea1c807789`. Green CI proves build health; it does not resolve the substantive contract findings below.

## 6. Domain review protocol — one GitHub candidate

Lanes 02–05 review the **same exact Lane 01 PR head** through GitHub. Conversation relay is not an acceptance mechanism.

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

A concurrence applies only to the exact candidate SHA and named contracts. A later head requires renewed review for changed surfaces; unchanged surfaces may be carried forward only by explicit SHA/diff reference.

## 7. Shared findings, requests, and dispositions

Substantive findings use `MOB1-FIND-<lane-number>-<sequence>`. A missing shared capability that cannot be resolved as a review correction uses `SCR-<lane>-MOB1-<sequence>` and must be filed on or linked from PR #218.

Allowed dispositions are:

- `accepted-shared-correction`;
- `reuse-existing-shared-seam`;
- `domain-fact-no-shared-change`;
- `deferred-explicitly-approved`;
- `rejected-conflicts-with-authority`;
- `superseded-by-candidate-sha`.

A disposition is durable only when both the finding and resolution are visible on GitHub and, when code changes, bound to the resolving candidate SHA.

## 8. Current findings

### Control Room

| Finding | State | Required correction |
| --- | --- | --- |
| `MOB1-FIND-00-001` | Open | Remove the reintroduced mandatory Independent Acceptance prerequisite and align the candidate document with current completion governance. |
| `MOB1-FIND-00-002` | Open | Complete result-set/cursor, internal scroll, safe-area, keyboard/orientation, reduced-motion/accessibility, and non-gesture sheet architecture. |
| `MOB1-FIND-00-003` | Open | Enforce marker/card/detail focal-object parity and internal subject consistency with negative tests. |
| `MOB1-FIND-00-004` | Open | Validate every action-rail input against the frozen canonical action ID for its lens and position. |
| `MOB1-FIND-00-005` | Open | Represent browser-restored geography as restored/unvalidated until server revalidation. |
| `MOB1-FIND-00-006` | Open | Use the canonical supported-locale key contract for disabled explanations. |
| `BUILD-FIND-218-001` | Resolved | Trailing whitespace removed; production-ci #1483 succeeded at `3c67ef3d…`. |

The four unresolved Codex threads corroborate `MOB1-FIND-00-002` and `MOB1-FIND-00-003` and supply the originating evidence for `MOB1-FIND-00-005` and `MOB1-FIND-00-006`.

### Lane 02 — Opportunities/RFx

| Finding | State | Required shared correction |
| --- | --- | --- |
| `MOB1-FIND-02-001` | Open | Keep focal opportunity identity distinct from associated issuer-organization identity while preserving opportunity marker/card/detail parity. |
| `MOB1-FIND-02-002` | Open | Carry versioned continuity scope and provide typed fail-closed reconciliation/invalidation. |
| `MOB1-FIND-02-003` | Open | Represent actual optional video media separately from a poster image. |

Lane 02 also records that a card star represents the current participant's OpportunityWatch relation, not the organization-owned OpportunityPursuit decision `watch`, and that this Stage 1 review does not activate currently unavailable Pursue/Respond or Team handlers.

No Shared Contract Request is open because these are bounded corrections to the existing shared candidate.

## 9. Domain review assignments

| Lane | Review scope | Current status | Exact SHA | Findings |
| --- | --- | --- | --- | --- |
| 02 — Opportunities/RFx | opportunity/RFx cards, issuer context, record actions, selection, continuity, media | FINDING submitted | `3c67ef3dffeaa60aef761debb6cf76ea1c807789` | `MOB1-FIND-02-001`–`003` |
| 03 — Intelligence | organization/capability/location/layer projection, map/provenance/media/detail | Not submitted | — | — |
| 04 — Resources | provider/resource cards, provider context, favorite/request/detail | Not submitted | — | — |
| 05 — Referrals | referral cards, sent/received context, recipient selection, starred/actions | Not submitted | — | — |

## 10. Stage 1 convergence ledger

| Contract | Candidate state | 02 | 03 | 04 | 05 | Unresolved conflict |
| --- | --- | --- | --- | --- | --- | --- |
| shell composition | Present | Reviewed | Pending | Pending | Pending | None yet; incomplete review |
| bottom four-lens navigation | Present | Reviewed | Pending | Pending | Pending | None yet; incomplete review |
| three-position bottom sheet | Present | Reviewed | Pending | Pending | Pending | `MOB1-FIND-00-002` |
| four-position action rail | Present | Reviewed | Pending | Pending | Pending | `MOB1-FIND-00-004` |
| result/business card | Present | Finding | Pending | Pending | Pending | `MOB1-FIND-00-003`, `MOB1-FIND-02-001` |
| media | Present | Finding | Pending | Pending | Pending | `MOB1-FIND-02-003` |
| favorites | Present | Reviewed with domain note | Pending | Pending | Pending | Incomplete review |
| selected-object state | Present | Finding | Pending | Pending | Pending | `MOB1-FIND-00-003`, `MOB1-FIND-02-001` |
| map projection | Present | Finding | Pending | Pending | Pending | `MOB1-FIND-00-003`, `MOB1-FIND-00-005` |
| detail state | Present | Reviewed | Pending | Pending | Pending | `MOB1-FIND-00-002`, `MOB1-FIND-00-003` |
| continuity state | Present | Finding | Pending | Pending | Pending | `MOB1-FIND-00-002`, `MOB1-FIND-02-002`, `MOB1-FIND-00-005` |

## 11. Candidate and exit gates

A corrected candidate may retain `Implemented — Not Verified` when the complete shared contract family exists, exact canonical lens actions remain preserved, record actions stay separate, focal and associated identities are truthful, continuity/invalidation and responsive/accessibility obligations are represented, tests prove positive and negative invariants, exact-head CI passes, Lanes 02–05 review the exact candidate, every substantive finding has a durable disposition, and no material unresolved conflict remains.

Independent Acceptance may be requested as optional assurance. It is not a universal Stage 1 completion gate under `FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md`.

The current exit gate is **not satisfied** because PR #218 has six open Control Room findings, three open Lane 02 findings, four unresolved Codex threads, and no review from Lanes 03–05.

## 12. Exact next action

Lane 01 corrects the open findings on PR #218 without entering Stage 2 UI, records exact-SHA dispositions, and obtains green CI on the new exact head. Lanes 02–05 then review or re-review that exact head through GitHub. Stage 2 remains unauthorized.