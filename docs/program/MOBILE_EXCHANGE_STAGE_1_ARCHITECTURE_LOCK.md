# Mobile Exchange Stage 1 — Architecture Lock

**Status:** ACTIVE — CANDIDATE CORRECTION AND CROSS-LENS REVIEW

**Control Room owner:** 00 — RFxchange Control Room

**Implementation owner:** 01 — Shared Exchange Platform

**Domain consumers/reviewers:** 02 — Opportunities/RFx; 03 — Intelligence; 04 — Resources; 05 — Referrals

**Packet:** `WP-MOBILE-EXCHANGE-STAGE1-01`

**Activation epoch:** `mobile-exchange-stage1-2026-08-16`

**Immutable activation base:** `0b23a9f9b49468aab12609dea6116e1409c925fe`

**Control Room PR:** `#217`

**Lane 01 candidate:** PR `#218` at `cf73a656dba4c09e735ac991cab557ecc2a22943`

**Candidate build:** production-ci `#1492` — IN PROGRESS

**Stage 1 exit gate:** NOT SATISFIED

**Stage 2 authorization:** NOT GRANTED

## 1. Purpose

This packet activates and coordinates the architecture-lock work required by `MOB-01 Mobile Experience Authority`. It does not redesign the established mobile Exchange and does not authorize Stage 2 production UI.

The controlling product/composition reference is installed on merged `main`:

- [`MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md`](MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md);
- [`../reference/screenshots/rfxchange-mobile-composition-reference.jpg`](../reference/screenshots/rfxchange-mobile-composition-reference.jpg);
- [`../reference/screenshots/README.md`](../reference/screenshots/README.md).

Historical labels in the visual source are non-authoritative. The governed mobile lens order is:

```text
Opportunities/RFx | Resources | Intelligence | Referrals
```

Account/Menu is a utility, not a fifth lens.

## 2. Locked product composition

Stage 1 contracts must preserve:

- a map-first primary canvas;
- floating search and filter over the map;
- four permanent lenses persistently thumb-accessible at the bottom;
- a three-position peek/collapsed, partial, and expanded sheet;
- exactly four active-lens action positions at the sheet top;
- Zillow-like result/business cards inside the sheet;
- optional logo, image, or video media;
- record favorites and record-specific actions;
- marker, card, keyboard, and detail synchronization through one focal selected-object identity;
- expanded detail without abandoning Exchange context;
- progressive availability with individually visible disabled actions;
- applicable map, selection, search/filter, sheet, scroll, and detail continuity across lens changes;
- safe-area, touch-target, keyboard, screen-reader, reduced-motion, orientation, and non-gesture requirements as architecture facts.

A Menu route to a lens does not satisfy persistent bottom navigation. A technically retrievable card does not satisfy the governed sheet/card composition.

## 3. Merged compatibility foundation

Stage 1 extends, and must not replace:

1. `participant-lens-registry.ts` for exact lens identity/order and utility separation;
2. `exchange-room-actions.ts` for the canonical sixteen action identities and separate `operational`, `applicable`, `authorized`, disabled-presentation, and handler facts;
3. `participant-spatial-context.ts` for scoped, versioned, non-authorizing continuity;
4. `EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md` for `4 lenses × 4 action positions`;
5. merged PR #191 and its bounded PR #212 truth correction.

Stage 1 must not weaken the lens controller, sixteen-position registry, server authorization, progressive availability, selected-object continuity, map continuity, or tenant/geography/privacy boundaries.

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
- `ExchangeDetailState`;
- one versioned continuity/reconciliation contract.

The domain-facing model must be conceptually equivalent to `LensDefinition`, exactly four `LensActionDefinition` positions per lens, `LensMapProjection`, `LensResultCardModel`, `RecordActionDefinition`, `SelectionState`, `SheetState`, `FavoriteState`, and `DetailState`.

### Required state coverage

Where applicable, the shared contract represents:

