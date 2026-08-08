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

## Seeded and unclaimed records

A seeded organization may be publicly discoverable as an unclaimed record with appropriate public data and a **Claim this organization** action. Seeded data is not proof that the current user controls the organization.

## Claim existing or create new

A user may select an existing likely match and enter the authority path, or create a new organization when no appropriate match exists.

## Organizational authority

Authority means the user may manage the organization. It may be established using business-domain email, invitation, administrative review, organization documents, authoritative records or another approved claim process.

Authority is not Organization Verification and does not create Official Resource Provider status.

## Organization location

Primary location, mailing address, public display preference and service geography are separate concepts. Geocoded location must be confirmable by the organization and retain a controlled relationship to canonical geography.

## Minimum organization identity

Essential activation identity includes organization name, website disposition, main organization contact, confirmed location/visibility and service geography. The profile requires at least one meaningful categorized capability before Profile Complete under the current activation contract.

Organization type is optional enrichment and is not an activation requirement.

## Universal opportunity participation

Every activated organization is eligible to act as an opportunity issuer or responder within authorized workflows. Buyer, Supplier and Issuer are transaction-context positions, not permanent organization classifications.

User permissions and organization authority still control who may publish, submit, evaluate or otherwise act for the organization.

## Optional descriptive classifications

Previously persisted organization roles or objectives may remain as optional compatibility/enrichment metadata, but they do not grant authority, route core product access, award credibility or block Profile Complete.

## AMACS-backed capability enrichment

Slice 3.3 will enrich the existing organization profile with organization-owned, AMACS 0.5.0-backed capability assertions. It must not create a second seller, supplier, responder or market-profile identity.

The organization may begin in ordinary language or use manual Domain → Family → Capability browse/search.

```text
Organization-authored description or approved source
→ non-authoritative InterpretationRecord
→ source-grounded InterpretationCandidate records
→ authorized user accepts, edits, rejects or leaves unresolved
→ separate server-authorized write
→ OrganizationCapabilityClaim
```

The following are distinct:

1. the AMACS capability concept exists;
2. an interpretation candidate is suggested;
3. the organization self-reports the capability;
4. the organization submits supporting evidence;
5. the evidence or capability is independently verified.

Do not collapse these into one status, badge, seal or match fact.

## Organization capability assertions

A confirmed organization capability assertion references the applicable AMACS release and label snapshot and may include:

- capability ID;
- organization/entity scope;
- market roles;
- RFx delivery-role interests;
- service geography;
- specialties;
- structured capacity where appropriate;
- evidence references;
- assertion status; and
- public/network/private visibility.

Market role describes how the organization participates in the market. RFx delivery role describes how it may participate in a particular response team. They are not interchangeable.

An accepted interpretation candidate is not the assertion itself. A separate authorized command revalidates current user, organization, release and catalog authority before creating or changing the assertion.

## Source and evidence boundaries

Organization websites, capability statements, documents, external classifications, project descriptions and prior responses may be used as suggestion sources only with appropriate authority and minimization. They do not automatically create a capability assertion or establish verification.

NAICS and industry metadata remain descriptive/filter context. They are not proof that an organization can perform a capability.

Past performance remains organization-authored or evidence-linked context until the applicable confirmation or verification process occurs.

Rejected, unresolved or withdrawn interpretation candidates cannot influence authoritative discovery, matching, public profile projection or credibility.

## Official Resource Provider status

Resource Provider is not a self-selected organization role. An organization applies after activation through a separate governed process. The application captures the provider category and evidence needed for administrative verification. Approval creates Official Resource Provider status, not Organization Verified or paid status.

A provider's office location, service territory, eligibility, intake and capacity remain separate. Provider visibility or contextual routing does not guarantee service acceptance.

## Profile Complete versus market enrichment

Profile Complete is derived from required activation identity, website disposition, contact, meaningful categorized capability, service geography, visibility and confirmed location. It must be recalculated if required fields become invalid or incomplete.

Market enrichment adds deeper AMACS-backed capability, industry/NAICS, past-performance, preference, credential, media and location context through later authorized slices. It does not retroactively convert activation data into verified evidence.

## AI and manual availability

The organization must be able to complete supported capability enrichment when AI assistance is unavailable, disabled, declined, rate-limited or over budget. The manual path uses the same canonical AMACS release and creates the same type of confirmed organization capability assertion.

Provider/model/prompt/token/cost information belongs to private RFxchange interpretation provenance, not the public organization profile or AMACS capability assertion.
