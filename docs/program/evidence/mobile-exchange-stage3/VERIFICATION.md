# Verification record

## Focused behavioral coverage

`node --experimental-strip-types --test test/mobile-exchange-stage3-*.test.mjs`

- all five exact locales and the complete query shape;
- invalid locale, search/filter/sort/cursor/page/camera/bounds rejection;
- coordinate/privacy invariants, explicit cluster identity/count, and list-only no-coordinate behavior;
- server-geography and domain-layer fail-closed map adaptation;
- stable card/map/detail identity, truthful status/date/classification fields, hidden absent save/watch operations, and domain-owned persistence handlers;
- loading, ready, empty, unavailable, restricted, and error result states with protected-data removal, explicit contextual-organization role/identity allow-listing, and unpaired organization/record rejection;
- mandatory explicit server authorization results, exact non-null selected identity, exact canonical detail destination, and rejection of stale scope/lens/locale/geography/query/result-set responses, including same-ID in-flight changes to camera, bounds, search, filters, sort, cursor, or page;
- card/map/keyboard detail entry, deep-link pre-authorization isolation, affirmative resolution, nondisclosing denial, independent list/sheet restoration, exact snap-point restoration, lens-discriminated safe returns, and stale-scope discard;
- one existing Mapbox scene/source, behaviorally exercised mutable GeoJSON output, original-projection click lookup, camera-only cluster expansion, exact governed-area geometry matching/omission, overlap priority, selection updates, nonselectable feature truthfulness, and organization-only home-marker duplicate-overlay prevention without losing the camera anchor.

The preserved Stage 1–2 contract, continuity, domain-convergence, composition, permissions, reopen, and review regressions remain active. Historical Stage 1–2 authority, action catalogs, locale trees, and evidence are not rewritten.

## Integrated and configured coverage

`node scripts/mobile-exchange-stage3-acceptance.mjs` runs the focused Stage 3 suite followed by the canonical configured Exchange shell emulator/browser harness. The configured run continues to prove the persistent shell, exact successor lens order, desktop and 390 px behavior, keyboard and accessibility behavior, safe areas, reduced motion, five locales, per-responsive-grid four-action rails, close/reopen continuity, clean console/unhandled-rejection behavior, and existing map runtime without introducing a private Stage 3 route.

Stage 3 is a shared foundation for later real domain adapters. Until a Stage 4 adapter supplies a `LensMapProjection`, configured acceptance cannot truthfully claim a token-backed live domain point/cluster/area journey through the new source. The behavioral adapter tests, source integration checks, TypeScript build, production build, and existing configured map/shell regression provide the applicable pre-adapter evidence; Stage 4 and Stage 6 must add real adapter and integrated browser journeys.

## Completion checks

- `npm run typecheck`
- `npm run lint` (zero errors; existing warnings reported separately)
- `npm run check`
- `node scripts/mobile-exchange-stage3-acceptance.mjs`
- `git diff --check`
- production CI on the exact implementation candidate
- production CI on merged `main` before Stage 3 closeout

The implementation PR records local results and exact-head CI. Control Room records the final candidate, merge SHA, post-merge CI, requirement dispositions, denominator arithmetic, and next-packet activation without changing the Feature-ID tracker.

## Security and scope result

- Client query, map, selection, sheet, and detail state never grants participant, organization, membership, geography, record, relationship, action, or administrative authority.
- Every accepted discovery response carries all four explicit authorization booleans and exact scope/lens/locale/geography/query/result-set binding. A carried selection additionally requires an exact non-null focal identity, and a pending detail requires an exact identity plus canonical destination; omitted facts fail rather than default to allowed.
- Suppressed or coordinate-less records remain selectable in their authorized list/detail treatment but never receive a fabricated point.
- GeoJSON properties are presentation only and never reconstruct a selected domain identity.
- Save/watch/follow remains domain-owned and hidden without a real operation.
- No domain lifecycle, mutation, repository, Firestore rule, Function, tracker item, payment, referral fee, payout, Stabilization 2C, or B6b state changes in this packet.
