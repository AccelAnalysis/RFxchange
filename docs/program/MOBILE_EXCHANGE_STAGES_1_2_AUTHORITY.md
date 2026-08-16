# RFxchange Mobile Exchange Composition Authority — Stages 1–2

**Status: CURRENT CROSS-CUTTING MOBILE EXPERIENCE AUTHORITY FOR MOB-01 THROUGH MOB-05.**

This document locks the mobile composition and interaction model for the first two RFxchange mobile convergence stages. It is a required source for every Four-Lens lane that plans, implements, reviews, reconciles, tests, or integrates work under `MOB-01` through `MOB-05`.

It operates with, and does not weaken, `AGENTS.md`, `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`, applicable security/privacy/geography/domain authorities, the current Four-Lens program authorities, and current exact work packets. Server-side authorization remains authoritative. Visual continuity never grants access.

## 1. Governing mobile decision

> **RFxchange mobile is one persistent, map-first Exchange. The map is the application workspace. Search and map controls float above it. A three-position bottom sheet rises over it. Four permanent lenses remain thumb-accessible at the bottom. Four actions for the active lens sit at the top of the sheet. Organization and record cards live inside the sheet and remain synchronized with map selection. Changing lenses reinterprets the same Exchange; it does not launch another application or discard the participant's spatial context.**

This is a restoration and convergence of the established RFxchange mobile concept, not authority for four independent mobile designs.

The permanent participant lens order remains exactly:

1. **Opportunities/RFx**
2. **Resources**
3. **Intelligence**
4. **Referrals**

A fifth **Menu/Account** utility may occupy the far-right bottom-nav slot on mobile, as in the visual reference, but it is not a market lens and does not change the four-lens order.

## 2. Mandatory visual reference

The current internal composition reference is:

![RFxchange mobile composition reference](../reference/screenshots/rfxchange-mobile-composition-reference.jpg)

Source manifest: `docs/reference/screenshots/README.md`.

The screenshot uses legacy visible labels in places. **Its composition and interaction hierarchy are current; legacy label/order text inside the screenshot is not.** Implement the current governed lens names/order above.

The reference establishes the following physical grammar:

- map remains visible behind the mobile sheet;
- the sheet has a visible drag handle and rounded top edge;
- a compact utility row sits at the sheet top;
- **four active-lens action positions sit immediately below that utility row**;
- results are rendered as discrete cards in the sheet;
- a prominent star/favorite control belongs to each record/card;
- each card carries actions for that specific record/business;
- the bottom navigation is persistent and thumb-reachable;
- map, sheet, active lens, selected record, and card list are one coordinated state.

The supplied Zillow mobile screenshots from the product-design discussion are the interaction model for the map/sheet/card feel. Their critical patterns are reproduced normatively below so implementation does not depend on chat history.

## 3. Required screen anatomy

### 3.1 Default partial-sheet state

```text
┌──────────────────────────────────────┐
│   🔎 Search Exchange            [⚙] │  ← floating over map
│                                      │
│                                      │
│              LIVE MAP                │
│                                      │
│        ○         ●          ○        │
│                                      │
│  [layers] [map tool] [locate]        │
│                                      │
├──────────── draggable ────────────────┤
│ Sort / context     ━━━     List View  │
│                                      │
│ [ A1 ] [ A2 ] [ A3 ] [ A4 ]          │  ← active-lens actions
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ media / logo / image / video    │ │
│ │                            ★     │ │
│ ├──────────────────────────────────┤ │
│ │ record / organization content   │ │
│ │ tags / status / context         │ │
│ │ [record action] [record action] │ │
│ └──────────────────────────────────┘ │
│        next card remains visible…    │
├──────────────────────────────────────┤
│ Opps/RFx | Resources | Intel | Refs  │
│                         Menu/Account  │
└──────────────────────────────────────┘
```

This is the primary mobile operating state: enough map remains visible for spatial understanding while the sheet exposes the current results and actions.

### 3.2 Collapsed/peek state

