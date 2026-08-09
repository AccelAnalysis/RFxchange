# RFxchange Master Build Tracker

> Canonical repository checklist for implementation completion.

## Rules
- Every Feature ID from the approved tracker remains here until `Done`, `Deferred`, or `Not Applicable`.
- `[x]` means the documented acceptance check has passed and implementation/validation evidence exists.
- Do not infer completion from adjacent features.
- Detailed requirements and acceptance criteria remain in the source specifications and slice architecture docs.
- Update this file in the same PR as implementation whenever practical; Git history is the version history.
- Build sequencing follows the reviewed dependency authority in `RFxchange_DEPENDENCY_MAP.md`; corrected dependencies supersede seeded spreadsheet edges for scheduling only.

## Progress

**438 total · 152 Done · 286 Not Started**
- 0 - Product System: **5/14**
- 1 - Foundation: **64/64**
- 2 - Activation: **43/43**
- 3 - Network: **38/38**
- 4 - RFx Core: **0/41**
- 5 - Trust & Engagement: **0/141**
- 6 - Commercial: **1/50**
- 7 - Institutional & Scale: **1/47**

## Completed build sequence — Wave 2 Activation roadmap — reconciled 2026-08-01

- **Slices 2.1–2.8 — MERGED**: geography authority/rendering, organization resolution/authority, transactional email, organization geography/location, essential profile, marker activation and scoped Organization 360 are complete at their Feature-ID acceptance boundaries.
- **Wave 2 Runtime Convergence Gate — MERGED PR #92; no Feature IDs**: account-only participant runtime, trusted auth/session composition, lifecycle/membership/restriction routing, scoped admin boundaries, production fixture removal, canonical onboarding metadata and convergence guardrails. Production CI passed on the merged tree.
- **Registration Convergence Correction — MERGED PR #98; no Feature IDs**: removes organization type, descriptive participation roles and business objectives from required registration; corrects Profile Complete; preserves optional enrichment; establishes post-orientation first-value selection; and keeps Official Resource Provider status in the separate Wave 3.6 application/review process.
- **Activation Profile Website Carry-Forward Repair — MERGED PR #99; no Feature IDs**: preserved genuine omission of previously confirmed website fields at the activation API boundary, retained explicit `true` and `false`, rejected malformed supplied values, and passed both configured-browser website paths plus disposable-data cleanup.
- **Slice 2.9 — MERGED VIA PR #101 — `ACQ-002` + `ACQ-003`**: privacy-safe public opportunity entry and server-bound acquisition context now survive authentication, activation, first authenticated continuation, browser history, reload, and sign-in re-entry without granting domain authority.
- **Slice 2.10 — MERGED VIA PR #102 — `EDU-001` + `EDU-002` + `EDU-003` + `EDU-004`**: one protected, resumable and restartable synthetic eight-step orientation model implements its first four ordered map steps through teammate discovery.
- **Slice 2.11 — MERGED VIA PR #103 — `EDU-005` + `EDU-006` + `EDU-007` + `EDU-008`**: the same protected aggregate now completes teammate invitation/acceptance, structured joint response, evaluation/human selection and the complete network-effect visualization.
- **Slice 2.12 — MERGED VIA PR #104 — `EDU-009` + `EDU-010`**: seven semantic post-orientation first-value choices and the complete server-authoritative OPEN gate close Wave 2 Activation.

Wave 2 remains complete at **43/43 Activation**. The Runtime Convergence Gate, Registration Convergence Correction, and Activation Profile Website Carry-Forward Repair remain no-Feature-ID integration/repair gates. Slice 2.12 configured-browser acceptance used two fresh disposable identities against the selected real Firebase project and actual Census/Mapbox integrations. Direct entry remained neutral; preserved opportunity context visibly recommended but did not authorize or complete a choice. Both journeys completed all eight orientation steps, presented seven truthful intents, made one explicit selection, persisted one auditable OPEN transition, survived reload/re-entry, and honored a later suspension. Cleanup removed all 79 exact Firestore records and both Auth identities; the residual scan returned zero. Full emulator and repository gates passed, including production CI run `30715058244` on PR #104's merge SHA `d599901d7ff35a4ee67eb2363dcf3334a2303dbc`.

## Wave 3 Network and required Brand Gate sequence — current 2026-08-09

