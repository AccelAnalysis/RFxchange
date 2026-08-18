# Four-Lens Experience Ledger

The canonical machine ledger is [`../../governance/four-lens-requirements.json`](../../governance/four-lens-requirements.json). It contains every stable record's original requirement, source, owner, dependent lanes, dependencies, acceptance types, status, implementation identity, independent acceptance, clarification and deferral. This document is the human program view; it never replaces original source authority.

## Status meaning

Under `FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md`, `Implemented — Not Verified` may be terminal completion when its implementation/evidence/dependency/material-defect rule is satisfied. `Verified` is a separate optional independent-assurance label. Blocked, deferred, N/A, implemented, merged, released, live and Verified remain distinct facts.

## Denominators

| Experience | Stable range | Denominator | Current characterization |
| --- | --- | ---: | --- |
| Shared Exchange | `SHARED-*`, shared `MOB36-*` | 36 | 20 implemented/not verified, one in progress, eight not started, three blocked, four explicitly deferred/N/A |
| Opportunities/RFx | `RFX-FEATURE-*`, `MOB36-OPPORTUNITIES-*` | 42 | 23 implemented/not verified, 19 not started |
| Resources | `RES-LENS-*`, `MOB36-RESOURCES-*` | 13 | eight implemented/not verified, three not started, two blocked |
| Intelligence | `INTEL-*`, `MOB36-INTELLIGENCE-*` | 15 | three implemented/not verified, seven not started, five dependency-blocked |
| Capabilities | `MOB36-CAPABILITIES-*` | 3 | three not started |
| Referrals Cross-Lens | `REF-LENS-*`, `MOB36-REFERRAL-*` | 14 | ten implemented/not verified, three not started, one explicitly N/A |
| Integration | integration-owned `MOB36-*` | 5 | five not started |

The append-only program denominator is 128 requirements. The original 106 records remain immutable and in order. The delivery matrix displays cross-cutting `SHARED-EVIDENCE-001` with Shared Exchange because that is the candidate where the procedural gap occurred.

## Shared Exchange register

| Requirement | Status | Governing intent / disposition |
| --- | --- | --- |
| `SHARED-TRUTH-001` | Not Applicable — Explicitly Approved | Historical Referrals-ending hierarchy remains immutable; product-owner PR #225 supplies `MOB36-LENS-001` as the current successor. |
| `SHARED-LENS-CONTEXT-001` | Not Applicable — Explicitly Approved | Historical Phase 2 container target remains immutable; `MOB36-LENS-001` and `MOB36-MIGRATION-001` govern the successor. |
| `SHARED-TRANSITION-001` | Implemented — Not Verified | Current workspace remains through warm transition. |
| `SHARED-LIFECYCLE-001` | Implemented — Not Verified | One stage-aware participant continuation resolver. |
| `SHARED-SPATIAL-001`–`002` | Implemented — Not Verified | Versioned, scoped, non-authorizing continuity and invalidation. |
| `SHARED-VIEW-001`, `SHARED-CAMERA-001` | Implemented — Not Verified | Settled map view and non-replaying camera behavior. |
| `SHARED-MARKER-001`–`002`, `SHARED-CLUSTER-001` | Implemented — Not Verified | Home/compact/selected/cluster hierarchy without anchor drift. |
| `SHARED-SELECTION-001` | Implemented — Not Verified | One selected organization across map/list/detail. |
| `SHARED-DRAWER-001`, `SHARED-SEARCH-001` | Implemented — Not Verified | Shared drawer/sheet and search/filter grammar. |
| `SHARED-RESULT-001` | Deferred — Explicitly Approved | Current Network backend has a page contract; the post-#159 authority prohibited invented cursor semantics. |
| `SHARED-CONTINUITY-001` | Not Applicable — Explicitly Approved | Its permanent-Referrals transition target is superseded by the current query/detail and cross-lens referral return requirements. |
| `SHARED-CONTINUITY-002` | Implemented — Not Verified | PR #186 candidate `6f160d84dd0f702e8546cbb421c17b2f3ac56dbd` corrected the PR #160 query-link loss and merged as `10150e66b4a1b37a0cda5381986c5599da96e632`; independent acceptance remains pending. |
| `SHARED-RETURN-001` | Implemented — Not Verified | Explicit safe return context. |
| `SHARED-ACCOUNT-001` | Implemented — Not Verified | Circular avatar trigger and authorized utility menu. |
| `SHARED-ACTIONS-001` | Implemented — Not Verified | Shared lens-aware organization action projection. |
| `SHARED-COPY-001` | Implemented — Not Verified | Internal-language suppression. |
| `SHARED-PRIVACY-001` | Blocked | Original authority prefers locality-only/no copy over `Near`; current reconciliation records `Near`. Explicit policy decision required. |
| `SHARED-PRIVACY-002` | Implemented — Not Verified | Truthful discoverability without a fabricated precise marker. |
| `SHARED-IDENTITY-001` | Blocked | Initials are implemented, but no independently accepted Network public-logo projection/delivery contract exists. |
| `SHARED-A11Y-001`, `SHARED-I18N-001` | Implemented — Not Verified | Accessibility/responsive and five-locale behavior await independent program acceptance. |
| `SHARED-EVIDENCE-001` | Blocked | PR #160 merged after a substantive final-head reviewer finding; prior evidence remains implementation evidence, not program certification. |

