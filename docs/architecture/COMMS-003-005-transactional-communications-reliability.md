# COMMS-003/004/005 — Transactional communications reliability

## Scope

Wave 3 Slice 3.1 turns the provider-neutral COMMS-001 request contract, Microsoft COMMS-002 adapter, and INF-007 background-job framework into one reliable transactional-communications substrate.

The implementation adds:

- explicit platform-event and template version identifiers;
- a reviewed event-to-template catalog with typed, bounded variables;
- provider rendering through the existing `TransactionalEmailContentRenderer` shape;
- a server-managed delivery aggregate and append-only event ledger;
- correlation from originating platform event through template, job attempt, provider result, retry, and terminal failure;
- duplicate suppression through the existing INF-007 idempotency boundary plus the accepted delivery ledger; and
- a server-only terminal-failure projection for authorized operations/admin consumers.

No referral, provider, RFx, commercial, marketing, bulk-email, notification-center, SMS, push, or second-provider workflow is implemented in this slice.

## Versioned event and template catalog

`TransactionalEmailRequest` now carries `eventVersion` and `templateVersion` as explicit positive integers. Existing callers remain compatible because both default to version 1.

A `TransactionalEmailTemplateDefinition` declares:

- event key and event version;
- template key and template version;
- transactional or administrative purpose;
- each allowed variable, type, required/optional state, and bounded string length;
- reviewed subject, text, and optional HTML templates.

`VersionedTransactionalEmailTemplateCatalog` enforces one active mapping for each event/version and one definition for each template/version. Unknown, duplicate, mismatched, missing, extra, overlong, or incorrectly typed variables fail before provider delivery.

HTML variables are escaped by the catalog. Provider adapters receive rendered content rather than arbitrary workflow-authored message bodies.

## Delivery audit model

The trusted server records a mutable aggregate in `transactionalEmailDeliveries` and immutable evidence in `transactionalEmailDeliveryEvents`.

The aggregate retains only delivery and routing evidence needed for operations:

- message ID and hashed idempotency key;
- payload fingerprint;
- event/template keys and versions;
- originating event and correlation IDs;
- purpose;
- recipient address hash and recipient domain, not the raw address;
- organization/user/related-object routing IDs where supplied;
- environment and project binding;
- queued, attempting, accepted, retryable-failure, or terminal-failure status;
- attempt count and background-job ID;
- provider key/reference and bounded diagnostic/failure codes;
- retryability and bounded provider Retry-After evidence; and
- requested, attempted, accepted, completed, created, and updated timestamps.

The ledger does **not** persist rendered subject, text, HTML, template variables, credentials, provider response bodies, or arbitrary message content.

Direct Firestore clients cannot read or mutate either collection. Authorized operations/admin code consumes a server-side terminal-failure query and must apply its existing authority boundary before presenting results.

## Retry and idempotency

`executeReliableTransactionalEmailJob` composes with `executeBackgroundJob`; it does not create another queue or retry engine.

The delivery intent must match the INF-007 job on:

- notification category;
- canonical communications job name;
- idempotency key;
- payload fingerprint;
- correlation ID;
- environment; and
- project.

The flow is:

```text
reviewed event/template intent
→ ensure delivery aggregate
→ INF-007 claim
→ append attempt evidence
→ provider-neutral deliver
→ append accepted or classified failure evidence
→ INF-007 success / retry / terminal completion
```

Reprocessing a successfully accepted event returns duplicate without claiming a job or invoking the provider. INF-007 also prevents concurrent/replayed processing for a job that is already succeeded or in progress.

Transient provider failures use the existing deterministic exponential-backoff policy. A failure becomes terminal when the provider classifies it as permanent or the current attempt exhausts the job's configured maximum. Provider `Retry-After` is retained as evidence but does not create a competing scheduling policy.

The pre-existing Microsoft Graph caveat remains: a process failure after remote provider acceptance but before either local acceptance record commits can still lead to at-least-once duplication. Templates must remain safe under duplicate delivery. Once the accepted delivery ledger commits, a retry is suppressed even if INF-007 success completion was interrupted.

## Privacy and tenant boundaries

- recipient raw addresses are used only in the provider request and converted to a SHA-256 address hash plus domain for the audit ledger;
- delivery records are bound to the active environment/project;
- organization/user routing IDs remain server-only;
- no message body or variable values enter the audit collections;
- direct authenticated and anonymous Firestore clients are denied; and
- public, participant, and cross-organization projections do not expose delivery metadata.

## Operations visibility

The Firestore audit store exposes a bounded `listTerminalFailures` server-side query filtered by environment/project and optionally organization. It returns only delivery ID, status, attempt count, and last error code. It does not return recipient routing fields, provider bodies, or message content.

This is the substrate for later authorized operations/admin presentation. Slice 3.1 does not add a new participant notification center or customer-facing failure dashboard.

## Acceptance

Slice 3.1 acceptance proves:

- event/version to template/version mapping and strict variable rendering;
- version references survive the provider-neutral request contract;
- raw recipient addresses and rendered body content are absent from audit records;
- success records intent, attempt, provider acceptance, and correlation evidence;
- accepted replay does not invoke the provider;
- transient provider failures become deterministic retries;
- permanent and exhausted failures become terminal;
- terminal failures are available through a bounded server-only projection;
- direct Firestore access remains denied; and
- Microsoft-specific types do not leak into domain/application contracts.
