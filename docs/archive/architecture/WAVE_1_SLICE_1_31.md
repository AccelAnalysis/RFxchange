# Wave 1 Slice 1.31 — Controlled user administration

## Scope

This slice implements **ADM-068 — Controlled user administration actions** and closes the remaining Wave 1 Foundation capability.

Tracker requirement:

> Support invite/resend, organization removal, suspension/restore, approved access reset, role transfer and permission assignment/revocation through explicit audited actions.

Acceptance:

> Each user-access action is permission-checked, scope-checked and logged with prior/new state.

## Dependency correction

The seeded tracker edge `ADM-068 → ADM-065` is not an architectural prerequisite. `ADM-065` is the Activation-wave organization claims console; a claims-console UI is unrelated to server-side administration of an already-resolved user's organization access.

For build sequencing, ADM-068 instead relies on the merged foundations that actually govern the action:

- `ARC-008` — membership/user restriction states;
- `ADM-014` / `ADM-093` — exact scoped administrative grants;
- `ADM-056` — organization membership/permission administration foundation;
- `ADM-069` — orphan-user prevention/account-resolution behavior;
- `ADM-085` — immutable canonical administrative audit;
- `ADM-088` — privileged-security/re-authentication controls;
- `ORG-021` — organization-user invitation foundation.

The canonical dependency map records this scheduling correction; the source spreadsheet remains provenance.

## Authorization contract

Every ADM-068 mutation requires:

1. the named platform permission `user.access.manage` in effective authority;
2. an active matching admin grant;
3. exact `ORGANIZATION:<organizationId>` scope, or a GLOBAL grant that legitimately covers that target;
4. any grant conditions to be satisfied;
5. any configured sensitive-action policy conditions to pass;
6. recent re-authentication context because every mutation produces a sensitive administrative audit event.

Role names never authorize these actions by themselves.

## Controlled actions

The service exposes nine explicit operations rather than a generic unrestricted mutation endpoint:

1. invite an organization user;
2. resend a pending invitation;
3. remove a user from one organization;
4. suspend a membership/user access target;
5. restore a non-terminal membership/user restriction;
6. reset organization access to an approved role bundle;
7. transfer organizational role;
8. assign one granular organization permission;
9. revoke one granular organization permission.

Each operation has a distinct audit action identifier so downstream review can distinguish what actually happened.

## Invitation boundary

The established ORG-021 invitation model records an organization user/membership as the inviter because invitation issuance represents the organization granting membership access. ADM-068 therefore requires an authorized organization sponsor for invitation creation while the platform administrator remains the actual actor in the canonical platform-admin audit event.

Resend does not create a duplicate invitation. It renews the validity of an existing pending invitation and records the before/after expiry state. Transport/delivery of an invitation email remains a communications-provider concern and is not coupled to ADM-068.

## Organization removal and orphan prevention

Removal is implemented as controlled membership deactivation, not destructive deletion. It reuses the existing administrative membership-repair planner and refuses a mutation that would leave an active user with no active organization membership. Such a case must route through account resolution instead.

This preserves the platform invariant that an active usable individual cannot become unattached from every organization.

## Suspend and restore

Suspension uses the existing ARC-008 membership restriction target, preserving explicit organization, membership and user identity together.

Restore transitions a non-terminal restriction back to `none`. A `terminated` restriction remains terminal and cannot be restored through normal ADM-068 operations.

## Approved access reset

An access reset is intentionally different from ordinary role or permission editing. It requires a distinct administrative approval reference and resets the selected membership authorization to a named approved organization role bundle.

This slice does not reset an identity-provider password or authentication credential. Authentication/security recovery remains within the authentication/provider boundaries already established elsewhere.

## Role and permission changes

Role transfer resolves the approved organization role bundle and replaces the membership's role metadata and effective organization permissions with that bundle.

Permission assignment and revocation mutate one catalogued organization permission at a time. They do not authorize by role-name conditionals and cannot target another organization tenant.

## Audit and persistence

Every successful mutation creates a sensitive `PlatformAdministrativeAuditEvent` containing:

- platform administrator identity;
- exercised `user.access.manage` permission;
- organization and user target where applicable;
- precise action identifier;
- prior state;
- new state;
- reason;
- security/re-authentication context;
- optional case, justification, evidence and approval references.

`ControlledUserAdministrationUnitOfWork` couples the state mutation and audit evidence. The Firestore implementation writes both in one transaction and rejects create/update mismatches or duplicate audit IDs.

No user-access history is erased to perform an ADM-068 action.

## Deliberately deferred

ADM-068 does not add:

- the Activation-wave organization claims console (`ADM-065`);
- new admin portal screen design;
- identity-provider password reset implementation;
- invitation email-provider adapter behavior;
- a new global user restriction model beyond existing membership/org scopes;
- bulk user mutation tools;
- automatic suspension triggers;
- case UI or notification workflows beyond existing case/audit references.

## Acceptance result

ADM-068 is complete when tests and production CI prove all nine actions are named, permission-checked, exact-scope checked, fail closed on invalid state, preserve organization attachment rules, and atomically produce prior/new-state administrative audit evidence with the access mutation.
