# Wave 1 Slice 1.2 — User identity and organization membership

## Scope

This slice implements only:

- **ARC-003 — Organizational membership required for access**
- **ARC-004 — Individual user credentials/security**

It builds on the organization tenant model established in Slice 1.1.

## Governing rule

The organization remains the RFxchange tenant and operating context.

An individual may have an identity record before organization resolution is complete, but that identity is not eligible for normal platform participation until it has at least one active `OrganizationMembership`.

If no active organization membership exists, access resolves to `account-resolution` rather than creating or treating the individual as a standalone tenant.

## User identity

`UserIdentity` owns person-specific identity and security information:

- stable `UserId`;
- individual name;
- primary email;
- login-provider binding;
- provider subject identifier;
- per-user security settings;
- user-level timestamps.

The domain model intentionally does **not** store passwords or authentication secrets. Authentication credentials remain the responsibility of the eventual production identity provider; RFxchange stores only the non-secret binding needed to associate the provider identity with the RFxchange user.

`UserIdentity` also intentionally contains no `organizationId`. Organization affiliation is represented through explicit membership records rather than embedding a single tenant directly on the person. This preserves the organization-centered architecture while allowing a person to participate in multiple organizations if later workflows permit it.

## Organization membership

`OrganizationMembership` links:

- one `UserId`;
- one existing `OrganizationId` tenant;
- one membership identity;
- an active/inactive membership state.

Membership creation requires an `OrganizationAccount` object so tenant ownership is derived from an established organization rather than accepting a free-form organization identifier.

This slice does not define organization roles or granular permissions. Membership answers **whether the user is attached to the organization**, not **what the user may do inside it**.

## Access resolution

`resolveUserOrganizationAccess` applies the ARC-003 invariant:

1. consider memberships belonging to the requested user;
2. keep only active memberships;
3. if none remain, return `account-resolution` with reason `no-active-organization-membership`;
4. if one or more remain, return `organization-access` with the active memberships.

This makes the no-orphan-user rule explicit and testable without prematurely introducing the onboarding state machine from ARC-007.

## Persistence boundary

The architecture defines separate repository ports for:

- `UserIdentityRepository`;
- `OrganizationMembershipRepository`.

The membership repository supports lookup by user and organization and an explicit active-membership query needed for access resolution.

Database technology, authentication provider, session storage and API transport remain implementation details for later slices.

## Acceptance evidence

### ARC-003

Satisfied when:

- an organization membership always links a user to an existing organization tenant;
- an active membership enables organization access eligibility;
- no membership or only inactive memberships routes the user to account resolution;
- another user's membership cannot make the current user usable;
- multiple organization memberships do not turn the user into a tenant.

### ARC-004

Satisfied when:

- every user has a stable individual identity;
- name and primary email are user-owned fields;
- login provider/subject binding is user-owned and contains no password secret;
- user security settings are modeled separately from organization state;
- organization affiliation is not embedded into the user identity.

## Explicitly deferred

This slice does **not** implement:

- organization roles or granular permissions — ARC-005;
- per-user activity audit history — ARC-006;
- onboarding/access lifecycle states — ARC-007;
- restriction/suspension states — ARC-008 and later administration work;
- organization-scoped transactional assets — ARC-009;
- authentication screens or login/session runtime;
- password storage or credential verification;
- invitation acceptance workflows;
- organization claim/create flows;
- geography selection;
- billing or membership plans;
- admin UI;
- RFx, referral, teaming, messaging or credibility features.

Those remain separate slices so this change establishes only the identity/membership foundation.
