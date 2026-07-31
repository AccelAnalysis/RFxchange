# Wave 4 RFx Domain Event & Notification Catalog

**Status: PARALLEL PLANNING ANALYSIS — NON-CANONICAL UNTIL RFx CORE CONVERGENCE REVIEW**

This document defines the proposed domain-event, workflow-signal, reminder and notification architecture for **Wave 4 — RFx Core**, plus explicit seams for later Wave 5 evaluation/Q&A/addenda/selection and future outcome workflows.

It is a planning artifact only. It does **not** authorize Wave 4 implementation, create a notification-center Feature ID, change tracker completion status, alter the canonical dependency map, define final event transport, make template names canonical, or make any proposed lifecycle state canonical.

The purpose is to ensure that RFx activity, participant attention and communications are derived from one coherent transaction model rather than scattered feature-specific email calls, UI toasts and cron jobs.

---

## 1. Governing invariant

The central rule is:

> **A domain event records that a fact happened. A notification decision determines whether a particular recipient should be told about that fact. A delivery record reports whether a channel attempted or completed delivery. These are separate layers.**

Therefore:

- `RFxPublished` is true because the RFx publication transaction committed successfully;
- a saved-search matcher may decide that the published RFx is relevant to Organization B;
- Communications may create a notification intent for a particular authorized user;
- Microsoft delivery may send or fail to send an email;
- none of those downstream facts can retroactively decide whether the RFx was published.

Likewise:

- an email being sent does not mean an invitation was accepted;
- a notification being read does not mean an addendum was acknowledged;
- clicking a link does not mean a response was submitted;
- a delivery failure does not erase the underlying RFx fact;
- a digest omission does not remove an opportunity from canonical discovery.

---

## 2. Inputs and authority

This planning lane consumes, but does not supersede:

- `/AGENTS.md`;
- `docs/context/RFX_TRANSACTION_CYCLE.md`;
- `docs/context/ACQUISITION_AND_RETENTION.md`;
- `docs/context/ORGANIZATION_MODEL.md`;
- `docs/context/MAP_AND_GEOGRAPHY.md`;
- `docs/context/CREDIBILITY_SYSTEM.md`;
- `docs/slices/SLICE_2_4_MICROSOFT_TRANSACTIONAL_EMAIL.md`;
- `docs/slices/SLICE_3_1_TRANSACTIONAL_COMMUNICATIONS_RELIABILITY.md`;
- `docs/slices/WAVE_3_ROADMAP.md`;
- `docs/rfx/design/RFX_WAVE_4_FEATURE_CROSSWALK.md` from parallel planning lane A;
- `docs/rfx/design/RFX_PRODUCT_WORKSPACES_UX.md` from parallel planning lane B;
- `docs/rfx/design/RFX_EXCHANGE_NETWORK_INTEGRATION_CONTRACTS.md` from parallel planning lane C;
- the canonical tracker and dependency map.

Authority rules:

1. RFx Core owns committed RFx/response/submission facts.
2. Surrounding Exchange domains own their own facts, including organization authority, geography, referrals, provider lifecycle, credibility and communications delivery.
3. Communications consumes a committed event or explicit notification request; it does not invent RFx lifecycle state.
4. Notification recipient resolution is authorization-aware and may change over time; the original domain event remains unchanged.
5. A deep link identifies navigation intent, not access authority.
6. Public/acquisition links preserve context but never grant protected RFx, organization or team authority.
7. Template content must respect the minimum-necessary privacy boundary of the underlying event.
8. Later Wave 5 event seams in this document remain future scope until separately authorized.

---

## 3. Vocabulary

### 3.1 Domain event

A durable past-tense fact emitted by the authoritative owning domain after its transaction commits.

Examples:

- `RFxCreated`
- `RFxPublished`
- `PursuitDecisionRecorded`
- `TeamInvitationCreated`
- `TeamInvitationAccepted`
- `SubmissionReceived`

A domain event must never be named as an instruction such as `SendEmail` or `NotifyUser`.

### 3.2 Integration event

A domain fact exposed across a bounded domain boundary for consumers such as Discovery, Communications, Audit or Intelligence.

Not every internal domain event must become a broad integration event.

### 3.3 Derived event

A fact computed from one or more authoritative facts.

Examples:

- `SavedSearchMatched`
- `PotentialOpportunityMatchIdentified`
- `RFxDeadlineApproaching`

Derived events must preserve their weaker semantics. A match is not qualification; a reminder is not a lifecycle transition.

### 3.4 Scheduled event

A derived event produced because canonical time crossed a policy threshold.

Examples:

- `RFxDeadlineApproaching`
- future `EvaluationDeadlineApproaching`

Scheduled events must be recalculated or invalidated when the authoritative deadline/version changes.

### 3.5 Notification intent

A request to communicate a specific fact/purpose to a resolved recipient through one or more permitted channels.

A notification intent contains enough information to select the correct template, safe variables, priority, deep-link intent, suppression rules and delivery policy.

### 3.6 Notification item

A user-visible participant/admin notification representation, if/when a canonical in-product notification surface exists.

A notification item is presentation state. Read/unread/dismissed state is not RFx transaction state.

### 3.7 Delivery attempt

A Communications-owned attempt to send through a channel/provider.

Examples:

- email queued;
- provider accepted;
- transient failure;
- retry scheduled;
- terminal failure.

### 3.8 Audit event

Durable evidence that a consequential action occurred. Audit records may consume the same fact as notifications but exist for a different purpose and retention model.

### 3.9 Operational alert

An internal operations/admin attention signal about system health or terminal failure, not a participant transaction notification.

---

## 4. Event architecture layers

Conceptually:

```text
Authoritative command/action
  ↓
Owning domain validates authority + state
  ↓
Domain transaction commits
  ↓
Domain event/fact exists
  ↓
Consumers react independently
  ├─ Audit
  ├─ Discovery/index/map
  ├─ Notification policy
  ├─ Communications
  ├─ Credibility evidence seam
  └─ Intelligence/outcome seam
```

Notification processing:

```text
Domain/derived/scheduled event
  ↓
Notification policy evaluates event + current recipient context
  ↓
Recipient set resolved
  ↓
Per-recipient purpose/priority/preference/suppression evaluated
  ↓
Notification intent(s)
  ├─ in-product representation where supported
  └─ Communications request
       ↓
     template/version render
       ↓
     channel delivery attempt
       ↓
     delivery status/retry/failure evidence
```

No arrow flows backward from email delivery to RFx lifecycle truth.

---

## 5. Event naming and semantic rules

### 5.1 Naming

Committed domain facts use past tense:

- `RFxPublished`
- `TeamInvitationDeclined`
- `SubmissionReceived`

Derived facts use explicit semantics:

- `PotentialOpportunityMatchIdentified`
- `RFxDeadlineApproaching`

Commands use imperative/request language and are not cataloged as facts:

- `RequestTransactionalCommunication`
- `RequestOpportunityIndexing`
- `RequestProviderMatches`

### 5.2 No overloaded generic `Updated`

Avoid broad events such as:

- `RFxUpdated`
- `ResponseUpdated`
- `StatusChanged`

when consumers need materially different behavior.

Prefer specific facts such as:

- `RFxDeadlineChanged`
- `RFxVisibilityChanged`
- `RFxClosed`
- `ResponseReadinessEvaluated`

A low-level append-only audit stream may still record general field mutations internally, but integration events should communicate stable business meaning.

### 5.3 One owning domain

Every event type has one authoritative producer.

Example:

- RFx Core emits `SubmissionReceived` for hosted submissions;
- Communications emits delivery status facts;
- an email provider never emits `SubmissionReceived`;
- Discovery never emits `RFxPublished`.

### 5.4 Event permanence

A committed event represents what was true at that point in history even if later events supersede it.

Example:

```text
RFxPublished(V1)
RFxClosed(V1)
```

The later close does not delete publication history.

### 5.5 Event version identity

Events involving public/respondable RFx content should carry the relevant RFx version/publication identity once versioning is canonicalized.

