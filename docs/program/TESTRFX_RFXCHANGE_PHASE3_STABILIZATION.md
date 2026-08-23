# TestRFx → RFxchange Phase 3 Destination Stabilization

**Phase:** 3 — Stabilize the destination before large ports
**Production repository:** `AccelAnalysis/RFxchange`
**Controlled donor:** `AccelAnalysis/TestRFx`
**Phase 2 merge:** `be7a1d485f3034262e59c99f3a2fd92505dc65a0`
**Status:** Implemented — Not Verified

## Objective

Phase 3 stabilizes RFxchange's current Firebase-backed destination before any large TestRFx experience port. It reconciles active domain adapters and RFx work from current merged `main`, removes overlapping stale ownership, and records which future packets remain prerequisites.

This phase does not port the TestRFx Task Canvas, PostgreSQL services, MapLibre implementation, seed data, media, or presentation files.

## Production boundary preserved

RFxchange remains the sole production repository. Firebase Authentication, RFxchange server sessions, Firestore repositories, Firebase Functions, Firebase Storage, Mapbox, domain commands/events and existing acceptance gates remain authoritative. There are no dual writes or runtime calls to TestRFx.

## Current candidate reconciliation

| Area | PR | Phase 3 result | Exact-head evidence |
| --- | ---: | --- | --- |
| Resources | #237 | Already merged successor; retained as current Resources destination | candidate `b30881b2a1e05ff8cace28642296c86018063f6b`; CI `32128635399`; merge `399072c05aa78e536ad57d0998a643f1c6d49b08` |
| Capabilities | #234 | Rebuilt from Phase 2 `main`, full CI passed, merged | candidate `7ffd357009dec1f33deb9a18f08ccbd78163f38f`; CI `32617310204`; merge `a6a220fd52e145c44bbc0be6274f2974462acdd9` |
| Intelligence | #235 | Rebuilt from merged Capabilities `main`, full CI passed, merged | candidate `04e8addda59799300d9f831bee48ac13fde09e58`; CI `32617657384`; merge `c3b1da7d1f21d38e075b6b7145c3c291beda4ba7` |
| RFx Slice 4.7 | #238 | Rebuilt from merged Intelligence `main`, full CI passed, merged | candidate `033830caddb10d23621c35db9d32e0753212b256`; CI `32617987924`; merge `b5c12b196193099ee4fe7af70fc94dc54fa3f97d` |

The rebuilds retained the owned candidate file contents and replaced stale ancestry. No TestRFx implementation entered these candidates.

## Historical and overlapping PR classification

| PR | Classification | Final disposition |
| ---: | --- | --- |
| #221 — Stage 2 Resources | Incorporated into a newer successor | Closed without merge; current implementation is PR #237 |
| #220 — Stage 2 Intelligence | Incorporated into a newer successor | Closed without merge; useful concepts are in PR #235 |
| #219 — Stage 2 permanent-lens Referrals | Partially reusable | Closed as superseded; privacy/path concepts remain inputs to future Stage 5 cross-lens Referrals |
| #210 — DSC-006 alerts/digests | Partially reusable | Closed as stale; useful queue/delivery behavior requires a fresh current-main extraction packet |

Closing these PRs does not erase their history or declare reusable requirements complete. It removes active ownership from implementations that no longer match current contracts.

## Destination readiness

### Wave A — Shared visual convergence

Wave A may be activated only as bounded Shared Exchange presentation packets after this closeout. Media-first cards, semantic icons, Menu decluttering, reduced metadata, record actions and ownership treatment may not change persistence, authorization, lifecycle, action identities or navigation architecture.

The permanent Capabilities route is implemented, but enabling its shared navigation pointer and the integrated cross-lens journey remains a Shared/Integration-owned packet rather than a private domain change.

### Wave B — Mobile RFx Task Canvas

The large Task Canvas remains blocked. Before any Task Canvas UI port:

1. RFx Slices 4.8, 4.9 and 4.10 must merge;
2. the CM-010 Firebase organization-scoped RFx workspace collections/commands/events must receive explicit authority;
3. response collaboration and hosted/external submission commands must exist;
4. the final Stage 4 Opportunities adapter must integrate those commands;
5. current-main emulator and browser acceptance must pass.

TestRFx PostgreSQL APIs, SQL workspaces, `rfx_session`, browser authority and local state cannot be used as substitutes.

### Waves C and D

Resource-provider data and public media are not activated by Phase 3. They remain behind the private Firestore import/geocode model and the reviewed public-media projection over INF-008 respectively.

## Next required packets

- `WP-CONVERGENCE-STAGE4-SHARED-INTEGRATION-01`
- `WP-MOBILE-EXCHANGE-RFX-48-01`
- `WP-MOBILE-EXCHANGE-RFX-49-01`
- `WP-MOBILE-EXCHANGE-RFX-410-01`
- `WP-MOBILE-EXCHANGE-STAGE4-OPPORTUNITIES-01`
- `WP-CONVERGENCE-DSC006-ALERT-EXTRACTION-01`

Each packet must be recalculated from current merged `main` and pass the Phase 2 G0–G5 admission gate.

## Exit condition

Phase 3 closes because the active Capabilities, Intelligence and RFx 4.7 candidates are merged from current `main`; the four overlapping stale PRs are classified and closed; the next RFx/shared dependencies are explicit; no large donor port is active; and the closeout ledger passes exact-head production CI.

`Implemented`, `merged`, `released`, `live` and `Verified` remain separate facts.
