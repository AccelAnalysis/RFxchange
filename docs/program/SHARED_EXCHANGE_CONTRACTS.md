# Shared Exchange Contracts

**Owner:** Lane 01 — Shared Exchange Platform

**Optional assurance owner:** Lane 06 — Independent Acceptance

**Integration owner:** Lane 07 — Integration / Cross-Lens QA

This registry identifies behavior that must remain one shared Exchange contract rather than diverging across lenses. A domain lane consumes the shared contract; it does not clone it.

`FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md` supersedes older language that made Lane 06 review a universal completion prerequisite. Independent Acceptance remains optional assurance. Shared contract completion still requires implementation evidence, applicable checks, satisfied dependencies/ownership, durable disposition of material findings, and no known material unresolved defect.

## Owned contract families

| Contract | Stable requirements / authority | Shared owner | Domain consumers |
| --- | --- | --- | --- |
| Participant shell and lens registry | `SHARED-TRUTH-*`, `SHARED-LENS-CONTEXT-*`, `SHARED-TRANSITION-*`; `MOBILE_EXCHANGE_STAGES_3_6_AUTHORITY.md` | Lane 01 | Opportunities, Resources, Intelligence, Capabilities, cross-lens Referrals |
| Spatial/query context and invalidation | `SHARED-SPATIAL-*`, `SHARED-CAMERA-*`, `SHARED-VIEW-*`, `MOB36-SHARED-QUERY-*` | Lane 01 | all participant domains |
| Selected-object and marker grammar | `SHARED-SELECTION-*`, `SHARED-MARKER-*`, `SHARED-CLUSTER-*`, `SHARED-IDENTITY-*` | Lane 01 | all participant domains |
| Result drawer/sheet and search/filter grammar | `SHARED-DRAWER-*`, `SHARED-RESULT-*`, `SHARED-SEARCH-*`, `MOB36-SHARED-RESULT-*` | Lane 01 | all participant domains |
| Cross-lens continuation and safe return | `SHARED-CONTINUITY-*`, `SHARED-RETURN-*`, `MOB36-REFERRAL-*` | Lane 01 | all participant domains |
| Lens-level action projection | `SHARED-ACTIONS-*`; `EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md`; successor action matrix | Lane 01 with domain-owned eligibility inputs | four permanent lenses |
| Record cards, media, favorites, and record actions | `MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md`; `MOBILE_EXCHANGE_STAGES_3_6_AUTHORITY.md` | Lane 01 contracts; domain-owned facts/operations | all participant domains |
| Mobile shell, persistent bottom navigation, and three-position sheet | `MOB-01` through `MOB-05`; successor lens migration | Lane 01 | four permanent lenses |
| Account utility and optional Administration | `SHARED-ACCOUNT-*` | Lane 01 | all participant lanes |
| Truthful copy, accessibility, locales, and performance | `SHARED-COPY-*`, `SHARED-PRIVACY-*`, `SHARED-A11Y-*`, `SHARED-I18N-*`, `SHARED-PERF-*` | Lane 01 | Lanes 02–05 |

Shared client state is always non-authorizing. RFx lifecycle, provider status, referral access, publication visibility, favorite ownership, media visibility, membership, and geography authority remain server-authoritative and domain-owned.

## Mobile Stage 1 boundary

For `WP-MOBILE-EXCHANGE-STAGE1-01`, Lane 01 owns one shared family for:

- mobile shell composition;
- exact four-lens bottom navigation;
- three-position sheet;
- four active-lens action positions;
- cards, optional image/video media, favorites, and record actions;
- focal selected object plus truthful associated-organization context;
- map projection, detail/safe-return context, and scoped continuity;
- fail-closed reconciliation across lens, sheet, list, map, and detail transitions.

The sixteen action identities remain the lens-level registry. Record actions remain a separate family. Lanes 02–05 may supply domain facts, but during Stage 1 they may not create private mobile shells, navigation, sheets, cards, selection frameworks, action rails, favorites, media frameworks, or continuity stores.

## Shared Contract Request

A request uses `SCR-<lane>-<sequence>` or `SCR-<lane>-MOB1-<sequence>` and records exact candidate/base, authority, participant problem, existing shared seam, domain facts, constraints, consumers, tests/evidence, non-scope, and dependency/merge order.

The current flow is:

```text
domain lane records need on the Lane 01 PR
→ Lane 01 proposes the shared correction
→ Control Room reviews the exact head and records disposition
→ domain consumers review the same exact head through GitHub
→ applicable checks and exact-head CI pass
→ Control Room may close/merge under current completion governance
→ optional Lane 06 assurance may occur separately
```

If an existing seam is sufficient, the request closes with the reuse decision.

## Mobile Stage 1 findings

Findings use `MOB1-FIND-<lane-number>-<sequence>`. Allowed dispositions are:

- `accepted-shared-correction`;
- `reuse-existing-shared-seam`;
- `domain-fact-no-shared-change`;
- `deferred-explicitly-approved`;
- `rejected-conflicts-with-authority`;
- `superseded-by-candidate-sha`.

The detailed review protocol and convergence ledger are in `MOBILE_EXCHANGE_STAGE_1_ARCHITECTURE_LOCK.md`.

## Ownership constraints

- Global lens order, Account utility, generic marker/card/detail grammar, spatial state, sheet behavior, and cross-lens continuity are not domain-private code.
- Focal record and associated organization identities remain separately truthful when they are different objects.
- Domain lanes supply facts/actions through shared extension points without moving authorization into the client.
- Privacy-suppressed records do not receive fabricated coordinates.
- Browser-restored geography remains unvalidated until authoritative revalidation.
- New persistence fields require versioning, scope, invalidation, and compatibility.
- Disabled presentation is never the security boundary, and explanation keys must resolve in every supported locale.
- A shared contract may be `Implemented — Not Verified` without mandatory Lane 06 review when current completion governance is otherwise satisfied.

## Integrated Stage 1–2 state

- Stage 1 Control Room: PR #217; shared contract candidate: PR #218; merge `9b97b37365b0e3cab1292cccb86ffe248d5734a2`.
- Stage 2 shared composition: PR #222; final candidate `704718a4611e80f01937d2501e7621319bfd6353`; merge `1fbf38e71747ac90c2f285e4934b22ea26312bec`.
- Stage 2 disposition: `Implemented — Not Verified`; optional independent assurance was not performed.
- Stage 2 exact-head production CI run `32090477890`: passed.
- All Stage 1/2 material findings and PR #222 review threads: resolved.
- SCR #223 (localized record-action labels) and SCR #224 (Resources discovery authorization split): resolved by PR #222.

Historical Stage 1–2 records retain the then-governed order ending in Referrals. The current successor authority changes only forward product operation to the order ending in Capabilities.

## Stage 3–6 successor boundary

Lane 01 must migrate the shared registry, routes, action contracts, serialization, locales, and acceptance scenarios before dependent domain adapters merge. Generic legacy Referrals-lens state migrates to Capabilities; specific referral records and management intent remain referral-domain routes.

Stage 3 extends the same shared family with one canonical query context, typed map projection, result-card model, detail/return context, and domain-owned save/watch seam. Stage 4 domain lanes provide records and authoritative operations through those contracts. Stage 5 cross-lens Referrals consumes the origin/return seam without becoming a permanent lens. Stage 6 proves the integrated result.

No successor packet may create a private shell, navigation, state store, map framework, card system, sheet, action rail, locale framework, or authority shortcut.
