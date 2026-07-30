# RFxchange Participant Design Convergence Gate

**Status: IMPLEMENTED AFTER WAVE 2 SLICE 2.8 — NO FEATURE-ID COMPLETION**

## Baseline and boundary

This non-feature architecture correction begins from merged `main` at
`6e6d0f68602105745b4749144e75ee93cb1bd7d7`, after Wave 2 Slice 2.8.

It does not implement Slice 2.9, change product lifecycle state, alter server authority,
weaken location privacy, rewrite marker eligibility/projection, modify authoritative
geography, or complete any Feature ID.

The canonical tracker remains **438 total · 106 Done · 332 Not Started** with Activation
at **31/43**.

## Corrected participant architecture

Participant routes now consume one shared application shell with a restrained `64px`
desktop top navigation and compact mobile navigation. Primary product modes are expressed
through that top navigation; no permanent left participant rail exists.

Two shared workspace modes govern route composition:

### Spatial Workspace

- fills the full remaining viewport below participant navigation;
- extends the map edge-to-edge without ordinary page margin;
- leaves geographic context visible behind Ivory overlays and responsive edge sheets;
- turns edge drawers into bottom sheets on mobile;
- contains no persistent route heading, map-title bar, dark outer figure or visual
  explanatory footer.

### Operational Workspace

- uses Warm Ivory as the participant workflow canvas;
- gives typography, whitespace and task hierarchy precedence over containers;
- admits contextual geography without forcing a map-centered shell;
- remains appropriate for organization authority and essential-profile workflows.

## Shared primitives

`src/components/participant/ParticipantWorkspace.tsx` establishes:

- `ParticipantShell`;
- `ParticipantTopNavigation`;
- `SpatialWorkspace`;
- `OperationalWorkspace`;
- `MapOverlaySurface`;
- `ResponsiveEdgeSheet` (desktop edge drawer and mobile sheet);
- `MapControlGroup`;
- `LocalityStatusOverlay`;
- `SearchFilterOverlay`.

`src/design/tokens.ts` and `app/globals.css` make the participant-default relationship
explicit: Warm Ivory is the canvas and light-glass source; Exchange Black and Graphite are
structural; Gold is focal; Intelligence Blue and Growth Green retain semantic roles.

## Migrated participant surfaces

| Surface | Shared mode | Material correction |
| --- | --- | --- |
| Controlled geography / Intelligence | Spatial | Removed dark page, route hero and headed map card; map now fills the viewport with one search/filter entry and locality status overlays. |
| Organization resolution | Spatial | Resolution results move into a responsive edge sheet over persistent controlled geography. |
| Organization authority | Operational | Replaced the full-screen dark participant canvas with a light focused workflow. |
| Organization location | Spatial | Location confirmation uses a full map plus responsive form sheet; candidates remain projected from coordinates. |
| Essential organization profile | Operational | Profile fields use the light workflow canvas with contextual confirmed geography. |
| Marker activation | Spatial | “You are now on the Exchange map” appears as a success sheet over the real active marker; mobile detail collapses so the marker remains visible. |

Organization 360 remains an administrative/operational surface and was not forced into the
participant Spatial Workspace.

## Renderer and marker invariants

`ControlledLocalityCanvas` now fills its parent spatial viewport. Route heading, map
heading and visual explanatory footer responsibilities have been removed from the
renderer. The component retains:

- U.S. Census TIGER-derived authoritative geometry and provenance;
- canonical locality identity, projection and camera/zoom levels;
- deterministic fill/outline/label/point layer ordering;
- the selected Gold boundary over its contrasting outline;
- muted surrounding geography;
- SVG/vector rendering and non-scaling boundary strokes;
- keyboard-operable zoom and marker controls;
- a structured screen-reader description and point summary;
- visible attribution and an Ivory glass legend.

Organization markers remain projected from canonical/privacy-safe coordinates. The
renderer-owned geographic anchor retains the projection `transform`; one-time activation
motion is applied only to an internal marker visual child. The normal pin remains solid
with `stroke: none`, while focus/selection use a separate halo.

## Future Wave 2 boundary

The Wave 2 roadmap now requires Slices 2.9–2.12 to consume these shared shells. Their
Feature-ID scope and acceptance intent remain unchanged. Slice 2.9 has not begun.

## Deterministic browser QA evidence

Browser QA used the local production UI data and the following viewport matrix:

| Viewport | Routes / interactions reviewed | Result |
| --- | --- | --- |
| `1440×900` | Geography/Intelligence, organization resolution, authority, location, essential profile and marker activation | One participant navigation; edge-to-edge spatial maps; Warm Ivory operational canvas; map remains visible behind edge sheets; selected authoritative boundary and attribution remain legible. |
| `900×800` | Organization location | Intermediate-width edge sheet preserves usable map context; duplicate locality overlay is removed when drawer width would obscure it. |
| `390×844` | Geography, resolution, location, profile and activation | Compact menu, mobile sheets, search/filter overlay, thumb-sized controls, readable forms and no horizontal overflow; activation uses a compact expandable success sheet so the active marker remains visible. |

Interaction evidence:

- desktop geography exposed exactly one ordinary primary navigation, one search entry and
  one Spatial Workspace main region;
- opening the filter disclosure preserved the map in the accessibility tree and visible
  composition at desktop and mobile sizes;
- the mobile participant menu exposed Intelligence and Account links while future modes
  remained explicitly unavailable;
- zoom controls remained native keyboard-operable buttons with visible focus treatment;
- the organization marker remained a keyboard-addressable `button`, and selection changed
  its `aria-pressed` state without changing the geographic source coordinate;
- development-console review contained no warning or error from the migrated routes;
- reduced-motion CSS removes the one-time internal marker animation without affecting the
  renderer-owned anchor.

## Automated validation

The canonical `npm run check` gate passed after the convergence:

- product, architecture, Firebase, Firestore, authentication, communications, geography,
  organization, marker and design-convergence validators passed;
- Firebase Functions build passed and all `13` Functions tests passed;
- all `308` architecture/domain tests passed;
- Next.js route type generation and TypeScript checking passed;
- ESLint passed with no errors (three unrelated pre-existing unused-variable warnings);
- the optimized Next.js production build completed and prerendered every migrated
  participant route.
