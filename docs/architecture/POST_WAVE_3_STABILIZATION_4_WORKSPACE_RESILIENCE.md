# Post-Wave 3 Stabilization 4 — workspace resilience

**Implementation baseline:** `3f4dfe9a58fc256f6ec31ce99bf2a74375d25f51`

**Feature-ID effect:** none

## Corrected invariants

The live Resource Network workspace uses one bounded URL-derived contract:

- `q` is the normalized server-side discovery query;
- `availability` is one maintained availability state or `all`;
- `provider` is accepted only when it remains in the current authorized discovery projection; and
- `request` is accepted only when it remains in the current organization-authorized provider-request projection.

Provider results, result count, map service-field selection and provider detail now consume that same server projection and selected provider identity. A request message thread is loaded only when its exact authorized request is selected. The page no longer hydrates every request thread.

Resource, provider-request and provider-management mutations refresh the current React Server Component projection instead of reloading the browser document. Referral creation additionally carries the returned stable referral ID into the `request` URL parameter before the authoritative server projection reloads. Retry-stable create-and-send command behavior remains unchanged.

The Account organization-profile route starts its optional market-profile, organization-enrichment and participant-map loads concurrently, immediately converts dependency failures into explicit unavailable results, and renders them behind separate Suspense boundaries. Organization identity, authorization, completion, location and marker facts remain the essential shell. Optional dependency latency or failure therefore cannot reinterpret an authorized participant as absent or prevent the primary Account workspace from rendering.

## Authority and scope

Server-resolved participant access, lifecycle, geography participation, privacy filtering, organization scope and request visibility remain authoritative. URL state selects only from already authorized projections and grants no access. Optional-panel fallbacks expose no provider error details to participants; server diagnostics retain the failed dependency label.

This correction does not implement the future persistent four-lens Exchange context, RFx Core, Intelligence or Locations runtime, appearance modes, B6b, or any new Feature ID. Tracker totals remain `438 total · 152 Done · 286 Not Started`.

## Acceptance

- behavioral query normalization and authorized-selection tests;
- optional dependency success/failure settlement tests;
- changed Resource Network and Account loading/unavailable copy in all five supported interface locales;
- source guardrails for one selected-thread query, no browser mutation reloads, scoped refresh and three Account Suspense boundaries;
- existing Resource Network architecture and domain tests; and
- the complete repository `npm run check` gate.
