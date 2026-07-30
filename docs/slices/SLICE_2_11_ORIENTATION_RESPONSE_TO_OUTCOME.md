# Slice 2.11 — Orientation: Response to Outcome

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `EDU-005` — Demonstrate teammate invitation/acceptance
- `EDU-006` — Demonstrate structured joint response
- `EDU-007` — Demonstrate evaluation and selection
- `EDU-008` — Explain network effect

## Objective

Complete the synthetic Exchange journey begun in Slice 2.10: teammate invitation and acceptance, joint response preparation, issuer evaluation/selection, and a final geographic visualization showing how capabilities, opportunity, teaming, response and outcome connect.

## Must read

- `/AGENTS.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/RFX_TRANSACTION_CYCLE.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- `docs/design/MAP_VISUAL_SYSTEM.md`
- canonical tracker/dependency map
- merged Slice 2.10 tutorial state/contracts
- `docs/slices/WAVE_2_ROADMAP.md`

## Prerequisite state

`EDU-005` follows `EDU-004`, then the tutorial progresses sequentially through `EDU-008`.

## Product rules

### `EDU-005`

Show the discovered teammate receiving an invitation in a defined capacity, reviewing the context and accepting. Display the legal boundary clearly: the Exchange invitation is not itself a subcontract, joint venture, teaming agreement or other binding relationship.

### `EDU-006`

Show a simplified structured response workspace with requirements, assigned contribution, completion state and submit action. The tutorial response is synthetic and must not create a live RFx response.

### `EDU-007`

Show the issuer comparing synthetic responses against stated criteria and making a human selection. The platform may organize evaluation; it must not imply an automated winner decision.

### `EDU-008`

End on the map with the complete connection path and concise explanation of the network effect: capability became discoverable, demand became visible, a gap produced a teammate connection, the team responded, and the issuer selected an outcome.

## Acceptance intent

- the tutorial demonstrates invite/review/accept with the nonbinding disclaimer;
- the joint-response workspace visibly maps required sections to completion;
- evaluation uses criteria and preserves human decision authority;
- the final map visual connects the entire synthetic journey without confusing it with live activity;
- orientation completion is persisted only when the required tutorial sequence is actually completed.

## Expected implementation qualities

- continue the explicit tutorial state machine from Slice 2.10;
- maintain complete isolation from live RFx, response, team, referral and credibility records;
- use deterministic synthetic fixtures;
- support resume/restart safely;
- accessible, responsive UI using canonical map/product design;
- tests cover ordered progression, disclaimer presence, human-selection boundary, completion state and synthetic/live isolation.

## Explicit non-scope

Do **not** implement in Slice 2.11:

- live team workflows;
- live RFx response workspaces or submission;
- evaluator assignments, scoring records or award communications;
- legal document creation;
- real economic outcomes or credibility events;
- OPEN release itself (`EDU-010`).

## Exit checkpoint

The participant has experienced the complete synthetic story from opportunity issuance through selection and understands why the RFxchange is a connected network rather than a set of isolated features.

## Completion discipline

`EDU-008` proves orientation completion only. It does not prove the live RFx/teaming/evaluation systems exist. Recalculate dependencies after merge before authorizing Slice 2.12.