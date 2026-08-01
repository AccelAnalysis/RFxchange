# Brand Gate B2 — Shared Component Primitives

**Status: IMPLEMENTED ON THE AUTHORIZED B2 BRANCH — FINAL CI AND MERGE REQUIRED BEFORE B3**

## Objective

Brand Gate B2 creates one reusable component vocabulary for The RFxchange without changing domain authority, enabling later-wave objects, or beginning cartographic convergence.

## Baseline

B2 branches from merged B1 `main` at:

`f8ab3e7e50bb3afbad916110d158f6487dadd7ee`

The tracker remains **438 total · 121 Done · 317 Not Started**, Activation remains **43/43**, and Network remains **7/38**. Brand Gates do not mark Feature IDs complete.

## Implemented primitives

The shared UI layer provides:

- participant navigation frame;
- map/viewport overlay panel;
- responsive edge sheet;
- accessible control group;
- search/filter frame;
- status summary and status pill;
- alert banner;
- loading, empty, success, error, permission, expired and recovery states;
- object card;
- ordered timeline;
- accessible data table;
- visually hidden text.

The existing participant shell now consumes the shared navigation, overlay, sheet, control, search/filter and status primitives while preserving current routes, labels and unavailable-layer truth.

## Accessibility and sensory behavior

The primitives include:

- named navigation, search, control and table regions;
- live and busy semantics for loading;
- alert semantics for errors and permission failures;
- current-step semantics for timelines;
- row and column headers for tables;
- visible keyboard focus;
- reduced-motion behavior;
- reduced-transparency fallback;
- responsive sheet and navigation behavior.

## Authority-gated visual contracts

B2 defines interfaces for:

- organization nodes;
- future opportunity beacons;
- provider service fields;
- referral/team/RFx relationship paths;
- credibility evidence seals;
- evidence-backed outcome paths.

Every interface requires a source record, projection version and observation timestamp. The policy explicitly prohibits synthetic runtime objects and rendering planned objects as live. Missing authority must result in omission plus truthful explanation, and coordinate precision may not be expanded.

These interfaces do not create or render live later-wave objects. B3 may migrate the existing organization marker to the node grammar. Opportunities, service fields, relationship paths, seals and outcome paths remain gated by their owning domains.

## Compatibility

- Existing participant routes and wrapper exports remain intact.
- Existing Wave 2 map and activation behavior is unchanged.
- B1 semantic tokens are consumed instead of approved raw color literals.
- No Mapbox style, marker geometry, orbit, pitch, zoom, lifecycle, authorization, privacy, acquisition or tracker behavior changes.

## Validation

B2 adds product-system guardrails and architecture tests for primitive availability, accessible semantics, reduced motion, semantic styling, participant migration and authority-gated visual inputs.

## Exit

B2 is complete only after final CI passes and the implementation PR merges. Brand Gate B3 — Cartographic Convergence is the next gate and must branch from merged B2 `main`.
