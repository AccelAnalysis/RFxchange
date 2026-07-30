# RFxchange Map Visual System

**Status: CANONICAL MAP / GEOGRAPHY VISUAL AUTHORITY**

The RFxchange map is the primary spatial canvas for organizations, opportunities, resources, service territories and local economic context. It must preserve real geography, make the user's active locality unmistakable and keep surrounding context legible without competing for attention.

This file normalizes the approved brand direction, newer map UX decisions and the merged Wave 2 Slice 2.2 controlled-locality implementation.

---

## 1. Core rules

- Geographic state is real product state, not decorative background.
- Locality boundaries use authoritative geometry and remain provider-neutral at the domain level.
- Organization/resource/opportunity markers are anchored to geographic coordinates and must not drift under pan/zoom.
- Localities are represented through GIS geometry/outlines/fills, not pin substitutes.
- The selected locality is visually dominant.
- Surrounding/non-focus localities remain visible and readable but muted.
- Service geography is distinct from physical/home location and should be rendered as an area/territory rather than pretending the service area is a point.
- Map interaction should preserve orientation and viewport continuity whenever possible.

---

## 2. Authoritative boundaries

Use authoritative U.S. Census TIGER/Line/TIGERweb-style locality geometry or another explicitly approved authoritative source.

The merged Slice 2.2 baseline uses versioned U.S. Census TIGERweb geometry, retains provenance and rejects incompatible/malformed geometry. Future renderers may change mapping providers without changing the canonical locality identity or geometry authority.

Do not replace authoritative locality boundaries with approximate rectangles or CSS outlines around UI containers.

---

## 3. Controlled-locality baseline

The merged initial controlled-locality rendering establishes this baseline order:

| Order | Layer | Purpose |
| ---: | --- | --- |
| 10 | surrounding fill | muted contextual geography |
| 20 | selected fill | active locality focus |
| 30 | surrounding outline | readable adjacent boundaries |
| 40 | selected outline contrast | dark contrast foundation |
| 50 | selected outline accent | RF Gold focal outline |
| 60 | locality labels | geographic naming above fills/outlines |

This is the first canonical visual layering contract for locality rendering. Later map providers may express these layers differently, but the semantic ordering should remain: contextual fill below selected focus, boundaries above fills, selected accent above surrounding boundaries and labels above geography fills.

Current Slice 2.2 map tokens include:

- surrounding fill: neutral gray family at low opacity;
- selected locality: active green-derived fill treatment;
- selected outline: dark contrast stroke plus RF Gold accent stroke;
- surrounding outline: restrained neutral graphite/gray;
- water/background: light cool neutral;
- labels: high-contrast selected label plus quieter surrounding labels.

The selected-locality green is a map-focus token. It does not assert an economic outcome merely because it derives from the green family.

---

## 4. Locality focus states

### Selected locality

- prominent authoritative outline;
- full visual focus relative to adjacent localities;
- sufficient interior contrast for labels/markers;
- camera fit based on canonical bounds/default camera;
- RF Gold may be used for the focal boundary accent.

### Surrounding locality

- visible for orientation;
- desaturated/muted fill;
- readable but subordinate boundary;
- quieter labels;
- no false implication that surrounding geography is inaccessible merely because it is visually muted.

### Non-focus region

When broader regional context is visible, use neutral dimming/gray treatment rather than completely removing geography. Users should understand where their active locality sits in relation to neighboring places.

---

## 5. Geography release-state visualization

Product authority determines the release state. Visual treatment communicates it but never grants participation.

### Released

- normal active interaction according to user authority;
- selected released locality may use full focus treatment;
- participation actions may be enabled when other requirements are satisfied.

### Visible / Unreleased

- locality remains visible for geographic context;
- muted/dimmed visual treatment;
- explicit text/status indication when interacted with;
- no active participation affordance that implies release.

### Limited

- remain spatially visible;
- show explicit `Limited` state and allowed interaction boundary;
- use icon/label/pattern or other non-color cue in addition to color.

### Restricted

- subdued, clearly non-participatory treatment;
- explicit `Restricted` label/status when relevant;
- no hover/selection affordance that implies access;
- do not rely on red alone; restriction is an access state, not necessarily an error.

---

## 6. Markers

### 6.1 Anchoring

All entity markers must derive screen position from geographic coordinates through the map projection/rendering engine.

Do not use viewport-relative DOM offsets as the authoritative marker position.

A marker must stay anchored to the same real coordinate during:

- zoom;
- pan;
- resize;
- orientation change;
- responsive layout change;
- camera fit/fly transitions.

### 6.2 Marker shape and outline

Do **not** use an exterior outline around normal pins/markers as the standard treatment.

Use:

- fill;
- internal glyph/icon;
- subtle shadow/elevation;
- scale/halo/background layer for hover/selected state if necessary.

A selection halo should be a separate state layer, not a permanent stroke around every pin.

### 6.3 Entity distinction

Organization, opportunity and resource/provider markers should use a consistent marker family while remaining distinguishable by more than color alone.

Use combinations of:

- glyph/icon;
- shape variation where appropriate;
- concise label/tooltip;
- semantic accent.

Do not create a completely unrelated marker style for each feature domain.

### 6.4 Semantic color guidance

- RF Gold: organization/brand/focal connection emphasis where appropriate.
- Signal Blue: intelligence, opportunity/discovery/data cue.
- Growth Green: positive outcome/progress state, not the default marker color for every active entity.

