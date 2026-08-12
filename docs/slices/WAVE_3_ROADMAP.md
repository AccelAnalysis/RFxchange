# Wave 3 — Network Roadmap

**Status: WAVE 3 NETWORK COMPLETE AND CLOSEOUT ACCEPTED — 38/38; BRAND GATES B0–B6a COMPLETE; B6b INTENTIONALLY PENDING.**

Wave 2 is complete, Brand Gates B0 through B6a and Wave 3 Slices 3.1 through 3.8 are merged, and the optional B6b checkpoint remains intentionally pending. Slice 3.8 final-head and post-merge production CI passed before the separate configured-browser and zero-residual closeout in `docs/architecture/WAVE_3_CLOSEOUT.md` accepted the Wave 3 exit.

Current Feature-ID state after the later Wave 4 Slice 4.2 implementation is:

- **438 total · 160 Done · 278 Not Started**
- Activation: **43/43**
- Network: **38/38**
- RFx Core: **8/41**

AMACS 0.5.0, Brand Gates, the RFxchange AMACS reconciliation and the AI/AMACS Interpretation Foundation are no-Feature-ID cross-cutting work. They do not mark any Network feature Done.

## Completed foundations

### Inherited organization and network foundations

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

It preserves the 16-domain, 120-family, 615-capability and 185-alias catalog while adding provider-neutral contracts for:

- structured market needs;
- bounded interpretation records;
- non-authoritative interpretation candidates; and
- concept-interpretation guidance.

The standard release does not itself implement AI in RFxchange and changes no RFxchange Feature-ID status.

## Current execution authority

**Slice 3.2 — Controlled Network Entry & Discovery is complete via PR #120.** Configured-browser acceptance, cleanup, focused validation, the full local repository gate and synchronized-head production CI passed. No later Feature-ID slice began.

After Slice 3.2, execute two cross-cutting gates in order:

1. **RFxchange reconciliation to AMACS 0.5.0 — complete via PR #123** — consumed and verified the immutable release, preserved historical 0.1.0 records, generated 0.5.0 catalog and runtime contracts, and exposed release-aware application ports without implementing participant features.
2. **AI/AMACS Interpretation Foundation — complete via PR #124** — implemented the server-side provider-neutral gateway, concrete OpenAI adapter, 0.5.0-grounded retrieval and validation, non-authoritative interpretation persistence, disposition or authoritative-command separation, provenance, privacy, cost controls, manual-service fallback and evaluation without completing Slice 3.3 or Wave 4 product flows.

Both gates are merged, post-merge production CI passed, and Slice 3.3 was explicitly authorized by `docs/slices/SLICE_3_3_EXECUTION_AUTHORITY.md`. Slice 3.3 then passed exact-head production CI run `31289352499`, merged via PR #126 at `0f5e8d56af8484bbd6e72716d4149a21e92db029`, and passed post-merge `main` CI run `31289477113`. Slice 3.4 passed exact-head production CI run `31291992746`, merged via PR #128 at `7f57cabf029edb0a0045b53d9f3339f170dc530c`, and passed post-merge `main` CI run `31292086252`. Slice 3.5 passed exact-head production CI run `31294774153`, merged via PR #130 at `516c49627aeff637b02982218f0682c1eea436ad`, and passed post-merge `main` CI run `31294884142`. Slice 3.6 passed exact-head production CI run `31297388363`, merged via PR #132 at `26412435651a13cc7a6540bbe50bc7b646760d78`, and passed post-merge `main` CI run `31297486059`. Slice 3.7 passed exact-head production CI run `31300282317`, merged via PR #137 at `25baba600d6e1913a8941570f7348454d2e6941d`, and passed post-merge `main` CI run `31300395073`. The conditional B6b checkpoint left that optional gate pending. Slice 3.8 final-head production CI run `31303588724` passed, PR #139 merged at `2727b6111d1582225e8ece409d015b8696a8cce7`, and post-merge run `31303727886` passed before the separate closeout.

## Wave 3 slices and gates

