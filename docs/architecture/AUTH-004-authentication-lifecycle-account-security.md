# AUTH-004 — Authentication lifecycle and account security

## Scope

AUTH-004 implements the authentication lifecycle and account-security foundation required by tracker item AUTH-004:

- email verification where required;
- password reset/provider recovery;
- session and refresh-token revocation;
- disabled-user handling and restoration;
- account-security state inspection;
- integration with active membership and ARC-008 restriction state before organization access.

It builds on AUTH-001 provider integration, AUTH-002 Firebase-to-RFxchange identity resolution, AUTH-003 server session verification, ARC-007 access lifecycle, and ARC-008 restrictions.

## Provider-neutral account security model

`AuthenticationAccountSecuritySnapshot` represents the minimum provider state needed by RFxchange application policy:

- provider and subject;
- email and verification state;
- disabled state;
- MFA enrollment presence;
- provider token-valid-after timestamp;
- last sign-in timestamp.

The application layer does not import Firebase SDK types. Firebase `UserRecord` data is translated into this snapshot by the infrastructure adapter.

## Organization-access eligibility order

Authentication state can deny organization access but can never grant it. The minimum evaluation order is:

1. disabled identity;
2. credential revoked relative to the provider token-valid-after timestamp;
3. required email verification incomplete;
4. inactive organization membership;
5. active ARC-008 restriction;
6. only then may later organization permission evaluation continue.

The result `allowed: true` means only that the identity is eligible to proceed to organization authorization. It does not grant a role or permission.

## Email verification policy

The foundation policy requires verified email before organization access. Registration and basic account-resolution flows may still authenticate an unverified identity, but protected organization activity must deny it until verification is reflected in a refreshed provider principal/session.

The browser lifecycle adapter sends Firebase verification email and reloads the current user after the out-of-band action is completed.

## Password recovery

Password recovery is initiated through Firebase rather than storing or handling passwords in RFxchange. The browser lifecycle adapter normalizes the email and sends a Firebase password-reset message.

Callers must return the same acknowledgement regardless of whether an account exists. The adapter suppresses `auth/user-not-found` to avoid introducing an account-enumeration signal when provider configuration exposes that error.

Firebase completes the reset through its out-of-band action flow. Password reset and other major account changes invalidate existing provider sessions according to Firebase account-security behavior.

## Disable, restore, and revocation

`FirebaseAccountSecurityService` is a server-only privileged provider adapter:

- `inspect` reads the current provider security snapshot;
- `revokeSessions` revokes refresh tokens and returns the new valid-after state;
- `disable` disables the identity and revokes refresh tokens;
- `restore` re-enables the identity but does not restore old sessions.

A restored user must authenticate again. Old credentials remain behind the provider revocation boundary.

AUTH-003 maps Firebase `auth/user-disabled`, `auth/id-token-revoked`, and `auth/session-cookie-revoked` failures to explicit RFxchange server-session errors so routes can clear the session and present the correct recovery path without trusting the failed credential.

## MFA boundary

The security snapshot records whether Firebase currently has an enrolled second factor. MFA enrollment flows are not activated in this slice because Firebase MFA requires an Identity Platform decision and provider-specific UX. Privileged-administrator MFA and shorter privileged sessions remain governed by ADM-088 and later administrative security work.

## Deletion boundary

AUTH-004 does not implement account deletion. Deleting a Firebase identity without coordinating RFxchange memberships, authority, legal records, audit evidence, and retention policy would be unsafe. Account closure/deletion requires a later explicit workflow that preserves required evidence and prevents orphaned organization state.

## Operational rules

- browser code may request verification and recovery but may not disable, restore, or revoke another account;
- privileged provider operations run only through the server Firebase Admin boundary;
- passwords, reset codes, refresh tokens, session cookies, and provider secrets are never stored in RFxchange domain records;
- user-facing recovery responses must not disclose account existence;
- disabled or revoked identities fail before organization permissions are evaluated;
- membership and restrictions remain separate state domains and are not rewritten by authentication changes.

## Acceptance evidence

AUTH-004 is complete when automated checks demonstrate:

- unverified email is denied when the policy requires verification;
- disabled identities are denied;
- credentials authenticated before `tokensValidAfter` are denied as revoked;
- inactive membership and ARC-008 restriction states deny organization access;
- active verified current credentials with active membership and no restriction may proceed;
- disabling an identity revokes sessions;
- restoring an identity does not restore old credentials;
- password recovery and verification use Firebase out-of-band actions;
- AUTH-003 distinguishes disabled and revoked credentials;
- emulator-backed tests exercise verification, recovery, disable/restore, and revocation behavior without production credentials.

## Explicitly deferred

- HTTP pages and route handlers for verification/recovery/admin actions;
- account deletion/closure and retention coordination;
- MFA enrollment and challenge UX;
- privileged administrator authentication requirements under ADM-088;
- security-event persistence and notification delivery;
- anomaly/risk detection and device management;
- the full Auth + Firestore tenancy/permission matrix owned by AUTH-005.
