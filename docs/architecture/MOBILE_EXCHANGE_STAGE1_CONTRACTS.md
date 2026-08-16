# Mobile Exchange Stage 1 Shared Contracts

**Owner:** 01 — Shared Exchange Platform

**Packet:** `WP-MOBILE-EXCHANGE-STAGE1-01`

**Activation epoch:** `mobile-exchange-stage1-2026-08-16`

**Immutable activation base:** `0b23a9f9b49468aab12609dea6116e1409c925fe`

**Control Room packet:** PR #217

**Product authority:** `docs/program/MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md`

**Composition reference:** `docs/reference/screenshots/rfxchange-mobile-composition-reference.jpg`

**Candidate disposition:** `Implemented — Not Verified` when exact-head implementation checks are green and no known material Stage 1 finding remains. Independent Acceptance is optional assurance under current completion governance; only an actual independent assurance event may be described as `Verified`.

## Purpose and boundary

Stage 1 binds the governed mobile composition to one reusable Shared Exchange contract. It does not implement the Stage 2 visual shell, bottom-navigation styling, floating-search layout, draggable gestures, production card styling, media playback, map rendering, or lens-specific result streams.

The contract family is implemented in:

- `src/application/participant/mobile-exchange-contracts.ts` for the shared shell, lens, action, card, media, favorite, focal/associated selection, map, sheet, layer, relationship and detail primitives;
- `src/application/participant/mobile-exchange-continuity.ts` for scoped continuity, independent fail-closed revalidation/narrowing, safe return context, per-lens layer revalidation, floating search/filter projection and accessibility obligations.

It composes existing shared seams rather than creating a second mobile application architecture:

- `participant-lens-registry.ts` remains the source of the four permanent lenses and Account/Quick Start utility separation;
- `exchange-room-actions.ts` remains the source of the fixed `4 lenses × 4 action positions` registry and its operational/applicable/authorized projection;
- `participant-spatial-context.ts` remains the current scoped, versioned, non-authorizing continuity substrate;
- `map-view.ts` remains the camera/view contract.

## Permanent mobile composition

The shared contract fixes these Stage 2 composition obligations without rendering them:

- map-first/full-screen Exchange shell;
- search/filter as a map overlay;
- persistent bottom lens navigation in the exact order `Opportunities/RFx | Resources | Intelligence | Referrals`;
- Account/Menu as a utility rather than a fifth lens;
- bottom-sheet snap state `peek | partial | expanded`;
- exactly four active-lens action positions at the top of the sheet;
- reusable result cards with media, favorite, metadata, record actions and detail entry;
- one coordinated focal selected-object state across map/card/keyboard/detail;
- state continuity across ordinary lens changes.

These are data and interaction contracts, not final React components.

## Fixed four-position action contract

`LensActionDefinitionTuple` has exactly four positions. `mobileLensActionRail` adapts the current Phase 2 action projections and validates each projected action against the canonical registry ID and position. Duplicate, substituted, missing, or displaced entries fail closed.

Every lens action keeps these facts separate:

- `operational` — a real governed runtime/handler exists;
- `applicable` — the current object/context supports the action;
- `authorized` — current server-derived authority permits the action.

Rendered availability is derived only after those facts are known. Disabled actions retain the current machine reason, use the existing localized unavailable explanation, and expose no handler. A disabled action is presentation truth, not the security boundary.

Record-specific card actions remain distinct from the frozen sixteen lens-level action positions.

## Focal subject and associated organization identity

The Stage 1 selected-object contract intentionally distinguishes:

1. the **focal subject** — the organization or domain record being inspected; and
2. a separately keyed **associated organization** — for example an issuer, provider, counterparty or owner.

For a focal domain record:

- the record/card/detail and a legitimate record marker retain the record's canonical `selectionKey`;
- the associated organization retains its own organization `selectionKey` and explicit association role;
- an associated organization marker retains the organization's key rather than being mis-keyed as the record;
- a record's optional organization association must agree with the separately keyed organization context when both are supplied.

This lets a truthful Opportunity + issuer organization, Resource + provider organization, or Referral + counterparty organization coexist in one selection state without identity substitution.

