# RFxchange Product Context Index

This directory contains normalized implementation context for Codex and human contributors. These documents distill approved product decisions from the project source material into stable, implementation-oriented rules.

They are **not a replacement for the canonical tracker or dependency map**. They explain what the product is supposed to mean across slices so implementation does not have to reconstruct product intent from Feature IDs alone.

## Read first

- [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md) — cross-cutting product invariants and boundaries.
- [`USER_JOURNEY.md`](USER_JOURNEY.md) — canonical activation journey from public discovery through OPEN.
- [`MAP_AND_GEOGRAPHY.md`](MAP_AND_GEOGRAPHY.md) — locality, FIPS, release-state, boundary, camera and marker principles.
- [`ORGANIZATION_MODEL.md`](ORGANIZATION_MODEL.md) — organization/user hierarchy, claim authority, identity resolution, profile and location concepts.
- [`ADMINISTRATION.md`](ADMINISTRATION.md) — administrative authority model, Organization 360, claims console and adjudication rules.
- [`RFX_TRANSACTION_CYCLE.md`](RFX_TRANSACTION_CYCLE.md) — end-to-end RFx object and issuer/responder lifecycle.
- [`CREDIBILITY_SYSTEM.md`](CREDIBILITY_SYSTEM.md) — organization-level credibility, badge families, evidence and commercial neutrality.
- [`COMMERCIAL_MODEL.md`](COMMERCIAL_MODEL.md) — free network access, Founding membership, provider status and monetization boundaries.
- [`ACQUISITION_AND_RETENTION.md`](ACQUISITION_AND_RETENTION.md) — acquisition objects, preserved entry context, first value and flywheel logic.
- [`BRAND_AND_UX.md`](BRAND_AND_UX.md) — concise map-first brand/UX principles and pointers to the brand and design authorities.

## Brand and design authority

Brand Gate B0 establishes this division:

- `docs/brand/` defines the approved **target brand experience**: product architecture, semantic meaning, map/data grammar, messaging, motion, sonic boundaries, viewing modes, implementation sequencing and brand acceptance.
- `docs/design/` defines the **currently implemented/converged visual baseline**: components, layouts, map presentation and presentation behavior.

For participant-facing work, use this order after security/domain/slice authority:

1. the applicable `docs/brand/` rule for target meaning and acceptance;
2. the applicable `docs/design/` rule for the current implementation baseline;
3. existing runtime as compatibility evidence.

Detailed brand authority:

- `docs/brand/RFXCHANGE_BRAND_EXPERIENCE_SYSTEM.md` — product identity, governing experience and requirement classification;
- `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md` — organization nodes, opportunity beacons, service fields, paths, seals, locality fields and density treatment;
- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md` — customer-facing terminology, claims, evidence, empty/error/success language and commercial/credibility boundaries;
- `docs/brand/MOTION_SYSTEM.md` and `docs/brand/SONIC_EXPERIENCE_SYSTEM.md` — governed movement and optional sensory-event boundaries;
- `docs/brand/VIEWING_MODES.md` — Exchange Light, future Intelligence Dark, Presentation Mode and High Contrast;
- `docs/brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md` — supplemental cross-surface acceptance;
- `docs/brand/BRAND_IMPLEMENTATION_ROADMAP.md` — sequential Brand Gates;
- `docs/brand/BRAND_GATE_B0_RECONCILIATION.md` — final Wave 2 reconciliation and Wave 3/4 integration boundaries.

Detailed implemented design authority:

- `docs/design/RFxchange_DESIGN_SYSTEM.md` — current product UI identity, color, typography, surfaces, controls, motion, accessibility and responsive behavior;
- `docs/design/MAP_VISUAL_SYSTEM.md` — current locality, marker, service-area, connection-path, release-state and map-layer behavior;
- `docs/design/PRESENTATION_SYSTEM.md` — current presentation/deck hierarchy, composition and audience adaptation.

User-facing work must not implement a target brand expression by fabricating a domain object. Opportunity beacons, service fields, referral/team/RFx paths, credibility seals and outcome paths require their authoritative domains.

## Canonical build authorities

- `docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md` — completion and evidence authority.
- `docs/tracking/RFxchange_DEPENDENCY_MAP.md` — sequencing/dependency authority.
- `docs/slices/` — approved implementation boundaries and exit conditions for planned slices.

Wave 2 is complete and reconciled. Wave 3 Slice 3.1 is the earliest dependency-eligible candidate but remains subject to explicit implementation authorization.

## Reference artifacts

`docs/reference/` is reserved for provenance, prototypes, screenshots and other evidence that may contain important intent but is not itself production architecture or current brand/design authority. See the READMEs under that directory before using a reference artifact as an implementation source.

## Normalization rule

When an approved source document contains broad narrative, these context documents preserve the durable product rule rather than every example. The original source title and relevant context are recorded in `docs/reference/source-documents/README.md` so a contributor can trace a normalized rule back to its provenance.

## Updating context

Update a context document when an approved product decision changes a cross-cutting rule. Update `docs/brand/` when target brand meaning, acceptance or sequencing changes. Update `docs/design/` when a visual/UI rule is implemented or the current baseline changes. Do not rewrite context, brand or design authority simply to match an implementation accident. If production architecture reveals a genuine conflict, document and resolve it explicitly rather than silently changing the product model.
