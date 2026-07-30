# Wave 2 Slice 2.6 — Organization geography and location

## Scope

This slice implements `GEO-009`, `GEO-010`, `ORG-005`, `ORG-006`, and `ORG-009`. It establishes a
confirmed organization home location, a privacy-safe public projection, and an independent
service-geography aggregate. It does not award Verification or Profile Complete and does not
activate the final organization marker.

## Canonical separation

The implementation keeps six concepts distinct:

1. the structured physical address;
2. an optional structured mailing address;
3. the confirmed internal coordinate and geocoder provenance;
4. the exact, approximate, or locality-only public projection;
5. the primary controlled geography selected during activation; and
6. the controlled geographies where the organization can provide service.

The current confirmed location and service-geography records use the organization ID as their
stable document ID. Address strings, browser state, and viewport coordinates are never authority.

## Authorization and geography authority

All mutations pass through the merged organization authorization service and require the named
`organization.profile.manage` permission on an active membership in the target organization.
The primary geography comes from the server-side selection repository and is checked against the
current geography release policy. Service geographies use canonical geography IDs and must also be
released for organization participation.

Geocoder candidates are accepted only when their real EPSG:4326 coordinates fall inside the
authoritative boundary geometry for the selected primary geography. A route, form value, or
browser-created candidate cannot substitute a geography ID or confirmation candidate.

## Geocoding and confirmation

The workflow is explicit:

```text
structured physical address
→ provider-neutral geocoding port
→ bounded candidates inside the authoritative locality
→ coordinate-anchored candidate on the controlled map
→ authorized user selection and confirmation
→ canonical organization location
```

The Census adapter uses a fixed HTTPS endpoint, a fixed current public-address-range benchmark,
bounded input/output, an abort timeout, and sanitized errors. Provider payloads do not cross the
infrastructure boundary. Each domain candidate retains only its matched address, coordinate,
quality, provider reference, benchmark, and retrieval time.

A geocoded draft is not a canonical location. Confirmation must name a candidate persisted on
that draft, and Firestore atomically advances the draft, writes the current location, appends a
location event, and appends the organization audit event.

## Privacy projection

The private confirmed-location record always retains the physical address, optional mailing
address, exact coordinate, and provenance. Public projection is a separate server-side domain
operation:

- `exact` returns the approved physical display address and confirmed coordinate;
- `approximate` returns a deterministic, organization-stable privacy-reduced coordinate and no
  address fields; and
- `locality-only` returns the canonical locality identity with no coordinate or address.

Mailing addresses are never part of a public projection. Home/private locations default to
`locality-only`; other locations default to `approximate`. Changing visibility does not mutate the
internal address or coordinate.

## Service geography

`organizationServiceGeographies` is independent of `organizationLocations`. Its typed aggregate
retains the primary geography and a de-duplicated list of released controlled geography IDs, so
later discovery, routing, matching, and territory visualization can reuse it without changing or
publishing the home location.

## Persistence and security

Four top-level, server-managed collections are introduced:

- `organizationLocationDrafts` — mutable geocode/confirmation workflow state;
- `organizationLocations` — one current private confirmed location per organization;
- `organizationLocationEvents` — append-only address, confirmation, visibility, and service-area
  evidence; and
- `organizationServiceGeographies` — one current service-area aggregate per organization.

Direct anonymous and authenticated browser access is denied for all four collections. Location
events and organization audit events are append-only. Firestore transactions prevent a stale
draft, duplicate event, or missing confirmed location from being silently overwritten.

## UI and map behavior

`/organization-location` is a responsive activation surface for structured physical and optional
mailing address capture, public precision, map confirmation, and service geography. The controlled
locality map remains the primary spatial context.

The temporary candidate and confirmed point are projected from real longitude/latitude at map
layer 70, so zoom changes preserve their geographic anchoring. Their diamond treatment is
deliberately distinct from the later activated organization-marker visual system and the copy
states that confirmation does not imply activation, Verification, or Profile Complete.

## Validation

Unit and architecture tests cover:

- legitimate organization authority and cross-organization denial;
- malformed address, browser geography manipulation, unreleased geography, out-of-boundary
  candidates, empty geocoder results, and unconfirmed candidates;
- exact, approximate, and locality-only leakage boundaries;
- location visibility changes that preserve the exact private coordinate;
- home location and service geography independence;
- a bounded Census adapter contract;
- coordinate-anchored UI overlays and required privacy copy; and
- Firestore schema, immutable events, atomic confirmation/service-area writes, and direct-client
  denial in the emulator.