Details and evidence live in [`SHARED_EXPERIENCE_COMPLETION_BACKLOG.md`](SHARED_EXPERIENCE_COMPLETION_BACKLOG.md).

## Opportunities/RFx register

All 41 canonical Feature IDs are retained once as `RFX-FEATURE-<ID>` without renaming the tracker ID.

| Slice | Program records | Status |
| --- | --- | --- |
| 4.1 | `ISS-001`, `ISS-002`, `ISS-003` | Previously accepted — independent assurance pending |
| 4.2 | `ISS-005`, `ISS-006` | Previously accepted — independent assurance pending |
| 4.3 | `ISS-007`, `ISS-009`, `ISS-011` | Previously accepted — independent assurance pending |
| 4.4 | `ISS-016`, `ISS-018`, `ISS-019`, `ISS-020`, `ACQ-009` | Previously accepted — independent assurance pending |
| 4.5 | `DSC-004`, `DSC-005`, `DSC-006`, `DSC-007`, `DSC-008` | Previously accepted — independent assurance pending |
| 4.6 | `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004`, `RSP-006` | Preserved candidate; implemented/not verified; substantive findings remain |
| 4.7 | `DSC-010`, `RSP-007`, `RSP-008`, `TEM-001`–`004`, `ACQ-007` | Not Started; ineligible until accepted 4.6 merges |
| 4.8 | `RSP-009`, `RSP-010`, `RSP-017` | Not Started |
| 4.9 | `RSP-018`–`021` | Not Started |
| 4.10 | `EDU-011`–`013` | Not Started |

See [`WAVE_4_ASSURANCE_LEDGER.md`](WAVE_4_ASSURANCE_LEDGER.md).

## Resources register

`RES-LENS-001`–`008` retain existing provider/resource implementation as unverified program evidence. `RES-LENS-009` resource saving and `RES-LENS-010` participant request tracking need inventory/implementation decisions. `RES-LENS-011` is blocked on the shared logo contract, and `RES-LENS-012` remains blocked until all prior records are independently accepted.

See [`RESOURCES_REFERRALS_COMPLETION_INVENTORY.md`](RESOURCES_REFERRALS_COMPLETION_INVENTORY.md).

## Intelligence register

`INTEL-LENS-001`, `INTEL-ORG-001` and `INTEL-MARKET-001` capture the existing analytical lens/Network foundation. Configurable layers, first-party/proprietary layers, Location Intelligence, Site & Facility Intelligence and analytical controls are Not Started. RFx, Resource, Referral and outcome intelligence remain blocked on independently accepted source domains; provenance inventory blocks every new layer.

See [`INTELLIGENCE_PROGRAM_ROADMAP.md`](INTELLIGENCE_PROGRAM_ROADMAP.md).

## Capabilities register

`MOB36-CAPABILITIES-001`, `MOB36-CAPABILITIES-AMACS-001`, and `MOB36-CAPABILITIES-MATCH-001` govern the substantive fourth lens. They require organization-profile reuse, confirmed AMACS-backed assertions, evidence/verification separation, manual browse/search, non-authoritative assistance, comparison, explainable RFx matching, gaps, and real domain actions.

## Referrals Cross-Lens register

`REF-LENS-001`–`011` retain existing referral-domain implementation as program evidence. `MOB36-REFERRAL-CROSS-LENS-001` and `MOB36-REFERRAL-MENU-001` govern the successor cross-lens/Menu experience. The whole-lens-only `REF-LENS-012` is historical and receives an explicit successor/N/A disposition rather than being deleted.

## Ledger change rules

- Stable IDs and original requirement text are append-only.
- A clarification never replaces the original requirement.
- A builder may record `Implemented — Not Verified` only with the current completion evidence and material-finding discipline.
- Only Lane 06 evidence can support the optional `Verified` label.
- A deferral record is invalid without every mandatory field and explicit approval.
- Denominator changes require a source-linked new record or an explicitly approved Not Applicable disposition; deletion is prohibited.
