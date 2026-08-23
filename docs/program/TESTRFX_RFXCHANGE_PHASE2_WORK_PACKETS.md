# Phase 2 Convergence Work-Packet Decomposition

**Status:** Planning/provenance output. Phase 4 implementation sequencing is governed by `TESTRFX_RFXCHANGE_PHASE4_IMPLEMENTATION_FIRST.md`.
**Exact RFxchange baseline originally used:** `399072c05aa78e536ad57d0998a643f1c6d49b08`

The packet names below prevent a broad “copy TestRFx” change and preserve ownership/provenance. Control Room recalculates implementation against current merged `main`.

> **Phase 4 supersession:** Work-packet activation and wave order are no longer universal prerequisites to implementation. Build everything technically possible now; use progressive availability for unfinished consequential functions. Governance prevents architectural violations, not implementation.

## Dependency stabilization first

| Proposed packet | Owner | Dependency / stop boundary |
| --- | --- | --- |
| `WP-CONVERGENCE-STAGE4-RECONCILE-01` | Control Room | Reconcile PR #234 Capabilities, PR #235 Intelligence and PR #238 RFx Slice 4.7. No donor UI code. **Completed in Phase 3.** |
| `WP-CONVERGENCE-SOURCE-BASELINE-01` | Control Room | Confirm donor commit `db19a0cc2171d0ddde4f34a20acc881ba7279248`; a human-readable tag is provenance convenience, not an implementation gate when the exact commit is recorded. No donor changes. |

## Wave A — Shared visual convergence

| Proposed packet | Owner | Contract IDs | Bounded result |
| --- | --- | --- | --- |
| `WP-CONVERGENCE-SHARED-CARDS-01` | Shared Exchange | CM-004, CM-018 | Media-first hierarchy, reduced collapsed density, fallback and own-organization treatment in existing cards. |
| `WP-CONVERGENCE-SHARED-ICONS-01` | Shared Exchange | CM-001, CM-002 | Semantic SVG icon adapter using RFxchange registry IDs. |
| `WP-CONVERGENCE-SHARED-MENU-01` | Shared Exchange | CM-016, CM-022 | Route-backed, decluttered Account/Menu hierarchy after destination audit. |
| `WP-CONVERGENCE-MAP-PRESENTATION-01` | Shared Exchange / Geography | CM-004, CM-008, CM-025 | Mapbox basemap selector and 2.5D focus treatment; no MapLibre code. |
| `WP-CONVERGENCE-FLOATING-CONTROLS-01` | Shared Exchange | CM-003, CM-024, CM-025 | Floating-control density and thumb-zone refinement only. |

Wave A may not change persistence, authorization, domain lifecycles or immutable action IDs merely to obtain visual parity. Current navigation architecture may be wired to real successor destinations when those destinations already exist.

## Wave B — Mobile RFx Task Canvas

Phase 4 implementation-first authority permits every Task Canvas behavior that can bind truthfully to current RFxchange RFx contracts to proceed now. A missing later server command blocks only that consequential action, not the surrounding workflow.

| Proposed packet | Owner | Contract IDs | Bounded result |
| --- | --- | --- | --- |
| `WP-CONVERGENCE-RFX-CREATE-REUSE-01` | Opportunities/RFx | CM-009, CM-010, CM-018 | What-do-you-need entry, templates, dictation/camera/file, prior-RFx reuse. |
| `WP-CONVERGENCE-RFX-DEFINITION-01` | Opportunities/RFx | CM-009 | Quick/Guided/Formal chapters and structured requirement capture. |
| `WP-CONVERGENCE-RFX-READINESS-PUBLISH-01` | Opportunities/RFx | CM-009, CM-019 | Publication preflight and committed receipt. |
| `WP-CONVERGENCE-RFX-PURSUIT-01` | Opportunities/RFx | CM-011 | Pursue/Watch/Decline and mobile Go/No-Go. |
| `WP-CONVERGENCE-RFX-RESPONSE-WORKSPACE-01` | Opportunities/RFx | CM-010, CM-026 | Firebase response workspace, readiness, exact resume and conflict handling. |
| `WP-CONVERGENCE-RFX-COLLABORATION-01` | Opportunities/RFx | CM-010, CM-019 | Assignments, information requests and completion tracking. |
| `WP-CONVERGENCE-RFX-HOSTED-SUBMIT-01` | Opportunities/RFx | CM-010, CM-018, CM-019 | Hosted preflight, authority, atomic submission and receipt. |
| `WP-CONVERGENCE-RFX-EXTERNAL-SUBMIT-01` | Opportunities/RFx | CM-010, CM-019 | Governed external URL and self-reported submission state. |
| `WP-CONVERGENCE-RFX-LOCAL-CONTINUITY-01` | Opportunities/RFx / Shared | CM-010, CM-026 | Explicit local mode and safe promotion to canonical Firebase workspace. |

No packet may reuse TestRFx PostgreSQL APIs, `rfx_session`, SQL tables or local browser state as production authority.

## Wave C — Resource provider data

These packets may proceed independently of RFx work as soon as they bind to protected Firebase Admin/server authority.

| Proposed packet | Owner | Contract IDs | Bounded result |
| --- | --- | --- | --- |
| `WP-CONVERGENCE-PROVIDER-IMPORT-MODEL-01` | Resources / Admin | CM-012, CM-013, CM-019 | Private staging collections, commands, idempotency, review and audit. |
| `WP-CONVERGENCE-HAMPTON-ROADS-SEED-01` | Resources | CM-005, CM-012, CM-013 | Validate/dry-run/import source-backed provider manifest. |
| `WP-CONVERGENCE-HAMPTON-ROADS-GEOCODE-01` | Resources / Geography | CM-008, CM-014 | Migrate accepted/review/failed Census decisions and promote accepted locations. |
| `WP-CONVERGENCE-UNCLAIMED-PROVIDER-UX-01` | Resources / Identity | CM-007, CM-012 | Unclaimed treatment and claim return flow through canonical authority claims. |

## Wave D — Organization and record media

Metadata/link work that can remain inside existing organization authority may proceed now. Only public delivery of hosted private objects waits for a reviewed public projection.

| Proposed packet | Owner | Contract IDs | Bounded result |
| --- | --- | --- | --- |
| `WP-CONVERGENCE-PUBLIC-MEDIA-PROJECTION-01` | Storage / Organizations | CM-018, CM-019 | Reviewed public media projection; private source object remains protected. |
| `WP-CONVERGENCE-ORGANIZATION-INTRO-MEDIA-01` | Organizations | CM-005, CM-018 | Logo, YouTube/Vimeo normalized link, duration verification, poster and card fallback. |
| `WP-CONVERGENCE-RFX-ATTACHMENTS-01` | Opportunities/RFx / Storage | CM-010, CM-018 | Shared RFx attachment references and hosted-package guard. |

## Wave E — Remaining experience gaps

Compare TestRFx Public, Registration, Geography, Organization Profile, Capability Enrichment, Completion, Public Resources and Commercial UX whenever a genuine gap can be implemented against existing RFxchange authority. Do not wait solely for Waves A–D. Each genuine gap still receives bounded provenance/ownership tracking, and no second onboarding or commercial persistence model is authorized.

## Phase 4 implementation rule

This file remains decomposition and provenance. Under `TESTRFX_RFXCHANGE_PHASE4_IMPLEMENTATION_FIRST.md`, a packet does **not** require a separate activation event before implementation. Current exact `main`, canonical contracts, ownership/conflict awareness, architectural boundaries and relevant acceptance obligations remain mandatory; work-packet status and wave order do not themselves block executable work.
