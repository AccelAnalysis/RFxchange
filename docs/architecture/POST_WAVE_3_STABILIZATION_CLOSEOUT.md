# Post-Wave 3 stabilization execution closeout

**Current status:** all independently executable work under Stabilizations 1–7 closed on 2026-08-10. Stabilization 2C remains incomplete and isolated to release engineering; its current blocker has advanced beyond the historical no-backend state recorded in the execution ledger.

This ledger reconciles the canonical [Post-Wave 3 stabilization authority](./POST_WAVE_3_STABILIZATION.md) against merged production code. The implementation baseline before this closeout record and before PR #150 reconciliation was:

- merged `main`: `a72857d36182ceb5b213595cf016721f466a4fa4`;
- post-merge production CI: run `31436039777`, passed;
- tracker: **438 total · 152 Done · 286 Not Started**;
- Activation: **43/43**;
- Network: **38/38**; and
- B6b: intentionally pending.

The execution-ledger entries below are historical evidence at the time each gate closed or stopped. In particular, the Stabilization 2C row correctly records that no App Hosting backend existed at that checkpoint. The later current-status section records subsequent owner-controlled progress without rewriting that historical fact.

## Execution ledger

| Gate | Disposition | PR | Final reviewed head | Merge SHA | Exact-head CI | Post-merge CI | Focused acceptance and review result |
| --- | --- | ---: | --- | --- | ---: | ---: | --- |
| Stabilization 1A — bounded profile uploads | Merged and verified | #144 | `c9ff07327d8c82f550b30844a2a46a59a5682879` | `1acfc95947d1b5c1d16bedbf4894b31a6872b22c` | `31313255935` | `31313515198` | Stream-envelope, declared-length, category-limit, MIME/signature, bounded OLE and DOCX structure regressions passed; final Codex review was clean. |
| Stabilization 1B — atomic create/send and durable delivery | Merged and verified | #145 | `7b55a50890bd846c5d50f3462aaed17eae6daaef` | `eceb4f9bf31cec7ccaca91505bc2a4efe8058e49` | `31394692921` | `31395537745` | Atomic referral/provider-request creation, receipt, audit, outbox and acquisition context; delivery claims coordinate lifecycle/attachment and preserve unknown outcomes. Functions 20/20 and architecture 511/511 passed; all substantive Codex findings were resolved and the final review was clean. |
| Stabilization 2A — reproducible install | Merged and verified | #147 | `c7c6f76bf5780873ffa25b28e5e4224861a09567` | `d4fad43cf2cb451a526d0eaf2ef40f26fdf5b9c1` | `31339407105` | `31339738953` | Trusted workspace lockfile, `npm ci`, locked Firebase CLI and workflow drift guard passed; the Firebase-CLI P2 was corrected and final review was clean. |
| Stabilization 2B — immutable build identity | Merged and verified | #148 | `29a001e502c672983b62bba621fa616a41d806aa` | `9c434ce50c3766f5b0508c69b3140f344b889dbb` | `31343214411` | `31343551480`; later main revalidation `31384829063` | Exact checkout, build-time full SHA, `.next/BUILD_ID`, compiled HTTP full SHA and visible short SHA passed with architecture 484/484; both Codex P2 findings were resolved. |
| Stabilization 2C — same-SHA App Hosting deployment | **Externally blocked only; not complete** | — | — | — | — | — | Historical checkpoint: Blaze billing was enabled and project CLI access worked, but `firebase apphosting:backends:list --project rfxchange` returned no backend. Required GitHub-connected backend creation needed an authenticated Firebase Console session/repository connection. Official automatic variables did not document an immutable Git commit SHA, so `RFXCHANGE_BUILD_SHA` could not be guessed or statically drifted before the managed build environment was inspected. |
| Stabilization 3A — participant failure classification | Merged and verified | #146 | `9b16492ce4fe14f4d0319ddecf017296cf17c42b` | `a72fef782b349e94df3dd229dbd7bb766baa1081` | `31337794390` | `31338265003` | Credential, activation, access-resolution, restriction, authorized and retryable dependency states remain distinct; cross-organization lifecycle transfer is denied. Architecture 479/479 passed and all P1/P2 review findings were resolved. |
| Stabilization 3B — recovery/API problems | Merged and verified | #151 | `63ee468d582edc9caba5aee9c3b971323d8ad139` | `5661aaf6b681d3562678c7c676eea099e90a5682` | `31406412737` | `31406988624` | Loading/error/not-found/retry boundaries plus sanitized problem envelopes, opaque IDs and server-only diagnostics passed; focused suite 43/43 and architecture 522/522. Final review finding led to the separately isolated #152 correction. |
| Stabilization 3 identity-validation follow-up | Merged and verified | #152 | `26d395a087ac93cbe249636014ca5781acf91f33` | `3f4dfe9a58fc256f6ec31ce99bf2a74375d25f51` | `31407655238` | `31417024784` | Pure identity normalization failures map to request validation without swallowing provider or persistence failures. Functions 20/20 and architecture 533/533 passed; final Codex review was clean. |
| Stabilization 4 — workspace resilience | Merged and verified | #153 | `e27bb5db3058a364e5f594dc499e128c0c1c8bd6` | `f276cadfe8da632f39e8a6dc0288a9d3a96545cd` | `31420399568` | `31421175003` | Selected-thread hydration, URL-derived list/map/filter/count/detail state, scoped refreshes, independent optional panels and five-locale copy passed. Focused suite 14/14 and architecture 538/538; both Codex P2 findings were corrected and resolved. |
| Stabilization 5 — map/activation correctness | Merged and verified | #154 | `a7e06c1533b04f9614b3e9f30af49ea270fabc32` | `35dc3cbc570a6e15336ddba36e50691c0028f24e` | `31422979174` | `31423312754` | Exact selected/plot/confirm candidate identity, bounded spatial retries, settled daily camera, reduced motion and in-place Mapbox source updates passed. Focused suite 18/18 and architecture 543/543; final Codex review was clean. |
| Stabilization 6 — data correctness and participant UX | Merged and verified | #155 | `dddbe2ee7efbe34768d7e669c1ffd08185417dd7` | `e34ddec19a334f67b547752247092fa0329e711d` | `31431197213` | `31431562222` | Referral joins use organization IDs, AMACS exposes full counts with progressive disclosure, NAICS uses the immutable 2022 governed catalog, and navigation exposes only live destinations in five locales. Focused suite 22/22 and architecture 546/546; final exact-head Codex review was clean. |
| Stabilization 7 planning authority | Merged and verified documentation authority | #149 | `55da08c429ba5c47a306164e880fe48d3b7292f3` | `b3ef4bafe8e4134817754c9fa6982bffa9588e3c` | `31395925834` | `31396719740` | Canonical plan preserved strict command-center coverage, runtime availability, scoped authorization and configured-browser acceptance without changing feature status. |
| Stabilization 7 — admin runtime convergence | Merged and verified | #156 | `99f6150b7dcb788554aae60c23ed6a42120a3130` | `a72857d36182ceb5b213595cf016721f466a4fa4` | `31435530192` | `31436039777` | Configured run `s7-1786396839285-dd7422` proved Super Admin and narrow entry, direct denial, overview deferral, reauthentication return, ordinary-participant absence, responsive/focus behavior, five locales, clean browser errors and zero residual data. The multiple-bounded-scope P2 was corrected; Functions 20/20 and architecture 558/558 passed; final review was clean. |

