# INF-001 — Firebase Project and Environment Foundation

## Scope

INF-001 establishes the provider/runtime boundary for Firebase before RFxchange begins implementing Firestore repositories, Firebase Authentication, Storage, or Cloud Functions application behavior.

Production Firebase project:

- Project name: `RFxchange`
- Project ID: `rfxchange`
- Project number: `820964688242`
- Environment role: production

## Environment model

RFxchange uses three explicit runtime environment roles:

1. `development` — local development, Firebase Local Emulator Suite first; optional dedicated Firebase development project may be attached later.
2. `staging` — preview/acceptance integration environment; dedicated Firebase project is required before remote staging deployment.
3. `production` — live environment backed by Firebase project `rfxchange`.

Development and staging must not silently fall back to production. A missing remote project binding is an intentional configuration error.

## Firebase CLI aliases

The committed `.firebaserc` contains only the production project alias because it is the only remote Firebase project currently established.

- `production` → `rfxchange`

When dedicated non-production Firebase projects are created, add aliases without reusing the production project.

Recommended aliases:

- `development`
- `staging`
- `production`

## Local development

Local development should prefer the Firebase Local Emulator Suite. INF-001 reserves emulator configuration for Authentication, Firestore, Functions, and Storage so later infrastructure slices can attach behavior without changing environment semantics.

Emulator ports:

- Emulator UI: `4000`
- Functions: `5001`
- Firestore: `8080`
- Authentication: `9099`
- Storage: `9199`

INF-001 does not yet add Firebase product implementations or runtime SDK dependencies.

## Environment configuration

Copy `.env.example` to a local environment file and populate only values needed by the current application slice.

Never commit:

- `.env.local` or other `.env*` files except `.env.example`
- Firebase service-account JSON files
- private keys
- refresh tokens
- Microsoft, Stripe, or other provider secrets

Public Firebase web configuration values may later use `NEXT_PUBLIC_FIREBASE_*` variables because they identify the Firebase web application. Privileged credentials must remain server-only.

`RFXCHANGE_ENV` is the canonical RFxchange environment role and must be one of `development`, `staging`, or `production`.

## Service-account boundary

INF-001 does not create or commit a service-account key.

Production automation should prefer short-lived identity/secret mechanisms supplied by the deployment platform. If a service-account credential is ever required locally, it must be stored outside source control and referenced through environment configuration.

The Firebase project number `820964688242` is project metadata, not a credential.

## Deployment boundary

INF-001 does not deploy Authentication, Firestore rules/indexes, Functions, Storage rules, Hosting, or application code. Later slices own those behaviors.

All remote Firebase commands must name an explicit alias/project. Do not rely on an implicit default for staging or production operations.

## Acceptance checklist

- Production Firebase project identity is documented and source-controlled.
- Firebase CLI production alias resolves to `rfxchange`.
- Development, staging, and production environment roles are explicit.
- Development/staging cannot be represented as production by convention.
- Local Emulator Suite configuration is committed.
- Local environment template is committed without secrets.
- Firebase runtime artifacts and service-account credentials are ignored.
- No Firebase product/domain adapter is introduced by this slice.
