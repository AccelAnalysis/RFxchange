# Wave 1 Slice 1.31 — ADM-068 Controlled user administration

## Requirement

> Support invite/resend, organization removal, suspension/restore, approved access reset, role transfer and permission assignment/revocation through explicit audited actions.

Acceptance:

> Each user-access action is permission-checked, scope-checked and logged with prior/new state.

## Sequencing correction

The seeded `ADM-068 → ADM-065` dependency is not architectural. `ADM-065` is the Wave 2 organization claims console; server-side user-access administration does not depend on that UI.

The canonical prerequisites are the already merged foundations for restriction states (`ARC-008`), scoped admin grants (`ADM-014`/`ADM-093`), membership/permission administration (`ADM-056`), orphan prevention (`ADM-069`), immutable admin audit (`ADM-085`), privileged re-authentication (`ADM-088`), and organization invitations (`ORG-021`).

Slice 1.30 became the merged ARC-010 + COM-038 commercial/provider boundary, so ADM-068 is numbered Slice 1.31 on the current `main` baseline.

## Server-side control

All nine ADM-068 actions require `user.access.manage` plus a matching `ORGANIZATION:<organizationId>` grant, or a legitimate GLOBAL grant. Grant expiry and condition keys are evaluated through the existing scoped/conditional admin authorization engine.

The nine explicit actions are:

1. invite;
2. resend invitation;
3. remove from organization;
4. suspend;
5. restore;
6. approved access reset;
7. role transfer;
8. permission assignment;
9. permission revocation.

No generic unrestricted user mutation endpoint is introduced.

## Invariants

- Invitation issuance reuses the organization-user invitation model; the platform administrator is recorded as the administrative actor while an authorized organization sponsor remains the invitation issuer under ORG-021 semantics.
- Resend renews a pending invitation rather than creating duplicates. Email transport remains behind the COMMS-001 provider boundary.
- Organization removal is controlled membership deactivation and reuses ADM-069 orphan prevention. An active user cannot be left without an active organization membership.
- Suspension/restoration reuse the ARC-008 membership restriction state machine; terminated access remains terminal.
- Approved access reset requires a distinct approval reference and restores authorization to an approved organization role bundle.
- Role transfer resolves an approved role bundle. Permission assignment/revocation accepts only catalogued organization permissions.
- Cross-tenant membership, authorization, invitation and restriction mutations fail closed.

## Audit and persistence

Every successful operation creates a sensitive `PlatformAdministrativeAuditEvent` with administrator, exercised permission, organization/user/object target, distinct action, prior state, new state, reason, and security/re-authentication context.

`ControlledUserAdministrationUnitOfWork` commits the controlled state mutation and immutable administrative audit event atomically. The Firestore implementation checks create/update expectations and duplicate audit IDs inside one transaction.

## Wave 1 tracker reconciliation

PR #61 already implemented `ARC-010` and `COM-038` on the merged production baseline. Its tracker update was intentionally deferred while concurrent work was landing. After ADM-068 itself passes the full production gate, the tracker-bearing closeout commit must mark all three implemented records with their evidence:

- `ARC-010` — PR #61;
- `COM-038` — PR #61;
- `ADM-068` — this Slice 1.31 PR.

That reconciliation closes Foundation at 64/64 while also recording the completed ARC-010 item in its Commercial-wave checklist; it does not claim the rest of the Commercial wave is complete.

## Deferred

This slice does not add the claims console, admin UI design, bulk user operations, identity-provider password reset, automatic suspension rules, or a new global user restriction model.

## Acceptance result

ADM-068 is complete when all nine actions are protected by named permission + exact scope, invalid state fails closed, organization attachment is preserved, prior/new state is audited, and the full production pipeline is green on the tracker-bearing head.
