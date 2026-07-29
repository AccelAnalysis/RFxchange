# Wave 1 Slice 1.5 — Per-user organization audit history

## Scope

This slice implements only:

- **ARC-006 — Per-user audit history**

It builds on the organization tenant model, organization membership boundary, organization-scoped asset ownership and capability-based authorization established in Slices 1.1–1.4.

## Governing rule

Organization-level activity belongs to the organization tenant, while every normal user-originated action must retain the exact individual and organization membership through which the action occurred.

The audit model therefore separates **activity ownership/context** from **human actor attribution**:

- `organizationId` identifies the organization whose activity history contains the event;
- `actor.userId` identifies the individual who acted;
- `actor.membershipId` identifies the exact organization membership used for that action.

A user does not become the owner of the organization activity merely because the action is attributed to that user.

## Audit event

`OrganizationActionAuditEvent` is an immutable event record containing:

- a stable audit event ID;
- organization tenant ID;
- exact user ID;
- exact membership ID;
- normalized action identifier;
- optional organization-owned asset target;
- occurrence timestamp.

Action identifiers are lowercase dot-delimited names such as `rfx.published` or `organization.profile-updated`. This keeps event names stable and machine-readable without prematurely defining the complete future activity catalog.

## Attribution creation rule

`createOrganizationActionAuditEvent` receives the established `UserIdentity`, `OrganizationMembership` and `OrganizationAccount` rather than accepting free-form actor or tenant identifiers.

Before creating an event it verifies:

1. the membership is active;
2. the membership belongs to the supplied user;
3. the membership belongs to the supplied organization;
4. any supplied organization-scoped asset target belongs to that same organization.

This prevents a caller from attributing an organization action to the wrong user, wrong membership or wrong tenant.

## Asset target attribution

An event may optionally reference an `OrganizationScopedAsset` from Slice 1.3.

The persisted audit target retains only the asset ID and asset-kind discriminator. The event's `organizationId` remains the organization ownership context, and cross-tenant target references are rejected.

This supports future audit history for RFxs, responses, referrals, teams, documents, credibility and other organization-scoped records without implementing those workflows in this slice.

## Append-only persistence boundary

`OrganizationAuditRepository` exposes `append` rather than mutable CRUD semantics.

History is queryable by:

- organization;
- acting user;
- acting membership;
- event ID.

The repository contract intentionally contains no update or delete operation for existing audit events.

This is the baseline event-history invariant for ARC-006. Stronger administrator audit immutability, correction procedures and retention controls remain dedicated later features.

## Acceptance evidence

ARC-006 is satisfied in this slice when:

- organization activity events always retain `organizationId`;
- each normal user-originated event retains both `userId` and `membershipId`;
- inactive memberships cannot originate a normal attributed user action;
- another user's membership cannot be used to attribute an action;
- a membership from another organization cannot be used for the event;
- a target asset from another organization cannot be attached to the event;
- audit persistence is append-only at the domain port;
- history can be queried by organization and actor attribution;
- events are immutable once constructed.

Behavioral tests cover successful attribution, organization-owned asset targets, cross-user rejection, inactive-membership rejection, cross-tenant rejection and invalid event identifiers/actions/timestamps.

## Explicitly deferred

This slice does **not** implement:

- administrator-specific immutable audit-log policy — ADM-085;
- audit correction/addendum workflow — ADM-086;
- versioned configuration-change records — ADM-084;
- retention classification and deletion policy — ADM-010;
- IP address, device, user-agent or request/session telemetry;
- before/after state snapshots;
- permission or role snapshots inside each audit event;
- system/service actors or automated-job attribution;
- cryptographic chaining, signing or external tamper evidence;
- audit export/reporting UI;
- organization activity-feed UI;
- onboarding/access lifecycle states — ARC-007;
- restriction/suspension states — ARC-008;
- concrete RFx, referral, teaming, document or credibility workflows.

Those remain separate slices. Slice 1.5 establishes only the per-user attribution and append-only organization activity-history foundation required by ARC-006.
