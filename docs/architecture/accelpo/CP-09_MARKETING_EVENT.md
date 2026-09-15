# AccelPO CP-09 MarketingEvent

CP-09 is AccelPO's server-only lifecycle signal port to RFxchange Marketing. It reports meaningful
product milestones without sending the private purchasing record that caused them. Transactional
work such as approval decisions, evidence corrections, and receiving reminders remains CP-06 work.

## Trust boundary

There is no browser endpoint for CP-09. Organization and actor identity come from trusted server
context; they are not accepted from an event payload. AccelPO command handlers stage a marketing
outbox record through the CP-03 `CommandTransaction`, so the business write and its lifecycle signal
commit together. Server-owned lifecycle sources that do not use CP-03 use the committed-event
adapter, which deduplicates by deterministic source identity before creating the same outbox shape.

Delivery is asynchronous. A Firebase Functions Firestore trigger copies only the allowlisted signal
into `marketingLifecycleSignals`, marks the outbox delivered, and retries failed deliveries. A
failed Marketing delivery does not rerun or roll back a Purchase Case, authorization, award,
fulfillment, evidence, membership, or entitlement change.

Direct browser access to these records remains denied by the repository's server-managed Firestore
boundary and deny-all fallback. CP-09 adds no campaign screen, client write path, or second
notification system.

## Contract

Port version: **1**. Product source is always `accelpo`.

Lifecycle event types:

- `account.created`
- `organization.configured`
- `team.invited`
- `purchasing-policy.configured`
- `purchase-request.first`
- `approval.first`
- `community-sourcing.first`
- `award.first`
- `purchase.completed.first`
- `purchase.repeat-use`
- `seat.expanded`

The Marketing-safe signal contains only the event type, organization ID, optional actor/account ID,
Purchase Case ID when the milestone genuinely needs it, product source, occurrence time, source
event ID, deterministic deduplication key, and these bounded lifecycle facts:

- purchasing mode (`direct-provider`, `source-first`, or `authorize-first`);
- invited-team count band (`one`, `2-5`, or `6-plus`);
- repeat-use band (`second`, `3-5`, or `6-plus`);
- seat-expansion band (`one`, `2-5`, or `6-plus`);
- whether community sourcing is eligible.

The parser rejects unknown top-level fields and unknown lifecycle facts. Budgets, receipt data,
approval comments, private file references, supplier offers, internal comments, and other Purchase
Case details therefore have no field in the contract. The delivery worker projects the allowlist a
second time before writing the Marketing signal stream.

## Idempotency and delivery

`organizationId + eventType + sourceEventId` is hashed into the deduplication key. That key produces
one deterministic outbox document ID. CP-03 command replay does not execute the command handler
again; the committed-event adapter also treats an existing matching outbox record as a duplicate.
The delivery trigger uses the same outbox ID for the Marketing signal and verifies its deduplication
key before treating an existing signal as delivered.

Outbox states are `pending`, `retryable-failure`, and `delivered`. Delivery attempts and safe error
codes live on the outbox only; delivery state never changes the lifecycle signal facts.

## Chassis registration and ownership

- **Routes:** none.
- **Standalone permissions:** none. Event production occurs only inside already-authorized trusted
  server work; CP-09 cannot grant purchasing authority.
- **Commands owned:** none. Consequential domain commands remain with their functional parts through
  CP-03.
- **Queries owned:** none. CP-09 does not expose participant data.
- **Events:** the eleven lifecycle milestones listed above.
- **Owned data:** `accelPoMarketingEventOutbox` and the Marketing-safe
  `marketingLifecycleSignals` delivery projection.
- **External port:** the existing RFxchange Marketing/lifecycle system in Firebase project
  `rfxchange`.
- **UI:** none.

Functional parts should call `stageMarketingEventFromCommand` only after their authoritative domain
transition has been decided, inside the same CP-03 transaction. Identity/bootstrap integrations may
call `enqueueCommittedMarketingLifecycleEvent` only from server code after the source state is
committed.

## Focused checks

`test/accelpo-cp09-marketing-event.test.mjs` verifies the complete event catalog, strict payload
allowlist, trusted tenant/actor context, deterministic replay identity, CP-03 staging, retry-state
isolation, chassis registration, absence of a client route/permission, and drift between the typed
contract and the Functions delivery projection.

## Deployment boundary

CP-09 has no participant-facing route. Feature-branch deployment therefore validates integration
through the repository's AccelPO GitHub Pages preview while production Firebase Functions remain a
release/integration action. The current root `firebase.json` defines Functions, Firestore, Storage,
and emulators but does not yet define the `rfxchange-purchasing.web.app` Hosting target; CP-09 does
not invent a parallel hosting configuration to work around that missing shared deployment contract.