A consumer must not assume that `rfxId` alone identifies the exact requirements a responder saw.

---

## 6. Provisional event envelope

Lane C proposed a common cross-domain envelope. D adds notification-oriented metadata while preserving the same conceptual model.

```ts
interface RFxDomainEvent<TPayload> {
  eventType: string;
  eventVersion: number;
  eventId: string;
  correlationId: string;
  causationId?: string;
  occurredAt: string;
  sourceDomain: string;
  actor?: {
    userId?: string;
    organizationId?: string;
    authorityContextId?: string;
  };
  subject: {
    organizationId?: string;
    rfxId?: string;
    rfxVersionId?: string;
    pursuitId?: string;
    responseId?: string;
    submissionId?: string;
    invitationId?: string;
    referralId?: string;
    providerId?: string;
  };
  classification: "PUBLIC" | "PARTICIPANT" | "PROTECTED" | "RESTRICTED" | "OPERATIONAL";
  payload: TPayload;
}
```

Names remain provisional.

### 6.1 Required properties

- unique event ID;
- stable event type/version;
- authoritative occurred-at time;
- correlation ID across the business journey;
- owning domain;
- bounded subject references;
- data classification;
- minimum-necessary payload;
- no embedded assumption that a recipient is authorized to read the underlying subject.

### 6.2 Actor semantics

Actor metadata explains who caused the fact where relevant. It does not replace current membership/permission evaluation.

A user who legitimately caused `RFxPublished` may later lose issuer authority; the historical event remains accurate.

---

## 7. Provisional notification-intent contract

```ts
interface NotificationIntent {
  intentId: string;
  sourceEventId: string;
  notificationType: string;
  purpose: NotificationPurpose;
  priority: NotificationPriority;
  recipient: {
    userId: string;
    organizationId?: string;
  };
  templateKey: string;
  templateData: Record<string, SafeTemplateValue>;
  deepLink?: DeepLinkIntent;
  channels: NotificationChannelPolicy[];
  suppressKey?: string;
  digestKey?: string;
  expiresAt?: string;
  createdAt: string;
}
```

Again, names are provisional.

The intent contains presentation/delivery instructions. It does not contain transaction authority.

---

## 8. Notification purposes

Use a small number of semantic purposes instead of one custom urgency model per feature.

### P1 — Action required

The recipient has a legitimate, time-bounded or workflow-blocking action.

Examples:

- team invitation awaiting decision;
- future addendum acknowledgment required;
- future evaluator COI disclosure required.

Default behavior:

- in-product prominent item where supported;
- transactional email where appropriate;
- not bundled into a low-priority digest when delay would undermine the workflow.

### P2 — Transaction confirmation

Confirms a consequential action already completed.

Examples:

- RFx published;
- hosted submission received;
- external handoff recorded.

Default behavior:

- in-product history/confirmation;
- email for high-value irreversible actions where useful.

### P3 — Lifecycle change

A transaction the recipient legitimately follows changed state.

Examples:

- RFx closed;
- team invite accepted/declined;
- future RFx cancelled;
- future addendum issued.

Channel depends on materiality and recipient relationship.

### P4 — Relevance / discovery

The platform found something potentially relevant.

Examples:

- saved search matched;
- potential opportunity match identified.

These must never imply qualification or endorsement.

Default behavior:

- in-product/feed/result visibility;
- digest-friendly email;
- preference-sensitive where applicable.

### P5 — Reminder

Time-based attention signal derived from canonical deadlines.

Examples:

- watched/pursued RFx deadline approaching.

Default behavior:

- suppress after the action is no longer meaningful;
- policy/preference aware;
- never invent or extend deadlines.

### P6 — Collaboration/relationship activity

An authorized party changed a shared relationship.

Examples:

- team invitation accepted;
- provider referral accepted;
- future Q&A answer published.

### P7 — Operational exception

Internal system/admin attention, not ordinary participant messaging.

Examples:

- terminal transactional-email failure;
- opportunity projection/index repeatedly failed;
- notification recipient resolution repeatedly failed.

---

## 9. Priority levels

Priority controls delivery urgency, not authority.

- **CRITICAL** — rare security/legal/system integrity event requiring immediate operations attention. Ordinary RFx opportunity events should not use this by default.
- **HIGH** — participant action required or consequential transaction confirmation.
- **NORMAL** — lifecycle/activity update.
- **DIGEST** — relevance/discovery items suitable for aggregation.
- **SILENT** — event is recorded/available to UI/audit but no proactive communication is expected.

Do not use HIGH merely because a paid plan is involved.

---

## 10. Recipient resolution

### 10.1 Resolve people from current organization authority

Organization-owned RFx activity should usually target users based on current organization membership/permission/role context rather than storing a permanent email address on the RFx event.

Possible selectors:

- authorized issuer managers for this RFx;
- designated RFx owner;
- response owner/submitting user;
- authorized response collaborators;
- team invitation inviter;
- invitee organization administrators or specifically addressed recipient;
- saved-search owner;
- opportunity watcher;
- organization users opted into permitted RFx alerts;
- future assigned evaluator.

The final selector model requires convergence.

### 10.2 Recipient resolution is not historical truth

The event records what happened. Recipient resolution answers who should be told **now**.

Example:

- user A published an RFx;
- user A leaves the company;
- a later lifecycle update should go to currently authorized issuer users, not necessarily A.

### 10.3 Directly addressed relationships

A team invitation or future evaluator assignment may explicitly identify a user in addition to an organization.

The user still must satisfy the canonical access rules at action time.

### 10.4 Self-notification suppression

For routine collaboration activity, the actor should generally not receive a redundant notification saying they performed the action.

Exceptions include consequential confirmations such as:

- hosted submission received;
- RFx published;
- external submission handoff recorded.

### 10.5 Cross-organization privacy

Recipient resolution must not reveal the existence of:

- a responder draft;
- a private Go/No-Go decision;
- an unaccepted team invitation;
- private provider request details;
- another organization's saved search/watch state;

outside the authorized parties.

---

## 11. Channel policy

### 11.1 Supported conceptual channels

For this planning catalog:

- **IN_APP** — participant/admin notification surface if/when canonically supported;
- **EMAIL** — transactional email through the provider-neutral Communications architecture and Microsoft adapter;
- **DIGEST_EMAIL** — grouped email generated from eligible notification intents;
- **FUTURE_PUSH** — explicit future seam only;
- **FUTURE_SMS** — explicit future seam only.

This document does not authorize push/SMS or a new notification center.

### 11.2 Email is not the canonical record

Email body/content is a communication projection.

The canonical source remains the RFx/response/invitation/referral/etc. domain object.

### 11.3 Channel fallback

A channel failure does not silently switch to an unapproved channel containing more data.

Example:

- email fails;
- Communications retries according to policy;
- it does not send private response content by SMS simply because SMS exists later.

### 11.4 Transaction-critical communication

Some high-value confirmations may be sent independent of promotional preferences because they are part of an active transaction, subject to the eventual legal/product preference model.

This planning document does not make legal consent determinations; convergence must distinguish transactional necessity from optional relevance messaging.

### 11.5 Discovery/relevance communication

Opportunity-match alerts and digests are preference/limit/policy-sensitive and should optimize relevance rather than volume.

---

## 12. Deep-link intent

Notifications should carry a typed navigation intent, not rely on arbitrary persisted URLs.

```ts
interface DeepLinkIntent {
  target:
    | "OPPORTUNITY_DETAIL"
    | "ISSUER_RFX_OVERVIEW"
    | "ISSUER_RFX_READINESS"
    | "PURSUIT_WORKSPACE"
    | "TEAM_INVITATION"
    | "RESPONSE_WORKSPACE"
    | "RESPONSE_READINESS"
    | "SUBMISSION_RECEIPT"
    | "EXTERNAL_SUBMISSION_HANDOFF"
    | "PROVIDER_REQUEST"
    | "FUTURE_QA"
    | "FUTURE_ADDENDUM"
    | "FUTURE_EVALUATION"
    | "FUTURE_SELECTION"
    | "FUTURE_OUTCOME";
  rfxId?: string;
  responseId?: string;
  submissionId?: string;
  invitationId?: string;
  referralId?: string;
  anchorId?: string;
}
```

