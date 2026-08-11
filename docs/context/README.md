# RFxchange Product Context Index

This directory contains normalized implementation context for Codex and human contributors. These documents distill approved product decisions into stable, implementation-oriented rules.

They are **not a replacement for the canonical tracker or dependency map**. They explain what the product is supposed to mean across slices so implementation does not reconstruct product intent from Feature IDs alone.

## Read first

- [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md) — cross-cutting product invariants and boundaries.
- [`EXCHANGE_INTERACTION_ARCHITECTURE.md`](EXCHANGE_INTERACTION_ARCHITECTURE.md) — RFx-first lens hierarchy, persistent spatial context, marker/selection behavior, Intelligence/Locations boundary, provider gating and cross-lens workflow rules.
- [`USER_JOURNEY.md`](USER_JOURNEY.md) — canonical activation journey from public discovery through OPEN.
- [`MAP_AND_GEOGRAPHY.md`](MAP_AND_GEOGRAPHY.md) — locality, FIPS, release-state, boundary, camera and marker principles.
- [`ORGANIZATION_MODEL.md`](ORGANIZATION_MODEL.md) — organization/user hierarchy, claim authority, identity resolution, AMACS-backed capability assertion, profile and location concepts.
- [`ADMINISTRATION.md`](ADMINISTRATION.md) — administrative authority model, Organization 360, claims console and adjudication rules.
- [`RFX_TRANSACTION_CYCLE.md`](RFX_TRANSACTION_CYCLE.md) — end-to-end RFx object, AMACS 0.5.0 MarketNeed/interpretation relationship and issuer/responder lifecycle.
- [`CREDIBILITY_SYSTEM.md`](CREDIBILITY_SYSTEM.md) — organization-level credibility, badge families, evidence and commercial neutrality.
- [`COMMERCIAL_MODEL.md`](COMMERCIAL_MODEL.md) — free network access, Founding membership, provider status and monetization boundaries.
- [`ACQUISITION_AND_RETENTION.md`](ACQUISITION_AND_RETENTION.md) — acquisition objects, preserved entry context, first value and flywheel logic.
- [`BRAND_AND_UX.md`](BRAND_AND_UX.md) — concise map-first brand/UX principles and pointers to brand and design authorities.

## Exchange interaction authority

[`EXCHANGE_INTERACTION_ARCHITECTURE.md`](EXCHANGE_INTERACTION_ARCHITECTURE.md), merged through PR #150, establishes the cross-cutting participant interaction target:

- Opportunities/RFx remains the primary transaction lens and principal public positioning;
- Resources, Intelligence and Referrals are supporting lenses over the same market rather than separate applications;
- location and site functionality remains first-class inside Intelligence rather than becoming a peer commercial-real-estate product identity;
- lens switching preserves authorized map/search/selection context where meaningful;
- the participant's own organization uses the standing logo marker, while a selected external organization transitions from a compact node to the standing selected marker;
- Official Resource Provider actions remain gated by the existing application/review/approval authority;
- referral actions remain bounded by the current referral aggregate;
- complex RFx authoring may use an Operational Workspace while retaining a safe return seam to the Spatial Workspace; and
- no interface fabricates RFxs, opportunities, matches, providers, referrals, sites, intelligence, outcomes or market activity.

The vocabulary is binding:

- **Lens** — functional market context;
- **Layer** — map/analytical projection within a lens;
- **Appearance** — visual presentation only;
- **Workspace** — interaction composition for a task.

**Intelligence** is the functional analytical lens. **Light Appearance** and **Dark Appearance** are presentation terminology. Dark Appearance is not implemented or authorized by the interaction architecture.

PR #150 is documentation authority, not runtime authority for the complete Exchange shell.

## AMACS 0.5.0 and interpretation authority

AMACS 0.5.0 is the current standard baseline. It adds provider-neutral contracts for MarketNeed, InterpretationRecord, InterpretationCandidate and ConceptInterpretationGuidance while preserving the 615-capability catalog.

Use these documents together:

- [`../rfx/AMACS_0_5_RECONCILIATION.md`](../rfx/AMACS_0_5_RECONCILIATION.md) — completed release reconciliation and migration authority;
- [`../rfx/AMACS_INTEGRATION_CONTRACT.md`](../rfx/AMACS_INTEGRATION_CONTRACT.md) — pinned release, runtime projection, search, snapshot and domain-write rules;
- [`../slices/AI_AMACS_INTERPRETATION_FOUNDATION.md`](../slices/AI_AMACS_INTERPRETATION_FOUNDATION.md) — provider-neutral server implementation, provenance, privacy, cost, fallback and evaluation rules; and
- [`../slices/SLICE_3_3_MARKET_PROFILE_ENRICHMENT.md`](../slices/SLICE_3_3_MARKET_PROFILE_ENRICHMENT.md) — first product use for seller/responder capability declaration.

The governing interpretation rule is:

> AI or other assistance interprets and proposes. AMACS defines and constrains. The participant confirms. RFxchange stores and operates the authoritative market record.

An interpretation candidate is not an organization capability assertion, RFx requirement, qualification decision, verification or taxonomy change. Accepted candidates require a separate current-authority write. Manual AMACS browse/search remains required.

## RFx Core authority

The RFx Core planning package is indexed at [`../rfx/README.md`](../rfx/README.md). It defines:

- the one-RFx aggregate and Wave 4/5 boundary;
- AMACS 0.5.0 release ingestion, MarketNeed/interpretation contracts, runtime projection, search and historical snapshots;
- all 41 Wave 4 Feature IDs and the adopted planning sequence;
- issuer/responder/teammate product workspaces;
- the approved version-2-derived interaction direction;
- anti-regression and configured-browser acceptance; and
- the real-data-only B6c RFx map lens.

