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

**438 total · 90 Done · 348 Not Started**
- 0 - Product System: **5/14**
- 1 - Foundation: **64/64**
- 2 - Activation: **15/43**
- 3 - Network: **4/38**
- 4 - RFx Core: **0/41**
- 5 - Trust & Engagement: **0/141**
- 6 - Commercial: **1/50**
- 7 - Institutional & Scale: **1/47**

## Active build sequence — Wave 2 Activation roadmap — adopted 2026-07-30

- **Slice 2.1 — `GEO-001` + `GEO-002` + `GEO-003` + `GEO-007` + `GEO-008` — Geography Authority**: primary operating geography, server-side authorization, canonical FIPS/geography metadata, release states, bounds and locality camera.
- **Slice 2.2 — `GEO-004` + `GEO-005` + `GEO-006` — Geography Rendering**: authoritative locality boundaries, prominent selected-locality treatment and muted surrounding geographies.
- **Slice 2.3 — `ACQ-004` + `ORG-001` + `ORG-002` + `ORG-003` — Organization Resolution**: seeded/unclaimed profile, organization matching, claim/create flow and duplicate/entity-resolution protection.
- **Slice 2.4 — `COMMS-002` — Microsoft Transactional Email**: production Microsoft delivery adapter behind the provider-neutral communication boundary.
- **Slice 2.5 — `ORG-004` + `ADM-065` + `ADM-066` — Organization Authority & Claims**: establish organizational authority plus administrative claims discovery and auditable conflict adjudication.
- **Slice 2.6 — `GEO-009` + `GEO-010` + `ORG-005` + `ORG-006` + `ORG-009` — Organization Geography & Location**: home-versus-service geography, address capture, geocoding/map confirmation, privacy and service-area capture.
- **Slice 2.7 — `ORG-007` + `ORG-008` + `ORG-010` + `ORG-011` + `ORG-012` — Essential Organization Profile**: minimum identity, meaningful capability, multi-role classification, business objectives and legitimate Profile Complete state.
- **Slice 2.8 — `GEO-011` + `ADM-063` + `ADM-064` — Marker Activation & Admin 360**: activate the real organization marker and provide complete scoped administrative organization context/status.
- **Slice 2.9 — `ACQ-002` + `ACQ-003` — Acquisition-to-Activation Continuity**: public opportunity entry and preservation of opportunity/claim/referral/team/provider/buyer context through registration and first authenticated experience.
- **Slice 2.10 — `EDU-001` + `EDU-002` + `EDU-003` + `EDU-004` — Orientation: Discovery & Team Formation**: synthetic three-organization map tutorial from opportunity issuance through capability gap and teammate discovery.
- **Slice 2.11 — `EDU-005` + `EDU-006` + `EDU-007` + `EDU-008` — Orientation: Response to Outcome**: teammate invitation/acceptance, structured joint response, evaluation/selection and complete network-effect visualization.
- **Slice 2.12 — `EDU-009` + `EDU-010` — First Value & OPEN Gate**: objective-driven first action followed by OPEN only after the complete user, organization, geography, marker and education gates are satisfied.

**Implementation hold:** the Wave 2 roadmap is adopted, but **Slice 2.1 must not begin until explicit follow-up authorization is given**.

This sequence is planning guidance, not a completion claim. Wave 2 begins at **2/43 complete** because `INF-007` and `INF-008` were completed earlier. Recalculate dependency eligibility from merged `main` after every slice and mark an item Done only after its acceptance check and CI evidence pass.

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

- [ ] `ACQ-002`
- [ ] `ACQ-003`
- [x] `ACQ-004` — PR #70; seeded public-projection tests, desktop/mobile browser QA, Firestore emulator acceptance, and `npm run check`
- [x] `GEO-001` — PR #68; geography authority tests, Firestore emulator acceptance, and `npm run check`
- [x] `GEO-002` — PR #68; geography authority tests, Firestore emulator acceptance, and `npm run check`
- [x] `GEO-003` — PR #68; geography authority tests, Firestore emulator acceptance, and `npm run check`
- [x] `GEO-004` — PR #69; authoritative boundary tests, desktop/mobile browser QA, and `npm run check`
- [x] `GEO-005` — PR #69; layer/camera interaction tests, desktop/mobile browser QA, and `npm run check`
- [x] `GEO-006` — PR #69; layer-order/muting tests, desktop/mobile browser QA, and `npm run check`
- [x] `GEO-007` — PR #68; geography authority tests, Firestore emulator acceptance, and `npm run check`
- [x] `GEO-008` — PR #68; geography authority tests, Firestore emulator acceptance, and `npm run check`
- [ ] `GEO-009`
- [ ] `GEO-010`
- [ ] `GEO-011`
- [ ] `EDU-001`
- [ ] `EDU-002`
- [ ] `EDU-003`
- [ ] `EDU-004`
- [ ] `EDU-005`
- [ ] `EDU-006`
- [ ] `EDU-007`
- [ ] `EDU-008`
- [ ] `EDU-009`
- [ ] `EDU-010`
- [x] `ORG-001` — PR #70; explainable entity-match tests, desktop/mobile browser QA, Firestore emulator acceptance, and `npm run check`
- [x] `ORG-002` — PR #70; select/create lifecycle tests, Firestore emulator acceptance, and `npm run check`
- [x] `ORG-003` — PR #70; duplicate/conflict and atomic entity-key tests, Firestore emulator acceptance, and `npm run check`
- [ ] `ORG-004`
- [ ] `ORG-005`
- [ ] `ORG-006`
- [ ] `ORG-007`
- [ ] `ORG-008`
- [ ] `ORG-009`
- [ ] `ORG-010`
- [ ] `ORG-011`
- [ ] `ORG-012`
- [ ] `ADM-063`
- [ ] `ADM-064`
- [ ] `ADM-065`
- [ ] `ADM-066`
- [x] `INF-007` — PR #29
- [x] `INF-008` — PR #30
- [x] `COMMS-002` — PR #72; Microsoft Graph adapter/INF-007 integration tests and `npm run check`

### 3 - Network

- [ ] `ACQ-006`
- [ ] `ACQ-008`
- [ ] `GEO-012`
- [ ] `EDU-014`
- [ ] `EDU-016`
- [ ] `EDU-017`
- [ ] `ORG-013`
- [ ] `ORG-014`
- [ ] `ORG-015`
- [ ] `ORG-016`
- [ ] `ORG-017`
- [ ] `ORG-018`
- [ ] `ORG-019`
- [x] `ORG-021` — PR #42
- [x] `ORG-022` — PR #42
- [ ] `DSC-001`
- [ ] `DSC-002`
- [ ] `DSC-003`
- [ ] `DSC-011`
- [ ] `REF-001`
- [ ] `REF-002`
- [ ] `REF-003`
- [ ] `REF-004`
- [ ] `REF-005`
- [ ] `REF-006`
- [ ] `RES-001`
- [ ] `RES-002`
- [ ] `RES-003`
- [ ] `RES-004`
- [ ] `RES-005`
- [ ] `RES-007`
- [ ] `RES-008`
- [x] `ADM-055` — PR #43
- [x] `ADM-056` — PR #43
- [ ] `ADM-070`
- [ ] `COMMS-003`
- [ ] `COMMS-004`
- [ ] `COMMS-005`

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
