# Wave 1 Slice 1.14 — Conditional sensitive administrative actions

Implements **ADM-015**.

## Purpose

Some administrative actions require more than possession of a permission and valid scope. This slice adds configurable, typed requirements for justification, evidence, recent re-authentication, and secondary approval. Conditions only restrict authority; they never grant it.

## Authorization order

`authorizeConditionalScopedAdministrativeAction` executes in two phases:

1. Existing ADM-011/ADM-014 authorization checks the administrator's effective permission set and scoped grant.
2. If and only if that succeeds, the configured ADM-015 condition policy is evaluated.

A caller that satisfies every condition but lacks the permission or scoped grant is denied during phase one.

## Condition types

### Justification

A policy may require a nonblank justification with a configured minimum character count. The text itself is passed as evidence rather than a broad `justified=true` flag.

### Evidence

A policy may require one or more nonblank evidence references. References are stable identifiers to records/documents; the condition model does not accept an `evidencePresent=true` shortcut.

### Recent re-authentication

A policy specifies a maximum age in seconds. Evaluation requires an actual `reauthenticatedAt` timestamp. Missing, future-dated, invalid, or older-than-policy timestamps fail closed.

### Secondary approval

Approval evidence contains:

- approver administrator ID;
- the exact permission being approved;
- the exact scope value being approved;
- approval timestamp.

The approver must be different from the acting administrator. Approval must match both permission and scope and remain within the configured maximum age. Self-approval, stale approval, or approval for another permission/scope does not satisfy the condition.

This slice establishes the evidence contract; later workflow slices may add approval request queues, notification delivery, and richer approver-eligibility policy.

## Policy configuration

`AdminSensitiveActionPolicy` is keyed by a catalogued permission and contains a unique list of typed condition requirements. A policy must contain at least one condition. Duplicate condition kinds, invalid limits, unknown permissions, and timestamp regression fail closed.

`AdminSensitiveActionPolicyRepository` provides the provider-independent persistence boundary. The Firebase adapter stores mutable policy configuration in `adminSensitiveActionPolicies`, keyed by permission.

## Relationship to prior slices

- Slice 1.10 defines named administrative permissions.
- Slice 1.11 requires scoped permission grants.
- Slice 1.12 defines configurable role presets.
- Slice 1.13 resolves multiple roles and explicit per-administrator additions/removals.
- Slice 1.14 adds conditions after those authority layers have succeeded.

The generic `conditionKeys` already available on scoped grants remain supported for pre-resolved domain-specific grant conditions. ADM-015 adds the typed evidence semantics required for sensitive administrative actions; it does not replace the existing scoped-grant mechanism.

## Security invariants

- Conditions cannot create permission.
- Conditions cannot expand scope.
- No broad caller-trusted `approved` or `conditionsSatisfied` boolean.
- Justification is concrete text.
- Evidence is represented by stable references.
- Re-authentication is time-bound timestamp evidence.
- Secondary approval cannot be self-approved.
- Secondary approval is permission-, scope-, and time-bound.
- Policy/action permission mismatch fails closed.

## Acceptance

Tests and guardrails prove:

- actions without a configured sensitive policy behave according to the existing permission/scope evaluator;
- missing/short justification is denied when required;
- insufficient evidence references are denied;
- missing or stale re-authentication is denied;
- self, stale, wrong-permission, and wrong-scope secondary approvals are denied;
- all configured conditions allow only after base authorization succeeds;
- satisfying conditions cannot restore a permission explicitly removed in Slice 1.13;
- malformed policy configuration fails closed;
- policy configuration has a persistence boundary.

## Explicitly deferred

This slice does not implement the administrative UI, an approval-request inbox, approval notifications, MFA provider UX, immutable evidence/audit event capture, approver delegation policy, or emergency break-glass workflow. Those capabilities should use this condition contract rather than introduce parallel authorization shortcuts.
