# COMMS-002 — Microsoft transactional email adapter

## Scope

COMMS-002 implements a production-oriented Microsoft Graph adapter behind the COMMS-001
`TransactionalEmailProvider` port. Domain and application message intent remains provider-neutral;
no acquisition, claim, membership, authority, Verification, or commercial workflow sends email in
this slice.

The implementation follows Microsoft's current application-only flow:

- a confidential server workload obtains a token from the tenant-specific Microsoft identity
  endpoint using the OAuth 2.0 client credentials grant and the
  `https://graph.microsoft.com/.default` scope;
- the registered application requires administrator-approved Microsoft Graph `Mail.Send`
  application permission;
- delivery uses `POST /v1.0/users/{approved sender}/sendMail`; and
- an HTTP `202 Accepted` response is recorded as provider acceptance. It does not prove mailbox
  delivery, because Microsoft documents that Exchange processing continues after acceptance.

Primary references:

- [Microsoft Graph sendMail v1.0](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0)
- [Microsoft identity client credentials flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow)
- [Microsoft Graph Mail.Send permission](https://learn.microsoft.com/en-us/graph/permissions-reference#mail-send)
- [Microsoft Graph throttling guidance](https://learn.microsoft.com/en-us/graph/throttling)

## Boundaries

`MicrosoftGraphTransactionalEmailProvider` is infrastructure. It translates a reviewed RFxchange
request into Graph JSON and translates Graph results into the existing neutral receipt/error
contracts. No provider SDK type or Microsoft endpoint appears in the domain or application request
model.

Content rendering is injected through `TransactionalEmailContentRenderer`. The Graph adapter cannot
turn arbitrary variables into message content. The repository includes one deliberately inert,
minimum-data acceptance renderer; future feature templates require their own reviewed renderer.
The adapter adds only opaque message and correlation headers. It does not add organization IDs,
user IDs, evidence, or arbitrary template variables as Internet headers.

## Environment and sender safety

Runtime composition reads:

| Variable | Purpose |
| --- | --- |
| `RFXCHANGE_ENV` | Active RFxchange runtime role |
| `RFXCHANGE_MICROSOFT_EXPECTED_ENV` | Optional binding that prevents cross-environment use |
| `RFXCHANGE_MICROSOFT_TENANT_ID` | Approved Microsoft tenant |
| `RFXCHANGE_MICROSOFT_CLIENT_ID` | Approved application registration |
| `RFXCHANGE_MICROSOFT_CLIENT_SECRET` | Confidential credential supplied only through managed secrets |
| `RFXCHANGE_MICROSOFT_APPROVED_SENDER` | Approved RFxchange mailbox used in the Graph user endpoint |
| `RFXCHANGE_MICROSOFT_GRAPH_TIMEOUT_MS` | Optional bounded request timeout |

Missing, placeholder, malformed, or cross-environment configuration fails before a provider call.
Microsoft hosts and API version are fixed in code, preventing configuration from redirecting
credentials or message data to another origin. The secret is neither committed nor returned in
receipts, error messages, or acceptance output. A certificate or workload identity can replace the
shared-secret token source in a later hardening slice without changing the COMMS-001 contract.

In Microsoft 365, the application permission should be constrained to the approved sender mailbox
with the tenant's supported application access controls. The endpoint also fixes the sender to the
configured mailbox instead of accepting sender identity from feature input.

## Result and failure semantics

Successful Graph acceptance creates a neutral receipt containing:

- RFxchange message ID;
- `accepted` state;
- opaque `microsoft-graph` provider key;
- Graph `request-id` (or equivalent opaque request reference), when present;
- `microsoft-graph-accepted` diagnostic code; and
- observed time.

The Graph API does not return a provider message ID or response body for `sendMail`. The request ID
is operational correlation evidence, not a mailbox-delivery guarantee.

Network failures, timeouts, HTTP 408/409/429, and 5xx responses are retryable. Authentication,
authorization, and invalid request responses are terminal until configuration or input changes.
The adapter preserves bounded diagnostic codes, request references, and `Retry-After` timing while
discarding provider response messages that could contain sensitive detail.

## INF-007 integration

`transactionalEmailBackgroundJobHandler` adapts a COMMS-001 delivery operation to the existing
INF-007 handler contract:

- an accepted receipt becomes bounded background-job success metadata, retained in the job
  aggregate and append-only success event;
- a known retryable provider failure becomes an INF-007 retryable failure;
- a known permanent provider failure or rejected receipt becomes an INF-007 terminal failure; and
- an unexpected error defaults to the existing retryable safety policy.

The source event's stable message/idempotency key remains the background job idempotency key. This
avoids a second queue or retry mechanism. Microsoft Graph does not promise provider-side
idempotency, so at-least-once delivery can still duplicate a message if a worker stops after Graph
accepts it but before INF-007 records success. Future transactional workflows must keep templates
safe under duplicate delivery and preserve stable correlation.

## Controlled acceptance

`npm run acceptance:microsoft-transactional-email` is intentionally excluded from CI and refuses to
run unless both:

- `RFXCHANGE_ALLOW_LIVE_MICROSOFT_EMAIL_ACCEPTANCE=true`; and
- `RFXCHANGE_MICROSOFT_EMAIL_ACCEPTANCE_RECIPIENT` names the controlled recipient.

The command uses the same `TransactionalEmailService` and provider port as feature code. It sends
only the inert acceptance template and prints the neutral receipt without recipient, credential, or
body data. Deterministic tests use HTTP doubles to prove token acquisition, approved-sender routing,
Graph payload translation, 202 response recording, token reuse, throttling/permanent error
classification, and INF-007 composition without contacting or spamming a real recipient.

Live delivery additionally requires a provisioned tenant, sender mailbox, app registration,
administrator-approved `Mail.Send`, mailbox-scoped access controls, and managed credential. These
external production values are deliberately absent from the repository.