Exact marker token assignment should be centralized when the production marker family is implemented.

---

## 7. Marker interaction

### Default

Crisp, anchored and legible at common zoom levels without dominating the locality geometry.

### Hover/focus

May use:

- small scale increase;
- subtle halo;
- elevated shadow;
- label/tooltip reveal.

Keep the geographic anchor fixed while the visual emphasis changes.

### Selected

Selection should create a clear relationship between the marker and its detail panel/drawer. Do not shift the marker away from its coordinate to make room for UI.

### Activation moment

When an organization first satisfies the activation gate and its real marker appears, a one-time short animation may reinforce the success moment. Avoid repeated bouncing or pulsing.

---

## 8. Service territories and overlays

Service areas/localities are geography layers, not additional pins.

Use low-opacity area fills and/or boundaries that remain beneath entity markers and labels.

Rules:

- preserve underlying locality context;
- distinguish service territory from home/physical location;
- avoid solid opaque polygons that erase the basemap;
- selected organization/service area may gain a stronger boundary while remaining subordinate to the selected locality boundary;
- use labels/legend and not color alone when multiple territory states overlap.

---

## 9. Connection paths

Gold connection paths are a signature visual for explaining flow between organizations, opportunities, referrals, support and outcomes.

Use them deliberately, not as ambient decoration.

A path should represent a real relationship/state such as:

- issuer → opportunity;
- opportunity → responder;
- responder → teammate;
- organization → referral/resource connection;
- tutorial/network-effect journey.

Path rules:

- anchor endpoints to real entity positions;
- avoid excessive simultaneous paths;
- use animation only to explain sequence/state;
- reduce prominence when the path is contextual rather than active;
- do not imply completed commercial/outcome value unless the underlying state supports it.

---

## 10. Layer hierarchy for future map content

The conceptual hierarchy for future map features should preserve this order even if exact implementation layer numbers differ:

1. basemap / terrain / water;
2. non-focus dimming/context;
3. locality fills;
4. locality outlines;
5. service-area/territory overlays;
6. relationship/connection paths;
7. organization/opportunity/resource markers;
8. hover/selected marker emphasis;
9. geographic/entity labels;
10. map UI overlays such as legends, search, filters and controls.

If a provider uses z-index/layer IDs, keep the semantic hierarchy documented and deterministic.

---

## 11. Locality labels

- selected locality label is highest-priority geography label;
- surrounding locality labels remain readable but subdued;
- labels remain geographically anchored during zoom;
- use halo/paint-order/contrast treatment to stay legible over variable fills;
- avoid excessive all-caps map labels;
- do not label every visible polygon if density reduces usability.

---

## 12. Basemap and non-focus treatment

The basemap supports orientation and context without competing with RFxchange layers.

Prefer:

- subdued roads/base geography;
- restrained saturation;
- clear land/water distinction;
- strong enough locality geometry to remain visible;
- limited decorative map styling.

Non-focus areas may be gray/dimmed but should not become blank voids.

---

## 13. Map controls and overlays

Use restrained glassmorphism for controls, legend, search/filter and transient detail where the map should remain visible beneath.

Rules:

- minimum 40–44px interaction targets;
- accessible labels for icon-only controls;
- no excessive stacks of floating panels;
- one coherent search/filter system;
- responsive repositioning without obscuring the selected locality unnecessarily;
- overlay contrast must remain readable over all map regions.

---

## 14. Desktop behavior

Desktop map experiences should favor:

- large continuous spatial canvas;
- edge/side drawers for results/details;
- compact floating controls;
- persistent geographic context while users compare entities/opportunities/resources.

Avoid reducing the map to a small card beside a conventional dashboard when geography is central to the task.

---

## 15. Mobile behavior

Use:

- full-width/full-height map canvas where relevant;
- bottom sheets or full-height drawers for list/detail;
- thumb-reachable controls;
- fewer simultaneous labels/overlays at small viewports;
- preserved marker/locality anchoring under rotation and resize.

Do not solve mobile by simply scaling desktop containers down.

---

## 16. High-density / retina rendering

- vector locality geometry and SVG/vector icons are preferred;
- use device-pixel-ratio-aware rendering for canvas/raster map layers;
- do not rasterize thin locality outlines at insufficient resolution;
- avoid blurry marker glyphs or upscaled screenshots;
- preserve non-scaling strokes where vector rendering would otherwise make boundaries change thickness undesirably during zoom.

---

## 17. Accessibility

Spatial information must have a structured/textual route.

At minimum:

- map controls are keyboard accessible;
- significant map views expose accessible title/description;
- meaningful selected entity/locality information is available outside color alone;
- marker actions can be reached without precision pointer interaction;
- focus state remains visible;
- reduced-motion preference is honored;
- legends/status labels explain visual encodings.

---

## 18. Current implementation compatibility

Wave 2 Slice 2.2 is already complete. Its Census/TIGERweb boundary model, selected/surrounding treatment and layer ordering are the current production baseline.

This design system does not reopen that completed slice. Where later design refinement suggests a visual improvement to the 2.2 preview/component, migrate it when that surface is next legitimately in scope or when a specific visual refactor is authorized.

Future slices must not bypass the 2.1/2.2 canonical geography authority merely to achieve a visual effect.
