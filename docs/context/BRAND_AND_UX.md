# RFxchange Brand & UX Context

This file is the concise cross-cutting product summary. The canonical visual implementation rules now live in `docs/design/`:

- `docs/design/RFxchange_DESIGN_SYSTEM.md` — product UI authority;
- `docs/design/MAP_VISUAL_SYSTEM.md` — map/geography visual authority;
- `docs/design/PRESENTATION_SYSTEM.md` — presentation/deck authority.

When implementing user-facing UI, use the design-system documents for detailed decisions rather than expanding this summary into one-off styles.

## Product feel

RFxchange should make economic activity feel **visible, connected and actionable**. The experience should communicate civic trust, market intelligence and a premium local network while remaining practical, measured and uncluttered.

## Core visual language

- Map-first geographic context.
- Strong, authoritative locality boundaries.
- Real organization/opportunity/resource positions and service territories.
- Connection paths used deliberately to explain economic relationships.
- Data/intelligence presented clearly without implying certainty or unsupported outcomes.
- Realistic business journeys over generic stock imagery or decorative dashboards.
- High-density/retina-quality linework, markers, icons and screenshots.

## Palette intent

The established palette uses:

- Exchange Black `#0B0B0D`;
- RF Gold `#D6A23A`;
- Warm Ivory `#F7F3EA`;
- Graphite `#252932`;
- Signal Blue `#2E5EAA` for intelligence/data/link cues;
- Growth Green `#3B7B57` for outcomes/progress cues.

Use gold as an attention signal, not blanket decoration. Preserve the deck's directional composition discipline: canvas/structure dominate; gold and semantic data colors stay scarce enough to remain meaningful.

Warm Ivory and the geographic map are the default participant environment. Exchange
Black and Graphite provide typography and structure; they do not make a full-screen dark
participant shell the normal application canvas.

## Map UX

The user's selected locality should be visibly dominant. Surrounding localities remain legible but muted. Localities use authoritative GIS geometry; markers are anchored to real coordinates and do not drift with camera changes.

Organization/resource/opportunity pins should not use a permanent exterior outline as their default treatment. Use fill, glyph, subtle elevation and separate selection/hover emphasis while preserving the geographic anchor.

Service areas and locality focus are area/geometry layers rather than pin substitutes.

Use restrained glassmorphism where it supports map readability. Avoid excessive cards, container borders and separators. The map should remain the primary spatial canvas rather than background decoration behind a dashboard.

Participant applications use two shared modes:

- **Spatial Workspace** — one top navigation plus an edge-to-edge map filling the
  remaining viewport, with Ivory overlays and responsive edge drawer/mobile sheet UI;
- **Operational Workspace** — a Warm Ivory workflow canvas for form, composition,
  policy, settings, table or administrative work where geography is contextual rather
  than primary.

Do not add a permanent participant left navigation rail or stack route/map headers above a
Spatial Workspace.

## Information hierarchy

Prefer one clear focal action or concept per view. Use typography, spacing and surface hierarchy instead of filling the interface with decorative widgets. Keep controls consistent and avoid duplicative search/filter/navigation affordances.

## Claims discipline

Use language such as:

- capability-based discovery;
- qualified routing;
- complete business journey;
- measured outcomes/intelligence.

Avoid product language implying guaranteed leads, guaranteed awards/jobs/revenue, replacement of institutional systems, or universal qualification.

## Audience consistency

The same product serves businesses, buyers, resource providers and institutional/community partners. Visual behavior should remain coherent while the value explanation changes by audience.

## Prototype rule

Visual prototypes may clarify interaction, hierarchy, map treatment or motion. They do not override current security, state, architecture, data-model or canonical design-system contracts. Read `docs/reference/prototypes/README.md` before porting prototype behavior.