- **Brand Gate B0 — MERGED PR #100; no Feature IDs**: reconciled the target Brand Experience System against completed Wave 2 and established the brand/design precedence and domain-availability rules used by Wave 3.
- **Slice 3.1 — MERGED VIA PR #107 — `COMMS-003` + `COMMS-004` + `COMMS-005`**: established versioned transactional event/template mapping, minimized delivery audit, append-only evidence, deterministic retry, accepted-delivery replay suppression, interrupted-success healing, direct-client denial and terminal-failure operations visibility. Production CI run `30719532985` passed on head `eba071e54e3a9cc88ec7fd353e943922917d6484`; PR #107 merged at `368fdb5e0179ca7933eb33ffb6cbf12a2afe2bf1`.
- **Brand Gate B1 — MERGED VIA PR #109; no Feature IDs**: established the exact Exchange Light semantic palette, Accessible Dark Gold, spacing/radius/elevation/border/focus/type/motion roles, proprietary object-semantic contracts, compatibility aliases and static semantic-drift controls. Production CI run `30720318973` passed on head `743493799d096040f4482863d699436bc4855c8a`; PR #109 merged at `c4c18272f46ad3e3120e2dcf6405fda8a274a685`.
- **Brand Gates B2 through B6a — MERGED VIA PRs #111–#115; no Feature IDs**: completed shared primitives, cartographic convergence, public marketing/acquisition, activation experience and the existing authenticated workspace foundation without fabricating later domain objects.
- **Slice 3.2 — COMPLETE VIA PR #120 — `GEO-012` + `DSC-001` + `DSC-002` + `DSC-003`**: implemented server-authorized OPEN Network entry, capability-first permitted organization discovery, canonical base/service geography filtering, privacy-safe exact/approximate/locality-only projections and synchronized map/list/detail state. Configured-browser acceptance covered current and missing authority, restriction and lifecycle changes after load, stale selection recovery, truthful empty state, desktop/intermediate/mobile composition, keyboard/screen-reader semantics, all five locales, clean console and future-domain absence. Cleanup removed 42 scoped Firestore records and two Auth identities; the residual scan returned zero. Full local `npm run check` passed with 385 architecture tests and 19 Functions tests, and production CI run `31283391560` passed on synchronized head `5d1796e2255fab582025636a102d369ef65e4029`.

- **AMACS 0.5.0 reconciliation — COMPLETE VIA PR #123; no Feature IDs**: deterministically reconstructed and verified the immutable 0.5.0 release at `da7879f2609271b067ae6d02875e9388a02c4fe5`, preserved the historical 0.1.0 release, generated release-aware catalog/search/registry/runtime projections, proved the 500 historical capabilities remained with 115 additive capabilities and no inferred historical mutation, and isolated all artifacts and infrastructure from participant surfaces. Local `npm run check`, the official upstream validator and 44 upstream tests, seven focused RFxchange tests and production CI run `31284501027` passed on substantive head `c2d6695cdea2f3d3386dab354e37e1bba9440e87`.
- **AI/AMACS Interpretation Foundation — COMPLETE VIA PR #124; no Feature IDs**: established the authenticated provider-neutral gateway, concrete OpenAI adapter with truthful disabled state, bounded AMACS 0.5.0 retrieval, strict schema/catalog validation, non-authoritative record/candidate and disposition contracts, minimized provenance, metering, transactional quotas, independent manual catalog path and deterministic regression evaluation. Local `npm run check` passed with 400 architecture tests and 19 Functions tests; focused Firestore emulator acceptance proved direct-client denial, atomic persistence, disposition and quota behavior. No live provider smoke was claimed without configured credentials.

Network completion is **38/38**: four inherited Wave 1 foundations, three Slice 3.1 communications features, four Slice 3.2 discovery features, four Slice 3.3 market-profile features, three Slice 3.4 organization-enrichment features, seven Slice 3.5 referral/acquisition features, four Slice 3.6 provider-foundation features, seven Slice 3.7 resource-routing features, and two Slice 3.8 persistent-education features. Slice 3.8 final-head CI run `31303588724` passed, PR #139 merged at `2727b6111d1582225e8ece409d015b8696a8cce7`, and post-merge `main` CI run `31303727886` passed before the separate closeout. The configured-browser exit then exercised the live path from OPEN discovery through profile/location/media/referral/acquisition/provider review/routing/connection/resource and persistent education across the required roles, three viewport classes, keyboard/screen-reader semantics and all five locales. Axe reported zero violations, browser page errors were empty, and exact teardown plus global run-ID sweeps across 27 Firestore collections, Auth and Storage returned zero residuals. See `docs/architecture/WAVE_3_CLOSEOUT.md`. Totals remain **438 total · 152 Done · 286 Not Started**: no AI, AMACS, brand, simulation or adjacent behavior inferred a Feature completion. B6b remains intentionally pending; `RES-006`, `ADM-071`, all 41 RFx Core IDs and every later-wave ID remain Not Started.

