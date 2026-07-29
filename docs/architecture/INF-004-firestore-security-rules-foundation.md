# INF-004 — Firestore Security Rules foundation

## Status

Foundation implemented for the RFxchange Firestore client security boundary.

## Decision

RFxchange Firestore persistence is currently **server managed**.

The concrete repositories introduced in INF-002 use the Firebase Admin SDK. Google documents that Firestore server client libraries bypass Cloud Firestore Security Rules and authenticate through Google credentials/IAM. Security Rules therefore cannot be treated as the authorization boundary for those server repository calls.

INF-004 closes the separate client/mobile/web Firestore boundary instead of opening it prematurely.

## Initial rules posture

`firestore.rules` is deny by default:

- every canonical INF-003 collection is explicitly matched;
- mutable collections deny all client reads and writes;
- append-only collections separately deny client update/delete and also keep read/create closed;
- a recursive catch-all denies every undeclared path;
- there is no broad `request.auth != null` allowance;
- there is no assumption that a Firebase Authentication UID is already the RFxchange `UserId`;
- there is no client administrator bypass.

This is deliberate. Authentication alone does not prove RFxchange organization membership, organization authority, active lifecycle state, restriction state, or granular permission.

## Why authenticated-only rules are not sufficient

The RFxchange domain requires a chain of authority:

```text
Firebase identity
→ RFxchange user identity
→ active organization membership
→ organization context
→ granular permission
→ lifecycle/restriction checks
→ permitted operation
```

AUTH-002 will define Firebase identity → RFxchange `UserIdentity` resolution. AUTH-003 will define the server-side authenticated session boundary. Until those mappings exist, a rule such as `request.auth != null` would create access based only on login state and would bypass the architecture already established in ARC-003 through ARC-008.

## Server authorization boundary

The Admin SDK is permitted to access Firestore through Google IAM, not Security Rules. Application services using the INF-002 repositories must continue enforcing the domain authorization chain before repository operations are invoked.

Production runtime identity must use least-privilege IAM. A service-account private key is not committed to the repository. In managed Google/Firebase runtime environments, Application Default Credentials are preferred.

## Append-only collections

The following canonical collections are append-only under INF-003 and INF-002:

- `organizationAuditEvents`
- `legalDocumentVersions`
- `legalAcknowledgements`
- `organizationAuthorityRepresentations`
- `platformChangeDirectives`
- `retentionPolicies`
- `retentionAssignments`
- `adminPermissionGrants`

The rules file explicitly denies client `update` and `delete` for these paths. INF-002 independently enforces append-only server persistence with Firestore `create()` semantics.

The dual protection is intentional: repository semantics govern trusted server writes; Security Rules close untrusted client writes.

## Configuration

`firebase.json` points the default Firestore database to `firestore.rules`.

INF-005 remains responsible for `firestore.indexes.json`. No speculative composite indexes are introduced by this slice.

## Validation

`npm run validate:firestore-security-rules` verifies that:

1. Firebase configuration references `firestore.rules`;
2. rules version 2 is enabled;
3. every canonical INF-003 collection has an explicit rule match;
4. append-only collections explicitly deny update/delete;
5. a recursive deny-all catch-all exists;
6. no unconditional allow rule is introduced;
7. the ruleset remains server-managed until the authentication/session slices are complete.

The validator is included in `npm run validate` and therefore in production CI.

## Emulator strategy

The Firestore emulator remains configured on port `8080` from INF-001.

INF-004 establishes the rules source and static architecture guardrails. AUTH-005 is responsible for the full Firebase Auth + Firestore emulator security suite, including authenticated identity, wrong-user, wrong-organization, inactive-membership, restriction, permission, and authorized-access cases.

A later client Firestore surface must not be enabled until emulator tests prove its query and authorization rules.

## Deliberately deferred

- Firebase Authentication provider integration — AUTH-001
- Firebase identity → RFxchange identity resolution — AUTH-002
- authenticated server session boundary — AUTH-003
- authentication lifecycle/security flows — AUTH-004
- Auth + Firestore emulator authorization suite — AUTH-005
- query-driven Firestore indexes — INF-005
- direct browser/mobile Firestore repository adapters
- production IAM deployment automation

## Acceptance result

INF-004 is complete when the repository contains a source-controlled, deny-by-default Firestore ruleset tied to all canonical collections, Firebase configuration points to it, append-only paths are protected, undeclared paths are denied, and CI prevents accidental broad client access before the identity/authorization model is implemented.
