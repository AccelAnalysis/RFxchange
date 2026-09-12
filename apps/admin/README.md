# RFxchange Admin

Independent Next.js application for the existing administrative domain. It uses Firebase project `rfxchange` and Web App `1:820964688242:web:dad47f91134e3e11e1ddeb`.

From the repository root:

```bash
npm ci
npm --workspace @rfxchange/admin run dev
npm run typecheck:admin
npm run build:admin
node scripts/smoke-admin-application.mjs
```

The application root for its App Hosting backend is `apps/admin`. Workspace dependencies remain pinned in the repository lockfile. Shared domain, Firestore, identity, permissions, audit and UI code stays under `src/`; output tracing includes the repository root.

The Admin layout excludes the participant map shell. Its sign-in uses the existing Firebase session exchange and secure host-only cookies. Every page and API independently enforces existing administrator lifecycle, permissions and scope. Membership in Exchange does not grant administrative access. Case transitions authenticate before case lookup and retain the existing case-specific write permission and atomic lifecycle/audit boundary.

Before a production rollout, bind the existing Admin Web App to the new App Hosting backend, review its runtime identity's required backend access, and set its public origin and exact `RFXCHANGE_BUILD_SHA`. Keep automatic rollouts paused. The configured Exchange link is an ordinary cross-origin navigation; it does not copy tokens or cookies between applications.

The cutover redirects old Exchange `/admin` entry points to this application and removes their duplicate page implementations. Deploy that cutover only after this application passes hosted sign-in, permitted-operation, denied-access and rollback checks. Both protected API entry points consume shared handlers under `src/infrastructure/admin/http`. Do not delete data, Auth users or Firebase resources as part of route extraction.

`npm run check` includes this application's build and HTTP smoke checks. Existing administrative authorization, scope, lifecycle and audit regression tests remain required.

App Hosting recognizes the root `nx.json` and per-application `project.json` files, so it installs from the repository lockfile and retains shared sources. Each Nx build target executes the existing Next.js build in its own directory; build caching and Nx Cloud are disabled for release builds. Shared Next configuration lives in `src/config/next-config.ts`, outside the entry file rewritten by the Firebase adapter.

## Signed-in entry recovery

The `/admin` entry route distinguishes missing administrator setup, absent active workspace grants and privileged-security restrictions from a missing page. An authenticated account that cannot enter receives a recovery view with its own account email, a fresh access check and sign-out. Authorized administrators still enter the first currently permitted destination. The resolver, scoped grants, privileged-security evaluation, operational pages/APIs and audit behavior are unchanged. This view never creates an administrator, grants permissions, relaxes MFA or unlocks an account.
