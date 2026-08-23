# Verification record

Evidence date: 2026-08-18

Base SHA: `8f348c8c86a2a8eb1eeb6402a170a9120824d7ae`

## Passed locally

- `node scripts/mobile-exchange-stage4-capabilities-acceptance.mjs` — 8/8 focused adapter/boundary tests passed.
- `node scripts/validate-amacs-0-5-reconciliation.mjs` — immutable `0.5.0` reconciliation passed (16 domains, 120 families, 615 capabilities, 185 aliases).
- `node scripts/validate-market-profile-enrichment.mjs` — existing organization market-profile architecture validation passed.
- Firestore emulator: `scripts/smoke-market-profile-enrichment-emulator.mjs` — direct-client denial, atomic persistence, idempotency, tenant scope, and provenance passed.
- `npx tsc --noEmit` — passed.
- Focused ESLint over the owned runtime, route, component, and tests — passed.
- `npm run build` — production build passed and emitted dynamic `/capabilities`.

## Covered assertions

- Fail-closed bounded search/filter/deep-link inputs.
- Confirmed-claim-only organization projection and shared card/map identity.
- Exact four-action ordering and negative organization-profile authorization.
- External selection permits view only; match, referral, evidence mutation, and save/follow are not fabricated.
- Current versus historical AMACS state and structural gap calculation.
- Evidence-submitted versus Verified assertion state.
- Non-empty Capabilities surface copy for `en-US`, `es`, `fr`, `it`, and `de`.
- Existing market-profile Firestore direct-client denial and atomic server persistence.

## Not claimed by this domain packet

- Configured-browser activation from the permanent lens navigation: the active pointer is Shared-lane owned and intentionally unchanged here.
- Exact-head GitHub CI: recorded in the draft PR after push.
- Production release, live state, tracker completion, or optional independent assurance.

The initial local build attempt failed only because the temporary worktree used an out-of-root `node_modules` symlink, which Turbopack rejects. After an isolated `npm ci --ignore-scripts`, the production build passed. The repository's required runtime is Node 24.18.x; the temporary shell exposed Node 22.12.0 and emitted an engine warning, so GitHub CI remains the canonical exact-runtime build evidence.
