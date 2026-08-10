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

Implementation and acceptance authority: [POST_WAVE_3_STABILIZATION_4_WORKSPACE_RESILIENCE.md](./POST_WAVE_3_STABILIZATION_4_WORKSPACE_RESILIENCE.md).

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

### Stabilization 7 — administrative portal runtime convergence

This is a no-Feature-ID integration gate over already accepted administrative foundations, including `ADM-057` and the existing command-center/User 360 foundations. It must not reopen or change their tracker completion state merely to make their approved components reachable in the production runtime.

1. Add a server-authorized `/admin` entry that resolves the authenticated RFxchange session to a persisted platform-administrator account, privileged-security state, authority context and active grants before selecting an administrative destination. Route an administrator to `/admin/overview` only when that section is permitted **and its truthful runtime is registered as available**; otherwise route to the first actually permitted, implemented administrative section. Non-administrators must fail closed.
2. Preserve `buildAdministrativeCommandCenter` as the accepted strict `ADM-058`/`ADM-059` projection: it must continue to require exact coverage for all ten queues and all seven health panels. `/admin/overview` must not call that builder until every required provider has a truthful authoritative source. Stabilization 7 may instead introduce a separate, bounded administrative runtime-overview projection that reports only implemented protected surfaces and existing operational sources, with explicit unavailable state for future-domain slots and no fabricated zero counts, health states or metrics. If neither a complete strict command center nor that truthful availability-aware overview is implemented, withhold `/admin/overview` and route to the first permitted implemented section.
3. Add an `Administration` entry from the authenticated Account/Menu experience only when the server-resolved identity has legitimate administrative access. Ordinary participants must not receive an administrative affordance solely because they are signed in.
4. Make the canonical administrative navigation production-safe through an explicit server-owned implemented-runtime registry: a destination is visible only when both the administrator's current permission/grant scope permits it and its protected runtime is registered as implemented. Permission visibility alone is not runtime availability. Withhold dead administrative links and future domains; do not create placeholder authority or fabricate RFx, commerce, credibility or other domain state.
5. Preserve minimum-necessary permission and scope checks on every section and action. Portal entry and navigation visibility never grant feature authority, organization authority, entitlement, credibility, lifecycle or RFx authority.
6. Add configured-browser acceptance for Super Admin entry, narrower permission-and-runtime-filtered navigation, direct-route denial, truthful overview availability or deferral, recent-reauthentication handling, return-to behavior after sign-in and absence of administrative navigation for a normal participant.

### Stabilization 7 boundary

This gate makes the already-approved administrative information architecture operationally reachable and coherent. It does not weaken the strict accepted command-center coverage contract, create new administrative powers, implement future administrative Feature IDs, begin RFx Core, or change tracker totals. Any administrative domain whose underlying runtime or authoritative provider is still future work remains explicitly unavailable or absent rather than being simulated by the portal shell.

## Release discipline

Each stabilization correction is implemented and reviewed separately. A correction may not change tracker totals or mark a future RFx, credibility, outcome, commercial, or administrative Feature ID complete. Production CI and focused regression coverage are required before merge.
