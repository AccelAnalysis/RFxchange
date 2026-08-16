# Mobile Exchange Stage 1 — Architecture Lock

**Status:** ACTIVE — CONTRACT CONVERGENCE IN PROGRESS

**Control Room owner:** 00 — RFxchange Control Room

**Implementation owner:** 01 — Shared Exchange Platform

**Domain consumers/reviewers:** 02 — Opportunities/RFx; 03 — Intelligence; 04 — Resources; 05 — Referrals

**Packet:** `WP-MOBILE-EXCHANGE-STAGE1-01`

**Activation epoch:** `mobile-exchange-stage1-2026-08-16`

**Immutable activation base:** `0b23a9f9b49468aab12609dea6116e1409c925fe`

**Lane 01 branch:** `lane01/mobile-exchange-stage1-contracts`

**Stage 1 candidate:** Not yet opened

**Stage 1 exit gate:** NOT SATISFIED

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
- a draggable sheet has three governed positions: collapsed, half and expanded;
- the active lens exposes exactly four lens-level action positions at the top of the sheet;
- Zillow-like result/business cards appear inside the sheet;
- cards may contain an optional logo/image/video media region;
- favorite/star is a record-level relation;
- record-specific actions are distinct from lens-level actions;
- card selection and marker selection synchronize through one selected-object state;
- a card opens an expanded detail state without abandoning the shared Exchange context;
- unavailable lens actions remain individually visible, disabled and non-actionable;
- lens changes preserve applicable map, selection, search/filter, sheet, scroll and detail continuity;
- safe-area, touch-target, keyboard, screen-reader, reduced-motion and non-gesture alternatives remain first-class contract requirements.

A Menu route to a lens does not satisfy persistent bottom navigation. A technically retrievable card does not satisfy the governed sheet/card composition.

## 3. Current merged foundations to preserve

Stage 1 extends, and must not replace, the merged Exchange Room architecture:

1. `participant-lens-registry.ts` preserves the exact four-lens identity/order and separates Account/Quick Start utilities.
2. `exchange-room-actions.ts` preserves the canonical sixteen action identities and independently projects `operational`, `applicable`, `authorized`, disabled presentation and a truthful handler.
3. `participant-spatial-context.ts` preserves a scoped, versioned and non-authorizing participant continuity context.
4. `EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md` freezes `4 lenses × 4 action positions` and the distinction between lens-level action availability and lens existence.
5. PR #191 merged the Phase 2 lens controller/registry; PR #212 merged the bounded `New Referral` truth correction. The current registry remains the compatibility foundation.

Stage 1 must not weaken:

- current lens-controller behavior;
- the sixteen-position registry;
- operational/applicable/authorized separation;
- server-derived authorization where required;
- progressive availability;
- selected-organization/selected-object continuity;
- map camera/geography continuity;
- tenant, geography and privacy boundaries.

## 4. Present contract gaps

The merged shared foundations do not yet supply one converged mobile contract for all Stage 1 needs. Lane 01 must close these bounded gaps without implementing Stage 2 UI:

- generic selected record/object identity beyond organization-only selection;
- record ↔ marker ↔ card identity and projection;
- explicit map bounds in addition to camera;
- per-lens sort state;
- three-position sheet snap state rather than a boolean panel state;
- detail context and return context;
- record favorite state and mutation capability description;
- media metadata/projection for logo, image and optional video;
- common result/business card projection;
- record-specific action definitions separate from the sixteen lens-level actions;
- one continuity contract spanning active lens, selected organization/record/marker, camera/bounds, geography, search, filters, sort, sheet snap, list scroll and detail context.

## 5. Lane 01 bounded assignment

Lane 01 must produce one exact-head GitHub candidate defining or reconciling common technical contracts conceptually covering:

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
- one versioned `MobileExchangeContinuityState` or an equally explicit composition of the preceding contracts.

Names may follow current repository conventions, but semantic coverage may not be omitted or spread across incompatible private lane types.

### 5.1 Required shared state coverage

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
- sheet snap point;
- list scroll position;
- detail context and return context.

### 5.2 Action-state compatibility

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

Record actions must use a separate `RecordActionDefinition` family. They may not consume, rename or expand the sixteen lens-level positions.

### 5.3 Security and privacy

