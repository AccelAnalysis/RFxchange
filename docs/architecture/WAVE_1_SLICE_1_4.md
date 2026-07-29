# Wave 1 Slice 1.4 — Organization user permissions

## Scope

This slice implements only:

- **ARC-005 — Capability-based user permissions**

Tracker requirement: store an organization role plus granular permissions for each user.

## Governing rule

Authorization belongs to a user's membership in an organization, not to the global user identity.

A person may participate in more than one organization. Their permissions must therefore be isolated by `OrganizationMembershipId` and `OrganizationId` so authority in one tenant cannot leak into another.

## Authorization record

`OrganizationUserAuthorization` stores:

- membership ID;
- user ID;
- organization ID;
- organization role key;
- explicit granular permission list;
- authorization timestamps.

The role key is organizational metadata. It supports later role presets and display/administration workflows, but protected actions are not authorized by role-name checks.

## Capability-based decisions

The initial organization permission catalog uses named action capabilities across organization management and future business workflows, including profile/users/permissions, RFx, response, evaluation, referral, teaming, documents, resources, credibility and billing.

The catalog is an authorization namespace, not an implementation claim for those feature domains.

`evaluateOrganizationPermission` allows an action only when all of the following are true:

1. the organization membership is active;
2. the authorization record belongs to that exact membership/user/organization tuple;
3. the requested organization is the membership's organization tenant;
4. the requested named permission is present in the membership authorization record.

A stored role name alone never grants an action.

## Role model boundary

ARC-005 requires role storage, so `roleKey` is persisted now.

This slice deliberately does not hard-code the standard role presets planned under ORG-022. Later role presets can map named organizational roles to permission collections without changing server-side authorization semantics.

This also allows per-user permission differences even when two users share the same role label.

## Membership dependency

Authorization is layered on the active membership rule established by ARC-003.

An inactive membership may retain its authorization record for continuity/history, but it cannot exercise any stored permission.

## Cross-tenant protection

Authorization creation requires the supplied `OrganizationAccount` to match the membership's organization ID.

Permission evaluation also validates the exact organization tenant and membership identity. This prevents:

- using one organization's role in another organization;
- reusing another membership's authorization record;
- letting a global user identity carry organization authority between tenants.

## Persistence boundary

`OrganizationUserAuthorizationRepository` supports lookup by membership, user and organization and stores the authorization record independently from the identity and membership records.

This keeps identity, tenancy, membership and authorization as separate concerns.

## Acceptance evidence

ARC-005 is satisfied when:

- each membership authorization stores a role key plus granular permissions;
- role metadata does not itself authorize actions;
- explicit capabilities drive permission decisions;
- inactive membership denies all capabilities;
- cross-tenant access is rejected;
- an authorization record cannot be reused for another membership;
- unknown permission names are rejected;
- persistence supports membership/user/organization authorization lookup.

Behavioral tests cover these invariants and architecture guardrails prevent broad role-name authorization conditionals.

## Explicitly deferred

This slice does **not** implement:

- standard organizational role presets — ORG-022;
- invitation/user-management workflows — ORG-021;
- per-user audit history — ARC-006;
- onboarding/access lifecycle states — ARC-007;
- restriction/suspension states — ARC-008;
- administrator permission architecture — ADM-001 and later admin authority slices;
- permission administration UI;
- database adapters;
- session/auth middleware;
- billing entitlement evaluation;
- RFx, response, referral, teaming, resource or credibility feature behavior.

Those later systems will consume this organization membership authorization boundary rather than replace it.
