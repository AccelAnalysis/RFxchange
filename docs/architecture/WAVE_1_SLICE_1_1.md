# Wave 1 — Slice 1.1: Organization Tenant Model

Tracker scope: `ARC-001` and `ARC-002` only.

## Purpose

Establish the organization as the durable tenant and operating context before user membership, permissions, lifecycle, geography, commercial state, or transactional assets are implemented.

## ARC-001 — Organization-centered tenant architecture

**Acceptance rule:** The organization is the primary account/tenant and operating context. Individuals will act only as authorized users beneath organizations.

Implementation contract:

- `OrganizationAccount` is the tenant root.
- `OrganizationId` is the stable tenant identifier.
- No individual user identity is modeled as a tenant.
- Future user access must resolve to an organization context rather than own organization-level state directly.
- User membership, identity, and permissions are intentionally deferred to later Wave 1 slices.

## ARC-002 — Separate Organization Account and Organization Profile

**Acceptance rule:** The administrative/security tenant remains separate from the network profile and the two are explicitly linked.

Implementation contract:

- `OrganizationAccount` owns the administrative/security tenant identity.
- `OrganizationProfile` is a separate network-facing record.
- `OrganizationProfile` has its own `OrganizationProfileId`.
- Every profile stores `organizationId`, linking it to exactly one organization tenant.
- `createOrganizationProfile` requires an existing `OrganizationAccount`, preventing the normal creation path from producing an unattached profile.
- `linkOrganizationAccountAndProfile` rejects cross-tenant account/profile combinations.
- Account and profile persistence use separate repository ports.

## Current data shape

```text
OrganizationAccount
  id: OrganizationId  <------------------+
  createdAt                               |
  updatedAt                               |
                                          |
OrganizationProfile                       |
  id: OrganizationProfileId              |
  organizationId: OrganizationId --------+
  displayName
  createdAt
  updatedAt
```

The profile contains the first network-facing field (`displayName`). Future profile capabilities, locations, service areas, and credibility presentation belong on profile/network models rather than the administrative tenant object.

## Invariants

1. Empty organization IDs are rejected.
2. Empty profile IDs are rejected.
3. Empty display names are rejected.
4. Timestamps must parse as date-time values and are normalized to ISO UTC strings.
5. A profile created through the domain factory inherits its organization ID from the supplied account.
6. An account and profile with different organization IDs cannot form an `OrganizationContext`.
7. Account and profile storage interfaces remain separate.

## Explicitly deferred

This slice does **not** implement:

- `ARC-003` organizational membership requirement;
- `ARC-004` individual user credentials/security;
- `ARC-005` organization roles or granular permissions;
- `ARC-006` audit history;
- `ARC-007` onboarding/access states;
- `ARC-008` restriction states;
- `ARC-009` organization-scoped transactional asset ownership;
- `ARC-010` billing/membership state;
- authentication providers;
- signup/onboarding UI;
- database/vendor-specific adapters;
- geography, maps, claims, RFx, referrals, teaming, credibility, or billing.

## Persistence boundary

Wave 1 has not yet selected or introduced a database adapter in this slice. The repository ports define the required persistence boundary without coupling the domain model to a vendor prematurely. Any future adapter must preserve:

- `OrganizationAccount` as the tenant root;
- distinct account/profile records;
- a profile-to-account organization ID link;
- one organization context as the owner of later organization-level activity.

## Verification

`npm run validate:architecture` verifies the source-level tenancy guardrails. The repository TypeScript check validates the exported domain contract.
