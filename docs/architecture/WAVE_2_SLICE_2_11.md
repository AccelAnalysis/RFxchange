# Wave 2 Slice 2.11 — Orientation: Response to Outcome

## Scope and continuity

Slice 2.11 implements `EDU-005` through `EDU-008` by continuing the exact version-1, eight-step orientation aggregate introduced in Slice 2.10. It does not fork the scenario, migrate a participant to a new journey, or create live team, RFx, response, evaluation, award, outcome, credibility, notification, or search records.

The existing participant, access-journey, organization, geography, scenario and version bindings remain authoritative. The protected page and mutation endpoint continue to re-resolve current session, membership, lifecycle, restriction, selected geography, confirmed location and active real-marker state on every server interaction.

## Ordered completion

`SLICE_2_11_MAX_ORIENTATION_STEP` enables the existing step identifiers 5–8. The application service still accepts only the next canonical step, treats repeated completed steps idempotently, transactionally compares aggregate revision, and appends immutable evidence. Only step 8 changes the aggregate to `completed`, sets `completedAt`, and writes the single `completed` event. Page visitation, map rendering, invitation display, and completion of step 7 cannot complete orientation.

Restart remains explicit and deterministic. It resets progress on the same bound/versioned aggregate while preserving prior append-only evidence and incrementing restart count.

## Synthetic workflow contracts

The deterministic scenario now carries:

- a reviewed teammate invitation with defined capacity, explicit acceptance state and a nonbinding legal boundary;
- a joint-response model whose requirements each identify an assigned contributor and completion state, plus an explicit no-live-submission boundary;
- two synthetic responses compared against three issuer-stated criteria, with the issuer's click producing the tutorial selection and copy prohibiting automated-winner meaning;
- a final network-effect summary and five locality-bounded paths linking demand, capability, teammate discovery, joint response and selected outcome.

Every object retains `synthetic-orientation` provenance and remains a pure fixture with no live-domain repository dependency. Invitation acceptance is not a subcontract, joint venture, teaming agreement or binding relationship. Tutorial submit is not a live or external response submission. Tutorial selection is not an award, contract, verified economic outcome or credibility event.

## User experience

The existing Spatial Workspace and real controlled map remain continuous. Steps 5–8 use the same responsive right drawer/mobile sheet and the same synthetic node family. The response requirement list and evaluation comparison provide structured, textual equivalents for the visual workflow. The complete map path remains coordinate-anchored, visibly tutorial-only and subordinate to the participant's real marker and authoritative locality.

## Acceptance evidence

- Domain/application tests prove the full ordered sequence, idempotency, completion only at step 8, one completion event, restart and participant binding.
- Scenario/UI tests prove invitation disclaimer, requirement-to-contributor completion, stated evaluation criteria, human authority, complete path and no-live-outcome language.
- Firestore emulator acceptance proves all eight transactional transitions, wrong-order denial, one terminal completion event, denied direct-client access and cleanup.
- Architecture validation proves the stable shared scenario, synthetic isolation, accessible workflow structures and map stages.
- Configured-browser acceptance used a fresh disposable activation against the selected real Firebase project and actual Census geocoding/TIGERweb and Mapbox integrations. It proved website omission, marker activation, automatic orientation entry, ordered invite/response/evaluation/outcome progression, a reload at step 5, explicit restart, one terminal completion, reload and sign-in re-entry persistence, desktop/mobile layout, 3D/2D/Perspective modes and Fit-home recovery without obscuring the real marker.
- The persisted aggregate audit showed step 8, `completed`, revision 17, restart count 1 and exactly one terminal completion event. No forbidden live record matched the disposable scope.
- Cleanup removed the exact 43-record disposable Firestore footprint across the approved activation/orientation collections, removed the disposable Firebase Auth identity last, and verified a full rescan plus direct user/organization/access/orientation references returned zero.
- The complete repository gate and production CI are required before merge.

## Explicit deferrals

Slice 2.11 does not select first value, release OPEN, publish a live opportunity, invite a real teammate, submit a real response, create evaluation/award records, assert an economic outcome, write credibility, or implement any Wave 3/4 feature. Slice 2.12 remains blocked until this slice merges and eligibility is recalculated from merged `main`.
