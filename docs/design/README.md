# RFxchange Design System Index

**Status: CANONICAL IMPLEMENTED VISUAL / UI DESIGN BASELINE**

This directory defines the currently implemented and converged visual system for RFxchange product interfaces, map experiences and presentations. It normalizes the current brand/presentation provenance together with map-first UI decisions and the completed Wave 2 implementation.

Brand Gate B0 adds `docs/brand/` as the approved target Brand Experience System. The two directories have different responsibilities:

- `docs/brand/` defines the target product identity, semantic meaning, map/data grammar, messaging, motion, sensory boundaries, viewing modes, acceptance and sequential implementation plan.
- `docs/design/` defines the current implemented component, layout, map and presentation baseline until an authorized Brand Gate or bounded cross-cutting gate converges a surface.

## Authority

For visual and interaction decisions, use the following order:

1. Current explicit task instructions and the authorized slice, Brand Gate or bounded cross-cutting gate.
2. Security, privacy, authorization and domain invariants in `/AGENTS.md`, the canonical tracker/dependency map and applicable execution authority.
3. `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md` for participant lens hierarchy, truthfulness and continuity.
4. `docs/brand/` for target brand meaning and brand acceptance.
5. This directory for the currently implemented visual/UI/presentation baseline.
6. `docs/context/BRAND_AND_UX.md` for concise cross-cutting intent.
7. Existing merged production UI as implementation evidence and compatibility context.
8. `docs/reference/` prototypes/screenshots as reference only.

A brand or visual rule never overrides security or product authority. If a target brand requirement would require widening a slice beyond its approved Feature IDs, preserve the intent, report the gap and defer the implementation rather than silently expanding scope.

A domain-dependent brand expression may ship only when its authoritative domain exists. Do not fabricate opportunities, service territories, referral/team/RFx relationships, credibility or outcomes to satisfy a visual design.

## Implemented participant-shell convergence

The no-Feature-ID Exchange-shell truthfulness gate establishes the current participant navigation and loading baseline:

- the primary lens sequence is exactly `Opportunities/RFx | Resources | Intelligence | Capabilities`;
- Referrals is a governed cross-lens function and Menu/Account destination, not a primary lens;
- Opportunities/RFx is visibly present but explicitly unavailable, has no href, is not current and is described with text and assistive semantics rather than color alone;
- Network remains the current organization-network view/domain concept within Intelligence, not a peer lens;
- Account and Quick Start are separate utilities in the persistent participant header;
- Administration is optional, server-authoritative and limited to implemented destinations;
- the participant header and utility area persist across ordinary client-side lens changes;
- pending route content uses scoped status/skeleton treatment below the header; and
- the former root-level `Loading RFxchange` / `Preparing this page` takeover is not part of ordinary authenticated navigation.

The stable Intelligence route remains `/geography/canvas`, including compatible query parameters. This gate does not enable Opportunities/RFx, create RFx state, add Intelligence datasets, change Feature IDs or tracker totals, implement Dark Appearance, or begin Slice 4.1 runtime.

## Target brand authority

Read [`../brand/README.md`](../brand/README.md) first for participant-facing Brand Gate work.

Key target authorities include:

- [`../brand/RFXCHANGE_BRAND_EXPERIENCE_SYSTEM.md`](../brand/RFXCHANGE_BRAND_EXPERIENCE_SYSTEM.md) — product architecture, brand behavior and requirement classification;
- [`../brand/MAP_AND_DATA_VISUAL_GRAMMAR.md`](../brand/MAP_AND_DATA_VISUAL_GRAMMAR.md) — organization nodes, opportunity beacons, service fields, paths, seals and locality fields;
- [`../brand/CONTENT_AND_MESSAGING_SYSTEM.md`](../brand/CONTENT_AND_MESSAGING_SYSTEM.md) — terminology, claims and state language;
- [`../brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md`](../brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md) — supplemental brand acceptance;
- [`../brand/BRAND_IMPLEMENTATION_ROADMAP.md`](../brand/BRAND_IMPLEMENTATION_ROADMAP.md) — sequential convergence gates;
- [`../brand/BRAND_GATE_B0_RECONCILIATION.md`](../brand/BRAND_GATE_B0_RECONCILIATION.md) — Wave 2 reconciliation and Wave 3/4 integration boundaries.

## Files in this directory

- [`RFxchange_DESIGN_SYSTEM.md`](RFxchange_DESIGN_SYSTEM.md) — current product UI identity, color, typography, spacing, surfaces, controls, motion, accessibility and responsive behavior.
- [`MAP_VISUAL_SYSTEM.md`](MAP_VISUAL_SYSTEM.md) — current map/locality/marker/overlay/layer behavior, including the completed Wave 2 geography and marker baseline.
- [`PRESENTATION_SYSTEM.md`](PRESENTATION_SYSTEM.md) — current presentation/deck visual hierarchy, composition, audience adaptation and claims discipline.

## Source basis

The implemented design baseline is based on:

- `The_RFxchange_Brand_and_Presentation_System(1).pptx`;
- the merged Wave 0 brand foundation (`BRD-001`, `BRD-003`, `BRD-005`, `BRD-014`);
- `docs/context/BRAND_AND_UX.md`;
- current RFxchange product/user-journey rules;
- approved map direction: authoritative locality geometry, prominent selected geography, muted non-focus geography, real-coordinate markers, service-area overlays, restrained glassmorphism, less container chrome and higher-detail rendering;
- completed Wave 2 geography rendering, activation, marker, orientation, first-value and OPEN contracts;
- the post-Slice 2.8 Design Convergence Gate, which established the Warm Ivory participant default plus shared Spatial and Operational Workspace shells; and
- the Exchange-shell truthfulness/performance gate, which converged the persistent participant header, permanent lens registry, utility separation and scoped loading behavior without changing a Feature ID.

The PowerPoint deck remains provenance and presentation guidance. The Brand Experience System controls target brand convergence, while this directory records the current implementation baseline after each authorized gate merges.

## Design-system evolution

When the design changes:

- update the applicable target rule in `docs/brand/` and the implemented baseline here in the same authorized gate where practical;
- preserve semantic token meaning instead of proliferating one-off colors/styles;
- distinguish deliberate design changes from implementation accidents;
- do not retroactively mark an already-complete Feature ID incomplete merely because a later design refinement exists unless its documented acceptance condition is actually invalidated;
- if an existing merged component differs from the target Brand Experience System, migrate it only when its owning surface/gate is authorized;
- keep net-new capabilities such as Dark Appearance, Presentation Mode, sound preferences and haptics behind explicit product/tracker governance.

## Codex reading rule

Before implementing any user-facing UI, Codex must read this index, `RFxchange_DESIGN_SYSTEM.md`, `../brand/README.md` and the applicable brand guides. Before implementing a map/geography surface, also read `MAP_VISUAL_SYSTEM.md` and `../brand/MAP_AND_DATA_VISUAL_GRAMMAR.md`. Before creating or modifying presentation content, also read `PRESENTATION_SYSTEM.md`. Customer-facing copy and communications must read `../brand/CONTENT_AND_MESSAGING_SYSTEM.md`.
