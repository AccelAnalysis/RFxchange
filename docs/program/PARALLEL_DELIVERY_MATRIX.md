# Four-Lens Parallel Delivery Matrix

**Canonical volatile program-status source**

**Snapshot basis:** merged `main` `0b23a9f9b49468aab12609dea6116e1409c925fe` on 2026-08-16

**Current task:** Stage 1 — Lock the Mobile Exchange Architecture

**Update rule:** Control Room recalculates this document from current merged `main` after every program-state change.

The Master Build Tracker remains the Feature-ID authority. This matrix does not rewrite tracker arithmetic, create a `MOB-01` Feature ID, or make Independent Acceptance a universal completion prerequisite.

## Current completion governance

`FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md` controls where older program text conflicts.

- Implementation, merge/release, and optional independent assurance are separate facts.
- A bounded packet may close as `Implemented — Not Verified` when implementation evidence, applicable checks, dependencies, ownership, and durable disposition of material findings are sufficient.
- No known material security, privacy, tenancy, authority, integrity, accessibility, or continuity defect may be ignored.
- Lane 06 remains optional assurance; it is not a universal Stage 1 gate.

## Experience completion

The frozen Four-Lens requirement baseline remains unchanged by this Stage 1 coordination packet.

| Experience | Requirement denominator | Verified | In Progress | Implemented — Not Verified | Not Started | Blocked | Explicitly deferred/N/A |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Shared Exchange | 27 | 0 | 0 | 22 | 1 | 3 | 1 |
| Opportunities/RFx | 41 | 0 | 0 | 23 | 18 | 0 | 0 |
| Resources | 12 | 0 | 0 | 8 | 2 | 2 | 0 |
| Intelligence | 14 | 0 | 0 | 3 | 6 | 5 | 0 |
| Referrals | 12 | 0 | 0 | 10 | 1 | 1 | 0 |
| Program total | 106 | 0 | 0 | 66 | 28 | 11 | 1 |

No percentage is inferred from these status counts. Stage 1 is a cross-cutting architecture-convergence packet and does not alter this baseline.

## Canonical tracker comparison

- Master Build Tracker: **438 total · 170 Done · 268 Not Started**.
- Stage 1 changes no Feature-ID arithmetic.
- `MOB-01` is installed product/architecture authority, not a silently completed tracker feature.
- `governance/four-lens-requirements.json` remains frozen; Stage 1 does not mutate its baseline or digest.

## Mobile Exchange Stage 1

| Field | Current state |
| --- | --- |
| Activation epoch | `mobile-exchange-stage1-2026-08-16` |
| Packet | `WP-MOBILE-EXCHANGE-STAGE1-01` |
| Exact activation base | `0b23a9f9b49468aab12609dea6116e1409c925fe` |
| Control Room PR | `#217` |
| Controlling authority | `docs/program/MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md` |
| Composition reference | `docs/reference/screenshots/rfxchange-mobile-composition-reference.jpg` |
| Control document | `docs/program/MOBILE_EXCHANGE_STAGE_1_ARCHITECTURE_LOCK.md` |
| Machine ledger | `governance/mobile-exchange-stage1.json` |
| Lane 01 candidate | PR `#218` at `cf73a656dba4c09e735ac991cab557ecc2a22943` |
| Candidate build | production-ci #1492 — **IN PROGRESS** |
| Candidate disposition | `Implemented — Not Verified`; substantive findings unresolved |
| Current state | **Active — candidate correction and cross-lens review** |
| Stage 1 exit gate | **Not satisfied** |
| Stage 2 authorization | **Not granted** |

### Locked composition

```text
map-first canvas
+ floating search/filter
+ persistent bottom four-lens navigation
+ draggable peek/partial/expanded sheet
+ four active-lens actions at the sheet top
+ result/business cards with optional media, favorites, and record actions
+ marker/card/detail synchronization
+ continuity across lens changes
```

Permanent mobile lens order:

```text
Opportunities/RFx | Resources | Intelligence | Referrals
```

Account/Menu is a utility, not a fifth lens.

## Phase 2 compatibility foundation

- PR #191 merged the persistent four-lens controller and frozen sixteen-action registry.
- PR #212 merged the bounded `New Referral` truth correction.
- Current action projection preserves exactly four positions per lens and distinguishes `operational`, `applicable`, `authorized`, disabled presentation, and truthful handler availability.
- The current registry remains eight active-capable and eight individually gray/non-operational positions under current runtime/authorization.
- Stage 1 may not rename/reorder the sixteen actions or weaken authorization, progressive availability, selected-object continuity, or map continuity.

## Stage 1 lane matrix

| Lane | Role | Exact current state | Shared-path write authority |
| --- | --- | --- | --- |
| 00 — Control Room | packet, convergence, findings, exit decision | PR #217 records current candidate and findings | Governance/program artifacts only |
| 01 — Shared Exchange Platform | shared contract implementation | PR #218 at `cf73a656…`; continuity correction added; CI pending | Yes, within packet-owned contract/type/test paths |
| 02 — Opportunities/RFx | architecture consumer/reviewer | FINDING at `3c67ef3d…`; re-review current/final head | No private mobile framework |
| 03 — Intelligence | architecture consumer/reviewer | Review not submitted | No private mobile framework |
| 04 — Resources | architecture consumer/reviewer | Review not submitted | No private mobile framework |
| 05 — Referrals | architecture consumer/reviewer | Review not submitted | No private mobile framework |
| 06 — Independent Acceptance | optional assurance | Not required for Stage 1 closure | No production code |
| 07 — Integration / Cross-Lens QA | later integrated behavior | Standby; Stage 2 unauthorized | No Stage 1 shared implementation |