The specific implementation authority for the first Wave 4 slice is [`../slices/SLICE_4_1_EXECUTION_AUTHORITY.md`](../slices/SLICE_4_1_EXECUTION_AUTHORITY.md). It covers exactly `ISS-001`, `ISS-002` and `ISS-003`: the organization-owned RFx aggregate, draft-only lifecycle/version/event/idempotency seams, governed AMACS request-family snapshot and blank-source draft creation.

That authority leaves all three Feature IDs Not Started. Runtime implementation requires a separate explicit instruction after the documentation PR is reviewed, merged and post-merge green.

## Current sequencing status

Wave 2 is complete. Wave 3 Slices 3.1 through 3.8 and Brand Gates B0–B6a are merged, and the configured-browser/zero-residual Wave 3 exit accepted Network at 38/38. B6b remains intentionally pending.

Merged `main` at `42c9a33499d9c37af74b6f61d7e1a8f823d0e0f8` includes PR #150. The reviewed Slice 4.1 dependency result is:

- Wave 3 handoff: satisfied;
- AMACS 0.5.0 reconciliation: satisfied;
- AI/AMACS foundation: satisfied and reusable, but not required for manual Slice 4.1 request-family selection;
- organization authority/tenancy/audit/concurrency foundations: satisfied by prior cross-cutting implementation;
- Exchange Interaction Architecture: satisfied by PR #150;
- Stabilization 2C: isolated release engineering, not a product prerequisite; and
- no genuine dependency-map correction required.

Canonical totals remain **438 total · 152 Done · 286 Not Started**, with Wave 4 RFx Core **0/41**.

## Stabilization 2C boundary

The App Hosting backend `rfxchange`, project/repository connection, region `us-east4`, live branch `main`, root `/`, retained Web App and reserved App Hosting URL now exist. The remaining 2C blocker is trustworthy build-time source-SHA binding and accepted same-SHA live-deployment evidence. The managed source build has not exposed a documented immutable source SHA that can be bound to `RFXCHANGE_BUILD_SHA`.

Stabilization 2C remains incomplete and is handled separately. It does not block RFx Core domain development, and no RFx slice may weaken build identity or change rollout architecture under product authority.

## Brand and design authority

Brand Gate B0 establishes this division:

- `docs/brand/` defines the approved **target brand experience**: product architecture, semantic meaning, map/data grammar, messaging, motion, sensory rules, appearance/presentation planning, implementation sequencing and brand acceptance.
- `docs/design/` defines the **currently implemented/converged visual baseline**: components, layouts, map presentation and presentation behavior.

For participant-facing work, use this order after security/domain/slice authority:

1. applicable `docs/brand/` rule for target meaning and acceptance;
2. applicable `docs/design/` rule for current implementation baseline; and
3. existing runtime as compatibility evidence.

Detailed brand authority:

- `docs/brand/RFXCHANGE_BRAND_EXPERIENCE_SYSTEM.md` — product identity, governing experience and requirement classification;
- `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md` — organization nodes, opportunity beacons, service fields, paths, seals, locality fields and density treatment;
- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md` — customer-facing terminology, claims, evidence, empty/error/success language and commercial/credibility boundaries;
- `docs/brand/MOTION_SYSTEM.md` and `docs/brand/SONIC_EXPERIENCE_SYSTEM.md` — governed movement and optional sensory-event boundaries;
- `docs/brand/VIEWING_MODES.md` — current appearance/presentation terminology: Light Appearance, future Dark Appearance, separate Presentation Mode and High Contrast accessibility treatment;
- `docs/brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md` — supplemental cross-surface acceptance;
- `docs/brand/BRAND_IMPLEMENTATION_ROADMAP.md` — sequential Brand Gates;
- `docs/brand/BRAND_GATE_B0_RECONCILIATION.md` — final Wave 2 reconciliation and Wave 3/4 integration boundaries; and
- `docs/brand/BRAND_GATE_B6C_RFX_LENS.md` — future real-data RFx spatial expression; not implemented.

Detailed implemented design authority:

- `docs/design/RFxchange_DESIGN_SYSTEM.md` — current product UI identity, color, typography, surfaces, controls, motion, accessibility and responsive behavior;
- `docs/design/MAP_VISUAL_SYSTEM.md` — current locality, marker, service-area, connection-path, release-state and map-layer behavior; and
- `docs/design/PRESENTATION_SYSTEM.md` — current presentation/deck hierarchy, composition and audience adaptation.

User-facing work must not implement a target brand expression by fabricating a domain object. Opportunity beacons, service fields, referral/team/RFx paths, credibility seals and outcome paths require their authoritative domains.

## Canonical build authorities

- `docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md` — completion and evidence authority.
- `docs/tracking/RFxchange_DEPENDENCY_MAP.md` — sequencing/dependency authority.
- `docs/slices/` — approved implementation boundaries and exit conditions.

## Reference artifacts

`docs/reference/` is reserved for provenance, prototypes, screenshots and other evidence that may contain important intent but is not itself production architecture or current brand/design authority. Read the READMEs under that directory before using a reference artifact as an implementation source.

## Normalization rule

When an approved source document contains broad narrative, these context documents preserve the durable product rule rather than every example. Source provenance is recorded under `docs/reference/source-documents/README.md`.

## Updating context

Update a context document when an approved product decision changes a cross-cutting rule. Update `docs/brand/` when target brand meaning, acceptance or sequencing changes. Update `docs/design/` when a visual/UI rule is implemented or the current baseline changes. Do not rewrite context, brand or design authority simply to match an implementation accident. Resolve genuine production conflicts explicitly rather than silently changing the product model.