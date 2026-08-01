# Slice 2.10 — Orientation: Discovery & Team Formation

**Status: COMPLETE VIA PR #102 — `EDU-001` + `EDU-002` + `EDU-003` + `EDU-004`; SLICE 2.11 REQUIRES POST-MERGE RECALCULATION**

## Feature IDs

- `EDU-001` — Interactive three-organization map scenario
- `EDU-002` — Demonstrate opportunity issuance
- `EDU-003` — Demonstrate capability match
- `EDU-004` — Demonstrate gap detection and teammate search

## Objective

Teach the user the Exchange model through one short synthetic map-based scenario inside the selected geography: an issuer creates an opportunity, a responder is matched, a capability gap appears, and a complementary teammate is discovered.

At slice exit, the participant understands the first half of the Exchange journey without the orientation pretending to create real procurement, teaming or market activity.

## Must read

- `/AGENTS.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/context/RFX_TRANSACTION_CYCLE.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- `docs/design/MAP_VISUAL_SYSTEM.md`
- canonical tracker/dependency map
- merged Slice 2.9 and the real controlled-map/marker foundation
- `docs/slices/WAVE_2_ROADMAP.md`

## Prerequisite state

The user has an authoritative selected geography and the real controlled map foundation exists. `EDU-001` follows `GEO-005`; later orientation steps form a strict sequence through `EDU-004`.

### Authorization checkpoint — 2026-08-01

Eligibility was recalculated from merged `main` after PR #101 merged at `c7c99d96de53fec82a5dfb6301caea72689fc908`.

- canonical tracker: **33/43 Activation features Done**;
- Slice 2.9 and its `ACQ-002`/`ACQ-003` acquisition-continuity prerequisites are Done;
- `GEO-005`, the selected-geography authority, active membership, controlled lifecycle and real marker foundation are Done;
- configured-development preflight against the selected Firebase project and actual Census/Mapbox integrations was green;
- no unsatisfied canonical dependency blocks `EDU-001` through `EDU-004`.

Slice 2.10 was therefore explicitly authorized. This authorization did not extend to Slice 2.11 before Slice 2.10 merge and dependency recalculation.

## Product rules

The orientation is an **educational simulation**, not a hidden implementation of Wave 3 or Wave 4.

### `EDU-001`

Run a concise synthetic three-organization scenario using an issuer, a responder and a teammate. Keep the scenario visually located in the participant's selected geography while clearly distinguishing synthetic tutorial objects from real organizations/opportunities.

### `EDU-002`

Show the issuer creating a simplified opportunity marker and explain that Exchange opportunities represent structured business demand. Do not imply that the tutorial object is published to the live network.

### `EDU-003`

Connect the opportunity to the responder using simplified capability alignment. Explain match reasoning without claiming qualification, endorsement or award likelihood.

### `EDU-004`

Show one missing capability, switch into a bounded capability-search mode and reveal a plausible teammate that fills the gap. Discovery does not create a legal team relationship.

## Acceptance intent

- the synthetic scenario runs inside the selected geographic visual context;
- opportunity issuance, capability alignment, gap detection and teammate discovery are shown in order;
- tutorial objects cannot leak into live search, map, referrals, RFx or organization records;
- matching copy distinguishes potential fit from qualification;
- a user can resume/restart the orientation without corrupting canonical lifecycle state.

## Expected implementation qualities

- explicit tutorial state machine;
- synthetic fixtures isolated from live domain data;
- accessible step controls and progress;
- anchored map objects and connection paths consistent with the map visual system;
- responsive desktop/mobile composition;
- deterministic tests for progression, restart/resume and synthetic/live isolation.

## Explicit non-scope

Do **not** implement in Slice 2.10:

- live opportunity publishing or RFx persistence;
- live capability search/discovery (`DSC-*`);
- live team invitations or legal teaming artifacts;
- response drafting/submission;
- evaluation/selection;
- credibility scoring or automated qualification.

## Exit checkpoint

The participant can explain: **an issuer expresses demand → a responder is matched → a capability gap can lead to teammate discovery**.

## Completion discipline

Synthetic tutorial behavior is not evidence that the corresponding live workflow Feature IDs are complete. Recalculate dependencies after merge before authorizing Slice 2.11.