### 12.1 Resolve at click time

The app resolves the intent against current canonical state and authorization.

If the recipient is no longer authorized:

- protected data is not shown;
- the app may explain that access is no longer available;
- the notification itself does not preserve access.

### 12.2 Public acquisition links

A public/shared link may route through acquisition-context continuity rather than the protected deep-link contract.

After legitimate activation, the user is returned to the appropriate permitted object/action.

### 12.3 Stale destinations

If an RFx is closed/cancelled/restricted after notification generation, the deep link resolves to the truthful current state rather than a stale workflow action.

---

## 13. Idempotency, suppression and coalescing

### 13.1 Notification idempotency key

Conceptually:

```text
sourceEventId
+ notificationType
+ recipientUserId
+ recipientOrganizationId if relevant
+ channelPurpose
```

A replayed event must not create duplicate messages for the same purpose.

### 13.2 Channel attempt idempotency

Communications separately deduplicates provider delivery according to Wave 3.1 rules.

Notification-policy deduplication and provider-delivery deduplication are related but not identical boundaries.

### 13.3 Suppression

Examples:

- a user declines an RFx → suppress routine deadline reminders for that pursuit;
- an RFx closes → suppress future open-deadline reminders;
- a team invitation is accepted → suppress pending-invitation reminders;
- a hosted response is submitted → suppress incomplete-response reminders for that submission version unless replacement remains legitimately available later;
- a later addendum changes the deadline → invalidate scheduled reminders based on the old deadline.

### 13.4 Coalescing

High-frequency noncritical changes should not produce one message per field edit.

Examples:

- five issuer requirement edits during a draft session → audit/domain history as appropriate, not five emails;
- multiple saved-search matches may be grouped into one digest;
- future multiple Q&A publications may be digestible if no immediate action is required.

### 13.5 Never coalesce distinct irreversible transactions

Do not merge:

- two different hosted submissions;
- two different team invitations;
- two different addenda requiring separate acknowledgment;
- two different evaluator assignments.

---

## 14. Digest architecture

### 14.1 Digestable event classes

Candidates:

- saved-search matches;
- potential opportunity matches;
- nonurgent watched-opportunity activity;
- future informational Q&A updates.

### 14.2 Non-digestable by default

- team invitation requiring action;
- hosted submission receipt;
- issuer receipt of a hosted submission;
- future addendum acknowledgment requirement;
- future evaluator assignment/COI requirement;
- security/authority issue.

### 14.3 Digest content

A digest is a communication projection over current authorized objects.

Before rendering/sending:

- re-check object visibility;
- exclude expired/restricted items where appropriate;
- avoid exposing objects the user no longer has permission to access;
- do not reuse stale private details from the original match event if current policy forbids them.

---

## 15. Time, deadline and reminder rules

### 15.1 Canonical time source

Reminders derive from server-authoritative RFx deadlines, not browser-local timers.

### 15.2 Time-zone display

User-facing deadline messages should show the RFx deadline with an explicit time zone/offset and may additionally show the recipient-local interpretation.

Never send ambiguous text such as `due at 5:00` without time-zone context where the RFx can cross geographies.

### 15.3 Threshold policy

Possible reminder thresholds are policy-driven rather than hard-coded into the domain event schema.

Examples might include:

- several days before deadline;
- one day before;
- a near-deadline threshold.

The exact defaults belong to convergence/product policy.

### 15.4 Rescheduling

If the canonical deadline changes later:

- scheduled events from the old deadline are invalidated;
- new reminder schedule is derived from the new canonical deadline/version;
- recipients should not receive both obsolete and current reminders.

### 15.5 Closed/cancelled state

Reminder generation stops once the RFx can no longer legitimately receive the relevant action.

---

## 16. Privacy and minimum-necessary notification content

### 16.1 Notification text is a projection

Do not copy the full source event payload into templates.

Use explicitly safe template variables.

### 16.2 Email subject/body examples

Safer:

- `A team invitation needs your review`
- `Your RFx was published`
- `Your RFxchange submission was received`
- `An opportunity you follow is approaching its deadline`

Avoid when visibility is uncertain:

- full confidential scope details;
- responder pricing;
- private credential evidence;
- exact private address;
- private Go/No-Go notes;
- protected proposal narrative.

### 16.3 Public opportunity messages

May include fields from the permitted `PublicOpportunityProjection` only.

### 16.4 Protected transaction messages

Prefer minimal summary + authenticated deep link.

### 16.5 Raw credibility evidence

Never place raw credibility/verification evidence in RFx notification templates merely because an RFx criterion references credibility.

---

# 17. Wave 4 event catalog — issuer and publication

The tables below are proposed convergence inputs, not canonical event schemas.

| Event | Owner | Trigger / meaning | Default consumers | Notification behavior | Recipient | Purpose | Deep link | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `RFxCreated` | RFx Core | Canonical RFx transaction root created | Audit; later intelligence | SILENT by default | Actor/issuer UI only | — | Issuer RFx Builder | Creation itself does not require email. |
| `RFxTypeSelected` | RFx Core | RFx type/module profile selected or changed while permitted | Builder/readiness | SILENT | — | — | Builder | May remain internal domain state rather than integration event. |
| `RFxRequirementCreated` | RFx Core | Stable requirement added | Audit; response-lineage preparation | SILENT | — | — | Builder requirement | Draft edits do not notify responders before publication. |
| `RFxRequirementChanged` | RFx Core | Existing requirement materially changed while permitted | Audit; future version seam | SILENT in Wave 4 draft | — | — | Builder requirement | After publication, change semantics belong to future addendum/version governance. |
| `SupplierCriterionChanged` | RFx Core | Supplier criterion created/changed | Audit; readiness | SILENT | — | — | Supplier criteria | Not a qualification event. |
| `EvaluationDefinitionChanged` | RFx Core | Evaluation basis created/changed | Audit; readiness; future evaluator seam | SILENT | — | — | Evaluation Definition | Wave 4 defines basis, not evaluator activity. |
| `RFxReadinessEvaluated` | RFx Core | Server evaluated publication readiness | Issuer workflow; audit | In-product result; no email by default | Requesting authorized issuer user | SILENT/P1 inline | Readiness | Failure findings belong inline; repeated validation should not spam. |
| `RFxPublicationReady` | RFx Core | RFx satisfies current publish gates | Issuer workflow | Optional in-product success state only | Authorized issuer actor | SILENT | Readiness | Does not mean published. |
| `RFxPublished` | RFx Core | Publication committed successfully | Discovery, map, matching, acquisition, audit, intelligence, notification policy | Issuer confirmation; opportunity relevance downstream | Issuer RFx owner/actor; derived matching recipients separately | P2 | Issuer overview | Primary outward Wave 4 integration hinge. |
| `RFxOpportunityProjectionPublished` | Discovery/projection owner | Search/map/public projection became available for publication/version | Discovery health; acquisition resolver | SILENT participant by default | — | — | Opportunity detail | May be eventual consumer fact rather than RFx event. |
| `RFxClosed` | RFx Core | RFx no longer accepting normal responses according to canonical lifecycle | Discovery/map, watchers, pursuits, audit | Material lifecycle update to active followers/participants | Watchers/pursuers/authorized issuer users as policy allows | P3 | Opportunity/Pursuit/Issuer overview | Must suppress future deadline reminders. |
| `RFxCancelled` | RFx Core, future if supported | RFx cancelled by authorized issuer/admin action | Discovery/map, participants, audit | High-value lifecycle change | Legitimate followers/participants | P3/HIGH | Current RFx state | Cancellation behavior may be Wave 5 depending final roadmap. |
| `RFxVisibilityChanged` | RFx Core/Geography policy seam | Permitted RFx visibility materially changed | Discovery/map/acquisition | Notify only affected legitimate participants where meaningful | Existing participants/watchers if access changes | P3 | Current RFx state | Public index must fail closed. |
| `RFxDeadlineChanged` | RFx Core future version seam | Canonical response deadline changed | Scheduler, watchers, pursuits, audit | Notify active watchers/pursuers if material | Active followers/response owners | P3/HIGH | Opportunity/Pursuit/Response | Likely tied to addendum/version rules after publication. |

