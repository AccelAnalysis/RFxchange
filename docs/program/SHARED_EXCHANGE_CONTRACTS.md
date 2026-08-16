# Shared Exchange Contracts

**Owner:** Lane 01 — Shared Exchange Platform

**Optional assurance owner:** Lane 06 — Independent Acceptance

**Integration owner:** Lane 07 — Integration / Cross-Lens QA

This registry identifies behavior that must remain one shared Exchange contract rather than diverging across lenses. A domain lane consumes the shared contract; it does not clone it.

`FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md` supersedes older language that made Lane 06 review a universal completion prerequisite. Independent Acceptance remains optional assurance. Shared contract completion still requires implementation evidence, applicable checks, satisfied dependencies/ownership, durable disposition of material findings, and no known material unresolved defect.

## Owned contract families

| Contract | Stable requirements / authority | Shared owner | Domain consumers |
| --- | --- | --- | --- |
| Participant shell and lens registry | `SHARED-TRUTH-*`, `SHARED-LENS-CONTEXT-*`, `SHARED-TRANSITION-*` | Lane 01 | Lanes 02–05 |
| Spatial context and invalidation | `SHARED-SPATIAL-*`, `SHARED-CAMERA-*`, `SHARED-VIEW-*` | Lane 01 | Lanes 02–05 |
| Selected-object and marker grammar | `SHARED-SELECTION-*`, `SHARED-MARKER-*`, `SHARED-CLUSTER-*`, `SHARED-IDENTITY-*` | Lane 01 | Lanes 02–05 |
| Result drawer/sheet and search/filter grammar | `SHARED-DRAWER-*`, `SHARED-RESULT-*`, `SHARED-SEARCH-*` | Lane 01 | Lanes 02–05 |
| Cross-lens continuation and safe return | `SHARED-CONTINUITY-*`, `SHARED-RETURN-*` | Lane 01 | Lanes 02–05 |
| Lens-level action projection | `SHARED-ACTIONS-*`; `EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md` | Lane 01 with domain-owned eligibility inputs | Lanes 02–05 |
| Record cards, media, favorites, and record actions | `MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md`; Stage 1 packet | Lane 01 contracts; domain-owned facts/operations | Lanes 02–05 |
| Mobile shell, persistent bottom navigation, and three-position sheet | `MOB-01`; `MOBILE_EXCHANGE_STAGE_1_ARCHITECTURE_LOCK.md` | Lane 01 | Lanes 02–05 |
| Account utility and optional Administration | `SHARED-ACCOUNT-*` | Lane 01 | all participant lanes |
| Truthful copy, accessibility, locales, and performance | `SHARED-COPY-*`, `SHARED-PRIVACY-*`, `SHARED-A11Y-*`, `SHARED-I18N-*`, `SHARED-PERF-*` | Lane 01 | Lanes 02–05 |

Shared client state is always non-authorizing. Domain inputs such as RFx lifecycle, provider status, referral access, publication visibility, favorite ownership, media visibility, organization membership, and geography authority remain server-authoritative and domain-owned.

## Mobile Stage 1 shared contract boundary

For `WP-MOBILE-EXCHANGE-STAGE1-01`, Lane 01 owns one converged interface family for:

- mobile shell composition;
- exact four-lens bottom navigation;
- three-position bottom sheet;
- four active-lens action positions;
- result/business cards;
- optional image and video media;
- record favorites and record-specific actions;
- focal selected organization/record/marker plus truthful associated-organization context;
- map camera/bounds and record projection;
- detail/safe-return context;
- scoped continuity and fail-closed reconciliation across lens, sheet, list, map, and detail transitions.

The existing sixteen action identities remain the lens-level registry. Record actions are a separate extension family and must not consume or rename those positions.

Lanes 02–05 may provide domain facts and representative record models. During Stage 1 they may not create a private mobile shell, navigation, bottom sheet, card framework, selection framework, action rail, favorite implementation, media framework, or continuity implementation.

## Shared Contract Request

A request is a durable GitHub record with:

- request ID `SCR-<lane>-<sequence>` or `SCR-<lane>-MOB1-<sequence>`;
- requesting lane and exact candidate/base SHA;
- affected authority/requirement;
- participant problem and generalized behavior;
- existing shared seam inspected;
- domain facts supplied by the requester;
- security/privacy/authority constraints;
- consumers and compatibility impact;
- proposed checks/evidence;
- explicit non-scope; and
- requested dependency/merge order.