## Feature-ID checklist

### 0 - Product System

- [x] `ACQ-001` — PR #54
- [x] `BRD-001` — PR #56
- [ ] `BRD-002`
- [x] `BRD-003` — PR #56
- [ ] `BRD-004`
- [x] `BRD-005` — PR #56
- [ ] `BRD-006`
- [ ] `BRD-007`
- [ ] `BRD-008`
- [ ] `BRD-009`
- [ ] `BRD-010`
- [ ] `BRD-011`
- [ ] `BRD-012`
- [x] `BRD-014` — PR #56

### 1 - Foundation

- [x] `ARC-001` — PR #3
- [x] `ARC-002` — PR #3
- [x] `ARC-003` — PR #7
- [x] `ARC-004` — PR #7
- [x] `ARC-005` — PR #9
- [x] `ARC-006` — PR #10
- [x] `ARC-007` — PR #11
- [x] `ARC-008` — PR #11
- [x] `ARC-009` — PR #8
- [x] `GOV-001` — PR #12
- [x] `GOV-002` — PR #12
- [x] `GOV-003` — PR #12
- [x] `GOV-004` — PR #13
- [x] `GOV-006` — PR #13
- [x] `ADM-001` — PR #15
- [x] `ADM-008` — PR #13
- [x] `ADM-010` — PR #14
- [x] `ADM-011` — PR #15
- [x] `ADM-012` — PR #31
- [x] `ADM-013` — PR #32
- [x] `ADM-014` — PR #16
- [x] `ADM-015` — PR #33
- [x] `ADM-016` — PR #34
- [x] `ADM-017` — PR #34
- [x] `ADM-019` — PR #36
- [x] `ADM-021` — PR #36
- [x] `ADM-033` — PR #36
- [x] `ADM-046` — PR #40
- [x] `ADM-047` — PR #51
- [x] `ADM-048` — PR #51
- [x] `ADM-049` — PR #36
- [x] `ADM-057` — PR #39
- [x] `ADM-058` — PR #45
- [x] `ADM-059` — PR #45
- [x] `ADM-060` — PR #45
- [x] `ADM-061` — PR #46
- [x] `ADM-062` — PR #46
- [x] `ADM-067` — PR #39
- [x] `ADM-068` — PR #64
- [x] `ADM-069` — PR #39
- [x] `ADM-084` — PR #51
- [x] `ADM-085` — PR #38
- [x] `ADM-086` — PR #49
- [x] `ADM-088` — PR #35
- [x] `ADM-090` — PR #37
- [x] `ADM-091` — PR #45
- [x] `ADM-092` — PR #15
- [x] `ADM-093` — PR #16
- [x] `ADM-094` — PR #31
- [x] `ADM-095` — PR #36
- [x] `INF-001` — PR #17
- [x] `INF-002` — merge 6ea999e
- [x] `INF-003` — PR #18
- [x] `INF-004` — merge 2f83a62
- [x] `INF-005` — merge 4b9613d
- [x] `AUTH-001` — PR #22
- [x] `AUTH-002` — PR #24
- [x] `AUTH-003` — PR #25
- [x] `AUTH-004` — PR #26
- [x] `AUTH-005` — PR #27
- [x] `INF-006` — PR #28
- [x] `COMMS-001` — PR #53
- [x] `COM-038` — PR #61
- [x] `INF-009` — PR #52

### 2 - Activation

