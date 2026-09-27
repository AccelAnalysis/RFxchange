# Wave 1 Slice 1.22 — Organization User Invitations and Standard Role Presets

Feature IDs: `ORG-021`, `ORG-022`

## Purpose

Establish the organization-side multi-user access foundation required by the RFxchange user journey. A person joins an existing organization through an attributed invitation; the flow never creates a second organization record and never shares another user's credentials.

## ORG-022 — Standard organization role presets

The baseline preset catalog contains exactly:

1. Primary Administrator
2. Administrator
3. Opportunity Manager
4. Responder
5. Evaluator
6. Referral Manager
7. Finance / Billing
8. Viewer

Presets are mappings to capability permissions, not authorization by title. `Primary Administrator` maps to the complete current organization permission catalog. `Viewer` grants no management capabilities; read-only organization visibility is supplied by active membership rather than a write-capability grant.

These are the baseline product presets. Slice 1.23 / ADM-055 will introduce the configurable organization role-bundle catalog without changing the permission-first authorization model.

## ORG-021 — Invitation lifecycle

An invitation records:

- stable invitation ID;
- organization ID;
- normalized invited email;
- exact inviting user and membership;
- selected role preset key;
- permission snapshot derived from that preset;
- pending/accepted/revoked state;
- creation and expiry times;
- accepting user identity when accepted.

Invitation issuance requires both `organization.users.manage` and `organization.permissions.manage`. No role-name shortcut is used.

The default invitation lifetime is seven days. A caller may provide an explicit earlier/later expiry where product policy permits; expiry must always be after creation.

## Acceptance lifecycle

The invited person first has an individual authenticated RFxchange user identity. Acceptance then:

1. verifies invitation organization and signed-in email;
2. rejects non-pending or expired invitations;
3. rejects an existing membership in the same organization;
4. creates one organization membership for the authenticated user;
5. creates the membership authorization from the invitation's role/capability snapshot;
6. creates the user's individual acknowledgements for the current Terms of Service, Platform Rules and Privacy Policy;
7. marks the invitation accepted by that exact user.

The Firestore acceptance unit of work commits the accepted invitation, membership, authorization, and all legal acknowledgements in one transaction. Partial acceptance must not leave a usable membership without the corresponding role/permission assignment and legal evidence.

## Storage and security

- `organizationUserInvitations` is an organization-scoped mutable Firestore collection.
- Invitation records contain access-sensitive email and role/permission information and remain server managed.
- Direct authenticated and anonymous Firestore clients receive no invitation access under the default-deny rules foundation.
- Domain and application contracts contain no Firebase SDK types.
- Firebase Admin/Firestore is isolated to the infrastructure adapter.

## Non-goals

This slice does not yet provide:

- configurable organization role bundles (ADM-055);
- platform-admin repair/edit tools for organization memberships and permission bundles (ADM-056);
- seat/billing entitlement enforcement;
- invitation email delivery/transactional communications;
- a final production UI for the organization member-management screen.

Those capabilities build on this foundation in later slices.
