# Slice 2.12 — First Value & OPEN Gate

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `EDU-009` — First-value pathway selection
- `EDU-010` — Open-platform release gating

## Objective

Close Activation by asking the participant—after completing the Exchange orientation—what they want to do first, preserving that first-value intent, and setting the user to OPEN only after every required identity, policy, organization, geography, marker and education gate is satisfied.

The first-value step is not a registration questionnaire. Organization type, descriptive participation roles and business objectives are optional enrichment and are not prerequisites for `EDU-009` or OPEN.

## Must read

- `/AGENTS.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- canonical tracker/dependency map
- merged Slices 2.9–2.11
- `docs/slices/WAVE_2_ROADMAP.md`

## Prerequisite state

`EDU-009` follows completed orientation through `EDU-008`. It does not depend on `ORG-011` and must not reintroduce business-objective questions into registration.

The canonical OPEN gate for `EDU-010` requires `ARC-003`, `ARC-008`, `AUTH-004`, `GOV-001`, `GOV-002`, `GOV-003`, `ORG-004`, `ORG-012`, `GEO-011`, `EDU-008` and `EDU-009`.

No client route, UI completion flag, acquisition link, payment state or commercial status may substitute for those server-authoritative conditions.

## Product rules

### `EDU-009`

After the complete synthetic orientation, present a concise first-value choice such as:

- find an opportunity;
- issue an opportunity;
- find customers or suppliers;
- find a teammate;
- send or receive a referral;
- find resources/support;
- explore the network.

Persist the participant's selected first-value intent and evidence that the pathway was actually presented. Store semantic destination intent rather than treating a raw URL as authority.

Valid acquisition context from Slice 2.9 may recommend or preselect a compatible pathway, but it cannot complete `EDU-009`, grant destination access, or bypass the user's informed first-value step.

The routing contract must remain durable as later waves activate richer destination functionality. At Wave 2 exit, destination behavior must be truthful about what is currently available and must not manufacture live Network or RFx functionality merely to make every choice look complete.

### `EDU-010`

OPEN is a persisted server-authoritative lifecycle transition. Before transition, re-read all required gates from canonical state.

At minimum verify:

- usable attached user and active organization membership;
- no blocking restriction, suspension, integrity or termination state;
- authentication lifecycle requirements satisfied;
- required Terms, Rules and Privacy acknowledgments current;
- legitimate organization authority established;
- corrected Profile Complete active;
- real organization marker active in an allowed geography;
- orientation through `EDU-008` complete;
- first-value pathway selected and presented through `EDU-009`.

If any gate fails, remain controlled/not-open and route to the exact remediation path rather than silently repairing or bypassing it.

## Acceptance intent

- `EDU-009`: each approved first-value intent maps to a defined semantic destination/action contract after orientation.
- direct entry works without acquisition context; valid acquisition context can recommend but cannot authorize or auto-complete the choice.
- optional organization type, role and objective metadata do not gate the first-value step.
- `EDU-010`: OPEN is set only when every canonical prerequisite is satisfied at transition time.
- a later revoked prerequisite causes access/orientation logic to honor current restriction/authority policy rather than trusting stale OPEN browser state.
- missing gates produce explicit remediation.

## Expected implementation qualities

- typed first-value intent and destination contract;
- server-side gate evaluator with explainable failed conditions;
- idempotent OPEN transition and auditable lifecycle evidence;
- no dependency on paid membership, Founding status, provider status, optional profile classification or future credibility;
- mobile/desktop first-value surfaces follow canonical design;
- tests cover every intent, acquisition-context recommendation, direct entry, unavailable destination truthfulness, complete success, each missing/blocked gate, stale client state, cross-user access and re-entry.

## Explicit non-scope

Do **not** implement in Slice 2.12:

- Wave 3 Network features merely because a first-value path points toward them;
- Wave 4 RFx workflows;
- Founding membership/payments;
- Official Resource Provider application or approval;
- Organization Verification or Trust badges;
- automatic qualification or recommendation engines;
- a new registration-time objectives questionnaire.

## Exit checkpoint

A legitimate new organization can complete the full activation journey, see its real marker, understand the Exchange, select a relevant first-value path after orientation and enter OPEN only after the complete release gate passes.

## Completion discipline

After merge, reconcile the tracker against evidence and verify the **entire Wave 2 exit condition** before authorizing any Wave 3 implementation.
