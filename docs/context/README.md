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
- [`BRAND_AND_UX.md`](BRAND_AND_UX.md) — map-first visual/product presentation principles relevant to implementation.

## Canonical build authorities

- `docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md` — completion and evidence authority.
- `docs/tracking/RFxchange_DEPENDENCY_MAP.md` — sequencing/dependency authority.
- `docs/slices/` — approved implementation boundaries and exit conditions for planned slices.

## Reference artifacts

`docs/reference/` is reserved for provenance, prototypes, screenshots and other evidence that may contain important intent but is not itself production architecture. See the READMEs under that directory before using a reference artifact as an implementation source.

## Normalization rule

When an approved source document contains broad narrative, these context documents preserve the durable product rule rather than every example. The original source title and relevant context are recorded in `docs/reference/source-documents/README.md` so a contributor can trace a normalized rule back to its provenance.

## Updating context

Update a context document when an approved product decision changes a cross-cutting rule. Do not rewrite context simply to match an implementation accident. If production architecture reveals a genuine product conflict, document the conflict and resolve it explicitly rather than silently changing the product model.
