# RFxchange Brand & Interface Design System

**Version:** 2.0 — In-Place Modernization Target
**Status:** Adopted visual and interaction target for modernization in AccelAnalysis/RFxchange; runtime convergence is tracked separately
**Applies to:** Exchange, Marketing & Acquisition Suite, Admin Console, Identity & Onboarding
**Architecture authority:** RFxchange Platform Solution Architecture Document (SAD)
**Supersedes on adoption:** conflicting visual guidance in `docs/design/RFxchange_DESIGN_SYSTEM.md`, `docs/product-system/BRAND_SYSTEM.md`, `src/design/tokens.ts`, and legacy screen-specific styling.

## September 13 mobile refinement

Explicit product-owner direction supersedes the gold interaction and locality-focus treatments below: use Signal Blue for primary buttons (white text), selected navigation, selected marker accents and a single locality outline. Retain RF Gold in the wordmark and existing relationship/recognition semantics. Shared glass opacity decreases by seven percentage points (78→71%, 94→87%; the result sheet and bottom dock 96→89%). Solid/reduced-transparency fallbacks remain available.

The map fills all viewport safe areas. Navigation, search, map controls, attribution and sheet content respect device insets. Short landscape viewports (height ≤520px) retain mobile navigation and collapsible sheets regardless of width. The handle is the only sheet resizing control: drag, tap, Enter/Space, Up/Down, Home/End and Escape remain accessible. Expanded sheets render in front of search. The mobile primary lens label is RFx, and all tab labels stay on one line. Map navigation controls sit near the top; no mileage scale is shown. Home-locality dimming/fill/outline appear only for explicit home-locality focus and disappear for unscoped/other-area searches; this changes presentation only, never server geography authorization.

## 0. Authority and purpose

This document defines how RFxchange must **look, feel, and behave** across the in-place modernization. The SAD continues to own application boundaries, data, security, integrations, deployment, and system architecture. This Design System owns the shared visual and interaction language: brand identity, color, typography, geometry, spacing, materials, glass treatments, navigation, controls, component states, map UI, motion, accessibility, responsive behavior, and cross-application consistency.

Individual screen and flow specifications may determine composition and workflow detail, but they may not introduce conflicting primitives or interaction conventions without an approved amendment to this Design System.

The design system is informed by the current Apple Human Interface Guidelines (HIG), especially hierarchy, consistency, layout, color, typography, buttons, tab bars, search fields, sheets, materials/Liquid Glass, modality, branding, and accessibility. RFxchange adapts those principles to a cross-platform web product; it does not attempt to copy Apple UI or reproduce proprietary platform materials.

---

# 1. Rebuild design statement

> **RFxchange is a bright, map-first Exchange. Geography supplies depth and context. Interface chrome uses clean white and cool-neutral surfaces with restrained transparency. Deep slate replaces dominant black. RF Gold is a scarce brand and action signal. Lens identity is established through iconography, labels, position, and selected state—not competing brand colors. The persistent four-lens bottom navigation and sliding map/results composition are canonical participant UI architecture.**

The experience should feel:

- open rather than heavy;
- precise rather than busy;
- contemporary rather than trendy;
- premium through restraint rather than darkness;
- spatial and connected rather than dashboard-like;
- businesslike without resembling a government portal;
- inviting without becoming playful or consumer-social.

---

# 2. Non-negotiable rebuild locks

These items are architectural UI contracts and must not drift during implementation.

1. **Map-first participant shell.** The authenticated Exchange uses a persistent geographic canvas whenever geography is relevant.
2. **Persistent bottom lens navigation.** Mobile participant navigation remains: **RFx · Resources · Intelligence · Capabilities · Menu**.
3. **Four lenses, one Exchange.** RFx, Resources, Intelligence, and Capabilities are projections of the same shell; Menu is a cross-cutting utility gateway.
4. **No top mobile lens selector.** The bottom navigation is the normal mobile lens selector.
5. **Persistent state across lenses.** Preserve map camera, geography, search, filters, sheet position, selected record, and list position where applicable.
6. **Shared draggable result sheet.** Mobile supports collapsed/peek, working, and expanded states, plus accessible non-gesture controls.
7. **Four contextual action positions.** The action rail remains in a stable location at the top of the working result sheet; labels/actions vary by context.
8. **Marker-card synchronization.** Selecting a marker reveals/selects its card; selecting a mapped card activates its marker without needlessly destroying map context.
9. **Whole-card detail behavior.** Cards are clickable records with clear deeper-detail behavior; record actions do not fragment the basic interaction model.
10. **No aggressive lens color coding.** Lens identity comes from icon + label + fixed position + selected state. Semantic colors are reserved for meaning.
11. **Bright participant environment.** Warm Ivory and large near-black participant canvases are retired.
12. **Glass belongs primarily to the control/navigation layer.** Do not turn every content block into translucent glass.

