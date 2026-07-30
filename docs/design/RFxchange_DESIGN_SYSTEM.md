# RFxchange Product Design System

**Status: CANONICAL PRODUCT UI DESIGN AUTHORITY**

RFxchange should make local economic activity feel **visible, connected and actionable**. The interface must combine civic trust, market intelligence and premium local-network quality while remaining practical, measured and uncluttered.

The product is map-centered. UI chrome supports the map and workflows; it does not turn the map into decoration behind a dashboard.

---

## 1. Design principles

### 1.1 Map first

The geographic environment is the primary canvas whenever geography is relevant. Drawers, sheets, controls and detail surfaces should float over or alongside the map rather than repeatedly replacing it with boxed pages.

### 1.2 Useful before decorative

Every visible element should explain location, identity, capability, status, action or relationship. Avoid ornamental widgets, stock-dashboard density and decorative card grids.

### 1.3 One focal action

Each view should have one dominant task or decision. Secondary actions may exist, but hierarchy should be clear through scale, spacing, position and contrast rather than a collection of equally weighted buttons.

### 1.4 Less container chrome

Prefer whitespace, typography, grouping and surface shifts over borders around every section. Use containers where they create a meaningful interaction boundary: a drawer, modal, popover, selected detail panel or high-value data region.

Do not use borders as the default way to separate content.

### 1.5 Premium through restraint

RFxchange is polished, not flashy. Gold is a signal. Motion is purposeful. Glass effects are controlled. Gradients belong to environmental depth or data/map treatment, not to the logo itself or every button.

### 1.6 Real geography and real entities

Markers, locality boundaries, service areas and connection paths must correspond to real spatial or product state. Never simulate geographic meaning with arbitrary floating DOM positions.

### 1.7 Claims stay measured

Design should support capability-based discovery, qualified routing, complete business journeys and measured outcomes/intelligence. Do not visually imply guaranteed leads, awards, jobs, revenue, qualification or institutional endorsement.

---

## 2. Brand identity

### 2.1 Wordmark

Primary wordmark direction:

- `RF` in RF Gold;
- `xchange` in Exchange Black on light backgrounds;
- `xchange` in white/Warm Ivory on dark backgrounds;
- restrained `™` until a governed legal update authorizes another mark;
- no gradient inside the logo itself;
- no glow, outline or decorative effects applied directly to the wordmark.

The monogram/app mark may use `RF` in the same identity relationship.

### 2.2 Brand behavior

The brand should look like connective economic infrastructure: grounded, legible, local, intelligent and trustworthy.

Avoid visual language that resembles:

- a generic social-media feed;
- a cryptocurrency/fintech speculation product;
- an overfilled enterprise dashboard;
- a luxury lifestyle brand;
- a generic government portal.

---

## 3. Canonical color system

### 3.1 Core palette

| Token | Hex | Meaning |
| --- | --- | --- |
| Exchange Black | `#0B0B0D` | primary depth, dark canvas, high-contrast text/structure |
| RF Gold | `#D6A23A` | brand accent, focal signal, selected/connection emphasis |
| Warm Ivory | `#F7F3EA` | light canvas, warm high-contrast surface, reverse text |
| Graphite | `#252932` | panels, structure, dark secondary surface/type |
| Signal Blue | `#2E5EAA` | intelligence, data, links, discovery/information cues |
| Growth Green | `#3B7B57` | outcomes, progress, positive completion/growth cues |

### 3.2 Composition ratio

The brand deck establishes the directional composition target:

- ~70% light/dark canvas;
- ~20% black/graphite structure;
- ~7% gold accent;
- ~3% data colors.

This is a composition principle, not a literal pixel-count requirement. The intent is that canvas and structure dominate while gold and semantic colors remain meaningful because they are scarce.

### 3.3 Semantic discipline

- **Gold**: focal attention, brand identity, active connection/path emphasis, selected outline/accent, premium but not paid-advantage meaning.
- **Blue**: intelligence, data, links, analytical/discovery cues, informational state.
- **Green**: positive outcome, progress, completed/healthy state. A derived geography green may be used for active locality focus when explicitly defined by the map system; this must not imply a business outcome.
- **Red**: reserve for destructive/error/security-critical states when necessary; it is not a brand color.
- **Neutral gray**: inactive, surrounding, unavailable, unreleased or secondary context. Do not rely on gray alone to communicate a consequential state.

Never encode meaning through color alone. Pair state colors with labels, icons, patterns, text or interaction affordances as appropriate.

### 3.4 Derived colors

Derived tints/alpha values are allowed for:

- map fills and overlays;
- glass surfaces;
- hover/focus backgrounds;
- charts and data ranges;
- disabled states.

