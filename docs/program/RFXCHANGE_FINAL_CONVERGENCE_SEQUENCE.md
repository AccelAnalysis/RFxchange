# RFxchange Final TestRFx Convergence Sequence

**Effective:** 2026-08-23

**Production authority:** `AccelAnalysis/RFxchange`

**Controlled donor/reference:** `AccelAnalysis/TestRFx`

**Current starting main:** `4494e6dcdacf1a4c457b1cd0b8a6081878875318`

## Decision

The remaining convergence is no longer a broad TestRFx migration. RFxchange owns production identity, Firestore persistence, Firebase Functions and server boundaries, Firebase Storage, Mapbox rendering, canonical domain models, authorization, audit, and release safety. TestRFx contributes bounded experience and data-design references.

The implementation order below incorporates two product-owner changes:

1. Replace the proposed TestRFx gold teardrop port with a Mapbox-native **Dimensional Exchange Beacon** family derived from RFxchange's graphite, ivory, and gold cartographic language.
2. Install a shared **Geography Fabric** before canonical Hampton Roads provider promotion and before the remaining RFx/media workflow completion, so Organizations, RFx, Resources, Capabilities, Search, Map, and Intelligence do not build against the older coarse geography model.

## Governing implementation sequence

### 1. Dimensional Exchange Beacons and Mapbox presentation convergence

Implement one proprietary marker family for Organizations and all four permanent lenses:

- graphite dimensional face, restrained gold rim, subtle bevel and shadow;
- semantic center identity for Opportunities/RFx, Resources, Intelligence, and Capabilities;
- distinctive but restrained own-organization treatment;
- selected state with double focus ring, soft halo, and fixed geographic anchor;
- approximate-location dashed treatment;
- locality-only/list-only records remain without fabricated points;
- stacked graphite/gold cluster treatment;
- Mapbox-native implementation only;
- floating-control and configured basemap-preset refinement;
- reduced-motion and reduced-transparency safety.

The marker coordinate remains invariant. Visual lift or depth never changes the geographic tip.

### 2. Correct live Exchange action wiring

Reimplement the valid portion of closed PR #245 against current main:

- retain handler candidates across fresh server permission resolution;
- bind selected Opportunity references in the actual Opportunity discovery workspace;
- activate only current canonical routes and commands;
- preserve `operational`, `applicable`, and `authorized` as separate facts;
- use progressive unavailability for missing commands;
- never derive authority from selected UI state.

### 3. RFxchange Geography Fabric foundation

Create a Firestore-native shared geography substrate without importing TestRFx PostgreSQL/PostGIS runtime:

- retain existing `geographies` as controlled **Operating Geographies**;
- add a source/vintage-qualified **Canonical Geography Catalog**;
- use a pure physical containment hierarchy: Country → State → County/County-equivalent → Place/Municipality → Census Tract → Block Group → Census Block;
- treat region/market, MSA/CSA, planning, postal, political, school, urban, Opportunity Zone, Enterprise Zone, HUBZone, FTZ, and other development areas as parallel overlays;
- persist Location Geography Profiles and materialized memberships after a coordinate is accepted;
- persist multi-purpose Geographic Scopes;
- separate physical location, service/coverage, performance, intended audience, past performance, and analysis geography;
- preserve resolver, dataset, source authority, benchmark, vintage, derivation, and confidence;
- separate private canonical granularity from public map/search/analytics projection;
- add minimum-cell and authority-aware analytical suppression.

### 4. Geography consumers and Hampton Roads canonical promotion

Use the Geography Fabric in this order:

1. enrich accepted Hampton Roads provider coordinates without moving them;
2. attach full physical profiles and Hampton Roads as a market overlay;
3. create provider and Resource service scopes;
4. compare/deduplicate against canonical organizations;
5. promote only approved candidates through Firebase Admin/server commands;
6. preserve review, failed, unresolved, and held-out candidates off-map;
7. project promoted providers into Resources, Search, Map, and privacy-safe Intelligence facts.

Then progressively adopt structured scopes in RFx performance, intended audience, Resource coverage, Capability service areas, and past performance while retaining temporary compatibility projections where required.

### 5. Public media projection, organization introduction media, and RFx attachments

Implement the media primitives before enabling camera/file authoring or hosted submission:

- protected Firebase Storage source objects;
- reviewed public-media projections;
- organization logo/poster and allowlisted YouTube/Vimeo introduction media;
- duration and provider validation;
- card fallbacks;
- governed RFx attachment references;
- no private Storage URL leakage and no arbitrary iframe source.

### 6. Complete RFx production workflows

Complete remaining production-grade workflows against canonical Firebase contracts:

- reuse prior RFx into a new draft;
- camera/file attachment capture through the governed media boundary;
- publication preflight and committed receipt refinements;
- Pursue / Watch / Decline and mobile Go/No-Go;
- Firebase-backed response workspace and exact resume/conflict behavior;
- response collaboration, assignments, requests, and completion tracking;
- hosted review/submission with atomic authority and committed receipt;
- external submission reconciliation;
- subordinate local/interrupted-device continuity with safe promotion.

### 7. Intelligence geography layers and final UX convergence

Use materialized geography facts as the first legitimate Intelligence analytical substrate:

- RFxchange organization and capability concentration;
- RFx demand by performance geography;
- Resource coverage and service gaps;
- capability demand-versus-supply gaps;
- past-performance concentration;
- economic-development-zone participation;
- time-series snapshots with explicit Exchange coverage and caveats;
- privacy suppression and no claim of full-market measurement without an external authoritative dataset.

Finish with one bounded comparison of Registration, Geography onboarding, Organization Profile, Capability enrichment, and Exchange-ready completion. Port only experience improvements still absent from RFxchange; do not create a second identity, organization, membership, geography, capability, or commercial model.

## Merge order and completion

Each numbered stage may be split into bounded PRs, but merge order remains dependency-aware. A later stage may proceed in parallel only where it does not create rework or bypass an earlier production primitive. Missing consequential actions remain visibly unavailable; surrounding valid experience should still ship.

Convergence is complete when every selected TestRFx contribution is either implemented through RFxchange contracts, explicitly superseded/retired, or left unavailable with a named hard technical stop. TestRFx then remains a provenance/reference repository rather than a production backlog.

## Current implementation record

The first bounded candidate is PR #247. It implements Stages 1 and 2 from exact starting `main` `4494e6dcdacf1a4c457b1cd0b8a6081878875318`.

Candidate `fe8f08096b1553c6500d3ab1cca7462f7d6ff307` passed the deterministic focused suite with 28 tests, 28 passed and 0 failed, including beacon identity, privacy-aware marker projection, stacked cluster registration, configured basemap presets, selected Opportunity action context, fresh permission handling, and preserved Room reopen behavior. `git diff --check` also passed.

Domain-owned Capabilities and Resources action projections were then updated to carry the same server-derived `handlerCandidate` contract. The one-time compatibility workflow passed TypeScript and the focused regression suite before producing branch candidate `9704325ed1def8beae457604e6516a4065c8dc30`. This remains focused implementation evidence only; the next human-authored exact head must pass production CI and configured-browser acceptance before merge.