---

# 18. Wave 4 event catalog — discovery, saved searches and pursuit

| Event | Owner | Meaning | Notification behavior | Recipient | Purpose | Default channel | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SavedSearchCreated` | Discovery | User/org saved a permitted search definition | SILENT confirmation | Owner | — | In-product | Creation should not email. |
| `SavedSearchChanged` | Discovery | Saved-search criteria changed | SILENT | Owner | — | In-product | Resets future matching as policy defines. |
| `SavedSearchDeleted` | Discovery | Saved search removed | SILENT | Owner | — | In-product | Stop new match alerts. |
| `SavedSearchMatched` | Discovery | A currently visible RFx satisfies saved-search criteria | Candidate notification intent | Saved-search owner/current authorized recipient | P4 | IN_APP / DIGEST_EMAIL | Never qualification. Dedup per RFx/version/search/purpose. |
| `PotentialOpportunityMatchIdentified` | Discovery/matching | Platform found sufficient profile overlap to surface RFx | Candidate relevance notification | Eligible organization/users according to policy | P4 | IN_APP / DIGEST_EMAIL | Must be explainable; not endorsement/eligibility. |
| `OpportunityWatchCreated` | Discovery/Pursuit | Recipient elected to follow opportunity | SILENT confirmation | Owner | — | In-product | Watch is relationship state, not RFx state. |
| `OpportunityWatchRemoved` | Discovery/Pursuit | Recipient stopped following | SILENT | Owner | — | In-product | Suppress routine watch reminders. |
| `RFxDeadlineApproaching` | Scheduler/derived event owner | Canonical deadline crossed configured reminder threshold | Reminder notification | Eligible watchers/pursuers/response owners | P5 | IN_APP / EMAIL as policy | Must identify threshold/version and suppress if stale. |
| `RFxDeadlinePassed` | Scheduler/RFx lifecycle seam | Canonical deadline passed | Lifecycle/display update; email only if useful | Active pursuit/response participants | P3 | IN_APP | Does not itself prove RFx lifecycle transition unless lifecycle model says so. |
| `PursuitAssessmentCreated` | RFx responder domain | Private Go/No-Go workspace established | SILENT | Responder org only | — | In-product | Never issuer-visible. |
| `PursuitDecisionRecorded` | RFx responder domain | Pursue/Watch/Decline decision committed | Usually SILENT; may alter reminder/search policy | Decision owner/org | — | In-product | Private decision unless product explicitly exposes a later interest signal. |
| `PursuitChangedToPursue` | RFx responder domain/derived | Pursuit became active | Optional inline cue to create/open response | Responder | — | In-product | No issuer notification merely because a company is considering a bid. |
| `PursuitChangedToDecline` | RFx responder domain/derived | Organization declined | SILENT; suppress routine reminders | Responder | — | In-product | Decline reason/private notes remain protected. |
| `RFxGapIdentified` | RFx responder domain | Missing/unconfirmed capability/criterion context identified | SILENT; drives contextual actions | Responder | — | Pursuit/Response | Never publicize a private organization gap. |

---

# 19. Wave 4 event catalog — teaming

| Event | Owner | Meaning | Notification behavior | Recipient | Purpose | Priority | Deep link | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `PartnerSearchRequested` | RFx/Discovery orchestration | Responder launched partner discovery from RFx gap | SILENT | Actor | — | SILENT | Spatial partner discovery | A command may be more appropriate than event for service invocation. |
| `TeamInvitationCreated` | Teaming | Authorized inviter created RFx-scoped invitation | Proactive action-required notification | Addressed invitee/current authorized recipient | P1 | HIGH | Team invitation | Minimum necessary RFx context. Token/link does not grant membership. |
| `TeamInvitationDeliveryRequested` | Teaming→Communications command | Communications requested for invitation | Not participant domain fact | Invitee | P1 | HIGH | Team invitation/acquisition route | Delivery status remains Communications-owned. |
| `TeamInvitationViewed` | Teaming presentation, optional | Authorized invitee opened invitation | SILENT by default | — | — | SILENT | Team invitation | Viewing does not mean acceptance and may not need durable integration event. |
| `TeamInvitationAccepted` | Teaming | Invitee organization accepted platform RFx participation context | Notify inviter/team lead and relevant team members as policy | Inviter/team lead | P6 | NORMAL/HIGH | Team participation | Does not create legal JV/subcontract. Does not automatically grant response edit permission. |
| `TeamInvitationDeclined` | Teaming | Invitee declined | Notify inviter/team lead | Inviter/team lead | P6 | NORMAL | Team participation | Do not disclose unrelated invitee data. |
| `TeamInvitationExpired` | Teaming/scheduler | Pending invitation expired | Notify inviter and optionally invitee | Relationship parties | P3 | NORMAL | Team invitation | Expiry policy requires convergence. |
| `TeamInvitationRevoked` | Teaming | Authorized inviter revoked pending invitation | Notify invitee if previously delivered/meaningful | Invitee | P3 | NORMAL | Current invitation state | Revocation must not erase history. |
| `TeamBoundaryAcknowledged` | Teaming | Required nonbinding legal boundary shown/acknowledged where governed | Audit, no proactive notification | Relationship actor | — | SILENT | Team invitation | `TEM-004` evidence, not a marketing message. |
| `TeamParticipationEnded` | Teaming future seam | Accepted participation ended | Notify affected team parties if material | Team parties | P3 | HIGH/NORMAL | Team context | Final lifecycle may be later scope. |

---

# 20. Wave 4 event catalog — external team acquisition

| Event | Owner | Meaning | Notification behavior | Notes |
| --- | --- | --- | --- | --- |
| `ExternalTeamInvitePrepared` | Teaming/Acquisition | Legitimate invitation requires external recipient acquisition route | Send versioned transactional invitation | Requires `ACQ-003` context continuity and Wave 3 Communications reliability. |
| `AcquisitionContextIssued` | Acquisition | Tamper-resistant bounded acquisition context created | No separate participant notification | Context never grants team acceptance or org authority. |
| `ExternalInviteCommunicationRequested` | Acquisition/Teaming→Communications | Invitation email intent created | EMAIL transactional | Contains safe public/minimum invitation context and activation route. |
| `AcquisitionContextRecovered` | Acquisition | Legitimate user/session recovered context after auth/onboarding | SILENT navigation fact | Server re-authorizes current invitation/object. |
| `ExternalInviteActivationCompleted` | Acquisition/Activation seam | New participant legitimately completed required gates and may resume context | In-product resume action; optional transactional confirmation only if useful | Does not itself accept invitation. |
| `AcquisitionContextExpired` | Acquisition | Context can no longer be resumed | Truthful current-state message | Expiry/replay policy requires convergence. |

---

# 21. Wave 4 event catalog — provider/resource/referral assistance

Most underlying facts are owned by Wave 3 Resource/Referral domains rather than RFx Core.

| Event | Owner | Meaning in RFx journey | Notification behavior | Recipient | Notes |
| --- | --- | --- | --- | --- | --- |
| `RFxAssistanceNeedIdentified` | RFx responder domain | Gap can be routed to resource discovery | SILENT contextual action | Responder | Private need context. |
| `ProviderSearchRequested` | RFx→Resource orchestration | Responder asks Resource domain for relevant official providers | SILENT | Actor | Command may be better transport than event. |
| `ProviderReferralCreated` | Referral/Resource | Consented provider connection was created | Notify provider/recipient according to Wave 3 referral policy | Provider relationship recipient | RFx association is context, referral owns lifecycle. |
| `ProviderReferralAccepted` | Referral/Resource | Provider accepted request | Notify requesting responder/org | Requester | Does not mark RFx requirement satisfied automatically. |
| `ProviderReferralDeclined` | Referral/Resource | Provider declined | Notify requester | Requester | Keep reason minimum-necessary. |
| `ProviderReferralRedirected` | Referral/Resource | Provider redirected to another appropriate resource | Notify requester with permitted next-step context | Requester | Routing remains Resource-domain authority. |
| `ProviderRequestCommunicationAdded` | Resource Communications | Request-scoped communication exists | Notify other request party as policy | Authorized request party | Not open messaging. |
| `RFxReferralAssociated` | RFx/Referral association | Existing referral is linked to RFx context | Usually SILENT | Relationship parties in UI | Does not duplicate referral state. |

---

# 22. Wave 4 event catalog — response construction and readiness

| Event | Owner | Meaning | Default notification | Recipient | Notes |
| --- | --- | --- | --- | --- | --- |
| `ResponseCreated` | RFx Response | Organization-owned response workspace created against RFx/version | SILENT | Responder | Issuer must not be notified simply because response work started. |
| `ResponseRequirementItemChanged` | RFx Response | Response content/completion changed | SILENT | Authorized responders | High-frequency draft activity; audit/history policy separate. |
| `ResponseAttachmentChanged` | RFx Response | Response attachment added/removed/replaced | SILENT | Authorized responders | Private until legitimate submission. |
| `ResponseReadinessEvaluated` | RFx Response | Continuous completeness validation evaluated current response | IN_APP only as needed | Responder | No email on every validation run. |
| `ResponseReadinessBlocked` | RFx Response/derived | One or more blocking findings exist | Inline action-required UX; optional reminder only near deadline if approved | Response owner | Must deep-link to exact blocker. |
| `ResponseReadyForFinalReview` | RFx Response | Current response satisfies final-review entry conditions | In-product success; email not required by default | Response owner | Readiness can change if canonical RFx changes later. |
| `FinalSubmissionValidationFailed` | RFx Response | Server action-time validation blocked submit/handoff | Immediate UI feedback; no routine email | Submitting actor | Failure is not a domain submission fact. Audit validation attempt if needed. |
| `FinalSubmissionValidationPassed` | RFx Response | Current response is valid for the requested submit/handoff action | SILENT/inline | Submitting actor | Does not mean submission occurred. |

---

# 23. Wave 4 event catalog — hosted submission

| Event | Owner | Meaning | Notification behavior | Recipient | Purpose | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SubmissionReceived` | RFx Submission | RFxchange authoritatively accepted and timestamped immutable hosted submission | Confirmation to responder; new-submission alert to issuer | Submitter/response owner; authorized issuer receiving users | P2 / P3 | HIGH | Only hosted mode. Idempotent acceptance. |
| `SubmissionReceiptIssued` | RFx Submission | Immutable receipt/evidence created | Confirmation/deep link | Responder | P2 | HIGH | Receipt should reference submission/version/timestamp, not expose issuer-private data. |
| `HostedSubmissionAvailableToIssuer` | RFx Submission | Lifecycle permits issuer access to submitted response | Notify issuer if this is the canonical access moment | Authorized issuer users | P3 | HIGH/NORMAL | If responses remain sealed until close, this may occur later than `SubmissionReceived`. Requires convergence. |
| `SubmissionDuplicateRequestIgnored` | RFx Submission | Replayed idempotent request resolved to existing accepted submission | SILENT; return same receipt | Submitter | — | SILENT | Operational/audit fact if needed. |
| `SubmissionRejectedAtActionTime` | RFx Submission | Submit command denied due to deadline/version/authority/readiness | UI error; no confirmation email | Actor | — | HIGH inline | Must not generate `SubmissionReceived`. |