`selectionMatchesCard` remains focal-subject matching. `selectionMatchesMapObject` can also recognize the separately keyed associated organization marker while the domain record remains focal.

## Independent continuity narrowing

Client continuity is non-authorizing and is revalidated against current server/domain truth.

`reconcileMobileExchangeContinuity` supports independent results for:

- focal subject authority;
- associated organization authority;
- relationship identity authority.

A rejected focal record can narrow safely to a separately revalidated associated organization and its organization marker while preserving safe camera, geography, lens query/list state and sheet continuity. Open record detail closes during that narrowing.

If only the associated organization becomes invalid while the focal record remains permitted, the stale organization association and associated marker are removed without discarding the focal record. If only the relationship becomes invalid, the relationship identity is removed independently.

Scope changes involving schema, session, participant, membership, viewer organization or geography still invalidate the whole client continuity state fail closed.

## Relationship identity and privacy-safe path projection

The existing `ParticipantSpatialSelection.relationshipId` is preserved during migration as opaque `carried-unvalidated` relationship context rather than silently dropped. It never grants disclosure.

A relationship path is a separate server/domain projection:

- `authorized-path` may contain only currently permitted endpoint organization IDs and an optional governed geometry reference;
- `no-path` is explicit and contains no endpoints or geometry;
- both forms keep relationship identity distinct from record and organization identity;
- lifecycle, consent, endpoint eligibility and path authorization remain domain-owned.

This provides Referrals with a shared path/no-path seam without moving Referral business logic into Shared Exchange.

## Per-lens analytical layer continuity

A Layer remains a map/analytical projection **inside** a lens. It is not a lens and is not encoded as a filter.

Each `LensContinuityState` carries:

- `activeLayerIds`;
- `layerStateAuthority` (`carried-unvalidated | domain-revalidated`).

`withDomainRevalidatedMobileExchangeLayers` intersects carried/requested IDs with the current domain-provided layer registry. Unknown or removed IDs are discarded. Layer state remains presentation state and grants no access to layer data.

Point, cluster, area and relationship map projections can carry `layerIds`, allowing a governed projection to identify the layer(s) it belongs to without creating an Intelligence-private map or a second layer store.

## Non-point area/field projection

`ExchangeMapAreaProjection` is a provider-neutral non-point projection for governed geography/field concepts such as a Resource provider's service territory.

It carries:

- stable area identity;
- optional association to a focal/organization selection key;
- authoritative geography ID and optional governed geometry reference;
- privacy and release treatment;
- accessible label;
- selectable/selected/emphasis presentation state;
- optional layer associations;
- `authoritySource: "server-derived"`.

It has no point coordinate requirement and therefore never fabricates an office, organization or Resource marker merely to show an area. Suppressed areas cannot be selectable or expose released geography detail. Geography interpretation and renderer behavior remain under existing map/geography authority.

## Card and media contract

`LensResultCardModel` supports organizations and permitted domain records with one validated subject identity, title, optional organization identity, locality, concise summary, status/important indicator, metadata, media, favorite, record-specific actions and whole-card detail.

`ExchangeMediaModel` supports logo/photo/product/service/project/branded/fallback presentation and separates a video poster from an actual video source:

- `kind: "video-poster"` describes the visual poster presentation;
- `posterReference` identifies the still poster/thumbnail;
- `videoSource.assetReference` identifies a distinct server-derived authorized video asset.

Stage 1 does not implement a player, upload, storage, moderation, transcoding or autoplay behavior.

## Map/card/detail consistency

`ExchangeSubjectIdentity` is the focal organization-or-record identity consumed by card, map and detail models. `createLensResultCardModel` constructs its detail context from that same identity object, preventing independent card/detail identity drift.

Organization and record projections use the same identity shape. Associated organization context is deliberately separate, not a second focal identity.

A permitted record may have no point marker when privacy or domain rules provide no coordinate. The shared contract provides non-point areas and explicit no-path relationships instead of inventing coordinates.

## Mobile continuity state

The shared state intentionally represents:

