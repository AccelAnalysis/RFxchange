# Wave 1 Slice 1.20 — ADM-057 + ADM-067 + ADM-069

## Scope

This slice implements:

- `ADM-057` — Administrative portal information architecture
- `ADM-067` — User & Access 360 console foundation
- `ADM-069` — Administrative orphan-user prevention

It is the first presentation/application slice on top of the administrator authority, privileged-security, privacy and audit foundations from Slices 1.10–1.19.

## Permission-aware administrative information architecture

`ADMIN_PORTAL_SECTIONS` is the canonical 19-domain left-navigation registry:

1. Overview
2. Work Queues
3. Organizations
4. Users & Access
5. Claims & Verification
6. RFx & Opportunities
7. Referrals & Teaming
8. Resource Providers
9. Credibility
10. Trust & Safety
11. Geographies
12. Institutions & Partners
13. Commerce
14. Support & Feedback
15. Communications
16. Analytics
17. Policies & Configuration
18. Integrations & System
19. Audit & Security

Every section has one or more existing named permissions that control visibility. `visibleAdminPortalSections` removes sections for which the administrator has no qualifying capability, and `assertAdminPortalSectionAccess` supplies the corresponding server/application guard so hiding a navigation item is not treated as authorization.

`AdminPortalNavigation` and `AdminPortalShell` render the resolved registry. They accept an already-resolved authority context and contain no provider or role-name authorization logic.

## User & Access 360

`buildUserAccess360` requires both `user.profile.read` and `user.access.read` before constructing the projection.

The projection consolidates:

- identity and primary email;
- authentication provider/subject and MFA state;
- last login and credential version;
- organization memberships and organization names;
- organization role and granular organization permissions;
- platform administrator role, explicit additions/removals and scope limits when applicable;
- security events;
- invitations;
- restrictions;
- accepted/acknowledged Terms, Rules and Privacy versions;
- recent actions.

`UserAccess360` renders the projection without acquiring additional data or permissions in the presentation layer.

Sensitive evidence remains governed by ADM-090. User & Access 360 does not implicitly include verification evidence, payment metadata, private RFx evidence, complaint evidence or private organization documents.

## Administrative membership repair

A new catalogued capability, `user.access.manage`, governs organization-membership repair operations. It is included by default in the broad Platform Administrator and Member Success & Support Administrator presets, while Analyst / Auditor remains read-only.

`planAdministrativeMembershipDeactivation` reuses the canonical organization-attachment resolver before any mutation is accepted.

If another active membership remains, the operation can produce an inactive membership state.

If the target is the user's final active membership, the operation does **not** return a safe deactivation. It returns `route-to-account-resolution`, and `assertAdministrativeMembershipDeactivationSafe` refuses execution. This preserves the product invariant that a normal usable RFxchange user cannot be left unattached from every organization.

A future account-resolution workflow may explicitly transition the user to a non-usable/account-resolution state and then complete final membership removal. This slice does not invent that persistence state prematurely.

## Security boundary

The shell/component layer never authorizes feature actions itself:

- navigation visibility is derived from named permissions;
- section access has an explicit guard;
- User 360 has explicit read checks;
- membership repair has an explicit write capability;
- ADM-090 minimum-data permissions remain separate;
- ADM-085 remains the canonical audit requirement for materialized administrative command services.

The components are intentionally route-agnostic until a server route composes the authenticated administrator authority context; this prevents exposing a public `/admin` route with placeholder or client-trusted authority.

## Acceptance

The slice is complete only when tests prove:

1. all 19 specified administrative domains exist in one canonical navigation registry;
2. Super Admin can resolve all domains;
3. narrower administrators see only authorized domains and the access guard rejects hidden sections;
4. User & Access 360 requires both profile and access visibility;
5. the projection contains identity, authentication, memberships/roles, platform role, permissions, security events, invitations, restrictions, policy versions and recent actions;
6. `user.access.manage` is distinct from read-only access and is not granted to Analyst / Auditor;
7. membership repair can deactivate one membership when another active membership remains;
8. final active membership removal is routed to account resolution and cannot be executed as a normal deactivation;
9. technical administrators cannot execute user membership repair;
10. the full production CI suite remains green.
