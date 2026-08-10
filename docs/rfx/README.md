# RFx Core documentation authority

**Status: canonical planning index after merge; no RFx Core implementation is authorized by this documentation alone.**

This directory contains the converged product, architecture, AMACS, UX, feature-crosswalk and acceptance authority for the future live RFx Core.

The governing decision is:

> One structured RFx transaction is presented through role-appropriate issuer, responder, teammate and later evaluator workspaces. AMACS supplies versioned market-need, capability, request-family, response-structure, evaluation-method and readiness semantics. The RFxchange supplies organization authority, geography, lifecycle, workflow, permissions, AI implementation/provenance, projections and participant experience.

The RFx Core workspaces operate within the cross-cutting Exchange interaction architecture: Opportunities/RFx is the primary transaction lens; Resources, Intelligence and Referrals support the same organization-centered market; spatial context is preserved across valid lens changes; and complex work may move into an Operational Workspace with an explicit return to the originating spatial context.

## Read in this order

1. [`../context/EXCHANGE_INTERACTION_ARCHITECTURE.md`](../context/EXCHANGE_INTERACTION_ARCHITECTURE.md) — RFx-first lens hierarchy, persistent spatial context, marker/selection behavior, Intelligence/Locations boundary and cross-lens continuation rules.
2. [`RFX_CORE_AMACS_CONVERGENCE.md`](RFX_CORE_AMACS_CONVERGENCE.md) — adopted RFx aggregate, structured-field, workspace and scope decisions.
3. [`AMACS_0_5_RECONCILIATION.md`](AMACS_0_5_RECONCILIATION.md) — the current AMACS 0.5.0 version/semantic-entry reconciliation that supersedes older 0.1.0 baseline assumptions.
4. [`AMACS_INTEGRATION_CONTRACT.md`](AMACS_INTEGRATION_CONTRACT.md) — pinned 0.5.0 ingestion, runtime projection, need/interpretation, search, migration and snapshot rules.
5. [`RFX_CORE_FEATURE_CROSSWALK.md`](RFX_CORE_FEATURE_CROSSWALK.md) — all 41 Wave 4 Feature IDs accounted for exactly once.
6. [`RFX_CORE_PRODUCT_WORKSPACES.md`](RFX_CORE_PRODUCT_WORKSPACES.md) — issuer, responder and teammate workspace/interaction authority.
7. [`RFX_CORE_ACCEPTANCE_MATRIX.md`](RFX_CORE_ACCEPTANCE_MATRIX.md) — pre-merge acceptance and anti-regression requirements, including AMACS 0.5.0 and AI interpretation boundaries.
8. [`../slices/WAVE_4_RFX_CORE_ROADMAP.md`](../slices/WAVE_4_RFX_CORE_ROADMAP.md) — adopted planning sequence; implementation remains not started.
9. [`../brand/BRAND_GATE_B6C_RFX_LENS.md`](../brand/BRAND_GATE_B6C_RFX_LENS.md) — real-data RFx spatial expression and map boundaries.
10. [`../reference/prototypes/RFX_VERSION_2_DESIGN_REFERENCE.md`](../reference/prototypes/RFX_VERSION_2_DESIGN_REFERENCE.md) — approved prototype-derived visual decisions and explicit non-production mechanics.

## Authority order

For future RFx implementation:

1. current authorized slice/task;
2. security, privacy, organization authority, geography, lifecycle, tracker and dependency authority;
3. the applicable Wave 4 slice brief;
4. the cross-cutting Exchange interaction architecture for participant shell, spatial continuity, lens hierarchy and cross-lens behavior;
5. this RFx Core documentation package, with the explicit 0.5.0 reconciliation taking precedence over older AMACS version assumptions;
6. `docs/brand/` target experience;
7. `docs/design/` converged implementation baseline;
8. existing production abstractions and tests;
9. prototype references only for the decisions explicitly adopted by their companion notes.

## Explicit boundaries

This package:

- changes no Feature-ID status or tracker total;
- creates no live RFx, opportunity, pursuit, response, team, submission, evaluation, award or outcome record;
- adds no fake map, organization, opportunity, statistics or market activity;
- does not import prototype HTML/CSS/JavaScript into production;
- does not expose AMACS implementation identifiers as ordinary participant language;
- does not make an AI interpretation record or candidate authoritative;
- does not authorize an Exchange-shell convergence or appearance implementation;
- does not authorize Wave 4 before the current stabilization/sequence and explicit implementation authorization are complete; and
- does not move Wave 5 evaluator/award capabilities into Wave 4.
