# INF-009 — First Persisted Authenticated Vertical Slice

## Purpose

INF-009 proves that the Wave 1 identity, session, Firestore and organization-authorization foundations operate as one end-to-end RFxchange path rather than as isolated infrastructure components.

The acceptance chain is:

```text
Firebase login
→ trusted Firebase credential
→ stable RFxchange UserIdentity
→ active OrganizationMembership
→ OrganizationAccount + OrganizationProfile
→ explicit organization permission
→ Firestore persistence
→ RFxchange session cookie reload
→ same RFxchange user and same authorized organization workspace
```

## Application boundary

`AuthenticatedOrganizationWorkspaceService` is provider-independent. It receives an already trusted `AuthenticatedServerContext` and resolves the user's operating organization through RFxchange domain/repository contracts.

The service:

1. loads active memberships for the RFxchange `UserId`;
2. applies `resolveUserOrganizationAccess` so a user with no active organization cannot enter a detached individual workspace;
3. requires explicit selection when more than one active membership exists;
4. rejects a requested organization that is not among the user's active memberships;
5. delegates the selected membership/organization/permission tuple to the canonical `authorizeOrganizationOperation` boundary;
6. loads the persisted organization profile;
7. returns one linked `OrganizationContext`, membership, authorization and exact permission when all checks pass.

It does not verify Firebase tokens and does not import Firebase. AUTH-003 owns the trusted credential/session boundary; AUTH-004 owns provider account-state checks; AUTH-005 owns the canonical organization authorization gate.

## Persisted identity and organization state

INF-009 uses the real INF-002 Firestore adapters for:

- `users`;
- `organizations`;
- `organizationProfiles`;
- `organizationMemberships`;
- `organizationAuthorizations`;
- access-restriction reads used by authorization.

The Firebase UID remains provider-owned. The RFxchange `UserId` is the deterministic identity created by the AUTH-002 resolver and persisted in Firestore.

An organization workspace is never inferred from a Firebase UID or role label. It is reconstructed from the RFxchange user, active membership, organization records and explicit capability grant.

## Organization selection behavior

- **No active membership:** return account resolution (`no-active-organization-membership`).
- **One active membership and no requested organization:** use that membership.
- **Multiple active memberships and no requested organization:** require explicit organization selection.
- **Requested organization not in active memberships:** fail closed.
- **Organization profile missing:** do not manufacture a network workspace; surface the incomplete persisted state.
- **Permission missing or account/membership restricted:** preserve the denial from the canonical authorization boundary.

## Server composition

`createServerAuthenticatedOrganizationWorkspaceService(...)` composes:

- the real Firestore foundation repositories;
- Firebase account-security inspection;
- the provider-neutral organization-workspace service.

Credential verification/session-cookie issuance remains separately composed by `FirebaseServerSessionBoundary`.

## Emulator acceptance

`scripts/smoke-first-persisted-authenticated-vertical-slice-emulator.mjs` runs against the Firebase Auth and Firestore emulators in production CI.

It deliberately uses the production adapters rather than hand-built persistence doubles:

1. register a Firebase email/password account;
2. make the emulator account email-verified and sign in again for refreshed claims;
3. exchange the verified ID token for an RFxchange session cookie;
4. resolve/create the RFxchange user through the real Firestore `UserIdentityRepository`;
5. persist an organization account, profile, active membership and explicit organization authorization through the real INF-002 repositories;
6. resolve the authorized organization workspace;
7. directly verify canonical Firestore documents and schema metadata exist;
8. sign the browser out;
9. create fresh Firestore repository, resolver, session-boundary and workspace objects;
10. authenticate only from the previously issued session cookie;
11. resolve the workspace again and prove the RFxchange `UserId`, organization, profile, membership and permissions are unchanged.

This distinguishes persisted state from process-local test state.

## Security boundaries

- Direct client Firestore access remains denied by INF-004/AUTH-005 rules.
- Firebase credentials authorize identity only; they never grant an organization permission.
- Email verification, disabled/revoked account state and RFxchange access restrictions remain enforced before organization permission evaluation.
- Organization role labels remain metadata; the permission catalog authorizes actions.
- A user cannot silently select an organization outside active memberships.
- A user with no organization remains in account resolution instead of entering the Exchange unattached.

## Acceptance criteria

INF-009 is complete only when production CI proves:

- login resolves a stable persisted RFxchange identity;
- that identity resolves an active membership and persisted organization/profile;
- an explicit organization permission authorizes the selected workspace;
- those records exist in Firestore through the production adapters;
- a fresh server composition using a session cookie reconstructs the same user and authorized organization;
- provider-neutral application code contains no Firebase dependency;
- the existing Auth/Firestore security suite remains green.
