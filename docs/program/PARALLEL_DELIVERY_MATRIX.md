# Four-Lens Parallel Delivery Matrix

**Canonical volatile program-status source**

**Snapshot basis:** operational Control Room transition `7d4deb37377c0ad7bd027dab64acd44a4d1d2e66`; initial operational activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`; Slice 4.6 reconciliation activation base `347015829d64cfc596cdef1010601d8bda447818`
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

No percentage is reported. This baseline deliberately distinguishes historical implementation/evidence from independent verification under the new authority.

## Canonical tracker comparison

- Tracker: **438 total · 170 Done · 268 Not Started**.
- RFx Core tracker: **18/41 Done**.
- Program RFx assurance: **0/41 Verified**; 18 previously accepted features and five Slice 4.6 candidate features await independent program acceptance.
- The assurance numerator does not revoke tracker state; it makes the new evidence state explicit.

## Current participant lens availability

The permanent order is exactly `Opportunities/RFx | Resources | Intelligence | Referrals`. Runtime availability remains unchanged by governance activation. All four continue through their existing server-authorized runtimes; Opportunities/RFx uses the real Slice 4.5 `/opportunities` discovery runtime. Availability never broadens record or action authority.

## Current workstreams after operational activation

| Workstream | Lane | State | Exact base/candidate | Merge eligibility |
| --- | --- | --- | --- | --- |
| Program authority setup | 00 | Closed | PR #172 head `619b3794b59f1609d14596e59d9d2f045756c945`; merge `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`; post-merge production-ci #911 passed | complete |
| Shared Experience Completion | 01 | Active | activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed` | dependency-aware; independent acceptance required |
| Wave 4 Assurance | 06 | Active | activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`; Slices 4.1–4.5 | acceptance-only |
| Intelligence Program | 03 | Active | activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed` | dependency-independent inventory/authority work first |
| Resources Completion | 04 | Active | activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed` | inventory/audit first |
| Referrals Completion | 05 | Active | activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed` | inventory/audit first |
| Slice 4.6 reconciliation | 02 | Reconciliation Authorized by Control Room PR #173 | activation base `347015829d64cfc596cdef1010601d8bda447818`; preserved PR #171 candidate `e70413e2e45db4b75517376acdc0700f9838a963` | reconciliation only; no candidate merge or tracker promotion before independent acceptance |
| Slice 4.6 Independent Acceptance | 06 | Frozen | future reconciled Slice 4.6 exact candidate | no; depends on reconciliation packet reaching acceptance-pending/implemented-not-verified |
| Integration | 07 | Standby/continuous after accepted lane merges | current merged `main` | evidence/closeout only |

The initial five active packets share activation epoch `initial-operational-2026-08-12`, with immutable activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`. Slice 4.6 reconciliation uses separate activation epoch `rfx-46-reconciliation-2026-08-12`, based on exact current `main` `347015829d64cfc596cdef1010601d8bda447818`. Candidate branches may reconcile from their declared base under the packet-specific rules while retaining activation provenance.

## Merge order controls

1. Four-Lens authority is installed on merged `main`; post-merge production-ci #911 passed on `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`.
2. Control Room closed authority setup, switched the program operational and activated Shared, Wave 4 Assurance, Intelligence, Resources and Referrals from exact activation base `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`.
3. Those packets may execute concurrently within their declared ownership, dependency and stop boundaries.
4. Control Room PR #173 separately authorizes `WP-RFX-46-RECONCILE` from exact current-main base `347015829d64cfc596cdef1010601d8bda447818`, while preserving PR #171 candidate `e70413e2e45db4b75517376acdc0700f9838a963` for reconciliation rather than silently accepting or discarding it.
5. Slice 4.6 Independent Acceptance remains frozen until reconciliation produces an eligible exact candidate state; then Lane 06 must be separately activated/bound before acceptance begins.
6. PR #171 may merge only after exact-head independent acceptance and no substantive findings.
7. Slice 4.7 remains ineligible until accepted Slice 4.6 is on merged `main` and dependencies are recalculated.
8. Lane 07 integration remains downstream of independently accepted component work and does not replace Lane 06.

## Preserved external statuses

- Stabilization 2C remains incomplete and isolated to release engineering.
- B6b remains Not Started / intentionally pending.
- B6c remains separate authority; operational activation does not implement it.
- No Feature ID changed during authority installation or operational activation.