| Slice or gate | Features | Status or purpose |
| --- | --- | --- |
| **3.1 — Transactional Communications Reliability** | `COMMS-003`, `COMMS-004`, `COMMS-005` | **Complete via PR #107.** |
| **3.2 — Controlled Network Entry & Discovery** | `GEO-012`, `DSC-001`, `DSC-002`, `DSC-003` | **Complete via PR #120.** Controlled Network entry; permitted organization discovery; capability, geography and service-area search; synchronized map, list and detail. |
| **AMACS 0.5.0 reconciliation** | **No Feature IDs** | **Complete via PR #123.** Pinned, deterministically rebuilt, validated and reconciled RFxchange from its historical 0.1.0 baseline to immutable 0.5.0 without silently changing historical records or creating participant features. |
| **AI/AMACS Interpretation Foundation** | **No Feature IDs** | **Complete via PR #124.** Provider-neutral server gateway and concrete adapter; release-aware retrieval; AMACS schema and catalog validation; non-authoritative candidates; disposition and authoritative-command separation; provenance; privacy; metering; manual-service path; evaluation. |
| **3.3 — Market Profile Enrichment** | `ORG-013`, `ORG-014`, `ORG-016`, `ORG-017` | **Complete via PR #126.** Structured AMACS-backed capability assertions, products and services, industry and NAICS context, past performance and teaming, referral or resource preferences. Ordinary-language assistance uses 0.5.0 InterpretationRecord or Candidate contracts; confirmed assertions remain separate from suggestions, evidence and verification. |
| **3.4 — Credential, Media & Location Enrichment** | `ORG-015`, `ORG-018`, `ORG-019` | **Complete via PR #128.** Credentials with provenance; private-by-default media, documents and portfolio; subordinate additional locations with geography and privacy authority. |
| **3.5 — Referral Network & Referral Acquisition** | `REF-001`, `REF-002`, `REF-003`, `REF-004`, `REF-005`, `EDU-014`, `ACQ-006` | **Complete via PR #130.** Legitimate organization-owned referrals with structured context, consent and minimum necessary data, lifecycle, first-use education and external acquisition continuity. |
| **3.6 — Official Resource Provider Foundation** | `RES-001`, `RES-002`, `RES-003`, `ADM-070` | **Complete via PR #132.** Controlled provider application, review and approval; official-provider state; private structured service profile with authority, evidence and lifecycle. |
| **3.7 — Resource Discovery, Routing & Provider Distribution** | `RES-004`, `RES-005`, `DSC-011`, `REF-006`, `RES-007`, `RES-008`, `ACQ-008` | **Complete via PR #137.** Service-territory discovery; deterministic explainable contextual routing without `RES-006`; consented provider connection; request-scoped communications; resource publishing; bounded provider acquisition and distribution. |
| **B6b — Network lens convergence** | **No Feature IDs** | **Not Started / intentionally pending.** No specific brief, mandatory prerequisite or concrete bounded convergence defect; Slice 3.8 proceeds against the completed Network baseline. |
| **3.8 — Persistent Network Education** | `EDU-016`, `EDU-017` | **Complete via PR #139.** Reusable Quick Start and role paths plus contextual four-question explainers over live organization, referral and resource behavior. |
| **Wave 3 closeout** | **No Feature IDs** | **Accepted.** Integrated configured-browser path, role/privacy/authority matrix, accessibility/localization checks and global Firestore/Auth/Storage zero-residual reconciliation. |

## Operating sequence

Use one active slice or gate at a time unless an explicit later task changes that authority.