All Stage 1 state is client/presentation continuity only. It must never authorize a protected operation, widen organization membership, grant geography access, disclose a private coordinate, or persist protected domain records merely for convenience.

The contract must specify invalidation or fail-closed behavior for at least session, participant, membership, viewer organization, geography, schema/version and selected-object authority changes. Protected actions and refreshed projections remain server-authoritative.

### 5.4 Accessibility and responsive behavior

The contract must support:

- persistent bottom navigation as a four-item navigation control;
- safe-area inset accommodation;
- touch targets generally 44px or larger;
- keyboard and switch-access operation;
- a non-drag control for moving among all three sheet positions;
- focus movement/restoration for detail and sheet transitions;
- selected/current semantics that do not rely on color alone;
- structured list alternatives and accessible selected-object descriptions;
- reduced-motion and orientation/resize continuity.

### 5.5 Owned paths

Lane 01 may modify only the shared contract and focused validation surface necessary for Stage 1, including as needed:

- `src/application/participant/mobile-exchange-contracts.ts` or the current canonical equivalent;
- `src/application/participant/participant-lens-registry.ts` when required for type reconciliation only;
- `src/application/participant/exchange-room-actions.ts` when required for compatible type projection only;
- `src/application/participant/participant-spatial-context.ts` when required for a versioned continuity migration;
- focused `test/mobile-exchange-stage1-*.test.mjs` and validation scripts;
- shared architecture documentation and Stage 1 evidence.

### 5.6 Non-owned paths and stop boundary

This packet does **not** authorize:

- React/JSX mobile shell implementation;
- CSS or visual layout implementation;
- production bottom navigation, sheet, card or detail rendering;
- map renderer changes;
- new routes or domain handlers;
- lens-specific RFx, Intelligence, Resources or Referrals behavior;
- Teaming, messaging, notifications, commerce or other adjacent functionality;
- changes to the sixteen action identities/labels/order;
- tracker Feature-ID completion arithmetic;
- Stage 2 authorization;
- mandatory Independent Acceptance as a completion prerequisite.

## 6. Domain review protocol — one GitHub candidate

Lanes 02–05 review the **same exact Lane 01 PR head**. Conversation relay is not an acceptance mechanism.

After Lane 01 opens its candidate PR, each domain lane must inspect the candidate diff and submit one GitHub review or PR comment using this structure:

```text
MOB1-DOMAIN-REVIEW
lane: 02 | 03 | 04 | 05
candidate-pr: <number>
candidate-sha: <exact head>
disposition: CONCUR | FINDING
contracts-reviewed: <names>
representative-domain-records: <record kinds checked>
shared-findings: <finding IDs or none>
domain-notes: <domain facts that do not request private shared UI>
```

A concurrence applies only to the exact candidate SHA and the named contracts. A later candidate head requires renewed review only for changed contract surfaces; unchanged reviewed surfaces may be explicitly carried forward by SHA/diff reference.

The reviews are architecture-consumer reviews. They do not authorize domain lanes to edit shared contract paths.

## 7. Shared findings, requests and dispositions

### 7.1 Finding identity

Substantive cross-lens contract findings use:

```text
MOB1-FIND-<lane-number>-<sequence>
```

Examples: `MOB1-FIND-02-001`, `MOB1-FIND-05-001`.

A finding records:

- exact candidate PR and SHA;
- affected shared contract;
- representative domain record/journey;
- conflict with an authority or required capability;
- security/privacy/accessibility/continuity impact;
- smallest shared correction needed;
- explicit non-scope.

### 7.2 Shared Contract Request

A missing shared capability that cannot be resolved as a review correction uses the existing Shared Contract Request mechanism with an ID such as:

```text
SCR-02-MOB1-001
SCR-03-MOB1-001
SCR-04-MOB1-001
SCR-05-MOB1-001
```

The request must be filed on or linked from the Lane 01 candidate PR and must not be implemented privately by the requesting lane.

### 7.3 Allowed dispositions

Control Room/Lane 01 records one of:

- `accepted-shared-correction`;
- `reuse-existing-shared-seam`;
- `domain-fact-no-shared-change`;
- `deferred-explicitly-approved`;
- `rejected-conflicts-with-authority`;
- `superseded-by-candidate-sha`.

