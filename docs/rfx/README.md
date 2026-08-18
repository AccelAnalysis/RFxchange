# RFx Core documentation authority

**Status: CANONICAL RFx CORE AUTHORITY — SLICES 4.1–4.6 IMPLEMENTED; SLICE 4.7 ACTIVE BY DECLARED PACKET.**

This directory contains the converged product, architecture, AMACS, UX, feature-crosswalk and acceptance authority for the live RFx Core sequence. Slice-specific documentation defines bounded implementation authority; documentation alone does not complete or implement a Feature ID.

The governing decision is:

> One structured RFx transaction is presented through role-appropriate issuer, responder, teammate and later evaluator workspaces. AMACS supplies versioned market-need, capability, request-family, response-structure, evaluation-method and readiness semantics. The RFxchange supplies organization authority, geography, lifecycle, workflow, permissions, AI implementation/provenance, projections and participant experience.

The RFx Core workspaces operate within the cross-cutting Exchange interaction architecture: Opportunities/RFx is the primary transaction lens; Resources, Intelligence and Capabilities support the same organization-centered market; Referrals is a governed cross-lens function and Menu/Account utility; spatial context is preserved across valid lens changes; and complex work may move into an Operational Workspace with an explicit return to the originating spatial context.

## Read in this order

1. [`../context/EXCHANGE_INTERACTION_ARCHITECTURE.md`](../context/EXCHANGE_INTERACTION_ARCHITECTURE.md) — RFx-first lens hierarchy, persistent spatial context, marker/selection behavior, Intelligence/Locations boundary and cross-lens continuation rules.
2. [`RFX_CORE_AMACS_CONVERGENCE.md`](RFX_CORE_AMACS_CONVERGENCE.md) — adopted RFx aggregate, structured-field, workspace and scope decisions.
3. [`AMACS_0_5_RECONCILIATION.md`](AMACS_0_5_RECONCILIATION.md) — current AMACS 0.5.0 version/semantic-entry reconciliation that supersedes older 0.1.0 baseline assumptions.
4. [`AMACS_INTEGRATION_CONTRACT.md`](AMACS_INTEGRATION_CONTRACT.md) — pinned 0.5.0 ingestion, runtime projection, need/interpretation, search, migration and snapshot rules.
5. [`RFX_CORE_FEATURE_CROSSWALK.md`](RFX_CORE_FEATURE_CROSSWALK.md) — all 41 Wave 4 Feature IDs accounted for exactly once.
6. [`RFX_CORE_PRODUCT_WORKSPACES.md`](RFX_CORE_PRODUCT_WORKSPACES.md) — issuer, responder and teammate workspace/interaction authority.
7. [`RFX_CORE_ACCEPTANCE_MATRIX.md`](RFX_CORE_ACCEPTANCE_MATRIX.md) — pre-merge acceptance and anti-regression requirements, including AMACS 0.5.0 and AI interpretation boundaries.
8. [`../slices/WAVE_4_RFX_CORE_ROADMAP.md`](../slices/WAVE_4_RFX_CORE_ROADMAP.md) — adopted Wave 4 sequence.
9. [`../slices/SLICE_4_1_EXECUTION_AUTHORITY.md`](../slices/SLICE_4_1_EXECUTION_AUTHORITY.md) — exact organization-owned RFx kernel, request-family snapshot, blank-draft creation, security, persistence, acceptance and non-scope authority for `ISS-001`, `ISS-002` and `ISS-003`.
10. [`../slices/SLICE_4_2_EXECUTION_AUTHORITY.md`](../slices/SLICE_4_2_EXECUTION_AUTHORITY.md) — implemented structured need/package, controlled geography, value, term, requirements and optional interpretation authority for `ISS-005` and `ISS-006`.
11. [`../slices/SLICE_4_3_EXECUTION_AUTHORITY.md`](../slices/SLICE_4_3_EXECUTION_AUTHORITY.md) — implemented AMACS requirements, response-structure and evaluation-definition authority for `ISS-007`, `ISS-009` and `ISS-011`.
12. [`../slices/SLICE_4_4_EXECUTION_AUTHORITY.md`](../slices/SLICE_4_4_EXECUTION_AUTHORITY.md) — implemented readiness, exact preview, atomic publication, permitted projection, sharing and commercial-boundary authority for `ISS-016`, `ISS-018`, `ISS-019`, `ISS-020` and `ACQ-009`.
13. [`../slices/SLICE_4_5_EXECUTION_AUTHORITY.md`](../slices/SLICE_4_5_EXECUTION_AUTHORITY.md) — implemented real opportunity discovery, saved-search, alert/digest, watch and deadline authority for `DSC-004` through `DSC-008`.
14. [`../slices/SLICE_4_6_EXECUTION_AUTHORITY.md`](../slices/SLICE_4_6_EXECUTION_AUTHORITY.md) — implemented deterministic fit, private assessment, typed gaps, and organization-owned Watch/Pursue/Decline authority for `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004`, and `RSP-006`.
15. [`../brand/BRAND_GATE_B6C_RFX_LENS.md`](../brand/BRAND_GATE_B6C_RFX_LENS.md) — separately authorized real-data RFx spatial expression and map boundaries, eligible but not begun.
16. [`../reference/prototypes/RFX_VERSION_2_DESIGN_REFERENCE.md`](../reference/prototypes/RFX_VERSION_2_DESIGN_REFERENCE.md) — approved prototype-derived visual decisions and explicit non-production mechanics.

