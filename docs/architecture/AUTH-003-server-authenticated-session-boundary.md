# AUTH-003 — Server-side authenticated session boundary

## Purpose

AUTH-003 establishes the server trust boundary between Firebase Authentication credentials and an authenticated RFxchange request context.

The browser is never authoritative for `uid`, email, organization access, or RFxchange `UserId`. A Firebase credential becomes trusted only after Firebase Admin verifies it on the server. The verified provider identity is then resolved through AUTH-002 to the RFxchange `UserIdentity`.

## Flow

1. Firebase Web Authentication signs in the browser.
2. The browser obtains a Firebase ID token.
3. A server session-exchange endpoint must perform CSRF verification before calling this boundary.
4. AUTH-003 verifies the ID token with Firebase Admin and checks revocation.
5. Session exchange requires `auth_time` within five minutes.
6. AUTH-002 resolves the verified Firebase provider subject to one RFxchange `UserIdentity`.
7. Firebase Admin issues a five-day session cookie.
8. The HTTP layer sets the returned cookie metadata: `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production.
9. Protected server requests provide the cookie to AUTH-003.
10. AUTH-003 verifies the session cookie with revocation checking and returns an `AuthenticatedServerContext` containing the RFxchange user plus trusted provider metadata.

## Security decisions

- Firebase UID remains a provider subject and never becomes the RFxchange `UserId`.
- Browser-supplied identity claims are never trusted directly.
- ID-token and session-cookie verification request revocation checks.
- Session creation is blocked unless the caller confirms CSRF verification.
- Session creation requires recent authentication (five minutes).
- Session duration is five days, within Firebase's supported five-minute to two-week range.
- Cookie values are never exposed to client JavaScript by the intended HTTP transport (`HttpOnly`).
- Authorization is not inferred from authentication. Organization membership, restrictions, and permissions remain separate application/domain checks.
- AUTH-003 does not implement password reset, MFA enrollment, email-verification enforcement, account recovery, or token-revocation workflows; AUTH-004 owns those lifecycle concerns.

## Transport boundary

This slice deliberately does not create Next.js route handlers. It returns a cookie descriptor and authenticated context so future HTTP endpoints have one canonical authentication service rather than calling Firebase Admin APIs independently.

A session-login endpoint must validate CSRF before setting the cookie. A logout endpoint should clear the cookie; global Firebase refresh-token revocation is a separate security action and should not be performed on every ordinary logout.

## Emulator acceptance

CI runs Firebase Authentication and Firestore emulators. The AUTH-003 smoke test creates a Firebase principal, obtains an ID token, has Firebase Admin verify/exchange it for a session cookie, signs the browser state out, verifies the session cookie through the server boundary, and confirms the same RFxchange user is recovered.