```text
Slice 3.2 evidence, tracker update and PR #120 merge [complete]
→ production CI and authority recalculation from merged main
→ AMACS 0.5.0 reconciliation implementation and PR #123 merge [complete]
→ production CI and authority recalculation from merged main
→ AI/AMACS Interpretation Foundation implementation and PR #124 merge [complete]
→ recalculate and explicitly authorize Slice 3.3 [complete]
→ Slice 3.3 implementation, acceptance, PR #126 merge and post-merge CI [complete]
→ recalculate and explicitly authorize Slice 3.4 [complete]
→ Slice 3.4 implementation, acceptance, PR #128 merge and post-merge CI [complete]
→ recalculate and explicitly authorize Slice 3.5 [complete]
→ Slice 3.5 implementation and acceptance [complete]
→ Slice 3.5 production PR, merge and post-main CI [complete]
→ recalculate and explicitly authorize Slice 3.6 [complete]
→ Slice 3.6 implementation and acceptance [complete]
→ Slice 3.6 production PR, merge and post-main CI [complete]
→ recalculate and explicitly authorize Slice 3.7 [complete]
→ Slice 3.7 implementation and acceptance [complete]
→ Slice 3.7 production PR, merge and post-main CI [complete]
→ evaluate B6b [pending by explicit decision]
→ recalculate and explicitly authorize Slice 3.8 [complete]
→ Slice 3.8 implementation and acceptance [complete]
→ Slice 3.8 exact-head CI [complete]
→ Slice 3.8 merge and post-merge CI [complete]
→ Wave 3 closeout after Network reached 38/38 and all exit evidence passed [accepted]
→ documentation-only Wave 4 Slice 4.1 dependency/authority reconciliation is the next planning candidate; implementation remains unauthorized
```

Current explicit task instructions define the outer execution boundary. Regardless of that boundary, each later slice requires its own fresh post-merge authority recalculation and focused authority update before implementation; this roadmap alone grants no implementation authority.

Preparation or read-only inspection may occur ahead of the active slice. Production code for a later gate or slice cannot begin merely because an adjacent abstraction makes it convenient.

## Critical path

```text
real OPEN organization and real map marker
→ reliable communications [complete]
→ brand and workspace convergence [complete]
→ controlled Network discovery [complete]
→ immutable AMACS 0.5.0 integration [complete]
→ governed human-language ↔ AMACS interpretation [complete]
→ confirmed AMACS-backed market profiles [complete]
→ credential, media and location enrichment [complete]
→ consented referral lifecycle and referral acquisition [complete]
→ official resource-provider foundation [complete]
→ service-territory discovery, contextual routing and provider distribution [complete]
→ B6b convergence [intentionally pending]
→ persistent Network education over real behavior [complete]
→ Wave 3 exit at Network 38/38 [accepted]
```

## AMACS and AI authority

Governing documents:

- `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`;
- `docs/rfx/AMACS_0_5_RECONCILIATION.md`;
- `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md`.

Core rules:

- participants may begin in ordinary language or manually browse or search AMACS in the applicable authorized consumer;
- AMACS 0.5.0 supplies the standard contracts; RFxchange supplies the implementation;
- interpretation records and candidates have no authoritative effect;
- accepted candidates require a separate server-authorized domain write;
- the AI or model may not invent AMACS identifiers or silently create claims or requirements;
- every ID and controlled relationship validates against the pinned release;
- rejected or unresolved candidates cannot affect matching;
- manual operation remains available in participant consumers when assistance is declined, unavailable, disabled or exhausted;
- already-structured matching remains deterministic and LLM-independent; and
- commercial status cannot alter semantic truth, matching, verification or credibility.

The two cross-cutting gates are sequencing prerequisites, not replacement dependency edges for individual Feature IDs. Any canonical dependency-map mutation requires a separate reviewed reconciliation.

## Slice handoffs

### Slice 3.2

Must remain within `GEO-012` and `DSC-001`–`003`; it cannot absorb AMACS 0.5.0 ingestion, AI interpretation or profile enrichment.

### AMACS 0.5.0 reconciliation

May implement only release ingestion or deterministic reconstruction, generated contracts and projections, history or migration safeguards and application ports. It cannot mark `ORG-013` or another product feature complete.

### AI/AMACS foundation

May implement only the cross-cutting server gateway and provider adapter, retrieval, validation, interpretation and provenance persistence, disposition boundary, cost and privacy controls, future manual-service seams and evaluation. It cannot create final Slice 3.3 or Wave 4 product completion claims.

