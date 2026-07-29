# AUTH-002 — Firebase identity → RFxchange UserIdentity resolution

## Status

Implemented as the provider-to-domain identity resolution layer following AUTH-001.

## Purpose

Firebase Authentication answers **who authenticated with Firebase**. RFxchange still requires its own stable `UserIdentity` so organization memberships, permissions, audit attribution, lifecycle state, legal acknowledgements, and future provider changes are not keyed directly to a Firebase UID.

AUTH-002 establishes that mapping.

## Identity chain

```text
trusted Firebase authentication identity
→ provider = firebase
→ provider subject = Firebase UID
→ AUTH-002 resolver
→ stable RFxchange UserIdentity
→ organization memberships / authorization / lifecycle
```

A Firebase UID is never treated as an RFxchange `UserId`.

## Trust boundary

AUTH-002 does not verify Firebase ID tokens.

Firebase documents that a custom backend must verify the client ID token before trusting the contained `uid`. AUTH-003 owns that server credential/session boundary. AUTH-002 therefore accepts a `TrustedAuthenticationIdentity` and assumes its caller has already established that trust.

Browser-provided UID strings must never be passed directly to the resolver.

## Resolution rules

1. Anonymous Firebase identities are rejected.
2. Provider and provider subject are mandatory.
3. RFxchange first queries `UserIdentityRepository.getByLogin(provider, subject)`.
4. If found, that existing RFxchange identity is returned unchanged.
5. Email matching is **not** used as an automatic account-linking mechanism.
6. A first-time RFxchange identity requires a provider email.
7. A first-time identity requires either an RFxchange onboarding name or provider display name.
8. The onboarding-supplied name wins when both are present.
9. Email verification state is returned to the caller but does not block identity creation in AUTH-002; verification policy belongs to AUTH-004.
10. Repeated resolution of the same provider subject must return the same RFxchange user.

## Stable RFxchange user IDs

The Firebase adapter derives an RFxchange-specific ID using SHA-256 over a namespaced provider/subject value and stores a shortened digest with a `usr_` prefix.

```text
Firebase UID:   abC123-provider-owned-value
RFxchange ID:   usr_<32 hex characters>
```

The RFxchange ID is therefore:

- stable for the same provider subject;
- not equal to the Firebase UID;
- valid before a separate mapping collection exists;
- deterministic across retries;
- safe against duplicate first-login creation races when the same Firebase identity is resolved concurrently.

The application layer does not know how IDs are derived. It depends on `UserIdentityIdStrategy`; the Firebase-specific hash strategy remains in infrastructure.

## Concurrency and idempotency

The resolver performs:

```text
lookup provider + subject
→ derive stable UserId
→ check UserId occupancy
→ create UserIdentity
→ on create race, re-read provider subject/UserId
```

If another resolver creates the same deterministic identity first, the losing call re-reads and returns the now-existing identity.

If the deterministic ID is somehow occupied by a different login identity, resolution fails closed with `user-id-collision`.

## No email auto-linking

RFxchange deliberately does not call `getByPrimaryEmail()` during authentication resolution.

The same email address under another provider subject does not prove that RFxchange should merge two identities. Automatic email linking could turn provider/account recovery errors into account takeover paths. Any future cross-provider account linking must require an explicit, authenticated linking flow and its own audit evidence.

## Provider profile changes

Once an RFxchange identity exists, AUTH-002 returns the stored identity rather than silently replacing its name or primary email with later provider metadata.

Profile synchronization, email changes, credential/security changes, MFA state, verification gates, recovery, and account lifecycle behavior belong to later authentication/profile slices, primarily AUTH-004.

## Emulator acceptance

CI starts Firebase Auth and Firestore emulators together and proves:

1. Firebase creates a new email/password principal;
2. AUTH-002 resolves that principal into a Firestore-backed RFxchange `UserIdentity`;
3. RFxchange `UserId` differs from Firebase UID;
4. the login record retains provider `firebase` plus the exact Firebase subject;
5. after sign-out/sign-in, the same Firebase UID is recovered;
6. the second resolution returns `existing` and the same RFxchange `UserId`;
7. the identity can be retrieved through the Firestore repository by provider + subject.

No production Firebase user, production Firestore data, or privileged service-account key is required for this test.

## Deliberately deferred

- Firebase ID-token verification — AUTH-003
- server session cookies/session lifetime — AUTH-003
- request authentication middleware — AUTH-003
- email verification access policy — AUTH-004
- MFA/recovery/credential security lifecycle — AUTH-004
- explicit cross-provider account linking
- provider profile synchronization
- organization membership resolution after identity — existing ARC-003/004 model, composed into the authenticated vertical slice later

## Acceptance result

AUTH-002 is complete when a trusted Firebase provider identity resolves idempotently to one Firestore-backed RFxchange `UserIdentity`, Firebase UID and RFxchange `UserId` remain distinct, email alone cannot link accounts, first-login data requirements fail closed, concurrent creation is retry-safe, domain/application identity logic remains Firebase-independent, and CI proves the Auth-emulator-to-Firestore mapping end to end.
