# TestRFx Reconciliation Source Index

**RFxchange baseline:** `399072c05aa78e536ad57d0998a643f1c6d49b08`
**TestRFx baseline:** `db19a0cc2171d0ddde4f34a20acc881ba7279248`

GitHub is authoritative. This index records the exact source snapshot used to construct the Phase 1 inventory and Phase 2 contract map.

## RFxchange authorities and implementation sources

| Area | Current source |
| --- | --- |
| Repository operating authority | `AGENTS.md` |
| Successor mobile product authority | `docs/program/MOBILE_EXCHANGE_STAGES_3_6_AUTHORITY.md` |
| Volatile packet state | `docs/program/PARALLEL_DELIVERY_MATRIX.md`; `governance/four-lens-workstreams.json` |
| Shared mobile contracts | `src/application/participant/mobile-exchange-contracts.ts` |
| Permanent lens registry | `src/application/participant/participant-lens-registry.ts` |
| Successor action registry | `src/application/participant/exchange-room-actions.ts` |
| Shared participant composition | `src/components/participant/ExistingWorkspaceFoundation.tsx`; `src/components/participant/MobileExchangePrimitives.tsx` |
| Map projection | `src/application/participant/lens-map-projection-adapter.ts`; `src/components/map/MapboxLocalityCanvas.tsx`; `src/components/map/ExchangeSpatialScene.tsx` |
| Firestore schema | `src/infrastructure/firestore/schema.ts` |
| Core repositories | `src/infrastructure/firestore/repositories.ts` |
| RFx aggregate/publish repository | `src/infrastructure/firestore/rfx.ts`; `src/domain/rfx/**` |
| Resource mobile adapter | `src/application/resource-network/mobile-resource-exchange.ts`; merged PR #237 |
| Capabilities candidate | PR #234; `src/application/organizations/capabilities-exchange.ts` |
| Intelligence candidate | PR #235; `src/application/intelligence/mobile-exchange-intelligence.ts` |
| RFx teaming candidate | PR #238; `src/application/rfx/opportunity-teaming-service.ts` |
| Storage foundation | `docs/architecture/INF-008-firebase-storage-foundation.md`; `src/application/storage/**`; `src/infrastructure/storage/**` |
| Authentication | `docs/architecture/AUTH-002-firebase-user-identity-resolution.md`; `docs/architecture/AUTH-005-firebase-auth-firestore-security-suite.md`; `src/application/auth/authenticated-organization-workspace.ts` |
| Acceptance | repository validators, Auth/Firestore/Functions/Storage emulators, configured-browser acceptance and production CI |

## TestRFx donor sources

The Phase 1 inventory uses the merged donor repository at `db19a0cc2171d0ddde4f34a20acc881ba7279248` and these major PR families.

| Donor area | PRs | Principal paths |
| --- | --- | --- |
| Operating chassis | #1, #16–#23, #27 | `components/exchange/**`; `lib/exchange/**`; `docs/architecture/PLATFORM_SHELL.md` |
| Menu | #25, #30, #70 | `lib/exchange/menu.ts`; `components/exchange/menu-surface.tsx`; `docs/architecture/MENU*.md` |
| Map presentation | #34, #55–#59, #61, #64 | `components/exchange/persistent-map.tsx`; `lib/exchange/map-*.ts` |
| Cards and icons | #67, #68 | `components/exchange/record-card.tsx`; `components/exchange/card-media.tsx`; icon adapter/tests |
| RFx workflows | #36, #69 | `components/rfx/**`; `lib/rfx/**`; `docs/architecture/RFX_MOBILE_TASK_CANVAS.md` |
| Resources/provider data | #32, #65, #66, #71 | `lib/resources/**`; `data/seed-packs/hampton-roads-va/**`; provider docs |
| Identity/onboarding | #39, #42, #44, #48, #50, #52, #53 | `app/onboarding/**`; `components/onboarding/**`; `lib/onboarding/**`; `lib/identity/**` |
| Public/acquisition | #3, #45, #49 | `components/marketing/**`; `components/public-resources/**`; `lib/public*/**` |
| Commercial | #51 | `lib/membership/**`; membership routes and SQL |
| Intelligence/Capabilities | #33, #37 | `components/capabilities/**`; Intelligence services/workflows |
| Donor persistence model | multiple | `db/**`; `lib/server/postgres.ts`; `lib/rfx/postgres-repository.ts` |
| Static preview | #29, #60, #63 | `.github/workflows/pages-preview*.yml`; preview docs/scripts |

## Source-backed provider package

The real donor package is:

- `data/seed-packs/hampton-roads-va/candidates.csv`
- `data/seed-packs/hampton-roads-va/locations.csv`
- `data/seed-packs/hampton-roads-va/sources.csv`
- `data/seed-packs/hampton-roads-va/geocodes.json`

The source package is an input to a future governed Firebase migration. It is not itself canonical RFxchange data.

## Excluded donor sources

The following are never migration authority:

- deterministic seed/preview records outside an explicitly reviewed source package;
- illustrative SVG/media assets used only to exercise presentation;
- static Pages identities and browser-local success state;
- HMAC/custom sessions and verification tokens;
- SQL schema/migrations as RFxchange runtime;
- local browser RFx workspaces as canonical records;
- provider MapLibre/OpenFreeMap code and style URLs.

## Change rule

A later donor commit does not silently replace this baseline. It requires an explicit source-index amendment and affected matrix/contract-map review.
