# Wave 4 — RFx Core roadmap

**Status: ACTIVE CANONICAL ROADMAP — SLICES 4.1–4.2 IMPLEMENTED; WAVE 4 IS 5/41.**

Wave 4 contains **41 RFx Core Feature IDs**. Slices 4.1–4.2 implement five; 36 remain Not Started. This roadmap preserves the tracker inventory and separates the basic live RFx path through submission from Wave 5 evaluation/selection/award.

The cross-cutting AI/AMACS Interpretation Foundation is complete and reusable for later guided buyer/issuer need interpretation. Wave 4 does not create a second AI stack. Merged PR #150, **Define the Exchange interaction architecture**, is required participant-experience authority for every Wave 4 slice.

## 1. Prerequisite and current-gate boundary

Wave 4 implementation does not begin merely because this roadmap exists.

The prerequisites for Slice 4.1 documentation authorization have been recalculated from merged `main` at `42c9a33499d9c37af74b6f61d7e1a8f823d0e0f8`:

- Wave 3 reached its approved handoff and integrated exit;
- AMACS 0.5.0 release ingestion/search/runtime contracts are complete;
- the AI/AMACS Interpretation Foundation is complete, although Slice 4.1 uses a manual deterministic request-family path and does not require an AI call;
- organization ownership, membership, lifecycle/restriction, permission, tenancy, audit, versioning and idempotency foundations exist;
- PR #150 Exchange Interaction Architecture is merged;
- no conflicting active implementation slice or gate exists; and
- Stabilization 2C is isolated release engineering, not a product-domain dependency.

The exact implementation authority for `ISS-001`, `ISS-002` and `ISS-003` is now:

`docs/slices/SLICE_4_1_EXECUTION_AUTHORITY.md`

That document governs the completed Slice 4.1 implementation boundary. Its acceptance evidence is recorded in `docs/architecture/WAVE_4_SLICE_4_1.md`.

## 2. Governing documents

Must read:

