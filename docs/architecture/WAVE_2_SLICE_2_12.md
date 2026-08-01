# Wave 2 Slice 2.12 — First Value and OPEN Gate

## Authorization and scope

Slice 2.12 was authorized only after Slice 2.11 merged to `main` at `708a307e5a4329c8cc1d073f84654a2ba3be3e6c` and dependency recalculation confirmed `EDU-008` complete. It implements only `EDU-009` and `EDU-010`. It does not implement live Network, referral, provider, RFx, recommendation, verification, commercial, credibility, or Wave 3 functionality.

## Semantic first-value contract

`src/domain/first-value/model.ts` defines a versioned seven-intent catalog and truthful destination metadata. The persisted singleton is bound to one access journey, user and organization; records all intents actually presented; records the explicit participant selection; and may retain a compatible acquisition recommendation. It stores semantic intent, not a route or authorization grant. Direct entry has no inferred recommendation. Acquisition context can highlight or preselect a choice, but the browser must still make the explicit server request.

Only Explore the network currently has an available destination, the existing controlled locality map. Other choices are retained with honest upcoming-state copy; this slice creates no synthetic live feature merely to satisfy a destination.

## Complete OPEN release gate

`src/application/activation/open-release.ts` evaluates every prerequisite in one explainable contract: controlled lifecycle, usable account, current authentication, active exact membership, no blocking restriction, current policy acknowledgements, organization authority, corrected Profile Complete, an active real marker in the selected released geography, completed eight-step orientation, and a participant-bound first-value selection with presentation evidence.

The production snapshot reader obtains current canonical server state for every check. Optional organization type, participation role, objective, provider, verification, Founding, payment and credibility metadata are absent from the gate. A failed condition leaves the lifecycle controlled and identifies the exact remediation route.

The mutation endpoint accepts only a semantic `selectedIntent`; it derives identity, organization, lifecycle and acquisition context from current server authority. After selection persistence, the service re-reads the complete gate before advancing the access journey to `open-platform`. The lifecycle write and append-only release event share a Firestore transaction. Repeating the same completed request is idempotent; a different activation selection after OPEN is rejected.

## Persistent protection after release

The `/exchange` route is not unlocked by a browser flag. It resolves the current authenticated participant and evaluates the complete OPEN snapshot on every request. Current restrictions, membership, authority, authentication, policies, profile, marker, geography, orientation and selection therefore remain effective after an earlier OPEN transition; stale browser state cannot preserve access. Remediation redirects remain explicit.

`firstValueSelections` is mutable only before terminal release and remains server-managed. `activationReleaseEvents` is append-only. Both collections are closed to direct browser access by the deny-by-default Firestore rules.

## Acceptance evidence

- Domain and application tests cover every intent and acquisition recommendation, direct entry, truthful unavailable destinations, all eleven missing prerequisites independently, absence of optional gates, idempotency and cross-participant denial.
- Source architecture validation protects semantic persistence, server-derived scope, fresh canonical reads, current-state enforcement, transaction evidence, protected re-entry and emulator coverage.
- Firebase emulator acceptance proves persisted selection, the one controlled-to-OPEN transition, immutable evidence, idempotent repeat, direct-client denial and cleanup.
- `npm run check` passed with 347 architecture tests, Functions tests, TypeScript, lint and the production build. The full Auth/Firestore/Functions/Storage emulator chain passed, including the new selection/OPEN smoke.
- Configured-browser acceptance completed a fresh direct journey and a fresh public-opportunity journey against real Firebase, Census/TIGERweb, Census geocoding and Mapbox. Direct entry was neutral. Opportunity context visibly recommended `find-opportunities` but left the participant controlled until explicit submission.
- Both journeys presented all seven intents, persisted participant-bound choices and exactly two release events, reached OPEN, survived reload/re-entry and retained truthful unavailable-destination messaging. Mobile width had no horizontal overflow and the browser console contained no errors or warnings.
- A temporary organization suspension introduced after OPEN redirected the protected request to exact suspended remediation; removal restored current authorized access. Cleanup then removed the two exact footprints: 79 Firestore records and two Auth identities, with zero residual references.
- Production CI is required before merge.

## Explicit deferrals

Slice 2.12 does not publish an opportunity, provide live opportunity discovery, create or invite a real teammate, create a referral, approve a Resource Provider, infer a business objective, award Verification or credibility, activate payments, or begin any Wave 3 Feature ID.