---

# 3. Design principles

## 3.1 Content first

The map, organizations, RFx records, resources, intelligence, capabilities, and user work are the content. Navigation and controls must elevate that content rather than compete with it.

## 3.2 Map first, not map only

The map is the base spatial canvas, but the result sheet/list is the authoritative record surface because some records are off-map or intentionally location-limited.

## 3.3 Familiar beats clever

Common actions should look and behave consistently. A search control should behave like search. A bottom lens item navigates; it does not secretly perform an action. A button initiates an action. A sheet performs scoped work while retaining parent context.

## 3.4 One focal action

Each view should make the next most valuable action obvious. Secondary actions remain available but visually quieter.

## 3.5 Less container chrome

Use typography, spacing, grouping, and surface shifts before adding borders, panels, and cards. Containers should indicate real interaction or information boundaries.

## 3.6 Premium through clarity

Premium does not mean black, beige, gold everywhere, oversized shadows, or constant animation. RFxchange should feel premium because it is coherent, responsive, legible, and carefully composed.

## 3.7 Real geography and real entities

Map markers, service areas, localities, connections, and overlays must correspond to real platform state. Do not simulate geographic meaning with arbitrary positioned decoration.

## 3.8 Measured claims

Visual language must not imply guaranteed awards, qualification, revenue, business credibility, government endorsement, or market outcomes that the underlying data does not establish.

---

# 4. Brand identity

## 4.1 Wordmark

The primary identity remains **RFxchange™**.

- `RF` uses **RF Gold**.
- `xchange` uses **Exchange Slate** on light surfaces.
- On a rare authorized deep-slate inverse surface, `xchange` may reverse to white.
- Do not use a black full-page background simply to support the wordmark.
- No gradient, glow, bevel, metallic texture, outline, or drop shadow inside the wordmark.
- Use `™` until a governed legal update authorizes a different mark.
- The compact `RF` monogram remains the app/fav icon primitive.

## 4.2 Brand behavior

RFxchange should resemble **connective economic infrastructure**: local, intelligent, reliable, modern, and active.

Avoid resembling:

- a generic social feed;
- a speculative fintech/crypto product;
- an overfilled enterprise dashboard;
- a luxury lifestyle brand;
- a generic government portal;
- a “rainbow SaaS” product where every module has its own competing color identity.

---

# 5. Canonical color system

## 5.1 Core palette — rebuild

| Token | Value | Role |
| --- | --- | --- |
| Canvas Cloud | `#F8FAFC` | default non-map participant canvas; bright cool neutral |
| Surface White | `#FFFFFF` | primary cards, sheets, forms, tables, content surfaces |
| Surface Mist | `#F1F4F8` | secondary surface, grouped content, subtle segmentation |
| Exchange Slate | `#1B2430` | primary text, icons, selected structure; replaces dominant black |
| Slate Secondary | `#475467` | secondary text and structural labels |
| Slate Muted | `#667085` | metadata, placeholder text, low-emphasis copy |
| Line Soft | `#DDE3EA` | subtle borders/dividers |
| Line Strong | `#C7D0DA` | stronger boundaries and form states |
| RF Gold | `#D6A23A` | brand accent, focal action, selected connection signal |
| RF Gold Hover | `#C99324` | primary-action hover |
| RF Gold Pressed | `#B9831D` | primary-action pressed |
| Gold Text | `#7A5710` | accessible small-text gold use when needed |
| Signal Blue | `#2E5EAA` | intelligence, information, links, discovery cues |
| Growth Green | `#3B7B57` | positive completion/outcome/progress |
| Warning Amber | `#A65F00` | caution requiring attention |
| Danger Red | `#B42318` | destructive/error/security-critical state |

