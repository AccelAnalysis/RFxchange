# Slice 2.1 — Geography Authority

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `GEO-001` — Primary operating geography selection
- `GEO-002` — Server-side geography validation
- `GEO-003` — FIPS and geography metadata
- `GEO-007` — Geography release states
- `GEO-008` — Bird's-eye locality camera

## Objective

Establish geography as a canonical, server-authoritative RFxchange domain concept before boundary rendering, organization resolution or marker activation relies on it.

At slice exit, the application can select an organization's primary locality, resolve it to canonical geography metadata, enforce release/participation state server-side, and derive bounds/default camera behavior from that record.

## Must read

- `/AGENTS.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md`
- `docs/tracking/RFxchange_DEPENDENCY_MAP.md`
- `docs/slices/WAVE_2_ROADMAP.md`

## Prerequisite state

`GEO-001` depends on merged `ARC-007`. `GEO-002` follows `GEO-001`; `GEO-003` follows `GEO-002`; release-state and camera behavior depend on the canonical geography metadata.

Do not assume browser locality selection is authority merely because `ARC-007` can persist lifecycle state.

## Product rules

### `GEO-001`
Require a primary operating locality before the user proceeds into the geography-dependent orientation path. The selection represents where the organization is primarily based, not its later multi-locality service geography.

### `GEO-002`
Validate the selected locality on the server. A participant cannot grant itself access to an unreleased/restricted locality by changing URL/query/client/session/map state.

### `GEO-003`
Canonical geography metadata includes the identifiers/relationships needed by later map and network behavior, including FIPS where applicable, geography name/type, boundary reference/geometry contract, release status, parent/adjacent geography, map bounds and default camera.

Do not hard-code Portsmouth/Hampton Roads-specific values into the domain model merely because early launch geography uses them.

### `GEO-007`
Represent Released, Visible/Unreleased, Limited and Restricted states with explicit participation semantics. State must be enforceable by server-side/application authority rather than visual styling alone.

### `GEO-008`
Camera behavior is derived from canonical geography bounds/configuration. Fit to locality bounds and use configured bird's-eye/default camera where supported.

## Acceptance intent

- `GEO-001`: primary locality selection is required before orientation.
- `GEO-002`: browser-state manipulation cannot grant unauthorized locality access.
- `GEO-003`: FIPS/name/type/boundary contract/release state/parent-adjacency/bounds/default camera can be stored and retrieved as canonical geography metadata.
- `GEO-007`: all four release states exist with enforceable participation rules.
- `GEO-008`: selected locality can produce bounds-driven/default camera behavior rather than a hard-coded viewport.

## Expected implementation qualities

- explicit domain types/state rather than stringly typed UI values;
- persistence/repository boundary consistent with existing architecture;
- server-side selection/authorization path;
- deterministic release-state policy tests;
- invalid/unknown geography denial;
- tests proving a client-provided locality identifier is not sufficient authorization;
- no weakening of existing authentication, tenancy or Firestore rules.

## Explicit non-scope

Do **not** implement in Slice 2.1:

- `GEO-004` authoritative TIGER/Line boundary ingestion/rendering;
- `GEO-005` final selected-locality boundary styling;
- `GEO-006` muted surrounding-locality overlays;
- organization matching/claim/create;
- address capture/geocoding;
- service geography;
- Profile Complete;
- organization marker activation;
- orientation scenario content beyond the minimum gating/interface contract needed to prove geography precedes it.

## Exit checkpoint

A subsequent slice can ask for the selected locality and receive a canonical, validated geography object plus release state and camera/bounds information without trusting client-only state.

## Completion discipline

When implementation is later authorized, mark these Feature IDs Done only after their individual acceptance checks and validation evidence pass. Do not begin Slice 2.2 in the same task unless explicit authorization says to do so.
