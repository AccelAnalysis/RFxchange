# Four-Lens Parallel Delivery Matrix

**Canonical volatile program-status source**

**Snapshot basis:** operational Control Room transition `7d4deb37377c0ad7bd027dab64acd44a4d1d2e66`; initial operational activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`; Slice 4.6 reconciliation activation base `347015829d64cfc596cdef1010601d8bda447818`; ISS-006 correction activation base `69daa4bea80b39cc9d5ed04715aa6e2ac8e1f068`; Build → Release → Verify authority merge `4ca2a12f1d924ac559f87ebae0abc8fe42eac24b`; Exchange Room Phase 1 activation base `4ca2a12f1d924ac559f87ebae0abc8fe42eac24b` through Control Room PR #185
**Update rule:** Control Room recalculates this document from merged `main` after every program merge.

The Master Build Tracker remains the Feature-ID authority. This matrix reports independent experience verification and must not be used to rewrite tracker arithmetic.

## Experience completion

The initial denominators are established by `governance/four-lens-requirements.json`. Only `Verified` requirements enter the numerator.

| Experience | Requirement denominator | Verified | In Progress | Implemented — Not Verified | Not Started | Blocked | Explicitly deferred/N/A |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Shared Exchange | 26 | 0 | 0 | 21 | 0 | 4 | 1 |
| Opportunities/RFx | 41 | 0 | 0 | 23 | 18 | 0 | 0 |
| Resources | 12 | 0 | 0 | 8 | 2 | 2 | 0 |
| Intelligence | 14 | 0 | 0 | 3 | 6 | 5 | 0 |
| Referrals | 12 | 0 | 0 | 9 | 1 | 2 | 0 |
| **Program total** | **105** | **0** | **0** | **64** | **27** | **13** | **1** |

No percentage is reported. This baseline deliberately distinguishes implementation/evidence from independent verification.

## Canonical tracker comparison

- Tracker: **438 total · 170 Done · 268 Not Started**.
- RFx Core tracker: **18/41 Done**.
- Program RFx assurance: **0/41 Verified**; prior tracker state is preserved while independent assurance and corrections remain unresolved.
- Merge and production release do not change the Verified numerator or tracker arithmetic by themselves.

## Build → Release → Verify operating state

The program uses three separate lifecycle facts:

1. **Implementation/merge** — bounded code may integrate to `main` as `Implemented — Not Verified` when current scope/dependency reconciliation, exact-head CI/evidence and no-known-material-finding gates pass.
2. **Production release** — Control Room applies Standard/Elevated/Critical risk-based release controls under `BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md`.
3. **Independent certification** — only Lane 06 with an authorized independent reviewer and complete exact-SHA evidence may produce `Verified`.

Current reviewer capacity remains constrained:

- no authorized alternate Reviewer A is available;
- no Reviewer B is available for the Lane 06 assurance artifact;
- `github:AccelAnalysis` is the implementation/candidate actor and cannot independently certify its own production requirements;
- the configured `github-app:chatgpt-codex-connector[bot]` remains program-authorized but is currently unavailable because its code-review capacity is exhausted;
- Issue #181 remains the durable reviewer-capacity record.

This reviewer constraint blocks **new `Verified` certification** where an independent signal is required. It does not, by itself, freeze ordinary safe integration/release under the Build → Release → Verify authority.

CI, builder narrative, Control Room merge/release authorization and product-owner release authority never substitute for Lane 06 certification.

## Exchange Room Phase 1

The immediate product critical path is now the **Exchange Room**, not completion of every lens/function.

- PR #183 `b15d737bcf5292206f8d7119034c848aa3d8f73d` is the canonical progressive-room source candidate; its historical exact-head production CI #940 passed.
- PR #174 `bc6d4f6dea158c7cdd359cc7bb64fd262e9bd7c1` is the selected-organization continuity source; its historical exact-head production CI #919 passed.
- Both predate current `main` and must be reconciled.
- PR #183 does not contain PR #174's selected-organization propagation through search, Clear, previous/next pagination and safe return. That continuity must be carried forward.
- Do not merge #174 independently merely to preserve process shape. It may be superseded only after its substantive behavior is present and evidenced in the reconciled Phase 1 candidate.
- Phase 1 release class is **Elevated** because controlled participants gain the shared Room while protected domain operations remain server-authorized.
- Independent reviewer scarcity is certification debt, not a Phase 1 merge/release stop.
- Phase 2 Lens Controller + 16-Action Registry is explicitly downstream and must not become a Phase 1 prerequisite.

Phase 1 is release-ready only after current-main reconciliation, exact-head CI, controlled/OPEN lifecycle evidence, unauthorized/restricted/wrong-organization negative tests, tenant/geography/privacy evidence, protected-domain-route negative tests, desktop/mobile configured-browser evidence, accessibility/five-locale evidence where applicable, #174 continuity coverage, and no known material unsafe finding.

## Current participant lens availability

The permanent order is exactly `Opportunities/RFx | Resources | Intelligence | Referrals`. Runtime availability remains controlled by current server-authorized behavior. Availability never broadens record or action authority merely because navigation or a shell is visible.

The Phase 1 Room may expose governed unavailable actions/lenses without making them reachable. Full RFx, Resources, Intelligence, Referrals, Teaming, messaging, notifications, billing expansion and the eventual 16-action registry do **not** block Room entry/release.

## Current workstreams

| Workstream | Lane | State | Exact base/candidate | Integration / certification effect |
| --- | --- | --- | --- | --- |
| Program authority setup | 00 | Closed | PR #172 head `619b3794b59f1609d14596e59d9d2f045756c945`; merge `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`; post-merge production-ci #911 passed | complete |
| Shared Experience Completion | 01 | Implemented — Not Verified | activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`; PR #174 `bc6d4f6dea158c7cdd359cc7bb64fd262e9bd7c1` | source behavior/provenance is consumed by Exchange Room Phase 1; supersede only after continuity is preserved |
| Exchange Room Foundation Phase 1 | 01 | Active | activation base `4ca2a12f1d924ac559f87ebae0abc8fe42eac24b`; epoch `exchange-room-phase1-2026-08-12`; packet `WP-EXCHANGE-ROOM-PHASE1-01`; source PRs #183 `b15d737bcf5292206f8d7119034c848aa3d8f73d` + #174 `bc6d4f6dea158c7cdd359cc7bb64fd262e9bd7c1` | converge onto current main; merge as `Implemented — Not Verified` after Elevated merge gates; then post-merge CI + canonical production release/live verification; certification remains later debt |
| Wave 4 Assurance | 06 | Blocked — independent reviewer unavailable | activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`; PR #178 `6f6a1b6a1c4a303458156780f8d715d5e48c3c58`; pending result 0 Verified / 11 Partial / 7 Blocked | cannot produce governed `Verified` dispositions while reviewer signal is unavailable; findings may still guide corrections under participant authority |
| Intelligence Program | 03 | Implemented — Not Verified | activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`; PR #177 `c8e899ebe68ec10c383ba5fd58ce5269a6e6d8ab` | documentation/governance candidate may integrate under normal safe merge controls; no production requirement becomes Verified |
| Resources Completion | 04 | Implemented — Not Verified | activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`; PR #176 `c9425df5726cadbbdcbf3a5b20b3378ef9f9e513` | inventory candidate may integrate under normal safe merge controls; no production requirement becomes Verified |
| Referrals Completion | 05 | Implemented — Not Verified | activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`; PR #175 `649b47b22354c6bf705d71f7c86c5fedae30a067` | inventory candidate may integrate under normal safe merge controls; no production requirement becomes Verified |
| Slice 4.6 reconciliation | 02 | Implemented — Not Verified | activation base `347015829d64cfc596cdef1010601d8bda447818`; PR #171 reconciled candidate `60764f2deaabcd2d184aea40734da880f2b6f1c0`; preserved prior candidate `e70413e2e45db4b75517376acdc0700f9838a963` | preserved pre-amendment packet explicitly forbids merge before independent acceptance; requires Control Room successor/reclassification before the new default merge rule can apply |
| Slice 4.6 Independent Acceptance | 06 | Frozen | future reconciled Slice 4.6 exact implementation | certification remains frozen by existing packet/dependency state |
| Slice 4.2 ISS-006 corrective production | 02 | Active | activation base `69daa4bea80b39cc9d5ed04715aa6e2ac8e1f068`; epoch `rfx-42-iss006-correction-2026-08-12`; packet `WP-RFX-42-ISS006-CORRECT-01` | pre-amendment packet explicitly blocks its own merge; builder work may proceed and Control Room may later create successor/reclassification if appropriate |
| Integration | 07 | Standby / activatable | current merged `main` | may test merged `Implemented — Not Verified` work for integration defects; cannot produce `Verified` |

