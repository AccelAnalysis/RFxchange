# RFxchange Product Context Index

This directory contains normalized implementation context for Codex and human contributors. These documents distill approved product decisions into stable, implementation-oriented rules.

They are **not a replacement for the canonical tracker or dependency map**. They explain what the product is supposed to mean across slices so implementation does not reconstruct product intent from Feature IDs alone.

## Read first

- [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md) — cross-cutting product invariants and boundaries.
- [`EXCHANGE_INTERACTION_ARCHITECTURE.md`](EXCHANGE_INTERACTION_ARCHITECTURE.md) — RFx-first lens hierarchy, participant truthfulness, persistent spatial context, marker/selection behavior, Intelligence/Locations boundary, provider gating and cross-lens workflow rules.
- [`../program/MOBILE_EXCHANGE_STAGES_3_6_AUTHORITY.md`](../program/MOBILE_EXCHANGE_STAGES_3_6_AUTHORITY.md) — current product-owner authority for the final Capabilities lens, cross-lens Referrals, shared migration, Stages 3–6 and release acceptance.
- [`../program/FOUR_LENS_PROGRAM_AUTHORITY.md`](../program/FOUR_LENS_PROGRAM_AUTHORITY.md) — parallel lane delivery, immutable experience requirements and independent acceptance governance.
- [`../slices/EXCHANGE_SHELL_TRUTHFULNESS_EXECUTION_AUTHORITY.md`](../slices/EXCHANGE_SHELL_TRUTHFULNESS_EXECUTION_AUTHORITY.md) — bounded no-Feature-ID authority for the persistent participant shell, exact lens registry, separate Account utilities, scoped loading and transition-performance acceptance.
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

[`EXCHANGE_INTERACTION_ARCHITECTURE.md`](EXCHANGE_INTERACTION_ARCHITECTURE.md), originally merged through PR #150 and reconciled by the bounded Exchange-shell gate, establishes the cross-cutting participant interaction authority:

- the permanent authenticated lens order is exactly `Opportunities/RFx | Resources | Intelligence | Capabilities`;
- Opportunities/RFx remains the primary transaction lens and principal public positioning;
- Resources, Intelligence and Capabilities are supporting lenses over the same market rather than separate applications;
- Referrals is a governed cross-lens function and Menu/Account utility, not a permanent lens;
- stable architecture remains visible when a permanent lens is unavailable; availability governs action rather than whether the lens exists;
- Opportunities/RFx was present but explicitly unavailable until the accepted real Slice 4.5 participant discovery runtime supplied `/opportunities`; its current availability is bounded to implemented and server-authorized RFx behavior;
- location and site functionality remains first-class inside Intelligence rather than becoming a peer commercial-real-estate product identity;
- Network remains the current organization-network view/domain concept inside Intelligence, not a peer lens;
- Account and Quick Start are separate utilities, not market lenses;
- ordinary authenticated lens changes preserve the current Exchange shell rather than presenting route waits as a new application launch;
- lens switching preserves authorized map/search/selection context where meaningful;
- the participant's own organization uses the standing logo marker, while a selected external organization transitions from a compact node to the standing selected marker;
- Official Resource Provider actions remain gated by the existing application/review/approval authority;
- cross-lens referral actions and Menu management remain bounded by the current referral aggregate;
- complex RFx authoring may use an Operational Workspace while retaining a safe return seam to the Spatial Workspace; and
- no interface fabricates RFxs, opportunities, matches, providers, referrals, sites, intelligence, outcomes or market activity.

Participant-facing truthfulness has four required dimensions:

1. **Structural truthfulness** — represent the governed permanent architecture rather than a disposable temporary taxonomy.
2. **Capability truthfulness** — visible does not mean available; an unavailable permanent lens is non-actionable and fully described.
3. **State truthfulness** — unavailable, loading, empty, error, restricted and recovery states describe the relevant surface accurately.
4. **Continuity truthfulness** — ordinary movement remains visibly inside one authenticated Exchange.

> The stable lens architecture remains visible even when a lens is unavailable. Availability governs action, not whether a governed permanent lens exists in the information architecture.

