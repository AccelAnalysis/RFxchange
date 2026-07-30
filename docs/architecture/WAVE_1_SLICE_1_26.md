# Wave 1 Slice 1.26 — Policy & Configuration Center Foundation and Additive Audit Corrections

Feature IDs: `ADM-083`, `ADM-086`

## Purpose

Move policy values that would otherwise become scattered constants behind one governed administrative configuration boundary, while preserving the rule that administrative history is immutable. This slice creates the current-value configuration foundation and the additive correction mechanism. It does not prematurely implement the complete immutable versioned configuration history reserved for `ADM-084`.

## ADM-083 — Policy & Configuration Center foundation

The Policy & Configuration Center exposes fifteen governed policy families:

1. verification evidence types;
2. credibility thresholds;
3. credibility badge expiration/review windows;
4. Founding capacity;
5. plan limits;
6. referral fee rules;
7. referral payout thresholds;
8. resource-provider categories;
9. RFx types;
10. capability taxonomy configuration;
11. notification defaults;
12. geography release states;
13. account inactivity windows;
14. administrative case SLAs;
15. support categories.

The domain catalog defines stable configuration keys. Application code can resolve those values without embedding the policy itself in feature logic, so authorized policy changes do not require a code deployment.

### Current state contract

Each governed configuration record carries:

- stable configuration key;
- JSON-compatible value;
- positive optimistic revision;
- policy version;
- effective timestamp;
- update timestamp;
- administrator that performed the update.

Values reject `undefined`, non-finite numbers, unknown configuration keys, invalid policy versions and stale revisions.

### Authorization and privileged execution

Reading configuration requires `config.value.read`.

Changing configuration requires the new explicit `config.value.manage` permission and a pre-resolved privileged condition. The Technical / System Administrator receives this capability by default; Super Admin receives it through the full permission catalog. Analyst / Auditor remains read-only.

The privileged condition is resolved outside the configuration service using the existing ADM-095 condition framework. The sensitive audit event additionally requires recent re-authentication evidence through ADM-085's existing security-context rules.

### Atomic state and audit evidence

A configuration change creates both:

- the next mutable current-value state; and
- an immutable ADM-085 administrative audit event.

The Firestore unit of work reads the stored revision inside the transaction and rejects stale writers. It then writes the current configuration and appends the audit event atomically. A partial state in which policy changed without corresponding audit evidence is not accepted.

The audit event captures configuration key, previous state, new state, actor, exercised permission, reason, related case, timestamp, security context, evidence and approvals where supplied.

This gives the Policy & Configuration Center a safe current-value foundation before `ADM-084` adds the full versioned configuration history and change-record experience.

## ADM-086 — Audit corrections without history deletion

Administrative audit corrections are additive.

The correction workflow:

1. requires `audit.event.read` to inspect the original event;
2. requires `audit.correction.append` plus a pre-resolved privileged condition;
3. loads the original immutable ADM-085 event;
4. requires a new correction event ID and a non-empty corrected state;
5. appends a new sensitive administrative audit event;
6. points that event at the original audit event ID;
7. preserves the original event unchanged.

The correction event uses action `audit.event.correction-appended`, identifies the original action/outcome/timestamp in prior-state context, and records `correctionOfEventId` with the corrected state in the new-state context.

The service does not rewrite the original audit record and has no update or delete operation for it. Firestore rules also make `platformAdministrativeAuditEvents` append-only for direct clients: create remains behind the trusted server boundary while update/delete are explicitly denied.

A correction therefore means **“this later event corrects action X”**. It never means “rewrite action X as though the original history never occurred.”

## Storage boundaries

`governedConfigurationValues` stores the mutable current policy values. It is server managed and not directly accessible from browser/mobile Firestore clients.

`platformAdministrativeAuditEvents` remains the existing canonical ADM-085 append-only administrative audit stream. ADM-086 does not create a second audit ledger.

Domain and application contracts import no Firebase SDK types. Firestore remains an infrastructure implementation detail.

## Relationship to ADM-084

`ADM-083` establishes governed current values and audited changes. `ADM-084`, scheduled in Slice 1.27, remains responsible for versioned configuration history: immutable configuration-change records, browsing prior policy revisions, and the wider configuration-history experience.

This separation is intentional. Slice 1.26 is sufficient for an authorized administrator to change the required policy values without code deployment and to prove the change through ADM-085 audit evidence, while avoiding duplicate history architecture immediately before ADM-084.

## Acceptance evidence

Slice acceptance requires tests and guardrails proving:

- all fifteen required policy families are in the governed catalog;
- Technical / System Administrator can manage configuration while Analyst / Auditor remains read-only;
- changes require `config.value.manage`, pre-resolved privileged conditions and re-authentication-aware sensitive audit context;
- current values can move through revision-safe updates without code changes;
- stale revisions fail closed;
- configuration mutation and ADM-085 audit evidence commit atomically;
- direct Firestore clients cannot access governed configuration or mutate audit history;
- an ADM-086 correction loads and references the original event;
- the original administrative event remains intact;
- correction is a new append-only ADM-085 event;
- provider-independent boundaries remain intact;
- full production CI remains green.