- [x] `ACQ-002` — PR #101; fail-closed public opportunity projection, anonymous browser acceptance, responsive QA, and `npm run check`
- [x] `ACQ-003` — PR #101; all supported context kinds, server-bound activation continuity, history/re-entry browser acceptance, Firestore emulator acceptance, cleanup, and `npm run check`
- [x] `ACQ-004` — PR #70; seeded public-projection tests, desktop/mobile browser QA, Firestore emulator acceptance, and `npm run check`
- [x] `GEO-001` — PR #68; geography authority tests, Firestore emulator acceptance, and `npm run check`
- [x] `GEO-002` — PR #68; geography authority tests, Firestore emulator acceptance, and `npm run check`
- [x] `GEO-003` — PR #68; geography authority tests, Firestore emulator acceptance, and `npm run check`
- [x] `GEO-004` — PR #69; authoritative boundary tests, desktop/mobile browser QA, and `npm run check`
- [x] `GEO-005` — PR #69; layer/camera interaction tests, desktop/mobile browser QA, and `npm run check`
- [x] `GEO-006` — PR #69; layer-order/muting tests, desktop/mobile browser QA, and `npm run check`
- [x] `GEO-007` — PR #68; geography authority tests, Firestore emulator acceptance, and `npm run check`
- [x] `GEO-008` — PR #68; geography authority tests, Firestore emulator acceptance, and `npm run check`
- [x] `GEO-009` — PR #74
- [x] `GEO-010` — PR #74
- [x] `GEO-011` — PR #77; canonical gate/privacy/idempotency/anchoring tests, Firestore emulator acceptance, desktop/mobile browser QA, and `npm run check`
- [x] `EDU-001` — PR #102; protected real-map synthetic three-organization scenario, responsive configured-browser acceptance, emulator acceptance, and `npm run check`
- [x] `EDU-002` — PR #102; ordered synthetic opportunity issuance with no live record writes, configured-browser acceptance, emulator acceptance, and `npm run check`
- [x] `EDU-003` — PR #102; explainable potential-fit demonstration without qualification claims, configured-browser acceptance, and deterministic tests
- [x] `EDU-004` — PR #102; bounded gap and teammate discovery without invitation/legal-team creation, resume/restart browser acceptance, emulator acceptance, and cleanup
- [x] `EDU-005` — PR #103; defined-capacity invitation/review/acceptance, nonbinding boundary, configured-browser acceptance, emulator acceptance, and `npm run check`
- [x] `EDU-006` — PR #103; structured requirement ownership/completion, synthetic-submit isolation, configured-browser acceptance, emulator acceptance, and `npm run check`
- [x] `EDU-007` — PR #103; stated evaluation criteria, accessible comparison, human selection authority, configured-browser acceptance, and deterministic tests
- [x] `EDU-008` — PR #103; complete connected network-effect map, step-8-only persisted completion, restart/re-entry acceptance, cleanup, and `npm run check`
- [x] `EDU-009` — PR #104; seven semantic destination contracts, direct/acquisition configured-browser acceptance, explicit participant choice, truthful unavailable states, persistence, and `npm run check`
- [x] `EDU-010` — PR #104; complete fresh server gate, exact remediation, auditable idempotent OPEN transition, later-restriction enforcement, emulator/configured-browser acceptance, and cleanup
- [x] `ORG-001` — PR #70; explainable entity-match tests, desktop/mobile browser QA, Firestore emulator acceptance, and `npm run check`
- [x] `ORG-002` — PR #70; select/create lifecycle tests, Firestore emulator acceptance, and `npm run check`
- [x] `ORG-003` — PR #70; duplicate/conflict and atomic entity-key tests, Firestore emulator acceptance, and `npm run check`
- [x] `ORG-004` — PR #73; five-path authority, private-evidence/conflict/lifecycle tests, Firestore emulator acceptance, desktop/mobile browser QA, and `npm run check`
- [x] `ORG-005` — PR #74
- [x] `ORG-006` — PR #74
- [x] `ORG-007` — PR #75
- [x] `ORG-008` — PR #75
- [x] `ORG-009` — PR #74
- [x] `ORG-010` — PR #75; optional descriptive classification retained for later enrichment and never used as organization authority or a Profile Complete gate
- [x] `ORG-011` — PR #75; optional personalization vocabulary retained for later use and removed from required activation/`EDU-009` dependency
- [x] `ORG-012` — PR #75 + PR #98 correction; derived from minimum identity/contact, meaningful capability, service geography, confirmed location and location visibility
- [x] `ADM-063` — PR #77; 14-context scope/permission/minimum-data tests, desktop/mobile browser QA, and `npm run check`
- [x] `ADM-064` — PR #77; independent-state/restriction/case-link tests, desktop/mobile browser QA, and `npm run check`
- [x] `ADM-065` — PR #73; category/geography/scope tests, desktop/mobile browser QA, and `npm run check`
- [x] `ADM-066` — PR #73; evidence-review, case-scope, atomic adjudication/audit tests, Firestore emulator acceptance, desktop/mobile browser QA, and `npm run check`
- [x] `INF-007` — PR #29
- [x] `INF-008` — PR #30
- [x] `COMMS-002` — PR #72; Microsoft Graph adapter/INF-007 integration tests and `npm run check`