- `/AGENTS.md`;
- `docs/context/PRODUCT_PRINCIPLES.md`;
- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`;
- `docs/context/RFX_TRANSACTION_CYCLE.md`;
- `docs/context/MAP_AND_GEOGRAPHY.md`;
- `docs/rfx/README.md`;
- `docs/rfx/RFX_CORE_AMACS_CONVERGENCE.md`;
- `docs/rfx/AMACS_0_5_RECONCILIATION.md`;
- `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`;
- `docs/rfx/RFX_CORE_FEATURE_CROSSWALK.md`;
- `docs/rfx/RFX_CORE_PRODUCT_WORKSPACES.md`;
- `docs/rfx/RFX_CORE_ACCEPTANCE_MATRIX.md`;
- `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md`;
- the applicable specific slice execution authority;
- `docs/brand/RFXCHANGE_BRAND_EXPERIENCE_SYSTEM.md`;
- `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md`;
- `docs/brand/VIEWING_MODES.md`;
- `docs/brand/BRAND_GATE_B6C_RFX_LENS.md`;
- `docs/reference/prototypes/RFX_VERSION_2_DESIGN_REFERENCE.md`;
- canonical tracker/dependency map; and
- applicable current design, security, privacy, lifecycle, Firestore, internationalization and geography authorities.

PR #150 is target interaction authority. It is not authority to implement the entire Exchange shell in Slice 4.1 or any later slice whose owning domain is absent.

## 3. Adopted sequence

### Slice 4.1 — RFx kernel and request families

Feature IDs:

- `ISS-001`
- `ISS-002`
- `ISS-003`

Specific authority:

- `docs/slices/SLICE_4_1_EXECUTION_AUTHORITY.md`

Purpose:

Establish the canonical organization-owned RFx aggregate, one bounded `draft` lifecycle, version/event/idempotency seams, the governed AMACS request-family snapshot and safe draft creation from blank with future extensibility for templates/prior RFxs.

No issuer-builder breadth, publication or opportunity projection exists beyond the minimum private draft entry. Slice 4.1 is implemented and preserved by the implemented Slice 4.2 package foundation.

### Slice 4.2 — Structured need, geography, value, term and requirement foundation

Feature IDs:

- `ISS-005`
- `ISS-006`

Purpose:

Implement the operational builder foundation and structured business need, scope, requested outputs, performance location, estimated value, engagement term and typed requirement records. Reuse existing organization location, Census/TIGER locality and geocoding authority. The bounded execution authority is `docs/slices/SLICE_4_2_EXECUTION_AUTHORITY.md`; its documentation merge does not complete either Feature ID.

This slice is the first Wave 4 consumer of the cross-cutting AI/AMACS Interpretation Foundation. An issuer may begin with ordinary-language problem/need/outcome descriptions and receive reviewable structured interpretations and focused clarification prompts. Material AI interpretations remain proposals until the authorized issuer confirms or edits them. The complete non-AI structured/manual path remains available.

Buyer-side interpretation should distinguish at minimum the observed condition/problem, desired outcome, known constraints, solution openness, known timing/location/value/term, unresolved questions and candidate request-family/capability directions without silently asserting procurement or legal requirements.

Slice 4.2 is implemented at this boundary. Slice 4.3 remains unavailable until its own documentation authority is reviewed and merged after Slice 4.2 post-merge validation.

### Slice 4.3 — AMACS requirements, response structure and evaluation definition

Feature IDs:

- `ISS-007`
- `ISS-009`
- `ISS-011`

Purpose:

Add the complete AMACS capability picker and structured capability/credential/experience/geography/capacity/evidence requirements; standardized/expandable response structure; standardized/expandable evaluation method linked to requirements and evidence.

AI-assisted capability/requirement suggestions may consume the confirmed/clarified need context from Slice 4.2 through the same interpretation foundation. Returned AMACS identifiers must validate against the pinned/validated AMACS runtime projection and remain non-authoritative until issuer confirmation. Deterministic readiness/matching logic consumes confirmed structured records, not raw model output.

### Slice 4.4 — Readiness, preview and publication

Feature IDs:

- `ISS-016`
- `ISS-018`
- `ISS-019`
- `ISS-020`
- `ACQ-009`

Purpose:

Deep-linked publication checks, exact responder/public preview parity, atomic publication/version snapshot, permitted opportunity projection, geography/index/timeline/events, controlled sharing and truthful basic/advanced commercial boundary.

This is the first legitimate source for production opportunity beacons. B6c opportunity expression cannot precede it.

### Slice 4.5 — Opportunity discovery and management

Feature IDs:

- `DSC-004`
- `DSC-005`
- `DSC-006`
- `DSC-007`
- `DSC-008`

Purpose:

Extend the real Spatial Workspace with permitted RFx search/list/detail, saved searches, reliable alerts/digests, watch relationships and canonical deadline views. No fake opportunities or private location reconstruction.

### Slice 4.6 — Fit, Go/No-Go and pursuit

Feature IDs:

- `RSP-001`
- `RSP-002`
- `RSP-003`
- `RSP-004`
- `RSP-006`

Purpose:

Explain how an RFx surfaced, calculate bounded AMACS/requirement fit and uncertainty, support a private Go/No-Go assessment, persist Pursue/Watch/Decline and identify typed gaps.

Potential match remains distinct from qualification, eligibility, endorsement and award likelihood. The comparison of confirmed structured records is deterministic; an AI model may later explain the result but is not required to compute it.

### Slice 4.7 — Gap resolution, teaming and external invite continuity

Feature IDs:

- `DSC-010`
- `RSP-007`
- `RSP-008`
- `TEM-001`
- `TEM-002`
- `TEM-003`
- `TEM-004`
- `ACQ-007`

Purpose:

Reuse Wave 3 organization/resource discovery to resolve RFx gaps; create RFx-scoped teammate search, invitation, review, acceptance/decline, nonbinding boundary and preserved acquisition context for nonmembers.

No invitation creates a subcontract, joint venture, teaming agreement or automatic RFx authority.

### Slice 4.8 — Response workspace and continuous readiness

Feature IDs:

- `RSP-009`
- `RSP-010`
- `RSP-017`

Purpose:

Create the organization-owned response after Pursue, generate stable requirement/section-linked response items and continuously evaluate completeness for enabled requirements, pricing, credentials, attachments and acknowledgments.

### Slice 4.9 — Final review and submission/handoff

Feature IDs:

- `RSP-018`
- `RSP-019`
- `RSP-020`
- `RSP-021`

Purpose:

Revalidate current deadline/version/permissions, present the assembled canonical response for human review and finish in either an atomic immutable hosted submission/receipt or an explicit external handoff that never claims receipt.

### Slice 4.10 — Contextual RFx education

Feature IDs:

- `EDU-011`
- `EDU-012`
- `EDU-013`

Purpose:

Add bounded first-use issuer/responder/teammate education inside the real workflows. It creates no tutorial RFx/organization/team/submission records and describes only enabled capabilities truthfully.

## 4. Sequence

```text
Wave 3 approved handoff / dependency recalculation [complete]
→ Slice 4.1 documentation authority [complete]
→ 4.1 RFx kernel implementation [complete]
→ reconcile main and dependencies [complete]
→ Slice 4.2 documentation authority [complete]
→ 4.2 structured need/requirements foundation + governed AI-assisted interpretation [complete]
→ reconcile main and dependencies [next after merge]
→ Slice 4.3 documentation authority
→ 4.3 AMACS requirements/response/evaluation definition + confirmed AMACS suggestions
→ reconcile
→ 4.4 readiness/publication
→ B6c opportunity expression becomes eligible
→ reconcile
→ 4.5 discovery/manage
→ 4.6 deterministic fit/pursuit
→ 4.7 gap/team/resource
→ 4.8 response construction
→ 4.9 submission/handoff
→ 4.10 contextual education
→ verify Wave 4 exit
→ Wave 5 evaluator/Q&A/addenda/selection authority
```

Use one active implementation slice/gate unless explicitly authorized otherwise.

## 5. Exchange interaction boundary

Wave 4 consumes `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md` rather than recreating it.

- The RFxchange remains RFx-centered and organization-centered.
- Opportunities/RFx is the primary transaction lens and principal market-action proposition.
- Resources, Intelligence and Referrals are supporting lenses, not equal public products.
- Intelligence is the analytical lens; Light Appearance and Dark Appearance are presentation terminology.
- Operational Workspace is appropriate for complex authoring while Spatial Workspace preserves discovery/geography context.
- Map/list/detail state stays coherent where a spatial projection exists.
- Cross-lens continuation preserves safe originating context.
- No interface may fabricate RFxs, opportunities, matches, outcomes, providers, referrals, sites, intelligence or market activity.

Slice 4.1 therefore permits only the minimum legitimate private draft-entry path. It does not implement opportunity beacons, published discovery or the complete persistent four-lens shell.

## 6. AI/AMACS interpretation boundary

Wave 4 reuses the cross-cutting foundation rather than introducing provider-specific AI behavior into RFx domain records.

- The provider/model is replaceable infrastructure behind the RFxchange server-side AI gateway.
- AMACS identifiers and relationships are retrieved/validated against the pinned release projection, not invented from model memory.
- AI output remains a proposal until an authorized issuer confirms or edits it.
- Rejected/unresolved AI suggestions are not RFx requirements and do not become market-demand observations.
- The issuer can create and publish an RFx through complete manual paths when AI is disabled/unavailable.
- Model/provider/prompt/AMACS-release provenance, privacy/minimization and usage/cost controls follow the cross-cutting foundation.
- No AI call may bypass RFx readiness, authorization, lifecycle, publication, submission or later evaluation authority.

Slice 4.1 itself uses deterministic manual request-family selection and does not call AI.

## 7. Stabilization 2C boundary

Stabilization 2C remains incomplete and isolated to release engineering. The Firebase App Hosting backend `rfxchange`, GitHub repository connection, live branch `main`, root `/`, retained Web App and reserved hosting URL exist. The remaining blocker is trustworthy build-time source-SHA binding and accepted source-SHA → build-SHA → rendered-SHA live-rollout evidence.

Do not make 2C a Wave 4 product dependency, weaken `RFXCHANGE_BUILD_SHA`, change deployment architecture or attempt a production rollout under this roadmap.

## 8. B6c staging

B6c is domain-dependent, not an early cosmetic project.

- Opportunity beacons become eligible only after Slice 4.4 publishes real RFxs.
- Pursuit/team/response paths become eligible only after their real records/events exist.
- The existing Mapbox/B6a workspace remains the shell.
- No synthetic/fake RFx map objects are allowed.

B6b remains intentionally pending and is not a prerequisite for Slice 4.1.

## 9. Wave 4 exit

Wave 4 exits when an authorized organization can:

1. create a typed, AMACS-backed RFx, using guided AI-assisted or manual structured intake as authorized;
2. define and confirm structured need/location/value/term/requirements/response/evaluation configuration;
3. pass readiness and publish a permitted opportunity;
4. enable organizations to discover and assess it;
5. pursue, identify gaps and form a bounded response team;
6. build a requirement-linked response; and
7. submit through RFxchange with immutable receipt or complete a truthful external handoff.

Wave 4 does not require substantive evaluator scoring/consensus, Q&A/addenda, award/selection, outcome verification, credibility or commercial checkout.

## 10. Completion discipline

- No Feature ID is Done because this roadmap, PR #150, the cross-cutting AI/AMACS foundation or a slice document exists.
- Documentation authority alone marks no Feature ID Done; runtime completion requires its own accepted evidence.
- Update the canonical dependency map only when a genuine reviewed dependency correction exists; no Slice 4.2 correction is currently required.
- Create/approve a specific slice authority before each later implementation slice.
- Run repository, Firebase/emulator, architecture, accessibility, browser, AI-interpretation benchmark where applicable, and slice-specific acceptance.
- Recalculate from merged `main` after each implementation/reconciliation merge.
- Do not begin Slice 4.3, B6c or any later behavior during Slice 4.2 implementation.