Derived colors must remain traceable to a semantic family and should be centralized as tokens rather than repeated as one-off literals when a pattern is reused.

---

## 4. Typography

### 4.1 Families

- **Aptos Display**: display headings, major section titles, key promises.
- **Aptos**: body copy, controls, captions, metadata and data labels.
- Use system-safe fallbacks when Aptos is unavailable. Do not bundle unlicensed font files.

### 4.2 Product hierarchy

Recommended responsive ranges:

- Hero / display: `48–72px` desktop, `36–52px` compact/mobile.
- H1: `36–56px`.
- H2: `28–40px`.
- H3: `22–30px`.
- Lead/body-large: `18–20px`.
- Body: `15–17px`.
- Metadata/caption: `12–14px`.
- Micro/attribution: `11–12px` when contrast and readability remain acceptable.

These are hierarchy ranges, not a requirement to use every size. Prefer fewer levels with strong consistency.

### 4.3 Typography rules

- Headings should be short and decisive.
- Avoid dense paragraph blocks where progressive disclosure or structured content is more usable.
- Use sentence case by default.
- Uppercase may be used for small eyebrows/status labels with increased tracking.
- Avoid fake-bold and overly condensed letter spacing for body content.
- Numerical/data displays may use tabular numerals where comparison benefits.

---

## 5. Spacing and density

