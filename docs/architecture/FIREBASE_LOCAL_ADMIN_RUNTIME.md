# Firebase Local Admin Runtime

## Purpose

The browser Firebase Web SDK and the server Firebase Admin SDK have different configuration responsibilities.

The Web SDK uses the `NEXT_PUBLIC_FIREBASE_*` values to authenticate a user and obtain a Firebase ID token. Those browser values do **not** give the Next.js server permission to verify revocation, create Firebase session cookies, or access privileged Firebase Admin services.

When local development is intentionally connected to a real Firebase project, the Next.js server must also have a Firebase Admin identity through Google Application Default Credentials (ADC).

## Local real-Firebase configuration

The server binds the Admin SDK to the same project used by RFxchange configuration:

1. `RFXCHANGE_EXPECTED_PROJECT_ID` is preferred as the server authority.
2. `NEXT_PUBLIC_FIREBASE_PROJECT_ID` must match it when both are present.
3. The Admin SDK is initialized with `applicationDefault()` and the resolved project ID.

For local development outside Google-managed infrastructure, provide ADC without committing credentials to the repository. The common service-account-file pattern is:

```dotenv
GOOGLE_APPLICATION_CREDENTIALS=/absolute/local/path/to/firebase-admin-service-account.json
```

The JSON credential file itself must remain outside the repository and must never be committed. `GOOGLE_APPLICATION_CREDENTIALS` contains only a local filesystem path.

Google-managed runtime environments such as Cloud Run, Firebase App Hosting, and Cloud Functions should use the runtime service identity rather than a local key file.

## Session exchange

The RFxchange session exchange remains:

```text
Firebase Web sign-in
→ Firebase ID token
→ CSRF-protected server exchange
→ Admin SDK verifies ID token/revocation
→ Admin SDK creates HttpOnly Firebase session cookie
→ RFxchange resolves the trusted user identity
```

A missing or unusable Admin credential is an infrastructure/configuration failure, not an invalid end-user ID token. The server returns an authentication-backend configuration error for that class of failure rather than mislabeling the user's credential.

## Project mismatch

The server refuses to initialize when `RFXCHANGE_EXPECTED_PROJECT_ID` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID` disagree. This prevents a browser token minted by one Firebase project from being accidentally exchanged against another project's server authority.
