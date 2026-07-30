# Wave 2 Slice 2.7 — Essential organization profile

## Scope

This slice implements `ORG-007`, `ORG-008`, `ORG-010`, `ORG-011`, and `ORG-012`. It enriches the
durable organization profile with the minimum identity, contact, meaningful capability,
participation roles, and business objectives needed for useful network participation. It derives
the automatic Active `Profile Complete` credential from those fields plus the merged Slice 2.6
location, visibility, and service-geography contracts.

Detailed enrichment, Organization Verification, privileged buyer/issuer/provider authority,
commercial entitlement, final marker activation, Organization 360, and OPEN access remain outside
this slice.

## One durable profile identity

The existing `OrganizationProfile.id` and `organizationProfiles` document remain canonical.
`EssentialOrganizationProfile` enriches that same record and preserves its organization ownership,
creation time, and stable profile identity. This slice does not create a second profile record or
derive organization identity from the acting user's personal profile.

The essential profile adds:

- a bounded organization-type vocabulary;
- an explicit available/not-applicable website disposition;
- a structured organization contact with an independent public-visibility choice;
- up to 20 structured capabilities;
- the approved 12-value multi-role vocabulary; and
- the approved eight-value business-objective vocabulary.

## Meaningful capabilities

A capability carries a stable ID, a service/product/function/buying/resource-provider kind, a
specific name, and a bounded plain-language description. Empty category shells and generic names
such as “business services,” “services,” “solutions,” and “other” are rejected. This structure is
ready for later capability discovery and matching without making the future products/services or
NAICS taxonomies part of Slice 2.7.

## Roles and objectives

Participation roles are descriptive routing state and may be multi-select. Selecting Buyer,
Issuer, Resource Provider, or another role does not write organization authorization records,
administrative permissions, Verification, or approved entitlements.

Business objectives are explicit personalization inputs. They do not modify credibility,
Verification, commercial state, or neutral eligibility. Their stable vocabulary is ready for the
later `EDU-009` first-value pathway.

## Profile Complete derivation

`OrganizationProfileCompletion` is a current derived singleton whose stable ID equals the
organization ID. It belongs to the Active credential family and uses the key `profile-complete`.
It becomes active only when all authoritative requirements are present:

1. minimum identity;
2. organization type;
3. explicit website disposition;
4. main organization contact;
5. at least one meaningful capability;
6. at least one canonical service geography;
7. at least one participation role;
8. a valid Slice 2.6 location visibility level; and
9. a confirmed primary location.

The evaluator accepts no commercial, founding, provider, Verification, or membership-plan input,
so none can satisfy or bypass the gate. Business objectives are required by `ORG-011` for routing
but are intentionally not part of the canonical corrected `ORG-012` dependency set.

The application service recalculates completion on essential-profile updates and exposes an
explicit authoritative recalculation path for changes to location or service geography. Removing
or invalidating a requirement changes the current state back to inactive. The current record keeps
the first activation time, while append-only events retain each prior/new status transition.

## Authorization and public privacy

Profile mutation and recalculation use the merged organization authorization service and require
`organization.profile.manage` on the exact active organization membership. Cross-user and
cross-organization mutations fail closed.

Public projection is separate from private profile state. It:

- uses the Slice 2.6 exact/approximate/locality-only public location projection;
- never exposes a private main contact;
- never exposes a mailing address;
- exposes only bounded structured profile fields; and
- represents Profile Complete independently from Verification and commercial facts.

## Persistence and history

The enriched profile is written back to its existing `organizationProfiles` document.
Two server-managed collections are added:

- `organizationProfileCompletions` — one current derived completion record per organization; and
- `organizationProfileEvents` — append-only update and recalculation evidence.

One Firestore transaction checks the current durable profile version, updates the profile, writes
the derived completion record, appends the profile event, and appends the organization audit event.
Direct browser access to the existing profile and both new collections remains denied.

## UI

`/organization-profile` is a progressive four-stage workflow: identity, capability, network
intent, and completion. The controlled Portsmouth map remains the spatial context and presents the
confirmed private-admin location as a coordinate-anchored diamond, explicitly not the activated
network marker.

The workflow explains capability specificity, contact privacy, multi-role semantics, objective
personalization, and each automatic completion dependency. Profile Complete is presented as a
derived milestone, not a checkbox, score, gamified purchase, or upsell.

## Validation

Unit and architecture tests cover:

- the exact role and objective vocabularies;
- structured identity/contact/website normalization;
- rejection of generic or malformed capabilities;
- the complete nine-requirement gate and every missing-source category;
- prevention of commercial/founder/provider/Verification bypass;
- deactivation and preserved activation history after a requirement is removed;
- public contact and Slice 2.6 location leakage boundaries;
- organization authorization and cross-organization denial;
- persistence to the existing profile identity, atomic completion/history/audit writes, and
  direct-client denial in the Firestore emulator; and
- accessible progressive desktop/mobile interaction and responsive map context.
