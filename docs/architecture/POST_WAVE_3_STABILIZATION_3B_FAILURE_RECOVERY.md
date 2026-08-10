# Post-Wave 3 Stabilization 3B — runtime failure recovery and API problem convergence

**Execution baseline:** `b3ef4bafe8e4134817754c9fa6982bffa9588e3c`

**Feature-ID effect:** none

## Defect

Stabilization 3A separated unauthenticated, activation-required, governed access-resolution, restricted, authorized, and retryable participant dependency states. Several route-handler catch paths could still serialize arbitrary exception messages, however, and some participant API resolvers ran outside their catch boundaries. The application also had only a root render error boundary, leaving no explicit root loading, not-found, or root-layout failure experience.

Those gaps could expose provider or infrastructure wording, turn an outage into an unclassified framework response, or leave a participant without a bounded recovery action. A stale referral-attachment path also sent an access-resolution state to `/join`, contrary to the 3A contract.

## API problem contract

`src/infrastructure/http/api-problem.ts` is the shared response boundary for caught participant and administrative API failures. It enforces:

- a bounded status allow-list;
- caller-supplied, allow-listed participant copy rather than exception messages;
- a bounded public code when a route has an explicit domain classification;
- opaque UUID correlation and support identifiers in the response body and headers;
- `no-store` failure responses;
- structured server diagnostics containing route, method, status, opaque identifiers, error class, and a bounded diagnostic code; and
- no exception message, stack, provider response body, credential, tenant detail, or internal identifier in the participant response.

Known domain failures retain their existing status/code distinctions with sanitized route-specific wording. Unexpected and participant-route dependency failures use a retryable 5xx response and never become sign-in, activation, join, or fabricated not-found state. Explicit validation and authorization responses remain direct and keep their existing semantics.

Network-education, atomic referral, Market Profile, and organization-enrichment persistence exceptions are no longer rewritten wholesale as ordinary domain conflicts. The Firestore adapters now throw typed persistence-conflict errors only for transaction-observed version, evidence-identity, idempotency, and command/record identity collisions; the application maps those deterministic races to sanitized 409 domain conflicts. Unclassified Firestore and dependency failures propagate to the API boundary as retryable 5xx, while ordinary pre-transaction version, state, validation, and command-identity conflicts keep their existing domain classifications. Acquisition-context binding now uses a typed domain error for a missing context, wrong browser secret, expiry, or cross-journey reuse. Those permanently invalid contexts are rejected and their cookie is removed; an unclassified bind outage during otherwise successful sign-in is reported as `unavailable` and preserves the cookie for retry. Orientation and first-value OPEN release likewise distinguish typed participant-scope and journey/lifecycle state conflicts from repository or provider outages, preserving bounded 403/409 semantics without exception-message projection. First-value optimistic persistence and release-transaction revision conflicts use the same typed classification, while malformed persistence or dependency access still fails as 5xx.

Activation website, contact, phone, capability, and postal-address parsing/normalization, Market Profile model construction, and organization-enrichment evidence/storage identifier parsing now enter explicit typed validation boundaries. Deterministic participant-editable input failures retain sanitized 400 semantics; repository, provider, and other unclassified operational failures bypass those narrow boundaries and remain retryable 5xx responses. Census locality invalid-input, missing-selection, and provider-failure outcomes retain distinct sanitized 400, 404, and 503 classifications, while typed organization-resolution lifecycle, candidate-review, already-resolved, and identity-conflict outcomes retain their domain codes on the bounded 409 path. Stale attempts to republish retired profile assets or additional locations use explicit typed state preconditions and retain sanitized 409 conflict semantics.

## Runtime recovery boundaries

The App Router now has four distinct recovery conventions:

- `loading.tsx` announces a polite loading state and uses reduced-motion-safe visual feedback;
- `not-found.tsx` states that the route is unavailable and provides a homepage action;
- `error.tsx` remains the localized resettable render/dependency boundary inside the root layout; and
- `global-error.tsx` is a standalone root-layout failure boundary with its own `html` and `body`, browser-locale recovery copy, Retry/home actions, and only the opaque Next.js digest when available.

All changed platform copy exists for `en-US`, Spanish, French, Italian, and German. Neither error boundary exposes exception messages or stacks.

## 3A classification preservation

API routes that require participant resolution now include resolution and dependent reads/writes within their sanitized catch path. They continue to treat only affirmative missing/rejected credentials as unauthenticated and require the exact `authorized` result for organization commands. Dependency failures throw into retryable API recovery rather than being treated as onboarding state.

The required spatial-model and home-scene APIs preserve distinct bounded responses for unauthenticated, access-resolution, activation-required, wrong-organization, restricted, and authorized states before entering their dependent reads. None of those states is inferred from exception wording.

Authorized geography, orientation, first-value, organization-profile, referral, and Resource Network pages no longer redirect to `/join` when a required post-authorization workspace projection is missing. That state is inconsistent with the already-proven authorized lifecycle, so it now raises the bounded `workspace-state` dependency failure for retry. `/join` also reuses the 3A classifier context instead of authenticating a second time and converting a second-call authentication outage into the public preview. A genuinely unauthenticated participant or an activation journey with no locality selection may still receive the truthful public preview.

Referral attachment now routes `access-resolution-required` to `/access/resolve` before considering unauthenticated or genuine activation-required entry. It does not transfer lifecycle or organization authority and does not restart activation for a changed membership. Because attachment is submitted through a native form, a caught dependency failure emits the secured diagnostic event and redirects back to the bounded acquisition recovery surface rather than navigating the browser to a JSON envelope. The recovery surface retains the saved context, offers the attachment action again, and may display only the opaque support identifier.

## Regression evidence

Behavioral tests verify the response envelope, opaque identifier handling, bounded status fallback, `no-store` headers, typed acquisition and orientation state errors, and the absence of provider message/stack content from both participant responses and structured diagnostic events. Source guardrails verify all converged catch paths use the shared boundary, all runtime recovery files exist with their accessibility semantics, all five locale dictionaries contain the new states, referral attachment preserves access resolution, and its native form failure returns to accessible participant recovery.

The complete Stabilization 3 validation also reruns the 3A participant failure-classification suite and the repository `npm run check` gate.

## Scope boundary

This stabilization changes no Feature ID, tracker total, organization authority, membership entitlement, lifecycle transition, restriction policy, geography rule, Firebase security rule, or AMACS semantic. It does not begin Wave 4 RFx Core, B6b, an Exchange-shell runtime, Intelligence, Locations, Dark Appearance, Presentation Mode, or another later slice/gate.
