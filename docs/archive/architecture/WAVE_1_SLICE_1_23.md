# Wave 1 Slice 1.23 — Organization Role Bundle Catalog and Administrative Access Management

Feature IDs: `ADM-055`, `ADM-056`

## Purpose

Build the administrative control layer on top of Slice 1.22's organization invitation, membership and capability foundation. This slice separates reusable role-bundle configuration from explicit membership access changes and preserves the permission-first authorization model.

## ADM-055 — Organization role bundle catalog

The configurable catalog contains ten bundles:

1. Primary Admin / Owner
2. Organization Admin
3. Power User / Manager
4. Contributor
5. Viewer
6. Billing Manager
7. RFx Issuer Manager
8. RFx Evaluator
9. Response Manager
10. Resource Manager

A role bundle is stored configuration: stable key, label, description and a set of catalogued organization permissions. Role names never authorize an action by themselves.

The default bundle definitions provide safe baseline capability mappings. Persisted configuration can replace any default bundle without changing action authorization code. Existing membership authorization records retain their explicit capability snapshot until an authorized access change is made; bundle configuration therefore does not silently rewrite existing users.

## ADM-056 — Administrative membership and permission management

Authorized platform administrators use named platform capabilities:

- `user.access.read` to inspect organization memberships and their effective organization authorization records;
- `user.access.manage` to change a membership's role/capability assignment, activate/deactivate membership access, or configure the role-bundle catalog.

Platform role labels are not checked directly.

### Membership role and granular permission change

The administrator can either:

- apply one configured/default role bundle; or
- assign an explicit organization role key plus an explicit list of catalogued organization permissions.

The resulting membership authorization remains scoped to the existing user, membership and organization IDs.

### Membership status change

Deactivation reuses ADM-069 orphan-user prevention. If the target is the user's last active organization membership, normal deactivation is rejected and account-resolution handling is required. Reactivation restores only that existing membership; it does not create a new organization or new identity.

## Audit and transaction boundary

Every mutation is sensitive and creates canonical ADM-085 evidence containing:

- administrator ID and role context;
- `user.access.manage` permission exercised;
- organization, user and membership/bundle target;
- before state;
- after state;
- reason;
- recent re-authentication/security context;
- timestamp.

Firestore commits access state plus the corresponding platform audit event in one transaction. A mutation must not become visible without its audit evidence.

Role-bundle configuration is also persisted with its audit event atomically.

## Security boundaries

- `organizationRoleBundles` remains server managed under Firestore Security Rules.
- Domain/application services contain no Firebase SDK dependency.
- Organization permissions are parsed through the canonical organization permission catalog.
- Technical administrators without `user.access.manage` cannot mutate organization access.
- Analyst/Auditor remains read-only.
- ADM-090 sensitive-data permissions remain separate; user access management does not grant private evidence access.

## Relationship to Slice 1.22

ORG-022 supplies the member-facing standard role presets used by normal organization workflows. ADM-055 adds the platform-managed ten-bundle administrative catalog. Both resolve to explicit capability lists; neither introduces role-name authorization.

ORG-021 supplies invitation and membership creation. ADM-056 supplies post-creation inspection and controlled repair/change workflows.
