# INF-007 — Scheduled and event-driven job framework

## Scope

INF-007 adds the reusable execution model for RFxchange background work on top of the INF-006 Cloud Functions runtime.

The framework is intended for:

- notifications;
- verified webhook ingestion;
- retention processing;
- credibility recalculation;
- search/index projections;
- system maintenance; and
- other asynchronous or event-driven workflows.

The first concrete workflow is `scheduledBackgroundJobHeartbeat`, a scheduled framework canary. It proves the runtime and persistence behavior without prematurely embedding notification, billing, credibility, retention, or RFx feature logic in Firebase code.

## Delivery model

Firebase scheduled and event-driven functions must be treated as at-least-once delivery. The same logical event may arrive more than once, retries may overlap, and an invocation can stop after performing only part of its work.

Accordingly, a handler is not allowed to assume that one platform invocation equals one business action.

Every job request carries:

- a stable job name;
- a category;
- an idempotency key from the originating event or schedule delivery;
- a SHA-256 payload fingerprint;
- a correlation ID;
- environment and Firebase project identity;
- requested time;
- maximum attempts;
- retry backoff;
- execution lease duration.

## Provider-independent application contract

`functions/src/application/background-jobs.ts` defines:

- the job request;
- claim decisions;
- the persistence port;
- retryable and terminal errors;
- handler context;
- execution outcomes; and
- the generic `executeBackgroundJob` application service.

It imports no Firebase SDK and contains no Firestore types. Firebase schedule events, Pub/Sub envelopes, webhook request objects, and provider exceptions are translated at the adapter boundary.

## Idempotency

The Firestore adapter derives the aggregate document ID from:

```text
SHA-256(jobName + NUL + idempotencyKey)
```

The raw idempotency key is not persisted. Its hash is stored for integrity validation.

The logical payload is independently fingerprinted. Reusing the same job name and idempotency key with a different payload is a terminal `idempotency-payload-conflict`; the existing successful action is not silently reused for different work.

A succeeded job is returned as `duplicate` on subsequent processing. Its handler is not invoked again.

## Transactional claim and lease

`backgroundJobs` is the mutable coordination aggregate.

Claiming runs in a Firestore transaction:

1. create and claim a new job at attempt 1; or
2. return `duplicate` when already succeeded; or
3. return `in-progress` while a live lease is held; or
4. return `retry-not-ready` until backoff expires; or
5. return the existing terminal failure; or
6. reclaim an expired lease or ready retry as the next attempt.

A lease prevents overlapping deliveries from concurrently performing the same work. If a worker stops without completion, the lease eventually expires and a later delivery can reclaim the job. Maximum attempts prevent indefinite execution.

The Firestore transaction creates the claim event atomically with the aggregate state change.

## Retryable failure

A handler signals a transient condition with `retryableBackgroundJobError`.

The store records:

- `retryable-failure` status;
- bounded error code;
- cleared lease;
- next attempt time; and
- an append-only failure event.

Backoff is exponential from the configured base and capped at one hour. A later invocation can claim the next attempt only after `nextAttemptAt`.

Unexpected handler errors are classified as retryable `unhandled-job-error` so transient runtime/provider problems do not silently become permanent business decisions.

## Terminal failure

A handler signals a non-retryable condition with `terminalBackgroundJobError`.

A failure also becomes terminal when the maximum attempt count is reached.

Terminal state records:

- final attempt count;
- bounded error code;
- completion time;
- cleared lease and retry time; and
- an append-only terminal event.

A later duplicate delivery returns the terminal outcome and does not execute the handler again.

## Auditability

Two top-level canonical Firestore collections are used:

| Collection | Purpose | Policy |
| --- | --- | --- |
| `backgroundJobs` | current idempotency, lease, retry and outcome state | mutable, server-only |
| `backgroundJobEvents` | claim, success, retryable failure, terminal failure, conflict and exhaustion history | append-only, server-only |

