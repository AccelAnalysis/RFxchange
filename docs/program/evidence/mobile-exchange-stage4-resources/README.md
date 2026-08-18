# Mobile Exchange Stage 4 Resources evidence

Work packet: `WP-MOBILE-EXCHANGE-STAGE4-RESOURCES-01`

Requirement: `MOB36-RESOURCES-001`

Implementation state: Implemented — Not Verified

Release class: Elevated
Starting merged `main`: `8f348c8c86a2a8eb1eeb6402a170a9120824d7ae`

The Control Room dependency packet `WP-MOBILE-EXCHANGE-STAGE3-SHARED-01` was closed before this build. The product owner confirmed post-merge production CI run `32109036958` succeeded on the exact starting main SHA. The historical activation base in the machine packet is preserved; this implementation uses the product-owner-directed descendant merged main above.

## Requirement disposition

`MOB36-RESOURCES-001` is implemented by an owned Resources adapter that consumes, without changing, the shared Stage 3 query/result/map/selection/card/action-rail contracts. It projects only:

- server-authorized Official Resource Provider publications and current service-profile fields;
- published provider resources returned by the existing Resources discovery service;
- private provider-request records only after current `referral.manage` authorization;
- provider markers reprojected from the authoritative organization-location visibility policy;
- released service-territory geometry returned by the authoritative geography runtime.

Exactly four canonical Resources actions are retained in their governed order. Offer/request and resource-detail behaviors are enabled only where a real existing runtime and current authorization exist. Share, Save/Archive and unsupported Edit behavior remain explicitly disabled. Favorite persistence remains hidden because the Resources domain has no authorized save aggregate.

The optional RFx gap origin (`rfxReference`, `rfxGap`, `returnTo`) is bounded display/return context only. The Resources loader does not read RFx private state, infer provider eligibility from the origin, or grant authority. Search/filter query changes clone existing URL parameters so that a valid origin remains continuous.

## Objective local evidence

- `node scripts/mobile-exchange-stage4-resources-acceptance.mjs`: 7/7 passing; real provider/resource/request composition, privacy-preserving map/list split, service-territory geometry binding, composite selection identity, negative/independently settled request authorization, bounded RFx return context and five-locale copy.
- `npm run check` under Node 24.18.0: validation, Functions build/tests, 780/780 architecture tests, typecheck and lint passed. Its final build invocation alone could not acquire a lock because the temporary worktree exhausted local disk after the preceding gate stages.
- After clearing only generated worktree artifacts, `npm ci --ignore-scripts` followed by `npm run build` under Node 24.18.0: passing on the same final source, including the `/resources` route.
- Firestore emulator execution of `smoke-resource-network-emulator.mjs`: passing, including atomic persistence, publication/resource/message queries and direct-client denial.
- `eslint .`: passing with repository baseline warnings only and no errors.
- `git diff --check`: passing.

Existing Resource Network architecture/emulator validation and the full repository `npm run check` are run separately and recorded on the exact candidate PR. Configured-browser, responsive, accessibility, console and timing observations must be attached to the exact candidate before merge; this document does not claim those external observations or optional independent assurance in advance.

## Security and truthfulness boundary

- Public discovery remains available without `referral.manage`; only private requests and request messages disappear.
- Provider owner hydration requires `resource.manage`; command handlers continue to reauthorize server-side.
- A locality-only organization location yields no point marker. Exact/approximate coordinates use the authoritative organization-location projection; client copy never determines privacy.
- Resource and request records are list-only because neither domain supplies an authoritative record coordinate.
- Service territory areas reference the already-authorized released geography geometry; no browser-created geography authority is introduced.
- No provider status, capacity, endorsement, availability, request authority, RFx state, paid placement or market activity is fabricated or inferred.

No tracker, shared participant contract, RFx/referrals domain, governance, deployment or release-engineering file is changed. Stabilization 2C and Brand Gate B6b remain unchanged. No `Verified`, merged, live or deployed claim is made.
