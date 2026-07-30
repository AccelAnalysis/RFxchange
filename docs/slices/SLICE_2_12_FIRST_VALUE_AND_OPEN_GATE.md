# Slice 2.12 — First Value & OPEN Gate

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `EDU-009` — Objective-based first-value pathway
- `EDU-010` — Open-platform release gating

## Objective

Close Activation by converting the organization's stated objectives into an appropriate first-use path and setting the user to OPEN only after every required identity, policy, organization, geography, marker and education gate is satisfied.

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

`EDU-009` depends on authoritative organization objectives from `ORG-011`.

The canonical OPEN gate for `EDU-010` requires `ARC-003`, `ARC-008`, `AUTH-004`, `GOV-001`, `GOV-002`, `GOV-003`, `ORG-004`, `ORG-012`, `GEO-011`, `EDU-008` and `EDU-009`.

No client route or UI completion flag may substitute for those server-authoritative conditions.

## Product rules

### `EDU-009`

Use the organization's selected goals to choose and present a clear first-value path. Supported goals include finding opportunities/customers/suppliers/teammates/resources, issuing opportunities and exploring the network.

The routing contract should be durable as later waves activate richer destination functionality. At Wave 2 exit, destination behavior must be truthful about what is currently available and must not manufacture live Network/RFx functionality merely to make every goal look complete.

Acquisition context from Slice 2.9 may refine the first destination when it is compatible with the user's stated goal and authorized state.

### `EDU-010`

OPEN is a persisted server-authoritative lifecycle transition. Before transition, re-read all required gates from canonical state.

At minimum verify:

- usable attached user and active organization membership;
- no blocking restriction/suspension/integrity/termination state;
- authentication lifecycle requirements satisfied;
- required Terms, Rules and Privacy acknowledgments current;
- legitimate organization authority established;
- Profile Complete active;
- real organization marker active in an allowed geography;
- orientation through `EDU-008` complete;
- objective-based first-value pathway presented.

If any gate fails, remain controlled/not-open and route to the exact remediation path rather than silently repairing or bypassing it.

## Acceptance intent

- `EDU-009`: each approved objective maps to a defined first-value destination/action contract and the choice is based on persisted organization objectives.
- `EDU-010`: OPEN is set only when every canonical prerequisite is satisfied at transition time.
- a later revoked prerequisite causes access/orientation logic to honor current restriction/authority policy rather than trusting stale OPEN browser state.
- missing gates produce explicit remediation.

## Expected implementation qualities

- server-side gate evaluator with explainable failed conditions;
- idempotent OPEN transition and auditable lifecycle evidence;
- no dependency on paid membership, Founding status, provider status or future credibility;
- mobile/desktop first-value surfaces follow canonical design;
- tests cover complete success plus each missing/blocked gate, stale client state, cross-user access and re-entry.

## Explicit non-scope

Do **not** implement in Slice 2.12:

- Wave 3 Network features merely because a first-value path points toward them;
- Wave 4 RFx workflows;
- Founding membership/payments;
- Organization Verification or Trust badges;
- automatic qualification or recommendation engines.

## Exit checkpoint

A legitimate new organization can complete the full activation journey, see its real marker, understand the Exchange, receive a relevant first-value path and enter OPEN only after the complete release gate passes.

## Completion discipline

After merge, reconcile the tracker against evidence and verify the **entire Wave 2 exit condition** before authorizing any Wave 3 implementation.