Every event includes:

- stable event ID;
- job ID and name;
- category;
- event type and resulting status;
- attempt number;
- correlation ID;
- environment and project;
- bounded error code;
- bounded scalar metadata; and
- observed time.

The approved audit query is equality by `jobId`; it uses Firestore automatic single-field indexing and requires no manual composite index.

## Retention classification

Background job state and job events are operational records subject to ADM-010 retention classification.

The aggregate and append-only event ledger must not be purged merely because execution finished. Production retention policy must distinguish:

- short-lived mutable coordination state that may later be compacted after its audit period; and
- event evidence required for security, audit, provider reconciliation, dispute, financial, legal, or compliance purposes.

INF-007 establishes the record types and immutable history required for classification. Actual scheduled disposition work must use the retention policy/assignment architecture and may not independently authorize deletion.

## Environment safety

Before persistence, the application service verifies that the job request environment and Firebase project equal the active INF-006 runtime context.

A job prepared for another environment or project fails before claim or handler execution. This prevents a staging payload from being accepted by production merely because it reached a valid function endpoint.

Persisted state is also checked against the requested environment, project, category, job name, and hashed idempotency key.

## Scheduled framework canary

`scheduledBackgroundJobHeartbeat` runs every 15 minutes in UTC with platform retry configuration.

It:

1. derives the runtime context;
2. uses the scheduler event ID as the idempotency key;
3. fingerprints the schedule payload;
4. runs through the generic job service and Firestore store;
5. persists bounded heartbeat metadata;
6. logs the correlated outcome; and
7. throws on retryable outcomes so Cloud Scheduler retry policy can redeliver.

The canary does not send messages or mutate feature-domain records. It proves the reusable infrastructure.

## Emulator acceptance

`backgroundJobFrameworkProbe` exists only when the Functions emulator is active. Production calls receive a not-found response.

CI proves:

### Success and duplicate suppression

- first delivery claims and succeeds at attempt 1;
- job aggregate is `succeeded`;
- claim and success events exist;
- repeated delivery returns `duplicate` without another attempt.

### Retry and recovery

- first attempt raises a retryable failure;
- immediate repeat returns `retry-not-ready`;
- processing after backoff claims attempt 2;
- attempt 2 succeeds;
- later delivery returns `duplicate`;
- two claim events, one retryable failure, and one success remain auditable.

### Terminal failure

- first attempt raises a terminal failure;
- aggregate remains terminal;
- later delivery does not invoke the handler;
- claim and terminal events remain auditable.

The existing Auth, Firestore Rules, Functions runtime, architecture, TypeScript, lint, and production-build suites continue in the same CI run.

## Extension conventions

Future notifications, webhooks, retention jobs, credibility recalculation, and indexing work must:

1. derive a stable idempotency key from the source event;
2. fingerprint the normalized logical payload;
3. translate provider input into a provider-independent handler request;
4. use the shared runner and store;
5. classify errors explicitly as retryable or terminal where known;
6. return bounded operational metadata rather than message or business payloads;
7. preserve correlation and event auditability;
8. enforce environment/project scope; and
9. avoid writing side effects outside the idempotent job boundary.

Provider-specific webhook signature validation or message delivery belongs before/behind the appropriate provider adapter; it does not weaken these job guarantees.

## Acceptance mapping

Tracker acceptance:

> At least one scheduled/event-driven workflow demonstrates idempotency, retry/failure handling, auditability and environment-safe execution.

Evidence:

- a real `onSchedule` function is exported;
- the same generic framework is exercised through the emulator probe;
- Firestore transactions and leases protect concurrent/duplicate delivery;
- retryable and terminal states are persisted;
- append-only job events preserve attempt history;
- environment and project mismatches fail before persistence;
- CI verifies success, duplicate, retry-not-ready, retry recovery, terminal failure, aggregate state, and audit events.
