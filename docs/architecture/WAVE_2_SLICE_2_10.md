# Wave 2 Slice 2.10 — Orientation: Discovery & Team Formation

## Scope and authority

Slice 2.10 implements `EDU-001` through `EDU-004` as the first half of one synthetic eight-step orientation. It does not create live organizations, opportunities, RFx records, responses, referrals, teams, credibility, notifications, or search-index entries.

The participant must already have server-authorized controlled-platform access, an active membership, an authoritative selected geography, and an active real organization marker. The protected page and mutation endpoint both resolve those conditions from current server state. Browser route, client state, local storage, and tutorial progress never grant geography, organization, or lifecycle authority.

## One journey across Slices 2.10 and 2.11

`src/domain/orientation/model.ts` owns one stable scenario identity, scenario version, and the complete ordered sequence:

1. three-organization scenario;
2. opportunity issuance;
3. capability match;
4. gap detection and teammate discovery;
5. teammate invitation;
6. joint response;
7. human evaluation;
8. network effect.

Slice 2.10's application service caps mutation at step 4. Steps 5–8 are inert identifiers only: they have no enabled command, rendered completion, or tracker claim until Slice 2.11 implements and proves them. Ordered server transitions, revision checks, participant-scope binding, idempotent replay, and explicit restart provide deterministic resume behavior without treating page visitation as completion.

## Persistence and evidence

`orientationJourneys/{journeyId}` is the mutable participant-bound aggregate. Its stable ID derives from the access journey; the record also carries user, organization, geography, scenario, and version bindings. `orientationJourneyEvents/{eventId}` is append-only transition evidence. The Firestore adapter writes the aggregate and event in one transaction and rejects missing/stale revisions.

Both collections remain server-managed and deny all direct browser reads and writes. An authenticated participant reaches them only through the application endpoint after current route, membership, restriction, marker, location, and geography checks pass.

## Synthetic boundary

`src/application/orientation/synthetic-scenario.ts` creates deterministic tutorial-only nodes and connection paths from the selected locality's authoritative boundary. Every tutorial object carries `synthetic-orientation` provenance. Locality-derived coordinates never read or expose the participant organization's private canonical coordinate.

The fixture describes only tutorial issuer, responder, teammate, and opportunity concepts. It has no repository dependency and no path into live organization, opportunity, RFx, response, referral, team, credibility, notification, or discovery storage. Potential capability alignment is explicitly non-qualifying; teammate discovery creates no invitation, authority, legal team, contract, subcontract, joint venture, or teaming agreement.

## Shared spatial workspace

The protected orientation route reuses the same authorized participant map projection and `ExchangeSpatialScene` used by Intelligence. Tutorial nodes and paths are separate Mapbox sources/layers with explicit synthetic styling, while the real organization marker stays visually distinct. The right responsive edge sheet informs camera padding, and Fit Home respects that padding so persistent controls do not obscure the geographic subject. The normal search panel is hidden during the bounded tutorial, while 2D, Perspective, 3D, navigation, keyboard focus, reduced-motion, and responsive workspace contracts remain available.

## Acceptance evidence

- Deterministic domain/application tests cover the stable eight-step sequence, Slice 2.10's step-4 ceiling, ordered progression, idempotent replay, restart, resume, cross-participant rejection, deterministic locality-bounded fixtures, and staged overlay state.
- Architecture validators prove protected server resolution, synthetic provenance/isolation, shared Mapbox sources, responsive composition, and configured emulator coverage.
- Firestore schema/rules tests and emulator acceptance prove atomic journey/event persistence, append-only history, stale-step denial, step-5 denial, and denied direct-client reads/writes.
- TypeScript, lint, production build, repository architecture tests, Functions tests, and the complete repository gate run before merge.
- Configured-browser evidence on the selected real Firebase project and actual Mapbox/Census-backed participant environment must prove desktop, intermediate, and mobile progression, persistence/re-entry, restart, keyboard/focus behavior, visible synthetic/live distinction, real-marker preservation, and absence of browser errors before the Feature IDs are marked Done.

PR #102 acceptance supplied that evidence with a fresh disposable participant and organization. The browser completed actual Firebase registration/verification state, Census locality selection and address geocoding, Profile Complete and real-marker activation before entering orientation. Desktop, intermediate and mobile viewports preserved an unobstructed real marker and usable 2D/Perspective/3D/Fit controls; steps 1–4 progressed in order, reload and sign-in re-entry resumed deterministically, restart cleared and replayed the same scenario, keyboard focus remained usable, later steps stayed unavailable, and the final browser console contained no errors or warnings. Administrative verification found no live opportunity, RFx, response, referral, team, credibility, notification or search records from the tutorial. Cleanup deleted all 35 disposable Firestore documents and the Auth identity; an exact-reference rescan and direct verification queries returned zero records.

## Explicit deferrals

Slice 2.10 does not enable steps 5–8, complete orientation, release OPEN, select first value, publish a live opportunity, execute live matching/search, create a team/invitation/response, evaluate suppliers, score credibility, or implement any Wave 3/4 Feature ID.
