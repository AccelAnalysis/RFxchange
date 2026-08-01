# RFxchange Organization Model

## Organization is the market entity

RFxchange credibility, capability, opportunities, referrals, teaming relationships, profile visibility and commercial state attach to the organization where appropriate. Individual users have credentials, security state, organization memberships, permissions and audit history.

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

During onboarding, use provisional organization name plus geography, website/domain, phone, seeded records and existing RFxchange organizations to find likely matches.

Entity-resolution signals may include legal/common/alternate names, address, domain, phone, government identifiers, geography and existing claims.

Carry provisional onboarding data forward rather than requiring duplicate entry. Website disposition, normalized URL and phone are resumable activation seed data until they are written into the durable organization profile.

## Seeded/unclaimed records

A seeded organization may be publicly discoverable as an unclaimed record with appropriate public data and a **Claim this organization** action. Seeded data is not proof that the current user controls the organization.

## Claim existing or create new

A user may select an existing likely match and enter the authority path, or create a new organization when no appropriate match exists.

## Organizational authority

Authority means the user may manage the organization. It may be established using business-domain email, invitation, administrative review, organization documents, authoritative records or another approved claim process.

Authority is not Organization Verification and does not create Official Resource Provider status.

## Organization location

Primary location, mailing address, public display preference and service geography are separate concepts. Geocoded location must be confirmable by the organization and retain a controlled relationship to canonical geography.

## Minimum organization identity

Essential activation identity includes organization name, website disposition, main organization contact, confirmed location/visibility and service geography. The profile requires at least one meaningful categorized capability before Profile Complete.

Organization type is optional enrichment and is not an activation requirement.

## Universal opportunity participation

Every activated organization is eligible to act as an opportunity issuer or responder within authorized workflows. Buyer, Supplier, and Issuer are transaction-context positions, not permanent organization classifications.

User permissions and organization authority still control who may publish, submit, evaluate or otherwise act for the organization.

## Optional descriptive classifications

Previously persisted organization roles or objectives may remain as optional compatibility/enrichment metadata, but they do not grant authority, route core product access, award credibility, or block Profile Complete.

## Official Resource Provider status

Resource Provider is not a self-selected organization role. An organization applies after activation through a separate governed process. The application captures the provider category and evidence needed for administrative verification. Approval creates Official Resource Provider status, not Organization Verified or paid status.

## Profile Complete

Profile Complete is derived from required identity, website disposition, contact, meaningful categorized capability, service geography, visibility and confirmed location. It must be recalculated if required fields become invalid or incomplete.
