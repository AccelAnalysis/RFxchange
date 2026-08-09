# Post-Wave 3 Stabilization 3A — Participant dependency-failure classification

**Execution baseline:** `1acfc95947d1b5c1d16bedbf4894b31a6872b22c`

**Feature-ID effect:** none

## Defect

Protected participant routes previously collapsed materially different failures into the same navigation outcomes. In particular, any authentication exception became `unauthenticated`, while an unavailable or inconsistent participant workspace projection could become `activation-required` and redirect a returning participant to `/join`.

That behavior can falsely imply that an existing account, organization, or activation journey disappeared when Firebase Admin, Firestore, or a minimum persisted-state dependency is temporarily unavailable.

## Classification contract

Stabilization 3A establishes the following protected-route meanings:

- **No session cookie:** `unauthenticated`.
- **Invalid, revoked, or disabled credential:** `unauthenticated`.
- **Firebase Admin/authentication backend failure or unexpected authentication dependency failure:** throw `ParticipantRouteDependencyUnavailableError` with stage `authentication`.
- **No activation context for the authenticated user:** `activation-required` with `state: null`.
- **Existing activation context with a pre-workspace lifecycle:** `activation-required` with the persisted state so onboarding can continue.
- **Existing activation context whose required lifecycle cannot be loaded or belongs to another user:** retryable workspace-state failure; never a fresh activation journey.
- **Controlled/open lifecycle missing or disagreeing with organization or membership identity:** retryable workspace-state failure; never `/join`.
- **Requested organization differs from the authoritative active organization:** `wrong-organization`.
- **Restriction dependency failure:** retryable restriction-state failure.
- **Persisted active restriction:** `restricted`.
- **Healthy identity, lifecycle, membership, organization, and restrictions:** `authorized`.

The `ParticipantRouteDependencyUnavailableError` intentionally does not carry participant-facing provider details. Existing structured server timing remains available for diagnosis.

## Projection invariant

`loadParticipantWorkspaceProjection()` now returns `null` for exactly one condition: the authenticated user has no activation context.

Once an activation context exists, a missing lifecycle or lifecycle owner mismatch throws `ParticipantWorkspaceProjectionError`. This prevents a persisted-state defect or dependency problem from being interpreted as a new registration.

## Recovery experience

`app/error.tsx` supplies the retryable recovery boundary for unexpected page-render failures, including participant dependency failures. The boundary:

- tells the participant that account, organization, profile, and activation progress are not reset by the error;
- provides a **Retry** action using the Next.js error-boundary reset contract;
- provides an RFxchange homepage escape path;
- exposes only the opaque Next.js support digest when present; and
- never displays the raw server exception message.

The boundary is responsive and keyboard-focus visible. It does not change authority, state, or navigation policy itself.

## Regression evidence

Architecture tests cover:

- missing session;
- invalid/revoked/disabled session;
- authentication backend and unexpected authentication failures;
- genuinely absent activation context;
- incomplete pre-workspace activation;
- workspace projection dependency failure;
- controlled-workspace identity inconsistency;
- cross-user/cross-tenant membership drift;
- wrong-organization routing;
- restriction dependency failure;
- persisted active restriction; and
- successful authorized resolution.

Source guardrails additionally verify that the recovery boundary does not render raw error messages and that activation-context absence remains the only null workspace projection.

## Scope boundary

This pass does not change RFx Core, Network feature counts, membership entitlement, organization authority, restriction semantics, Firebase security rules, or tracker totals. It does not claim that external dependencies cannot fail; it ensures those failures are classified truthfully and recover without telling a returning participant to register again.