## Current Stabilization 2C status — subsequent to the historical ledger

Subsequent owner-controlled setup advanced 2C to this verified/configured state:

- Firebase App Hosting backend: `rfxchange`;
- Firebase project: `rfxchange`;
- region: `us-east4`;
- connected repository: `AccelAnalysis/RFxchange`;
- configured live branch: `main`;
- application root: `/`;
- existing Firebase Web App retained; and
- reserved App Hosting URL exists.

The first managed GitHub build demonstrated that App Hosting knows the exact source commit externally. It did **not** establish a documented immutable source-SHA value inside the managed build that can be safely bound to `RFXCHANGE_BUILD_SHA`.

Therefore the current governing status is:

> **Stabilization 2C remains an isolated release-engineering blocker concerning trustworthy build-time source-SHA binding and verified same-SHA live deployment. It does not block RFx Core product development.**

No successful production rollout satisfying source SHA → build SHA/`RFXCHANGE_BUILD_SHA` → rendered full/short SHA proof has been accepted. The existence of the backend, repository connection, reserved URL or an externally visible source commit does not complete 2C.

Do not:

- weaken or guess `RFXCHANGE_BUILD_SHA`;
- use a mutable/static value that can drift from source;
- treat a rollout identifier or abbreviated SHA as source identity;
- replace the managed architecture under a product slice;
- deploy production under this documentation authority; or
- mark 2C complete without accepted same-SHA evidence.