- active lens;
- focal selected organization or record;
- associated organization context without collapsing distinct record identity;
- selected marker;
- map camera and bounds;
- geography and validation source;
- search, filters, sort, result-set identity, and opaque cursor;
- sheet snap point;
- list, sheet, and detail scroll position;
- detail and safe return context;
- versioned session/participant/membership/viewer-organization/geography scope;
- fail-closed selected-object reconciliation.

### Action-state compatibility

The current registry remains the source for four active-lens positions. The contract preserves stable identity/order, owning lens/position, `operational`, `applicable`, `authorized`, enabled/disabled presentation, supported-locale explanation, truthful handler, and server-derived permission inputs. Record actions remain a separate family and may not consume or rename the sixteen lens-level positions.

### Security and privacy

Stage 1 continuity is presentation state only. It never authorizes operations, widens membership, grants geography, discloses private coordinates, or persists protected domain records for convenience. Scope, schema, geography, and selected-object authority changes must fail closed or narrow safely. Browser-restored geography remains unvalidated until an authoritative server projection revalidates it.

### Accessibility and responsive architecture

The shared contract must represent persistent bottom navigation, safe-area offset, 44px-class touch targets, keyboard/switch access, non-drag sheet controls, software-keyboard/orientation behavior, focus restoration, non-color selected/current semantics, structured-list alternatives, accessible selected-object descriptions, and reduced-motion/resize continuity.

### Stop boundary

This packet does **not** authorize React/JSX, CSS, production rendering, map renderer changes, routes, domain handlers, lens-specific behavior, changes to the sixteen actions, tracker arithmetic, Stage 2, or mandatory Independent Acceptance.

## 5. Current Lane 01 candidate

PR #218 currently supplies:

- `src/application/participant/mobile-exchange-contracts.ts`;
- `src/application/participant/mobile-exchange-continuity.ts`;
- `test/mobile-exchange-stage1-contracts.test.mjs`;
- `docs/architecture/MOBILE_EXCHANGE_STAGE1_CONTRACTS.md`.

The current head added a bounded continuity module with versioned participant/membership/viewer-organization/geography scope, typed invalidation reasons, selected-object fail-closed narrowing, safe return context, and accessibility/responsive policy facts. It remains `Implemented — Not Verified` and does not implement Stage 2 UI.

Production-ci #1492 is still in progress on `cf73a656dba4c09e735ac991cab557ecc2a22943`. Build success, when available, will not resolve the contract findings below.

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

A concurrence applies only to the exact candidate SHA and named surfaces. A later head requires renewed review for changed surfaces; unchanged surfaces may be carried forward only by explicit SHA/diff reference. Conversation relay is not an acceptance mechanism.

## 7. Findings, requests, and dispositions

Findings use `MOB1-FIND-<lane-number>-<sequence>`. Missing shared capabilities that cannot be handled as candidate corrections use `SCR-<lane>-MOB1-<sequence>` and must be filed on or linked from PR #218.

Allowed dispositions are:

- `accepted-shared-correction`;
- `reuse-existing-shared-seam`;
- `domain-fact-no-shared-change`;
- `deferred-explicitly-approved`;
- `rejected-conflicts-with-authority`;
- `superseded-by-candidate-sha`.

A disposition is durable only when the finding and resolution are visible on GitHub and, when code changes, bound to the resolving exact SHA.

## 8. Current findings

### Control Room

| Finding | State at `cf73a656…` | Required correction |
| --- | --- | --- |
| `MOB1-FIND-00-001` | Open | Remove the architecture document's universal Independent Acceptance prerequisite. |
| `MOB1-FIND-00-002` | Partially addressed; open | Accessibility/responsive policy is present. Add result-set identity/cursor, internal sheet/detail scroll state, and focused continuity tests. |
| `MOB1-FIND-00-003` | Open | Enforce focal marker/card/detail subject parity and validate card detail identity. |
| `MOB1-FIND-00-004` | Open | Validate every action-rail projection against the canonical action ID for its lens and position. |
| `MOB1-FIND-00-005` | Open | Do not label browser-restored geography server-authoritative before revalidation. |
| `MOB1-FIND-00-006` | Open | Use the canonical supported-locale disabled-explanation key contract. |
| `BUILD-FIND-218-001` | Resolved on prior head | Whitespace fixed; production-ci #1483 succeeded at `3c67ef3d…`. Current-head CI is separately pending. |