> Loading truthfulness requires the current Exchange shell to remain visible during ordinary lens changes. A route-level wait must not be presented as though RFxchange is being launched again.

The vocabulary is binding:

- **Lens** — functional market context;
- **Layer** — map/analytical projection within a lens;
- **Appearance** — visual presentation only;
- **Workspace** — interaction composition for a task.

**Intelligence** is the functional analytical lens. **Light Appearance** and **Dark Appearance** are presentation terminology. Dark Appearance is not implemented or authorized by the interaction architecture.

PR #150 remains the documentation origin for the complete interaction target. The separately authorized no-Feature-ID shell and post-PR-#159 gates implemented the participant lens/persistent-shell/loading/spatial convergence without completing an RFx Feature ID. Slices 4.1–4.5 later supplied the separately authorized real RFx kernel, builder, definition, publication and participant discovery runtimes.

Administrative navigation remains governed separately: it exposes only implemented, server-authorized destinations. The participant unavailable-lens rule must not be generalized to future administrative sections.

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

The specific authorities for the implemented Wave 4 slices are [`../slices/SLICE_4_1_EXECUTION_AUTHORITY.md`](../slices/SLICE_4_1_EXECUTION_AUTHORITY.md) through [`../slices/SLICE_4_6_EXECUTION_AUTHORITY.md`](../slices/SLICE_4_6_EXECUTION_AUTHORITY.md). They cover 23 RFx Core Feature IDs: the organization-owned RFx kernel, private structured package/definition, readiness, exact preview, atomic publication, controlled sharing, real permitted opportunity discovery/watch/deadline behavior, and bounded private fit/pursuit/gap assessment. Optional independent assurance remains separate from completion.

## Current sequencing status

Wave 2 is complete. Wave 3 Slices 3.1 through 3.8 and Brand Gates B0–B6a are merged, and the configured-browser/zero-residual Wave 3 exit accepted Network at 38/38. B6b remains intentionally pending.

Current volatile lane, work-packet and candidate state belongs in `../program/PARALLEL_DELIVERY_MATRIX.md` and `../../governance/four-lens-workstreams.json`. Do not copy it into this durable context index.

The dependency result remains:

- Wave 3 handoff: satisfied;
- AMACS 0.5.0 reconciliation: satisfied;
- AI/AMACS foundation: satisfied; Slice 4.4 readiness/preview/publication does not require or authorize an AI call;
- organization authority/tenancy/audit/concurrency foundations: satisfied by prior cross-cutting implementation;
- Exchange Interaction Architecture: satisfied by PR #150 and the merged shell/post-PR-#159 convergence gates;
- Slices 4.1–4.6 RFx kernel/package/definition/publication/discovery/fit-pursuit: implemented for the canonical 23/41 RFx Core Feature IDs; optional Four-Lens assurance remains separate;
- ACQ-002/003 public projection and acquisition continuity: satisfied and reused by the canonical live Slice 4.4 RFx publication adapter;
- Stabilization 2C: isolated release engineering, not a product prerequisite; and
- the reviewed `ISS-009` dependency on stable Slice 4.2 and Slice 4.3 requirements is adopted; no other dependency correction is introduced.

At Four-Lens adoption, canonical totals were **438 total · 170 Done · 268 Not Started**, with Wave 4 RFx Core **18/41**. Treat that as a historical snapshot and read the tracker for current arithmetic. B6c opportunity expression remains eligible but Not Started. Slice 4.6 later merged and was reconciled as Implemented — Not Verified; Slice 4.7 proceeds only through its separately declared exact-base packet.

## Stabilization 2C boundary

The App Hosting backend `rfxchange`, project/repository connection, region `us-east4`, live branch `main`, root `/`, retained Web App and reserved App Hosting URL now exist. The remaining 2C blocker is trustworthy build-time source-SHA binding and accepted same-SHA live-deployment evidence. The managed source build has not exposed a documented immutable source SHA that can be bound to `RFXCHANGE_BUILD_SHA`.

Stabilization 2C remains incomplete and is handled separately. It does not block RFx Core domain development, and no RFx slice or shell gate may weaken build identity or change rollout architecture under product authority.

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
