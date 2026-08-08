# Wave 3 Slice 3.2 — Controlled Network Entry & Discovery

## Status

**IMPLEMENTED AND CONFIGURED-BROWSER ACCEPTED ON PR #120 — FINAL-HEAD PRODUCTION CI REQUIRED BEFORE FEATURE COMPLETION.**

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

## Configured-browser acceptance evidence

Configured-browser acceptance completed on 2026-08-08 against the selected real Firebase project and configured Mapbox environment with one disposable authorized manager, one disposable user without organization authority, and four permitted or restricted counterparty projections.

The browser pass proved:

- an OPEN manager entered the authoritative Portsmouth Network workspace with the real home node, current boundary/camera, and three permitted organization projections;
- a user without an active organization membership failed closed to activation, an organization suspension applied after load redirected to suspended remediation, and changing the lifecycle from OPEN to controlled removed Network search while preserving only the controlled home map;
- capability search returned the two authored cybersecurity profiles, and the canonical Norfolk service-area filter narrowed the result to the one organization that declared Norfolk service coverage while keeping Portsmouth as its base locality;
- exact public location rendered its full address, while approximate and locality-only results exposed only their permitted public labels and privacy-projected map coordinates rather than their retained private coordinates;
- list selection, map focus, detail identity and the server-projected marker ID stayed synchronized; after the selected result became unavailable, reload rejected the stale saved selection and recovered to organization home;
- the truthful no-results state appeared for an unmatched capability query and did not fabricate market density;
- the 1440×900 desktop, 900×760 intermediate and 390×844 mobile compositions retained map/search/detail usability with no horizontal overflow; the browser-found mobile legibility correction gives search and results a restrained glass surface above the map and a non-transparent reduced-transparency fallback;
- search, service-area and result controls retained named screen-reader semantics and visible focus treatment, while the existing reduced-motion contracts remained intact;
- `en-US`, Spanish, French, Italian and German loaded the localized Network workspace and preserved participant-authored organization names and capability content verbatim;
- future opportunity, referral, provider, credibility and outcome objects remained absent; and
- the browser console contained zero warnings or errors.

Cleanup removed 42 exact Firestore records and both disposable Firebase Auth identities. A follow-up residual scan returned zero.

Focused validation for the browser-found correction and the full canonical `npm run check` passed locally on Node.js 24.18.0. The full gate included 385 architecture tests, 19 Functions tests, TypeScript, lint with no errors, and a successful production build.

## Acceptance remaining before Done

Production CI must pass on the synchronized final PR head. PR #120 remains draft and the four Feature IDs remain Not Started until that final-head evidence exists.

Only after that evidence exists may `GEO-012`, `DSC-001`, `DSC-002` and `DSC-003` be marked Done and the Wave 3 dependency state recalculated.
