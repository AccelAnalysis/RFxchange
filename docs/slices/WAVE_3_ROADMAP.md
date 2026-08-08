# Wave 3 — Network Roadmap

**Status: SLICE 3.1 COMPLETE; BRAND GATES B0–B6a COMPLETE; SLICE 3.2 ACTIVE; AMACS 0.5.0 RELEASED; 0.5.0 RECONCILIATION AND AI/AMACS FOUNDATION ARE THE NEXT TWO CROSS-CUTTING GATES BEFORE SLICE 3.3.**

Wave 2 is complete, Brand Gates B0 through B6a are merged, Wave 3 Slice 3.1 is complete, and Slice 3.2 remains the only active authorized implementation slice.

Current Feature-ID state remains:

- **438 total · 121 Done · 317 Not Started**
- Activation: **43/43**
- Network: **7/38**

AMACS 0.5.0, Brand Gates, the RFxchange AMACS reconciliation and the AI/AMACS Interpretation Foundation are no-Feature-ID cross-cutting work. They do not mark any Network feature Done.

## Completed foundations

### Inherited organization/network foundations

- `ORG-021` — invite additional organizational users
- `ORG-022` — standard user role presets
- `ADM-055` — organization role bundle catalog
- `ADM-056` — admin management of organization memberships and permission bundles

### Slice 3.1 — Transactional Communications Reliability — COMPLETE

PR #107 completed `COMMS-003`, `COMMS-004` and `COMMS-005` at merge `368fdb5e0179ca7933eb33ffb6cbf12a2afe2bf1`.

### Brand convergence through B6a — COMPLETE

B0 through B6a are merged. The final B6a implementation merged at `bf59f1d18fa6db3f43660c42777b494b505be545`.

### AMACS 0.5.0 — RELEASED IN THE INDEPENDENT STANDARD REPOSITORY

AMACS 0.5.0 merged in `AccelAnalysis/amacs` at `da7879f2609271b067ae6d02875e9388a02c4fe5`.

It preserves the 16-domain / 120-family / 615-capability / 185-alias catalog while adding provider-neutral contracts for:

- structured market needs;
- bounded interpretation records;
- non-authoritative interpretation candidates; and
- concept-interpretation guidance.

The standard release does not itself implement AI in RFxchange and changes no RFxchange Feature-ID status.

## Current execution authority

**Slice 3.2 — Controlled Network Entry & Discovery remains active.** PR #120 has passed production CI but still requires the configured-browser acceptance and completion evidence defined by the Slice 3.2 brief. No later implementation may begin until it merges and authority is recalculated from merged `main`.

After Slice 3.2, execute two cross-cutting gates in order:

1. **RFxchange reconciliation to AMACS 0.5.0** — ingest/verify the immutable release, preserve historical 0.1.0 records, generate/validate 0.5.0 catalog and runtime contracts, and expose release-aware application ports.
2. **AI/AMACS Interpretation Foundation** — implement the server-side provider-neutral gateway, 0.5.0-grounded retrieval/validation, non-authoritative interpretation persistence, participant confirmation, provenance, privacy, cost controls, manual fallback and evaluation.

Only after both gates merge and dependencies are recalculated may Slice 3.3 be explicitly authorized.

## Wave 3 slices and gates

| Slice / gate | Features | Status / purpose |
| --- | --- | --- |
| **3.1 — Transactional Communications Reliability** | `COMMS-003`, `COMMS-004`, `COMMS-005` | **Complete via PR #107.** |
| **3.2 — Controlled Network Entry & Discovery** | `GEO-012`, `DSC-001`, `DSC-002`, `DSC-003` | **Active.** Controlled Network entry; permitted organization discovery; capability/geography/service-area search; synchronized map/list/detail. |
| **AMACS 0.5.0 reconciliation** | **No Feature IDs** | **Next after 3.2.** Pin, ingest, validate and migrate RFxchange from its stale 0.1.0 integration baseline to immutable 0.5.0 without silently changing historical records or creating profile claims. |
| **AI/AMACS Interpretation Foundation** | **No Feature IDs** | **After 0.5.0 reconciliation.** Provider-neutral server gateway; release-aware retrieval; AMACS schema/catalog validation; non-authoritative candidates; confirmation/provenance; privacy; metering; manual fallback; evaluation. |
| **3.3 — Market Profile Enrichment** | `ORG-013`, `ORG-014`, `ORG-016`, `ORG-017` | Structured AMACS-backed capability assertions, products/services, industry/NAICS context, past performance and teaming/referral/resource preferences. Ordinary-language assistance uses 0.5.0 InterpretationRecord/Candidate contracts; confirmed assertions remain separate from suggestions, evidence and verification. |
| **3.4 — Credential, Media & Location Enrichment** | `ORG-015`, `ORG-018`, `ORG-019` | Credentials with provenance; private-by-default media/documents/portfolio; subordinate additional locations with geography/privacy authority. |
| **3.5 — Referral Network & Referral Acquisition** | `REF-001`, `REF-002`, `REF-003`, `REF-004`, `REF-005`, `EDU-014`, `ACQ-006` | Legitimate organization-owned referrals with structured context, consent/minimum necessary data, lifecycle, first-use education and external acquisition continuity. |
| **3.6 — Official Resource Provider Foundation** | `RES-001`, `RES-002`, `RES-003`, `ADM-070` | Controlled provider application/review/approval and structured service profile. |
| **3.7 — Resource Discovery, Routing & Provider Distribution** | `RES-004`, `RES-005`, `DSC-011`, `REF-006`, `RES-007`, `RES-008`, `ACQ-008` | Service-territory discovery, contextual routing, consented connection, resources and provider acquisition. |
| **3.8 — Persistent Network Education** | `EDU-016`, `EDU-017` | Reusable Quick Start/role paths and contextual explainers over live behavior. |

