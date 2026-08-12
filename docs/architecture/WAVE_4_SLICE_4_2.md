# Wave 4 Slice 4.2 — Structured RFx package foundation

## Result

Slice 4.2 implements `ISS-005` and `ISS-006` at the boundary defined by `docs/slices/SLICE_4_2_EXECUTION_AUTHORITY.md` on the documentation baseline merged through PR #162 at `f2d16b9cbf7aa019d8cbd0d798f10f15782f54ec`.

The existing organization-owned Slice 4.1 RFx aggregate now carries one private, versioned package with distinct market-need dimensions, structured scope, requested outputs, timing, governed performance location, estimated value, engagement term, foundation requirements and six server-derived module statuses. The lifecycle remains exactly `draft`.

## Domain and authority

- Market need keeps source statement, observed condition, desired outcome, affected context, success measures, facts, assumptions, constraints, solution posture, proposed/prohibited approaches and unresolved questions distinct.
- Outputs and requirements use stable row identities and typed quantity, date, evidence and mandatory values.
- Estimated value uses exact, range or not-disclosed variants with uppercase currency and integer minor units. Engagement term uses fixed, fixed-with-options, ongoing or milestone-based variants.
- Performance location is resolved server-side from the current confirmed organization location and controlled geography records. Issuer-primary, organization-location, confirmed exact-address, locality and bounded multiple variants snapshot only the required operational facts.
- Every read and save reuses the canonical exact-user, membership, organization, restriction and `rfx.create` authorization boundary. Client form, URL, browser storage and map state grant no authority.

Each accepted package save increments the aggregate once and atomically creates `rfx-package-saved`, an exact-intent command receipt and `rfx.package-saved` organization audit evidence. Stable retry recovers an interrupted success; altered intent and stale versions conflict without partial evidence. Existing Slice 4.1 records without a package hydrate compatibly to `null` before their first package save.

## Workspace and interpretation

The private `/opportunities` Operational Workspace now exposes six task modules with a compact status navigator, a 1.2-second bounded debounced save, explicit save/retry controls and truthful pending, committed, validation, conflict and permission states. Outputs and requirements remain continuous typed rows. The layout is keyboard operable, responsive through 390 px, reduced-motion safe and localized in English, Spanish, French, Italian and German.

The need module optionally consumes the existing provider-neutral AI/AMACS gateway with purpose `buyer_need_definition`. Source inclusion is explicit and minimized. Suggestions remain private, reviewable and non-authoritative; dispositions do not modify the RFx. Only a separate package save can attach the reviewed interpretation record to the authoritative draft. Disabled, unavailable, quota and provider failures leave the complete manual builder usable.

The React quality review removed repeated automatic retry after a failed debounced save, guarded concurrent saves with a ref and added content visibility for the long task surface without altering semantics.

## Acceptance evidence

Focused domain/application tests prove:

- normalization and immutability of structured package variants;
- complete deterministic module status;
- exact/range currency and fixed-with-options term rules;
- issuer-primary, exact-address, locality and bounded multiple geography resolution;
- aggregate version 1 → 2/3 progression, exact replay, altered-intent collision and stale recovery;
- one aggregate and immutable package event/receipt/audit evidence; and
- invalid range/location plus cross-tenant denial with no evidence writes.

Focused Firestore emulator acceptance proves atomic package persistence, exact replay, command collision, stale-write rejection, direct-client read/write denial, immutable evidence and zero residual records. The same smoke remains in production CI.

Configured-browser acceptance creates the private draft, changes its governed request family, completes all six manual package modules through real controls, saves version 3, verifies the confirmed exact-address snapshot and all-complete module projection, rejects a stale command with HTTP 409, reloads committed state, verifies the permission-removal non-disclosure boundary, exercises all five locales and 390 px reduced-motion layout, reports a clean console and tears down all RFx fixtures. Evidence is emitted by the configured shell acceptance and is intentionally not committed as runtime artifact output.

Repository acceptance includes the Slice 4.2 architecture validator, 10 focused RFx tests, internationalization, type checking, focused lint, production build, Firestore emulator acceptance, configured-browser acceptance and the canonical `npm run check`.

## Explicit stop boundary

Slice 4.2 creates no publication/readiness model, public or permitted opportunity projection, beacon, discovery, alert, match, pursuit, teaming, response, submission, evaluation, selection, award or later RFx lifecycle state. It does not implement Slice 4.3, B6b, B6c, commercial enrollment, appearance, Presentation Mode, sensory behavior, Firebase App Hosting or build-identity work.

Stabilization 2C remains incomplete and isolated to release engineering. B6b remains Not Started / intentionally pending. B6c remains ineligible before authoritative Slice 4.4 publication.