## Criterion reconciliation

- Stabilization 1 has no remaining implementation criterion: profile upload parsing is bounded before copying, create-and-send persistence is atomic/retry-stable, and provider delivery is coordinated through durable authoritative claims rather than a check-then-send race.
- Stabilization 2A and 2B are complete. Only 2C remains open, now isolated to trustworthy source-SHA injection/binding in the managed build and verified same-SHA live rollout evidence. Backend provisioning itself is no longer the blocker.
- Stabilization 3 has no remaining implementation criterion: required route recovery is present, dependency failures remain retryable, and API failures use one sanitized problem boundary.
- Stabilization 4 has no remaining implementation criterion: selected-thread queries are bounded, mutation refresh is scoped, optional account panels cannot block the primary shell, and current list/map/detail state is URL-derived.
- Stabilization 5 has no remaining implementation criterion: selected candidate identity is stable, required spatial reads have bounded recovery, daily maps settle, and overlays update without recreating the map.
- Stabilization 6 has no remaining implementation criterion: referral identity, AMACS result disclosure, governed NAICS selection and currently-live participant navigation are verified.
- Stabilization 7 has no remaining implementation criterion: portal entry is server-authorized, navigation intersects exact grants with implemented runtimes, every bounded scope remains reachable, `/admin/overview` stays withheld until truthful strict coverage exists, and participant Account/Menu exposure fails closed.

## Remaining 2C release-engineering sequence

The remaining work is intentionally outside Wave 4 product development:

1. establish a documented or otherwise reviewably trustworthy immutable full source-commit input inside the managed build, without relying on an undocumented guess;
2. bind that exact value to `RFXCHANGE_BUILD_SHA` and the existing Next.js build identity contract;
3. build and roll out one exact merged `main` commit through the accepted App Hosting architecture;
4. capture backend/build/rollout identity, hosted URL, exact source commit, rendered public short SHA, rendered authenticated full SHA where practical, timestamp and rollback target;
5. prove all source/build/rendered identities are the same full SHA; and
6. review and merge only after exact-head and live evidence satisfy the stabilization authority.

No local-source backend, classic Hosting deployment, deployment container, Firebase rollout identifier, abbreviated SHA, secret, login token or service-account JSON substitutes for that evidence.

## Product-planning isolation and PR #150

PR #150 merged after this stabilization ledger and established `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`. It is consumed as governing participant-experience authority by Wave 4.

Stabilization 2C does not block documentation planning or product-domain implementation of the RFx aggregate. It remains separately parked and must not be solved, weakened or entangled inside the Slice 4.1 documentation or runtime PR.

The specific Slice 4.1 authority in `docs/slices/SLICE_4_1_EXECUTION_AUTHORITY.md` may therefore authorize a later implementation pass for `ISS-001`, `ISS-002` and `ISS-003` after its own review/merge. It does not deploy, publish or complete 2C.

## Governance closeout

- No Feature ID was added, removed, renamed, reordered or newly completed by stabilization or this status reconciliation.
- Tracker totals remain **438 total · 152 Done · 286 Not Started**.
- Activation remains **43/43** and Network remains **38/38**.
- Wave 4 RFx Core remains **0/41**.
- B6b remains intentionally pending.
- RFx Core runtime implementation has not begun.
- Exchange-shell convergence and the persistent four-lens runtime have not begun.
- Intelligence/Locations runtime work has not begun.
- Dark Appearance, appearance preferences, Presentation Mode, production sound and haptics have not been implemented.
- Stabilization 2C remains incomplete, isolated and nonblocking for RFx Core product development.