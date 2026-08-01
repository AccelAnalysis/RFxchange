# RFxchange Map and Data Visual Grammar

**Status: PLANNING AUTHORITY — DOMAIN OBJECTS MUST REMAIN BOUND TO AUTHORITATIVE PRODUCT STATE**

## 1. Purpose

The RFxchange map must not look like a generic consumer map with application panels placed over it. It should make economic activity legible through a proprietary, consistent grammar.

The governing sentence is:

> **Nodes are participants. Beacons are demand. Paths are interactions. Fields are geography or service coverage. Seals are evidence. Green resolutions are outcomes.**

Every visible geographic or data object must correspond to one of the following:

- a real authoritative or privacy-safe platform record;
- a permitted public projection;
- a clearly labeled synthetic tutorial fixture isolated from live records;
- a presentation object derived from governed data.

Arbitrary decorative map positions, invented businesses, fake opportunities, unsupported statistics, or connection lines without a domain relationship are prohibited.

## 2. Object families

| Object | Canonical treatment | Meaning |
| --- | --- | --- |
| Organization node | Camera-facing geometric marker anchored to the canonical/privacy-safe coordinate; light-ivory core in Exchange Light and Graphite core in Intelligence Dark | Business, buyer, institution, government, provider, or another participating organization |
| Opportunity beacon | Signal Blue directional beacon with restrained radial activity when newly active or selected | Structured demand or opportunity |
| Service field | Transparent bounded territory or coverage layer | Where assistance, capability, or service is available |
| Golden path | Thin RF Gold path animated only while an interaction is occurring or being explained | Referral, invitation, match, teaming, or RFx flow |
| Outcome path | A completed path that resolves from gold into Growth Green after a confirmed outcome state | Completed economic interaction or verified positive resolution |
| Credibility seal | Controlled seal shape with family, symbol, label, and evidence explanation | Verified, Active, Experienced, Trusted, Endorsed, or separately classified Recognition evidence |
| Locality field | Clearly outlined active geography with surrounding areas subdued | The participant’s current operating context |

## 3. Organization nodes

### 3.1 Shape and anchor

- Use one proprietary geometric silhouette rather than a generic teardrop pin.
- The geographic anchor is renderer-owned and must remain fixed to the canonical/privacy-safe coordinate.
- Camera-facing visual treatment may rotate or billboard independently, but the coordinate must not drift.
- Selection and focus may add a separate halo or focus ring; do not add a permanent generic white outline.
- Activation motion belongs to an internal visual child and must not alter the anchor transform.

### 3.2 Mode treatment

#### Exchange Light

- light-ivory core;
- Graphite structural detail;
- restrained gold selection/focus;
- sufficient contrast against low-saturation land and buildings.

#### Intelligence Dark

- Graphite core;
- Warm Ivory structural detail;
- muted gold selection/focus;
- no neon glow or high-saturation cyber styling.

### 3.3 Semantic variation

Organization type or role may be expressed through a compact internal glyph, label, or supporting shape only when the data is authoritative and the distinction improves a task.

Do not create a rainbow palette by organization type. Color remains semantically reserved:

- gold for focus/connection;
- blue for intelligence/opportunity;
- green for outcomes;
- neutrals for structure and surrounding context.

### 3.4 Clustering

At wider zoom levels:

- use aggregate clusters rather than overlapping nodes;
- communicate count and category only when authoritative;
- retain keyboard and screen-reader access to the underlying result set through a list alternative;
- expand progressively as zoom and density permit;
- never imply that a cluster is one organization.

### 3.5 Node states

At minimum, the visual system must support:

- default;
- hover;
- keyboard focus;
- selected;
- activated/current organization;
- unavailable or unreleased where display is permitted;
- restricted from participant view;
- loading/skeleton only outside the geographic anchor layer;
- synthetic tutorial.

State must not rely on color alone.

## 4. Opportunity beacons

### 4.1 Form

An opportunity uses a directional Signal Blue beacon that communicates active demand rather than a second organization marker.

The form should:

- remain distinct from organization nodes at all supported sizes;
- indicate a point, area, or remote/non-geographic context truthfully;
- use restrained radial activity only for new, selected, or tutorial-highlighted demand;
- stop routine animation after attention has been established;
- expose status through label/icon/pattern in addition to color.

### 4.2 States

Potential states include, only when supported by the RFx/opportunity domain:

- public/permitted;
- potential match;
- invited;
- watched/saved;
- deadline approaching;
- closed;
- selected/current;
- synthetic tutorial.

`Potential match` must not look like `qualified`, `endorsed`, or `selected`.

### 4.3 Geography

An opportunity may have:

- one performance location;
- multiple locations;
- a service area;
- a locality/region requirement;
- remote/non-geographic performance.

Do not force a false point coordinate merely to place every opportunity on the map. Use an area, locality anchor, or non-spatial list representation when that is the truthful domain model.

## 5. Service fields

### 5.1 Purpose

A provider or organization office address does not necessarily represent where it serves businesses. Service availability should be visualized as a field or bounded territory where authoritative coverage exists.

### 5.2 Treatment

- transparent or patterned territory layer;
- subdued fill with clear boundary;
- visible label or legend;
- mode-aware contrast;
- overlap handling that does not create an unreadable color mixture;
- category filtering through labels, patterns, or controlled opacity rather than arbitrary colors.

### 5.3 Boundary rules

Service fields must distinguish among:

- office location;
- service territory;
- business service area;
- opportunity geography;
- active/released locality.

Do not represent inferred availability as confirmed. Where availability is unknown, say so.

## 6. Locality fields

The selected or home locality is the participant’s operating context, not a permanent navigation prison.

The map should:

