# Wave 1 Slice 1.27 — Controlled Feature Flags, Recovery Operations and Versioned Configuration History

Feature IDs: `ADM-047`, `ADM-048`, `ADM-084`

## Purpose

Complete the first administrative systems foundation by turning configuration and technical recovery into controlled, attributable platform operations. This slice builds on ADM-046 system health, INF-007 background-job foundations, ADM-083 governed configuration, ADM-085 immutable administrative audit, ADM-086 additive audit corrections and ADM-088 privileged-security requirements.

The administrative browser never receives arbitrary infrastructure authority. It asks trusted server application services to perform named operations; those services validate named permissions, privileged conditions, environment, action-specific guardrails and audit evidence before dispatching to explicit handlers.

## ADM-047 — Feature-flag administration

The administrative feature-flag surface operates on an approved catalog only. Unknown flag names fail closed.

Each state is uniquely identified by:

- approved flag key;
- environment (`development`, `staging`, or `production`);
- scope kind (`global`, `geography`, or `organization`);
- optional scope identifier for non-global scopes.

Every mutation records:

- previous and new enabled state;
- monotonically increasing revision;
- environment and scope;
- administrator;
- timestamp;
- reason;
- immutable change-record identity;
- ADM-085 audit-event identity and security context.

Flag changes require `config.value.manage` plus pre-resolved privileged conditions. The service also requires the targeted environment to equal the runtime environment, preventing an administrator connected to one environment from silently changing another. Reversal uses the same guarded path and creates another immutable change and audit record.

Direct clients cannot read or write flag state or history through Firestore Rules.

## ADM-048 — Safe retry, reindex and maintenance controls

The controlled operation catalog is deliberately finite:

1. `retry-background-job`
2. `disable-failing-integration`
3. `reindex`
4. `background-repair`
5. `maintenance-mode`

Requests require `system.maintenance.request` plus pre-resolved privileged conditions and must target the current runtime environment.

Production operations additionally require an exact confirmation token containing the action, target and production environment.

Action-specific safeguards include:

- temporary integration disable requires a bounded duration;
- reindex requires explicit `incremental` or `full` mode;
- background repair requires an explicit dry-run decision, and production non-dry execution requires a validated dry-run reference;
- maintenance-mode enablement is time bounded;
- only actions with an explicitly registered server handler are executable.

The `ControlledSystemMaintenanceExecutor` is a dispatcher over explicit handlers. It exposes no shell, command string, arbitrary function name or generic infrastructure mutation primitive.

Before handler execution the server atomically persists the running operation and its sensitive ADM-085 audit event. Completion stores success/failure status, summary and diagnostic reference. Administrators with health-read authority can retrieve status feedback after execution or failure.

Concrete infrastructure handlers are composed server-side. For example, the background-job handler can operate on the INF-007 job framework; reindex and integration handlers can be bound to their respective provider adapters. That composition does not change the administrative authorization contract.

## ADM-084 — Versioned configuration change records

ADM-083 current values remain mutable aggregates. ADM-084 adds an immutable record for every successful mutation.

Each record contains:

- unique change-record ID;
- configuration key;
- revision;
- previous value;
- new value;
- effective date/time;
- recorded date/time;
- administrator;
- reason;
- policy version;
- corresponding ADM-085 audit-event ID.

Current state, the immutable version record and administrative audit event are written in one Firestore transaction. Duplicate change/audit identities and stale revisions fail closed.

The history repository can list a configuration key's versions. `valueEffectiveAt(...)` reconstructs the applicable version by selecting the latest effective record at or before the requested timestamp, with revision as the tie breaker. Historical reads require `config.history.read`; mutation authority is not implied.

The original history is append-only. Corrections to administrative audit evidence continue to use ADM-086's additive correction model rather than editing past records.

## Firestore collections

- `governedConfigurationValues` — mutable current policy/configuration values.
- `governedConfigurationChanges` — append-only ADM-084 version records.
- `featureFlagStates` — mutable current feature-flag state.
- `featureFlagChanges` — append-only ADM-047 flag-change evidence.
- `systemMaintenanceOperations` — server-managed ADM-048 operation/status aggregate.
- `platformAdministrativeAuditEvents` — append-only ADM-085/086 audit stream.

All remain behind the server-managed Firestore boundary.

## Acceptance evidence

The slice is complete when tests and production CI prove that:

- only catalogued flags can change;
- flag changes are environment/scoped, revision safe, privileged, attributable, auditable and reversible;
- all five recovery-operation families flow through named server handlers with required guardrails and persisted feedback;
- no arbitrary shell/direct infrastructure path is introduced;
- every governed configuration mutation creates immutable previous/new history and can be reconstructed for a requested effective timestamp;
- historical reads are permission gated;
- new persistence collections remain server managed and immutable evidence collections reject direct update/delete;
- full production CI remains green.
