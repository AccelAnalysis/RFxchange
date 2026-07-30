# Wave 1 Slice 1.25 — Canonical Administrative Case Model and Lifecycle / SLA Controls

Feature IDs: `ADM-061`, `ADM-062`

## Purpose

Turn Slice 1.24's cross-domain work-queue projection into a durable, attributable administrative case system. The case is the canonical workflow record; the unified queue consumes case projections rather than owning lifecycle state.

## ADM-061 — Canonical administrative case model

Every administrative case carries:

- stable case ID and human-facing case number;
- object type and object ID;
- organization and user references when applicable;
- case type, severity and source;
- geography when applicable;
- assigned administrator;
- current status;
- evidence references;
- related case IDs;
- named read permission and action permission;
- SLA policy key and due time when configured;
- created, updated, resolved and closed timestamps.

The record is provider independent. Firestore is an infrastructure adapter, not part of the case contract.

## ADM-062 — Lifecycle and SLA controls

The lifecycle is explicit and ordered:

`New → Triaged → Assigned → In Review → Waiting for Participant → Action Required → Monitoring → Resolved → Closed`

Normal lifecycle transitions move one step at a time. Entering `Assigned` requires the target administrator identity. Every transition creates an immutable event containing actor, prior status, new status, assignment context, reason and timestamp.

The Firestore unit of work updates the mutable case and appends the immutable event atomically. It rejects:

- missing cases;
- duplicate event IDs;
- stale prior-state transitions;
- event/case identity mismatches.

## SLA state

A case can resolve to one of five SLA states:

- `not-configured` — no case SLA deadline;
- `within-sla` — outside the due-soon window;
- `due-soon` — deadline falls inside the configured warning window;
- `overdue` — deadline has passed before resolution;
- `satisfied` — case has reached Resolved or Closed.

The default due-soon window is 60 minutes and can be overridden by callers while remaining a positive integer.

## Authorization

Each case declares catalogued platform administrative permissions for reading and acting. The application service checks those permissions through the existing permission engine before revealing a case or executing a transition. Role names do not authorize cases.

## Integration with Slice 1.24

`AdministrativeCaseWorkQueueProvider` converts open canonical cases into the unified administrative work-item envelope created in Slice 1.24. That preserves one source of lifecycle truth while allowing the command center and work queue to remain projections.

## Storage and security

- `administrativeCases` is server-managed mutable workflow state.
- `administrativeCaseEvents` is server-managed append-only lifecycle evidence.
- Direct authenticated or anonymous Firestore clients receive no access under the default-deny rules boundary.
- Application/domain contracts do not import Firebase types.

## Non-goals

This slice does not yet implement automated escalation notifications, cross-case merge/split workflows, arbitrary lifecycle skipping, or domain-specific case creation triggers. Those can be layered onto the canonical model after their source-domain features exist.
