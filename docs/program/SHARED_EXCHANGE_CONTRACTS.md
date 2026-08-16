# Shared Exchange Contracts

**Owner:** Lane 01 — Shared Exchange Platform

**Optional assurance owner:** Lane 06 — Independent Acceptance

**Integration owner:** Lane 07 — Integration / Cross-Lens QA

This registry identifies behavior that must remain one shared Exchange contract rather than diverging across lenses. A domain lane consumes the shared contract; it does not clone it.

`FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md` supersedes older language that made Lane 06 review a universal completion prerequisite. Independent Acceptance remains available as optional assurance. Shared contract completion still requires implementation evidence, applicable checks, satisfied dependencies/ownership, durable disposition of material findings and no known material unresolved defect.

## Owned contract families

| Contract | Stable requirements / authority | Shared owner | Domain consumers |
| --- | --- | --- | --- |
| Participant shell and lens registry | `SHARED-TRUTH-*`, `SHARED-LENS-CONTEXT-*`, `SHARED-TRANSITION-*` | Lane 01 | Lanes 02–05 |
| Spatial context and invalidation | `SHARED-SPATIAL-*`, `SHARED-CAMERA-*`, `SHARED-VIEW-*` | Lane 01 | Lanes 02–05 |
| Selected-object and marker grammar | `SHARED-SELECTION-*`, `SHARED-MARKER-*`, `SHARED-CLUSTER-*`, `SHARED-IDENTITY-*` | Lane 01 | Lanes 02–05 |
| Result drawer/sheet and search/filter grammar | `SHARED-DRAWER-*`, `SHARED-RESULT-*`, `SHARED-SEARCH-*` | Lane 01 | Lanes 02–05 |
| Cross-lens continuation and safe return | `SHARED-CONTINUITY-*`, `SHARED-RETURN-*` | Lane 01 | Lanes 02–05 |
| Lens-level action projection | `SHARED-ACTIONS-*`; `EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md` | Lane 01 with domain-owned eligibility inputs | Lanes 02–05 |
| Record cards, media, favorites and record actions | `MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md`; Stage 1 packet | Lane 01 contracts; domain-owned facts/operations | Lanes 02–05 |
| Mobile shell, persistent bottom navigation and three-position sheet | `MOB-01`; `MOBILE_EXCHANGE_STAGE_1_ARCHITECTURE_LOCK.md` | Lane 01 | Lanes 02–05 |
| Account utility and optional Administration | `SHARED-ACCOUNT-*` | Lane 01 | all participant lanes |
| Truthful copy, accessibility, locales and performance | `SHARED-COPY-*`, `SHARED-PRIVACY-*`, `SHARED-A11Y-*`, `SHARED-I18N-*`, `SHARED-PERF-*` | Lane 01 | Lanes 02–05 |

Shared client state is always non-authorizing. Domain inputs such as provider status, RFx lifecycle, referral access, publication visibility, favorite ownership, media visibility and organization membership remain server-authoritative and domain-owned.

## Mobile Stage 1 shared contract boundary

For `WP-MOBILE-EXCHANGE-STAGE1-01`, Lane 01 owns one converged interface family for:

- mobile shell composition;
- exact four-lens bottom navigation;
- three-position bottom sheet;
- the four-position active-lens action rail;
- result/business cards;
- optional media projection;
- record favorites;
- record-specific actions;
- generic selected organization/record/marker state;
- map camera/bounds and record projection;
- detail context;
- continuity across lens, sheet, list, map and detail transitions.

The existing sixteen action identities remain the lens-level registry. Record actions are a separate extension family and must not consume or rename those positions.

Lanes 02–05 may provide domain facts and representative record models. During Stage 1 they may not create a private mobile shell, navigation, bottom sheet, card framework, selection framework, action rail, favorite implementation, media framework or continuity implementation.

## Shared Contract Request

A request is a durable GitHub record with:

- request ID `SCR-<lane>-<sequence>` or, for Mobile Stage 1, `SCR-<lane>-MOB1-<sequence>`;
- requesting lane and exact candidate/base SHA;
- affected stable requirement IDs or controlling authority section;
- participant problem and desired generalized behavior;
- current shared seam inspected;
- domain-specific facts supplied by the requester;
- security/privacy/authority constraints;
- consumers and compatibility impact;
- proposed checks or evidence;
- explicit non-scope; and
- requested dependency date or merge order.

The post-amendment flow is:

```text
domain lane records need on the shared candidate PR
→ Lane 01 decides whether generalized support is warranted
→ Control Room confirms or adjusts the exact-base packet
→ Lane 01 implements/reconciles the shared contract
→ domain consumers review the exact candidate through GitHub
→ findings receive durable dispositions
→ applicable checks and exact-head CI pass
→ Control Room may close/merge under current completion governance
→ optional Lane 06 assurance may occur separately
→ dependent lanes consume the merged contract
```

If an existing seam is sufficient, the request closes with the reuse decision and no new shared implementation.

## Mobile Stage 1 finding protocol

Substantive findings against the Lane 01 candidate use `MOB1-FIND-<lane-number>-<sequence>` and record:

- exact candidate PR and SHA;
- affected contract;
- representative domain record/journey;
- conflict with an authority or required capability;
- impact on security, privacy, accessibility, map/selection parity or continuity;
- smallest shared correction needed; and
- explicit non-scope.

Allowed dispositions are:

- `accepted-shared-correction`;
- `reuse-existing-shared-seam`;
- `domain-fact-no-shared-change`;
- `deferred-explicitly-approved`;
- `rejected-conflicts-with-authority`;
- `superseded-by-candidate-sha`.

The detailed candidate-review template, current review assignments and convergence ledger are in `MOBILE_EXCHANGE_STAGE_1_ARCHITECTURE_LOCK.md`.

## Ownership constraints

- Participant navigation, global lens order, Account utility, generic organization/record marker grammar, generic spatial state, generic card/detail projection, generic drawer/sheet and cross-lens context are not domain-lane private code.
- A domain lane may render domain-specific objects and actions through shared extension points without moving its authorization logic into the client.
- A cross-geography or privacy-suppressed domain object does not receive a fabricated coordinate to satisfy a shared visual contract.
- New shared persistence fields require versioning, scope, invalidation and backward-compatibility decisions.
- A gray/disabled action remains presentation, never the security boundary.
- A shared contract may be reported `Implemented — Not Verified` without mandatory Lane 06 review when current completion governance is otherwise satisfied.

## Current requests and convergence state

Mobile Stage 1 is active under `WP-MOBILE-EXCHANGE-STAGE1-01` from base `0b23a9f9b49468aab12609dea6116e1409c925fe`.

- Lane 01 candidate: not yet opened.
- Lanes 02–05: waiting to review the same exact Lane 01 candidate through GitHub.
- Mobile Stage 1 shared findings: none filed because no candidate exists.
- Stage 1 exit gate: not satisfied.

Historical Shared Contract Requests remain governed by their original records and later dispositions; this Stage 1 activation does not silently reopen them.