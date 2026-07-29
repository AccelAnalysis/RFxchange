# Wave 1 Slice 1.11 — Scoped Administrative Permission Grants

## Scope

This slice implements only:

- ADM-014 — scoped administrative permissions
- ADM-093 — scoped permission grant objects

It extends the Slice 1.10 namespaced permission engine without replacing its role-context and effective-permission checks.

## Scope model

Administrative grant scopes are explicit serialized values:

- `GLOBAL`
- `GEOGRAPHY:<id>`
- `ORGANIZATION:<id>`
- `CASE:<id>`

A GLOBAL grant may satisfy an action at any resolved scope.

A geography, organization, or case grant satisfies only the exact same resolved scope value. The generic authorization layer does not infer cross-domain containment. For example, whether an organization belongs to a geography must be resolved by the calling domain before authorization.

## Grant object

`AdminPermissionGrant` stores:

- immutable grant ID
- administrator ID
- catalogued namespaced permission
- explicit scope
- optional condition keys
- creation timestamp
- optional expiry timestamp

Expiry must be later than grant creation. Expired grants fail closed.

Grant condition keys are generic prerequisites. Slice 1.11 only verifies that required keys are present in pre-resolved evaluation evidence; it does not define sensitive-action condition policies, justification requirements, re-authentication, evidence workflows, or approval rules. Those remain ADM-015 and later security slices.

## Authorization

`authorizeScopedAdministrativeAction` requires all of the following:

1. role context exists;
2. the named permission exists in the administrator's effective permission set;
3. at least one grant for the same administrator and permission exists;
4. at least one relevant grant is unexpired;
5. GLOBAL or exact resolved scope matches;
6. all condition keys on the matching grant are satisfied.

The action requirement also records `read` or `write` access mode. The mode is evidence about the protected action; the actual authority still comes from the namespaced permission key, so role names and generic read/write flags cannot grant access by themselves.

## Server-side scope enforcement

ADM-014 requires scope enforcement for both reads and writes. Tests therefore cover organization-scoped read and write permissions independently and prove that unauthorized target IDs and scope kinds are denied.

A geography grant cannot automatically access an organization record merely because the organization might be geographically located there. The domain that knows that relationship must resolve the action's authorization scope explicitly.

## Persistence boundary

`AdminPermissionGrantRepository` exposes append/read behavior:

- append a grant
- get grant by ID
- list grants for one administrator

Mutation-in-place and deletion are intentionally absent. Later administrator lifecycle and override slices can define revocation/effective-state records without erasing grant history.

## Explicit deferrals

This slice does not implement:

- ADM-012 platform role presets
- ADM-013 multiple roles and overrides
- ADM-015 sensitive-action condition policies
- grant revocation workflows
- scope-assignment administration UI
- geography-to-organization containment resolution
- case ownership/assignment workflows
- administrator lifecycle management
- MFA, re-authentication, session controls or dual approval
- administrative audit log
- database adapters or migrations
- tracker spreadsheet updates

## Acceptance criteria

Slice 1.11 is acceptable when tests and guardrails prove:

1. GLOBAL, GEOGRAPHY, ORGANIZATION and CASE grant scopes exist;
2. the same named permission can be granted globally or to an exact scoped target;
3. unauthorized scope IDs and kinds are denied server-side;
4. both read and write action requirements participate in scoped evaluation;
5. grants preserve administrator, permission, scope, optional expiry and optional conditions;
6. expired grants cannot authorize;
7. required grant condition keys must be satisfied;
8. grants for another administrator cannot authorize the current administrator;
9. effective permission and scoped grant are both required;
10. grant persistence remains append/read oriented.