The first eight packet definitions remain the immutable adoption baseline. Later operational packets append without rewriting that frozen baseline. Candidate, candidate history, status, exact activation base and activation epoch remain lifecycle state.

## Verification debt queue

These candidates retain independent certification/review debt. Their lack of reviewer capacity is not automatically a merge prohibition unless their exact packet or a stricter authority says so.

| PR | Exact candidate head | Current certification / packet condition |
| --- | --- | --- |
| #171 | `60764f2deaabcd2d184aea40734da880f2b6f1c0` | Slice 4.6 `Implemented — Not Verified`; explicit pre-amendment packet merge stop still applies |
| #174 | `bc6d4f6dea158c7cdd359cc7bb64fd262e9bd7c1` | continuity source for Phase 1; independent certification debt remains until superseded/accepted as appropriate |
| #175 | `649b47b22354c6bf705d71f7c86c5fedae30a067` | Referrals inventory; independent certification/review debt remains where applicable |
| #176 | `c9425df5726cadbbdcbf3a5b20b3378ef9f9e513` | Resources inventory; independent certification/review debt remains where applicable |
| #177 | `c8e899ebe68ec10c383ba5fd58ce5269a6e6d8ab` | Intelligence authority; independent certification/review debt remains where applicable |
| #178 | `6f6a1b6a1c4a303458156780f8d715d5e48c3c58` | Lane 06 assurance artifact; qualifying independent certification signal unavailable |
| #180 | `09a6c1bcad5c738482fc91aaa51a779aee3f299e` | activation policy-remediation correction; `Implemented — Not Verified`; any production release is Critical risk because it touches policy/lifecycle routing |
| #183 | `b15d737bcf5292206f8d7119034c848aa3d8f73d` | canonical Phase 1 source candidate; must be reconciled with #174 and current main before merge/release; independent certification later |

