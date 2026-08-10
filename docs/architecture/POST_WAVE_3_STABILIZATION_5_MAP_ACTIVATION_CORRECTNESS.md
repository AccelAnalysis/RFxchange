# Post-Wave 3 Stabilization 5 — map and activation correctness

**Implementation baseline:** `f276cadfe8da632f39e8a6dc0288a9d3a96545cd`

**Feature-ID effect:** none

## Corrected invariants

Location confirmation carries one explicit selected-candidate ID from participant review through map projection and the existing server-authorized `confirm-location` command. The plotted point and persisted candidate therefore have the same stable geocoder identity and coordinate; changing candidates updates the plotted point before confirmation becomes available.

The required selected-locality spatial model and active-marker home scene use a bounded three-attempt recovery policy. Exhaustion produces a localized participant-visible recovery state with an explicit retry action. Activation progress and authoritative marker/geography state remain unchanged, and the browser never fabricates a locality model or marker projection when either dependency is unavailable.

Continuous orbit is now an explicit rendering capability granted only to instructional activation/orientation scenes or the organization-visible milestone. Normal authenticated Network workspaces settle after their initial camera movement and remain participant controlled. The Account motion preference can suppress eligible ambient motion but cannot enable it on a daily workspace; `prefers-reduced-motion: reduce` remains authoritative everywhere.

`MapboxLocalityCanvas` keeps its existing instance when point overlays, relationship paths or service fields change. It diffs geographically anchored DOM markers by stable ID and updates relationship/service GeoJSON through `GeoJSONSource.setData`. Authoritative locality geometry, privacy projections, map/list/detail selection identity and camera persistence remain unchanged.

## Authority and scope

Server-resolved locality selection, geography release/participation, geocoder draft ownership, candidate identity, location privacy, marker activation and home-scene projection remain authoritative. Mapbox owns only rendering and viewport behavior. Retry repeats the same authorized read request and grants no access or persistence authority.

This correction does not implement the standing-logo-marker transition described by PR #150, the future four-lens Exchange shell, RFx Core, Intelligence or Locations runtime, appearance modes, Presentation Mode, B6b, or any new Feature ID. Tracker totals remain `438 total · 152 Done · 286 Not Started`.

## Acceptance

- bounded-retry behavioral tests for eventual success and terminal exhaustion;
- source guardrails proving selected geocoder candidate identity reaches both map projection and confirmation;
- source guardrails proving daily workspaces do not request continuous motion;
- source guardrails proving overlay markers and relationship/service sources update without belonging to the Mapbox construction effect;
- changed recovery and candidate-action copy in all five supported interface locales;
- existing activation, spatial-onboarding, Mapbox production, design-convergence, reduced-motion, geography and privacy validators; and
- the complete repository `npm run check` gate.
