# Wave 3 — Network Roadmap

**Status: SLICE 3.1 COMPLETE; BRAND GATES B0–B6a COMPLETE; SLICE 3.2 ACTIVE; AI/AMACS INTERPRETATION FOUNDATION PLANNED IMMEDIATELY AFTER 3.2**

Wave 2 is complete, Brand Gates B0 through B6a are merged, Wave 3 Slice 3.1 is complete, and Slice 3.2 is the active authorized implementation slice.

Current feature state remains:

- **438 total · 121 Done · 317 Not Started**
- Activation: **43/43**
- Network: **7/38**

Brand Gates and the AI/AMACS Interpretation Foundation are no-Feature-ID cross-cutting work. Their completion does not by itself mark any Network feature Done.

## Completed entry foundations

### Inherited Wave 1 Network foundations

- `ORG-021` — invite additional organizational users
- `ORG-022` — standard user role presets
- `ADM-055` — organization role bundle catalog
- `ADM-056` — admin management of organization memberships and permission bundles

### Slice 3.1 — Transactional Communications Reliability — COMPLETE

PR #107 completed:

- `COMMS-003` — versioned transactional event/template architecture;
- `COMMS-004` — minimized delivery aggregate, append-only audit evidence, and operations visibility;
- `COMMS-005` — deterministic retry, replay suppression, interrupted-success healing, and terminal-failure handling.

Implementation merge:

`368fdb5e0179ca7933eb33ffb6cbf12a2afe2bf1`

Production CI run `30719532985` passed on the final implementation head.

### Brand convergence through B6a — COMPLETE

- B0 — authority reconciliation: PR #100
- B1 — semantic design foundation: PR #109
- B2 — shared component primitives: PR #111
- B3 — cartographic convergence: PR #112
- B4 — public marketing/acquisition: PR #113
- B5 — activation experience: PR #114
- B6a — existing workspace foundation: PR #115

The final B6a implementation merged at:

`bf59f1d18fa6db3f43660c42777b494b505be545`

See:

- `docs/brand/BRAND_GATES_B2_B6A_RECONCILIATION.md`;
- `docs/tracking/RFxchange_BRAND_GATE_TRACKER.md`.

## Current execution result

The Network dependency graph made the Slice 3.2 Feature IDs eligible after Slice 3.1, and the required non-Feature sequencing boundaries B2, B3 and B6a are complete. PR #119 explicitly authorized Slice 3.2 as the active implementation slice while preserving tracker totals and dependency authority.

**Slice 3.2 is active.** Its Feature IDs remain Not Done until their own repository/configured-browser acceptance and evidence requirements pass.

The newly adopted AI/AMACS Interpretation Foundation is the next no-Feature-ID gate after Slice 3.2. It must not begin production implementation until Slice 3.2 merges and dependencies are recalculated from merged `main`.

## Wave 3 slices and cross-cutting gate

