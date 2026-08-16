# Mobile Exchange Stage 1 — Architecture Lock

**Status:** ACTIVE — CANDIDATE CORRECTION AND CROSS-LENS REVIEW PENDING

**Control Room owner:** 00 — RFxchange Control Room

**Implementation owner:** 01 — Shared Exchange Platform

**Domain consumers/reviewers:** 02 — Opportunities/RFx; 03 — Intelligence; 04 — Resources; 05 — Referrals

**Packet:** `WP-MOBILE-EXCHANGE-STAGE1-01`

**Activation epoch:** `mobile-exchange-stage1-2026-08-16`

**Immutable activation base:** `0b23a9f9b49468aab12609dea6116e1409c925fe`

**Control Room PR:** `#217`

**Lane 01 candidate:** PR `#218` at `16c7b3b0131cfde1ba23119831ee1b3dab3a7942`

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

Stage 1 contracts must preserve the established product composition without weakening visual placement into mere reachability:

- the map is the primary mobile canvas;
- search and filter float over the map;
- the four permanent lenses remain persistently thumb-accessible at the bottom;
- a draggable sheet has three governed positions: peek/collapsed, partial, and expanded;
- the active lens exposes exactly four lens-level action positions at the top of the sheet;
- Zillow-like result/business cards appear inside the sheet;
- cards may contain an optional logo/image/video media region;
- favorite/star is a record-level relation;
- record-specific actions are distinct from lens-level actions;
- card selection and marker selection synchronize through one selected-object state;
- a card opens an expanded detail state without abandoning the shared Exchange context;
- unavailable lens actions remain individually visible, disabled, and non-actionable;
- lens changes preserve applicable map, selection, search/filter, sheet, scroll, and detail continuity;
- safe-area, touch-target, keyboard, screen-reader, reduced-motion, and non-gesture alternatives remain first-class architecture requirements.

A Menu route to a lens does not satisfy persistent bottom navigation. A technically retrievable card does not satisfy the governed sheet/card composition.

## 3. Merged foundations that remain controlling

Stage 1 extends, and must not replace, the merged Exchange Room architecture:

1. `participant-lens-registry.ts` preserves the exact four-lens identity/order and separates Account/Quick Start utilities.
2. `exchange-room-actions.ts` preserves the canonical sixteen action identities and independently projects `operational`, `applicable`, `authorized`, disabled presentation, and a truthful handler.
3. `participant-spatial-context.ts` preserves a scoped, versioned, and non-authorizing participant continuity context.
4. `EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md` freezes `4 lenses × 4 action positions` and the distinction between lens-level action availability and lens existence.
5. PR #191 merged the Phase 2 controller/registry; PR #212 merged the bounded `New Referral` truth correction.

Stage 1 must not weaken:

- current lens-controller behavior;
- the sixteen-position registry;
- operational/applicable/authorized separation;
- server-derived authorization where required;
- progressive availability;
- selected-organization/selected-object continuity;
- map camera/geography continuity;
- tenant, geography, and privacy boundaries.

## 4. Lane 01 bounded assignment

Lane 01 owns one exact-head candidate defining or reconciling common technical contracts conceptually covering:

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
- one versioned continuity contract or an equally explicit composition of the preceding contracts.

### Required state coverage

The shared contract must represent, where applicable:

- active lens;
- selected organization;
- selected record and record kind;
- selected marker;
- map camera and bounds;
- geography;
- search;
- filters;
- sort;
- result-set identity/cursor;
- sheet snap point;
- list and internal sheet/detail scroll position;
- detail context and return context.

### Action-state compatibility

The existing action definitions remain the source for the four active-lens positions. The Stage 1 contract must preserve separately:

- stable action identity and order;
- owning lens;
- `operational`;
- `applicable`;
- `authorized`;
- enabled/disabled presentation;
- disabled reason semantics;
- handler presence only when truthful;
- server-derived permission inputs where required.

Record actions use a separate `RecordActionDefinition` family. They may not consume, rename, or expand the sixteen lens-level positions.

### Security and privacy

All Stage 1 state is client/presentation continuity only. It must never authorize a protected operation, widen organization membership, grant geography access, disclose a private coordinate, or persist protected domain records merely for convenience.

The contract must specify fail-closed revalidation/invalidation for session, participant, membership, viewer organization, geography, schema/version, and selected-object authority changes. Protected actions and refreshed projections remain server-authoritative.

### Accessibility and responsive architecture