### 3 - Network

- [x] `ACQ-006` — Slice 3.5; real external referral, signed acquisition continuity, legitimate OPEN recipient binding, explicit exact-referral attachment, mismatch/replay/expiry gates, configured-browser acceptance, and zero-residual cleanup
- [x] `ACQ-008` — Slice 3.7; signed provider profile-completion invitation, legitimate activation continuity, no provider-status/authority grant, configured-browser acceptance, and zero-residual cleanup
- [x] `GEO-012` — PR #120; current OPEN/geography/marker authority, after-load restriction/lifecycle denial, configured-browser responsive acceptance, cleanup, and `npm run check`
- [x] `EDU-014` — Slice 3.5; append-only first-use education acknowledgement for the named recipient and exact shared fields before send, continued availability, all five locales, and browser acceptance
- [x] `EDU-016` — Slice 3.8; reusable versioned Quick Start plus Business, Issuer and Resource Provider paths, membership-bound durable resume/dismiss/reopen/completion, truthful live/planned links, five locales, configured-browser acceptance and zero-residual cleanup
- [x] `EDU-017` — Slice 3.8; eleven shared nonmodal four-question explainers before consequential Wave 3 actions, independent viewed/dismissed evidence, domain/authority isolation, keyboard/screen-reader acceptance and zero-residual cleanup
- [x] `ORG-013` — Slice 3.3; AMACS 0.5.0 manual/assisted entry, non-authoritative candidate disposition, separate confirmed claim command, structured discovery migration, emulator/browser acceptance, cleanup, and `npm run check`
- [x] `ORG-014` — Slice 3.3; descriptive industry and participant-selected NAICS source/version provenance, explicit non-authority boundary, browser acceptance, and focused tests
- [x] `ORG-015` — Slice 3.4; controlled organization-reported credentials, issuer/source/date/evidence provenance, explicit visibility, immutable audit/history, no automatic verification, focused/emulator/browser acceptance, and cleanup
- [x] `ORG-016` — Slice 3.3; bounded self-reported past performance/project value, privacy/visibility, capability-link review boundary, browser acceptance, and focused tests
- [x] `ORG-017` — Slice 3.3; prime/subcontractor/supplier/referral/resource preferences with explicit non-authority/commitment boundary, browser acceptance, and focused tests
- [x] `ORG-018` — Slice 3.4; INF-008 private source objects, validated media/documents, explicit reversible publication, minimized controlled delivery, sensitive-evidence exclusion, focused/emulator/browser acceptance, and cleanup
- [x] `ORG-019` — Slice 3.4; in-locality authoritative geocode/review/confirm, primary-location immutability, exact/approximate/locality-only privacy, subordinate map semantics, focused/emulator/browser acceptance, and cleanup
- [x] `ORG-021` — PR #42
- [x] `ORG-022` — PR #42
- [x] `DSC-001` — PR #120; capability-first permitted organization search, explainable match boundary, configured-browser acceptance, emulator acceptance, and `npm run check`
- [x] `DSC-002` — PR #120; canonical base/service geography filtering with base-versus-service separation, configured-browser acceptance, emulator acceptance, and `npm run check`
- [x] `DSC-003` — PR #120; privacy-safe exact/approximate/locality-only map/list/detail synchronization, stale selection recovery, accessibility/responsive acceptance, cleanup, and `npm run check`
- [x] `DSC-011` — Slice 3.7; deterministic service/locality/availability contextual routing with explicit match reasons, no model/capacity/commercial ordering, focused and configured-browser acceptance
- [x] `REF-001` — Slice 3.5; current-authority organization sender, idempotent draft/send, versioned communication correlation, focused/emulator/configured-browser acceptance, and cleanup
- [x] `REF-002` — Slice 3.5; exact attached recipient authority, explicit accept/decline, sender/recipient isolation, external-recipient browser acceptance, and focused/emulator denial coverage
- [x] `REF-003` — Slice 3.5; typed draft/sent/accepted/declined/contacted/closed/expired lifecycle, expected-version conflicts, append-only events/audits, retry recovery, and real browser progression through close
- [x] `REF-004` — Slice 3.5; structured need, summary, urgency, contact method, purpose and optional opportunity context with minimized role-specific projections
- [x] `REF-005` — Slice 3.5; explicit named-recipient consent, approved minimum sharing, private-field suppression, no public leakage, real-path privacy, and direct-client denial
- [x] `REF-006` — Slice 3.7; exact published provider/service/version connection, current eligibility, consented minimum sharing, accept/decline/redirect and request-scoped messages with immutable evidence
- [x] `RES-001` — Slice 3.6; post-activation Profile Complete application, authoritative organization references, multi-select localized categories, private evidence ownership, focused/emulator/configured-browser acceptance, and cleanup
- [x] `RES-002` — Slice 3.6; explicit review/information/response/resubmission/approval/denial lifecycle, exact scoped authority, immutable versions/events/audits, denial/reapplication, direct-client denial, and configured-browser acceptance
- [x] `RES-003` — Slice 3.6; approval-only private structured service profile with maintained services, geography, eligibility, intake, contact, modality, languages, explicit availability/capacity truth, and no public projection
- [x] `RES-004` — Slice 3.7; explicit versioned provider publication over current approved service profile and selected maintained services, reversible withdrawal, focused/emulator/browser acceptance
- [x] `RES-005` — Slice 3.7; server-authorized service-territory discovery, separately rendered territory and office marker, explicit maintained availability and privacy-safe projection
- [x] `RES-007` — Slice 3.7; provider-owned resource draft/publish/withdraw/expire lifecycle, moderation boundary, safe URLs, minimized public projection and fresh-load browser acceptance
- [x] `RES-008` — Slice 3.7; provider/requester-scoped append-only communications and bounded provider resource distribution without acceptance, qualification or outcome claims
- [x] `ADM-055` — PR #43
- [x] `ADM-056` — PR #43
- [x] `ADM-070` — Slice 3.6; exact-permission/scope provider queue and minimum-necessary review console with authoritative organization references, evidence metadata boundary, request/response/decision history, focused and configured-browser acceptance
- [x] `COMMS-003` — PR #107; explicit event/template versions, strict reviewed variable rendering, brand/message compliance, architecture tests, and `npm run check`
- [x] `COMMS-004` — PR #107; minimized server-only delivery aggregate, append-only evidence, operations-health projection, direct-client denial, emulator acceptance, and `npm run check`
- [x] `COMMS-005` — PR #107; INF-007 retry integration, accepted-delivery replay suppression, interrupted-success healing, transient/permanent/exhausted failure tests, and `npm run check`