### 23.1 Issuer notification timing is a convergence issue

If Wave 4 permits issuer visibility immediately on receipt, issuer notification may be derived directly from `SubmissionReceived`.

If responses are sealed until close/release, notification must avoid leaking responder identity/content before the legitimate release event.

The event catalog therefore separates `SubmissionReceived` from `HostedSubmissionAvailableToIssuer`.

---

# 24. Wave 4 event catalog — external submission handoff

| Event | Owner | Meaning | Notification behavior | Recipient | Notes |
| --- | --- | --- | --- | --- | --- |
| `ExternalSubmissionPackagePrepared` | RFx Response | Response artifacts assembled for external system | SILENT/in-product | Responder | Does not mean handoff or submission. |
| `ExternalSubmissionHandoffRecorded` | RFx Response | User launched/exported the prepared handoff according to configured destination | Consequential confirmation | Responder | Must say handoff/ready/exported, never received/submitted by external authority. |
| `ExternalDestinationOpened` | UI telemetry, optional | External link opened | SILENT; not a domain submission event | — | Should not be used as evidence of submission. |
| `ExternalSubmissionStatusReported` | Future governed feature | User/external integration later reports status | Future seam only | Relevant parties | Requires provenance; not Wave 4 core evidence by default. |

---

# 25. Communications delivery lifecycle

Wave 3.1 owns the reliable delivery substrate.

RFx notification processing should request a communication through that substrate and consume delivery state only for observability/user support.

Conceptual Communications facts:

| Event | Owner | Meaning | Participant impact |
| --- | --- | --- | --- |
| `CommunicationIntentAccepted` | Communications | Valid intent/template/recipient accepted for processing | None by itself. |
| `CommunicationRendered` | Communications | Versioned template rendered safely | None by itself. |
| `CommunicationDeliveryAttempted` | Communications | Provider attempt made | Usually operational. |
| `CommunicationProviderAccepted` | Communications | Provider accepted message for delivery processing | Not proof recipient read it. |
| `CommunicationDelivered` | Communications/provider semantics | Delivery reached provider-defined delivered state where available | May appear in admin/support status; does not alter RFx lifecycle. |
| `CommunicationTransientFailure` | Communications | Retryable delivery problem | Retry; possible operations visibility. |
| `CommunicationRetryScheduled` | Communications | Retry planned | Operations only. |
| `CommunicationTerminalFailure` | Communications | Delivery failed beyond policy | Operations/admin alert; participant workflow still exists. |
| `CommunicationSuppressed` | Communications/policy | Intent intentionally not delivered because policy/preferences/dedup applied | Auditable reason where appropriate. |

### 25.1 No `EmailSent = ActionCompleted`

Forbidden interpretations include:

- invitation email delivered → invitation accepted;
- deadline reminder sent → recipient aware;
- submission receipt email delivered → submission only now becomes valid;
- evaluator notification sent → evaluator assigned.

The owning domain fact always controls.

---

# 26. User-facing Wave 4 notification catalog

This catalog describes candidate product messages, not final copy/templates.