### Retired participant palette behavior

- **Warm Ivory `#F7F3EA` is retired as a default application canvas.** It may remain in historical assets but must not drive the rebuild UI.
- **Exchange Black `#0B0B0D` is retired as the default participant structural color.** Use Exchange Slate `#1B2430` instead.
- Large black/graphite participant surfaces are not part of the default rebuild language.

## 5.2 Usage discipline

The participant product should usually read visually as:

- 70–80% map / white / cool-neutral canvas;
- 15–25% slate text and structure;
- 3–7% RF Gold focal emphasis;
- semantic blue/green/amber/red only where they communicate actual meaning.

This is a composition discipline, not a pixel-count test.

## 5.3 Semantic discipline

- **Gold** = brand, focal action, selected connection emphasis. It does not mean “paid is better.”
- **Blue** = information, intelligence, link/discovery behavior.
- **Green** = positive completion, verified progress, healthy outcome.
- **Amber** = caution or attention.
- **Red** = destructive, error, security-critical, blocked by error.
- **Slate/gray** = neutral, secondary, inactive, unavailable, surrounding context.

Never communicate consequential state with color alone. Pair color with text, iconography, pattern, shape, or status language.

## 5.4 Lens color rule

RFx, Resources, Intelligence, and Capabilities **do not receive permanent competing brand colors**.

Lens distinction is communicated by:

- fixed position;
- distinct icon;
- short label;
- selected typography/icon state;
- a restrained RF Gold selection signal.

Semantic colors can appear *inside* lens content when the underlying information warrants them.

## 5.5 Appearance modes

The clean rebuild launches **light-first**. Dark mode is not authorized merely by inverting colors; it requires a separately designed, contrast-tested semantic palette and an explicit Design System amendment.

---

# 6. Typography

## 6.1 Font families

```css
--font-display: "Aptos Display", "Aptos", system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif;

--font-ui: "Aptos", system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif;
```

No proprietary font files should be bundled merely to imitate another platform. Native system fallbacks are intentional.

## 6.2 Type scale

| Role | Desktop | Mobile | Weight | Line height |
| --- | --- | --- | --- | --- |
| Display | 56px | 40px | 700 | 1.05 |
| H1 | 40px | 32px | 700 | 1.10 |
| H2 | 32px | 28px | 700 | 1.15 |
| H3 | 24px | 22px | 650–700 | 1.20 |
| Title | 20px | 18px | 650 | 1.30 |
| Body Large | 18px | 17px | 400–500 | 1.50 |
| Body | 16px | 16px | 400–500 | 1.50 |
| Body Small | 14px | 14px | 400–500 | 1.45 |
| Button | 15px | 15px | 650 | 1.20 |
| Tab label | 12px | 12px | 600 | 1.15 |
| Caption / metadata | 12px | 12px | 400–500 | 1.35 |

Rules:

- Sentence case by default.
- Avoid ultralight/thin weights.
- Keep headings short and decisive.
- Use tabular numerals where comparison benefits.
- Do not use tiny type to compensate for overcrowded layouts.
- User zoom/text enlargement must not break core workflows.

---

# 7. Spacing, grid, and density

## 7.1 Spacing scale

`0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`

Canonical semantic names:

| Token | px | Typical use |
| --- | ---: | --- |
| `space-0` | 0 | none |
| `space-1` | 4 | glyph / micro gap |
| `space-2` | 8 | tight internal gap |
| `space-3` | 12 | compact controls |
| `space-4` | 16 | standard mobile gutter / content gap |
| `space-5` | 20 | card/sheet internal section |
| `space-6` | 24 | panel section |
| `space-8` | 32 | major group |
| `space-10` | 40 | major separation |
| `space-12` | 48 | page section |
| `space-16` | 64 | hero / large section |
| `space-20` | 80 | marketing section |

## 7.2 Mobile layout

- Default horizontal content inset: **16px**.
- Floating map-control inset: **12–16px**, respecting safe areas.
- Minimum separation between independent touch targets: **8px**.
- Avoid shrinking controls below touch-safe sizing to fit more content.

## 7.3 Admin density

Admin may use denser 8/12/16px spacing and compact table rows where pointer/keyboard use is primary, but it must preserve readable hierarchy and mobile fallbacks.