### Slice 3.3

Consumes the verified 0.5.0 catalog and foundation to create organization-owned, participant-confirmed capability assertions. It cannot infer verification.

### Slice 3.4

Consumes merged profile assertions and preserves credential or evidence, media, storage and location privacy boundaries.

### Slice 3.5

Consumes real organizations and profiles plus reliable communications. It creates the first legitimate live referral path and must preserve consent, minimum necessary sharing and the distinction between connection and outcome.

### Slice 3.6

Consumes real organizations and enriched profiles to establish controlled provider application, administrative review, approval and official-provider service-profile authority. It cannot self-award verification or credibility.

### Slice 3.7

Consumes approved providers, real service territories and referral authority to implement provider discovery, deterministic eligibility/context routing, consented connections, request-scoped communications, resource visibility and acquisition continuity. Explicit maintained availability may be represented, but advanced capacity-aware routing remains excluded with `RES-006`. It must not convert a provider recommendation into service acceptance or outcome.

### Slice 3.8

Consumes the merged live Network behavior from earlier slices and adds persistent Quick Start, role paths and contextual education. It cannot simulate missing domain state or replace the underlying workflows.

## Brand, evidence and credibility rules

- Use completed brand and design authorities without widening domain scope.
- Organization nodes require authorized real projections.
- Opportunity beacons remain absent until Wave 4 publication.
- Referral paths require real Slice 3.5 records or events.
- Service fields require real Slice 3.7 provider territory.
- Credibility seals require later authoritative credibility events.
- AI suggestion, profile claim, referral sent or accepted, publication, pursuit or submission is not a verified outcome.
- Growth Green cannot imply an outcome without authoritative outcome state.
- Invented organizations, opportunities, providers, statistics, testimonials, evidence and market activity are prohibited.
- Paid, Founding or sponsored status cannot alter capability truth or neutral discovery.

## Wave 3 exit condition

Wave 3 may close only after all 38 Network Feature IDs are accepted and evidenced.

At exit:

- an OPEN organization enters its controlled Network geography;
- permitted organizations are discoverable by confirmed capability, geography and service area;
- the same organization identity supports participant-confirmed AMACS-backed market enrichment;
- credentials, private or public media and additional locations preserve provenance and privacy;
- organizations send and receive legitimate consented referrals with acquisition continuity;
- organizations can apply for resource-provider status and authorized administrators can review and approve or deny it;
- approved providers expose structured services, territories, eligibility, intake and truthful capacity or availability state where authorized;
- businesses discover and connect to appropriate providers in context without treating a recommendation as acceptance;
- provider and resource acquisition pathways preserve bounded intent;
- Quick Start, role paths and contextual explainers remain available over real Network behavior; and
- evidence, authority, commercial neutrality, credibility, connection and outcome boundaries remain truthful throughout.

Completion of Slice 3.5 alone is expected to leave Network at 25/38 absent unrelated drift. It is a milestone, not the Wave 3 exit.

## Completion discipline

- Mark a Feature ID Done only after its own acceptance and evidence pass.
- Cross-cutting gate completion does not change tracker totals.
- Recalculate from merged `main` after every slice or gate.
- Update execution authority before beginning the next production phase.
- AMACS 0.5.0 reconciliation is complete via PR #123, the AI/AMACS Interpretation Foundation is complete via PR #124, and Slice 3.3 is complete via PR #126 with exact-head and post-merge CI passed.
- Slice 3.4 is complete via PR #128, Slice 3.5 via PR #130, Slice 3.6 via PR #132, Slice 3.7 via PR #137 and Slice 3.8 via PR #139. Exact-head and post-merge CI passed, and the separate integrated closeout accepted Network 38/38. B6b remains intentionally pending.
- The next planning candidate is documentation-only Wave 4 Slice 4.1 dependency/authority reconciliation; this roadmap and closeout do not authorize runtime implementation.
