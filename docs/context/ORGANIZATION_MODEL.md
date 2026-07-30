# RFxchange Organization Model

## Organization is the market entity

RFxchange credibility, capability, opportunities, referrals, teaming relationships, profile visibility and commercial state attach to the organization where appropriate. Individual users have their own credentials, security state, organization memberships, permissions and audit history.

## Account hierarchy

```text
Organization Account
  → Organization Profile
  → Organization Memberships
      → User identity
      → role preset(s)
      → explicit permissions
      → scope / conditions
```

Do not model the first user as a standalone business identity.

## Organization resolution

During onboarding, use the provisional organization name plus geography, seeded records and existing RFxchange organizations to find likely matches.

Entity-resolution signals may include:
- legal/common/alternate names
- address
- domain
- phone
- government identifiers
- geography
- existing claims

The goal is to avoid duplicate market entities such as `Example Co` and `Example Co LLC` when they represent the same organization.

## Seeded/unclaimed records

A seeded organization may be publicly discoverable as an unclaimed record with appropriate public data, geography/category context and a **Claim this organization** action.

Seeded data is not proof that the current user controls the organization, and seeded data should remain distinguishable from business-confirmed or verified data.

## Claim existing or create new

A user may:
- select an existing likely match and enter the claim/authority path, or
- create a new organization when no appropriate match exists.

Carry provisional onboarding data forward rather than requiring duplicate entry.

## Organizational authority

Authority means the user is allowed to manage the organization. It may be established using:
- business-domain email,
- invitation from an existing authorized administrator,
- administrative review,
- organization documents,
- authoritative records,
- or another approved claim process.

Authority is not Organization Verification and does not itself prove every organization claim.

## Claim conflicts

Conflicting claims must preserve organization history. Do not resolve a dispute by silently replacing the controlling user or destructively merging/deleting records.

The platform should support evidence request, existing-admin notification where applicable, administrative comparison/decision, membership assignment/rejection and durable audit evidence.

## Organization location

Primary location, mailing address, public display preference and service geography are separate fields/concepts. Geocoded location must be confirmable by the organization and retain a controlled relationship to canonical geography.

## Minimum organization identity

Essential activation identity includes the organization name/type and applicable contact/location information. The profile then requires at least one meaningful capability/function before Profile Complete.

## Organization roles

An organization may hold multiple roles, including business, supplier, buyer, opportunity issuer, government, EDO, resource provider, chamber/association, lender, university, nonprofit or other supported categories.

Organization roles influence experiences and later authority requirements; they must not be collapsed into one exclusive organization type when the organization legitimately performs several functions.

## Objectives

Business objectives are explicit organization/user onboarding preferences used to select the first-value path. Examples include finding/issuing opportunities, finding customers/suppliers/teammates, receiving/making referrals, finding/providing resources and exploring the network.

## Profile Complete

Profile Complete is derived from the required identity/contact, capability, geography, visibility and role fields. It must be recalculated if required fields become invalid or incomplete.