---

# 8. Geometry

## 8.1 Radius tokens

| Token | Value | Use |
| --- | ---: | --- |
| `radius-sm` | 8px | compact chips, small nested elements |
| `radius-md` | 12px | inputs, standard controls |
| `radius-lg` | 16px | cards, popovers, menus |
| `radius-xl` | 20px | overlays / floating panels |
| `radius-sheet` | 24px | mobile sheet top corners, major panels |
| `radius-round` | 999px | true capsules only |

Rules:

- Do not make every content group a rounded card.
- Search may use capsule geometry because its single-line control shape benefits from it.
- Icon-only controls may be circular.
- Related nested shapes should use visibly harmonious radii.

---

# 9. Materials and glass

## 9.1 Material principle

RFxchange uses an **adaptive bright-glass language** inspired by the HIG distinction between content and the controls/navigation layer.

Glass is appropriate for:

- universal search over the map;
- map control clusters;
- bottom lens navigation;
- transient popovers/menus;
- legends;
- compact context controls;
- sheets only when high opacity preserves reading comfort.

Glass is **not** the default material for:

- every record card;
- long forms;
- tables;
- dense admin screens;
- repeated nested containers;
- marketing body copy sections.

## 9.2 Glass tokens

```css
--glass-bg: rgba(255, 255, 255, 0.78);
--glass-bg-strong: rgba(255, 255, 255, 0.94);
--glass-border: rgba(27, 36, 48, 0.08);
--glass-border-strong: rgba(27, 36, 48, 0.14);
--glass-blur: 20px;
--glass-saturation: 130%;
--glass-shadow: 0 8px 30px rgba(27, 36, 48, 0.10);
```

Fallback when backdrop filtering or transparency is unavailable/reduced:

```css
--glass-fallback: #FFFFFF;
--glass-fallback-muted: #F8FAFC;
```

## 9.3 Glass rules

- Never stack glass-on-glass as ordinary layout.
- Maintain readable text over the most complex map backgrounds.
- If glass cannot maintain contrast, become more opaque rather than adding heavier blur.
- Do not tint glass by lens color.
- Avoid strong edge glow or faux-refraction effects that call attention to the material itself.

---

# 10. Borders and elevation

## 10.1 Borders

- Default divider: `1px solid #DDE3EA`.
- Strong control/form boundary: `1px solid #C7D0DA`.
- Selected state may use RF Gold when selection is meaningful.
- Avoid boxes around every region.

## 10.2 Elevation

```css
--shadow-control: 0 4px 16px rgba(27,36,48,.08);
--shadow-floating: 0 8px 30px rgba(27,36,48,.10);
--shadow-sheet: 0 -10px 36px rgba(27,36,48,.10);
--shadow-modal: 0 24px 72px rgba(27,36,48,.16);
```

Use elevation to explain layering, not as decoration.

---

# 11. Focus, hover, press, and disabled states

Every interactive component must define all applicable states.

## 11.1 Keyboard focus

Use a visible two-stage focus treatment that survives white, map, and image backgrounds:

```css
outline: 2px solid #FFFFFF;
box-shadow: 0 0 0 5px #7A5710;
```

Where an outer halo would be clipped, use an inset + outer combination approved for that component.

## 11.2 Press state

Custom controls must visibly acknowledge press/activation. Use subtle scale/opacity or fill change; do not rely solely on delayed content change.

## 11.3 Disabled state

Disabled controls must remain legible while clearly noninteractive. Do not reduce opacity so far that labels fail contrast or become unreadable.

---

# 12. Buttons and action controls

## 12.1 Minimum target

- Touch/mobile interactive target: **44×44px minimum**.
- Primary/secondary text buttons: **48px height** by default.
- Desktop compact controls may visually render smaller only if the interaction target remains appropriate for the context and accessibility requirements.

## 12.2 Button families

### Primary

- Height: 48px.
- Horizontal padding: 18–22px.
- Radius: 14px.
- Fill: RF Gold.
- Text: Exchange Slate, 15px/650.
- Hover: RF Gold Hover.
- Pressed: RF Gold Pressed.
- One visually dominant primary action per local decision area.

### Secondary

