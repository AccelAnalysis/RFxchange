# RFxchange Design System Index

**Status: CANONICAL VISUAL / UI DESIGN AUTHORITY**

This directory defines the approved visual system for RFxchange product interfaces, map experiences and presentations. It normalizes the current brand/presentation deck together with the newer map-first UI decisions and merged Wave 2 geography implementation.

## Authority

For visual and interaction decisions, use the following order:

1. Current explicit task instructions.
2. Security, privacy, authorization and domain invariants in `/AGENTS.md`, the canonical tracker/dependency map and applicable slice brief.
3. This directory for visual/UI/presentation behavior.
4. `docs/context/BRAND_AND_UX.md` for concise cross-cutting intent.
5. Existing merged production UI as implementation evidence and compatibility context.
6. `docs/reference/` prototypes/screenshots as reference only.

A visual rule never overrides security or product authority. If a visual requirement would require widening a slice beyond its approved Feature IDs, preserve the design intent, report the gap and defer the out-of-scope implementation rather than silently expanding scope.

## Files

- [`RFxchange_DESIGN_SYSTEM.md`](RFxchange_DESIGN_SYSTEM.md) — canonical product UI identity, color, typography, spacing, surfaces, controls, motion, accessibility, imagery and responsive behavior.
- [`MAP_VISUAL_SYSTEM.md`](MAP_VISUAL_SYSTEM.md) — canonical map/locality/marker/overlay/layer behavior, including the merged Wave 2 geography-rendering baseline.
- [`PRESENTATION_SYSTEM.md`](PRESENTATION_SYSTEM.md) — canonical presentation/deck visual hierarchy, composition, audience adaptation and claims discipline.

## Source basis

The design system is based on:

- `The_RFxchange_Brand_and_Presentation_System(1).pptx`;
- the merged Wave 0 brand foundation (`BRD-001`, `BRD-003`, `BRD-005`, `BRD-014`);
- `docs/context/BRAND_AND_UX.md`;
- current RFxchange product/user-journey rules;
- approved map direction: authoritative locality geometry, prominent selected geography, muted non-focus geography, real-coordinate markers, service-area overlays, restrained glassmorphism, less container chrome and higher-detail rendering;
- merged Wave 2 Slice 2.2 geography rendering, which establishes the first controlled locality layer contract.
- the post-Slice 2.8 Design Convergence Gate, which establishes the Warm Ivory
  participant default plus shared Spatial and Operational Workspace shells.

The PowerPoint deck remains provenance and presentation guidance. This directory is the normalized implementation authority for current product design.

## Design-system evolution

When the design changes:

- update the relevant file here first or in the same PR as the implementation;
- preserve semantic token meaning instead of proliferating one-off colors/styles;
- distinguish deliberate design changes from implementation accidents;
- do not retroactively mark an already-complete Feature ID incomplete merely because a later design refinement exists unless its documented acceptance condition is actually invalidated;
- if an existing merged component differs from the new canonical system, migrate it when its owning surface is next in scope or when an explicit refactor is authorized.

## Codex reading rule

Before implementing any user-facing UI, Codex must read this index and `RFxchange_DESIGN_SYSTEM.md`. Before implementing a map/geography surface, also read `MAP_VISUAL_SYSTEM.md`. Before creating or modifying presentation content, also read `PRESENTATION_SYSTEM.md`.
