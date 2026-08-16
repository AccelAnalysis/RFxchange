# Mobile Exchange Stage 1 Shared Contracts

**Owner:** 01 — Shared Exchange Platform  
**Product authority:** `docs/program/MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md`  
**Composition reference:** `docs/reference/screenshots/rfxchange-mobile-composition-reference.jpg`  
**Status:** Stage 1 technical architecture; implementation may be reported only as `Implemented — Not Verified` until Independent Acceptance records an exact-SHA disposition.

## Purpose

This document binds the governed mobile composition to one reusable Shared Exchange contract. It does not implement the Stage 2 visual shell, gesture system, floating search layout, production card styling, or lens-specific result streams.

The contract is implemented in:

`src/application/participant/mobile-exchange-contracts.ts`

It composes existing accepted/shared seams rather than creating a second mobile application architecture:

- `participant-lens-registry.ts` remains the source of the four permanent lenses and Account/Quick Start utility separation;
- `exchange-room-actions.ts` remains the source of the fixed `4 lenses × 4 action positions` registry and its operational/applicable/authorized projection;
- `participant-spatial-context.ts` remains the current non-authorizing continuity substrate;
- `map-view.ts` remains the camera/view contract.

## Component-contract map

The Stage 1 source exposes contracts corresponding to the governed conceptual components:

| Governed concept | Shared contract |
| --- | --- |
| `MobileExchangeShell` | `MobileExchangeShellContract` |
| `MobileLensNavigation` | `MobileLensNavigationContract` |
| `ExchangeBottomSheet` | `ExchangeBottomSheetContract` and `ExchangeSheetState` |
| `LensActionRail` | `LensActionRailContract` and `LensActionDefinitionTuple` |
| `ExchangeResultCard` | `ExchangeResultCardContract` and `LensResultCardModel` |
| `ExchangeMedia` | `ExchangeMediaContract` and `ExchangeMediaModel` |
| `ExchangeFavorite` | `ExchangeFavoriteContract` and `FavoriteState` |
| `ExchangeSelectionState` | `ExchangeSelectionContract` and `ExchangeSelectionState` |
| `ExchangeMapProjection` | `ExchangeMapProjectionContract`, `LensMapProjection`, and `ExchangeMapProjection` |
| `ExchangeDetailState` | `ExchangeDetailContract`, `ExchangeDetailState`, and `ExchangeDetailContext` |

These are data and interaction contracts. They are not final React components or final mobile styling.

## Permanent navigation contract

`MOBILE_EXCHANGE_LENS_DEFINITIONS` is an exact four-element tuple in the governed order:

1. Opportunities/RFx
2. Resources
3. Intelligence
4. Referrals

Each definition is projected from the current participant lens registry and contains an exact four-element action-ID tuple from the current Exchange Room action registry.

`MOBILE_EXCHANGE_ACCOUNT_UTILITY` is explicitly a utility with `presentation: "menu"`; it is not part of the lens tuple. Existing Quick Start behavior remains a utility concern and is not converted into a fifth lens.

Stage 2 must render this contract as persistent bottom navigation on mobile. It must not reinterpret it as a top mobile lens menu.

## Fixed four-position action contract

`LensActionDefinitionTuple` has exactly four positions. `mobileLensActionRail` adapts the current Phase 2 action projections without changing their authority semantics.

Every action keeps these facts separate:

- `operational` — a real handler/runtime exists;
- `applicable` — the current lens/object context supports the action;
- `authorized` — current server-derived authority permits the action.

The rendered availability is derived after those facts are known. Disabled actions retain a specific reason and a localization key. Disabled actions expose no handler.

A visible action therefore cannot become usable solely because client state, a URL, a card, or a marker says it is available.

## Mobile state contract

`MobileExchangeState` intentionally represents:

- `activeLens`;
- one `ExchangeSelectionState` containing `selectedOrganization`, `selectedRecord`, and `selectedMarker` references;
- `mapCamera` and optional `mapBounds`;
- authoritative/current geography context;
- per-lens `search`, `filters`, `sort`, result position, and `listScrollPosition`;
- `sheet.sheetSnapPoint`;
- `sheet.detailContext` and `detail.detailContext`.

`mobileExchangeStateFromParticipantSpatialContext` adapts the current persisted spatial context into the Stage 1 shape. It preserves existing search/filter/result/list continuity and maps the current panel state to a safe initial sheet state:

- closed panel → `peek`;
- open panel → `partial`.

It does not add a second persisted browser store or change the current spatial-context version. Stage 2 may evolve persistence only through an explicit versioning, invalidation, and compatibility decision.