```text
┌──────────────────────────────────────┐
│ floating search / filter             │
│                                      │
│                                      │
│              LIVE MAP                │
│                                      │
│                                      │
│                                      │
├──────────────────────────────────────┤
│                 ━━━                  │
│  24 organizations / results nearby  │
├──────────────────────────────────────┤
│ Opps/RFx | Resources | Intel | Refs  │
│                         Menu/Account  │
└──────────────────────────────────────┘
```

The collapsed state maximizes the map and exposes only the minimum result summary above the persistent bottom bar.

### 3.3 Expanded/list state

```text
┌──────────────────────────────────────┐
│   🔎 Search Exchange            [⚙] │
│ Sort / context                  Map  │
│                                      │
│ [ A1 ] [ A2 ] [ A3 ] [ A4 ]          │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ record card                     │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ record card                     │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ record card                     │ │
│ └──────────────────────────────────┘ │
│               [ Map ]                │
├──────────────────────────────────────┤
│ Opps/RFx | Resources | Intel | Refs  │
│                         Menu/Account  │
└──────────────────────────────────────┘
```

List view is not a separate application destination. It is the expanded state of the synchronized result surface. A direct `Map` affordance returns the user to spatial emphasis.

## 4. Interaction hierarchy — do not collapse these levels

There are three distinct action layers on mobile.

### A. Permanent bottom lens navigation

Scope: **the whole Exchange view**.

`Opportunities/RFx | Resources | Intelligence | Referrals`

One tap changes the active lens while preserving the safe spatial/session context.

### B. Four-position active-lens action rail

Scope: **the current lens/result set**.

This is the row shown in the RFxchange reference as `Search | Posts | Bids | Starred`. Those exact legacy labels are not governing; the **four stable positions are**.

The current sixteen-action architecture maps here as:

```text
4 permanent lenses × 4 action positions = 16 governed action positions
```

Lane 01 owns the shared rail. Lens lanes register their governed four actions through the shared contract. Operational, applicable, and authorized remain distinct states. Unavailable actions remain visible but truthfully disabled/gray where required; they must not trigger circular remediation or unrelated navigation.

### C. Record/card actions

Scope: **that particular organization, opportunity, resource, intelligence object, or referral record**.

Examples include `View RFx`, `View Profile`, `More from Organization`, `Collaborate`, `Request`, `Compare`, `Watch`, `Connect`, or `Refer` only when the applicable real domain runtime exists.

A lens action is not a substitute for a record action, and a card action is not one of the four permanent lenses.

## 5. Map is the mobile workspace

The mobile map is not a card inside a page. It occupies the viewport beneath the overlays and remains the persistent spatial background for ordinary lens movement.

Required behavior:

- floating search/filter above the map rather than a large conventional page header;
- compact, thumb-sized map utility controls directly on the map;
- organization/record nodes and clusters synchronized with result cards;
- selected marker and selected card converge on one selected-object state;
- selecting a marker reveals/activates its matching card;
- selecting a card reveals/highlights its matching marker;
- changing lens does not arbitrarily recenter the map;
- a list representation does not become a disconnected route.

## 6. Bottom lens navigation

The normal mobile lens selector is the persistent bottom bar. A top `<details>` or hamburger/menu-based lens selector is **not** an acceptable primary replacement for this requirement.

The participant should normally switch lens by:

```text
tap lens
```

not:

```text
open Menu → find lens → tap lens → close Menu
```

Menu/Account may remain a utility in a fifth slot or another compact utility treatment. It must not hide the four permanent lenses during ordinary mobile Exchange use.

## 7. Bottom sheet state contract

The shared mobile sheet must support at least:

- `peek/collapsed`;
- `partial`;
- `expanded`.

The shared sheet state must be representable independently from lens domain state. The sheet may display result-list content, a selected record summary, or deeper record detail, but ordinary detail inspection must remain visibly inside the Exchange.

The technical contract must account for:

- drag/snap state;
- internal scroll state;
- list cursor/position;
- selected result;
- detail context;
- safe-area offset above bottom navigation;
- software-keyboard and orientation changes;
- reduced-motion/accessibility behavior.

