# Wave 1 Slice 1.19 — ADM-085

## Scope

This slice implements `ADM-085` — Platform-wide immutable administrative audit log.

RFxchange already has focused audit/evidence streams for organization actions, administrator lifecycle, privileged security, and authority-boundary attempts. ADM-085 establishes the canonical platform-administrator audit record that current and future administrative application services must write in addition to any domain-specific evidence.

## Canonical event

`PlatformAdministrativeAuditEvent` records:

- actor administrator ID;
- actor role-preset keys at execution time;
- permission or permissions exercised;
- affected organization/user/object identity;
- action identifier;
- allowed/denied outcome;
- ordinary/sensitive classification;
- prior state;
- new state;
- reason;
- related case ID;
- timestamp;
- authentication/security context;
- justification;
- evidence references;
- approval references.

Allowed events require at least one catalogued permission. Denied attempts may contain zero exercised permissions so the record does not falsely claim authority that was never used.

## Sensitive-action evidence

A sensitive audit event cannot be constructed without recent re-authentication context. The event schema also preserves MFA/session/device/provider/network context plus justification, evidence and approval references supplied by the ADM-015/ADM-088 execution path.

The audit log therefore records the evidence of a sensitive authorization decision; it does not replace the permission, scope, condition or privileged-session evaluators.

## Immutability

The Firestore repository stores canonical records in `platformAdministrativeAuditEvents`.

The repository exposes append, read-by-id and query operations only. Append uses a transaction that fails if the event ID already exists. There is no update or delete method.

Corrections must be expressed as new audit/correction events rather than rewriting historical evidence.

## Application enforcement

The administrator lifecycle application service now requires a `PlatformAdministrativeAuditRepository`.

Before any provider-side effect or state persistence, it builds and validates the canonical audit event. Sensitive access changes, disable/remove, lock, credential reset, MFA requirement, re-authentication requirement and session termination therefore require audit execution context before the provider action can execute.

The focused `platformAdministratorLifecycleEvents` stream remains useful domain evidence; the canonical audit record supplies the consistent platform-wide schema.

Other administrative domains should adopt the same repository/event contract as their application command services are materialized.

## Relationship to organization audit

`OrganizationActionAuditEvent` remains the attribution model for ordinary users acting within organization membership context. ADM-085 is specifically the platform-administrator evidence contract. These are separate actor models and should not be collapsed into an ambiguous generic actor.

## Acceptance

ADM-085 is complete only when tests prove:

1. the canonical event contains actor, roles, permissions, target, action, prior/new state, reason, case, timestamp, security context, evidence and approvals;
2. sensitive events cannot be created without recent re-authentication context;
3. allowed events require catalogued permission evidence while denied attempts do not falsely claim a permission;
4. records and embedded state are immutable at the domain boundary;
5. Firestore persistence is append-only and rejects duplicate IDs;
6. administrator lifecycle/security application operations prepare a valid canonical audit record before provider side effects;
7. focused existing evidence streams remain supplemental rather than mutable replacements;
8. the full production CI suite remains green.
