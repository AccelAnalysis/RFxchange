# RFxchange Geography Fabric

**Status:** Foundation implementation — not independently verified  
**Production authority:** `AccelAnalysis/RFxchange`  
**Reference contribution:** TestRFx PR #72  
**Effective:** 2026-08-23

## Purpose

The Geography Fabric gives RFxchange one governed geography substrate for Organizations, RFx, Resources, Capabilities, Search, Map, and Intelligence without replacing the production Firebase/Firestore and Mapbox architecture.

It separates four concepts that must not be flattened into one field:

1. **Operating Geography** — a released or controlled geography in which a participant may use RFxchange.
2. **Canonical Geography Catalog** — source- and vintage-qualified geographic identities used for containment, filtering, overlays, and analytics.
3. **Location Geography Profile** — the complete physical-containment and overlay profile derived after RFxchange accepts a coordinate.
4. **Geographic Scope** — a declared area where an Organization, Resource, RFx, Capability, past-performance record, intended audience, or Intelligence analysis applies.

The existing `geographies` collection remains the Operating Geography authority. It is not expanded into millions of Census blocks.

## Physical hierarchy and parallel overlays

The physical hierarchy is intentionally pure:

```text
Country
  → State
    → County / County-equivalent
      → Place / Municipality
        → Census Tract
          → Block Group
            → Census Block
```

Virginia independent cities remain county-equivalents.

Markets and other non-nesting areas are overlays, not physical parents. Supported overlay identities include:

- region/market, including Hampton Roads;
- county subdivision;
- MSA and CSA;
- planning region;
- ZIP/ZCTA;
- congressional and state legislative districts;
- school districts;
- urban areas;
- Opportunity Zones;
- Enterprise Zones;
- HUBZones;
- Foreign-Trade Zones;
- economic-development, redevelopment, industrial-development, and tax-increment-financing zones;
- other governed economic-development zones.

A location may belong to many overlays simultaneously without changing its physical containment path.

## Stable identity and versioned geography

A canonical geography is a stable logical identity. A Geography Version records the source-qualified representation for a particular dataset vintage.

```text
Canonical Geography
  ├── currentVersionId
  └── Geography Versions
        ├── dataset source
        ├── source layer
        ├── vintage
        ├── effective dates
        ├── parent version
        └── geometry reference
```

This prevents a future tract or boundary revision from silently rewriting historical analytics. The platform can answer both:

- Which logical geography is this?
- According to which source and vintage?

Dataset sources retain authority, use/license basis, vintage, import time, and optional effective dates.

## Accepted point versus derived profile

A Location Geography Profile is derived only after RFxchange has accepted a coordinate through its existing governed location process.

The Geography Fabric enriches that coordinate. It does not move it.

Each profile retains:

- accepted point and deterministic fingerprint;
- source location revision time;
- operating geography, when applicable;
- country through Census block where returned;
- parallel overlays;
- one materialized membership per hierarchy/overlay version;
- resolver, benchmark, vintage, derivation, confidence, and resolution time;
- location-visibility policy.

A profile revision must advance exactly one version from persisted state. Every hierarchy and overlay reference must have a matching materialized membership.

## Point and scope are different facts

A point answers **where something is located**. A scope answers **where something applies**.

The foundation supports:

- Organization service area;
- Resource service area;
- RFx performance area;
- RFx intended-audience area;
- Capability service area;
- past-performance area;
- Intelligence analysis area.

Scope modes are:

- canonical geography set with include/exclude members;
- structured address;
- point;
- radius;
- governed polygon asset;
- statewide;
- nationwide;
- remote.

Scope kind and subject kind are governed pairs. For example, an RFx performance area must belong to an RFx subject, and a Resource service area must belong to a Resource subject. Remote scopes cannot carry an implied physical point, source location, polygon, radius, or geography membership.

Statewide and nationwide scopes require one actual State or Country geography version; labels cannot substitute for geography truth.

