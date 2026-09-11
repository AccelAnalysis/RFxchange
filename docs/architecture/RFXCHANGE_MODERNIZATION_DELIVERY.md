# RFxchange modernization delivery

This record distinguishes implementation, release and remaining work for the authorized in-place modernization. The governing target is the SAD v1.1 and Design System v2.0. Firebase project `rfxchange`, existing identities, data and domain authorization remain in place.

## Production hosting — September 11, 2026

The Firebase Console accepted an exact-commit manual rollout of merged main `731521d98587860ca2a6ae7c4fb7e912fb798e0e`. The corresponding successful main CI run is [34637835416](https://github.com/AccelAnalysis/RFxchange/actions/runs/34637835416).

App Hosting now marks `build-2026-09-11-000` as **Current**, with that source commit. The preceding `build-2026-09-05-002` remains the known-good rollback candidate. The public origin loads and `/admin` redirects an unauthenticated visitor to sign-in. Automatic rollouts remain disabled; the backend SHA override was set to the exact source before the rollout.

**2C is not yet complete.** The successful console release does not substitute for the resolved build/rollout API evidence required by `POST_WAVE_3_STABILIZATION_2C_SAME_SHA.md`. Google sign-in and consent succeeded, but the cloud browser blocked the CLI localhost callback. No credential was copied into chat or source. A scoped console read confirms the completed build’s resolved `RFXCHANGE_BUILD_SHA` equals `731521d98587860ca2a6ae7c4fb7e912fb798e0e`, with source Firebase console. Formal source/availability/rollout/READY rollback evidence still needs authenticated API capture and the existing verifier.

## Admin application

`apps/admin` contains the independent build, protected pages, server handlers, dedicated sign-in, bright navigation, sign-out and configured Exchange return link. Shared authorization and audit services are retained. An existing case-transition handler now authenticates before looking up a case, while preserving its subsequent case-specific write checks.

PR #270 is merged as `953abdbbe5731f162800f5b96fefb8ff1e39ce0d`; its main CI run [34643511269](https://github.com/AccelAnalysis/RFxchange/actions/runs/34643511269) passed. Local validation includes the full repository gate and the independent application's production HTTP checks. The `rfxchange-admin` backend is created in `us-east4`, linked to the existing Admin Web App, with root `apps/admin`, branch `main`, automatic rollouts disabled and the exact source SHA override set. The first Admin cloud build (`build-2026-09-11-000`, source `953abdb`) failed with **Missing dependency lock file** before serving traffic. App Hosting treated the npm-workspace directory as a standalone app. The candidate corrects deployment configuration to App Hosting’s supported Nx monorepo format, retaining the repository-root lockfile and shared sources. The actual App Hosting Next.js adapter (14.0.21) successfully built Exchange, Admin and Marketing in an isolated local source copy. All three Next configurations import the shared build-identity module, avoiding an adapter rewrite of one application’s configuration affecting another. Hosted authenticated operation remains pending. Existing root Admin routes stay available until cutover checks pass.

## Marketing application candidate

`apps/marketing` owns the public product/audience pages, membership information, Founding campaign and policy destinations. It has an independent App Hosting configuration bound to the existing Marketing Web App and a bright Design System v2 presentation. Historical price illustrations are omitted; no checkout or commercial entitlement is enabled.

Registration/sign-in handoffs point to the configured Exchange origin and preserve only bounded campaign, supported locale and safe participant return context. Marketing never copies a session cookie. The new Exchange receiver establishes host-only context before registration; authenticated activation binds reported campaign attribution as direct entry, preserving existing referral/invitation/opportunity context and authorization.

The full local gate passed with 954 architecture tests, Functions tests, all three production builds and Admin/Marketing HTTP smoke checks. Marketing smoke covers five locales, public routes, first-touch campaign behavior, credential-free redirects, the Exchange receiver and absence of Admin routes. PR #271 candidate CI [34647266191](https://github.com/AccelAnalysis/RFxchange/actions/runs/34647266191) passed and it merged as `43b48439e16a15f8c4c9891c5acc519599f160b3`. Main CI and deployment remain in progress. The `rfxchange-marketing` backend is created in `us-east4`, bound to the existing Marketing Web App and `apps/marketing`, with automatic rollouts disabled. Hosted visual checks remain pending. Deploy Exchange's new receiver before making the Marketing handoff public.

## Remaining delivery

- Capture and verify the formal 2C release evidence.
- Complete Admin deployment and hosted operation checks; then retire superseded root Admin routes.
- Build and deploy Marketing with acquisition/registration handoff to Exchange.
- Apply Design System v2 to Exchange while preserving its mounted map, sliding sheet, four lenses and Menu; remove superseded UI only after callers migrate.

No Feature-ID completion or independent-assurance label is changed by this record.

## Exchange convergence candidate

The shared runtime now applies Design System v2 colors, bright glass, type fallback, readable lens labels and focus treatment. Cartography keeps authoritative geometry, object semantics and camera behavior while replacing ivory/black presentation. The persistent map and sliding sheet composition and RFx/Resources/Intelligence/Capabilities/Menu navigation remain unchanged. Admin and Marketing consume the same shared palette instead of duplicating root overrides. Unused conceptual NetworkField/JourneyRail components and their obsolete global marketing layout are removed; connection semantics remain governed by the shared object tokens. Historical palette checks are reconciled to the approved v2 amendment. The full local gate passed: 954 architecture tests, Functions tests, types, lint, three production builds and Admin/Marketing HTTP smoke checks. Exact-head CI, merge and deployment remain pending.