### 4 - RFx Core

- [ ] `ACQ-007`
- [ ] `ACQ-009`
- [ ] `EDU-011`
- [ ] `EDU-012`
- [ ] `EDU-013`
- [ ] `DSC-004`
- [ ] `DSC-005`
- [ ] `DSC-006`
- [ ] `DSC-007`
- [ ] `DSC-008`
- [ ] `DSC-010`
- [ ] `ISS-001`
- [ ] `ISS-002`
- [ ] `ISS-003`
- [ ] `ISS-005`
- [ ] `ISS-006`
- [ ] `ISS-007`
- [ ] `ISS-009`
- [ ] `ISS-011`
- [ ] `ISS-016`
- [ ] `ISS-018`
- [ ] `ISS-019`
- [ ] `ISS-020`
- [ ] `RSP-001`
- [ ] `RSP-002`
- [ ] `RSP-003`
- [ ] `RSP-004`
- [ ] `RSP-006`
- [ ] `RSP-007`
- [ ] `RSP-008`
- [ ] `RSP-009`
- [ ] `RSP-010`
- [ ] `RSP-017`
- [ ] `RSP-018`
- [ ] `RSP-019`
- [ ] `RSP-020`
- [ ] `RSP-021`
- [ ] `TEM-001`
- [ ] `TEM-002`
- [ ] `TEM-003`
- [ ] `TEM-004`

