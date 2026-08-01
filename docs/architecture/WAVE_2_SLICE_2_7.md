# Wave 2 Slice 2.7 — Essential organization profile

## Amended scope

This slice enriches the durable organization profile with the minimum identity/contact, explicit website disposition, meaningful categorized capability, confirmed location, location visibility, and service geography required for useful participation.

Organization type, participation roles, and business objectives are retained only as optional legacy/enrichment metadata. They are not collected during activation and are not Profile Complete dependencies.

## One durable profile identity

The existing `OrganizationProfile.id` and `organizationProfiles` document remain canonical. Essential registration updates that same organization-owned record.

The activation context persists a reusable organization identity seed containing website disposition, normalized website URL, and phone. The authenticated user identity supplies the default contact name and email. The profile step consumes those authoritative values rather than asking the participant to re-enter them.

## Meaningful categorized capabilities

A capability carries a stable ID, a bounded kind, a controlled category, an optional custom Other category, a specific name, and a plain-language description.

The activation taxonomy is intentionally broad enough for discovery but does not replace later products/services or NAICS enrichment. Generic capability names remain invalid.

Buying needs are modeled in opportunities/RFx. Resource-provider functions are modeled in the separate Official Resource Provider application.

## Universal opportunity participation

Every activated organization can both issue and respond to opportunities. Buyer, Supplier, and Issuer are contextual positions within a transaction, not permanent onboarding labels. Organization authorization still controls which users may act for the organization.

Official Resource Provider remains a separately approved platform status and cannot be asserted through an organization profile field.

## Profile Complete derivation

`OrganizationProfileCompletion` is active only when all authoritative requirements are present:

1. minimum durable identity;
2. website disposition;
3. main organization contact;
4. at least one meaningful categorized capability;
5. service geography;
6. valid location visibility; and
7. confirmed primary location.

No organization type, participation role, business objective, commercial state, Founding status, provider status, or Verification state may satisfy or block this gate.

## Public projection and compatibility

Public projection may continue to expose previously persisted optional type/role/objective metadata where another surface deliberately uses it, but public profile projection no longer requires organization type.

Hydration tolerates legacy capabilities without category metadata by mapping them into a reviewable Other category. New writes require the controlled category contract.

## UI

The activation profile step:

- displays carried-forward organization name, website disposition, phone, and authenticated contact;
- asks for the contact's organization role/title;
- asks for service/product/function kind;
- requires a controlled capability category;
- conditionally requires an Other category;
- requires a specific capability name and description; and
- contains no participation-role or business-objective sections.

## Validation

Tests and validation must prove:

- the obsolete `organization-type` and `participation-role` completion requirements are absent;
- activation does not render or submit roles/objectives;
- capability category and Other validation are server-authoritative;
- carried-forward website/contact data reaches the durable profile;
- legacy metadata hydration remains safe; and
- marker activation continues to depend on the amended Profile Complete record.