All four Codex threads remain unresolved and current at this candidate.

### Lane 02 — Opportunities/RFx

| Finding | State at `cf73a656…` | Required shared correction |
| --- | --- | --- |
| `MOB1-FIND-02-001` | Open | Keep focal opportunity identity distinct from associated issuer-organization identity. |
| `MOB1-FIND-02-002` | Partially addressed; open | Versioned scope/invalidation exists; add mismatch/authority negative tests and resolve restored-geography authority. |
| `MOB1-FIND-02-003` | Open | Represent actual optional video separately from its poster image. |

No Shared Contract Request is open because these remain bounded corrections to the existing candidate.

## 9. Domain review state

| Lane | Current disposition | Review SHA | Current-head action |
| --- | --- | --- | --- |
| 02 — Opportunities/RFx | FINDING | `3c67ef3dffeaa60aef761debb6cf76ea1c807789` | Re-review `cf73a656…`; prior findings remain applicable. |
| 03 — Intelligence | Not submitted | — | Review exact current/final head. |
| 04 — Resources | Not submitted | — | Review exact current/final head. |
| 05 — Referrals | Not submitted | — | Review exact current/final head. |

## 10. Convergence ledger

| Contract | Current state | Open findings/review gap |
| --- | --- | --- |
| shell composition | Candidate present | Lanes 02–05 final-head review incomplete |
| bottom navigation | Candidate present | Lanes 02–05 final-head review incomplete |
| bottom sheet | Partially represented | `MOB1-FIND-00-002` |
| action rail | Candidate present | `MOB1-FIND-00-004` |
| result card | Candidate present | `MOB1-FIND-00-003`, `MOB1-FIND-02-001` |
| media | Candidate present | `MOB1-FIND-02-003` |
| favorites | Candidate present | Final-head domain review incomplete |
| selected-object state | Candidate present | `MOB1-FIND-00-003`, `MOB1-FIND-02-001` |
| map projection | Candidate present | `MOB1-FIND-00-003`, `MOB1-FIND-00-005` |
| detail state | Partially represented | `MOB1-FIND-00-002`, `MOB1-FIND-00-003` |
| continuity/invalidation | Partially represented | `MOB1-FIND-00-002`, `MOB1-FIND-00-005`, `MOB1-FIND-02-002` |
| localization | Invalid namespace remains | `MOB1-FIND-00-006` |
| completion governance | Candidate document conflicts | `MOB1-FIND-00-001` |

## 11. Exit gate

A corrected candidate may retain `Implemented — Not Verified` when the complete shared contract family exists, canonical lens actions remain preserved, record actions stay separate, focal and associated identities are truthful, continuity/invalidation and responsive/accessibility obligations are represented and tested, exact-head CI passes, Lanes 02–05 review the final exact head, every substantive finding has a durable disposition, and no material unresolved conflict remains.

Independent Acceptance may be requested as optional assurance. It is not a universal Stage 1 completion gate under `FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md`.

The Stage 1 exit gate is **not satisfied**. The current head has six open or partially addressed Control Room findings, three open or partially addressed Lane 02 findings, four unresolved Codex threads, pending CI, and no final-head review from Lanes 02–05.

## 12. Exact next action

Lane 01 completes the remaining shared corrections and focused evidence on PR #218 without entering Stage 2 UI, records exact-SHA dispositions, and obtains green CI on the final head. Lanes 02–05 then review or re-review that exact head through GitHub. Stage 2 remains unauthorized.