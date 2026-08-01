# Slice 3.2 — Controlled Network Entry & Discovery

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL SLICE 3.1 AND BRAND GATES B1, B2, B3 AND B6A ARE MERGED AND THIS SLICE IS EXPLICITLY AUTHORIZED**

## Feature IDs

- `GEO-012` — Controlled platform map entry
- `DSC-001` — Capability-based organization search
- `DSC-002` — Geographic/service-area filters
- `DSC-003` — Map-based organization/opportunity/resource discovery

## Objective

Convert the activated organization/map foundation into the first real Network workspace: authoritative locality context, own organization node, permitted organization projections, capability-first search and geography/service-area filtering.

## Must read

- `/AGENTS.md`
- `docs/context/README.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/brand/README.md`
- `docs/brand/BRAND_GATE_B0_RECONCILIATION.md`
- `docs/brand/RFXCHANGE_BRAND_EXPERIENCE_SYSTEM.md`
- `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md`
- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`
- `docs/brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- `docs/design/MAP_VISUAL_SYSTEM.md`
- canonical tracker/dependency map
- Wave 2 OPEN/marker contracts
- merged Slice 3.1 communications contracts
- merged Brand Gates B1, B2, B3 and B6a
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

### `GEO-012`

First real entry centers on the participant's authoritative selected geography and exposes only permitted objects. Own organization identity/location follows its approved public/private projection; unreleased/restricted locality rules remain server-side.

### `DSC-001`

Search by meaningful capabilities/services/products/functions. Name/category/NAICS may supplement discovery but must not displace capability-first matching.

### `DSC-002`

Filter by base geography, service geography and, where relevant, performance location. Keep where an organization is based separate from where it can perform.

### `DSC-003`

Expose permitted organizations and, only when their source domains become available, opportunities and Official Resource Providers as interactive map objects. The Wave 3.2 implementation must tolerate absent later-wave object types without fake data, placeholder live objects or disabled shells that imply availability.

## Brand and spatial rules

- The map is the Spatial Workspace, not a dashboard card or decorative background.
- Use the proprietary organization-node treatment from the converged B2/B3 primitives while preserving renderer-owned coordinates and PR #99 focal-marker visibility.
- Use authoritative locality fields and subdued surrounding geography.
- Provide one search/filter system and synchronized map/list/detail behavior.
- Do not render live opportunity beacons before authoritative Wave 4 RFx publication.
- Do not render service fields before approved provider service-territory authority exists in Slice 3.7.
- Do not draw referral, team or RFx paths without real relationship/event records.
- Do not display credibility seals, paid ranking or outcome-green treatments.
- Empty and low-density states must be truthful and useful; never fabricate organizations or network activity to make the market appear populated.

## Acceptance intent

- OPEN users land in the correct controlled geography with authoritative boundaries/camera and own organization node;
- capability search returns permitted organization projections with explainable matching inputs;
- geographic/service-area filters behave against canonical geography data;
- map/list/detail interaction preserves geographic anchoring, viewport intent and access controls;
- private exact locations are not reconstructed from approximate/locality-only projections;
- desktop, intermediate and mobile compositions preserve the focal target and one search/filter pattern;
- keyboard and screen-reader users receive a structured list/detail alternative;
- absent future opportunity/provider/referral/credibility domains produce truthful absence rather than fake or misleading objects.

## Expected implementation qualities

Server-side query/projection authorization, provider-neutral search/index boundary where appropriate, deterministic pagination/query contracts, accessible map/list synchronization, responsive drawers/sheets, canonical layer hierarchy, restrained overlays, no floating/non-geographic markers, and tests for released/unreleased geography, exact/approximate/locality-only privacy, cross-org access and capability/filter combinations.

## Explicit non-scope

Do not implement Wave 4 RFx search, opportunity beacons, advanced recommendations, partner gap matching, provider service profiles/fields, referral or teaming paths, credibility ranking/seals, Intelligence Dark, Presentation Mode, production sound, haptics or paid search advantages.

## Exit checkpoint

The OPEN platform is a real, controlled and brand-converged Network environment rather than an onboarding destination or conventional dashboard.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.3.