Gesture support must not be the only way to change sheet state.

## 8. Card contract and future visual target

Stage 2 may use temporary/first-real records to prove composition, but the shared card contract must reserve the Zillow-like anatomy described here so Stage 3 does not require another redesign.

A card may represent an organization or lens-relevant record and should support:

1. **media region** — business image, logo, facility image, product/service image, project image, branded cover, or explicit intro-video poster;
2. **favorite/star** — one-tap save for that exact record/organization;
3. **strong identity/title**;
4. **organization and locality** where relevant;
5. **short, scannable summary** rather than long explanatory prose;
6. **important date/status/context**;
7. **tags/capability/status labels**;
8. **record-specific actions**;
9. **whole-card entry to deeper exploration**.

Multiple media assets may later use a swipeable carousel with pagination dots. Video uses a poster/play affordance and does not autoplay with sound.

The card itself may be opened to explore the business/record further. Returning from detail should restore the previous map, marker, lens, filters, list position, and sheet state where still permitted.

Cards are appropriate for discrete records. The surrounding mobile application must not become nested card-inside-card page chrome.

## 9. Favorite/star behavior

The star visible on each record card is a direct action on that record. Saving must provide immediate state feedback and persist through ordinary view changes.

A governed `Starred`/`Saved` action in a lens rail may filter/retrieve saved records for that lens. The individual card star and the rail-level saved view are related but distinct controls.

## 10. State continuity — non-negotiable

Where still meaningful, safe, and authorized, a lens change must preserve:

- current organization/membership context;
- geography/locality;
- map center/bounds;
- zoom;
- pitch;
- bearing;
- selected organization/object;
- selected marker;
- search query;
- filters;
- sort;
- result-set identity/cursor;
- list scroll position;
- sheet snap point;
- detail/return context.

If an object has no applicable projection in the new lens, retain spatial focus and tell the truth about the absence of applicable records/actions. Do not make the participant feel that the Exchange reset or that the organization disappeared.

## 11. Stage 1 — Lock the architecture

### MOB-01 — Mobile Experience Authority

**Lane 00 — Control Room owns product/convergence authority.**

Lane 00 uses this document as the controlling mobile description, keeps it aligned with current higher authorities, and prevents later work from weakening `persistent` into merely `accessible`.

### Shared technical interfaces

**Lane 01 — Shared Exchange Platform owns the shared technical contracts.**

At minimum, Stage 1 must define shared concepts equivalent to:

```text
MobileExchangeShell
MobileLensNavigation
ExchangeBottomSheet
LensActionRail
ExchangeResultCard
ExchangeMedia
ExchangeFavorite
ExchangeSelectionState
ExchangeMapProjection
ExchangeDetailState

LensDefinition
LensActionDefinition[4]
LensMapProjection
LensResultCardModel
RecordActionDefinition
SelectionState
SheetState
FavoriteState
DetailState
```

The shared context must be capable of representing at least:

```text
activeLens
selectedOrganization
selectedRecord
selectedMarker
mapCamera
geography
search
filters
sort
sheetSnapPoint
listScrollPosition
detailContext
```

### Lanes 02–05 during Stage 1

Lanes 02 Opportunities/RFx, 03 Intelligence, 04 Resources, and 05 Referrals are **contract consumers/validators**, not independent mobile-shell designers.

Each lane validates that the shared interfaces can represent its governed map projection, four action registrations, card model, detail context, favorites, and record actions. A missing cross-lens capability is routed back to Lane 01 as a shared contract need; the lens lane must not create a private shell/sheet/card/navigation fork.

### Stage 1 exit condition

Stage 1 is complete only when all participating lanes can point to one shared definition for:

- shell;
- bottom lens navigation;
- sheet state;
- four-position lens action rail;
- selection;
- card model;
- favorite state;
- media slot;
- detail/return context;
- continuity state.

No lens lane may independently interpret the visual reference before these contracts exist.

