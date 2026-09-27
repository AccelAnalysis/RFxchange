# Wave 1 Slice 1.10 — Platform Administrator Permission Engine and Catalog

## Scope

This slice implements only:

- ADM-001 — granular/capability-based platform administrator permissions
- ADM-011 — role + permission + scope + conditions authorization foundation
- ADM-092 — namespaced administrative permission catalog

## Governing authorization rule

Administrative authority is not represented by a binary `isAdmin` flag and protected actions do not authorize by matching broad role names.

A protected administrative action declares a named permission requirement. The authorization engine evaluates that permission against an administrator authority context that carries:

1. one or more opaque role-preset references;
2. the administrator's effective named permissions;
3. explicit scope resolution evidence; and
4. optional condition-resolution evidence.

Role preset definitions, role composition and explicit per-admin grant persistence are deliberately deferred. The role references in this slice prove that role context is part of the authority decision without making any role name a security shortcut.

## Namespaced permission catalog

The catalog establishes these administrative namespaces:

- `platform`
- `admin`
- `config`
- `organization`
- `user`
- `rfx`
- `credibility`
- `provider`
- `referral`
- `commerce`
- `geography`
- `support`
- `trust`
- `analytics`
- `audit`
- `system`

Permission keys are stable lowercase dot-separated identifiers such as:

- `organization.profile.read`
- `rfx.moderation.review`
- `credibility.organization.verify`
- `support.case.update`
- `system.health.read`

Protected feature code is expected to depend on the permission key rather than a role name.

## Granular credibility authority

ADM-001 originally requires capability-based administrator permissions and the ability to vary credibility-management powers per administrator.

The catalog therefore includes separate permissions for:

- organization verification
- verification denial
- manual badge award
- platform endorsement issue
- badge suspend
- badge restore
- badge revoke
- credibility record correction
- appeal review
- activity invalidation
- transaction invalidation
- endorsement-authority suspend
- endorsement-authority restore

An administrator may therefore hold `credibility.organization.verify` without holding `credibility.badge.revoke`, for example.

This slice does not implement the Super Admin workflow that changes those permissions. It establishes the permission granularity and decision behavior needed by that later workflow.

## Role boundary

`rolePresetKeys` are opaque references in Slice 1.10.

The evaluator intentionally does not contain checks such as:

- `role === "super-admin"`
- `role === "platform-administrator"`
- `roles.includes("trust-and-safety")`

A role reference is required as part of authority context, but a role name by itself grants no action.

ADM-012 and ADM-094 will later define configurable role presets as permission collections. ADM-013 will later provide multiple-role and override behavior.

## Scope boundary

Every authorization decision carries explicit scope resolution.

Slice 1.10 supports only the `GLOBAL` baseline so that scope is never implicit.

It does not define geography-, organization-, or case-scoped grant objects. Those belong to ADM-014 and ADM-093.

The engine already denies when the supplied global scope resolution is not satisfied, giving later scope logic a single enforcement point.

## Conditions boundary

An action requirement may state either:

- `none`; or
- `pre-resolved`.

For `pre-resolved`, the authority context must indicate that the required conditions were satisfied and may carry evidence keys.

This establishes the requirement that conditions participate in the decision without implementing condition configuration, re-authentication, justification, evidence or approval workflows. Those belong to ADM-015 and later security/approval slices.

## Administrative identity boundary

`PlatformAdministratorId` is a distinct platform administrative identifier.

It is not an `OrganizationMembership`, does not make an administrator an organization tenant, and does not imply marketplace authority beyond explicit permissions.

Administrator lifecycle, login/session controls, MFA and disabled-account state remain later features.

## Repository boundary

This slice exposes read-oriented repository ports for:

- the permission catalog; and
- an administrator's resolved authority context.

It does not create role/grant mutation repositories because assigning roles, overrides, scopes and conditions belongs to later slices.

## Explicit deferrals

This slice does not implement:

- the ten platform administrator role presets (ADM-012)
- multiple roles or per-user additions/revocations (ADM-013)
- geography/organization/case scopes (ADM-014 / ADM-093)
- sensitive-action condition policy configuration (ADM-015)
- administrator lifecycle management (ADM-016)
- administrator credentials, MFA, re-auth or session controls (ADM-017 / ADM-088)
- Super Admin versus Platform Administrator operating bundles
- minimum-necessary private-data permissions beyond the initial catalog foundation (ADM-090)
- administrative audit log (ADM-085 / ADM-086)
- feature UI or admin navigation
- database adapters or migrations
- tracker spreadsheet updates

## Acceptance criteria

Slice 1.10 is acceptable when tests and guardrails prove:

1. all required administrative permission namespaces exist;
2. protected actions require a catalogued namespaced permission;
3. an unknown permission cannot be used for authorization;
4. role context is represented but broad role names do not authorize actions;
5. a role reference with no required permission is denied;
6. credibility powers can be independently granted/withheld per administrator;
7. explicit scope resolution participates in the decision;
8. required pre-resolved conditions must be satisfied before allow;
9. no binary `isAdmin`/admin flag is introduced;
10. permission-catalog and authority-context read boundaries exist.
