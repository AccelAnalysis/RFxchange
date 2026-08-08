# Wave 3 Slice 3.2 — Controlled Network Entry & Discovery

## Status

**IMPLEMENTED ON THE AUTHORIZED SLICE BRANCH — PRODUCTION CI AND CONFIGURED-BROWSER ACCEPTANCE REQUIRED BEFORE FEATURE COMPLETION.**

Feature IDs in scope:

- `GEO-012` — controlled platform map entry;
- `DSC-001` — capability-based organization search;
- `DSC-002` — geographic/service-area filters;
- `DSC-003` — map-based permitted organization discovery.

No Feature ID is marked Done by this document.

## Runtime architecture

The existing B6a Spatial Workspace remains the only participant map shell. Slice 3.2 adds a server-authorized Network discovery projection over existing authoritative organization records rather than creating a second directory database or browser-readable discovery collection.

Every Network request re-resolves:

1. the current authenticated RFxchange session;
2. the active organization membership and restrictions;
3. the OPEN lifecycle state;
4. the selected authoritative geography and participant map projection;
5. current `network-participation` geography authority;
6. active organization marker state;
7. Profile Complete state;
8. current organization/location/service-geography records;
9. organization restrictions;
10. privacy-safe public location and marker projections.

Browser query parameters and saved UI state cannot grant access to a geography or organization.

## Discovery contract

The search surface is capability-first. It uses current organization-profile capability names, descriptions and typed categories as the primary searchable corpus. Organization-name matching is a secondary fallback. Matching explains profile overlap only and does not represent qualification, verification, endorsement, eligibility, procurement readiness or award likelihood.

The authorized base geography is fixed to the participant's selected geography. Service-area filtering uses canonical geography IDs drawn from the controlled map context and organization service-geography records. A service-area declaration remains distinct from where the organization is based.

Results are deterministic and bounded:

- maximum candidate scan: 250 active marker records in the authorized base geography;
- page size: 24 permitted organizations;
- result order: match strength, then organization display name;
- the participant's own home organization is not duplicated in discovery results.

## Privacy and projection

Exact private coordinates are never reconstructed in the browser.

Discovered organizations use the existing public projectors:

- exact visibility → confirmed public coordinate;
- approximate visibility → privacy-projected coordinate;
- locality-only visibility → deterministic locality-presence coordinate derived from organization identity and authoritative boundary without reading the private coordinate.

Public organization-profile projection respects the existing public-contact and website rules. Participant-authored organization names, capability names/descriptions, addresses, contact information and websites are displayed as authored and are not automatically translated.

## Map/list/detail synchronization

The existing `ExchangeSpatialScene` now accepts permitted organization markers as an additional real organization-node source. It preserves the B3 graphite/gold organization-node grammar and the existing Mapbox/locality/home-marker renderer.

The same server-projected marker ID drives:

- the capability search result list;
- selected result state;
- Mapbox marker selection;
- organization detail sheet;
- viewport focus.

Local storage remains UI-only. A restored selected object ID is accepted only when it remains present in the current authorized server projection; stale or filtered IDs fail closed to organization home.

The structured list/detail experience is the keyboard and screen-reader alternative to the visual map markers.

## Internationalization

Slice 3.2 adds a protected-workspace locale namespace for `en-US`, Spanish, French, Italian and German. Platform-controlled search, filter, state, detail, disclaimer and provenance strings are localized. Participant-authored content is never translated.

The existing internationalization validator now verifies shape and non-empty values for both the base marketing catalog and the Network namespace.

Configured-browser multilingual acceptance remains required before the migrated Network surface can be represented as fully localized.

## Explicit future-domain absence

Slice 3.2 does not create or display:

- opportunity beacons or RFx records;
- referrals or relationship paths;
- resource-provider service fields;
- teaming relationships;
- credibility seals;
- outcome paths;
- paid ranking or sponsored matching.

Those objects remain absent until their owning slices provide authoritative records.

## Acceptance remaining before Done

Repository validation, Firebase/emulator tests, architecture tests, TypeScript, lint and production build must pass on the final branch head.

Configured-browser acceptance must then prove, with authorized real/disposable organization records as applicable:

- correct OPEN entry, geography, boundary, camera and home node;
- capability search and service-area filtering;
- permitted organization projection and privacy behavior;
- map/list/detail synchronization and selection focus;
- desktop, intermediate and mobile composition;
- keyboard/focus and screen-reader list/detail behavior;
- stale browser-state denial after result/access changes;
- no fabricated opportunity, provider, referral, credibility or outcome objects;
- no browser console errors.

Only after that evidence exists may `GEO-012`, `DSC-001`, `DSC-002` and `DSC-003` be marked Done and the Wave 3 dependency state recalculated.
