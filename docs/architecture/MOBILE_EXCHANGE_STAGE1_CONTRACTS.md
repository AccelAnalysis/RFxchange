# Mobile Exchange Stage 1 Shared Contracts

**Owner:** 01 — Shared Exchange Platform

**Packet:** `WP-MOBILE-EXCHANGE-STAGE1-01`

**Activation epoch:** `mobile-exchange-stage1-2026-08-16`

**Immutable activation base:** `0b23a9f9b49468aab12609dea6116e1409c925fe`

**Control Room packet:** PR #217, `docs/program/MOBILE_EXCHANGE_STAGE_1_ARCHITECTURE_LOCK.md`

**Product authority:** `docs/program/MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md`

**Composition reference:** `docs/reference/screenshots/rfxchange-mobile-composition-reference.jpg`

**Candidate disposition:** `Implemented — Not Verified`; exact-candidate compatibility reviews by lanes 02–05 and Independent Acceptance remain separate evidence.

## Purpose and boundary

This Stage 1 architecture binds the governed mobile composition to one reusable Shared Exchange contract. It does not implement the Stage 2 visual shell, bottom-navigation styling, floating search layout, draggable gestures, production card styling, media playback, or lens-specific result streams.

The contract family is implemented in:

- `src/application/participant/mobile-exchange-contracts.ts` for the shared shell, lens, action, card, media, favorite, selection, map, sheet and detail primitives;
- `src/application/participant/mobile-exchange-continuity.ts` for scoped continuity, fail-closed invalidation, safe return context, floating search/filter projection and accessibility obligations.

It composes existing shared seams rather than creating a second mobile application architecture:

- `participant-lens-registry.ts` remains the source of the four permanent lenses and Account/Quick Start utility separation;
- `exchange-room-actions.ts` remains the source of the fixed `4 lenses × 4 action positions` registry and its operational/applicable/authorized projection;
- `participant-spatial-context.ts` remains the current scoped, versioned, non-authorizing continuity substrate;
- `map-view.ts` remains the camera/view contract.

## Component-contract map

| Governed concept | Shared contract |
| --- | --- |
| `MobileExchangeShell` | `MobileExchangeShellContract` and `MobileExchangeStage1ShellContract` |
| floating search/filter | `MobileExchangeSearchFilterContract`, `mobileExchangeSearchFilter`, and `LensContinuityState` |
| `MobileLensNavigation` | `MobileLensNavigationContract` |
| `ExchangeBottomSheet` | `ExchangeBottomSheetContract` and `ExchangeSheetState` |
| `LensActionRail` | `LensActionRailContract` and `LensActionDefinitionTuple` |
| `ExchangeResultCard` | `ExchangeResultCardContract`, `LensResultCardModel`, and `createLensResultCardModel` |
| `ExchangeMedia` | `ExchangeMediaContract` and `ExchangeMediaModel` |
| `ExchangeFavorite` | `ExchangeFavoriteContract` and `FavoriteState` |
| `ExchangeSelectionState` | `ExchangeSelectionContract` and `ExchangeSelectionState` |
| `ExchangeMapProjection` | `ExchangeMapProjectionContract`, `LensMapProjection`, and `ExchangeMapProjection` |
| `ExchangeDetailState` | `ExchangeDetailContract`, `ExchangeDetailState`, `ExchangeDetailContext`, and `MobileExchangeDetailContext` |
| continuity/invalidation | `MobileExchangeContinuityState`, `MobileExchangeContinuityScope`, and `MobileExchangeContinuityDecision` |

These are data and interaction contracts, not final React components.

## Permanent navigation and composition

`MOBILE_EXCHANGE_LENS_DEFINITIONS` is an exact four-element tuple in this governed order:

1. Opportunities/RFx
2. Resources
3. Intelligence
4. Referrals

Each definition is projected from the current participant lens registry and contains an exact four-element action-ID tuple from the current Exchange Room action registry.

`MOBILE_EXCHANGE_ACCOUNT_UTILITY` is explicitly a utility with `presentation: "menu"`; it is not part of the lens tuple. Existing Quick Start behavior remains a utility concern and is not converted into a fifth lens.

`MOBILE_EXCHANGE_COMPOSITION_POLICY` fixes the map-first shell, map-overlay search/filter seam, bottom lens navigation, sheet-top action rail, and sheet-contained result cards. Stage 2 must not reinterpret this as a top mobile lens menu.

## Fixed four-position action contract

