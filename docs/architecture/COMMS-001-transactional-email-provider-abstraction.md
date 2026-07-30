# COMMS-001 — Transactional Email Provider Abstraction

## Purpose

COMMS-001 establishes one provider-independent application boundary for RFxchange transactional and administrative email. Workflows describe what RFxchange is sending; infrastructure adapters decide how a specific provider delivers it.

This slice intentionally does **not** integrate Microsoft Graph or another mail provider. It prevents that future adapter from becoming the RFxchange messaging data model.

## Request contract

Every outbound request contains:

- stable RFxchange message ID;
- purpose: `transactional` or `administrative`;
- recipient email and optional display name;
- stable event key describing why the message exists;
- stable template key describing which RFxchange template is requested;
- provider-neutral template variables;
- correlation ID;
- idempotency key;
- requested timestamp;
- optional organization and user context;
- optional related object type + ID pair;
- optional tags.

The contract deliberately carries template/event identifiers rather than provider template IDs or provider SDK objects.

## Delivery metadata and receipt

A provider adapter receives the normalized `TransactionalEmailRequest` through `TransactionalEmailProvider.deliver(...)` and returns a provider-neutral receipt containing:

- RFxchange message ID;
- `accepted` or `rejected` status;
- opaque provider key;
- optional opaque external delivery reference;
- recorded timestamp;
- optional provider-neutral diagnostic code.

The application service rejects a receipt tied to a different message ID, preserving correlation across the provider boundary.

Acceptance at this layer means the provider accepted or rejected a delivery request. It does not assert recipient inbox delivery, read status, or user engagement; later communications features can add provider-event ingestion without changing this request contract.

## Validation

The domain factory validates:

- syntactically plausible recipient email;
- stable event/template/message identifiers;
- valid timestamps;
- finite primitive template variables;
- bounded variable/tag/reference counts and lengths;
- paired related-object type + ID;
- required correlation and idempotency identifiers.

This keeps malformed workflow messages from reaching a provider adapter.

## Provider boundary

Domain/application code contains no dependency on Microsoft Graph, Azure SDKs, SendGrid, Mailgun, Postmark, SES, Firebase, or any other delivery provider.

A future Microsoft adapter may translate:

`TransactionalEmailRequest → Microsoft provider request`

and:

`Microsoft provider response → TransactionalEmailDeliveryReceipt`

but provider credentials, Graph object types, mailbox IDs, transport headers, provider template IDs, and retry APIs remain infrastructure concerns.

## Relationship to later communications work

COMMS-001 is the request/delivery port only. Later items may add:

- Microsoft provider implementation;
- persisted outbox / delivery attempt ledger;
- retries and dead-letter handling;
- template catalog/version governance;
- user notification preferences;
- delivery-event/webhook ingestion;
- bulk or campaign communications where separately authorized.

Those features consume this abstraction rather than redefine it.

## Acceptance criteria

COMMS-001 is complete when production CI proves that application code can request transactional or administrative email through a provider interface with recipient, event, template, correlation, idempotency and delivery metadata, and provider-specific SDK/types remain outside domain/application contracts.