## Current candidate correction

The current Lane 01 head adds `mobile-exchange-continuity.ts` with:

- versioned session/participant/membership/viewer-organization/geography scope;
- typed scope/schema/selected-object invalidation reasons;
- fail-closed selected-object narrowing;
- safe return context;
- safe-area, non-drag sheet control, keyboard/switch access, focus restoration, reduced-motion, and orientation continuity policy.

This is a bounded Stage 1 architecture correction. It does not implement UI. It partially addresses `MOB1-FIND-00-002` and `MOB1-FIND-02-002`; it does not resolve them because result-set identity/cursor, internal sheet/detail scroll state, focused negative tests, and the restored-geography authority correction remain absent.

## Shared contract status

| Contract | Current state | Convergence blocker |
| --- | --- | --- |
| shell composition | Candidate present | Final-head reviews incomplete |
| bottom four-lens navigation | Candidate present | Final-head reviews incomplete |
| three-position bottom sheet | Partially represented | `MOB1-FIND-00-002` |
| four-position action rail | Candidate present | `MOB1-FIND-00-004` |
| result/business card | Candidate present | `MOB1-FIND-00-003`, `MOB1-FIND-02-001` |
| media | Candidate present | `MOB1-FIND-02-003` |
| favorites | Candidate present | Final-head reviews incomplete; Lane 02 domain note applies |
| selected-object state | Candidate present | `MOB1-FIND-00-003`, `MOB1-FIND-02-001` |
| map projection | Candidate present | `MOB1-FIND-00-003`, `MOB1-FIND-00-005` |
| detail state | Partially represented | `MOB1-FIND-00-002`, `MOB1-FIND-00-003` |
| continuity/invalidation | Partially represented | `MOB1-FIND-00-002`, `MOB1-FIND-02-002`, `MOB1-FIND-00-005` |
| disabled explanation copy | Invalid namespace remains | `MOB1-FIND-00-006` |
| completion governance | Candidate doc conflicts | `MOB1-FIND-00-001` |

## Current findings

### Control Room findings

| Finding | State at `cf73a656…` | Required correction |
| --- | --- | --- |
| `MOB1-FIND-00-001` | Open | Remove the mandatory Independent Acceptance prerequisite. |
| `MOB1-FIND-00-002` | Partially addressed; open | Add result-set/cursor, internal scroll, and focused continuity/accessibility tests. |
| `MOB1-FIND-00-003` | Open | Enforce marker/card/detail focal identity and internal subject consistency. |
| `MOB1-FIND-00-004` | Open | Validate action-rail input against the frozen canonical action ID per lens/position. |
| `MOB1-FIND-00-005` | Open | Do not label browser-restored geography server-authoritative before revalidation. |
| `MOB1-FIND-00-006` | Open | Use the canonical supported-locale key contract for disabled explanations. |
| `BUILD-FIND-218-001` | Resolved on prior head | Whitespace fixed; production-ci #1483 succeeded at `3c67ef3d…`. |

All four Codex threads remain unresolved, current, and mapped to `MOB1-FIND-00-002`, `003`, `005`, and `006`.

### Lane 02 findings

| Finding | State at `cf73a656…` | Required shared correction |
| --- | --- | --- |
| `MOB1-FIND-02-001` | Open | Keep focal opportunity identity distinct from associated issuer-organization identity. |
| `MOB1-FIND-02-002` | Partially addressed; open | Add scope-mismatch/authority negative tests and resolve restored-geography authority. |
| `MOB1-FIND-02-003` | Open | Represent actual optional video separately from a poster image. |

No Shared Contract Request is needed because these remain bounded candidate corrections.

## Domain review state

| Lane | Review disposition | Review SHA | Current-head requirement |
| --- | --- | --- | --- |
| 02 | FINDING | `3c67ef3dffeaa60aef761debb6cf76ea1c807789` | Re-review final head; prior findings remain applicable. |
| 03 | Not submitted | — | Review final exact head. |
| 04 | Not submitted | — | Review final exact head. |
| 05 | Not submitted | — | Review final exact head. |

A concurrence applies only to an exact candidate SHA. No conversation relay or private shared implementation is accepted.

## Parallel-write control

- Lane 01 alone modifies the shared mobile contract/type/test surface.
- Lanes 02–05 file `MOB1-FIND-*` or `SCR-<lane>-MOB1-*` on or linked from PR #218.
- Domain lanes must not create private shells, navigation, sheets, cards, selection frameworks, action rails, favorites, media frameworks, or continuity stores.
- Unrelated PR #210 (`DSC-006`) does not own Stage 1 shared mobile paths.

## Stage 1 exit decision

**NOT SATISFIED.**

The authority/reference are installed and the candidate has advanced, but six Control Room findings, three Lane 02 findings, four unresolved Codex threads, pending exact-head CI, and missing final-head reviews from Lanes 02–05 prevent convergence.

## Exact next action

Lane 01 completes the remaining shared corrections and focused evidence on PR #218 without entering Stage 2 UI, records exact-SHA dispositions, and obtains green CI on the final head. Lanes 02–05 then review or re-review that exact head. Stage 2 remains unauthorized.