## 12. Stage 2 — Restore the shared composition

### MOB-02 — Mobile Shell

**Primary builder: Lane 01.**

Build the full-screen map composition, floating search/filter, overlay stacking, mobile safe-area behavior, and reserved geometry for the sheet and persistent bottom navigation.

### MOB-03 — Bottom Lens Navigation

**Primary builder: Lane 01.**

Render the four permanent lenses as one-tap bottom controls wired to the existing lens controller. Remove the top mobile lens menu as the normal lens-switch interaction while preserving any still-needed Account/Menu utility behavior.

### MOB-04 — Draggable Sheet

**Primary builder: Lane 01.**

Implement peek, partial, and expanded snap states; scroll/drag arbitration; list/detail content regions; map return; accessibility; safe-area behavior; and state restoration.

### MOB-05 — Lens Action Rail

**Shared component owner: Lane 01. Domain registrations: Lanes 02–05.**

Render four stable action positions at the top of the sheet. Lens lanes supply their governed registrations; Lane 01 owns presentation, interaction, disabled-state truthfulness, and shared permission-state rendering.

### Lanes 02–05 during Stage 2

Each lens lane may provide its four action registrations plus temporary/first-real projection records needed to prove integration. They must not create alternate shell, sheet, bottom navigation, action rail, map-selection, or generic card frameworks.

### Lane 00 during Stage 2

Lane 00 owns convergence, dependency/branch sequencing, and resolution of shared-contract requests. If a lens lane discovers a shared limitation, the correction goes through Lane 01 and becomes available to every lens.

### Stage 2 exit condition

At an iPhone-sized viewport, before richer domain cards are required, the product must visibly demonstrate all of the following:

1. full-screen live map behind overlays;
2. floating search/filter treatment;
3. persistent bottom lens controls;
4. one-tap lens switching;
5. three-position bottom sheet;
6. four active-lens action positions at sheet top;
7. at least temporary/first-real cards in the sheet;
8. marker/card synchronized selection;
9. same map camera and selected organization retained through ordinary lens changes where applicable;
10. sheet position retained through ordinary lens changes where applicable;
11. disabled/unavailable actions remain truthful and do not enter remediation loops;
12. the mobile screen physically reads like the attached RFxchange reference and the map/results/card interaction model described above, not like a conventional responsive web page with a map embedded inside containers.

## 13. Lane reference requirement

Every permanent lane must read this document before acting on any `MOB-01` through `MOB-05` work:

- `00 — RFxchange Control Room`
- `01 — Shared Exchange Platform`
- `02 — Opportunities/RFx`
- `03 — Intelligence`
- `04 — Resources`
- `05 — Referrals`
- `06 — Independent Acceptance` when an optional assurance packet is assigned
- `07 — Integration / Cross-Lens QA` when integrated mobile testing begins

This requirement is also recorded in `docs/program/CHAT_LANE_CHARTERS.md`.

## 14. Explicit non-goals and anti-drift rules

Stages 1–2 do **not** authorize:

- four independent mobile shells;
- a new route per sheet position;
- a private drawer implementation for each lens;
- a private card framework for each lens;
- replacement of persistent bottom lenses with a top menu;
- fabricated organizations, opportunities, resources, referrals, intelligence, or market activity;
- client-side permission shortcuts;
- changing server authority because an action is visible;
- making an unavailable action look active;
- hiding a governed permanent lens merely because one action/runtime is unavailable;
- automatic intro-video playback with sound;
- nested explanatory card chrome that displaces the map.

## 15. Success criterion

The mobile RFxchange should feel like a spatial marketplace, not a mobile web page:

> **The participant enters one persistent Exchange, explores organizations and market activity on the map, pulls results and detail upward from the bottom sheet, changes among four permanent lenses with one thumb tap, sees four lens-specific actions in a stable rail, saves and acts on individual business/record cards, and can explore deeper without losing the spatial state they came from.**

That physical and behavioral continuity is the requirement. Future richer domain work must populate this structure rather than redesign it.