## Operating sequence

Use one active slice or gate at a time unless an explicit later task changes that authority.

```text
Slice 3.2 configured-browser acceptance
→ Slice 3.2 evidence/tracker update and PR #120 merge
→ production CI and authority recalculation from merged main
→ AMACS 0.5.0 reconciliation implementation and merge
→ recalculate
→ AI/AMACS Interpretation Foundation implementation and merge
→ recalculate and explicitly authorize Slice 3.3
→ Slice 3.3 implementation, acceptance and merge
→ recalculate and explicitly authorize Slice 3.4
→ Slice 3.4 implementation, acceptance and merge
→ recalculate and explicitly authorize Slice 3.5
→ Slice 3.5 implementation, acceptance and merge
→ recalculate before Slice 3.6
```

Preparation/read-only inspection may occur ahead of the active slice. Production code for a later gate/slice cannot begin merely because an adjacent abstraction makes it convenient.

## Critical path

```text
real OPEN organization and real map marker
→ reliable communications [complete]
→ brand/workspace convergence [complete]
→ controlled Network discovery [active]
→ immutable AMACS 0.5.0 integration
→ governed human-language ↔ AMACS interpretation
→ confirmed AMACS-backed market profiles
→ credential/media/location enrichment
→ consented referral lifecycle and referral acquisition
→ provider foundation and routing
```

## AMACS and AI authority

Governing documents:

- `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`;
- `docs/rfx/AMACS_0_5_RECONCILIATION.md`;
- `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md`.

Core rules:

- participants may begin in ordinary language or manually browse/search AMACS;
- AMACS 0.5.0 supplies the standard contracts; RFxchange supplies the implementation;
- interpretation records/candidates have no authoritative effect;
- accepted candidates require a separate server-authorized domain write;
- the AI/model may not invent AMACS identifiers or silently create claims/requirements;
- every ID and controlled relationship validates against the pinned release;
- rejected/unresolved candidates cannot affect matching;
- manual operation remains available when assistance is declined/unavailable/disabled/exhausted;
- already-structured matching remains deterministic and LLM-independent;
- commercial status cannot alter semantic truth, matching, verification or credibility.

The two cross-cutting gates are sequencing prerequisites, not replacement dependency edges for individual Feature IDs. Any canonical dependency-map mutation requires a separate reviewed reconciliation.

## Slice handoffs

### Slice 3.2

Must remain within `GEO-012` and `DSC-001`–`003`; it cannot absorb AMACS 0.5.0 ingestion, AI interpretation or profile enrichment.

### AMACS 0.5.0 reconciliation

May implement only release ingestion, generated contracts/projections, history/migration safeguards and application ports. It cannot mark `ORG-013` or other product features complete.

### AI/AMACS foundation

May implement only the cross-cutting gateway, retrieval, validation, interpretation/provenance persistence, cost/privacy controls, manual fallback and evaluation. It cannot create final Slice 3.3 product completion claims.

### Slice 3.3

Consumes the verified 0.5.0 catalog and foundation to create organization-owned, participant-confirmed capability assertions. It cannot infer verification.

### Slice 3.4

Consumes merged profile assertions and preserves credential/evidence, media, storage and location privacy boundaries.

### Slice 3.5

Consumes real organizations/profiles and reliable communications. It creates the first legitimate live referral path and must preserve consent/minimum necessary sharing and the distinction between connection and outcome.

## Brand, evidence and credibility rules

- Use completed brand/design authorities without widening domain scope.
- Organization nodes require authorized real projections.
- Opportunity beacons remain absent until Wave 4 publication.
- Referral paths require real Slice 3.5 records/events.
- Service fields require real Slice 3.7 provider territory.
- Credibility seals require later authoritative credibility events.
- AI suggestion, profile claim, referral sent/accepted, publication, pursuit or submission is not a verified outcome.
- Growth Green cannot imply an outcome without authoritative outcome state.
- Invented organizations, opportunities, providers, statistics, testimonials, evidence and market activity are prohibited.
- Paid/Founding/sponsored status cannot alter capability truth or neutral discovery.

## Wave 3 exit condition

An OPEN organization can enter its controlled Network geography, discover permitted organizations by capability/geography, enrich the same organization identity with participant-confirmed AMACS-backed market information, manage credentials/media/additional locations, and send/receive legitimate referrals. The system preserves evidence, privacy, authority and truthful state boundaries. Resource-provider work continues through later Wave 3 slices.

## Completion discipline

- Mark a Feature ID Done only after its own acceptance and evidence pass.
- Cross-cutting gate completion does not change tracker totals.
- Recalculate from merged `main` after every slice/gate.
- Update execution authority before beginning the next production phase.
- Slice 3.2 remains the sole active implementation slice until PR #120 is accepted and merged.
