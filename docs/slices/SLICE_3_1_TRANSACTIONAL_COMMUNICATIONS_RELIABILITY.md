# Slice 3.1 — Transactional Communications Reliability

**Status: PLANNING BRIEF ONLY — DEPENDENCY-ELIGIBLE AFTER BRAND GATE B0 MERGES; DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `COMMS-003` — Transactional email template and event architecture
- `COMMS-004` — Email delivery status and audit log
- `COMMS-005` — Email retry, idempotency and failure handling

## Objective

Turn the existing provider-neutral Microsoft delivery adapter into a dependable Network communications substrate before referrals, provider invitations and other Network workflows depend on it.

## Must read

- `/AGENTS.md`
- `docs/context/README.md`
- `docs/context/ADMINISTRATION.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/brand/README.md`
- `docs/brand/BRAND_GATE_B0_RECONCILIATION.md`
- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`
- `docs/brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md`
- canonical tracker/dependency map
- merged `COMMS-001`, `COMMS-002`, `INF-007`, `ARC-006`
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

- Version templates and map supported platform events to explicit template/version identifiers.
- Delivery records retain intent, recipient routing metadata, originating-event correlation, provider message reference, attempt/status and failure classification without storing unnecessary message-body content.
- Reprocessing the same platform event must not send duplicate messages.
- Retry only transient failures according to policy; terminal failures become visible to authorized operations/admin surfaces.
- Domain/application workflows request communications through the existing provider abstraction; Microsoft-specific contracts do not leak into domain models.
- Domain facts, notification policy and provider delivery state remain separate. Email delivery does not create or reverse the originating business fact.

## Brand and messaging rules

- Use **The RFxchange** consistently and apply **By Accel Analysis** only in governed parent/provenance contexts.
- Customer-facing templates use the direct, calm, specific pattern: what happened, why it matters and what happens next.
- Template/version records preserve the exact customer-facing copy used for historical delivery evidence.
- Safe variable schemas contain only minimum-necessary data; never pass complete domain objects or private evidence into templates.
- Potential match, provider routing, referral and later RFx language must not imply qualification, endorsement, guaranteed eligibility, award or outcome.
- Commercial/Founding status must not change transactional truth, urgency or credibility language.
- Production sound is not a communications channel and is not part of this slice. Later sound may consume authoritative events but cannot depend on provider email success.

## Acceptance intent

- supported events render required variables and preserve template/version references;
- admins can correlate an originating platform action to attempted/sent/failed delivery state;
- duplicate event processing does not duplicate delivery;
- transient delivery failures retry deterministically and terminal failures are observable;
- cross-tenant/private message metadata remains protected;
- templates comply with approved product naming, claims, privacy and evidence language;
- message deep links preserve navigation intent but re-check current authorization and state;
- delivery failure does not erase or fabricate the originating business fact.

## Expected implementation qualities

Provider-neutral application contracts, typed/versioned template schemas, safe variable validation, idempotent delivery keys, retry classifications, immutable audit correlation, protected operations visibility, and tests for wrong-recipient/cross-organization/template-variable/privacy failures.

## Explicit non-scope

Do not implement referral/provider/RFx workflow logic, marketing campaigns, bulk promotional email, billing communications beyond reusable event/template support, a second email provider, a notification center, SMS/push, production sound or haptics.

## Exit checkpoint

Network workflows can safely emit truthful transactional communications through a versioned, auditable and idempotent delivery pipeline.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.2. Slice 3.2 also remains blocked until Brand Gates B1, B2, B3 and B6a are complete.
