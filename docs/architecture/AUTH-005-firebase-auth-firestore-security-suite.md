# AUTH-005 — Firebase Auth and Firestore emulator security suite

## Scope

AUTH-005 creates the automated security checkpoint that composes the foundations established by:

- AUTH-001 — Firebase Authentication provider integration;
- AUTH-002 — Firebase identity to RFxchange `UserIdentity` resolution;
- AUTH-003 — verified server authentication/session boundary;
- AUTH-004 — authentication lifecycle and account-security state;
- ARC-003/005 — organization membership and permission evaluation;
- ARC-008 — organization and membership restriction states;
- INF-002 — Firestore persistence boundary;
- INF-004 — default-deny Firestore Security Rules.

The tracker acceptance matrix requires CI scenarios for no authentication, wrong user, wrong organization, inactive membership, restricted state, and authorized access.

## Governing security decision

Direct client Firestore access remains closed.

RFxchange deliberately keeps the Firebase UID separate from the internal RFxchange `UserId`. Firestore Security Rules therefore cannot safely infer an RFxchange user, organization membership, or permission merely from `request.auth.uid`. Opening client access based on UID equality would either collapse the provider/domain identity boundary or require an additional reviewed mapping/custom-claim architecture.

AUTH-005 proves two complementary boundaries:

1. authenticated and unauthenticated browser Firestore clients are denied by Rules;
2. verified server operations may use Firebase Admin only after application authorization binds the trusted RFxchange user to one active membership, one organization, current account security, no active restriction, and the requested permission.

This is not a temporary test shortcut. It is the approved server-managed architecture for the current foundation.

## Canonical protected-operation boundary

`authorizeOrganizationOperation` is the reusable application service for organization-scoped server operations.

Inputs:

- trusted `AuthenticatedServerContext` from AUTH-003, or no context;
- requested `organizationId`;
- requested `membershipId`;
- requested granular `OrganizationPermission`.

Dependencies:

- provider-neutral account-security reader;
- organization account repository;
- organization membership repository;
- organization authorization repository;
- access-restriction repository.

Evaluation order:

1. authenticated server context exists;
2. membership exists;
3. membership belongs to the authenticated RFxchange user;
4. membership belongs to the requested organization;
5. organization exists;
6. provider account exists and matches the authenticated provider subject;
7. account is enabled, credential is current, and required email verification is complete;
8. membership is active;
9. organization and membership restrictions are clear;
10. authorization exists and matches the membership/user/organization tuple;
11. authorization contains the requested permission.

A successful result authorizes exactly that user + membership + organization + permission tuple. It cannot be reused for another tenant or capability.

## Emulator scenario matrix

The Firebase Auth and Firestore emulators run in one CI process using the demo project `demo-rfxchange`.

The suite creates two Firebase users and resolves both through AUTH-002 into distinct RFxchange users stored in Firestore. It then seeds organizations, profiles, memberships, authorizations, and restrictions through the Admin emulator connection.

Required application scenarios:

| Scenario | Expected result |
| --- | --- |
| No authenticated context | `unauthenticated` |
| User B attempts User A membership | `wrong-user` |
| User A membership for Organization A used against Organization B | `wrong-organization` |
| Inactive membership | `membership-inactive` |
| Active membership restriction | `organization-access-restricted` |
| Active membership without requested permission | `missing-permission` |
| Verified/current User A + active Organization A membership + no restriction + permission | allowed |

The authorized case then reads the expected organization profile through the Admin Firestore connection, demonstrating that successful application authorization can precede a server-managed persistence operation.

Required Firestore Rules scenarios:

| Client | Operation | Expected result |
| --- | --- | --- |
| Unauthenticated browser | organization profile read | denied |
| Unauthenticated browser | organization profile write | denied |
| Authenticated browser | organization profile read | denied |
| Authenticated browser | organization profile write | denied |

The authenticated browser denial is intentional: authentication alone does not prove RFxchange membership, tenant context, permission, lifecycle state, or restriction state.

## Admin SDK boundary

Firebase Admin bypasses Firestore Security Rules. Therefore Rules do not protect server repositories from an over-privileged runtime identity.

Production controls remain:

- application authorization before every protected repository operation;
- least-privilege runtime IAM;
- no service-account private key in source;
- server-only Admin SDK composition;
- organization audit events for later protected vertical slices;
- CI coverage for the authorization matrix.

## Acceptance evidence

AUTH-005 is complete when CI proves:

- Auth and Firestore emulators start together;
- Firebase credentials become RFxchange identities only through AUTH-003/AUTH-002;
- no-auth, wrong-user, wrong-organization, inactive-membership, restriction, and missing-permission paths fail closed;
- the authorized server path succeeds and retrieves the intended organization profile;
- anonymous and authenticated direct client Firestore reads/writes are denied;
- static guardrails, architecture tests, TypeScript, lint, and production build remain green.

## Explicitly deferred

- direct browser Firestore access;
- custom claims or a dedicated Firebase-UID-to-RFxchange-user rules mapping;
- HTTP route handlers for protected organization operations;
- persisted authorization-attempt audit events;
- App Check enforcement;
- IAM deployment and staging acceptance;
- the first user-facing persisted authenticated vertical slice, owned by INF-009.