| Slice / gate | Features | Status / purpose |
| --- | --- | --- |
| **3.1 — Transactional Communications Reliability** | `COMMS-003`, `COMMS-004`, `COMMS-005` | **Complete via PR #107.** Versioned templates/events, delivery audit, retry, idempotency, and terminal-failure visibility. |
| **3.2 — Controlled Network Entry & Discovery** | `GEO-012`, `DSC-001`, `DSC-002`, `DSC-003` | **Active authorized implementation slice.** Add the first live Network workspace with permitted organization discovery, capability search, geographic/service-area filters, and synchronized map/list/detail behavior. |
| **AI/AMACS Interpretation Foundation** | **No Feature IDs** | **Planned immediately after 3.2 and before 3.3.** Establish provider-neutral AI gateway, AMACS retrieval/validation, strict interpretation contracts, human confirmation/provenance, privacy, metering, manual fallback and evaluation. First product consumer is Slice 3.3; Wave 4 reuses the same foundation for buyer/issuer need interpretation. |
| **3.3 — Market Profile Enrichment** | `ORG-013`, `ORG-014`, `ORG-016`, `ORG-017` | Add structured AMACS-backed capabilities, products/services, industry/NAICS context, past performance, and teaming/referral/resource preferences. Ordinary-language capability declaration may receive AI-assisted AMACS suggestions, but confirmed organization assertions remain distinct from AI suggestions, evidence and verification. |
| **3.4 — Credential, Media & Location Enrichment** | `ORG-015`, `ORG-018`, `ORG-019` | Add credentials with provenance, media/documents/portfolio, and additional locations using private-by-default storage and subordinate-location visual treatment. |
| **3.5 — Referral Network & Referral Acquisition** | `REF-001`, `REF-002`, `REF-003`, `REF-004`, `REF-005`, `EDU-014`, `ACQ-006` | Establish legitimate referrals with context, consent, lifecycle, first-use education, and external acquisition continuity. First legitimate source for live referral paths. |
| **3.6 — Official Resource Provider Foundation** | `RES-001`, `RES-002`, `RES-003`, `ADM-070` | Establish application, controlled review/approval, Official Resource Provider status, and structured service profile while keeping approval separate from credibility and payment. |
| **3.7 — Resource Discovery, Routing & Provider Distribution** | `RES-004`, `RES-005`, `DSC-011`, `REF-006`, `RES-007`, `RES-008`, `ACQ-008` | Add service-territory discovery, contextual routing, consented provider connection, scoped communications, resource publishing, and provider acquisition. First legitimate source for live service fields. |
| **3.8 — Persistent Network Education** | `EDU-016`, `EDU-017` | Add reusable Quick Start/role paths and contextual explainers over live Network behavior. |

## Operating sequence

Use one active slice or gate unless a later task explicitly authorizes another arrangement.

```text
Wave 2 complete
→ B0–B6a complete
→ Slice 3.1 complete
→ Slice 3.2 active implementation and merge
→ recalculate from merged main
→ AI/AMACS Interpretation Foundation implementation and merge
→ recalculate
→ Slice 3.3 merge
→ recalculate
→ Slice 3.4 merge
→ recalculate
→ Slice 3.5 merge
→ recalculate
→ Slice 3.6 merge
→ recalculate
→ Slice 3.7 merge
→ B6b Network-lens convergence when authorized
→ Slice 3.8 merge
→ verify Wave 3 exit
```

Preparation/read-only inspection may occur ahead of the active slice. Documentation-only planning may define the next gate. Production implementation of the AI/AMACS foundation or any later slice must not begin merely because adjacent abstractions make it convenient.

## Critical path

```text
Wave 2 OPEN + real marker
→ reliable communications [complete]
→ semantic/component/cartographic/public/activation/workspace convergence [complete]
→ controlled Network map/search [active]
→ governed human-language ↔ AMACS interpretation foundation
→ richer AMACS-backed market profiles
→ referrals
→ Official Resource Provider foundation
→ contextual resource discovery/routing
→ persistent education
```

Parallel domain branches:

```text
ORG-012 → AI/AMACS foundation → ORG-013/014/016/017 → ORG-015/018/019
GEO-011 → GEO-012 → DSC-003
REF-001 + REF-005 → referral lifecycle → ACQ-006
RES-001 → RES-002 → RES-003 → RES-004/005/008
RES-003 + REF-005 → REF-006 → RES-007
RES-003 → DSC-011
RES-002 + COMMS-003 + ACQ-003 → ACQ-008
```

The AI/AMACS foundation is a sequencing prerequisite for Slice 3.3 product-facing capability interpretation, not a replacement dependency edge for the individual Feature IDs in the canonical dependency map. Any dependency-map mutation still requires its own reviewed reconciliation.

## AI/AMACS interpretation authority

The governing planning brief is:

- `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md`.

Core rules:

- AI interprets participant language; AMACS supplies governed concepts/relationships; participants confirm; RFxchange stores authoritative records.
- The provider/model is replaceable infrastructure behind a server-side RFxchange gateway.
- Model output is a proposal, never a capability assertion, RFx requirement, evidence claim, verification, qualification or outcome by itself.
- Every AMACS identifier returned by the AI path must validate against the pinned/validated runtime projection.
- Manual AMACS browse/search remains available when AI is disabled, unavailable, rate-limited or exhausted.
- Deterministic matching/search of already-structured records does not require an LLM.
- Usage/cost, prompt/model/AMACS-release provenance, privacy/minimization and evaluation/regression controls are foundation requirements.

