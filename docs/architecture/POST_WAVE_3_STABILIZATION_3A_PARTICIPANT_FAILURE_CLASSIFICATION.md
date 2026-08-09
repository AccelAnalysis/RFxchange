# Post-Wave 3 Stabilization 3A — Participant dependency-failure classification

**Execution baseline:** `1acfc95947d1b5c1d16bedbf4894b31a6872b22c`

**Feature-ID effect:** none

## Defect

Protected participant routes previously collapsed materially different failures into sign-in or activation navigation. A Firebase Admin, Firestore, projection, or restriction dependency failure could therefore make a returning participant appear signed out or send them to `/join`, falsely implying that durable state was lost.

The inverse case is also important: an authorized membership change is persisted account/access state, not a dependency outage. It must not create an endless Retry screen, but it also must not let another organization inherit the previous organization’s controlled/OPEN lifecycle.

## Classification contract

Stabilization 3A establishes these meanings:

- no session cookie, or an affirmatively invalid/expired/deleted/revoked/disabled credential: `unauthenticated`;
- ambiguous Firebase Admin/provider/network verification failure: retryable `authentication` dependency failure;
- no activation context: `activation-required` with `activation-context-required`;
- pre-workspace lifecycle: `activation-required` with `activation-incomplete`;
- unavailable/cross-owned lifecycle or persisted workspace identity: retryable `workspace-state` dependency failure;
- valid active bound membership with current restrictions: governed `restricted` or `authorized` result;
- restriction-provider failure: retryable `restriction-state` dependency failure;
- a proven same-user/same-organization persisted membership that has become inactive: `access-resolution-required`, never fresh activation and never Retry-only recovery.

`ParticipantRouteDependencyUnavailableError` preserves the original exception only as a server-side `cause`. Participant UI receives a bounded failure stage and never raw provider details.

## Persisted membership integrity

The lightweight workspace projection separately loads the complete active-membership set for the authenticated user and the exact persisted `activation.membershipId`, including an inactive record.

Controlled/OPEN routing requires the exact bound record to exist and match the persisted membership ID, authenticated user, and persisted organization. Missing, wrong-ID, cross-user, or cross-organization bindings fail through retryable workspace-state recovery.

If the bound membership remains active, the active projection must contain the same active membership with matching user and organization identity. Contradictory status or identity also fails closed. Only a proven same-user/same-organization inactive bound membership may enter access resolution.

## Access resolution is not lifecycle transfer

A deactivated binding does **not** authorize another active organization.

The classifier returns `access-resolution-required` with:

- `account-resolution` when no active memberships remain; or
- `organization-resolution` when one or more other active memberships exist.

The result may expose minimized organization/membership identifiers as resolution options and may record which active organization was selected for review. It deliberately does **not** return an authorized membership for that organization and does not modify `state.organization`, `state.membershipId`, `state.accessJourneyId`, or `state.lifecycleState`.

This prevents a controlled or OPEN journey earned under organization A from being copied to organization B. A selected alternative membership is a resolution input only, never authority.

## Resolution surface

`/access/resolve` is the dedicated participant-facing surface for governed membership changes. Protected Exchange, map, orientation, first-value, referral, Resource Network, provider-application, and organization-profile routes send `access-resolution-required` there instead of `/join`.

`/join` also re-runs participant route classification for an existing session and redirects access-resolution state to `/access/resolve`, preventing a participant from manually re-entering a stale completed activation context.

The resolution page re-runs the authoritative participant resolver on every request. If the original valid membership is restored, normal routing resumes automatically. Otherwise the page:

- distinguishes no-active-membership from alternative-active-membership state;
- lists current active organization memberships for review;
- allows an active organization to be selected only as a resolution option;
- explicitly states that previous activation/OPEN state does not transfer;
- provides an authoritative recheck action, homepage escape path, and sign-out action; and
- performs no membership, authority, lifecycle, restriction, or activation mutation.

The current product does not invent a second-organization activation mechanism in this stabilization pass. Until a governed organization-specific access path exists, alternative memberships remain visible resolution options rather than borrowed workspace authority.

The surface is localized in English, Spanish, French, Italian, and German and follows the existing responsive, keyboard-visible Exchange Light recovery grammar.

## Firebase verification invariant

`FirebaseServerSessionBoundary` distinguishes affirmative credential rejection from ambiguous provider failure:

- known malformed/expired credentials and `auth/user-not-found` map to `credential-invalid`;
- revocation maps to `credential-revoked`;
- disabled user maps to `account-disabled`;
- known Admin configuration/runtime failures map to `authentication-backend-unavailable`; and
- unrecognized provider, transport, or operational verification failures also map to `authentication-backend-unavailable` rather than invalidating the participant session.

A participant is sent to sign-in only when authentication has affirmative evidence that the credential is unusable.

## Recovery experience

`app/error.tsx` remains the shared retryable error boundary for unexpected render/dependency failures. Because it is root-scoped, its copy is generic and never claims that participant state exists. It is localized across all five supported locales, provides Retry and homepage actions, and shows only the opaque Next.js support digest when present.

## Regression evidence

Architecture tests cover signed-out versus retryable authentication, absent versus incomplete activation, workspace and restriction dependency failures, missing/cross-owned persisted lifecycle and membership identity, active-binding projection contradictions, valid inactive bindings with zero/one/multiple alternative active memberships, explicit alternative selection remaining non-authorizing, OPEN remaining bound to the original organization even when another organization is selected, wrong-organization/restriction outcomes, and healthy authorization for only the original valid active binding.

Source guardrails verify that the dedicated resolution page consumes the semantic result, uses localized dictionaries, performs no activation mutation, that protected participant routes send access changes to `/access/resolve` instead of `/join`, and that `/join` itself cannot bypass access resolution.

## Scope boundary

This pass changes no Feature IDs or tracker totals. It does not implement RFx Core, Wave 4, new multi-organization activation semantics, membership entitlement, organization authority changes, Firebase security-rule changes, or restriction-policy changes. It classifies dependency failure truthfully, preserves existing durable state, and provides a governed non-authorizing resolution path when membership state has legitimately changed.
