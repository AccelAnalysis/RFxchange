# Production readiness audit — 2026-09-05

Owner-authorized scope: synchronize the checkout, audit and repair production readiness, reconcile and merge open candidates, and deploy through the existing Firebase architecture. This is a release repair, not a new Feature-ID completion or independent assurance event.

## Application and dependencies

Starting merged source: `fd2fda50cd623db487da7f1f8ce3ad4e80173df4`. Its production CI failed on two React error-boundary lint violations. RFx responder and collaborator pages now catch service failures before constructing their successful component trees, preserving the existing recovery behavior.

The responder runtime serialized the entire issuer evaluation into API and server-component payloads. It now exposes only the decision used by the responder interface; evaluator identities, scores, private reviews and consensus notes remain on the issuer side. A runtime serialization regression test exercises this boundary without live data.

Next.js and its lint configuration advance together from 16.2.11 to 16.3.4, including patched Sharp 0.35.4 and PostCSS 8.5.23. Firebase Admin advances to 14.3.0, Functions to 7.3.2, and the repository CLI to 15.29.0. The lockfile includes patched fast-uri 3.1.7. A same-major qs 6.16.0 override removes the vulnerable parser from both Functions and development-tool dependency trees. Reviewed version assertions remain exact.

Local `npm run check` passed: 43 Functions tests, 933 architecture tests, all product/domain/Firebase/internationalization validators, TypeScript, lint (warnings only), and the production build. Exact candidate and merged-main CI remain required before deployment.

## Dependency findings remaining after repair

The initial npm audit reported 18 affected packages, including four high-severity entries. The repaired tree reports zero high/critical entries and 11 moderate entries (seven with development dependencies omitted). These package counts include transitive propagation of the same underlying advisories.

- [uuid GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq): the remaining legacy uuid is called only for `v4()` multipart boundaries by gaxios and teeny-request. The advisory concerns caller-supplied output buffers in v3/v5/v6; these consumers do not invoke that path. Do not apply npm's suggested major Firebase downgrade.
- [OpenTelemetry GHSA-8988-4f7v-96qf](https://github.com/advisories/GHSA-8988-4f7v-96qf): confined to the Firebase CLI's Pub/Sub tooling. The production application does not install or serve that development runtime. Keep local emulators bound to the development machine.
- [stream-json GHSA-528h-pc64-c93x](https://github.com/advisories/GHSA-528h-pc64-c93x): confined to Firebase CLI tooling, not a participant request parser. Use trusted deployment/import inputs. A cross-major override would change the CLI's module/API contract and is not a safe release patch.

These are explicit reachability dispositions, not a claim that npm audit is empty. Revisit them when upstream Firebase tooling/storage dependencies adopt compatible fixes.

## Release controls and scope

The live sign-in page could not initialize Firebase because App Hosting lacked the Firebase web configuration. The committed `apphosting.yaml` now supplies the existing Web App's public SDK identifiers and explicit production project/origin/storage settings. The existing public Mapbox token is referenced through Secret Manager version 1, available only during the build. No privileged application credentials are committed. AI interpretation and Founding checkout remain disabled; missing optional integration credentials are not invented.

Firebase Authentication's authorized domains now include the existing App Hosting hostname; email/password sign-in remains enabled. The deployed Firestore and Storage rules were audited against the repository: both previous and current versions deny all direct client reads/writes. The release synchronizes those rules and required indexes without changing that security boundary.

The existing App Hosting backend is `rfxchange`, project `rfxchange`, region `us-east4`, connected to `AccelAnalysis/RFxchange`. The previous serving build is `build-2026-08-25-002` (Cloud Run revision `rfxchange-build-2026-08-25-002`), sourced from the starting commit above.

Automatic rollouts were paused for this release using the App Hosting traffic resource's `rolloutPolicy.disabled` flag, preserving the connected branch, backend and current serving traffic. This prevents a merge from deploying before merged-main CI. After validation, deploy the exact merged commit with the repository-pinned Firebase CLI. The prior App Hosting build is the instant rollback target; no data migration is part of these repairs.

PR #260 received scope/privacy, pagination, canonical field and operational-count repairs, passed the reconciled candidate's full CI, and merged after PR #262. The combined local gate passed 43 Functions tests and 943 architecture tests, typecheck, lint and production build. Its repair record is `ADMIN_PRODUCTION_REPAIR_2026_09_05.md`.

The Firebase CLI resolves codebase-wide secret parameters before applying individual function filters. The first targeted deployment dry run therefore requested absent Stripe credentials even for health-only deployment. The webhook now uses Firebase's supported endpoint-specific named secret bindings and requires those environment values only when invoked. Its secret bindings and signature validation remain mandatory; unconfigured invocation fails closed. Focused deployment-discovery and negative invocation tests cover this change. The release targets only the private health function and scheduled operational heartbeat; the payment webhook remains undeployed. Microsoft invitation email is also unconfigured and must not be represented as delivered. Firebase's built-in account verification/recovery email is separate.

The first Functions build also exposed a packaging gap: Firebase uploads `functions/` without the workspace-root lockfile. A standalone Functions lockfile and the same reviewed qs override now accompany that artifact. Cross-manifest validation requires the deployed Firebase SDK and qs versions to match the reviewed workspace. A clean production-only install and SDK import check exercise the isolated artifact. Artifact cleanup is opted out for the new Functions repository to preserve rollback images; this does not alter App Hosting's retained builds.

The deployed sign-in probe now reaches Firebase and rejects the reserved non-account input instead of failing on missing configuration. Its failure copy uses ordinary participant language rather than rendering raw provider errors or internal configuration details.

Stabilization 2C remains incomplete. App Hosting's external source commit is evidence of source selection, not proof that the compiled `RFXCHANGE_BUILD_SHA` matches it. This release does not weaken build identity, add public diagnostics, or change rollout architecture. No tracker totals or optional `Verified` labels change.