- Height: 48px.
- Radius: 14px.
- Fill: Surface White or strong glass depending on context.
- Border: Line Strong.
- Text: Exchange Slate.

### Quiet / tertiary

- Transparent or subtle Mist hover background.
- No permanent border unless needed for discoverability.

### Destructive

- Use Danger Red with explicit action language.
- Require confirmation for consequential irreversible actions.

### Icon button

- Target: 44×44px minimum.
- Visual shape: circle by default over the map; 12px rounded square may be used inside dense operational surfaces.
- Tooltip/accessible name required when label is not visible.

---

# 13. Canonical participant shell

The participant shell is one continuous Exchange. It must not become separate module pages.

## 13.1 Mobile anatomy

```text
┌─────────────────────────────────────┐
│  [ Search the Exchange        ]  ○  │  bright glass controls
│                                     │
│                                     │
│               MAP                   │  persistent canvas
│                                     │
│                                     │
├──────────── drag handle ────────────┤
│ Results / Sort / Filter             │
│ [ Action ][Action][Action][Action]  │  stable action positions
│ Record rows/cards                   │
│ Record rows/cards                   │
├─────────────────────────────────────┤
│ RFx │ Resources │ Intel │ Caps │ ☰ │  persistent lens navigation
└─────────────────────────────────────┘
```

## 13.2 Mobile shell dimensions

- Top search/control height: 48px.
- Circular map controls: 44×44px minimum.
- Bottom navigation content height: 64px + device safe-area inset.
- Sheet top radius: 24px.
- Sheet drag handle: 36×4px.
- Sheet working-state target: approximately 45–55% of usable viewport; exact detent may adapt to device/content.
- Expanded sheet: up to approximately 92% while preserving a route back to spatial context.

## 13.3 Desktop

Desktop keeps the same mental model:

- map remains the spatial canvas;
- results/detail become a persistent side/edge panel (typically 420–480px);
- lens order and semantics remain unchanged;
- no permanent participant left rail is introduced merely because more horizontal space exists;
- the bottom lens dock may remain along the lower edge for continuity.

---

# 14. Persistent lens navigation

## 14.1 Canonical order

1. **RFx**
2. **Resources**
3. **Intelligence**
4. **Capabilities**
5. **Menu** (utility gateway, not a fifth data lens)

## 14.2 Visual treatment

Inactive:

- icon: Slate Muted;
- label: Slate Muted;
- no colored lens background.

Active:

- icon: Exchange Slate;
- label: Exchange Slate, 600;
- RF Gold selected signal (small line/dot/indicator, not a full gold tile by default).

Badge counts may be used only for actionable new state, not decoration.

## 14.3 Behavioral requirements

- Lens switch preserves relevant state.
- The tab/dock remains visible during ordinary top-level navigation.
- Lens controls navigate; they do not trigger record actions.
- Menu opens a utility surface without masquerading as a lens.

---

# 15. Universal Exchange Search

There is one search component across the Exchange.

## 15.1 Geometry

- Height: 48px.
- Radius: 24px / capsule.
- Default material: bright glass.
- Search icon leading; clear action trailing when populated.
- Placeholder text explains current search scope.

Examples:

- RFx: “Search opportunities, issuers, requirements…”
- Resources: “Search resources, providers, services…”
- Intelligence: “Search markets, organizations, insights…”
- Capabilities: “Search organizations, capabilities, categories…”

## 15.2 Filters

- One clear filter entry point next to search.
- Advanced filters belong in a sheet/drawer.
- Active filter chips are summaries of state, not a second navigation system.

---

# 16. Result sheet / drawer

## 16.1 Detents

Mobile supports three normal states:

- **Peek:** result count + top context, map dominant.
- **Working:** primary interaction state; map and list both meaningful.
- **Expanded:** results/detail dominant; map remains the parent spatial context.

Accessible buttons must provide equivalent expand/collapse behavior without requiring drag gestures.

## 16.2 Material

- Strong glass / near-opaque white: `rgba(255,255,255,.94)`.
- Blur: 18–20px when supported.
- Avoid beige/ivory tint.
- Use dividers and whitespace rather than shadowing every result.

---

# 17. Contextual action rail

The four action positions are stable shell geometry; the actions are contextual.