- `activeLens`;
- focal selected organization/record;
- separately keyed associated organization and marker context;
- optional relationship identity;
- map camera and optional bounds;
- current geography and whether it is carried or server-revalidated;
- per-lens search, filters, sort and analytical layers;
- result-set identity and cursor;
- result page/index;
- list and sheet scroll positions;
- sheet snap point;
- detail and return context.

`migrateParticipantSpatialContextToMobileExchangeContinuity` is the explicit adapter from the existing spatial-context version. It preserves existing camera/search/filter/result/list/relationship continuity and adds null/empty seams where the prior schema had no result-set cursor or layer state. Unsupported source versions fail closed.

Lens transitions preserve safe selection, camera, geography and each lens's own continuity while restoring the target lens's sheet scroll position.

## Geography authority

A geography ID restored from client continuity is `carried-unvalidated`, never server authority merely because it exists in browser state.

`withServerRevalidatedMobileExchangeGeography` may project `server-revalidated` only when a current server result exactly matches the active continuity scope. A different geography fails closed. Geography state grants no route, record or action permission.

## Bottom sheet and accessibility contract

The snap points are exactly `peek | partial | expanded`. Sheet state distinguishes result content from detail content and carries sheet-internal scroll state.

The shared accessibility policy binds Stage 2 to:

- safe-area support and clearance above persistent bottom navigation;
- generally 44px touch targets;
- keyboard and switch-access selection through shared selected-object state;
- a non-drag way to reach sheet positions;
- non-color-only selected/current state;
- structured list alternative to map results;
- focus restoration after detail;
- reduced motion;
- orientation/resize continuity;
- software-keyboard reachability;
- result cursor and sheet-scroll continuity.

Stage 1 does not implement gesture physics, CSS or animation.

## Non-authorizing policy

Mobile client state:

- stores no authorization;
- grants no protected-route access;
- grants no action permission;
- requires server/domain revalidation of selected objects, associated organizations, relationships and analytical layers;
- requires server-derived protected-action permission;
- does not own favorite persistence;
- treats sheet/camera/layer state as presentation only;
- treats return context as navigation only;
- never treats carried geography or relationship identity as disclosure authority.

Server authorization, tenant isolation, privacy, geography release, lifecycle, publication, membership and domain invariants remain controlling.

## Domain compatibility and finding disposition

The bounded convergence pass is designed to disposition the current exact-head findings as follows, subject to lanes 02–05 re-review of the new exact candidate:

- `MOB1-FIND-02-001` — addressed by focal record + separately keyed issuer organization and independent narrowing;
- `MOB1-FIND-02-002` — remains addressed by scoped continuity/geography revalidation;
- `MOB1-FIND-02-003` — addressed by separate server-derived actual video source plus poster semantics;
- `MOB1-FIND-03-001` — addressed by per-lens layer continuity and projection association;
- `MOB1-FIND-04-001` — addressed by the same generalized focal Resource + provider organization contract;
- `MOB1-FIND-04-002` — addressed by generic non-point area/field projection;
- `MOB1-FIND-05-001` — addressed by focal Referral + counterparty organization/marker and safe narrowing;
- `MOB1-FIND-05-002` — addressed by carried relationship identity plus authorized-path/explicit-no-path projection.

These are Lane 01 implementation dispositions, not domain concurrence. Lanes 02–05 must review the corrected exact SHA through GitHub. No domain-private shell, selection, media, layer, map-field or path framework is authorized.

A new Shared Contract Request is unnecessary for this correction pass because all five generalized gaps fit the already-authorized Stage 1 shared contract family.

## Stage 2 hard boundary

This Stage 1 contract does not implement:

- final persistent bottom-navigation visuals;
- floating search/filter styling;
- draggable-sheet gestures or production snap geometry;
- final responsive/safe-area CSS;
- Zillow-like card styling;
- media playback;
- production lens-specific card streams;
- new Opportunities/RFx, Intelligence, Resources or Referrals business logic;
- new map renderer behavior;
- synthetic market records;
- tracker completion.

Stage 2 remains unauthorized until Control Room closes Stage 1 against the final exact candidate and domain re-review state.