The contract must support or explicitly bind Stage 2 to:

- persistent bottom navigation as a four-item lens control;
- safe-area inset accommodation above bottom navigation;
- touch targets generally 44px or larger;
- keyboard and switch-access operation;
- a non-drag control for moving among all three sheet positions;
- software-keyboard and orientation changes;
- focus movement/restoration for detail and sheet transitions;
- selected/current semantics that do not rely on color alone;
- structured list alternatives and accessible selected-object descriptions;
- reduced-motion and orientation/resize continuity.

### Owned paths

Lane 01 may modify only the shared contract and focused validation surface necessary for Stage 1, including as needed:

- `src/application/participant/mobile-exchange-contracts.ts` or the current canonical equivalent;
- focused reconciliation of existing participant lens/action/spatial types;
- focused `test/mobile-exchange-stage1-*.test.mjs` and validation scripts;
- shared architecture documentation and Stage 1 evidence.

### Stop boundary

This packet does **not** authorize:

- React/JSX mobile shell implementation;
- CSS or visual layout implementation;
- production bottom navigation, sheet, card, or detail rendering;
- map renderer changes;
- new routes or domain handlers;
- lens-specific RFx, Intelligence, Resources, or Referrals behavior;
- Teaming, messaging, notifications, commerce, or adjacent functionality;
- changes to the sixteen action identities/labels/order;
- tracker Feature-ID completion arithmetic;
- Stage 2 authorization;
- mandatory Independent Acceptance as a completion prerequisite.

## 5. Current Lane 01 candidate

PR #218 supplies three bounded files:

- `src/application/participant/mobile-exchange-contracts.ts`;
- `test/mobile-exchange-stage1-contracts.test.mjs`;
- `docs/architecture/MOBILE_EXCHANGE_STAGE1_CONTRACTS.md`.

Its current disposition is `Implemented — Not Verified`. It correctly reuses the four-lens registry, Phase 2 action registry, participant spatial context, and map-camera contract rather than creating a second mobile store or UI implementation.

The exact candidate is not yet converged because the Control Room review recorded the findings below and exact-head production CI #1482 failed.

## 6. Domain review protocol — one GitHub candidate

Lanes 02–05 review the **same corrected exact Lane 01 PR head**. Conversation relay is not an acceptance mechanism.

Each domain lane submits one GitHub review or PR comment using:

```text
MOB1-DOMAIN-REVIEW
lane: 02 | 03 | 04 | 05
candidate-pr: 218
candidate-sha: <corrected exact head>
disposition: CONCUR | FINDING
contracts-reviewed: <names>
representative-domain-records: <record kinds checked>
shared-findings: <finding IDs or none>
domain-notes: <domain facts that do not request private shared UI>
```

A concurrence applies only to the exact candidate SHA and named contracts. A later candidate head requires renewed review for changed contract surfaces. Unchanged surfaces may be carried forward only by explicit SHA/diff reference.

These are architecture-consumer reviews. They do not authorize domain lanes to edit shared contract paths.

## 7. Shared findings, requests, and dispositions

### Finding identity

Substantive cross-lens contract findings use:

```text
MOB1-FIND-<lane-number>-<sequence>
```

A finding records the exact candidate, affected contract, representative journey, authority conflict, impact, smallest shared correction, and explicit non-scope.

### Shared Contract Request

A missing shared capability that cannot be resolved as a review correction uses the existing Shared Contract Request mechanism:

```text
SCR-02-MOB1-001
SCR-03-MOB1-001
SCR-04-MOB1-001
SCR-05-MOB1-001
```

The request must be filed on or linked from PR #218. It must not be implemented privately by the requesting lane.

### Allowed dispositions

Control Room/Lane 01 records one of:

- `accepted-shared-correction`;
- `reuse-existing-shared-seam`;
- `domain-fact-no-shared-change`;
- `deferred-explicitly-approved`;
- `rejected-conflicts-with-authority`;
- `superseded-by-candidate-sha`.

A disposition is durable only when the finding/request and resolution are visible on GitHub and, when code changes, bound to the resolving candidate SHA.

## 8. Current findings

Exact reviewed candidate: PR #218 at `16c7b3b0131cfde1ba23119831ee1b3dab3a7942`.