### 5 - Trust & Engagement

- [ ] `ACQ-010`
- [ ] `GOV-005`
- [ ] `EDU-015`
- [ ] `ORG-020`
- [ ] `DSC-009`
- [ ] `DSC-012`
- [ ] `ISS-008`
- [ ] `ISS-010`
- [ ] `ISS-012`
- [ ] `ISS-013`
- [ ] `ISS-014`
- [ ] `ISS-015`
- [ ] `ISS-017`
- [ ] `ISS-024`
- [ ] `ISS-025`
- [ ] `RSP-005`
- [ ] `RSP-011`
- [ ] `RSP-013`
- [ ] `RSP-014`
- [ ] `RSP-015`
- [ ] `RSP-016`
- [ ] `RSP-022`
- [ ] `RSP-023`
- [ ] `RSP-024`
- [ ] `EVA-001`
- [ ] `EVA-002`
- [ ] `EVA-003`
- [ ] `EVA-004`
- [ ] `EVA-005`
- [ ] `EVA-006`
- [ ] `EVA-007`
- [ ] `EVA-008`
- [ ] `EVA-009`
- [ ] `EVA-010`
- [ ] `EVA-012`
- [ ] `EVA-013`
- [ ] `EVA-014`
- [ ] `EVA-015`
- [ ] `TEM-005`
- [ ] `TEM-006`
- [ ] `TEM-007`
- [ ] `TEM-008`
- [ ] `REF-007`
- [ ] `RES-006`
- [ ] `CRD-001`
- [ ] `CRD-002`
- [ ] `CRD-003`
- [ ] `CRD-004`
- [ ] `CRD-005`
- [ ] `CRD-006`
- [ ] `CRD-007`
- [ ] `CRD-008`
- [ ] `CRD-009`
- [ ] `CRD-010`
- [ ] `CRD-011`
- [ ] `CRD-012`
- [ ] `CRD-013`
- [ ] `CRD-014`
- [ ] `CRD-015`
- [ ] `CRD-016`
- [ ] `CRD-017`
- [ ] `CRD-018`
- [ ] `CRD-019`
- [ ] `CRD-020`
- [ ] `CRD-021`
- [ ] `CRD-022`
- [ ] `CRD-023`
- [ ] `CRD-024`
- [ ] `CRD-025`
- [ ] `CRD-026`
- [ ] `CRD-027`
- [ ] `CRD-028`
- [ ] `CRD-029`
- [ ] `CRD-030`
- [ ] `CRD-031`
- [ ] `CRD-032`
- [ ] `CRD-033`
- [ ] `CRD-034`
- [ ] `CRD-035`
- [ ] `CRD-036`
- [ ] `CRD-037`
- [ ] `CRD-038`
- [ ] `CRD-039`
- [ ] `CRD-040`
- [ ] `CRD-041`
- [ ] `CRD-042`
- [ ] `CRD-043`
- [ ] `NTF-001`
- [ ] `NTF-002`
- [ ] `NTF-003`
- [ ] `NTF-004`
- [ ] `NTF-006`
- [ ] `NTF-007`
- [ ] `NTF-008`
- [ ] `NTF-009`
- [ ] `NTF-010`
- [ ] `NTF-011`
- [ ] `NTF-012`
- [ ] `NTF-013`
- [ ] `NTF-014`
- [ ] `COM-013`
- [ ] `COM-014`
- [ ] `COM-016`
- [ ] `GRW-001`
- [ ] `GRW-002`
- [ ] `GRW-003`
- [ ] `GRW-004`
- [ ] `GRW-005`
- [ ] `GRW-012`
- [ ] `GRW-014`
- [ ] `GRW-015`
- [ ] `ADM-002`
- [ ] `ADM-003`
- [ ] `ADM-004`
- [ ] `ADM-005`
- [ ] `ADM-006`
- [ ] `ADM-007`
- [ ] `ADM-009`
- [ ] `ADM-018`
- [ ] `ADM-022`
- [ ] `ADM-023`
- [ ] `ADM-024`
- [ ] `ADM-025`
- [ ] `ADM-026`
- [ ] `ADM-027`
- [ ] `ADM-028`
- [ ] `ADM-029`
- [ ] `ADM-030`
- [ ] `ADM-031`
- [ ] `ADM-032`
- [ ] `ADM-038`
- [ ] `ADM-039`
- [ ] `ADM-040`
- [ ] `ADM-071`
- [ ] `ADM-072`
- [ ] `ADM-073`
- [ ] `ADM-074`
- [ ] `ADM-075`
- [ ] `ADM-076`
- [ ] `ADM-081`
- [ ] `ADM-082`

