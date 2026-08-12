# Four-Lens Parallel Delivery Matrix

**Canonical volatile program-status source**

**Snapshot basis:** adoption base `21c4fc080a823ae03f33ae1e58dd2752f317dc67`
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

The permanent order is exactly `Opportunities/RFx | Resources | Intelligence | Referrals`. At the adoption base all four are enabled through existing server-authorized runtimes; Opportunities/RFx uses the real Slice 4.5 `/opportunities` discovery runtime. Availability never broadens record or action authority, and the program setup adds no lens runtime.

## Active/frozen workstreams at adoption

| Workstream | Lane | State | Exact base/candidate | Merge eligibility |
| --- | --- | --- | --- | --- |
| Program authority setup | 00 | In Progress until merged | base `21c4fc080a823ae03f33ae1e58dd2752f317dc67` | governance-only PR |
| Slice 4.6 candidate | 02 | Frozen pending authority reconciliation | PR #171 head `e70413e2e45db4b75517376acdc0700f9838a963` | no; independent acceptance pending and substantive findings remain |
| Shared Experience Completion | 01 | Ready after authority merge | assigned in machine workstreams | dependency-aware |
| Wave 4 Assurance | 06 | Ready after authority merge | Slices 4.1–4.5 | acceptance-only |
| Intelligence Program | 03 | Ready after authority merge | dependency-independent packet first | dependency-aware |
| Resources Completion | 04 | Ready after authority merge | inventory/audit first | dependency-aware |
| Referrals Completion | 05 | Ready after authority merge | inventory/audit first | dependency-aware |
| Acceptance Farm | 06 | Ready after authority merge | exact candidate assignments only | never production merge authority |
| Integration | 07 | Continuous after accepted lane merges | current merged `main` | evidence/closeout only |

## Merge order controls

1. Merge this authority and deterministic artifacts without runtime or tracker changes.
2. Recalculate against the resulting merge SHA and activate the initial packets.
3. Independent lanes may execute while PR #171 is reconciled.
4. PR #171 may merge only after exact-head independent acceptance and no substantive findings.
5. Slice 4.7 remains ineligible until accepted Slice 4.6 is on merged `main` and dependencies are recalculated.

## Preserved external statuses

- Stabilization 2C remains incomplete and isolated to release engineering.
- B6b remains Not Started / intentionally pending.
- B6c remains separate authority; this program setup does not implement it.
- No Feature ID changes in the authority-setup PR.
