# RFxchange RFx

Parallel participant app. Existing production Exchange, Admin, Marketing, AccelPO,
canonical records, Firestore/Storage rules, integrations and worker/webhook deployments
are not changed by this app.

## Run and check

From the repository root with its supported Node version:

```sh
npm ci
cd apps/rfx
cp .env.example .env.local
# Supply RFxchange RFx's public SDK configuration and the existing public Mapbox token.
npm run dev
npm test
npm run typecheck
npm run build
```

This app uses the repository's existing dependencies and server services. Its native
browser shell deliberately keeps high-frequency gestures outside React rendering.
Next.js supplies the same-origin authorized server boundary; it is not used for lens
navigation. No new state framework, provider adapter, database or query engine is added.

## Firebase / App Hosting

The Firebase Web App display name is **RFxchange RFx** in project **rfxchange**.
A registered Web App is not itself a Hosting deployment. Associate it with its own
App Hosting backend; select the repository and root directory **apps/rfx**. For an
Nx build target, use **rfxchange-rfx**. Keep the original backend and domains intact.

App Hosting's associated Web App supplies `FIREBASE_WEBAPP_CONFIG` at build time.
`scripts/configure.mjs` emits only explicitly whitelisted public SDK configuration.
It fails the production build when the associated app configuration is absent; it
never invents the new app ID or silently borrows the legacy app ID.

Set `RFXCHANGE_PUBLIC_ORIGIN` to the **actual new backend origin**, and authorize
that origin for the existing Firebase authentication project. Grant this backend
build identity access to the existing `rfxchange-mapbox-public-token` secret. Its
server identity needs the existing approved Firebase Auth/Firestore/Storage access.
Do not copy Microsoft, Telnyx or Stripe secrets or deploy duplicate workers here.

No production Firebase configuration or deployment was performed in the authoring
session: authenticated Firebase deployment access was unavailable. The app ID,
backend ID and deployed URL must be read from the actual project, not guessed.

## Implemented

- Translucent segmented search capsule: Filters / RFxchange + search / Map Options.
- One top Menu; five bottom destinations: RFx, Resources, AccelPO, Intelligence,
  Capabilities. AccelPO is a link, not a fifth data lens.
- Persistent Mapbox instance; native touch gestures; no mobile zoom/compass stack.
- Transform-only, frame-scheduled bottom sheet; cancellation and keyboard snapping.
  The same DOM becomes a collapsible desktop/landscape side panel.
- Local lens changes, scoped in-memory query cache, cancellable requests, real
  authorized RFx/resource/organization/capability projections, pagination.
- Card/marker selection, inline detail and result-scroll/snap restoration.
- Published organization introduction video discovery, verified <=30-second metadata,
  lazy poster/metadata loading, single tap-to-play player, pause/unload offscreen.
- Authenticated same-origin media delivery verifies current discovery eligibility,
  publication, ownership, stored asset status, MIME, size and content hash. No public
  storage access or permanent download tokens are introduced.
- Existing sign-in/session and RFx watch commands are reused, not replaced.
- PWA manifest and static-asset-only service worker; no offline private data cache.

## Explicit remaining boundaries

This is not a claim that every legacy workflow has been rebuilt. Full RFx response,
organization editing, invitations, enrollment and other domain workspaces currently
open their existing authorized pages. Video upload/publishing management remains
in the existing media domain; a new upload editor is not included. Existing
published media can be played through the new cards. RFx records without an
explicit public coordinate remain in the list, not at an invented map location.

Same Firebase project means shared account identity, not automatically shared
browser sessions between separate origins. No credentials are put in the AccelPO
or legacy links. No cross-origin SSO bridge is claimed.

## Tests

`npm test` runs dependency-free model and source-boundary tests. `test/browser.py`
is a Playwright browser suite with explicit synthetic data and a Mapbox test double;
it does not send communications, make payments, or use production Firebase data.
Run with Python Playwright and a Chromium installation (`CHROMIUM_PATH` may override
`/usr/bin/chromium`). Artifacts go to `test-output/` and are never production data.

Local authoring results: 9 Node tests passed. DOM-only Chromium checks passed at
390x844, 844x390 and 1440x900 for overflow, navigation, dialogs and inline details.
The hosted local HTTP browser suite was blocked by this environment's browser
policy; DOM checks are not a substitute for real Mapbox or authenticated backend
acceptance. Full Next.js compilation is delegated to the isolated CI candidate.
Production iPhone performance, real provider media, authorized API integration and
actual Firebase deployment require separate observed results.
