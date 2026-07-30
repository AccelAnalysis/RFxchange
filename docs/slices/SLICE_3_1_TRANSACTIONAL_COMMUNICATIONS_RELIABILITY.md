# Slice 3.1 — Transactional Communications Reliability

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL WAVE 2 EXIT IS VERIFIED AND EXPLICITLY AUTHORIZED**

## Feature IDs
- `COMMS-003` — Transactional email template and event architecture
- `COMMS-004` — Email delivery status and audit log
- `COMMS-005` — Email retry, idempotency and failure handling

## Objective

Turn the existing provider-neutral Microsoft delivery adapter into a dependable Network communications substrate before referrals, provider invitations and other Network workflows depend on it.

## Must read

- `/AGENTS.md`
- `docs/context/ADMINISTRATION.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- canonical tracker/dependency map
- merged `COMMS-001`, `COMMS-002`, `INF-007`, `ARC-006`
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

- Version templates and map supported platform events to explicit template/version identifiers.
- Delivery records retain intent, recipient routing metadata, originating-event correlation, provider message reference, attempt/status and failure classification without storing unnecessary message-body content.
- Reprocessing the same platform event must not send duplicate messages.
- Retry only transient failures according to policy; terminal failures become visible to authorized operations/admin surfaces.
- Domain/application workflows request communications through the existing provider abstraction; Microsoft-specific contracts do not leak into domain models.

## Acceptance intent

- supported events render required variables and preserve template/version references;
- admins can correlate an originating platform action to attempted/sent/failed delivery state;
- duplicate event processing does not duplicate delivery;
- transient delivery failures retry deterministically and terminal failures are observable;
- cross-tenant/private message metadata remains protected.

## Explicit non-scope

Do not implement referral/provider/RFx workflow logic, marketing campaigns, bulk promotional email, billing communications beyond reusable event/template support, or a second email provider.

## Exit checkpoint

Network workflows can safely emit transactional communications through a versioned, auditable and idempotent delivery pipeline.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.2.