The current flow is:

```text
domain lane records need on the Lane 01 PR
→ Lane 01 proposes the shared correction
→ Control Room reviews exact head and records disposition
→ domain consumers review the same exact head through GitHub
→ applicable checks and exact-head CI pass
→ Control Room may close/merge under current completion governance
→ optional Lane 06 assurance may occur separately
```

If an existing seam is sufficient, the request closes with the reuse decision and no new implementation.

## Mobile Stage 1 finding protocol

Substantive findings use `MOB1-FIND-<lane-number>-<sequence>` and record exact candidate, affected contract, representative journey, authority conflict, impact, smallest shared correction, and explicit non-scope.

Allowed dispositions are:

- `accepted-shared-correction`;
- `reuse-existing-shared-seam`;
- `domain-fact-no-shared-change`;
- `deferred-explicitly-approved`;
- `rejected-conflicts-with-authority`;
- `superseded-by-candidate-sha`.

The detailed review template and convergence ledger are in `MOBILE_EXCHANGE_STAGE_1_ARCHITECTURE_LOCK.md`.

## Ownership constraints

- Global lens order, Account utility, generic marker/card/detail grammar, generic spatial state, drawer/sheet behavior, and cross-lens continuity are not domain-lane private code.
- Focal record identity and associated organization identity remain separately truthful when they are different market objects.
- A domain lane supplies facts/actions through shared extension points without moving authorization into the client.
- Privacy-suppressed records do not receive fabricated coordinates.
- Browser-restored geography remains unvalidated until an authoritative server projection revalidates it.
- New persistence fields require versioning, scope, invalidation, and backward compatibility.
- Disabled presentation is never the security boundary, and explanation keys must resolve in every supported locale.
- A shared contract may be reported `Implemented — Not Verified` without mandatory Lane 06 review when current completion governance is otherwise satisfied.

## Current Stage 1 state

- Control Room packet: PR #217.
- Lane 01 candidate: PR #218 at `cf73a656dba4c09e735ac991cab557ecc2a22943`.
- Candidate disposition: `Implemented — Not Verified`.
- Production-ci #1492: in progress.
- Lane 02 reviewed prior head `3c67ef3d…` with FINDING and must re-review the current/final head.
- Lanes 03–05 have not submitted reviews.
- Stage 1 exit gate: not satisfied.
- Stage 2: not authorized.

The current head adds a bounded continuity module with versioned participant/membership/viewer-organization/geography scope, typed invalidation reasons, fail-closed selected-object narrowing, safe return context, and accessibility/responsive policy facts. This partially addresses continuity findings but does not resolve the remaining conflicts.

### Control Room findings

| Finding | State | Required shared disposition |
| --- | --- | --- |
| `MOB1-FIND-00-001` | Open | Remove the candidate's mandatory Independent Acceptance prerequisite. |
| `MOB1-FIND-00-002` | Partially addressed; open | Add result-set identity/cursor, internal scroll state, and focused continuity/accessibility tests. |
| `MOB1-FIND-00-003` | Open | Enforce focal marker/card/detail identity and internal subject parity. |
| `MOB1-FIND-00-004` | Open | Bind action-rail inputs to canonical lens/position action IDs. |
| `MOB1-FIND-00-005` | Open | Treat restored geography as unvalidated until server revalidation. |
| `MOB1-FIND-00-006` | Open | Reuse/install the canonical supported-locale disabled-reason contract. |
| `BUILD-FIND-218-001` | Resolved on `3c67ef3d…` | Whitespace corrected and production-ci #1483 succeeded. |

All four Codex threads remain unresolved and current.

### Lane 02 findings

| Finding | State | Required shared disposition |
| --- | --- | --- |
| `MOB1-FIND-02-001` | Open | Preserve distinct focal opportunity and issuer-organization identities. |
| `MOB1-FIND-02-002` | Partially addressed; open | Add mismatch/authority negative tests and resolve geography authority labeling. |
| `MOB1-FIND-02-003` | Open | Represent actual optional video separately from its poster image. |

No Shared Contract Request is open because all current findings remain bounded corrections to PR #218.

Historical Shared Contract Requests remain governed by their original records and later dispositions; this activation does not silently reopen them.