## RFx corrective sequencing

The participant has directly authorized the known RFx correction set, but only the first correction packet is active now:

1. **Active:** Slice 4.2 — `ISS-006` via `WP-RFX-42-ISS006-CORRECT-01`.
2. **Not activated:** Slice 4.3 — `ISS-007`, `ISS-009`, `ISS-011`.
3. **Not activated:** Slice 4.4 — `ISS-016`, `ISS-018`, `ISS-019`, `ACQ-009`.
4. **Not activated:** Slice 4.5 — `DSC-004`, `DSC-005`, `DSC-006`.

Control Room recalculates stacking and merge order from merged `main` and the exact packet boundaries. Verification debt on a prerequisite blocks `Verified` of a dependent requirement, but does not automatically block bounded implementation unless the dependency is required for safe implementation behavior.

## Merge and release controls

1. Re-fetch current `main` before every merge/release decision.
2. Preserve immutable packet/history and use successor/reclassification when a pre-amendment stop boundary needs to change; do not rewrite history.
3. For ordinary post-amendment candidates, independent reviewer availability is not a universal merge prerequisite.
4. Exact-head CI/evidence and current-main reconciliation remain normal merge gates.
5. No known material security/privacy/tenancy/integrity/authority finding may be ignored because CI is green or reviewer capacity is unavailable.
6. Production release requires Standard/Elevated/Critical classification and the corresponding evidence/authorization/rollback controls.
7. Exchange Room Phase 1 is **Elevated** and must satisfy the merge/release gates in `EXCHANGE_ROOM_PHASE1_CONTROL.md` and `WP-EXCHANGE-ROOM-PHASE1-01`.
8. Merge/release does not promote tracker state or the Four-Lens Verified numerator.
9. Lane 06 may audit an open, merged or deployed exact implementation; only its independently reviewed exact-SHA disposition may produce `Verified`.
10. Lane 07 integration supplements requirement acceptance and may operate on merged unverified work without self-certifying it.

## Preserved external statuses

- Stabilization 2C remains incomplete and isolated to release engineering.
- Production deployment may proceed where otherwise authorized, but source-SHA → build identity → rendered-SHA claims remain limited to evidence actually available.
- B6b remains Not Started / intentionally pending.
- B6c remains separate authority.
- No Feature ID, Four-Lens requirement status, tracker total or Verified numerator changes through Phase 1 activation.
