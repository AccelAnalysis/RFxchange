# Slice 2.9 — Acquisition-to-Activation Continuity

**Status: COMPLETE VIA PR #101 — `ACQ-002` + `ACQ-003`; SLICE 2.10 REQUIRES POST-MERGE RECALCULATION**

## Feature IDs

- `ACQ-002` — Public opportunity landing pages
- `ACQ-003` — Preserve acquisition context through registration

## Objective

Preserve the reason a visitor arrived at RFxchange from the public edge through account creation, organization activation and the first authenticated experience.

At slice exit, a visitor can enter from a permitted opportunity or another supported acquisition context and the platform retains that context without letting public/browser state grant organization, geography, referral, provider, teaming or RFx authority.

## Must read

- `/AGENTS.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/context/RFX_TRANSACTION_CYCLE.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- canonical tracker/dependency map
- merged Slices 2.1–2.8
- `docs/slices/WAVE_2_ROADMAP.md`

## Prerequisite state

Slice 2.8 must have merged and dependency eligibility must be recalculated. The user/account lifecycle, organization resolution/authority, controlled geography, confirmed location, Profile Complete and real marker activation are authoritative prerequisites for authenticated activation.

`ACQ-003` builds on the persisted lifecycle from `ARC-007`. Acquisition context is navigation intent, never authorization.

### Authorization checkpoint — 2026-07-30

Eligibility was recalculated from merged `main` after PR #76 merged at `61f9aa02ca435cd8c9a168bcdacb9c1ae1d8f764`.

- canonical tracker: **31/43 Activation features Done**;
- Slices 2.1–2.8 Feature IDs are Done;
- `GEO-011`, `ADM-063` and `ADM-064` are Done via PR #77;
- `ARC-007` is Done and supplies the persisted lifecycle prerequisite for `ACQ-003`;
- the Design Convergence Gate is merged and must be consumed by this slice;
- no unsatisfied canonical dependency blocks `ACQ-002` or `ACQ-003`.

Slice 2.9 is therefore explicitly authorized. This authorization does not extend to Slice 2.10 or any Wave 3/4 workflow.

## Product rules

### `ACQ-002`

Provide a public landing representation for a permitted opportunity that communicates enough substantive context for a visitor to understand why the opportunity may matter and offers the canonical **View Opportunity** / join path.

Wave 2 must not invent the Wave 4 RFx engine. The landing surface consumes a bounded public opportunity/acquisition projection and must be able to transition later to the canonical RFx public projection without changing acquisition semantics.

Private, restricted, unreleased, expired or otherwise non-public opportunity data must fail closed.

### `ACQ-003`

Use a typed, server-validated acquisition-context envelope capable of representing at least:

- opportunity;
- organization claim;
- referral;
- team invitation;
- provider recommendation/invitation;
- buyer need;
- direct/default entry.

Preserve the context across authentication and onboarding transitions, bind it to the legitimate user/session journey, protect against tampering/replay where relevant, and resume the participant at the appropriate first authenticated destination when that destination is currently available.

If a later-wave workflow is not yet implemented, preserve the context truthfully without fabricating completion, acceptance, qualification or authority.

## Acceptance intent

- `ACQ-002`: an anonymous visitor can view the permitted public opportunity context and begin the account journey without receiving protected RFx information.
- `ACQ-003`: each supported acquisition type survives registration/onboarding and is recovered for the correct user at the first authenticated experience.
- manipulated, stale, cross-user, cross-organization or unauthorized context cannot grant access or alter canonical organization/geography state.
- direct registration without acquisition context continues to work.

## Expected implementation qualities

- typed acquisition-context state rather than ad hoc query-string branching;
- server authority over context resolution and protected destination access;
- correlation/audit metadata sufficient to support later attribution without implementing `ACQ-010`;
- privacy-safe public projections;
- desktop/mobile behavior follows the canonical design system;
- tests cover opportunity, claim, referral, team, provider, buyer and direct entry plus tamper/stale/cross-user denial.

## Explicit non-scope

Do **not** implement in Slice 2.9:

- RFx creation, search, response, evaluation or award;
- real referral send/receive/status (`REF-*`);
- real team invitation/acceptance;
- provider application/approval or provider routing;
- campaign analytics/attribution (`ACQ-010`);
- paid acquisition or entitlements;
- bypass of Wave 2 activation or OPEN gates because a user arrived from a high-value link.

## Exit checkpoint

The platform remembers **why the participant came** while preserving every existing authorization boundary.

### Completion evidence — 2026-08-01

PR #101 implements the versioned server-bound acquisition envelope, fail-closed
public opportunity projection port, resumable activation attachment, protected first
authenticated continuation, append-only Firestore evidence, responsive public UI,
and focused architecture/emulator coverage. Configured-browser acceptance proved the
public-opportunity path through a fresh real activation and context recovery after
history, reload, sign-out, and sign-in. All disposable Firebase records were removed.

See `docs/architecture/WAVE_2_SLICE_2_9.md` for the detailed security, persistence,
browser, and cleanup evidence.

## Completion discipline

Do not infer completion of any referenced later-wave workflow from context preservation alone. Recalculate dependencies after merge before authorizing Slice 2.10.
