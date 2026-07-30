# Slice 2.2 — Geography Rendering

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `GEO-004` — Authoritative locality boundaries
- `GEO-005` — Selected geography highlighted
- `GEO-006` — Surrounding geographies muted

## Objective

Turn the canonical geography authority established in Slice 2.1 into the controlled map canvas used throughout activation.

At slice exit, the selected locality uses approved authoritative boundary geometry, is visually prominent and camera-centered, while adjacent/surrounding localities remain legible and outlined under a muted treatment.

## Must read

- `/AGENTS.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/context/BRAND_AND_UX.md`
- `docs/context/USER_JOURNEY.md`
- `docs/reference/prototypes/README.md`
- `docs/reference/screenshots/README.md`
- canonical tracker/dependency map
- `docs/slices/WAVE_2_ROADMAP.md`
- Slice 2.1 implementation evidence after it is merged

## Prerequisite state

`GEO-004` depends on canonical `GEO-003` geography metadata. `GEO-005` and `GEO-006` depend on authoritative boundary behavior.

Do not begin from hard-coded demo polygons if authoritative geometry is expected from the geography contract.

## Product rules

### `GEO-004`
Use TIGER/Line or another explicitly approved authoritative locality boundary source. Keep boundary identity/version/provenance representable; do not reduce geography to a decorative bounding box.

### `GEO-005`
The selected locality is visually active: full map focus/color, prominent outline and camera-centered/fitted behavior. The locality outline should remain clearly visible through overlays.

### `GEO-006`
Surrounding localities remain geographically understandable rather than disappearing. They should remain outlined and receive a transparent gray/muted treatment so the user understands the controlled locality context.

## Acceptance intent

- approved authoritative locality geometry is used;
- selected locality is full color/prominently outlined/camera-centered;
- adjacent/surrounding localities remain visible and outlined under a transparent muted/gray overlay;
- layer ordering keeps boundaries visible rather than hiding them beneath overlays;
- map interaction does not cause coordinate-anchored objects to drift relative to geography.

## Expected implementation qualities

- boundary geometry separated from UI chrome;
- deterministic map layer ordering/z-order;
- no viewport-pixel positioning for geographic features;
- reusable locality styling driven by geography state;
- appropriate performance strategy for authoritative geometry;
- visual/interaction validation at multiple zoom levels;
- accessibility/contrast review for focus vs muted locality states.

## Explicit non-scope

Do **not** implement in Slice 2.2:

- seeded organization search/claims;
- organization address/geocode confirmation;
- organization marker activation;
- service-area modeling;
- the three-organization orientation scenario;
- future GIS administration tooling for uploading/approving boundaries.

## Exit checkpoint

The application has a real controlled locality canvas suitable for subsequent organization resolution and later marker activation without using prototype-only geometry.

## Completion discipline

Recalculate dependencies after Slice 2.2 merges. Do not begin Slice 2.3 automatically.