Use a disciplined spacing scale built from:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`

Guidance:

- 4–8: icon/glyph/internal micro-spacing;
- 12–16: control groups and compact content;
- 20–24: panel sections and common layout gaps;
- 32–40: major sections;
- 48–64: page/hero separation.

Use denser spacing in operational/admin tables than in onboarding or map exploration, but preserve the same hierarchy.

---

## 6. Surfaces and glassmorphism

### 6.1 Base surfaces

Use Warm Ivory/light surfaces and Exchange Black/Graphite dark surfaces as the two principal visual modes.

### 6.2 Glass surfaces

Glassmorphism is an overlay treatment, not the default page background.

Appropriate uses:

- map control groups;
- search/filter overlays;
- map legends;
- transient detail cards/popovers;
- drawers/sheets where geographic context should remain visible.

Rules:

- use restrained transparency;
- blur should improve separation, not make text hazy;
- ensure sufficient text/control contrast over variable map content;
- include a fallback solid/translucent surface if backdrop filtering is unavailable;
- avoid stacking multiple glass layers over each other;
- avoid thick outlines around every glass surface.

### 6.3 Borders

Borders are semantic separators, not default decoration.

Use low-opacity 1px borders for:

- control boundaries;
- selected/active surface definition;
- table structure where required;
- glass separation when contrast otherwise fails.

Prefer spacing or background contrast for routine grouping.

### 6.4 Radius

Recommended token families:

- compact control: 8–12px;
- standard overlay/panel: 12–20px;
- prominent hero/sheet: up to 28px where appropriate;
- pill: 999px only for true pill controls/statuses.

Do not make every component a rounded card.

### 6.5 Elevation

Use shadows primarily for surfaces that physically layer above the map/page: drawers, popovers, menus, modal sheets and focused preview cards.

Avoid shadowing every list row or metric.

---

## 7. Controls and interaction

### 7.1 Minimum target size

Interactive controls should generally provide a minimum hit area around `40–44px` in each dimension, with mobile/touch experiences favoring 44px or larger.

### 7.2 Buttons

Use a small number of button treatments:

- primary action;
- secondary action;
- quiet/tertiary action;
- destructive action when necessary.

Do not create a unique button style for each feature domain.

Gold may be used for focal emphasis, but a paid/commercial action must not visually imply greater product authority or credibility.

### 7.3 Search and filters

The product should converge on a consistent search/filter pattern rather than separate affordances for each map layer or product tab.

Prefer:

- one main search entry;
- a clear filter control;
- a drawer/sheet for results or advanced filters;
- selected chips/status only when they summarize active state.

### 7.4 Focus states

Keyboard focus must be obvious. Gold is an approved focus accent on dark surfaces when contrast is sufficient. Focus should not depend on subtle shadow alone.

---

## 8. Navigation and layout

### 8.1 Product workspace

The core workspace should feel continuous rather than like a collection of disconnected dashboard cards.

When map-centered:

- keep the map visible whenever feasible;
- use overlay or edge drawers for lists/detail;
- preserve the user's viewport and selected geography when switching relevant product modes;
- avoid forcing full-page navigation for every marker/detail interaction.

### 8.2 Desktop

Desktop should support:

- full map canvas;
- persistent but restrained primary navigation;
- side or floating drawers for results/detail;
- contextual controls positioned consistently.

### 8.3 Mobile

Mobile should not shrink the desktop layout proportionally.

Prefer:

- map-first viewport;
- bottom sheet or full-height drawer for results/detail;
- thumb-reachable primary actions;
- compact top controls;
- progressive disclosure of secondary filters.

---

## 9. Icons, imagery and visual assets

### 9.1 Icons

- Prefer SVG/vector icons or resolution-independent system icons.
- Keep icon family/style consistent.
- Do not use color as the only domain distinction; combine icon shape/glyph and label.
- Decorative 3D treatment should not reduce legibility or become inconsistent across neighboring actions.

### 9.2 Imagery

Prefer realistic business/workflow imagery and real map/product visuals over generic stock handshakes or skylines.

Where screenshots are used in marketing/presentation material, they should reflect actual product state or be clearly identified as conceptual.

### 9.3 Retina/high-density quality

- Prefer vector boundaries, icons and linework.
- Render canvas/WebGL/rasterized surfaces at the device pixel ratio where the implementation technology requires it.
- Do not upscale low-resolution screenshots/assets to fill high-density displays.
- Use appropriately sized `srcset`/responsive imagery for raster assets when relevant.
- Keep text, map outlines, pins and glyphs crisp under browser zoom and high-DPI displays.

---

## 10. Motion

Motion explains state change; it should not compete with the work.

Recommended ranges:

- hover/control feedback: ~120–180ms;
- drawer/sheet transitions: ~180–280ms;
- meaningful map/marker activation: ~240–420ms.

Rules:

- no continuous decorative bouncing/pulsing;
- camera motion should preserve geographic orientation;
- marker activation may animate into place once to reinforce the success moment;
- respect reduced-motion preferences;
- never use motion as the only indication that state changed.

---

## 11. Accessibility

Target WCAG AA behavior for active product surfaces.

Required principles:

- sufficient text/control contrast;
- keyboard-operable controls;
- visible focus state;
- screen-reader labels for map controls and meaningful icon-only actions;
- state never communicated by color alone;
- accessible names/descriptions for significant map visualizations;
- reduced-motion behavior;
- touch target sizing appropriate for mobile;
- data tables and administrative grids preserve semantic structure.

Map accessibility should provide a textual/structured path to the meaningful entities/actions represented spatially.

---

## 12. Status and state language

State should be explicit and typed in UI copy.

Examples include:

- Released / Visible-Unreleased / Limited / Restricted geography;
- Unclaimed / Claim pending / Claimed / Conflict / Restricted organization;
- Draft / Published / Closed RFx;
- Profile incomplete / Profile complete.

Do not collapse materially different states into vague color-coded badges.

Verification, authority, commercial status and credibility are distinct concepts and must remain visually and linguistically distinct.

---

## 13. Data and intelligence visuals

Use Signal Blue as the primary intelligence/data cue, supported by neutral scales.

Growth Green should indicate positive outcome/progress, not simply that a number is high.

Charts should:

- foreground the comparison or decision;
- use minimal gridlines;
- avoid decorative 3D chart effects;
- show source/time context where meaningful;
- avoid implying causal certainty where the data is only correlational or directional.

---

## 14. Admin surfaces

Administrative UI uses the same brand system but may be denser.

Rules:

- prioritize task/attention state over decorative dashboards;
- maintain scoped context visibly when an admin is acting within an organization/geography;
- show consequential state changes, evidence and audit context clearly;
- use tables/lists where they improve operational comparison;
- do not trade authorization clarity for visual minimalism.

Sensitive actions require clear state, permission and confirmation affordances consistent with the underlying administrative architecture.

---

## 15. Anti-patterns

Avoid:

- card grids for content that can be grouped through layout;
- border dividers between every item;
- unanchored map pins or markers that drift during zoom/pan;
- pin outlines used as the normal marker treatment;
- hiding all non-selected geography and losing spatial context;
- using paid/member status as a visual proxy for credibility or qualification;
- arbitrary gradients in the logo;
- excessive glow, neon or gold decoration;
- repeated search/filter controls across the same workspace;
- unreadably translucent glass panels;
- generic stock-business imagery when product/map context would be stronger;
- dense copy where structured steps/status can communicate better.

---

## 16. Relationship to the map system

All geography, locality, marker, service-area, path and release-state visual behavior is further governed by [`MAP_VISUAL_SYSTEM.md`](MAP_VISUAL_SYSTEM.md).

When a map-specific rule conflicts with a generic product-surface recommendation, the map-specific rule controls the map presentation while security/domain authority still controls product state.

---

## 17. Relationship to the presentation system

Slide/deck typography sizes and composition rules are defined in [`PRESENTATION_SYSTEM.md`](PRESENTATION_SYSTEM.md). Do not copy presentation point sizes directly into product CSS.