A disposition is durable only when the finding/request and resolution are both visible on GitHub and, when code changes, bound to the resolving candidate SHA.

## 8. Domain review assignments

| Lane | Review scope | Current status | Candidate SHA | Findings |
| --- | --- | --- | --- | --- |
| 02 — Opportunities/RFx | opportunity/RFx card variants; issuer versus external record context; opportunity-specific record actions; selected opportunity and Team/Pursue context | Waiting for Lane 01 candidate | — | None filed |
| 03 — Intelligence | organization/capability/location/layer projections; map bounds/camera; provenance/media variants; analytical detail context | Waiting for Lane 01 candidate | — | None filed |
| 04 — Resources | provider/resource cards; own provider status versus external provider detail; resource favorite and request actions | Waiting for Lane 01 candidate | — | None filed |
| 05 — Referrals | referral cards; sent/received relationship context; recipient selection; private starred relation and record actions | Waiting for Lane 01 candidate | — | None filed |

## 9. Stage 1 convergence ledger

| Contract | Lane 01 state | 02 | 03 | 04 | 05 | Substantive unresolved conflict |
| --- | --- | --- | --- | --- | --- | --- |
| shell composition | Not Started | Pending | Pending | Pending | Pending | No finding filed; unreviewed |
| bottom four-lens navigation | Foundation exists; mobile contract not converged | Pending | Pending | Pending | Pending | No finding filed; unreviewed |
| three-position bottom sheet | Not Started | Pending | Pending | Pending | Pending | No finding filed; unreviewed |
| four-position action rail | Phase 2 foundation exists; mobile interface not converged | Pending | Pending | Pending | Pending | No finding filed; unreviewed |
| result/business card | Not Started | Pending | Pending | Pending | Pending | No finding filed; unreviewed |
| media | Not Started | Pending | Pending | Pending | Pending | No finding filed; unreviewed |
| favorites | Domain relations exist in places; shared contract not converged | Pending | Pending | Pending | Pending | No finding filed; unreviewed |
| selected-object state | Organization foundation exists; generic record contract not converged | Pending | Pending | Pending | Pending | No finding filed; unreviewed |
| map projection | Camera/geography foundation exists; record/bounds contract not converged | Pending | Pending | Pending | Pending | No finding filed; unreviewed |
| detail state | Not Started | Pending | Pending | Pending | Pending | No finding filed; unreviewed |
| continuity state | Partial version-1 spatial foundation; Stage 1 state not converged | Pending | Pending | Pending | Pending | No finding filed; unreviewed |

## 10. Candidate gates

Lane 01 may mark its Stage 1 candidate `Implemented — Not Verified` when:

- one shared contract family covers every Stage 1 concept;
- exactly four lens-action definitions remain available per lens through the existing sixteen-position registry;
- record actions are separately modeled;
- selection unifies marker, card, keyboard and detail entry;
- continuity covers all required state and documents invalidation/migration;
- favorites and media are truthful optional projections rather than fabricated domain state;
- the contract remains non-authorizing and preserves server checks;
- focused tests prove invariants, version parsing/migration and fail-closed invalidation;
- applicable repository checks and exact-head CI pass;
- Lanes 02–05 have reviewed the exact candidate through GitHub;
- every substantive finding has a recorded disposition;
- no material unresolved cross-lens contract conflict remains.

Independent Acceptance may be requested as optional assurance. It is not a universal Stage 1 completion gate under `FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md`.

## 11. Stage 1 exit gate

Stage 1 is ready to close only when the participating lanes converge on one shared definition for:

- shell;
- bottom navigation;
- bottom sheet;
- four-position lens action rail;
- card contract;
- media contract;
- favorite contract;
- selected-object state;
- map projection;
- detail state;
- state continuity;

and no substantive shared-contract conflict remains unresolved.

The current exit gate is **not satisfied** because Lane 01 has no Stage 1 candidate and Lanes 02–05 have not reviewed an exact candidate.

## 12. Exact next action

Lane 01 must branch `lane01/mobile-exchange-stage1-contracts` from `0b23a9f9b49468aab12609dea6116e1409c925fe`, implement only the shared Stage 1 contract/type/test surface described above, and open one draft PR that names `WP-MOBILE-EXCHANGE-STAGE1-01` and this document. After that PR exists, Lanes 02–05 review its exact head through GitHub using §6.