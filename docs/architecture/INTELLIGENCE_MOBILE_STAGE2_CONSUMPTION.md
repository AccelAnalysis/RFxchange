# Intelligence Mobile Stage 2 Consumption

**Lane:** 03 — Intelligence  
**Stage:** 2 — Restore the Shared Mobile Composition  
**Implementation base:** `e46f57473d9a1ead6b90c7f48a317252f3416f09`  
**Shared architecture:** merged PR #218 / Stage 1 contracts  
**Control Room authorization:** merged PR #217 / `MOBILE_EXCHANGE_STAGE_1_ARCHITECTURE_LOCK.md`

## Purpose

This bounded adapter maps current authoritative Intelligence/Network domain truth into the merged Stage 1 mobile Exchange contracts. It does not implement a mobile shell, map renderer, bottom-sheet component, bottom navigation, selection store, favorite store, card framework, or detail framework.

At branch creation, no Lane 01 Stage 2 implementation candidate was published. The adapter therefore targets the merged Stage 1 contracts and must reconcile against Lane 01's exact Stage 2 composition before final integration/merge.

## Current bound production truth

The adapter binds only current authoritative behavior:

- authorized Network organization discovery;
- the current privacy-safe organization marker projection;
- exact/approximate/locality-only location treatment already present on the public organization projection;
- published organization profile media projected through the existing ORG-018 public-delivery contract;
- published subordinate organization locations from ORG-019, restricted to the active controlled geography;
- structured AMACS-backed organization capability claims where present;
- legacy essential-profile capability context only when no structured claim projection exists;
- canonical controlled geography identity, bounds and boundary provenance;
- the existing four governed Intelligence actions.

Published subordinate organization locations may be projected as real Intelligence records when the current public enrichment contract supplies them. Exact/approximate published locations may receive a shared map object at their public coordinate; locality-only locations remain detail/card context without a fabricated point. This does **not** activate the dedicated `intelligence.locations` rail action, because that action still has no production handler. No standalone Site or analytical-observation runtime is created.

## Layer boundary

Intelligence remains the lens. Current production has no governed analytical layer registry/runtime, so the adapter exposes no analytical layer IDs and revalidates carried Intelligence layer state against an empty current domain set. Stale or invented layer IDs are discarded.

`intelligence.locations` and `intelligence.layers` remain the third and fourth governed action positions and remain disabled because the current action registry has no production handler for them.

## Cards and detail

Each real authorized Network organization can map to the common `LensResultCardModel` and shared detail identity. Cards may include:

- organization identity;
- authorized published logo/image/portfolio media when supplied by the current public enrichment projection;
- locality;
- current capability labels;
- AMACS release and exact `Organization claimed` provenance for structured claims;
- exact capability assertion status;
- location precision.

Media is used only from the existing published public organization-asset projection; otherwise the media slot remains empty. No favorite/watch state is shown because Intelligence has no governed favorite/watch persistence. No Compare action is invented.

Primary organization detail intentionally keeps location disclosure to locality + visibility + canonical geography identity. Published subordinate locations retain only their public projection: exact may carry the already-public display address, approximate carries no address, and locality-only carries neither address nor coordinate. The shared map uses only existing privacy-safe server projections; locality-only subordinate locations never receive a fabricated point.

## Analytical truthfulness

The Network discovery `totalMatched` value is retained only as discovery coverage metadata. It is explicitly not treated as:

- full-market organization count;
- economic activity;
- density;
- capability concentration;
- market share; or
- a gap/underserved indicator.

The adapter does not project Network match scores into cards, detail, map styling or analytical claims.

## Shared ownership boundary

Lane 01 continues to own:

- `MobileExchangeShell` presentation;
- persistent bottom navigation;
- draggable sheet behavior;
- shared card rendering;
- shared map rendering;
- shared selection and detail presentation;
- safe-area/responsive/accessibility behavior.

Lane 03 owns only this Intelligence domain-to-shared-contract binding plus a server helper that strips organization enrichment down to already-published public assets and published additional-location projections for the server-authorized Network organization set. No Shared Contract Request was required by the merged Stage 1 interfaces.

## Required final reconciliation

Before integration, fetch Lane 01's exact Stage 2 candidate or merged shell and verify that it consumes the merged contract shapes without duplicate Intelligence presentation or state. Remove any temporary presentation duplication if introduced elsewhere, then rerun the focused Intelligence mobile tests and applicable repository checks.