`transitionMobileExchangeLens` changes only `activeLens`. Selection, camera, geography, sheet state, and each lens's own query/list state remain intact unless a later authoritative revalidation narrows them.

## Selected-object parity

`ExchangeSelectionState` has one canonical `selectionKey` shared by every present selected reference. The constructor rejects a state in which the selected organization, record, and marker have different keys.

This binds these interactions to one selected object:

- map marker selection;
- card selection;
- keyboard/accessible result selection;
- detail selection.

`selectionMatchesCard` and `selectionMatchesMapObject` give Stage 2 one comparison rule. A cluster is not an organization or domain record and does not participate in card selection parity.

A selected record may legitimately have no marker when privacy or domain projection rules provide no coordinate. The shared contract does not fabricate a coordinate to satisfy the composition.

## Bottom-sheet contract

`EXCHANGE_SHEET_SNAP_POINTS` is exactly:

- `peek`;
- `partial`;
- `expanded`.

`ExchangeSheetState` also distinguishes results from detail content and can carry a detail context. This is the state representation only. Stage 1 does not implement drag physics, gesture recognition, snap measurements, safe-area styling, or animation.

## Card contract

`LensResultCardModel` supports both organizations and permitted domain records. It contains:

- stable selection identity;
- organization/record identity;
- title and optional organization identity;
- locality;
- concise summary;
- an important status/date/indicator;
- capability/category metadata;
- optional media;
- favorite state;
- record-specific actions;
- whole-card detail context.

Domain lanes provide truthful models from their own authorized projections. The shared card contract does not manufacture market records or domain state.

## Media contract

`ExchangeMediaModel` supports:

- organization logo;
- business or facility photo;
- product or service image;
- project image;
- branded media;
- video poster/thumbnail;
- fallback presentation.

The model uses opaque asset/poster references and alternative/fallback text. It does not create final video playback, upload, transcoding, storage, moderation, or publication infrastructure.

## Favorite contract

`FavoriteState` supports hidden, disabled, and enabled presentation. `projectFavoriteState` keeps operational/applicable/authorized separate, removes the handler when unavailable, and declares `persistenceOwner: "domain"`.

The shared star is therefore a presentation and interaction contract only. It does not create an authoritative favorite relation. Until a domain packet supplies a real relation, permission, and handler, the star must remain hidden or truthfully disabled.

## Record-action contract

`RecordActionDefinition` provides the same fail-closed separation for card-specific actions. Domain lanes own the underlying business meaning, eligibility, commands, and server authorization. The shared contract owns only the generalized projection shape.

## Non-authorizing policy

`MOBILE_EXCHANGE_CLIENT_STATE_POLICY` states explicitly that mobile client state:

- stores no authorization;
- grants no protected-route access;
- grants no action permission;
- requires server revalidation of selected objects;
- requires server-derived protected-action permissions;
- does not own favorite persistence;
- treats sheet and camera state as presentation state.

Server authorization, privacy, geography release, lifecycle, publication, tenant, membership, and domain invariants remain controlling.

## Domain compatibility

### 02 — Opportunities/RFx

The shared model can represent opportunity/RFx map objects, issuer identity/media, the existing four Opportunities action positions, favorites when a real domain relation exists, RFx-specific record actions, and opportunity detail. No Opportunities-specific mobile shell, sheet, card, or navigation framework is required.

### 03 — Intelligence

The shared model can represent organizations, sites/locations, analytical records, capability/AMACS metadata, layers through the existing action positions, compare/watch as record actions, and Intelligence detail. Privacy-suppressed or non-spatial analytical objects may omit coordinates without breaking card/detail behavior.

### 04 — Resources

The shared model can represent provider/resource markers, offered or requested resource records, resource/provider media, availability indicators, the four Resource action positions, request actions, and provider/resource detail.

### 05 — Referrals

The shared model can represent referral records and relationship context, the four Referral action positions, favorite presentation when backed by a real relation, connect/refer/introduction record actions, and referral detail.

A missing generalized capability must be submitted through the Shared Contract Request mechanism. A domain lane must not fork the mobile shell, bottom sheet, card, media, favorite, selection, or navigation contracts.

## Stage 2 hard boundary

This Stage 1 contract does not implement:

- final persistent bottom-navigation visuals;
- floating search/filter placement;
- draggable-sheet gestures or production snap geometry;
- final responsive/safe-area CSS;
- Zillow-like card styling;
- final media playback;
- production lens-specific card streams;
- Opportunities/RFx, Intelligence, Resources, or Referrals business logic;
- synthetic market records.

Stage 2 may compose visual components only after the exact Stage 1 candidate has been reviewed for compatibility by lanes 02–05 and accepted for implementation sequencing by Control Room.
