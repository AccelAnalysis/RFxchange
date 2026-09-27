# Wave 1 Slice 1.12 — Platform administrator role presets

Implements **ADM-012** and **ADM-094**.

## Purpose

RFxchange needs understandable administrative roles without making role names the security model. This slice defines the ten approved platform role presets as configurable collections of catalogued permissions and preserves the Slice 1.10 rule that protected actions authorize against named permissions, scope, and later conditions.

## Required presets

1. Super Admin
2. Platform Administrator
3. Trust & Safety Administrator
4. Verification & Credibility Administrator
5. RFx & Marketplace Administrator
6. Commerce Administrator
7. Member Success & Support Administrator
8. Geography & Institutional Administrator
9. Technical / System Administrator
10. Analyst / Auditor

Each preset has a stable key, display name, description, grant templates, and configuration timestamps. Grant templates currently carry `GLOBAL` scope and no conditions; scoped assignments continue to use ADM-014/ADM-093 grant objects and conditional sensitive-action policy remains Slice 1.14.

## Authorization rule

A role preset never authorizes an action by name. Configuration resolves its permission collection into `PlatformAdministratorAuthorityContext.effectivePermissions`, and the existing administrative authorization evaluator still checks the named permission.

Changing the configured permissions for `platform-administrator`, for example, changes the next/effective authority context without adding a `role === platform-administrator` branch to feature code.

## Default bundles

The initial bundles are conservative baselines derived from the Administrative Portal specification and the currently catalogued permissions.

- Super Admin receives the complete current permission catalog.
- Platform Administrator receives broad day-to-day operating permissions but not every sensitive credibility/commerce/system capability.
- Trust & Safety receives investigation/trust/support visibility, not automatic commerce or credibility authority.
- Verification & Credibility receives the granular credibility permission family.
- RFx & Marketplace receives RFx/referral process operations without issuer award authority.
- Commerce receives commerce review authority without direct arbitrary balance mutation.
- Member Success & Support receives onboarding/support/profile operations without unrestricted impersonation.
- Geography & Institutional receives geography/institutional visibility and analytics.
- Technical / System receives configuration/system operations without marketplace, credibility, or commerce authority.
- Analyst / Auditor is read-only.

These are presets, not immutable policy. Future configuration changes are persisted and remain subject to permission/scope/condition evaluation.

## Persistence

`AdminRolePresetRepository` provides `getByKey`, `listAll`, and `save` boundaries. The Firebase adapter stores one mutable document per stable preset key in `adminRolePresets` and validates the role/permission catalog when hydrating it.

The repository stores configuration, not administrator assignments. Assignment composition and per-administrator additions/removals are Slice 1.13.

## Security invariants

- No `isAdmin` shortcut.
- No role-name authorization branch.
- Every preset permission must exist in `ADMIN_PERMISSION_CATALOG`.
- Technical/System does not inherit marketplace authority merely because it maintains infrastructure.
- Analyst/Auditor has no operating mutation permissions.
- Preset mutation changes configuration, not historical audit evidence.
- Scoped grants remain independently enforced by ADM-014/ADM-093.

## Acceptance

Tests and guardrails prove:

- all ten approved presets exist;
- Super Admin maps to the complete current catalog;
- Technical/System stays separated from RFx, commerce, and credibility authority;
- Analyst/Auditor is read-only;
- changing a preset permission bundle changes permission authorization without changing authorization code;
- invalid role keys, unknown permissions, empty bundles, and timestamp regression fail closed;
- a Firestore persistence boundary exists for mutable role-preset configuration.

## Explicitly deferred

Slice 1.12 does not implement multiple role assignment, permission additions/revocations, conditional sensitive-action requirements, administrator lifecycle management, admin UI, MFA/re-auth workflows, secondary approvals, or audit-event UI. Those remain later slices, beginning with Slice 1.13 and Slice 1.14.
