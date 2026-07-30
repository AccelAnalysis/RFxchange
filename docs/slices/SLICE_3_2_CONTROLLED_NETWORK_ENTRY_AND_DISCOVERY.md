# Slice 3.2 — Controlled Network Entry & Discovery

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs
- `GEO-012` — Controlled platform map entry
- `DSC-001` — Capability-based organization search
- `DSC-002` — Geographic/service-area filters
- `DSC-003` — Map-based organization/opportunity/resource discovery

## Objective

Convert the activated organization/map foundation into the first real Network workspace: authoritative locality context, own organization marker, permitted network objects, capability-first search and geography/service-area filtering.

## Must read

- `/AGENTS.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- `docs/design/MAP_VISUAL_SYSTEM.md`
- canonical tracker/dependency map
- Wave 2 OPEN/marker contracts
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

### `GEO-012`

First real entry centers on the participant's authoritative selected geography and exposes only permitted objects. Own organization identity/location follows its approved public/private projection; unreleased/restricted locality rules remain server-side.

### `DSC-001`

Search by meaningful capabilities/services/products/functions. Name/category/NAICS may supplement discovery but must not displace capability-first matching.

### `DSC-002`

Filter by base geography, service geography and where relevant performance location. Keep where an organization is based separate from where it can perform.

### `DSC-003`

Expose permitted organizations and, when their source domains become available, opportunities and official resources as interactive map objects. The map must tolerate absent later-wave object types without fake data.

## Acceptance intent

- OPEN users land in the correct controlled geography with authoritative boundaries/camera and own marker;
- capability search returns permitted organization projections with explainable matching inputs;
- geographic/service-area filters behave against canonical geography data;
- map/list/detail interaction preserves geographic anchoring and access controls;
- private exact locations are not reconstructed from approximate/locality-only projections.

## Expected implementation qualities

- server-side query/projection authorization;
- provider-neutral search/index boundary where appropriate;
- deterministic pagination/query contracts;
- accessible map/list synchronization and mobile behavior;
- canonical map layer hierarchy, restrained glass treatment and no floating/non-geographic markers;
- tests for released/unreleased geography, exact/approximate/locality-only privacy, cross-org access and capability/filter combinations.

## Explicit non-scope

Do not implement Wave 4 RFx search, advanced recommendations, partner gap matching, provider service profiles, credibility ranking or paid search advantages.

## Exit checkpoint

The OPEN platform is now a real, controlled Network environment rather than an onboarding destination.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.3.