# RFxchange modernization delivery

This record distinguishes implementation, release and remaining work for the authorized in-place modernization. The governing target is the SAD v1.1 and Design System v2.0. Firebase project `rfxchange`, existing identities, data and domain authorization remain in place.

## Production hosting — September 11, 2026

The Firebase Console accepted an exact-commit manual rollout of merged main `731521d98587860ca2a6ae7c4fb7e912fb798e0e`. The corresponding successful main CI run is [34637835416](https://github.com/AccelAnalysis/RFxchange/actions/runs/34637835416).

App Hosting now marks `build-2026-09-11-000` as **Current**, with that source commit. The preceding `build-2026-09-05-002` remains the known-good rollback candidate. The public origin loads and `/admin` redirects an unauthenticated visitor to sign-in. Automatic rollouts remain disabled; the backend SHA override was set to the exact source before the rollout.

**2C is not yet complete.** The successful console release does not substitute for the resolved build/rollout API evidence required by `POST_WAVE_3_STABILIZATION_2C_SAME_SHA.md`. Google sign-in and consent succeeded, but the cloud browser blocked the CLI localhost callback. No credential was copied into chat or source. The source hash, resolved build environment, rollout binding and READY rollback evidence still need authenticated API capture and the existing verifier.

## Admin application candidate

`apps/admin` contains the independent build, protected pages, server handlers, dedicated sign-in, bright navigation, sign-out and configured Exchange return link. Shared authorization and audit services are retained. An existing case-transition handler now authenticates before looking up a case, while preserving its subsequent case-specific write checks.

Local validation includes the full repository gate and the independent application's production HTTP checks. Deployment and hosted authenticated operation remain pending. Existing root Admin routes stay available until cutover checks pass.

## Remaining delivery

- Capture and verify the formal 2C release evidence.
- Complete Admin CI, merge, backend binding, deployment and hosted operation checks; then retire superseded root Admin routes.
- Build and deploy Marketing with acquisition/registration handoff to Exchange.
- Apply Design System v2 to Exchange while preserving its mounted map, sliding sheet, four lenses and Menu; remove superseded UI only after callers migrate.

No Feature-ID completion or independent-assurance label is changed by this record.
