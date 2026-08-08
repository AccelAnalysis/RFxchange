# Slice 3.2 — Controlled Network Entry & Discovery

**Status: COMPLETE VIA PR #120 — CONFIGURED-BROWSER, CLEANUP, FULL REPOSITORY AND PRODUCTION CI EVIDENCE PASSED**

## Feature IDs

- `GEO-012` — Controlled platform map entry
- `DSC-001` — Capability-based organization search
- `DSC-002` — Geographic/service-area filters
- `DSC-003` — Map-based organization/opportunity/resource discovery

## Objective

Convert the activated organization and B6a workspace foundation into the first real Network workspace: authoritative locality context, own organization node, permitted organization projections, capability-first search, geographic/service-area filtering, and synchronized map/list/detail behavior.

## Prerequisite result

Completed prerequisites:

- Wave 2 OPEN and real-marker authority;
- Slice 3.1 transactional communications reliability;
- B1 semantic foundation;
- B2 shared primitives and authority-gated object interfaces;
- B3 Exchange Light cartography and organization-node grammar;
- B6a authenticated organization home, deterministic UI-only workspace state, provenance, and recovery contracts.

B4 public marketing/acquisition and B5 activation experience are also complete under the adopted numerical Brand Gate sequence. They do not mark any Slice 3.2 Feature ID Done.

## Must read

- `/AGENTS.md`
- `docs/context/README.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/brand/README.md`
- `docs/brand/BRAND_GATES_B2_B6A_RECONCILIATION.md`
- `docs/brand/BRAND_GATE_B2_SHARED_PRIMITIVES.md`
- `docs/brand/BRAND_GATE_B3_CARTOGRAPHIC_CONVERGENCE.md`
- `docs/brand/BRAND_GATE_B6A_EXISTING_WORKSPACE.md`
- `docs/brand/RFXCHANGE_BRAND_EXPERIENCE_SYSTEM.md`
- `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md`
- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`
- `docs/brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- `docs/design/MAP_VISUAL_SYSTEM.md`
- `docs/tracking/RFxchange_BRAND_GATE_TRACKER.md`
- canonical Feature-ID tracker and dependency map
- Wave 2 OPEN/marker contracts
- merged Slice 3.1 communications contracts
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

### `GEO-012`

First real Network entry centers on the participant's authoritative selected geography and exposes only permitted objects. Own organization identity/location follows its approved public/private projection; unreleased/restricted locality rules remain server-side. B6a organization-home state is UI-only and never grants access.

### `DSC-001`

Search by meaningful capabilities/services/products/functions. Name, category, and NAICS may supplement discovery but must not displace capability-first matching. Matching language must explain inputs without claiming qualification, endorsement, credibility, or guaranteed eligibility.

### `DSC-002`

Filter by base geography, service geography and, where relevant, performance location. Keep where an organization is based separate from where it can perform. Filters must use canonical geography identifiers and must not reconstruct private exact locations.

### `DSC-003`

Expose permitted organizations as interactive map/list/detail objects. Opportunities and Official Resource Providers may appear only after their source domains become authoritative. Slice 3.2 must tolerate absent later object types without fake data, placeholder live objects, or disabled shells that imply availability.

## Brand and spatial rules

- Extend the B6a Spatial Workspace; do not create a second Network shell or dashboard.
- Use the B2 organization-node interface and B3 cartographic grammar while preserving renderer-owned coordinates and PR #99 focal-marker visibility.
- Preserve the B6a organization-home control, contextual sheet, provenance, recovery boundaries, and UI-only persistence contract.
- Use authoritative locality fields and subdued surrounding geography.
- Provide one capability-first search/filter system and synchronized map/list/detail behavior.
- Provide a structured list/detail equivalent for keyboard and screen-reader users.
- Do not render live opportunity beacons before authoritative Wave 4 RFx publication.
- Do not render service fields before approved provider service-territory authority exists in Slice 3.7.
- Do not draw referral, team, or RFx paths without real relationship/event records.
- Do not display credibility seals, paid ranking, or outcome-green treatments.
- Empty and low-density states must be truthful and useful; never fabricate organizations or activity to make the market appear populated.

## Acceptance intent

- OPEN users land in the correct controlled geography with authoritative boundaries/camera and own organization node;
- B6a organization home remains usable and state preservation remains UI-only;
- capability search returns permitted organization projections with explainable matching inputs;
- geographic/service-area filters behave against canonical geography data;
- map/list/detail interaction preserves geographic anchoring, selected object, viewport intent, and current access controls;
- current server authorization is re-evaluated and browser state cannot grant access;
- private exact locations are not reconstructed from approximate/locality-only projections;
- desktop, intermediate, and mobile compositions preserve the focal target and one search/filter pattern;
- keyboard and screen-reader users receive a structured list/detail alternative;
- absent future opportunity/provider/referral/credibility domains produce truthful absence rather than fake or misleading objects;
- loading, empty, error, permission, expired, and recovery behavior uses the converged shared primitives;
- configured-browser acceptance uses authorized real organization projections and cleans disposable records when applicable.

## Expected implementation qualities

Server-side query/projection authorization, provider-neutral search/index boundary where appropriate, deterministic pagination/query contracts, accessible map/list synchronization, responsive drawers/sheets, canonical layer hierarchy, restrained overlays, no floating/non-geographic markers, and tests for released/unreleased geography, exact/approximate/locality-only privacy, cross-organization access, capability/filter combinations, stale browser state, and absent future domains.

## Explicit non-scope

Do not implement Wave 4 RFx search, opportunity beacons, advanced recommendations, partner-gap matching, provider service profiles/fields, referral or teaming paths, credibility ranking/seals, Intelligence Dark, Presentation Mode, production sound, haptics, paid search advantages, or later Wave 3 profile/referral/provider features.

## Exit checkpoint

The OPEN platform becomes a real, controlled, capability-first Network discovery environment built on the converged organization home rather than an onboarding destination, decorative map, directory-only page, or conventional dashboard.

## Completion discipline

- Explicit authorization was provided before implementation began.
- Only `GEO-012`, `DSC-001`, `DSC-002`, and `DSC-003` are marked Done by this slice.
- Brand Gate completion does not satisfy these Feature IDs.
- Configured-browser acceptance used two disposable Auth identities and 42 scoped Firestore records, proved authority/privacy/search/filter/map-list-detail/responsive/accessibility/five-locale behavior, and removed the full footprint with a zero-residual scan.
- Production CI run `31283391560` passed on the synchronized substantive and browser-evidence head. The final closeout-only head must also pass before merge.
- Recalculation makes AMACS 0.5.0 reconciliation the next no-Feature-ID gate; Slice 3.3 remains blocked behind that reconciliation and the AI/AMACS Interpretation Foundation.
