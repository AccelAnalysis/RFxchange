# Post-Wave 3 Stabilization 3A — Participant dependency-failure classification

**Execution baseline:** `1acfc95947d1b5c1d16bedbf4894b31a6872b22c`

**Feature-ID effect:** none

## Defect

Protected participant routes previously collapsed materially different failures into the same navigation outcomes. In particular, any authentication exception became `unauthenticated`, while an unavailable or inconsistent participant workspace projection could become `activation-required` and redirect a returning participant to `/join`.

The Firebase server-session adapter also defaulted unrecognized verification failures to `credential-invalid`. A transient provider or network error could therefore be interpreted as proof that an otherwise valid participant session was bad.

These behaviors can falsely imply that an existing account, organization, or activation journey disappeared when Firebase Admin, Firestore, or another minimum persisted-state dependency is temporarily unavailable.

## Classification contract

Stabilization 3A establishes the following protected-route meanings:

- **No session cookie:** `unauthenticated`.
- **Recognized malformed, expired, revoked, or disabled credential:** `unauthenticated`.
- **Firebase Admin/authentication backend failure, unknown provider verification failure, or unexpected authentication dependency failure:** throw `ParticipantRouteDependencyUnavailableError` with stage `authentication`.
- **No activation context for the authenticated user:** `activation-required` with `state: null`.
- **Existing activation context with a pre-workspace lifecycle:** `activation-required` with the persisted state so onboarding can continue.
- **Existing activation context whose required lifecycle cannot be loaded or belongs to another user:** retryable workspace-state failure; never a fresh activation journey.
- **Controlled/open lifecycle missing or disagreeing with organization or membership identity:** retryable workspace-state failure; never `/join`.
- **Requested organization differs from the authoritative active organization:** `wrong-organization`.
- **Restriction dependency failure:** retryable restriction-state failure.
- **Persisted active restriction:** `restricted`.
- **Healthy identity, lifecycle, membership, organization, and restrictions:** `authorized`.

The classification policy is isolated from Firebase/Firestore production wiring so it can be tested directly. `ParticipantRouteDependencyUnavailableError` preserves the original failure as a server-only `cause` while participant UI never renders raw exception details. Existing structured server timing remains available for diagnosis.

## Firebase verification invariant

`FirebaseServerSessionBoundary` now distinguishes affirmative credential rejection from ambiguous provider failure before the protected-route classifier runs:

- recognized invalid or expired ID-token/session-cookie errors map to `credential-invalid`;
- recognized revocation maps to `credential-revoked`;
- recognized disabled-user state maps to `account-disabled`;
- Firebase Admin configuration/runtime failures map to `authentication-backend-unavailable`; and
- unrecognized provider, transport, or operational verification failures also map to `authentication-backend-unavailable` rather than invalidating the participant session.

This is intentionally conservative. A participant is routed to sign-in only when the authentication layer has affirmative evidence that the credential is unusable. An ambiguous verification failure reaches retryable recovery instead.

## Projection invariant

`loadParticipantWorkspaceProjection()` now returns `null` for exactly one condition: the authenticated user has no activation context.

Once an activation context exists, a missing lifecycle or lifecycle owner mismatch throws `ParticipantWorkspaceProjectionError`. This prevents a persisted-state defect or dependency problem from being interpreted as a new registration.

## Recovery experience

`app/error.tsx` supplies the shared retryable recovery boundary for unexpected page-render failures, including participant dependency failures. Because the root boundary can also render for public visitors, its copy is deliberately generic and makes no claim that an account or organization exists.

The boundary:

- resolves all customer-facing copy through the existing `I18nProvider`;
- provides parity catalogs for English, Spanish, French, Italian, and German;
- provides a **Retry** action using the Next.js error-boundary reset contract;
- provides an RFxchange homepage escape path;
- exposes only the opaque Next.js support digest when present; and
- never displays the raw server exception message or invents durable participant state.

The boundary is responsive and keyboard-focus visible. It does not change authority, state, or navigation policy itself. For a protected participant dependency failure, the important guarantee is routing semantics: the exception reaches this recovery boundary instead of being converted into `/join` or sign-in.

## Regression evidence

Architecture tests cover:

- missing session;
- recognized invalid/revoked/disabled session;
- recognized Firebase Admin configuration failure;
- unknown provider/network verification failure;
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

Source and internationalization guardrails additionally verify that:

- the recovery boundary does not render raw error messages or participant-state assurances;
- all five recovery catalogs have the same non-empty message shape;
- the resolved dictionary contains the recovery namespace; and
- activation-context absence remains the only null workspace projection.

## Scope boundary

This pass does not change RFx Core, Network feature counts, membership entitlement, organization authority, restriction semantics, Firebase security rules, or tracker totals. It does not claim that external dependencies cannot fail; it ensures those failures are classified truthfully and recover without telling a returning participant to register again.
