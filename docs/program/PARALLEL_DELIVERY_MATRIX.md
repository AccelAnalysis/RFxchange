# Four-Lens Parallel Delivery Matrix

**Canonical volatile program-status source**

**Snapshot basis:** merged `main` `0b23a9f9b49468aab12609dea6116e1409c925fe` on 2026-08-16

**Current task:** Stage 1 — Lock the Mobile Exchange Architecture

**Update rule:** Control Room recalculates this document from current merged `main` after every program-state change.

The Master Build Tracker remains the Feature-ID authority. This matrix does not rewrite tracker arithmetic, create a `MOB-01` Feature ID, or make Independent Acceptance a universal completion prerequisite.

## Current completion governance

`FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md` is the controlling completion authority where older program text conflicts.

- Implementation, merge/release, and optional independent assurance are separate facts.
- A bounded packet may close as `Implemented — Not Verified` when implementation evidence, applicable checks, dependencies, ownership, and durable disposition of material findings are sufficient.
- No known material security, privacy, tenancy, authority, integrity, accessibility, or continuity defect may be ignored.
- Lane 06 remains available for optional assurance; it is not a universal Stage 1 gate.

## Experience completion

The current frozen Four-Lens requirement baseline remains unchanged by this Stage 1 coordination packet.

| Experience | Requirement denominator | Verified | In Progress | Implemented — Not Verified | Not Started | Blocked | Explicitly deferred/N/A |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Shared Exchange | 27 | 0 | 0 | 22 | 1 | 3 | 1 |
| Opportunities/RFx | 41 | 0 | 0 | 23 | 18 | 0 | 0 |
| Resources | 12 | 0 | 0 | 8 | 2 | 2 | 0 |
| Intelligence | 14 | 0 | 0 | 3 | 6 | 5 | 0 |
| Referrals | 12 | 0 | 0 | 10 | 1 | 1 | 0 |
| Program total | 106 | 0 | 0 | 66 | 28 | 11 | 1 |

No percentage is inferred from these requirement-status counts. Stage 1 is a cross-cutting architecture-convergence packet and does not alter this baseline.

## Canonical tracker comparison

- Master Build Tracker: **438 total · 170 Done · 268 Not Started**.
- Stage 1 changes no Feature-ID arithmetic.
- `MOB-01` is installed product/architecture authority, not a silently completed tracker feature.
- `governance/four-lens-requirements.json` remains the frozen Four-Lens requirement baseline; Stage 1 does not mutate its baseline or digest.

## Mobile Exchange Stage 1

| Field | Current state |
| --- | --- |
| Activation epoch | `mobile-exchange-stage1-2026-08-16` |
| Packet | `WP-MOBILE-EXCHANGE-STAGE1-01` |
| Exact activation base | `0b23a9f9b49468aab12609dea6116e1409c925fe` |
| Control Room PR | `#217` — draft, exact-head CI correction in progress |
| Controlling authority | `docs/program/MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md` |
| Visual/composition reference | `docs/reference/screenshots/rfxchange-mobile-composition-reference.jpg` |
| Control document | `docs/program/MOBILE_EXCHANGE_STAGE_1_ARCHITECTURE_LOCK.md` |
| Lane 01 branch | `lane01/mobile-exchange-stage1-contracts` |
| Lane 01 candidate | PR `#218` at `16c7b3b0131cfde1ba23119831ee1b3dab3a7942` |
| Candidate disposition | `Implemented — Not Verified`; exact head has unresolved findings and failed CI |
| Current state | **Active — candidate correction and cross-lens review pending** |
| Stage 1 exit gate | **Not satisfied** |
| Stage 2 authorization | **Not granted** |

### Locked composition

The mobile target is already established and must not be reduced to generic reachability:

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

Exchange Room Phase 2 is no longer an active unmerged packet.

- PR #191 merged the persistent four-lens controller and frozen sixteen-action registry.
- PR #212 merged the bounded `New Referral` action-truth correction.
- Current action projection preserves exactly four positions per lens and distinguishes `operational`, `applicable`, `authorized`, disabled presentation, and truthful handler availability.
- The current registry truth is eight active-capable and eight individually gray/non-operational positions under current runtime/authorization.
- Phase 2 remains a compatibility foundation for Stage 1; Stage 1 may not rename/reorder the sixteen actions or weaken authorization, progressive availability, selected-object continuity, or map continuity.

## Current Stage 1 lane matrix