- Four equal or near-equal targets.
- 44px minimum hit area.
- Icon + concise label when space allows.
- Primary contextual action receives the strongest local emphasis; not every action uses gold.
- Disabled progressive-availability actions remain understandable and explain why they are unavailable when appropriate.

Example RFx context:

`Respond · Match · Watch · Share`

---

# 18. Exchange record cards and rows

## 18.1 Shared anatomy

A record surface may contain:

- media/logo/category cue;
- primary title/name;
- organization/issuer;
- geography/distance or explicit “No public location”;
- type/category metadata;
- match/status/evidence cues;
- favorite/watch state;
- trailing detail affordance.

## 18.2 Visual rules

- Prefer clean list rows in result sheets over floating dashboard-card stacks.
- Use 12–16px radius where a bounded card is warranted.
- Use separators/spacing for ordinary result rows.
- Entire record body opens detail; discrete actions remain separately operable.
- Sponsored placement must be explicitly labeled and must not mimic verification or authority.

---

# 19. Map visual system

## 19.1 Base-map direction

The default RFxchange map should be light, calm, and subordinate to Exchange data.

Directional map colors:

| Map role | Direction |
| --- | --- |
| Land | `#F3F6F9` |
| Water | `#DDEBF5` |
| Primary roads | `#FFFFFF` with subtle boundary |
| Secondary roads | `#E7ECF2` |
| General labels | `#536273` |
| Boundaries | `#AAB6C3` |
| Unselected/muted marker | `#8291A3` |
| Selected ring/path | RF Gold |

These are design-system targets; actual map-style implementation may require adjusted provider-layer values while preserving the visual intent and tested contrast.

## 19.2 Markers

Markers must differentiate record type using shape/glyph + label/legend where needed, not color alone.

Selected marker:

- visually grows slightly or gains a ring;
- uses RF Gold as a selection signal;
- must remain distinct from paid/sponsored state.

## 19.3 Clusters

Clusters communicate count clearly and should remain neutral/slate unless a semantic overlay explicitly changes meaning.

## 19.4 Geographic continuity

Opening detail must not unnecessarily reset zoom, viewport, filters, or selected geography.

---

# 20. Forms and onboarding controls

## 20.1 Input baseline

- Minimum height: 48px.
- Radius: 12px.
- Background: Surface White.
- Border: Line Strong.
- Label: 14px/600, Exchange Slate.
- Input text: 16px.
- Placeholder: Slate Muted.
- Focus: explicit focus ring; not shadow-only.
- Error: Danger Red + text explanation.

## 20.2 Selection controls

Use familiar checkbox, radio, segmented, combobox, or switch patterns based on the actual selection model. Do not invent decorative controls for common form behavior.

## 20.3 Onboarding visual mode

Identity/onboarding is a lighter, focused shell rather than the full Exchange. It uses:

- white / Cloud canvas;
- clear progress;
- one primary task at a time;
- organization match/claim cards;
- enrichment confirmation with provenance/confidence cues;
- capability suggestions that can be confirm/add/reject;
- no Exchange bottom navigation until the user enters the authenticated Exchange.

---

# 21. Sheets, dialogs, and modality

Use sheets for scoped tasks closely related to current context.

- Result sheets may be nonmodal.
- Creation/editing flows can use modal/full-height sheets when focus is valuable.
- Avoid modal-on-modal chains.
- Alerts are reserved for important interruption/confirmation, not routine guidance.
- Preserve the parent map/record context wherever practical.

---

# 22. Status, feedback, and loading

## 22.1 Status language

Status text must be explicit. Examples:

- Unclaimed / Claim pending / Claimed / Conflict / Restricted
- Draft / Published / Closed
- Enrichment queued / Enriching / Needs review / Complete / Partial
- Profile incomplete / Ready for Exchange

Do not collapse materially different states into vague colored dots.

## 22.2 Loading

- Prefer skeletons for record lists/cards.
- Use progress indicators for true waiting states.
- Avoid blocking the whole application for background enrichment or secondary data.
- Preserve the existing screen while refreshing whenever safe.

## 22.3 Success

Success feedback should confirm the result and return attention to useful context. Do not rely on celebratory animation for routine actions.

---

# 23. Motion

Motion explains hierarchy, continuity, and state change.

