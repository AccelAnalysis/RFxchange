# Wave 1 Slice 1.13 — Multiple administrator roles and permission overrides

Implements **ADM-013**.

## Purpose

Administrators must be able to hold more than one Slice 1.12 role preset, with individual permissions added or removed without creating another hard-coded role. This slice adds the administrator-specific source configuration and deterministic composition rules.

## Source configuration

`PlatformAdministratorRoleConfiguration` stores:

- administrator identity;
- one or more role preset keys;
- explicit permission additions;
- explicit permission removals;
- configuration creation/update timestamps.

Duplicate role keys and duplicate permission entries are normalized. Every role key must be one of the ten approved presets and every override must be a catalogued administrative permission.

## Effective permission composition

Effective permissions are resolved in this order:

1. Union permissions from every assigned role preset.
2. Add explicit per-administrator permissions.
3. Remove explicit per-administrator revoked permissions.

Removal is deliberately last and authoritative. A permission explicitly removed from an administrator cannot be restored merely because another assigned preset or direct addition contains it.

The resulting set is supplied to the existing `PlatformAdministratorAuthorityContext`. Feature authorization still checks named permissions; it does not inspect role names.

## Scoped grant interaction

ADM-014/ADM-093 scoped grants remain a second required layer. `authorizeScopedAdministrativeAction` already requires the permission to exist in `effectivePermissions` before a scoped grant can authorize it. Therefore a scoped grant cannot bypass an explicit ADM-013 permission removal.

## Persistence

`PlatformAdministratorRoleConfigurationRepository` stores the source assignment/override configuration. The Firebase adapter persists one mutable `adminRoleConfigurations` document per platform administrator ID.

This source configuration is intentionally distinct from the computed authority context. Re-resolving the context against current role preset configuration allows preset changes to flow into effective authority while preserving the administrator's explicit additions/removals.

## Security invariants

- At least one role preset is required for a platform administrator authority context.
- Unknown presets and permissions fail closed.
- Missing assigned preset configuration fails closed rather than silently dropping a role.
- Explicit removal wins over role bundles and additions.
- Scoped grants cannot resurrect an explicitly removed permission.
- No role-name branch is introduced into feature authorization.

## Acceptance

Tests and guardrails prove:

- two or more role presets combine into one effective permission set;
- duplicate role assignments normalize safely;
- direct additions extend authority without cloning a role;
- removals revoke permissions inherited from a preset or direct addition;
- a scoped grant cannot bypass removal;
- missing assigned preset configuration fails closed;
- invalid role/permission values and timestamp regression are rejected;
- administrator-specific role configuration has a persistence boundary.

## Explicitly deferred

Slice 1.13 does not implement administrator lifecycle UI, role-assignment UI, change approval/audit workflow, MFA/re-authentication, justification/evidence requirements, or secondary approvals. Sensitive-action condition semantics are Slice 1.14 (ADM-015).
