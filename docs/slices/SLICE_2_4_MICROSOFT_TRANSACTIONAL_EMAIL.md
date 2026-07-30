# Slice 2.4 — Microsoft Transactional Email

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature ID

- `COMMS-002` — Microsoft transactional/admin email adapter

## Objective

Put the approved Microsoft delivery mechanism behind the already-merged provider-neutral communications boundary so production-oriented transactional/admin workflows can send through an approved RFxchange sender without coupling domain/application logic to Microsoft-specific APIs.

## Must read

- `/AGENTS.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/context/ADMINISTRATION.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- canonical tracker/dependency map
- merged `COMMS-001` implementation/architecture evidence
- merged `INF-007` event/job framework evidence
- `docs/slices/WAVE_2_ROADMAP.md`

## Prerequisite state

The canonical tracker records `COMMS-001` and `INF-007` complete. Slice 2.4 consumes those abstractions; it must not bypass them.

## Product rules

- Microsoft is a provider adapter, not a domain model.
- Administrative/transactional message intent should remain provider-neutral upstream of the adapter.
- Approved sender identity/configuration is environment-controlled; do not hard-code secrets or production credentials.
- Provider responses/failures should be recordable/auditable enough for operational diagnosis.
- Delivery retry/background behavior should use the merged job/event framework where applicable rather than inventing a second queue mechanism.
- Message content must obey existing privacy/minimum-data boundaries; do not place sensitive evidence into email merely because delivery is available.

## Acceptance intent

A controlled test message can be delivered through Microsoft from the approved RFxchange sender identity with provider response recorded.

The acceptance evidence should demonstrate the adapter is reached through the provider-neutral boundary rather than direct Microsoft calls from feature code.

## Expected implementation qualities

- adapter conforms to the existing communications provider contract;
- environment-safe configuration and clear missing-config failure;
- deterministic unit tests using provider doubles/mocks;
- controlled integration/acceptance path that does not spam real recipients;
- provider message/response identifiers or delivery result state retained where useful;
- failure classification compatible with retries/operations health;
- no secrets committed to the repository.

## Explicit non-scope

Do **not** implement in Slice 2.4:

- claim/authority workflow emails beyond the minimum test/integration hooks needed to prove the adapter;
- broad marketing-email campaigns;
- newsletter tooling;
- user notification-center features;
- unrelated SMS/push providers;
- changes to organization claim authority;
- changes to commercial entitlements.

## Exit checkpoint

The application has a production-capable Microsoft transactional/admin delivery adapter behind the existing communications abstraction, ready for later claim/authority and other transactional workflows.

## Completion discipline

Do not use successful email delivery as evidence that any downstream claim/authority feature is complete. Recalculate dependencies after merge and do not begin Slice 2.5 without authorization.