| Motion | Duration |
| --- | ---: |
| Press/hover feedback | 100–160ms |
| Small control transition | 140–180ms |
| Menu/popover | 160–220ms |
| Sheet/drawer | 220–280ms |
| Marker selection | 220–320ms |
| Map camera adjustment | 300–500ms |

Recommended easing:

```css
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
--ease-exit: cubic-bezier(0.4, 0, 1, 1);
```

Rules:

- no continuous decorative pulsing/bouncing;
- no unnecessary parallax in operational work;
- preserve geographic orientation during camera changes;
- never animate the renderer-owned map-position transform directly;
- reduced-motion preference removes nonessential movement and reduces camera animation.

---

# 24. Iconography

- Use one coherent vector icon family across the platform.
- Prefer simple stroked/filled symbols that remain clear at 20–24px.
- Common actions should use familiar symbols.
- Lens icons are stable and distinctive, but remain monochromatic/slate in normal navigation.
- Icon-only controls require accessible names and desktop tooltips where useful.
- Avoid decorative 3D icon treatments in the working product shell.

---

# 25. Imagery and marketing expression

Marketing may express the brand more strongly than the Exchange, but should remain visually related.

Prefer:

- real business/work imagery;
- actual platform/map imagery;
- geographic/network visuals;
- local economic activity;
- clear organization and capability stories.

Avoid generic handshake photography, generic skyline filler, fake dashboards, and dark “luxury-tech” hero treatments.

Dark slate sections may be used sparingly for contrast, not as the default marketing canvas.

---

# 26. Intelligence and data visualization

- Use Signal Blue as the primary informational/intelligence cue.
- Growth Green means positive progress/outcome, not “high value.”
- Gold should not become a generic chart series color.
- Use minimal gridlines.
- Provide units, source, geography, and time context where meaningful.
- Avoid decorative 3D charts.
- Never imply causality or certainty beyond the data.

---

# 27. Admin Console variation

Admin shares the same brand, typography, controls, semantic colors, and focus/accessibility model, but its work is operational rather than map-first.

Admin may use:

- a desktop left navigation rail;
- denser tables and queues;
- solid white/Mist surfaces more often than glass;
- compact filter toolbars;
- bulk-selection and audit patterns.

Admin should not copy the participant map shell merely for visual consistency.

Consequential actions must show target scope, authorization context, and confirmation/audit consequences clearly.

---

# 28. Marketing & Acquisition variation

Marketing uses the same core palette and typography but can amplify expression through:

- larger display type;
- high-quality imagery;
- map/network visuals;
- RF Gold accent moments;
- campaign storytelling;
- stronger section rhythm.

It should remain predominantly bright. Brand expression belongs primarily in content, not by replacing familiar controls with decorative custom UI.

---

# 29. Responsive behavior

## 29.1 Mobile first

Mobile is the canonical participant composition. Design for one-handed, short-session, decision-first use.

- primary actions are thumb reachable;
- bottom lens navigation persists;
- results/detail use sheets;
- search and map controls remain compact;
- secondary filters use progressive disclosure.

## 29.2 Tablet

- preserve map-first composition;
- use wider sheets/edge panels where it improves comparison;
- maintain touch targets and spatial continuity.

## 29.3 Desktop

- map + side/edge panel for spatial work;
- operational work may use page/panel layouts;
- avoid converting participant lenses into a permanent left rail.

---

# 30. Accessibility requirements

The rebuild targets **WCAG 2.2 AA** for active web surfaces and applies the interaction lessons reflected in the Apple HIG.

Required:

- 44×44px touch targets for primary mobile controls;
- sufficient contrast for text, icons, and control boundaries;
- keyboard operation for all workflows;
- visible focus state;
- screen-reader names for icon-only controls;
- state never communicated by color alone;
- reduced-motion behavior;
- reduced-transparency fallback;
- text enlargement/browser zoom without loss of core function;
- semantic headings, forms, tables, dialogs, and landmarks;
- meaningful map entities available through a structured non-spatial list/details path;
- drag interactions have non-drag alternatives;
- validation errors are programmatically associated with fields.

Accessibility is an acceptance criterion, not a post-build enhancement.

---

# 31. Design tokens — canonical rebuild baseline

Implementation should consume semantic tokens rather than copy raw values into components.