| Notification type | Source event | Recipient | Purpose | Channel default | Digest? | Deep link | Safe message concept |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `issuer.rfx.published` | `RFxPublished` | Authorized issuer actor/owner | P2 | IN_APP + EMAIL candidate | No | Issuer overview | Your RFx is published. |
| `discovery.savedSearch.match` | `SavedSearchMatched` | Saved-search owner | P4 | IN_APP + DIGEST_EMAIL | Yes | Opportunity detail | A new opportunity matches your saved search. |
| `discovery.potentialMatch` | `PotentialOpportunityMatchIdentified` | Eligible participant | P4 | IN_APP / DIGEST_EMAIL | Yes | Opportunity detail | An opportunity may match your organization. |
| `opportunity.deadline.approaching` | `RFxDeadlineApproaching` | Watcher/pursuer/response owner | P5 | IN_APP + EMAIL by policy | Limited | Pursuit/Response | An opportunity you follow is approaching its deadline. |
| `opportunity.closed` | `RFxClosed` | Legitimate follower/participant | P3 | IN_APP; EMAIL if material | No | Current RFx state | This opportunity is now closed. |
| `team.invitation.received` | `TeamInvitationCreated` | Invitee | P1 | IN_APP + EMAIL | No | Team invitation | You have a team invitation to review. |
| `team.invitation.accepted` | `TeamInvitationAccepted` | Inviter/team lead | P6 | IN_APP + EMAIL candidate | No | Team participation | An organization accepted your team invitation. |
| `team.invitation.declined` | `TeamInvitationDeclined` | Inviter/team lead | P6 | IN_APP + EMAIL candidate | No | Team participation | An organization declined your team invitation. |
| `team.invitation.expired` | `TeamInvitationExpired` | Inviter; optional invitee | P3 | IN_APP / EMAIL | No | Invitation state | A pending team invitation expired. |
| `provider.request.created` | `ProviderReferralCreated` | Provider | P1/P6 | Wave 3 referral policy | No | Provider request | A business requested assistance. |
| `provider.request.accepted` | `ProviderReferralAccepted` | Requester | P6 | IN_APP + transactional email as Wave 3 policy | No | Provider request | A provider accepted your assistance request. |
| `provider.request.declined` | `ProviderReferralDeclined` | Requester | P6 | IN_APP | No | Provider request | A provider declined your assistance request. |
| `provider.request.redirected` | `ProviderReferralRedirected` | Requester | P6 | IN_APP + EMAIL candidate | No | Provider request | Your request was redirected to another resource. |
| `response.readiness.blocked` | `ResponseReadinessBlocked` | Response owner | P1 inline | IN_APP only by default | No | Exact blocker | Your response still has required items to address. |
| `response.ready.finalReview` | `ResponseReadyForFinalReview` | Response owner | P2 inline | IN_APP | No | Final review | Your response is ready for final review. |
| `submission.hosted.received` | `SubmissionReceived` | Submitter/response owner | P2 | IN_APP + EMAIL | No | Receipt | RFxchange received your submission. |
| `submission.hosted.newForIssuer` | `HostedSubmissionAvailableToIssuer` | Authorized issuer receiver | P3 | IN_APP + EMAIL candidate | No | Issuer responses | A submission is available for this RFx. |
| `submission.external.handoff` | `ExternalSubmissionHandoffRecorded` | Responder | P2 | IN_APP + EMAIL candidate | No | Handoff history | Your response package was prepared/handed off for external submission. |
| `acquisition.team.invite` | `ExternalInviteCommunicationRequested` | External invitee | P1 | EMAIL | No | Acquisition/team invitation | You were invited to review a team opportunity on RFxchange. |

### 26.1 Copy discipline

Use exact state language.

Good:

- `RFxchange received your submission at 4:32 PM ET.`
- `Your package is ready for external submission.`

Bad:

- `Your proposal was submitted successfully` when the authority is external;
- `You are qualified for this opportunity` based only on a potential match;
- `This trusted company invited you` when credibility does not establish that claim.

---

# 27. Internal operations/admin alert catalog

| Alert | Source | Recipient | Purpose |
| --- | --- | --- | --- |
| `ops.communication.terminalFailure` | `CommunicationTerminalFailure` | Authorized comms/platform ops | Investigate important undelivered transactional communication. |
| `ops.opportunityProjection.failed` | Repeated projection/index failure after `RFxPublished` | Authorized platform ops | Restore search/map/public projection without rewriting RFx publication truth. |
| `ops.scheduler.failed` | Reminder scheduler unable to process canonical deadlines | Platform ops | Restore reminders; do not change RFx deadlines. |
| `ops.notificationPolicy.failed` | Recipient/template policy failure | Platform ops | Diagnose policy mapping; domain event remains valid. |
| `ops.submissionReceipt.failed` | Submission committed but receipt artifact generation failed | Platform ops + responder support path | Recover receipt artifact without duplicating submission. |
| `ops.acquisitionContext.invalidReplay` | Repeated invalid/replay attempt | Security/admin per governed policy | Investigate abuse without granting access. |

Operational alerts must use scoped admin permissions and avoid exposing protected participant payload to broad operations audiences.

---

# 28. Future Wave 5 event seams — Q&A and addenda

These are reserved integration concepts only. They do not authorize Wave 5 implementation.

| Future event | Meaning | Candidate notification |
| --- | --- | --- |
| `RFxQuestionSubmitted` | Authorized responder submitted question | Issuer/Q&A manager action required. |
| `RFxQuestionWithdrawn` | Responder withdrew question if permitted | Update Q&A workflow; usually no broad email. |
| `RFxQuestionAnswered` | Issuer answered | Notify questioner; broader audience depends answer visibility. |
| `RFxQuestionPublished` | Q&A answer became visible to applicable respondents | P3/P6 update; digestable if informational. |
| `RFxAddendumIssued` | Controlled post-publication change committed | High-value lifecycle notification to affected participants. |
| `RFxAddendumAcknowledgmentRequired` | Response must acknowledge addendum | P1 action-required. |
| `RFxAddendumAcknowledged` | Authorized responder acknowledged | Confirmation; readiness recalculates. |
| `RFxVersionSuperseded` | New RFx version replaced prior respondable version | Update response/readiness/search projections. |

### 28.1 Addendum reminders

An addendum notification cannot simply say `RFx changed`.

It should carry:

- RFx identity;
- addendum/version identity;
- whether acknowledgment is required;
- whether deadline changed;
- authenticated deep link to Change Review.

Email should not embed confidential diff content when access/visibility is protected.

---

# 29. Future Wave 5 event seams — evaluation and clarification

| Future event | Meaning | Candidate notification |
| --- | --- | --- |
| `EvaluatorAssigned` | Authorized evaluator assigned to RFx | P1 assignment notification. |
| `EvaluatorAssignmentRemoved` | Assignment revoked | Lifecycle update. |
| `EvaluatorCOIDisclosureRequired` | Evaluator must complete conflict disclosure | P1 HIGH. |
| `EvaluatorCOIDisclosureCompleted` | Disclosure completed | Confirmation/workflow progression. |
| `SubmissionsReleasedForEvaluation` | Legitimate evaluation access moment reached | Notify assigned evaluators. |
| `EvaluationDeadlineApproaching` | Scheduled evaluator deadline threshold crossed | P5 reminder. |
| `IndividualEvaluationSubmitted` | Evaluator finalized individual assessment | Confirmation to evaluator; workflow status to chair as policy. |
| `ConsensusRequested` | Evaluation chair opened consensus step | P1 to assigned participants. |
| `ConsensusCompleted` | Consensus record finalized | Lifecycle update. |
| `ClarificationRequested` | Issuer/evaluator sent governed clarification | P1 to responder. |
| `ClarificationResponseSubmitted` | Responder answered | Notify authorized issuer/evaluator. |

Evaluation notifications must never expose competing submissions to unauthorized responders or evaluators outside their assignment.

---

# 30. Future selection/award/connect and outcome seams

| Future event | Meaning | Candidate notification |
| --- | --- | --- |
| `SelectionRecorded` | Authorized issuer recorded selection/recommendation according to canonical workflow | Notify internal approval path first if applicable. |
| `SelectionApproved` | Required approval completed | Eligible external communications may proceed. |
| `ResponderSelected` | Responding organization selected/connected according to RFx type | P3/P2 external notification. |
| `ResponderNotSelected` | Organization not selected | P3 external notification where governed. |
| `RFxOutcomeRequested` | Parties asked to report downstream outcome | P1/P5 later engagement. |
| `RFxOutcomeRecorded` | Party submitted outcome information | Confirmation; intelligence seam. |
| `RFxOutcomeVerified` | Governed evidence verified outcome | Credibility/intelligence consumer seam. |

Not every RFx type has a winner or award. Notification language must be type-aware.

---

# 31. Notification lifecycle state

If a durable participant notification representation is later implemented, its presentation lifecycle should stay separate from RFx lifecycle.

Possible notification states:

```text
CREATED
→ DELIVERABLE
→ PRESENTED
→ READ
→ DISMISSED
```