| Finding | State | Required correction |
| --- | --- | --- |
| `MOB1-FIND-00-001` | Open | Remove the reintroduced universal Independent Acceptance prerequisite and align candidate documentation with current completion governance. |
| `MOB1-FIND-00-002` | Open | Complete the responsive/continuity architecture for result identity/cursor, internal scroll, safe-area, keyboard/orientation, reduced-motion/accessibility, and non-gesture sheet control without implementing Stage 2 UI. |
| `MOB1-FIND-00-003` | Open | Make marker/card/detail subject identity internally consistent and enforceable with focused negative tests. |
| `MOB1-FIND-00-004` | Open | Validate the action-rail adapter against the frozen canonical action ID for each lens/position. |
| `BUILD-FIND-218-001` | Open | Remove trailing whitespace and obtain green exact-head production CI. |

## 9. Domain review assignments

| Lane | Review scope | Current status | Candidate SHA | Domain findings |
| --- | --- | --- | --- | --- |
| 02 — Opportunities/RFx | opportunity/RFx card variants; issuer versus external record context; opportunity record actions; selected opportunity and Team/Pursue context | Wait for corrected PR #218 head | — | None filed |
| 03 — Intelligence | organization/capability/location/layer projections; bounds/camera; provenance/media variants; analytical detail context | Wait for corrected PR #218 head | — | None filed |
| 04 — Resources | provider/resource cards; own provider status versus external provider detail; favorite and request actions | Wait for corrected PR #218 head | — | None filed |
| 05 — Referrals | referral cards; sent/received relationship context; recipient selection; private starred relation and record actions | Wait for corrected PR #218 head | — | None filed |

## 10. Stage 1 convergence ledger

| Contract | Lane 01 candidate state | 02 | 03 | 04 | 05 | Unresolved conflict |
| --- | --- | --- | --- | --- | --- | --- |
| shell composition | Candidate present | Pending | Pending | Pending | Pending | None yet; unreviewed |
| bottom four-lens navigation | Candidate present | Pending | Pending | Pending | Pending | None yet; unreviewed |
| three-position bottom sheet | Candidate present | Pending | Pending | Pending | Pending | `MOB1-FIND-00-002` |
| four-position action rail | Candidate present | Pending | Pending | Pending | Pending | `MOB1-FIND-00-004` |
| result/business card | Candidate present | Pending | Pending | Pending | Pending | `MOB1-FIND-00-003` |
| media | Candidate present | Pending | Pending | Pending | Pending | None yet; unreviewed |
| favorites | Candidate present | Pending | Pending | Pending | Pending | None yet; unreviewed |
| selected-object state | Candidate present | Pending | Pending | Pending | Pending | `MOB1-FIND-00-003` |
| map projection | Candidate present | Pending | Pending | Pending | Pending | `MOB1-FIND-00-003` |
| detail state | Candidate present | Pending | Pending | Pending | Pending | `MOB1-FIND-00-002`, `MOB1-FIND-00-003` |
| continuity state | Candidate present | Pending | Pending | Pending | Pending | `MOB1-FIND-00-002` |

## 11. Candidate and exit gates

A corrected candidate may retain `Implemented — Not Verified` when:

- one shared contract family covers every Stage 1 concept;
- exactly four canonical lens-action definitions remain available per lens through the existing sixteen-position registry;
- record actions are separately modeled;
- marker, card, keyboard, and detail entry share enforceable identity;
- continuity covers the required state and responsive/accessibility obligations;
- favorites and media are truthful optional projections rather than fabricated domain state;
- the contract remains non-authorizing and preserves server checks;
- focused tests prove positive and negative invariants;
- applicable repository checks and exact-head CI pass;
- Lanes 02–05 review the corrected exact candidate through GitHub;
- every substantive finding has a durable disposition;
- no material unresolved cross-lens contract conflict remains.

Independent Acceptance may be requested as optional assurance. It is not a universal Stage 1 completion gate under `FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md`.

Stage 1 is ready to close only when the participating lanes converge on one shared definition for shell, bottom navigation, bottom sheet, four-position action rail, card, media, favorite, selected-object state, map projection, detail, and continuity, with no substantive unresolved conflict.

The current exit gate is **not satisfied** because PR #218 has four substantive Control Room findings, failed exact-head CI, and no domain review from Lanes 02–05.

## 12. Exact next action

Lane 01 corrects `MOB1-FIND-00-001` through `MOB1-FIND-00-004` and `BUILD-FIND-218-001` on PR #218 without expanding into Stage 2 UI, then obtains green exact-head production CI. Lanes 02–05 must then review that corrected exact SHA through GitHub using §6. Stage 2 remains unauthorized.