- use authoritative boundary geometry;
- draw a restrained but legible selected outline;
- dim rather than erase surrounding areas;
- preserve permitted free navigation;
- reveal progressive geographic detail with zoom;
- distinguish released, controlled, future/unreleased, and unavailable states using labels/patterns as well as tone;
- retain attribution and provenance.

The locality reveal motion is defined in `MOTION_SYSTEM.md`.

## 7. Connection paths

### 7.1 Golden path

A golden path represents an active or explained interaction such as:

- capability match;
- referral;
- invitation;
- teammate discovery or acceptance;
- RFx flow;
- provider handoff.

A path must not be drawn because two objects are visually related in a layout. It requires a real relationship/event or clearly synthetic tutorial relationship.

### 7.2 Path behavior

- thin and restrained;
- visible against both map modes;
- animated only while the interaction is occurring, being replayed, or intentionally explained;
- settles into a static relationship state;
- uses direction indicators when direction matters;
- avoids constant travel effects;
- supports reduced-motion alternatives such as immediate reveal and static emphasis.

### 7.3 Outcome path

A golden path may transition to Growth Green only after the underlying domain records an appropriate completed or confirmed outcome.

Green must not be triggered by:

- viewing an organization;
- saving an opportunity;
- sending a referral;
- accepting an invitation;
- submitting a response;
- paying for membership;
- earning recognition unrelated to an outcome.

The visual should communicate the provenance level where relevant: platform-observed, self-reported, counterparty-confirmed, or independently verified.

## 8. Credibility seals

Credibility presentation follows the Organization Credibility System.

### 8.1 Common structure

Each family uses:

- one controlled outer seal system;
- a distinct internal symbol;
- family and badge label;
- level where applicable;
- explanation affordance;
- non-color distinction;
- state handling for active, expiring, expired, suspended, and revoked.

### 8.2 Separation

- substantive credibility is separate from Recognition;
- Founding status does not appear as trust or qualification;
- paid status does not alter the seal hierarchy;
- sponsorship does not resemble verification;
- a generic “Qualified Organization” seal is prohibited because qualification is contextual.

### 8.3 Map use

Map popups may show a bounded set of selected active seals. The map marker itself should not become a dense badge rack.

## 9. Heatmaps and density

### 9.1 Proprietary gradient

Do not use a generic rainbow heatmap.

The standard progression should remain within controlled semantic families:

- low activity: low-opacity neutral/blue-gray;
- increasing activity: Signal Blue range;
- selected or strategically focused region: restrained RF Gold overlay or outline;
- confirmed outcomes: Growth Green as a separate outcome layer, not the high end of generic activity.

### 9.2 Meaning

Every heatmap must state:

- what is being counted or measured;
- time period;
- geography;
- whether data reflects platform participants or the full economy;
- minimum-sample or privacy suppression where required;
- provenance and verification level.

Do not use visual intensity to imply economic impact where the layer measures only searches, views, matches, or registrations.

## 10. Cartographic style

### 10.1 Exchange Light

- Warm Ivory or warm low-saturation land tones;
- subdued roads;
- restrained water and natural features;
- nonessential labels reduced;
- clear locality outlines;
- low-contrast 3D buildings;
- surrounding geographies dimmed rather than blacked out;
- overlays remain readable without obscuring the map.

### 10.2 Intelligence Dark

- near-black, Graphite, or charcoal foundation;
- low-saturation roads and labels;
- Warm Ivory text and controls;
- muted Signal Blue and RF Gold;
- low-contrast 3D buildings;
- no neon grid, bright cyan bloom, or speculative-finance styling.

### 10.3 Progressive detail

Layer visibility should increase with zoom and task relevance. Avoid showing every road, label, marker, field, and path simultaneously.

The hierarchy should generally progress from:

`Region → locality → clusters/fields → organizations/opportunities → street/building detail`

## 11. Panels, labels, and map preservation

- Spatial workspaces preserve the map as the primary canvas.
- Desktop contextual panels remain on an edge and must not cover the protected focal target.
- Mobile panels become bottom sheets and must preserve enough visible map context for the selected object.
- Dense tables and long forms use opaque surfaces rather than glass.
- Map labels should not compete with the selected business, opportunity, or path.
- Attribution remains visible and legible.

## 12. Accessibility

Every spatial view must provide:

- keyboard-operable controls;
- visible focus;
- screen-reader map description;
- structured list alternative for organizations/opportunities/resources;
- text equivalents for paths and relationships;
- patterns/labels in addition to color;
- reduced-motion behavior;
- high-contrast compatibility;
- minimum touch targets;
- no essential information available only through hover.

## 13. Tutorial isolation

Synthetic tutorial objects must:

- use a visible tutorial label or treatment;
- remain in a separate fixture/data namespace;
- never enter organization, opportunity, referral, team, RFx, credibility, or outcome records;
- not appear in live search results;
- not create live notifications;
- not influence analytics or credibility;
- be deterministic for acceptance testing.

A tutorial object may demonstrate the same grammar, but must never be presented as a real local organization or opportunity.

## 14. Acceptance requirements

A map/data visual implementation is acceptable only when:

- objects are domain-authoritative or clearly synthetic;
- organization anchors do not drift;
- markers remain visible at protected camera targets;
- mode contrast is sufficient;
- semantic colors retain their meanings;
- no generic rainbow or white-outline marker system is introduced;
- paths correspond to actual relationships;
- green appears only for appropriate outcomes;
- density layers disclose metric, period, geography, and provenance;
- desktop, intermediate, and mobile compositions preserve focal geography;
- keyboard, screen-reader, reduced-motion, and list alternatives work;
- no customer-facing invented market evidence is shown.