with channel-specific delivery state owned separately by Communications.

Do **not** use notification read state as evidence of:

- legal acknowledgment;
- invitation acceptance;
- addendum acceptance;
- evaluator COI completion;
- response submission.

Those require explicit domain actions/events.

---

# 32. Template architecture

Wave 3.1 establishes versioned templates/event mappings.

RFx templates should therefore be addressed conceptually as:

```text
notificationType
→ templateKey
→ templateVersion
→ safe variable schema
```

Example families:

```text
rfx.issuer.published
rfx.discovery.saved-search-match
rfx.opportunity.deadline-reminder
rfx.team.invitation
rfx.team.accepted
rfx.submission.received-responder
rfx.submission.available-issuer
rfx.external-handoff.confirmation
```

Future:

```text
rfx.qa.answer-published
rfx.addendum.issued
rfx.evaluation.assignment
rfx.evaluation.clarification-request
rfx.selection.selected
rfx.selection.not-selected
```

### 32.1 Version discipline

A sent communication retains the template/version reference used at delivery time.

Changing future copy does not rewrite historical delivery evidence.

### 32.2 Variable schema

Each template declares a bounded set of safe variables.

Example:

```ts
interface TeamInvitationTemplateData {
  recipientDisplayName?: string;
  inviterOrganizationName: string;
  opportunityPublicTitle: string;
  proposedRoleLabel?: string;
  expiresAt?: string;
  actionLink: string;
}
```

Do not pass the entire RFx object into the renderer.

---

# 33. Notification preferences and product policy seam

The final preference model is not defined here.

Convergence should separate at least:

- required transactional/action communications;
- relationship/lifecycle updates;
- reminders;
- discovery/relevance alerts;
- digest frequency;
- future marketing/promotional communications.

Commercial tier may change configured capacity/frequency for approved features, but cannot suppress a legally/product-required transaction confirmation merely to create an upsell.

Conversely, paid status must not enable unsolicited high-volume messaging.

---

# 34. Feature-ID → event/notification crosswalk

All 41 current Wave 4 Feature IDs are represented below.

| Feature | Primary event/notification implication |
| --- | --- |
| `ISS-001` | Establishes RFx event subject identity and correlation root; `RFxCreated`. |
| `ISS-002` | RFx type affects event semantics, submission authority mode and type-aware notification copy. |
| `ISS-003` | `RFxCreated` with creation-source provenance; no default email. |
| `ISS-005` | Builder/module edits remain SILENT except audit/readiness; avoid field-edit notification spam. |
| `ISS-006` | Stable requirement events/audit lineage; later addendum/version changes need material-change events. |
| `ISS-007` | Supplier-criterion changes feed matching/gap derivation but are not qualification notifications. |
| `ISS-009` | Evaluation-definition changes are SILENT Wave 4; future evaluator events consume published basis. |
| `ISS-011` | Package composition changes are authoring/audit facts, not participant notifications before publish. |
| `ISS-016` | `RFxReadinessEvaluated` / `RFxPublicationReady`; inline findings, no routine email. |
| `ISS-018` | Preview is presentation state; no notification. |
| `ISS-019` | `RFxPublished` primary outward event; issuer confirmation + discovery/match/projection downstream. |
| `ISS-020` | Capability-policy decisions may affect alert/watch limits, but payment status never changes event truth/qualification. |
| `ACQ-009` | Share-link/acquisition context may create auditable link issuance but not unsolicited notification by default. |
| `DSC-004` | Search is read/query behavior; no event for ordinary search. |
| `DSC-005` | `SavedSearchCreated/Changed/Deleted`; SILENT confirmation. |
| `DSC-006` | `SavedSearchMatched` → preference-aware/digestable opportunity alert. |
| `DSC-007` | `OpportunityWatchCreated/Removed`; governs later lifecycle/reminder recipient eligibility. |
| `DSC-008` | `RFxDeadlineApproaching` scheduled events and reminder suppression/rescheduling. |
| `RSP-001` | Discovery-source attribution is display/context, not notification proof of qualification. |
| `RSP-002` | Match explanation is in-product projection; potential match alert may deep-link here. |
| `RSP-003` | Private pursuit assessment; no issuer notification. |
| `RSP-004` | `PursuitDecisionRecorded`; Watch/Pursue/Decline alter reminders/workspace, not RFx lifecycle. |
| `DSC-010` | Partner search query behavior; no default notification until invitation is created. |
| `RSP-006` | `RFxGapIdentified` private derived fact; no exposure outside responder context. |
| `RSP-007` | Partner-search transition; `TeamInvitationCreated` becomes first proactive team notification. |
| `RSP-008` | Resource discovery transition; provider/referral domain owns resulting notifications. |
| `RSP-009` | `ResponseCreated`; SILENT and never issuer-visible merely because work started. |
| `RSP-010` | Requirement completion changes remain in-product/SILENT. |
| `RSP-017` | `ResponseReadinessEvaluated/Blocked`; inline attention, optional governed reminders only. |
| `RSP-018` | Final validation pass/fail; UI result, not submission confirmation. |
| `RSP-019` | Final review presentation; no notification itself. |
| `RSP-020` | `SubmissionReceived`, `SubmissionReceiptIssued`, later issuer-availability event; high-value confirmations. |
| `RSP-021` | `ExternalSubmissionHandoffRecorded`; confirmation carefully avoids external-submission claim. |
| `TEM-001` | Team search itself SILENT. |
| `TEM-002` | `TeamInvitationCreated` → invitee action-required communication. |
| `TEM-003` | `TeamInvitationAccepted/Declined` → relationship notifications to inviter/team lead. |
| `TEM-004` | Nonbinding boundary acknowledgment/audit; no proactive notification required. |
| `ACQ-007` | External team invite communication + preserved acquisition context + resume; activation never implies acceptance. |
| `EDU-011` | First issuer education is contextual UI, not a notification campaign. |
| `EDU-012` | First responder education is contextual UI, not a notification campaign. |
| `EDU-013` | First teaming education is contextual UI; complements but does not replace `TEM-004`. |

Coverage check: **41/41 Wave 4 Feature IDs represented once in this crosswalk.**

---

# 35. Acceptance matrix for event/notification architecture

| Scenario | Required behavior |
| --- | --- |
| RFx publishes successfully but email provider is down | RFx remains published; communication retries/fails visibly according to policy. |
| Same `RFxPublished` event is replayed | Search/projection/notification consumers dedupe; no duplicate issuer confirmation for same purpose. |
| User loses issuer authority after event generation | Deep link re-checks access and denies protected content if no longer authorized. |
| Public RFx becomes restricted before digest send | Digest renderer re-checks visibility and omits/protects the item. |
| Saved search finds same RFx through two index paths | One notification per defined recipient/search/RFx-version purpose, not duplicates. |
| Potential match exists | Copy says potential relevance, never qualified/endorsed. |
| Responder creates draft response | Issuer receives no notification and cannot infer draft existence. |
| Responder changes Go/No-Go private notes | No issuer/team/provider notification. |
| Team invitation created twice by retry | Idempotency prevents duplicate invitation and duplicate notification for same command key. |
| Team invitation accepted | Inviter sees accepted state even if email delivery fails; email is not source of truth. |
| External invite recipient registers | Preserved context resumes after legitimate activation; registration alone does not accept invitation. |
| Provider request is declined | Requester receives permitted lifecycle update; RFx requirement is not automatically failed. |
| Hosted submit request repeats | Same accepted submission/receipt returned; no second submission/new-submission notification. |
| Hosted submission committed but receipt email fails | Submission remains valid; receipt remains accessible in product; Communications retries email. |
| External portal link opened | RFxchange records at most handoff/open telemetry; UI must not say external system received submission. |
| RFx deadline changes | Old scheduled reminders invalidated; new schedule derives from canonical deadline/version. |
| User declines pursuit | Routine opportunity deadline reminders for that pursuit are suppressed. |
| RFx closes | Future open-deadline reminders suppressed; current state shown truthfully from deep links. |
| Notification marked read | No RFx/team/submission/legal state changes. |
| Future addendum email is read | Does not count as addendum acknowledgment. |
| Future evaluator assignment email fails | Evaluator assignment remains valid; operations can see delivery failure. |
| Raw credential evidence exists | Notification templates use approved status/projection, not private evidence document. |
| Paid plan changes | Notification capacity/policy may change where approved; transaction truth/qualification does not. |

