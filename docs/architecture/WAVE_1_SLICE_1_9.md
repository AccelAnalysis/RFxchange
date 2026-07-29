# Wave 1 Slice 1.9 — Policy-Driven Record Retention

## Scope

This slice implements only:

- ADM-010 — Policy-driven record retention classification foundation

Tracker requirement and acceptance check:

> Deletion/moderation routines preserve records required by retention classification.

## Policy-driven classification

Retention behavior is not hard-coded as a set of arbitrary time periods in this slice.

Instead, a versioned `RetentionPolicyClassification` states whether a class of records is:

- `preserve-required`; or
- `retention-not-required`.

A preserve-required policy must state at least one recognized preservation reason:

- legal
- financial
- security
- audit
- dispute
- compliance

Those reasons reflect the product requirement that termination, deletion and moderation must not destroy records that remain necessary for legal, financial, security, audit, dispute or compliance purposes.

No duration is invented here. Retention periods, policy administration and jurisdiction-specific timing belong to later configuration/governance work.

## Exact policy version evidence

A `RecordRetentionAssignment` records the exact:

- retention policy ID
- policy key
- policy version
- classification timestamp
- target record type and ID
- target scope

Disposition evaluation rejects a mismatched policy/version. A later policy version therefore does not silently rewrite the classification evidence that existed when the record was classified.

## Record scope

Retention can apply to both:

- organization-scoped records; and
- platform-scoped records.

This is necessary because RFxchange contains organization assets and user activity, but also platform governance/audit records that do not belong to one organization tenant.

The retention contract therefore does not force all retained data into an organization ownership model.

## Disposition guard

`evaluateRetentionDisposition` covers two future destructive/moderation intents:

- `delete`
- `moderation-remove`

For `preserve-required`, the result is `preserve` and contains the applicable preservation reasons.

For `retention-not-required`, the result is `not-retention-blocked`.

That phrase is intentional. It means only that this retention classification does not block the requested disposition. It does **not** authorize deletion or moderation. Later authorization, moderation, legal-hold, dispute, security and workflow controls still govern whether an action may execute.

`assertRetentionAllowsDisposition` gives future destructive routines a single guard point that throws whenever classification requires preservation.

## Persistence boundary

Retention policy classifications and record assignments use append/read-oriented repository contracts.

The domain ports expose no update/delete methods. Classification history is therefore not designed to be rewritten through this persistence boundary.

Later policy versions can be appended and later assignments can reference them without modifying historical assignments.

## Explicit deferrals

This slice does not implement:

- actual deletion or purge jobs
- moderation removal implementation
- retention duration schedules
- legal-hold or litigation-hold workflows
- dispute-hold workflows
- security/investigation hold orchestration
- privacy-rights deletion workflows
- database cascade behavior
- physical deletion versus anonymization strategy
- archival/cold-storage tiers
- backup retention behavior
- jurisdiction-specific retention periods
- policy administration UI
- policy approval/version publishing workflow
- automated reclassification jobs
- administrator permission checks
- dual approval for retention-conflict erasure
- destructive data-operation tooling
- database adapters or migrations
- tracker spreadsheet updates

Those remain later slices/features.

## Acceptance criteria

Slice 1.9 is acceptable when tests and architecture guardrails prove:

1. preservation-required and retention-not-required are explicit classifications;
2. preservation-required policies carry at least one recognized legal/financial/security/audit/dispute/compliance reason;
3. record assignments preserve exact policy identity/version and classification timestamp;
4. both organization-scoped and platform-scoped records can be classified;
5. deletion and moderation removal resolve to `preserve` for required records;
6. non-required retention resolves only to `not-retention-blocked`, never to deletion authorization;
7. a record assignment cannot be evaluated against another policy/version;
8. policy and assignment records are immutable after construction; and
9. persistence ports are append/read oriented without update/delete methods.