### 6 - Commercial

- [x] `ARC-010` — PR #61
- [ ] `ACQ-005`
- [ ] `ISS-004`
- [ ] `ISS-021`
- [ ] `ISS-022`
- [ ] `ISS-023`
- [ ] `ISS-026`
- [ ] `RSP-012`
- [ ] `TEM-009`
- [ ] `REF-008`
- [ ] `REF-011`
- [ ] `NTF-005`
- [ ] `NTF-015`
- [ ] `NTF-016`
- [ ] `NTF-017`
- [ ] `COM-001`
- [ ] `COM-002`
- [ ] `COM-003`
- [ ] `COM-004`
- [ ] `COM-005`
- [ ] `COM-006`
- [ ] `COM-007`
- [ ] `COM-008`
- [ ] `COM-009`
- [ ] `COM-010`
- [ ] `COM-011`
- [ ] `COM-012`
- [ ] `COM-019`
- [ ] `COM-020`
- [ ] `COM-023`
- [ ] `COM-024`
- [ ] `COM-025`
- [ ] `COM-026`
- [ ] `COM-027`
- [ ] `COM-029`
- [ ] `GRW-006`
- [ ] `GRW-007`
- [ ] `GRW-008`
- [ ] `BRD-013`
- [ ] `ADM-034`
- [ ] `ADM-035`
- [ ] `ADM-036`
- [ ] `ADM-037`
- [ ] `ADM-041`
- [ ] `ADM-077`
- [ ] `ADM-078`
- [ ] `ADM-079`
- [ ] `COM-039`
- [ ] `COM-040`
- [ ] `COM-041`

### 7 - Institutional & Scale

- [ ] `GEO-013`
- [ ] `DSC-013`
- [ ] `EVA-011`
- [ ] `EVA-016`
- [ ] `REF-009`
- [ ] `REF-010`
- [ ] `RES-009`
- [ ] `RES-010`
- [ ] `RES-011`
- [ ] `COM-015`
- [ ] `COM-017`
- [ ] `COM-018`
- [ ] `COM-021`
- [ ] `COM-022`
- [ ] `COM-028`
- [ ] `GRW-009`
- [ ] `GRW-010`
- [ ] `GRW-011`
- [ ] `GRW-013`
- [ ] `INS-001`
- [ ] `INS-002`
- [ ] `INS-003`
- [ ] `INS-004`
- [ ] `INS-005`
- [ ] `INS-006`
- [ ] `INS-007`
- [ ] `INS-008`
- [ ] `INS-009`
- [ ] `INS-010`
- [ ] `INS-011`
- [ ] `INS-012`
- [ ] `INS-013`
- [ ] `INS-014`
- [ ] `ADM-020`
- [ ] `ADM-042`
- [ ] `ADM-043`
- [ ] `ADM-044`
- [ ] `ADM-045`
- [ ] `ADM-050`
- [ ] `ADM-051`
- [ ] `ADM-052`
- [ ] `ADM-053`
- [ ] `ADM-054`
- [ ] `ADM-080`
- [x] `ADM-083` — PR #49
- [ ] `ADM-087`
- [ ] `ADM-089`

## Update protocol
1. Look up the Feature ID in the source specification / slice architecture note before implementation.
2. Implement and validate the documented acceptance check.
3. Mark `[x]` only after validation passes and add PR/commit/CI evidence.
4. Refresh the progress totals above.
5. Use the next dependency-eligible unchecked ID to plan the next slice using `RFxchange_DEPENDENCY_MAP.md` as the dependency authority.

## Source tracker
`RFxchange_Master_Feature_Build_Tracker_Updated_Infrastructure(1).xlsx` seeded this checklist. The Markdown tracker is now the live progress authority; reviewed dependency corrections are maintained in `RFxchange_DEPENDENCY_MAP.md`.