Recommended top-level groups:

```text
color
  canvas
  surface
  text
  border
  brand
  action
  state
  map

space
radius
shadow
material
type
motion
layout
zIndex
```

A starter TypeScript token file accompanies this document.

---

# 32. Component acceptance matrix

Every reusable component must be validated for the following before it is considered rebuild-ready:

| Requirement | Required |
| --- | --- |
| Default state | Yes |
| Hover state (where relevant) | Yes |
| Press/active state | Yes |
| Keyboard focus | Yes |
| Disabled state | Yes |
| Loading state (where relevant) | Yes |
| Error state (where relevant) | Yes |
| Mobile/touch sizing | Yes |
| Keyboard behavior | Yes |
| Screen-reader name/role/state | Yes |
| 200% zoom/reflow | Yes |
| Reduced motion | Yes |
| Reduced transparency / fallback | For glass components |
| Light rebuild palette compliance | Yes |
| No hard-coded conflicting colors | Yes |

---

# 33. Deprecated rebuild patterns

Do not reintroduce:

- Warm Ivory as the primary participant canvas;
- full-screen black/near-black participant shells;
- top mobile lens menus replacing bottom navigation;
- permanent participant left rails for the four lenses;
- aggressive lens-specific brand colors;
- glass on every card/panel;
- nested glass surfaces;
- decorative dashboard card grids where a list or spatial surface is clearer;
- unique button styling per feature;
- tiny action targets;
- modal chains;
- map reset on ordinary detail navigation;
- color-only status meaning;
- fake GIS or arbitrary geographic decoration.

---

# 34. Governance and exceptions

A feature may deviate from this Design System only when:

1. a real product/technical/accessibility requirement cannot be satisfied within the existing system;
2. the deviation is documented with the reason and affected components;
3. the change is reviewed as a Design System amendment rather than quietly introduced in feature CSS;
4. shared tokens/components are updated when the change is intended to become reusable.

Feature teams may extend domain behavior. They may not create private visual systems.

---

# 35. Rebuild implementation order

1. Replace legacy palette with rebuild semantic tokens.
2. Implement typography, spacing, radius, focus, motion, and glass primitives.
3. Implement button, icon button, input, search, chip, status, and popover primitives.
4. Build canonical mobile participant shell with map, search, result sheet, action rail, and persistent bottom navigation.
5. Build shared record row/card and detail controller.
6. Bind RFx, Resources, Intelligence, and Capabilities to the same shell without introducing lens-specific chrome.
7. Build identity/onboarding surfaces from the same token/component foundation.
8. Build Admin variation using denser solid surfaces.
9. Build Marketing variation using stronger content-layer expression.
10. Add automated token/component checks plus visual regression coverage for canonical states.

---

# 36. Reference basis

## Existing RFxchange authorities reviewed

- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- `docs/product-system/BRAND_SYSTEM.md`
- `src/design/tokens.ts`
- RFxchange map-first architecture / mobile composition references
- RFxchange Platform Solution Architecture Document v1.0

## Apple Human Interface Guidelines reviewed as design references

- Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines
- Design principles: https://developer.apple.com/design/human-interface-guidelines/design-principles
- Layout: https://developer.apple.com/design/human-interface-guidelines/layout
- Color: https://developer.apple.com/design/human-interface-guidelines/color
- Typography: https://developer.apple.com/design/human-interface-guidelines/typography
- Buttons: https://developer.apple.com/design/human-interface-guidelines/buttons
- Tab bars: https://developer.apple.com/design/human-interface-guidelines/tab-bars
- Search fields: https://developer.apple.com/design/human-interface-guidelines/search-fields
- Sheets: https://developer.apple.com/design/human-interface-guidelines/sheets
- Modality: https://developer.apple.com/design/human-interface-guidelines/modality
- Branding: https://developer.apple.com/design/human-interface-guidelines/branding
- Materials: https://developer.apple.com/design/human-interface-guidelines/materials
- Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Liquid Glass overview: https://developer.apple.com/documentation/technologyoverviews/liquid-glass

---

# 37. Adoption decision

On adoption, this document becomes the visual and interaction authority for the RFxchange modernization. The SAD remains the solution architecture authority. Screen/flow specifications and implementation PRs must conform to both.
