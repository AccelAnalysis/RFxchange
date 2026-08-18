# Mobile Exchange Stage 4 Resources evidence

Work packet: `WP-MOBILE-EXCHANGE-STAGE4-RESOURCES-01`

Requirement: `MOB36-RESOURCES-001`

Implementation state: Implemented — Not Verified

Release class: Elevated
Starting merged `main`: `8f348c8c86a2a8eb1eeb6402a170a9120824d7ae`

Reconciled merged `main`: `4a3d9042425b88170f16cbda6aff61ba875abea1` (PR #236 ownership amendment; post-merge production CI `32111575377` succeeded)

The Control Room dependency packet `WP-MOBILE-EXCHANGE-STAGE3-SHARED-01` was closed before this build. The product owner confirmed post-merge production CI run `32109036958` succeeded on the exact starting main SHA. The implementation is now merged forward to the exact reconciled descendant above; the historical activation base remains preserved in the machine packet.

## Requirement disposition

`MOB36-RESOURCES-001` is implemented by an owned Resources adapter that consumes, without changing, the shared Stage 3 query/result/map/selection/card/action-rail contracts. It projects only:

- server-authorized Official Resource Provider publications and current service-profile fields;
- published provider resources returned by the existing Resources discovery service;
- private provider-request records only after current `referral.manage` authorization;
- provider markers reprojected from the authoritative organization-location visibility policy;
- released service-territory geometry returned by the authoritative geography runtime.

Exactly four canonical Resources actions are retained in their governed order. Offer/request and resource-detail behaviors are enabled only where a real existing runtime and current authorization exist. Share, Save/Archive and unsupported Edit behavior remain explicitly disabled. Favorite persistence remains hidden because the Resources domain has no authorized save aggregate.

The optional RFx gap origin (`rfxReference`, `rfxGap`, `returnTo`) is bounded display/return context only. The Resources loader does not read RFx private state, infer provider eligibility from the origin, or grant authority. Search/filter query changes preserve server-revalidated origin context, including when the source was a compact route. Card and rail destinations retain bounded origin and discovery context without exceeding the shared canonical-destination contract. A compact owned route preserves an unusually long selected identifier plus the RFx reference and ordinary valid return without re-expanding the identifier into an oversized query string; the descriptive `rfxGap` label may be omitted only at that maximum-identifier boundary. The normal Resources loader still reauthorizes the selected record and resolves its associated provider before bounded Network projection.

## Objective local evidence

- `node scripts/mobile-exchange-stage4-resources-acceptance.mjs`: 18/18 passing; real provider/resource/request composition, bounded valid domain text and identifiers, compact-context decoding and mutation continuity, record-associated provider focus beyond the bounded Network page, suppressed/expired-resource search-oracle denial, coherent Unicode-aware discovery across result families, privacy-preserving map/list split, neutral deduplicated service-territory geometry, composite selection identity, negative/independently settled request and message authorization, bounded RFx return context and five-locale copy/value labels.
- `npm run check` under Node 24.18.0: passing; validation, Functions build and 43/43 tests, 791/791 architecture tests, typecheck, lint (zero errors; repository-baseline warnings only) and the production build all passed, including the bounded `/resources/v/[kind]/[id]/[[...context]]` fallback route.
- Firestore emulator execution of `smoke-resource-network-emulator.mjs`: passing, including atomic persistence, publication/resource/message queries and direct-client denial.
- Checked-in `browser-observation.json`, produced by the configured local shell fixture plus authenticated in-app browser replay against exact runtime commit `629ccc4b00bd5a176d35a81f6f4699bb10da018a`: desktop and 390px mobile rendered the real approved provider and published resource; bounded RFx origin/return survived resource open, provider selection and filtering; provider selection cleared stale record selectors; resource-only navigation derived the associated provider coherently; mobile Open scrolled the selected resource detail itself into view; an authorized compact record preserved encoded query/fragment data exactly, rejected colliding raw RFx query context, and retained the exact server-revalidated return through a filter mutation; a resource-only search retained the matching public results and no private request result; independently denied private-request and owner adjuncts failed closed while public discovery remained usable; all five repository locales rendered their Resources workspace and localized status/category values; the final bounded journey recorded zero console warnings/errors and no visible horizontal clipping. The fixture did not grant private-request or owner-management authority for the discovered provider, so their positive paths remain supported by the focused application and Firestore emulator evidence rather than this browser replay.
- `eslint .`: passing with repository baseline warnings only and no errors.
- `git diff --check`: passing.

Existing Resource Network architecture/emulator validation and the full repository `npm run check` are run separately and recorded on the exact candidate PR. The repository's canonical configured-browser shell run remains separate from the packet-specific local fixture journey above. This document does not claim optional independent assurance.

## Security and truthfulness boundary

- Public discovery remains available without `referral.manage`; only private requests and request messages disappear.
- Provider owner hydration requires `resource.manage`; command handlers continue to reauthorize server-side.
- A locality-only organization location yields no point marker. Exact/approximate coordinates use the authoritative organization-location projection; client copy never determines privacy.
- Resource and request records are list-only because neither domain supplies an authoritative record coordinate.
- Service territory areas reference the already-authorized released geography geometry; no browser-created geography authority is introduced.
- No provider status, capacity, endorsement, availability, request authority, RFx state, paid placement or market activity is fabricated or inferred.

No tracker, shared participant contract, RFx/referrals domain, governance, deployment or release-engineering file is changed. Stabilization 2C and Brand Gate B6b remain unchanged. No `Verified`, merged, live or deployed claim is made.
