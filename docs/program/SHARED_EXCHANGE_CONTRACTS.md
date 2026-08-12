# Shared Exchange Contracts

**Owner:** Lane 01 — Shared Exchange Platform

**Acceptance owner:** Lane 06 — Independent Acceptance
**Integration owner:** Lane 07 — Integration / Cross-Lens QA

This registry identifies behavior that must remain one shared Exchange contract rather than diverging across lenses. A domain lane consumes an accepted contract; it does not clone it.

## Owned contract families

| Contract | Stable requirements | Shared owner | Domain consumers |
| --- | --- | --- | --- |
| Participant shell and lens registry | `SHARED-TRUTH-*`, `SHARED-TRANSITION-*` | Lane 01 | Lanes 02–05 |
| Spatial context and invalidation | `SHARED-SPATIAL-*`, `SHARED-CAMERA-*`, `SHARED-VIEW-*` | Lane 01 | Lanes 02–05 |
| Selected-object and marker grammar | `SHARED-SELECTION-*`, `SHARED-MARKER-*`, `SHARED-CLUSTER-*`, `SHARED-IDENTITY-*` | Lane 01 | Lanes 02–05 |
| Result drawer/sheet and search/filter grammar | `SHARED-DRAWER-*`, `SHARED-RESULT-*`, `SHARED-SEARCH-*` | Lane 01 | Lanes 02–05 |
| Cross-lens continuation and safe return | `SHARED-CONTINUITY-*`, `SHARED-RETURN-*` | Lane 01 | Lanes 02–05 |
| Organization action projection | `SHARED-ACTIONS-*` | Lane 01 with domain-owned eligibility inputs | Lanes 02–05 |
| Account utility and optional Administration | `SHARED-ACCOUNT-*` | Lane 01 | all participant lanes |
| Truthful copy, accessibility, locales and performance | `SHARED-COPY-*`, `SHARED-PRIVACY-*`, `SHARED-A11Y-*`, `SHARED-I18N-*`, `SHARED-PERF-*` | Lane 01 | Lanes 02–05 |

Shared client state is always non-authorizing. Domain inputs such as provider status, RFx lifecycle, referral access, publication visibility, and organization membership remain server-authoritative and domain-owned.

## Shared Contract Request

A request is a repository work-packet record with:

- request ID `SCR-<lane>-<sequence>`;
- requesting lane and exact candidate/base SHA;
- affected stable requirement IDs;
- participant problem and desired generalized behavior;
- current shared seam inspected;
- domain-specific facts supplied by the requester;
- security/privacy/authority constraints;
- consumers and compatibility impact;
- proposed acceptance types;
- explicit non-scope; and
- requested dependency date or merge order.

The flow is:

```text
domain lane records need
→ Lane 01 decides whether generalized support is warranted
→ Control Room assigns an exact-base packet
→ Lane 01 implements the shared contract
→ Lane 06 evaluates it independently
→ accepted exact head merges
→ dependent lane reconciles and consumes it
```

If an existing accepted seam is sufficient, the request closes with the reuse decision and no new shared implementation.

## Ownership constraints

- Participant top navigation, global lens order, Account utility, generic organization marker grammar, generic spatial state, generic drawer/sheet, and cross-lens context are not domain-lane private code.
- A domain lane may render domain-specific objects and actions through shared extension points without moving its authorization logic into the client.
- A cross-geography or privacy-suppressed domain object does not receive a fabricated coordinate to satisfy a shared visual contract.
- New shared persistence fields require versioning, scope, invalidation and backward-compatibility decisions.
- A shared contract is `Implemented — Not Verified` until Lane 06 records an exact-SHA disposition.

## Current requests

No request is accepted merely by this setup PR. Initial work packets in `governance/four-lens-workstreams.json` include candidate Shared Contract Requests for the unresolved PR #160 focus-link continuity and organization-logo projection questions.
