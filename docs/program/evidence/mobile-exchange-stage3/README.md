# Mobile Exchange Stage 3 evidence

This directory records builder evidence for `WP-MOBILE-EXCHANGE-STAGE3-SHARED-01` and requirements `MOB36-SHARED-QUERY-001`, `MOB36-SHARED-MAP-001`, `MOB36-SHARED-RESULT-001`, and `MOB36-SHARED-DETAIL-001`.

The packet was activated by Control Room PR #230 from exact dependency merge `107c3b8899e19e0479b51f6542a06a808f2ae0df`. Its implementation branch is `codex/mobile-exchange-stage3-shared`; the branch was reconciled to merged Control Room head `56e23c35dc3182330fe8bfd3521de001ee1fdf37`, whose post-merge production CI run `32100623664` passed. The implementation PR body and exact-head production CI bind the final candidate SHA; the subsequent Control Room closeout records that immutable candidate, merge, and post-merge run in the program ledgers.

## Result

- One validated `ExchangeLensQuery` represents lens, exact supported locale, controlled geography, camera/bounds, search, domain filters, sort, cursor, and page, with a canonical identity binding the response to every query field. `MobileExchangeQueryContext` adds the exact session/participant/membership/viewer-organization scope, selection, sheet, detail, result index, and list position while declaring that client state grants no authority.
- One `LensMapProjection` family carries authoritative organization/record points, explicit stable clusters, governed areas/layers, and truthful list-only objects. Coordinates and bounds are range-checked. Missing or withheld coordinates never become GeoJSON points.
- The existing `ExchangeSpatialScene` consumes the provider-neutral projection through one non-clustered source in the existing Mapbox instance. It renders only server-revalidated geography and domain-revalidated active layers. Governed area geometry must be supplied by an already-authorized registry and match area, geography, and geometry-reference keys exactly. A legacy standing marker is deduplicated only when its explicit organization identity and marker ID both match the organization projection; absent identity preserves both rather than guessing.
- Marker selection callbacks recover the original immutable projection from an internal lookup; GeoJSON feature properties never create identity or authority. Explicit cluster activation changes only camera state and causes the existing authoritative re-query path to run.
- Result cards now carry stable lens/record/organization identity, accessible labels, truthful media/fallback, status, dates, classifications, domain-owned save/watch state, record actions, and one coherent detail identity. Save/watch is hidden when no authoritative domain operation exists.
- Result sets distinguish loading, ready, empty, unavailable, restricted, and error states. Non-ready states cannot retain protected cards, result-set IDs, result map projections, or an organization merely labeled as context; a standing contextual organization requires an explicit role and exact server-authorized identity allow-list. Ready states reject every unpaired result organization or record.
- Card, map, keyboard, and deep-link detail entry converge on one subject. Every entry remains opening and does not become an authorized detail until the server returns the exact non-null identity and canonical detail destination. Both opening and already-open details must keep passing that exact revalidation. Close restores the valid query, geography scope, camera/bounds, independently revalidated selection, domain-revalidated layers, cursor/page/index, independent list/sheet positions, snap point, lens-bounded origin route, and focus key; scope or authority changes discard or sanitize the stale snapshot.

The packet changes shared, non-authorizing presentation contracts only. Domain records, lifecycles, mutations, persistence, geography authority, Firestore, Functions, payment/referral-fee behavior, and Feature-ID tracker state remain unchanged. Stage 4 domain packets must supply real authorized records and operations through these seams; this packet does not fabricate a route or record.

## Provenance and state

- Stage 2 final candidate / merge: `704718a4611e80f01937d2501e7621319bfd6353` / `1fbf38e71747ac90c2f285e4934b22ea26312bec`
- Successor authority merge: `3455eaefe5978eeb713b161c139f9df1b0c7bfc7`
- Lens migration final candidate / merge: `0a71737f3ddc36d5fce6a880149793994609dc84` / `107c3b8899e19e0479b51f6542a06a808f2ae0df`
- Stage 3 activation control merge / post-merge CI: `56e23c35dc3182330fe8bfd3521de001ee1fdf37` / `32100623664`
- Stage 3 implementation PR / final candidate: PR #231 / `0b6b0999afe592725cd0a81a27f14b221f8c82b4`
- Stage 3 exact-head CI: run `32103926126` — **SUCCESS** (770/770 canonical tests, configured browser, artifact, compiled/visible build identity)
- Stage 3 merge / post-merge CI: `5ddca57bf2d9fa2c81a98e75aeee09302d278a23` / run `32104375075` — **SUCCESS**
- Stage 3 authorization-correction PR / final candidate: PR #233 / `15e7c2333d1e9113055630bf256f977f7c39d080`
- Correction exact-head CI: run `32106236531` — **SUCCESS** (771/771 canonical tests, configured browser, artifact, compiled/visible build identity)
- Correction merge / post-merge CI: `3830577e14b7b1bc6878965d26369529de2ebbbb` / run `32106855995` — **SUCCESS**
- Assurance: builder/repository evidence only; no optional independent assurance event occurred

## Post-merge authorization correction

A GitHub review submitted after PR #231 merged identified two valid authorization-continuity defects: open details were not subjected to the same exact authority/canonical-destination reconciliation as opening details, and close accepted one authorization result for both the detail and a potentially different return-snapshot selection. PR #233 makes both checks explicit, coherently closes navigation after focal/association/relationship invalidation, binds the complete focal/association/relationship/marker selection to a server-revalidated result, and clears revoked or mismatched selection/focus/selection-bearing return context.

The Control Room closeout disposition is **Implemented — Not Verified**. The packet is merged/integrated and was not deployed independently; optional independent assurance was not performed.