## Brand authority for Wave 3

Every participant-facing Wave 3 slice must read:

- `docs/brand/README.md`;
- `docs/brand/BRAND_GATES_B2_B6A_RECONCILIATION.md`;
- `docs/brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md`;
- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`;
- `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md` for spatial objects;
- the applicable completed Brand Gate document;
- the applicable current `docs/design/` baseline.

Rules:

- cross-cutting brand standards never widen Feature-ID scope;
- organization nodes require authorized organization projections;
- opportunity beacons remain absent until authoritative Wave 4 RFx publication;
- referral paths require real Slice 3.5 referral state;
- service fields require real Slice 3.7 provider-territory state;
- credibility seals and outcome paths remain later-domain expressions;
- Growth Green cannot imply an outcome merely because a connection, referral, publication, pursuit, invitation, submission or AI suggestion exists;
- invented organizations, opportunities, statistics, provider availability, testimonials and network activity are prohibited.

## Reviewed dependency clarifications

The dependency map remains the scheduling authority.

- `RES-001`: Profile Complete (`ORG-012`), not optional additional locations, is the provider-application prerequisite.
- `DSC-011`: contextual resource discovery requires the structured provider service profile (`RES-003`).
- `REF-006`: provider connection requires the referral consent/minimum-necessary boundary (`REF-005`) plus `RES-003`.
- `ACQ-006`: external referral acquisition requires `ACQ-003`, a real `REF-001`, and `COMMS-003`.
- `ACQ-008`: provider-driven acquisition requires `ACQ-003`, approved `RES-002`, and `COMMS-003`.
- Official Resource Provider approval is separate from Organization Verified, Verified Resource Provider credibility, and commercial status.

## Slice 3.2 handoff

Slice 3.2 may consume:

- B1 semantic tokens;
- B2 shared primitives and authority-gated organization-node interfaces;
- B3 Exchange Light cartography and marker/camera authority;
- B6a organization home, deterministic UI-only workspace state, provenance, and recovery boundaries;
- Slice 3.1 transactional communications where later discovery actions require messages.

Slice 3.2 must not reinterpret B4 marketing copy or B5 activation visuals as Network feature completion and must not absorb the future AI/AMACS foundation or Slice 3.3 enrichment merely because capability search exists.

## AI/AMACS foundation handoff

After Slice 3.2 merges and dependencies are recalculated, the foundation may establish only the cross-cutting interpretation infrastructure and contracts defined in its brief. It must not mark `ORG-013` or other profile/RFx features complete.

After the foundation merges and dependencies are recalculated, Slice 3.3 may consume its gateway, retrieval, structured-output, provenance, metering, privacy, manual-fallback and evaluation contracts for organization capability declaration.

## Wave 3 exit condition

An OPEN organization can enter its controlled Network geography, discover permitted organizations by capability/geography, enrich its market profile with governed AMACS-backed capability declarations, send/receive legitimate referrals, and find/connect with approved resource providers. Approved providers can maintain service profiles, territories, and published resources; Network communications are reliable; and participants have persistent/contextual education.

Wave 3 does not require the Wave 4 RFx engine, Wave 5 credibility system, Wave 6 paid entitlements, B7 Intelligence Dark, B8 Sonic/Sensory, B9 Presentation Mode, or Wave 7 institutional scale features. The cross-cutting AI/AMACS foundation may exist in Wave 3 because its first authorized consumer is capability enrichment; buyer/issuer RFx interpretation remains Wave 4 product scope.

## Completion discipline

- Brand Gate or AI/AMACS foundation completion does not change Feature-ID completion by itself.
- Mark a Network feature Done only after its own acceptance and CI evidence passes.
- Recalculate from merged `main` after every product slice or cross-cutting implementation gate.
- Slice 3.2 remains the only active implementation slice until it is merged and the next authority is explicitly recalculated/authorized.
