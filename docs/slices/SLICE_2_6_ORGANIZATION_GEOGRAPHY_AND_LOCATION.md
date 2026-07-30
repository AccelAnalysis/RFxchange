# Slice 2.6 — Organization Geography & Location

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `GEO-009` — Home location vs service geography
- `GEO-010` — Location visibility levels
- `ORG-005` — Primary/mailing address capture
- `ORG-006` — Geocode and map confirmation
- `ORG-009` — Service geography capture

## Objective

Establish the organization's canonical physical/home location, privacy-safe public location projection, and service geography as distinct but related concepts.

At slice exit, an authorized organization administrator can provide the organization's physical address and optional mailing address, resolve and confirm the actual operating location on the controlled map, choose how much location precision is publicly visible, and separately state where the organization can perform work or provide service.

This slice creates the trustworthy geography/location inputs needed by the essential profile and later real-marker activation. It does not activate the organization marker itself.

## Must read

- `/AGENTS.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/CREDIBILITY_SYSTEM.md`
- `docs/context/BRAND_AND_UX.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- `docs/design/MAP_VISUAL_SYSTEM.md`
- canonical tracker/dependency map
- `docs/slices/WAVE_2_ROADMAP.md`
- merged Slice 2.1 geography-authority architecture
- merged Slice 2.2 geography-rendering architecture
- merged Slice 2.3 organization-resolution architecture
- merged Slice 2.5 organization-authority/claims contracts

## Prerequisite state

Before beginning, recalculate from merged `main`.

Expected prerequisites:

- `GEO-005` — selected controlled locality rendering is complete;
- `GEO-007` — geography release/participation authority is complete;
- `ORG-002` — organization resolution is complete;
- `ORG-004` — organization authority is complete before an organization location may be authoritatively managed;
- canonical geography/FIPS metadata, bounds and authoritative boundary geometry are already available from Slices 2.1–2.2.

If Slice 2.5 has not merged or `ORG-004` is not legitimately Done, do not begin authoritative organization-address/location mutation.

## Canonical concept separation

Do not collapse these concepts into one field or one map object:

1. **Physical/home location** — where the organization is actually based or operates from.
2. **Mailing address** — where correspondence is received; may differ from physical location.
3. **Canonical resolved coordinates** — internal geocoded position derived from the physical address and confirmed by an authorized user.
4. **Public location projection** — exact, approximate or locality-only representation derived from the actual location plus privacy preference.
5. **Primary operating geography** — controlled platform locality selected earlier in activation.
6. **Service geography** — where the organization can perform work/provide services, which may extend beyond the home locality.

Physical location does not imply service area. Service area does not rewrite the organization's physical location. Public precision does not alter the internally retained canonical location.

## Product rules

### `GEO-009` — Home location vs service geography

Model home/base location separately from service geography.

The domain must be able to answer independently:

- where is the organization based?
- where is the organization permitted or willing to operate/provide service?

Use canonical geography references where geographic service scope is locality-based. Do not encode service geography as a display-only map polygon or as free-form browser state.

An organization may be based in one locality while serving one or more other supported geographies. Service geography should be reusable later by discovery, provider routing, RFx matching and territory visualization without changing home-location semantics.

### `GEO-010` — Location visibility levels

Support at least:

- `EXACT` — public projection may show the confirmed location with approved exact precision;
- `APPROXIMATE` — public projection intentionally reduces precision while retaining the actual internal location;
- `LOCALITY_ONLY` — public projection communicates locality/geography without publishing the point/address.

The exact internal address/coordinates remain controlled data regardless of public display mode.

Privacy must be enforced in server/public projections, not just by hiding labels in CSS. A public API/projection must not leak exact coordinates or address fields for an approximate/locality-only organization.

Changing public visibility must not silently alter the stored physical address or canonical coordinates.

### `ORG-005` — Primary/mailing address capture

Collect:

- physical address;
- optional separate mailing address;
- public display/precision preference;
- home/private indication where applicable.

Address mutation requires legitimate organization authority and organization scope.

Normalize address input without treating a formatted display string as the durable identity of the location. Preserve enough structured address data and provenance/state to support geocoding, later validation and controlled change history.

Home/private addresses receive the stricter privacy path by default. Do not require public exact-address display in order to participate.

### `ORG-006` — Geocode and map confirmation

Geocoding is a provider/infrastructure concern behind a provider-neutral application/domain boundary.

The flow must distinguish:

```text
address entered
→ geocode candidate(s)
→ candidate shown in geographic context
→ authorized user confirms/corrects
→ canonical organization location persisted
```

Do not treat the first geocoder response as user-confirmed truth.

Persist sufficient provenance/quality metadata to distinguish raw address input, provider resolution and user confirmation. Provider-specific response objects must not become the domain model.

The map confirmation uses canonical geography and coordinates. Markers/points shown during confirmation must remain geographically anchored while the camera changes.

### `ORG-009` — Service geography capture

Collect where the organization can operate/provide services separately from where it is based.

Use controlled/canonical geography identifiers and release metadata where applicable. Preserve the distinction between:

- organization home location;
- selected primary operating geography;
- service geography.

The service geography model should support later multi-locality/territory behavior without requiring the user to publish an exact home address.

## Map and design requirements

Follow the canonical design system.

- The map remains the primary spatial context rather than a decorative panel.
- Location candidates/confirmation points are anchored to real coordinates.
- Do not use viewport-relative fake markers.
- Selected locality boundaries remain prominent and surrounding geographies remain muted according to the merged geography visual contract.
- A temporary location-confirmation point is not the later activated organization marker and must not visually imply activation/Verification/Profile Complete.
- Do not use a permanent outline around organization-style pins; any temporary selection/focus treatment must be stateful and not confused with the final marker system.
- Service geography and public location precision should be understandable without exposing private precision.
- Use restrained glassmorphism and avoid unnecessary nested card chrome.

## Security and privacy requirements

- Only an authorized organization actor may mutate the authoritative organization location/service geography.
- Public projections must be separate from private location records.
- Exact/private location must not be inferable from public response payloads when visibility is approximate/locality-only.
- Mailing address must not be exposed merely because physical-location data exists.
- Cross-organization reads/writes must fail closed.
- Browser route/query/local-storage/map state must not grant geography or organization authority.
- Sensitive changes should preserve canonical audit/history semantics rather than silently overwriting material location state without evidence.

## Acceptance intent

- `GEO-009`: the system models where the organization is based separately from where it can work/provide service.
- `GEO-010`: exact, approximate and locality-only public display modes are enforced while retaining actual location internally where required.
- `ORG-005`: authorized organization management captures physical address, optional mailing address, public-display preference and home/private indication.
- `ORG-006`: address is geocoded through a provider boundary and the user confirms the resolved location on the controlled map before it becomes canonical.
- `ORG-009`: service geography is captured independently from physical location using canonical geography references.

## Expected implementation qualities

- typed home-location, mailing-address, visibility and service-geography contracts;
- server-authoritative organization-scope checks;
- provider-neutral geocoding port/adapter boundary;
- deterministic public-location projection with privacy tests;
- canonical geography IDs rather than free-form locality names as authority;
- atomic or otherwise integrity-safe persistence of confirmed location and related state;
- explicit confirmation/provenance state for geocoded results;
- accessible desktop/mobile location and service-area capture UI following `docs/design/`;
- tests for exact/approximate/locality-only leakage boundaries;
- tests for wrong-user, wrong-org, unconfirmed geocode, malformed address and geography manipulation;
- emulator/persistence/rules coverage where new collections/fields are introduced.

## Explicit non-scope

Do **not** implement in Slice 2.6:

- Profile Complete (`ORG-012`);
- capability requirements (`ORG-008`);
- business objectives (`ORG-011`);
- final organization marker activation (`GEO-011`);
- Organization 360 (`ADM-063`, `ADM-064`);
- Organization Verification or Address Verified badge award unless a future authorized feature specifically owns that evidence rule;
- provider service-territory product behavior (`RES-004`);
- arbitrary GIS upload/editor tooling;
- road/parcel routing;
- broad profile enrichment beyond location/service geography.

## Exit checkpoint

The system possesses a privacy-controlled, user-confirmed canonical location for an authorized organization and a separate canonical representation of where that organization can operate/provide service. These contracts are ready to feed Essential Organization Profile and, later, marker activation.

## Completion discipline

Mark only `GEO-009`, `GEO-010`, `ORG-005`, `ORG-006`, and `ORG-009` Done when their individual acceptance conditions and validation evidence pass.

After merge, recalculate dependencies from merged `main`. Do not begin Slice 2.7 unless its feature set is dependency-eligible.