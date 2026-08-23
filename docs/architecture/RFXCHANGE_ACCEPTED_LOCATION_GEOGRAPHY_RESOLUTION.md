# RFxchange Accepted-Location Geography Resolution

**Status:** Implemented — Not Verified

**Production authority:** `AccelAnalysis/RFxchange`

**Reference contribution:** TestRFx PR #72

**Effective:** 2026-08-23

## Purpose

This packet enriches an already accepted RFxchange location with source- and vintage-qualified geography facts. It does not geocode a participant address, move a governed coordinate, promote a provider, or write production data by itself.

The resolver answers:

> Given this exact coordinate that RFxchange has already accepted, which physical geographies and parallel overlays does the authoritative source return?

The result becomes an input to the Geography Fabric materialization boundary established in the foundation packet.

## Accepted-coordinate invariant

The accepted point remains authoritative throughout resolution and materialization.

```text
Governed RFxchange location
        ↓
accepted longitude / latitude
        ↓
coordinate fingerprint
        ↓
server-only geography resolution
        ↓
matching fingerprint required
        ↓
Location Geography Profile packet
```

A resolver response cannot replace or adjust the point. The materialization builder recomputes the fingerprint and rejects output associated with any different coordinate.

## Census resolver

The U.S. implementation uses the Census coordinate geography endpoint with:

- benchmark `Public_AR_Current`;
- vintage `Current_Current`;
- `layers=all`;
- JSON response;
- bounded timeout;
- bounded retry for transient HTTP failures;
- no live network dependency in continuous integration.

The parser is fixture-testable independently of the network transport.

## Physical hierarchy

Returned physical geography identities are materialized through the pure containment hierarchy:

```text
United States
  → State
    → County / county-equivalent
      → Place, when returned
      → Census tract
        → Block group
          → Census block
```

Each generated Geography Version carries its actual `parentVersionId`. The Geography Fabric foundation validates the supplied chain before a profile can be constructed or persisted.

Virginia independent cities are represented as county-equivalents. When both an incorporated place and Census-designated place are returned, the incorporated place is preferred for the physical place slot.

## Parallel overlays

Non-nesting geographies remain overlays rather than physical parents. The resolver maps supported Census layers such as:

- MSA and CSA;
- ZIP/ZCTA;
- congressional districts;
- state legislative districts;
- school districts;
- county subdivisions;
- urban areas.

The governed Hampton Roads market is supplied separately as an RFxchange `region-market` overlay. It never becomes the parent of Virginia, a locality, tract, block group, or block.

## Source and version provenance

Every resolved entry contains:

- stable logical geography identity;
- source-qualified Geography Version identity;
- source system and layer;
- benchmark and vintage;
- external geography identifier;
- name and state context;
- immutable parent-version relationship for physical geography;
- selected source metadata;
- resolution timestamp.

The packet retains a dataset-source record for both Census-derived identities and the governed RFxchange Hampton Roads market overlay.

## Materialization packet

`buildLocationProfileMaterialization` produces one atomic repository input containing:

- dataset sources;
- canonical geography identities;
- immutable Geography Versions;
- complete physical and overlay memberships;
- the current Location Geography Profile;
- an idempotent command receipt;
- the matching Geography Fabric event.

Additional overlays may supplement resolution, but cannot replace physical containment and must reference their supplied dataset source.

## Hampton Roads enrichment manifest

The offline Hampton Roads manifest consumes the existing PR #243 migration plan. It selects only locations with accepted Census coordinate decisions and preserves all candidate review dispositions.

For every unique accepted location it records either:

- `ready_for_profile_materialization`; or
- `needs_geography_resolution` with the accepted point and a bounded public error.

The manifest:

- deduplicates shared accepted locations by location key;
- rejects conflicting accepted coordinates for the same location key;
- verifies resolver point invariance;
- attaches Hampton Roads as a governed market overlay;
- retains source candidate keys and dispositions;
- performs no Firebase, Firestore, PostgreSQL, PostGIS, or alternate-runtime writes;
- sets `productionWrites: false` explicitly.

Unresolved, held-out, or review-required provider candidates are not silently promoted by this packet.

## Privacy boundary

Resolution may produce tract, block group, block, political, postal, school, urban, and other granular memberships. Their presence in canonical server truth does not authorize participant projection.

The existing Location Visibility contract and Geography Fabric projections continue to determine whether a point or geography may appear on Network, Public, Map, Search, or Intelligence surfaces. Analytics never receives the accepted point, and granular memberships remain subject to projection and minimum-cell suppression rules.

## Packet boundaries

This packet does not:

- change participant address confirmation;
- move an accepted coordinate;
- publish boundary geometry;
- open client write rules;
- create or deduplicate canonical Organizations;
- approve provider candidates;
- write provider or Resource records to production;
- expose granular geography directly in the participant interface.

The next bounded packet may use the enriched manifest to build the canonical comparison, approval, and protected Firebase promotion plan. Production writes remain separate from offline resolution and require explicit governed approval inputs.
