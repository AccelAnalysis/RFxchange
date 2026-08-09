# Post-Wave 3 production stabilization

**Execution baseline:** `d1bf92dd7d0e9fb32dc26c417067525c4278afc9`

**Feature-ID effect:** none

**Purpose:** close cross-cutting production defects after the accepted Wave 3 Network release without beginning RFx Core or making new feature-completion claims.

## Findings removed from the active list

The following items are already merged and are no longer stabilization work:

- PR #141 — permanent homepage and Founding campaign truthfulness;
- PR #142 — authentication, activation-action, protected-route, navigation, activation-handoff, and latency-instrumentation corrections;
- PR #143 — Founding acquisition continuity, canonical redirect, and responsive public navigation.

PR #142 specifically removed duplicate activation reconstruction, returning-user geography initialization, redundant immediate token refresh, heavyweight protected-route hydration, unnecessary full browser navigation for the corrected transitions, and the former 3.4-second activation delay. It also added named `Server-Timing` spans and structured timing logs.

## Revised execution order

### Stabilization 1 — write-boundary and transaction integrity

1. Bound profile-asset multipart requests before parsing, validate the exact category limit before copying file bytes, and reject MIME/signature mismatch.
2. Make referral creation + send and provider connection + send one idempotent server command so retries cannot create duplicate or stranded drafts.
3. Keep communication delivery in a durable outbox so delivery retry never recreates the business object.

### Stabilization 2 — reproducible release identity

1. Commit the trusted dependency lockfile.
2. Change CI and deployment installation to `npm ci`.
3. expose immutable frontend/backend build identity and AMACS release identity;
4. require same-SHA deployment and post-deployment smoke evidence.

### Stabilization 3 — failure classification and recovery

1. Add route/global loading, error, and not-found boundaries.
2. Distinguish absent activation data from dependency failure; dependency failure must produce a retryable service state rather than an onboarding redirect.
3. Standardize sanitized API problem responses, correlation IDs, and secured internal diagnostics.

### Stabilization 4 — workspace resilience

1. Remove Resource Network N+1 message hydration and load only the selected thread.
2. Replace remaining full-page mutation reloads with local updates or scoped refresh.
3. Stream optional market-profile, enrichment, and map panels so one subsystem cannot block the account workspace.
4. Keep list, map, filters, counts, and selected detail on one URL-derived query state.

### Stabilization 5 — map and activation correctness

1. Plot and confirm the same selected geocoder candidate.
2. Add bounded retry/recovery for required spatial-model and home-scene requests.
3. Reserve continuous orbit for instructional or milestone moments; pause or stop it in daily workspaces.
4. Update map sources without recreating the Mapbox instance when overlay data changes.

### Stabilization 6 — data correctness and participant UX

1. Carry stable sender and recipient organization IDs in referral projections; never join by display name.
2. Replace silent AMACS result truncation with count, paging or virtualization, and deterministic hierarchical fallback.
3. Replace free-text authoritative NAICS title/version entry with a governed versioned picker.
4. Align participant mobile navigation with the currently live Network destinations while keeping future RFx surfaces clearly non-live.

## Release discipline

Each stabilization correction is implemented and reviewed separately. A correction may not change tracker totals or mark a future RFx, credibility, outcome, commercial, or administrative Feature ID complete. Production CI and focused regression coverage are required before merge.