| Lane | Stage 1 role | Exact assignment | Current state | Shared-path write authority |
| --- | --- | --- | --- | --- |
| 00 — Control Room | activation, packet, convergence, and dispositions | publish exact base, lane boundary, review protocol, findings ledger, and exit decision | PR #217 open; reconciling live candidate/findings | Governance/program artifacts only |
| 01 — Shared Exchange Platform | shared technical contract implementation | one bounded candidate covering shell, bottom nav, three-position sheet, action rail, cards, media, favorites, selection, map projection, detail, and continuity | PR #218 at `16c7b3b0…`; correction required | Yes, within packet-owned shared contract/type/test paths |
| 02 — Opportunities/RFx | architecture consumer/reviewer | review opportunity/RFx record/card/action/selection needs against exact Lane 01 candidate | Waiting for corrected exact head | No private mobile framework |
| 03 — Intelligence | architecture consumer/reviewer | review organization/capability/location/layer/map/provenance needs against exact Lane 01 candidate | Waiting for corrected exact head | No private mobile framework |
| 04 — Resources | architecture consumer/reviewer | review provider/resource/card/favorite/request needs against exact Lane 01 candidate | Waiting for corrected exact head | No private mobile framework |
| 05 — Referrals | architecture consumer/reviewer | review sent/received/recipient/starred needs against exact Lane 01 candidate | Waiting for corrected exact head | No private mobile framework |
| 06 — Independent Acceptance | optional assurance | may audit an exact candidate if separately activated | Not required for Stage 1 closure | No production code |
| 07 — Integration / Cross-Lens QA | later integrated behavior | Stage 2/integration work only after contracts and implementation exist | Standby | No Stage 1 shared implementation |

## Shared contract status

| Contract | Existing foundation | Lane 01 candidate | Current convergence state |
| --- | --- | --- | --- |
| shell | persistent Exchange Room exists | map-first shell contract added | Pending correction/domain review |
| bottom navigation | exact four-lens registry exists | persistent bottom-placement contract added | Pending domain review |
| bottom sheet | boolean panel continuity exists | `peek/partial/expanded` contract added | Finding `MOB1-FIND-00-002` open |
| four-position action rail | exact sixteen-position registry exists | tuple/adapter added | Finding `MOB1-FIND-00-004` open |
| result/business card | domain-specific projections exist in places | common card contract added | Finding `MOB1-FIND-00-003` open |
| media | organization/media data exists in places | optional media contract added | Pending domain review |
| favorites | domain relations exist in places | domain-owned favorite projection added | Pending domain review |
| selected-object state | selected organization/marker foundation exists | generic organization/record/marker state added | Finding `MOB1-FIND-00-003` open |
| map projection | geography/camera foundation exists | record/cluster/bounds projection added | Finding `MOB1-FIND-00-003` open |
| detail state | route/panel details exist in places | shared detail context/state added | Findings `MOB1-FIND-00-002` and `MOB1-FIND-00-003` open |
| continuity | version-1 participant spatial context exists | adapter/state contract added | Finding `MOB1-FIND-00-002` open |

## Candidate findings and CI

Exact candidate reviewed: PR #218 at `16c7b3b0131cfde1ba23119831ee1b3dab3a7942`.

| Finding | State | Required disposition |
| --- | --- | --- |
| `MOB1-FIND-00-001` | Open | Remove the reintroduced universal Independent Acceptance prerequisite and align with current completion governance. |
| `MOB1-FIND-00-002` | Open | Complete the responsive/continuity contract for result identity/cursor, internal scroll, safe-area, keyboard/orientation, reduced-motion/accessibility, and non-gesture sheet control without implementing Stage 2 UI. |
| `MOB1-FIND-00-003` | Open | Make marker/card/detail subject identity internally consistent and enforceable, with negative tests. |
| `MOB1-FIND-00-004` | Open | Validate the action-rail adapter against the frozen canonical action ID for each lens/position. |
| `BUILD-FIND-218-001` | Open | Remove trailing whitespace in the contract document and obtain green exact-head production CI. |

Production CI #1482 failed at whitespace integrity on the exact candidate. Later steps were skipped; the artifact-upload error is downstream of that early stop.

## Domain review state

All four domain lanes must review the same corrected exact Lane 01 PR head through GitHub using the template in `MOBILE_EXCHANGE_STAGE_1_ARCHITECTURE_LOCK.md`.

| Lane | Review state | Candidate SHA | Findings |
| --- | --- | --- | --- |
| 02 | Not submitted; wait for corrected candidate | — | None filed |
| 03 | Not submitted; wait for corrected candidate | — | None filed |
| 04 | Not submitted; wait for corrected candidate | — | None filed |
| 05 | Not submitted; wait for corrected candidate | — | None filed |

No domain concurrence exists. The Control Room findings above are substantive and prevent the Stage 1 exit gate from closing even before domain review.

## Parallel-write control

During Stage 1:

- Lane 01 alone may modify the shared mobile contract/type/test surface authorized by the packet.
- Lanes 02–05 submit `MOB1-FIND-*` findings or `SCR-<lane>-MOB1-*` requests on or linked from PR #218.
- A domain lane must not solve a shared deficiency by creating its own shell, navigation, bottom sheet, card framework, selection framework, action rail, favorite implementation, media framework, or continuity implementation.
- The unrelated open PR #210 (`DSC-006` durable opportunity alerts/digests) does not constitute a Stage 1 candidate and does not own shared mobile contract paths.

## Stage 1 exit decision

**NOT SATISFIED.**

The authority and composition reference are installed and Lane 01 has produced a candidate, but its exact head has four unresolved substantive Control Room findings, failed CI, and no domain reviews from Lanes 02–05.

## Exact next action

Lane 01 corrects `MOB1-FIND-00-001` through `MOB1-FIND-00-004` and `BUILD-FIND-218-001` on PR #218 without expanding into Stage 2 UI, then obtains green exact-head CI. Lanes 02–05 must then review that corrected exact SHA through GitHub. Stage 2 remains unauthorized.