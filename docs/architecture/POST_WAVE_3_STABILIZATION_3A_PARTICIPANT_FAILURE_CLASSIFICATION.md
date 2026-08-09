# Post-Wave 3 Stabilization 3A — Participant dependency-failure classification

**Execution baseline:** `1acfc95947d1b5c1d16bedbf4894b31a6872b22c`

**Feature-ID effect:** none

## Defect

Protected participant routes previously collapsed materially different failures into the same navigation outcomes. In particular, any authentication exception became `unauthenticated`, while an unavailable or inconsistent participant workspace projection could become `activation-required` and redirect a returning participant to `/join`.

The Firebase server-session adapter also defaulted unrecognized verification failures to `credential-invalid`. A transient provider or network error could therefore be interpreted as proof that an otherwise valid participant session was bad.

The inverse edge also matters: a deliberately deactivated organization membership is governed account state, not a dependency outage. Retry-only recovery must not trap a user whose membership was changed by an authorized repair.

## Classification contract

Stabilization 3A establishes the following protected-route meanings:

- **No session cookie:** `unauthenticated`.
- **Recognized malformed, expired, deleted-user, revoked, or disabled credential:** `unauthenticated`.
- **Firebase Admin/authentication backend failure, unknown provider verification failure, or unexpected authentication dependency failure:** throw `ParticipantRouteDependencyUnavailableError` with stage `authentication`.
- **No activation context for the authenticated user:** `activation-required` with `state: null`.
- **Existing activation context with a pre-workspace lifecycle:** `activation-required` with the persisted state so onboarding can continue.
- **Existing activation context whose required lifecycle cannot be loaded or belongs to another user:** retryable workspace-state failure; never a fresh activation journey.
- **Controlled/open lifecycle with structurally missing identity or contradictory active identity:** retryable workspace-state failure.
- **Controlled/open lifecycle whose previously bound membership was deliberately deactivated:** resolve the current active membership set through the existing ARC-003 access contract rather than treating it as a dependency failure.
- **No active memberships after governed repair:** `activation-required`, entering the existing account-resolution path rather than Retry.
- **Exactly one remaining active membership after governed repair:** rebind the request-local workspace projection to that active organization and continue normal organization access.
- **Multiple remaining active memberships:** require organization resolution; an explicitly requested active organization can be selected for the request, otherwise the current resolution surface is used.
- **Requested organization differs from the authoritative/resolved active organization:** `wrong-organization`.
- **Restriction dependency failure:** retryable restriction-state failure.
- **Persisted active restriction:** `restricted`.
- **Healthy identity, lifecycle, membership, organization, and restrictions:** `authorized`.

The classification policy is isolated from Firebase/Firestore production wiring so it can be tested directly. `ParticipantRouteDependencyUnavailableError` preserves the original failure as a server-only `cause` while participant UI never renders raw exception details. Existing structured server timing remains available for diagnosis.

## Firebase verification invariant

`FirebaseServerSessionBoundary` distinguishes affirmative credential rejection from ambiguous provider failure before the protected-route classifier runs:

- recognized invalid or expired ID-token/session-cookie errors map to `credential-invalid`;
- `auth/user-not-found` also maps to `credential-invalid` because a deleted provider identity is affirmative evidence that the credential can no longer establish a participant session;
- recognized revocation maps to `credential-revoked`;
- recognized disabled-user state maps to `account-disabled`;
- Firebase Admin configuration/runtime failures map to `authentication-backend-unavailable`; and
- unrecognized provider, transport, or operational verification failures map to `authentication-backend-unavailable` rather than invalidating the participant session.

This is intentionally conservative. A participant is routed to sign-in only when the authentication layer has affirmative evidence that the credential is unusable. An ambiguous verification failure reaches retryable recovery instead.

## Projection and access-resolution invariants

`loadParticipantWorkspaceProjection()` returns `null` for exactly one condition: the authenticated user has no activation context.

Once an activation context exists, a missing lifecycle or lifecycle owner mismatch throws `ParticipantWorkspaceProjectionError`. The projection also carries the complete active-membership set while preserving the persisted activation membership identifier even when that membership is no longer active.

That distinction allows the classifier to tell apart:

- **unavailable/inconsistent persisted state**, which is retryable; and
- **governed membership change**, which is evaluated with `resolveUserOrganizationAccess()` and follows account/organization resolution.

This prevents an administrative membership repair from becoming an endless temporary-outage screen while preserving fail-closed behavior for actual identity inconsistency.

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
- recognized invalid/expired/deleted/revoked/disabled session;
- recognized Firebase Admin configuration failure;
- unknown provider/network verification failure;
- authentication backend and unexpected authentication failures;
- genuinely absent activation context;
- incomplete pre-workspace activation;
- workspace projection dependency failure;
- structurally missing controlled-workspace identity;
- governed deactivation with no remaining active membership;
- governed deactivation with one remaining active organization;
- governed deactivation with multiple active organizations plus explicit selection;
- contradictory cross-user/cross-tenant membership drift;
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

This pass does not change RFx Core, Network feature counts, membership entitlement, organization authority, restriction semantics, Firebase security rules, or tracker totals. It does not claim that external dependencies cannot fail; it ensures those failures are classified truthfully, and it distinguishes those failures from legitimate account/membership changes that require access resolution rather than Retry.