`LensActionDefinitionTuple` has exactly four positions. `mobileLensActionRail` adapts the current Phase 2 action projections and validates them against the canonical action ID and position at every slot. Duplicate, substituted, missing, or displaced entries fail closed.

Every action keeps these facts separate:

- `operational` — a real handler/runtime exists;
- `applicable` — the current lens/object context supports the action;
- `authorized` — current server-derived authority permits the action.

Rendered availability is derived only after those facts are known. Disabled actions retain a specific machine reason, use the existing localized `networkWorkspace.actionReasons.exchange-action-unavailable` explanation, and expose no handler. A visible unavailable action therefore cannot activate a route or remediation loop.

Record-specific card actions use the same fail-closed separation but remain distinct from the frozen sixteen lens-level action positions.

## Subject identity and selected-object parity

`ExchangeSubjectIdentity` is the single organization-or-record identity consumed by card, map and detail models. Organization identities cannot carry record fields. Record identities require a record type and ID.

`createLensResultCardModel` constructs the card and its detail context from the same validated identity object. The contract does not expose two independently writable identity envelopes that could drift. `createExchangeMapObjectProjection` uses the same identity shape.

`ExchangeSelectionState` has one canonical `selectionKey` shared by every present selected reference. It rejects organization, record and marker references with different keys.

This binds:

- map marker selection;
- card selection;
- keyboard and switch-access selection;
- detail selection.

`selectionMatchesCard` and `selectionMatchesMapObject` use that same key. A cluster is not a selectable organization or domain record. A permitted record may legitimately have no marker when privacy or domain rules provide no coordinate; the shared contract does not fabricate one.

## Mobile continuity state

`MobileExchangeState` provides presentation state. `MobileExchangeContinuityState` composes it with a scope containing session, participant, membership, viewer organization and geography identities.

The state intentionally represents:

- `activeLens`;
- selected organization, record and marker;
- map camera and optional bounds;
- current geography and whether it is merely carried or freshly server-revalidated;
- per-lens search, filters and sort;
- result-set identity and cursor;
- result page/index;
- list and sheet scroll positions;
- sheet snap point;
- detail and return context.

`migrateParticipantSpatialContextToMobileExchangeContinuity` is the explicit adapter from the existing `ParticipantSpatialContext` version. It preserves current search/filter/result/list continuity, adds `null` result-set/cursor seams where the prior schema had none, and maps the current boolean panel state to a safe initial sheet state:

- closed panel → `peek`;
- open panel → `partial`.

It does not create a second persisted browser store or silently upgrade unsupported schemas. Unsupported source versions fail closed.

Lens transitions preserve selection, camera, geography and each lens's own continuity while restoring the target lens's sheet scroll position.

## Geography authority

A geography ID carried from client continuity is represented as `carried-unvalidated`; it is not labeled server-authoritative merely because it exists in browser state.

`withServerRevalidatedMobileExchangeGeography` may project `server-revalidated` only when a current server result exactly matches the active continuity scope. A different geography fails closed. This state still grants no route, record or action permission.

## Continuity invalidation

`reconcileMobileExchangeContinuity` evaluates client continuity against current server-derived scope and selected-object authority. It has explicit invalidation reasons for:

- contract/schema version change;
- session-context change;
- participant change;
- membership change;
- viewer-organization change;
- geography change;
- selected-object authority change.

Session, participant, membership, viewer-organization, geography and schema mismatches invalidate the entire client continuity state. A selected-object authority change removes only stale selection and open detail while preserving safe camera and per-lens query/list/scroll continuity.

The caller still owns the authoritative server read. The continuity decision cannot grant tenant, organization, geography, publication, record or action access.

## Floating search/filter and result continuity

`MobileExchangeSearchFilterContract` is explicitly placed over the map and projects the active lens's search, filters, sort, result-set ID and cursor. The contract supports both page/index and cursor/result-set continuity so later domain adapters do not need private mobile state systems.

The shared layer does not invent cursor semantics for a domain that does not have them. The current spatial adapter uses `null` until an authorized domain projection supplies a real value.

## Bottom-sheet contract

`EXCHANGE_SHEET_SNAP_POINTS` is exactly:

- `peek`;
- `partial`;
- `expanded`.

`ExchangeSheetState` distinguishes result content from detail content and carries sheet-internal scroll state. `MOBILE_EXCHANGE_ACCESSIBILITY_POLICY` requires a non-drag control capable of reaching all three positions, so gestures are never the only way to operate the sheet.

Stage 1 does not implement drag physics, snap measurements, safe-area CSS or animation.

