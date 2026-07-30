# RFxchange Map & Geography Context

## Core rule
Geography is a first-class authorization and product state, not merely a map viewport.

## Canonical locality identity
Store canonical locality identifiers and metadata, including where applicable:
- FIPS identifier
- name and geography type
- authoritative boundary reference/geometry
- release state
- parent and adjacent geographies
- map bounds
- default/bird's-eye camera

## Server authority
The server validates selected geography and participation. Browser state, query parameters or client-only map state cannot grant access to an unreleased/restricted locality.

## Release states
Support at least:
- **Released** — full applicable participation
- **Visible / Unreleased** — geographic context, no general participation
- **Limited** — selected public/limited functions
- **Restricted** — only specifically authorized access

## Boundary behavior
Authoritative locality boundaries use TIGER/Line or another approved authoritative source. Selected locality should be prominent and geographically legible. Surrounding localities remain visible and outlined but visually muted.

## Camera
After locality selection, fit the map to authoritative bounds and use the configured default/bird's-eye camera where supported. Camera behavior is derived from geography metadata rather than hard-coded per screen.

## Home location vs service geography
Where an organization is based is distinct from where it can perform work or provide services. Do not overload one field or polygon for both concepts.

## Location privacy
The platform may retain actual location for validation while projecting exact, approximate or locality-only location publicly according to organization visibility policy.

## Markers
Organization markers are coordinate-anchored geographic objects. They must not float relative to viewport or UI pixels. Marker activation is downstream of confirmed location, legitimate Profile Complete, selected/released geography and rendered locality context.

## Map-first UX
The controlled map should establish the user's current locality, then layer organizations, opportunities, providers and connections without overwhelming the geography. Use restrained glass overlays and avoid unnecessary panel/container clutter.