---

# 36. Observability and support requirements

Authorized operations/support should be able to correlate:

```text
Domain event
→ notification policy decision
→ notification intent
→ template/version
→ recipient resolution result
→ channel attempt(s)
→ provider result
→ retry/terminal failure
```

using correlation/event IDs without exposing unnecessary protected transaction content.

Useful support questions include:

- Was the underlying event committed?
- Was this person legitimately in the recipient set at evaluation time?
- Was the notification suppressed by policy/preferences/dedup?
- Which template/version rendered?
- Was a channel attempted?
- Did the provider accept or reject it?
- Did retries exhaust?
- Is the deep-link target still accessible/current?

Support tooling must never equate provider acceptance with user reading/action completion unless an independently governed fact exists.

---

# 37. High-value convergence findings

### 37.1 Publication and notification must remain decoupled

`RFxPublished` should be durable before Communications delivery. Whether opportunity indexing/map projection is synchronous or asynchronous is still an Extra High convergence question, but email delivery should not be a publication transaction prerequisite.

### 37.2 Issuer submission notification timing depends on sealing policy

`SubmissionReceived` and `HostedSubmissionAvailableToIssuer` must remain distinct until the response-sealing/release model is settled.

### 37.3 Watch, Pursue and saved-search subscriptions need one recipient-policy model

Deadline/relevance alerts should not independently reinvent follower state. Convergence should normalize the organization/user relationship that qualifies a recipient for each alert type.

### 37.4 Draft response secrecy is a hard boundary

Response creation/readiness events are private responder facts until canonical submission/release. No notification architecture should leak bidder interest to the issuer merely because a response exists.

### 37.5 Team invitation delivery must reuse acquisition + communications

`TEM-002` creates the invitation fact; `ACQ-007` handles external continuity; Wave 3 Communications handles versioned/idempotent delivery. Do not build a separate invitation-email stack.

### 37.6 Reminder scheduling should use canonical time/version identity

Deadline reminders must be invalidatable and reproducible when deadlines/addenda change. Browser timers and ad hoc cron rows tied only to `rfxId` are insufficient.

### 37.7 Notification read state is not acknowledgment

This must be explicit before Wave 5 addenda/evaluation because otherwise read receipts can accidentally become legal/workflow state.

### 37.8 External submission copy is a trust-critical surface

Every notification and confirmation for `RSP-021` must distinguish prepared/handoff/opened from externally submitted/received/accepted.

### 37.9 Discovery alerts must preserve semantic humility

Potential match, saved-search match and recommendation language cannot become `qualified`, `eligible`, `best`, or `recommended winner` absent legitimate criteria and authority.

### 37.10 Communications failures require operations visibility

Wave 3.1 already establishes terminal-failure observability. RFx Core should supply correlation/purpose metadata so support can identify which business action was affected without leaking full message bodies.

### 37.11 Notification policy should not be encoded in domain state machines

The RFx domain may expose facts and relevant state. Channel/frequency/preference/digest behavior belongs to communications/notification policy so product communication can evolve without rewriting RFx lifecycle semantics.

### 37.12 Future outcome/credibility notifications require provenance

An RFx event may later feed credibility/intelligence, but no notification should say an organization became Trusted/Experienced solely because a response/submission occurred unless the Credibility domain emits that governed fact.

---

# 38. Questions reserved for Extra High convergence

1. What exact event transport/outbox pattern becomes canonical for RFx facts?
2. Which RFx events are internal-only versus published cross-domain integration events?
3. Is `RFxPublicationReady` a durable domain event or merely a readiness result/projection?
4. Which publication side effects are synchronous prerequisites versus eventual consumers?
5. Who owns persistent Watch/Pursue/Decline state: Discovery, RFx responder domain, or a shared participation relationship?
6. Is a saved search user-owned, organization-owned, or both?
7. Which users within an issuer organization receive RFx lifecycle notifications by default?
8. Does Wave 4 designate one RFx Owner role/user for notification routing?
9. Which responder users receive deadline reminders: response owner, all collaborators, submitter-capable users, or preference-selected recipients?
10. What is the canonical deadline time zone and display rule?
11. What default reminder thresholds exist, if any?
12. Are opportunity-match emails immediate, digest-only, or user-configurable?
13. Does Wave 4 include a persistent in-product notification center, or only transactional email + contextual UI until another feature authorizes it?
14. What notification preference categories are legally/product-required versus optional?
15. How long are notification items retained?
16. What data may be retained in a notification projection after underlying access is revoked?
17. Is issuer identity shown in all opportunity-match email subjects/bodies, or only after visibility re-check?
18. How are anonymous/public acquisition notifications handled without creating open-ended marketing email behavior?
19. What exact idempotency key governs team invitation creation and its first delivery?
20. Can team invitations expire, and what is the expiry model?
21. Does acceptance notify all team participants or only the inviter/team lead?
22. When does an issuer first learn that a hosted response exists?
23. Are hosted responses sealed until deadline/explicit release?
24. Does `SubmissionReceived` notify issuer immediately if content remains sealed?
25. Can a responder replace/withdraw a hosted submission in Wave 4 or only later?
26. If replacement is allowed later, which reminders/receipts become active/superseded?
27. What external-submission handoff evidence may be retained without implying receipt?
28. May users self-report external submission status in Wave 4, or is that future scope?
29. What retry threshold constitutes a participant-significant communication terminal failure?
30. Should the product surface transactional-email failure to the participant when the underlying action is still valid?
31. Which terminal failures create admin cases versus operational alerts only?
32. How are notification events versioned when template semantics change?
33. What is the canonical safe-variable registry/classification mechanism for templates?
34. What constitutes a material RFx change requiring later addendum notification?
35. Can future Q&A answers be digestable when an RFx deadline is near?
36. What future evaluator events are confidential from issuer non-evaluator users?
37. Which selection/award outcome messages are type-dependent (RFI vs RFP vs supplier request)?
38. When later outcomes feed credibility, which system emits participant-facing badge/status notification?
39. What notification analytics are permitted without turning communication engagement into qualification/credibility?
40. How does organization deletion/suspension affect pending notification intents and deep links?

---

# 39. Non-scope

This planning lane does not implement or authorize:

- an in-product notification center;
- push notifications;
- SMS;
- marketing/newsletter campaigns;
- preference-center implementation;
- Wave 4 production events;
- Q&A/addenda;
- evaluator assignment/scoring/consensus;
- selection/award;
- outcome verification;
- credibility badge calculation;
- billing/entitlement implementation;
- a second email provider;
- direct feature-specific Microsoft Graph calls;
- tracker status changes;
- dependency-map corrections;
- final RFx state machines or permissions.

---

# 40. Convergence exit criteria for lane D

Before the eventual RFx Core architecture is considered converged, it should be possible to answer:

1. Which durable business facts exist across the RFx transaction?
2. Which domain owns each fact?
3. Which facts are exposed across domain boundaries?
4. Which events can generate participant attention?
5. How are recipients resolved and re-authorized?
6. Which notification purposes/channels apply?
7. Which messages may be digested/suppressed?
8. How are deadline reminders invalidated/rescheduled?
9. What minimum data may leave protected RFx surfaces in communications?
10. How are event, notification and delivery attempts correlated/idempotent?
11. Which failures affect only communications versus transaction truth?
12. Which future Wave 5 events already have clean seams without being implemented in Wave 4?

The target architecture is:

> **One RFx fact model, one auditable event vocabulary, one bounded notification policy layer, one reliable Communications delivery substrate, and zero feature-specific shortcuts that confuse messages with transaction state.**
