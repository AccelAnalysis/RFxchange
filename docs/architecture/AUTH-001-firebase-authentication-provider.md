# AUTH-001 — Firebase Authentication provider integration

## Status

Provider foundation implemented with Firebase Web Authentication and Firebase Admin Authentication boundaries.

## Provider decision

Firebase Authentication is the production identity provider for RFxchange. The application uses the modular Firebase Web SDK for end-user browser authentication and Firebase Admin Authentication for trusted server-side provider access.

Firebase identity is not the RFxchange user model.

```text
Firebase principal
  provider = firebase
  subject = Firebase UID
        ↓ AUTH-002
RFxchange UserIdentity
        ↓ membership / authorization / lifecycle
Organization access
```

AUTH-001 must never cast or copy the Firebase UID directly into `UserId`. AUTH-002 owns provider-subject resolution.

## Browser provider

`FirebaseBrowserAuthenticationProvider` exposes the provider-neutral primitives needed by later application flows:

- observe signed-in/signed-out state;
- register with email/password;
- sign in with email/password;
- sign out;
- obtain the current Firebase ID token.

Account recovery, MFA lifecycle, credential changes, account deletion and other lifecycle workflows remain AUTH-004 concerns.

## Browser runtime

`firebase-client.ts` lazily initializes the Firebase Web App and Auth service from `NEXT_PUBLIC_FIREBASE_*` configuration.

Development builds connect Auth to `http://127.0.0.1:9099` by default. Any configured emulator URL must use plain HTTP and `localhost` or `127.0.0.1`. Production builds never connect to the emulator.

Firebase Web App configuration is project/application identification, not a service-account secret. Privileged credentials remain prohibited from committed files and browser environment variables.

## Server provider

Firebase Admin application initialization now lives in `src/infrastructure/firebase/admin.ts` and is shared by Firestore and Authentication.

`getServerFirebaseAuth()` exposes the Admin Auth service only. AUTH-001 does not verify ID tokens, create session cookies, or define server-session semantics; those are AUTH-003 responsibilities.

No service-account key is committed or accepted by the runtime. Managed Google/Firebase environments should use Application Default Credentials.

## Emulator acceptance

CI starts Auth and Firestore emulators against the demo project. The Auth smoke test:

1. initializes the modular Web Auth SDK with in-memory persistence;
2. connects synchronously to the local Auth emulator;
3. creates an email/password Firebase principal;
4. verifies a Firebase UID is assigned;
5. obtains an ID token;
6. signs out;
7. signs back in and verifies the same UID;
8. removes the test principal.

Starting Firestore in the same emulator command preserves the INF-004 rules compilation gate.

## Production activation still required

Before RFxchange can authenticate real users, the production Firebase project must have a Web App registered and an approved sign-in method enabled. The Web App configuration values then belong in the deployment environment and local `.env.local`, never as hard-coded production values in source control.

No production credential is required for CI or the local emulator suite.

## Deliberately deferred

- Firebase UID → RFxchange `UserIdentity` resolution — AUTH-002
- verified token/session boundary — AUTH-003
- recovery, MFA and account-security lifecycle — AUTH-004
- full Auth + Firestore authorization emulator suite — AUTH-005
- login/registration UI and onboarding application flow

## Acceptance result

AUTH-001 is code-complete when Firebase Web/Auth and Admin Auth provider boundaries exist, Firebase remains outside the domain layer, local authentication is emulator-first, CI proves create/token/sign-out/sign-in behavior, and no AUTH-002/AUTH-003 responsibility is collapsed into the provider integration.