## Privacy projection

Canonical server truth is more granular than participant projection.

### Private authority

Authorized private/server projections may retain:

- accepted point;
- tract, block group, and block;
- all source-qualified overlays, including economic-development areas.

### Participant surfaces

Public and Network projections expose only the physical locality hierarchy needed to communicate location safely:

- country;
- state;
- county/county-equivalent;
- place, where available;
- participant-safe broad overlays such as market, MSA/CSA, and planning region.

Tract, block group, block, postal, political, school, urban, and economic-development-zone membership are not projected merely because the canonical server knows them. Exact points are exposed only where the existing location-visibility contract permits them. Approximate and locality-only locations do not regain a point through Geography Fabric search or analytics.

Analytics projections never expose the accepted point.

## Analytics and Intelligence

Geography Metric Snapshots provide the first governed substrate for RFxchange-native Intelligence measures.

Every snapshot carries:

- geography and geography-version IDs;
- period;
- record type;
- record and distinct-organization counts;
- coverage classification;
- source dataset IDs when external data is used;
- minimum cell size;
- suppression state;
- generation time.

A snapshot defaults to `rfxchange-exchange-only`. It must not be described as full-market measurement. A snapshot claiming `external-authoritative-dataset` coverage requires explicit source-dataset provenance.

Counts are suppressed when the distinct-organization cell is below the configured minimum. The public analytical projection returns `null`, not a small count that could reveal an Organization's location.

## Firestore persistence

The Geography Fabric uses a slice-scoped Firestore schema extension consistent with existing RFxchange infrastructure patterns.

| Collection | Purpose | Mutability |
|---|---|---|
| `canonicalGeographies` | Stable logical geography identity | Mutable current-version pointer and display metadata |
| `geographyVersions` | Source/vintage-qualified geography version | Append-only |
| `geographyDatasetSources` | Dataset authority and provenance | Append-only |
| `locationGeographyProfiles` | Current materialized profile per accepted location | Mutable, revision-controlled |
| `locationGeographyMemberships` | Profile-version membership facts | Append-only |
| `geographicScopes` | Current governed scope aggregate | Mutable, revision-controlled, Organization-scoped |
| `geographicScopeMembers` | Scope revision include/exclude facts | Append-only, Organization-scoped |
| `geographyFabricCommands` | Idempotent server command receipts | Append-only |
| `geographyFabricEvents` | Geography Fabric audit/event facts | Append-only |
| `geographyMetricSnapshots` | Privacy-aware analytical facts | Append-only |

Repository adapters remain server-side and Firebase Admin-backed. They use stable document IDs, schema versions, server timestamps, command idempotency, exact revision advancement, immutable-source conflict detection, and atomic unit-of-work writes.

Firestore paths never prove authority. This foundation does not expose client write rules or infer authorization from selected UI state.

## Foundation packet boundaries

This first packet implements contracts, invariants, persistence conventions, repository ports, atomic units of work, and tests.

It intentionally does **not** yet:

- call the Census Geocoder or TIGERweb;
- ingest external boundary files;
- move or fabricate an accepted coordinate;
- write provider data to production;
- promote Hampton Roads candidates;
- migrate RFx, Resource, Capability, past-performance, Search, Map, or Intelligence consumers;
- expose granular geography through participant clients.

## Next implementation packet

The next Geography Fabric packet should:

1. implement a server-only Census `layers=all` resolver port with fixture-driven parsing and timeout/retry boundaries;
2. materialize profiles for already accepted locations without moving coordinates;
3. convert Hampton Roads from a physical-parent assumption into a `region-market` overlay;
4. enrich the PR #243 migration plan with source/vintage-qualified geography profiles and provider/Resource service scopes;
5. produce a dry-run comparison and review queue;
6. promote only approved providers through protected Firebase Admin commands after review.

Only after those foundations are proven should RFx, Resources, Capabilities, Search, Map, and Intelligence progressively adopt the structured scopes.
