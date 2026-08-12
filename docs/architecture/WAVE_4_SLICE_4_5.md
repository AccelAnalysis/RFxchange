# Wave 4 Slice 4.5 — Opportunity discovery and management

## Result

Slice 4.5 implements `DSC-004`, `DSC-005`, `DSC-006`, `DSC-007` and `DSC-008` at the boundary defined by `docs/slices/SLICE_4_5_EXECUTION_AUTHORITY.md` on the documentation baseline merged at `426300e8d94a6370e2dea040b204da0889014102`.

The permanent Opportunities/RFx lens now resolves to one real participant Spatial Workspace backed only by accepted Slice 4.4 publication projections. Issuer definition remains a private Operational Workspace at `/opportunities/manage`. No draft, preview, seeded fixture or browser state enters discovery.

## Discovery and spatial truth

- One server-owned query normalizes text, request-family, AMACS capability, controlled-locality, canonical-deadline and private-watch predicates. Malformed filters and stale/query-mismatched cursors fail rather than broadening results.
- Results include only published, supported-audience, unexpired projections whose controlled localities remain released. Ordering is canonical deadline then opaque reference; commercial, Founding, activity and watch counts never rank results.
- List, map object and responsive detail use one projection digest/version and one opaque selected reference. Locality-only opportunities render at the controlled locality anchor without reconstructing a private point.
- The Signal Blue opportunity object is distinct from organization nodes and relationship paths. This bounded task expression does not complete Brand Gate B6c.
- The API/HTML projection excludes the private aggregate, internal RFx ID, actor/membership evidence, commands, audit data, interpretations, exact geography and server index keys.

## Saved searches, alerts, watches and deadlines

- Private organization/user saved searches have explicit version, active/paused/deleted lifecycle, expected-version updates, stable command replay/conflict, immutable events and organization audit evidence.
- The publication evaluator reuses the exact interactive predicate. Its immutable match identity includes saved-search version, opportunity reference, projection version/digest and evaluation-policy version, so exact reprocessing is inert.
- Immediate alerts and recipient-day daily digests persist minimized, versioned `rfx.opportunity-alert` requests through the existing provider-neutral transactional-email contract. Match evidence remains separate from queued delivery intent; recipient membership, restrictions, current projection, geography release and deadline are rechecked before persistence.
- One watch relation is canonical for `(organization, user, opportunity reference)`. Watch/unwatch is private, idempotent and does not clone an RFx or imply pursuit.
- The participant view groups watched opportunities into next 7 days, days 8–30 and later, derived only from canonical response deadlines and the server clock.

## Authorization and persistence

Interactive reads reuse the current unrestricted OPEN participant boundary. Consequential saved-search/watch writes recheck exact membership and organization restrictions inside their Firestore transaction. Match/alert writes additionally recheck the current saved-search version, publication audience/version/digest, open deadline and every controlled locality release.

Direct browser reads and writes remain denied for opportunity projections and every private relation, match, alert, command, event and audit collection. Append-only evidence cannot be updated or deleted by clients.

## Acceptance evidence

Focused domain/application tests cover malformed-query rejection, deterministic text/structured/deadline/watch predicates, expired/draft/audience exclusion, stable ordering, deadline grouping, saved-search replay/conflict, unique watches, exact match replay, versioned minimized alert rendering and recipient-day digest collapse.

Firestore emulator acceptance extends the complete Slice 4.4 draft → definition → publication flow through real discovery. It proves saved-search and watch transaction evidence, publication evaluation, one match and one alert, exact replay, current released geography, server-only access across all new collections and exact zero-residual cleanup.

Configured-browser acceptance creates and publishes a real RFx, verifies the saved query produces one private match/alert intent, opens the real Opportunities Spatial Workspace, selects the same reference in list/detail, proves the API/HTML omits index envelopes, watches the opportunity with exact replay, renders the canonical deadline view and returns to issuer management. The persistent-shell route chain includes `Intelligence → Opportunities/RFx → Resources → Referrals → Intelligence → Account → Quick Start`, with one document navigation, zero shell remounts, zero page-wide loading takeovers, no activation replay, 390 px/no-overflow and reduced-motion acceptance, all five locales, and clean console/exception results.

Representative local candidate transitions recorded median 131.1 ms and p90 146.0 ms; the intentionally delayed Resources transition settled in 1,017.2 ms with immediate pending feedback and preserved content. These are diagnostic local observations, not production-network promises.

Repository acceptance includes the Slice 4.5 architecture validator, focused tests, internationalization, type checking, lint, production and Functions builds, Firestore schema/index/security checks, the RFx/discovery emulator, configured-browser acceptance and the canonical `npm run check`.

## Dependency and stop boundary

Acceptance supports marking only `DSC-004`, `DSC-005`, `DSC-006`, `DSC-007` and `DSC-008` Done. The checkpoint is **438 total · 170 Done · 268 Not Started**, with Wave 4 RFx Core **18/41**.

Slice 4.6 becomes eligible for a separately reviewed documentation authority. No fit, Potential Match, Go/No-Go, pursuit, gap/team, response, submission, evaluation, award or outcome runtime was introduced. B6c remains eligible but Not Started; B6b remains intentionally pending; Stabilization 2C remains incomplete and isolated to release engineering.
