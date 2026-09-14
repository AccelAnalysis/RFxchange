# AccelPO CP-06 TaskNotification

## Purpose

CP-06 turns committed AccelPO domain events into durable, organization-scoped in-app attention records. Notifications communicate that something changed. Tasks are separate work records that require completion. Reading a notification never completes a task.

CP-06 plugs into the existing chassis rather than creating parallel infrastructure:

- CP-01 supplies trusted identity, active organization, membership, and capabilities.
- CP-03 remains the only client-facing consequential write boundary.
- CP-04 remains the task/notification read boundary.
- CP-06 owns event-to-work planning, deduplication, durable task/notification persistence, optional push intents, and durable attention counts.

## Routes

CP-06 adds no routes. It uses the existing Home, Tasks, Organization, and Purchase Case detail routes. Persisted deep links carry organization, Purchase Case where applicable, and permitted action as restoration hints; those values never grant access and are re-authorized through CP-01/CP-04.

## Events

The versioned event contract supports:

- `approval-submitted`
- `approval-decision`
- `disapproval`
- `revision-requested`
- `offer-review`
- `award-ready`
- `fulfillment-exception`
- `receiving-due`
- `evidence-due`
- `evidence-correction`
- `invitation`
- `seat-capacity`
- `setup-incomplete`

The event envelope contains event identity, event type, organization, optional Purchase Case, actor, timestamp, display-safe facts, permitted action, deep-link target, notification recipients, and task assignees where work is required.

Display facts are strictly allowlisted to purchase title, provider name, organization display name, due date, and setup area. Budget values, receipt data, approval notes, internal comments, and file references/URLs cannot enter notification or task copy.

## Assignment and permissions

Every recipient and assignee is resolved server-side against the shared RFxchange membership and authorization model. User actors are also re-bound to an active organization membership.

Required authority includes:

- approval work: `purchasing.approve`
- offer review: `purchasing.sourcing.view`
- award: `purchasing.award`
- fulfillment exception: `purchasing.order`
- requester receiving/evidence/revision work: `purchasing.request`
- invitation and seat attention: `organization.people.manage`
- organization setup: `purchasing.configure`

Pre-acceptance invitation delivery and acceptance remain in the shared CP-01 identity/invitation flow because CP-04 organization projections require a ready active organization context. CP-06's `invitation` event is durable organization-admin attention for invitation activity; it does not create a second invitation inbox or membership path.

## Owned data

CP-06 declares these server-managed, organization-scoped collections in `src/accelpo/cp06/firestore-schema.ts`:

- `accelpoTaskNotificationEvents` — immutable event/deduplication receipts.
- `accelpoNotifications` — mutable read state, one recipient per record.
- `accelpoTasks` — mutable completion state, one assignee per record.

Task and notification IDs are deterministic hashes of the committed event ID plus recipient. Event receipts carry a content fingerprint. Re-delivery of an identical event replays prior IDs; reuse of the same event ID for different content fails with an event conflict.

The repository's Firestore catch-all default deny keeps these collections inaccessible to direct browser reads/writes. CP-04 is the browser read path and CP-03 is the consequential write path.

## CP-03 commands

CP-06 registers permission-specific variants of two conceptual commands into the existing `/api/accelpo/commands` registry:

- mark notification read;
- complete assigned task.

Variants exist for request, approval, sourcing, award, order, people/seat administration, and purchasing configuration authority. Each command is organization-scoped, owner-scoped, idempotent, and version-checked by CP-03. The handler also requires the stored item's `requiredPermission` to equal the invoked command permission, preventing a lower-authority command from completing higher-authority work.

Marking a notification read updates only that notification. It never mutates a task.

## CP-04 queries and badges

CP-06 consumes the existing role-safe projections:

- `task-summary`
- `notification-summary`

The attention-count adapter pages those durable projections to calculate open task count, unread notification count, and combined PWA badge count. `setAppBadge`/`clearAppBadge` is best-effort presentation only; durable CP-04 records remain authoritative.

## Optional push

`TaskNotificationPushIntentSink` is an optional hook containing only already-safe notification copy, recipient, event identity/type, organization, and local deep link. Push failure does not roll back a durable in-app notification. SMS is not required or implemented.

## Critical invariants

1. Producers invoke CP-06 server-side only after a domain state change commits.
2. Stable event IDs make retries idempotent and conflicting reuse fails.
3. Recipients and assignees must be active, authorized organization members.
4. Task completion remains protected by CP-03 authentication, membership, tenant scope, owner, fixed permission, expected version, and idempotency.
5. Notification read and task completion are independent writes.
6. Private purchasing fields cannot enter display copy.
7. Browser reads use CP-04; direct Firestore access remains denied.
8. Badge state derives from durable records, not transient browser events.

## Tests

`test/accelpo-cp06-task-notification.test.mjs` covers chassis registration, the required event catalog, separate task/notification creation, privacy rejection, event deduplication, invalid deep-link/action rejection, permission-specific command ownership/version behavior, refusal of weaker task commands, notification/task separation, idempotent command registration, and durable CP-04 attention/PWA badge counts.

Existing CP-03 and CP-04 tests continue to cover the shared server authorization, tenant isolation, replay/version, and projection boundaries consumed by CP-06.

## Remaining integration boundary

Purchase Case functional parts must emit these events only after their own domain state commits and must use stable event IDs as retry keys. Pre-membership invitation acceptance remains CP-01/shared identity responsibility.
