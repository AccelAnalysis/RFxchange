# Wave 1 Slice 1.3 — Organization-scoped asset ownership

## Scope

This slice implements only:

- **ARC-009 — Organization-scoped asset ownership**

It builds on the organization tenant model from Slice 1.1 and the user/membership model from Slice 1.2.

## Governing rule

The organization is the owner and lifecycle boundary for organization-scoped platform assets.

Individual users may later create, edit, submit, review or administer those assets according to permissions and audit rules, but user action does not convert the asset into an individually owned record.

## Covered asset families

ARC-009 requires organization ownership for:

1. capabilities;
2. locations;
3. service areas;
4. RFxs;
5. responses;
6. referrals;
7. teams;
8. documents;
9. resources;
10. organization membership;
11. credibility.

The shared `OrganizationAssetKind` catalog names each required family explicitly so later feature implementations cannot silently omit the organization ownership boundary.

## Ownership contract

`OrganizationScoped` is the minimal shared tenant contract:

- every organization-scoped record carries `organizationId`;
- that ID is an `OrganizationId`, not a user ID or arbitrary string owner;
- ownership validation compares the asset's `organizationId` to the active `OrganizationAccount` tenant.

`OrganizationScopedAsset` adds a lightweight asset ID and asset-kind discriminator for cross-domain ownership references.

Feature-specific aggregates do not need to inherit a common runtime base class. TypeScript structural typing allows each future domain object to satisfy the ownership contract by carrying the required organization tenant ID while preserving its own model.

## Ownership creation rule

`createOrganizationAssetRef` accepts an established `OrganizationAccount` and derives `organizationId` from `organization.id`.

The caller does not supply a free-form owner ID. This follows the same tenant-derivation pattern used by organization profiles and organization membership.

## Cross-tenant protection

`assertOrganizationOwnsAsset` rejects an organization/asset combination when their organization IDs differ.

`belongsToOrganization` provides a non-throwing tenant predicate for later filtering and authorization layers.

This slice establishes ownership identity only. Permission to act on an owned asset remains a separate concern.

## Existing membership alignment

`OrganizationMembership` from Slice 1.2 already carries `organizationId` derived from `OrganizationAccount`.

It therefore structurally satisfies the `OrganizationScoped` contract without changing the membership model or introducing roles/permissions.

## Persistence boundary

`OrganizationScopedRepository<TAsset>` requires tenant-scoped listing through `listByOrganizationId`.

`OrganizationAssetOwnershipRepository` provides an optional lightweight cross-domain ownership index for cases where later authorization, auditing or administration needs to resolve asset ownership without loading a full feature aggregate.

Concrete storage technology and feature-specific repositories remain deferred.

## Acceptance evidence

ARC-009 is satisfied in this slice when:

- every required asset family appears in the organization-owned asset catalog;
- organization ownership is represented by `OrganizationId`;
- new ownership references derive the tenant ID from an existing `OrganizationAccount`;
- cross-tenant ownership assertions fail;
- organization-scoped repositories expose tenant-based lookup;
- existing `OrganizationMembership` remains organization-scoped;
- the shared ownership contract contains no individual-user ownership field.

Behavioral tests cover the full asset-family catalog, ownership derivation, cross-tenant rejection, membership compatibility and invalid asset identifiers/kinds.

## Explicitly deferred

This slice does **not** implement:

- organization role or granular permission enforcement — ARC-005;
- per-user action attribution/audit history — ARC-006;
- onboarding/access lifecycle — ARC-007;
- restriction/suspension states — ARC-008;
- organization billing/membership plan state — ARC-010;
- capability records themselves;
- location or service-area domain models;
- RFx creation, responses or evaluation;
- referral workflows;
- teaming workflows;
- document storage/upload behavior;
- resource-provider feature models;
- credibility badges, scoring or endorsement behavior;
- database tables or storage adapters;
- admin UI or end-user UI.

Those remain later slices. Slice 1.3 defines the organization ownership rule they must obey when implemented.
