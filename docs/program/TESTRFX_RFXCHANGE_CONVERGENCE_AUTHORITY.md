# TestRFx → RFxchange Convergence Authority

**Status:** Proposed governance authority for review  
**Repository of production truth:** `AccelAnalysis/RFxchange`  
**Controlled donor/reference repository:** `AccelAnalysis/TestRFx`  
**RFxchange baseline:** `399072c05aa78e536ad57d0998a643f1c6d49b08`  
**TestRFx donor baseline:** `db19a0cc2171d0ddde4f34a20acc881ba7279248`  
**Prepared:** 2026-08-22

## Decision

RFxchange is the sole production repository and governed domain system.

| Boundary | Production authority |
| --- | --- |
| Identity | Firebase Authentication plus RFxchange user resolution and server sessions |
| Persistence | Firestore behind RFxchange repository boundaries |
| Server runtime | Firebase Functions and existing reviewed Next server boundaries |
| Media | Firebase Storage private-source objects plus reviewed public delivery projections |
| Map | Existing Mapbox production canvas and governed spatial projections |
| Audit and jobs | Domain events, organization audit records, Firebase Functions, and background-job framework |
| Donor/reference | TestRFx at exact commit `db19a0cc2171d0ddde4f34a20acc881ba7279248` |

TestRFx contributes experience patterns, workflow designs, presentation refinements, source-backed data packages, and geocoding manifests. It does not contribute a competing production runtime.

## Non-negotiable prohibitions

1. No dual writes between TestRFx and RFxchange.
2. No cross-repository production synchronization.
3. No TestRFx PostgreSQL, Neon, PostGIS, custom-session, HMAC-token, MapLibre, OpenFreeMap, static-preview identity, or browser-authority runtime may become RFxchange production truth.
4. No generic TestRFx `exchange_records` collection/table may replace RFxchange domain aggregates and projections.
5. No TestRFx fixture, illustrative organization, preview identity, local workspace, fake receipt, or static preview record may be imported as production data.
6. No donor component may bypass RFxchange localization, accessibility, state-continuity, authorization, security-rule, emulator, architecture, browser, or build gates.
7. No donor feature may be implemented until its contract-map row identifies canonical identity, persistence, command, authorization, projection, audit/event behavior, and rollback/retry behavior.

## Repository roles

### RFxchange

RFxchange owns:

- canonical user, membership, organization, authorization, geography and commercial truth;
- RFx aggregates, commands, events, publication snapshots and participant projections;
- Resources provider/application/publication truth;
- capability and AMACS truth;
- referral aggregates and minimum-necessary sharing;
- Firebase Security Rules, indexes, Functions, Storage, emulators and deployment;
- Mapbox rendering;
- the shared mobile Exchange contracts and validation gates.

### TestRFx

TestRFx is frozen as a controlled donor at commit `db19a0cc2171d0ddde4f34a20acc881ba7279248` for this reconciliation. Corrective work may preserve the donor baseline, but independent production feature development is outside this authority. This document records the exact commit even though it does **not** claim that the requested lightweight tag `testrfx-reconciliation-baseline-2026-08-22` currently exists.

## Current RFxchange work that convergence must not bypass

- Shared Stage 3 contracts are merged.
- Resources Stage 4 is merged through PR #237.
- Capabilities Stage 4 remains open in PR #234.
- Intelligence Stage 4 remains open in PR #235.
- RFx Slice 4.7 remains open in PR #238; later RFx response/submission packets remain dependency-ordered.

Convergence work must consume or wait for those current owners. It may not create a parallel TestRFx migration lane that privately replaces their contracts.

## Phase progression

### Phase 1 — Reconciliation inventory

The canonical inventory is:

- `docs/program/TESTRFX_RFXCHANGE_FEATURE_RECONCILIATION_MATRIX.md`
- `docs/program/TESTRFX_RECONCILIATION_SOURCE_INDEX.md`
- `governance/testrfx-rfxchange-reconciliation.json`

Every substantive donor feature receives one disposition:

`ALREADY PRESENT | PORT PRESENTATION | PORT DOMAIN EXPERIENCE | MIGRATE DATA | REIMPLEMENT AGAINST FIREBASE | DEFER | SUPERSEDED | RETIRE`

### Phase 2 — Contract map and admission gate

The canonical Phase 2 package is:

- `docs/program/TESTRFX_RFXCHANGE_CONTRACT_MAP.md`
- `docs/program/TESTRFX_RFXCHANGE_PORT_ADMISSION_GATE.md`
- `docs/program/TESTRFX_RFXCHANGE_PHASE2_WORK_PACKETS.md`
- `governance/testrfx-rfxchange-contract-map.json`

Phase 2 is documentation/governance only. It authorizes no runtime implementation and no data write.

### Later phases

Later implementation requires a bounded Control Room packet and the admission gate. Merge order remains dependency-aware. Visual parity with TestRFx is never sufficient by itself.

## Acceptance

This authority is ready for merge only when:

- the feature matrix contains exactly 53 unique donor features;
- every non-retired/non-superseded port candidate references one or more Phase 2 contract IDs;
- every contract row identifies all seven mandatory boundaries;
- the validation test passes;
- the pull request contains no production runtime, Firebase configuration, Mapbox implementation, security-rule, data, deployment, or domain-model change;
- GitHub review confirms the exact baseline SHAs and current open packet references remain truthful.

## Truthfulness

`implemented`, `merged`, `live`, and `Verified` are separate states. This governance package may be described as implemented on its branch after the files and validation exist. It is not merged, live, or independently Verified until those events actually occur.
