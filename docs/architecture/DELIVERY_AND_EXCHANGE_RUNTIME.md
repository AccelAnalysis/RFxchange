# Delivery and Exchange runtime

The root Next application is the Exchange. Admin and Marketing retain their existing security/deployment boundaries; AccelPO remains a separate purchasing PWA sharing platform identity and organization services. A second Exchange is not part of this architecture. Historical execution packets are archived under `docs/archive`.

## Runtime

`PersistentParticipantShell` owns navigation and the active full-screen map renderer. Authorized pages supply display context and a scene projection. Updating records or switching spatial pages updates that renderer rather than creating another Mapbox instance. Leaving the participant route family clears the shell; embedded address/location previews use the same renderer in a bounded container. Session and organization authorization still occur on the server.

Mapbox loads asynchronously only when a configured scene mounts. The default basemap is Light v11 with a flat camera. Users may choose perspective/3D; building extrusion is hidden until 3D is selected. Optional ambient scenes use native easing, stop for manual interaction, reduced motion and background tabs, and remove their listener on teardown. Padding is repaired on movement completion without an animation-frame polling loop. React Strict Mode remains enabled to catch lifecycle errors.

RFx watch and saved-search actions reload only their authorized data projection into component state. Resource/referral lifecycle, administration, locale and identity-affecting actions retain server revalidation where their available actions or other server projections can change. A Next router refresh merges server component data; it is not a full browser reload.

Spatial continuity stores only current version-2 presentation state scoped to participant, membership, organization and geography. Obsolete or invalid records start from the current default; old v1 state is not migrated. Sign-out clears all spatial keys. No domain records or permissions move into this store.

## Checks

- `npm run check:fast`: application typechecks, lint, Functions compile, unit/behavior tests, Functions tests, security configuration and locale checks, each once.
- `npm run test:firebase`: one Auth/Firestore/Functions/Storage emulator process runs all existing smoke programs plus commercial direct-client denial tests. Run `npm run build:functions` first when running this command by itself. Local Java 21 is required.
- `npm run test:browser`: Chromium lifecycle tests of actual React shell/map code with explicitly synthetic data and a Mapbox SDK double. Install the locked Playwright Chromium first. These tests cover map ownership, projection updates, disposal, reduced-motion defaults and three viewport sizes; they do not measure real GPU/network performance.
- `npm run check:build`: one production build and HTTP smoke test per Exchange, Admin and Marketing app.
- `npm run check`: fast, Firebase and production checks without repeating a gate.

PR CI performs fast checks first. `scripts/ci-scope.mjs` adds Firebase tests for rules, Functions, domain/application/infrastructure/server paths, dependencies, test harnesses and unknown executable paths. UI changes select Chromium checks. Documentation/presentation-only changes can skip Firebase. Main and manual runs build production artifacts; manual runs select all integration checks. Stale runs cancel automatically. Workflow permissions remain read-only.

The historical `7e61fd94` worktree build, duplicate full gate, wave/tracker/source-wording validators, unused canvas implementations and page-local navigation fallback are retired. Runtime authorization, tenancy, privacy, payment, concurrency and audit tests remain mandatory. Archived source validators can be retrieved from Git history, but their incidental strings are not product contracts.

Production deployment remains a separate explicit action. A branch build or SDK-double browser run does not establish live iPhone performance; measure that against the deployed artifact and real Mapbox/data before making a timing claim.