## Card, media, favorite and detail contracts

`LensResultCardModel` supports organizations and permitted domain records with:

- one validated subject identity;
- title and optional organization identity;
- locality;
- concise summary;
- status/date/important indicator;
- capability/category metadata;
- optional media;
- favorite state;
- record-specific actions;
- whole-card detail behavior.

`ExchangeMediaModel` supports organization logo, business/facility photo, product/service image, project image, branded media, video poster/thumbnail and fallback presentation. It uses opaque references and does not create upload, storage, moderation, transcoding or playback infrastructure.

`FavoriteState` supports hidden, disabled and enabled presentation. `projectFavoriteState` removes the handler when unavailable and declares `persistenceOwner: "domain"`. The shared star never creates an authoritative favorite relation.

`MobileExchangeDetailContext` adds a same-origin, lens-bounded return destination and optional focus-return key to the shared identity-bearing detail context. Return context is navigation only and never authority.

## Accessibility and responsive obligations

`MOBILE_EXCHANGE_ACCESSIBILITY_POLICY` binds these Stage 2 obligations without implementing visuals:

- safe-area insets must be accommodated;
- the sheet must clear the persistent bottom-navigation safe area;
- touch targets are generally at least 44px;
- keyboard and switch-access selection use the shared selected-object state;
- a non-drag sheet-position control is required;
- selected/current state cannot rely on color alone;
- a structured list alternative is required for map results;
- detail transitions preserve a focus-return key where a focus origin exists;
- reduced motion is required;
- orientation/resize preserves safe continuity;
- the software keyboard cannot make search, sheet controls or bottom navigation unreachable;
- result cursor and sheet scroll continuity are explicit state obligations.

## Non-authorizing policy

`MOBILE_EXCHANGE_CLIENT_STATE_POLICY` and `MOBILE_EXCHANGE_STAGE1_AUTHORITY_POLICY` state that mobile client state:

- stores no authorization;
- grants no protected-route access;
- grants no action permission;
- requires server revalidation of selected objects;
- requires server-derived protected-action permissions;
- does not own favorite persistence;
- treats sheet and camera state as presentation state;
- invalidates continuity when its governing scope changes;
- treats return context as navigation only;
- never treats carried geography as server authority.

Server authorization, privacy, geography release, lifecycle, publication, tenant, membership and domain invariants remain controlling.

## Domain compatibility

### 02 — Opportunities/RFx

The shared model can represent opportunity/RFx map objects, issuer identity/media, the existing four Opportunities actions, favorites when a real relation exists, RFx-specific record actions, opportunity/team/pursuit context and detail. No Opportunities-specific mobile shell, sheet, card or navigation framework is required.

### 03 — Intelligence

The shared model can represent organizations, sites/locations, analytical records, AMACS/provenance metadata, layers, compare/watch record actions, bounds/camera and detail. Privacy-suppressed or non-spatial analytical objects may omit coordinates without breaking card/detail behavior.

### 04 — Resources

The shared model can represent provider/resource markers, offered or requested resources, own-provider versus external-provider context, media, availability indicators, the four Resource actions, favorites when backed by a real relation, request actions and detail.

### 05 — Referrals

The shared model can represent referral records, sent/received relationship context, recipient selection, the four Referral actions, private star presentation when backed by a real relation, connect/refer/introduction actions and detail.

A missing generalized capability must be submitted through the Shared Contract Request mechanism. A domain lane must not fork the mobile shell, bottom sheet, card, media, favorite, selection, action rail, detail or navigation contracts.

## Shared Contract Requests and review

Lanes 02–05 review the same exact PR head under the Control Room packet's `MOB1-DOMAIN-REVIEW` format. A missing generalized capability is recorded as `MOB1-FIND-*` or `SCR-<lane>-MOB1-*`; it is not implemented privately by a domain lane.

At candidate creation, no Mobile Stage 1 Shared Contract Request is unresolved. That status must be rechecked after all four exact-candidate reviews.

## Stage 2 hard boundary

This Stage 1 contract does not implement:

- final persistent bottom-navigation visuals;
- floating search/filter styling;
- draggable-sheet gestures or production snap geometry;
- final responsive/safe-area CSS;
- Zillow-like card styling;
- final media playback;
- production lens-specific card streams;
- Opportunities/RFx, Intelligence, Resources or Referrals business logic;
- synthetic market records.

Stage 2 may compose visual components only after the exact Stage 1 candidate has been reviewed for compatibility by lanes 02–05 and accepted for implementation sequencing by Control Room.
