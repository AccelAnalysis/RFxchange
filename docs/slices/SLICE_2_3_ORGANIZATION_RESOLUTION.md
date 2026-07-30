# Slice 2.3 — Organization Resolution

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `ACQ-004` — Unclaimed seeded organization profile
- `ORG-001` — Organization match search
- `ORG-002` — Claim existing or create new
- `ORG-003` — Duplicate prevention/entity resolution

## Objective

Give a participant a controlled path from a known/seeded/provisional organization identity to one resolved RFxchange organization record without creating unattached users or avoidable duplicates.

At slice exit, seeded organizations can be presented as unclaimed acquisition surfaces, onboarding can search for likely matches, users can select an existing organization or create a new one, and entity-resolution logic considers the signals needed to prevent obvious duplicate market entities.

## Must read

- `/AGENTS.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- canonical tracker/dependency map
- `docs/slices/WAVE_2_ROADMAP.md`
- merged Slice 2.1/2.2 contracts before implementation

## Prerequisite state

`ORG-001` builds on merged organization-account architecture (`ARC-002`) and should use canonical selected geography when it improves matching. `ORG-002` depends on `ORG-001`; `ORG-003` depends on organization matching/entity comparison.

`ACQ-004` is an acquisition surface and should feed the same organization-resolution path rather than creating a parallel claim implementation.

## Product rules

### `ACQ-004`
An unclaimed seeded profile may show appropriate seeded/public organization data, map/geography/category context and clear unclaimed status with **Claim this organization**. Seeded data is not proof of user authority or Verification.

### `ORG-001`
Use entered/provisional organization name, canonical geography, seeded data and existing RFxchange records to find likely matches. Matching should be explainable enough to support safe resolution rather than blindly auto-merging.

### `ORG-002`
Allow the user to select **This is my organization** or create a new organization when no appropriate match exists. Carry provisional onboarding data forward. The user remains attached to an organization account throughout the journey.

### `ORG-003`
Entity resolution considers combinations of name/aliases, address, domain, phone, government identifiers, geography and existing claims. Do not silently merge records based only on fuzzy name similarity.

## Acceptance intent

- `ACQ-004`: seeded organization information/map/category/unclaimed state is available with a claim action.
- `ORG-001`: likely organization matches can be found from entered name, geography, seeded and existing records.
- `ORG-002`: a participant can claim/select an existing record or create new while carrying provisional information forward.
- `ORG-003`: duplicate/entity checks compare the documented identity signals and preserve ambiguity for controlled resolution.

## Expected implementation qualities

- one canonical organization-resolution service/path shared by acquisition and onboarding;
- explicit provenance for seeded vs organization-confirmed data;
- stable organization IDs independent of display name;
- normalized matching inputs where appropriate without destructive assumptions;
- deterministic duplicate/conflict cases covered by tests;
- no claim authority granted merely because a match was selected;
- audit/evidence hooks compatible with the later authority/claims slice.

## Explicit non-scope

Do **not** implement in Slice 2.3:

- `ORG-004` claim/authority validation;
- admin claims console/adjudication (`ADM-065`, `ADM-066`);
- Organization Verification;
- address/geocode confirmation;
- essential capability/profile completion;
- marker activation;
- future automatic external-entity enrichment beyond what is necessary for the approved matching contract.

## Exit checkpoint

The system knows **which organization record** the participant is attempting to manage, or has safely created a new organization record, but authority over an existing organization has not yet been assumed.

## Completion discipline

Do not mark authority/verification features complete from organization resolution evidence. Recalculate dependencies after merge and do not begin Slice 2.4 unless authorized.