## Authority order

For RFx implementation:

1. current explicit implementation instruction;
2. security, privacy, organization authority, geography, lifecycle, tracker and dependency authority;
3. the applicable approved Wave 4 slice authority;
4. the cross-cutting Exchange interaction architecture for participant shell, spatial continuity, lens hierarchy and cross-lens behavior;
5. this RFx Core documentation package, with the explicit 0.5.0 reconciliation taking precedence over older AMACS-version assumptions;
6. `docs/brand/` target experience;
7. `docs/design/` converged implementation baseline;
8. existing production abstractions and tests; and
9. prototype references only for decisions explicitly adopted by their companion notes.

## Current Wave 4 boundary

Slices 4.1–4.6 provide the accepted Exchange shell, private issuer definition flow, current readiness, exact preview/publication parity, atomic immutable publication, controlled sharing, real permitted opportunity discovery/management, and bounded private fit/pursuit/gap assessment. Wave 3, AMACS 0.5.0 reconciliation, AI/AMACS Interpretation and ACQ-002/003 continuity remain satisfied prerequisites.

The Slice 4.1 through 4.4 authorities govern the implemented `ISS-001`, `ISS-002`, `ISS-003`, `ISS-005`, `ISS-006`, `ISS-007`, `ISS-009`, `ISS-011`, `ISS-016`, `ISS-018`, `ISS-019`, `ISS-020` and `ACQ-009` runtime. The implementation remains bounded to:

- one organization-owned RFx aggregate;
- `draft` and the one-way `published` lifecycle state;
- expected-version and idempotent command seams;
- append-only RFx event, command-receipt and organization-audit evidence;
- a deterministic AMACS 0.5.0 request-family snapshot; and
- blank-source draft creation in a bounded Operational Workspace entry; and
- one private structured need/package with controlled geography, value, term, typed foundation requirements, module status, save/recovery and optional non-authoritative interpretation.
- one private governed AMACS requirement, response-structure and evaluation-definition layer with a complete manual path; and
- current readiness, exact responder preview, atomic immutable publication, minimized audience-gated projection and controlled sharing.

Slice 4.4 supplies the first legitimate real publication source, Slice 4.5 consumes it for bounded discovery/search, saved searches, alerts, watches and deadlines, and Slice 4.6 adds bounded private fit/pursuit/gap assessment. Slice 4.7 teaming and B6c each require their own active authority; no response, evaluation or award is inferred.

Stabilization 2C remains incomplete and isolated to release engineering: the App Hosting backend and GitHub connection now exist, but trustworthy build-time source-SHA binding and an accepted same-SHA live rollout proof do not. No canonical dependency authority makes 2C a prerequisite for RFx Core product-domain implementation.

Canonical totals are **438 total · 175 Done · 263 Not Started**, with Wave 4 RFx Core **23/41** and B6b intentionally pending.

## Explicit boundaries

This package and the Slice 4.1–4.6 runtime:

- complete only the 23 Feature IDs checked in the canonical tracker through Slice 4.6;
- create private organization-owned RFxs, a minimized published opportunity projection, and only the bounded private Slice 4.6 Watch/Pursue/Decline relation; never create a response, team, submission, evaluation, award, or outcome record;
- add no fake map, organization, opportunity, statistics or market activity;
- do not import prototype HTML/CSS/JavaScript into production;
- do not expose AMACS implementation identifiers as ordinary participant language;
- do not make an AI interpretation record or candidate authoritative;
- do not authorize an Exchange-shell convergence or appearance implementation;
- do not make Stabilization 2C a product dependency;
- do not move Wave 5 evaluator/award capabilities into Wave 4; and
- do not begin B6c or later work without its own reviewed authority; Slice 4.7 work is bounded to its separately declared packet.

**Light Appearance** and **Dark Appearance** are presentation terminology. **Intelligence** is the functional analytical lens. Dark Appearance, appearance preferences and Presentation Mode remain separately unauthorized capabilities.
