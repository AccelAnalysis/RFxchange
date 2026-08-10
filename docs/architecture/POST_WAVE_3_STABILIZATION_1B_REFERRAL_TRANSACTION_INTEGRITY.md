# Post-Wave 3 Stabilization 1B — Referral transaction integrity

**Execution baseline:** `9c434ce50c3766f5b0508c69b3140f344b889dbb`

**Feature-ID effect:** none

## Defect

The participant referral composer and Resource Network provider-request form previously executed three independent commands:

1. acknowledge education;
2. create a draft;
3. send the referral.

A lost response or later-step failure could leave a committed draft while the interface reported failure. Retrying generated new command identities and could create another referral. External-recipient acquisition context was also issued outside the referral persistence transaction.

## Correction

The participant-facing flows now use one `create-and-send` command with one retry-stable command identity. The server validates authorization, stable recipient identity, current authoritative recipient/provider label, consent, minimum-necessary sharing, and provider publication eligibility before building the persistence bundle.

One Firestore transaction commits:

- the final version-2 `sent` referral or provider request;
- the version-1 `created` event;
- the version-2 `sent` event;
- the exact reviewed education acknowledgement;
- the command receipt and stable request fingerprint;
- all three organization audit events;
- the queued communication intent, when notification is available; and
- for an external recipient, the acquisition context and its `issued` event.

The draft is an in-memory transition input only. It is never stored independently by the new command.

The create-and-send dependency contract requires atomic acquisition preparation at compile time. The legacy standalone referral service may still issue an acquisition context through its older compatibility seam, but the atomic command cannot be constructed without the non-persisting `prepare` capability.

## Stable replay identity and reviewed labels

The authoritative create-and-send fingerprint uses stable business identity and reviewed substantive input. For an organization recipient, the fingerprint includes the organization ID but excludes mutable display-name and notification-email projections. For an external recipient, the participant-authored name and normalized email remain part of the business input.

Before the first write, an organization/provider request still compares the label the participant reviewed with the current authoritative organization/provider label. A rename before first persistence therefore requires a refreshed review rather than storing an acknowledgement for information the participant did not actually review.

After the command has committed, a later organization/provider rename does not invalidate replay because mutable labels are not part of the authoritative replay identity.

## Reload and actor isolation

The participant interface creates the command identity when the user enters the final review step. The exact recovery fingerprint and command identity are retained in memory and in bounded session storage. Provider requests use the same recovery mechanism while provider ID, service, publication version, and summary remain unchanged.

The storage namespace is scoped by the server-authorized organization and membership. Another organization or membership using the same browser tab cannot inherit the pending command identity. Session storage remains only a retry aid; authorization and replay authority remain server-side.

An uncertain response can therefore be retried in place or after a same-tab browser reload. Reopening the composer does not clear a recoverable command. Intentional close/back from an active review and successful completion clear the matching recovery record. Storage unavailability degrades to in-page retention rather than blocking the action.

## Replay after lifecycle changes

The command receipt permanently proves that version 2 was the result of the atomic create-and-send operation. Replaying that same command and stable business input returns the latest authoritative referral aggregate, even if the referral later advanced to accepted, declined, redirected, contacted, closed, expired, or recipient-attached state.

Replay never rewinds lifecycle state and never requires the aggregate to remain at version 2 or status `sent`. Command reuse with changed stable business input remains a conflict. A failed Firestore transaction leaves no referral, events, acknowledgement, audits, outbox record, or acquisition context.

## Communication boundary

External delivery remains outside the Firestore transaction. The durable communication intent is committed with the referral first; delivery then uses its stable idempotency key.

Automatic invitation delivery is permitted only while the authoritative referral remains `sent` and the communication intent is `queued` or `retryable-failure`. A replay after the referral advances to accepted, declined, redirected, contacted, closed, expired, recipient-attached, or another non-invitable lifecycle state returns the authoritative result without sending an obsolete invitation. Explicit communication retry uses the same lifecycle gate.

A delivery failure changes only communication status and can be retried while the invitation remains valid without recreating the referral or provider request.

## Compatibility boundary

The earlier separate education, draft, and send endpoints remain available for already-deployed or administrative compatibility during this pass. Current participant referral and provider-request interfaces no longer use them. Removing the legacy commands is a separate migration decision.

This correction does not begin RFx Core, alter matching or provider approval, change tracker totals, change Feature IDs, or make new feature-completion claims.
